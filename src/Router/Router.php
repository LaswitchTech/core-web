<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router;

/**
 * HTTP method-aware router with path parameter matching.
 * Documentation: docs/development/architecture/Router/Router.md
 */
final class Router
{
    /** @var array<string, RoutingEntry[]> Routes grouped by method (indexed). */
    private array $getRoutes      = [];
    private array $postRoutes     = [];
    private array $putRoutes      = [];
    private array $deleteRoutes   = [];
    private array $patchRoutes    = [];

    /** @var array<string, string[]> All registered paths → methods (for 405 detection). */
    private array $methodMap = [];

    /** HTTP methods to check when scanning for method-not-allowed. */
    private const ALL_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    /* ─── Public API — route registration ───────────────────────────── */

    /** Register a GET route: /users/{id} → callable(Request): Response. */
    public function get(string $uri, callable $handler): self {
        return $this->add('GET', $uri, $handler);
    }

    /** Register a POST route. */
    public function post(string $uri, callable $handler): self {
        return $this->add('POST', $uri, $handler);
    }

    /** Register a PUT route. */
    public function put(string $uri, callable $handler): self {
        return $this->add('PUT', $uri, $handler);
    }

    /** Register a DELETE route. */
    public function delete(string $uri, callable $handler): self {
        return $this->add('DELETE', $uri, $handler);
    }

    /** Register a PATCH route. */
    public function patch(string $uri, callable $handler): self {
        return $this->add('PATCH', $uri, $handler);
    }

    /**
     * Route any HTTP method to the same handler (shortcut for add()).
     */
    public function any(string $uri, callable $handler): self {
        $methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        foreach ($methods as $m) {
            $this->add($m, $uri, $handler);
        }
        return $this;
    }

    /* ─── Internal route storage ────────────────────────────────────── */

    /**
     * Register a route for a specific HTTP method.
     *
     * Normalises the URI (leading slash) and stores it in the proper bucket.
     */
    public function add(string $method, string $uri, callable $handler): self
    {
        // Normalise: ensure single leading slash, strip trailing slash.
        $path = rtrim('/' . ltrim($uri, '/'), '/') ?: '/';

        $entry  = new RoutingEntry(path: $path, handler: $handler);
        $method = strtoupper($method);

        match ($method) {
            'GET'     => $this->getRoutes[]     = $entry,
            'POST'    => $this->postRoutes[]    = $entry,
            'PUT'     => $this->putRoutes[]     = $entry,
            'DELETE'  => $this->deleteRoutes[]  = $entry,
            'PATCH'   => $this->patchRoutes[]   = $entry,
            default   => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };

        // Track which methods are allowed for this path (for 405 handling).
        $this->methodMap[$path][] = $method;

        return $this;
    }

    /* ─── Internal route access ────────────────────────────────────── */

    /**
     * Return all routes registered for a given HTTP method.
     */
    private function getMethodRoutes(string $method): array
    {
        return match ($method) {
            'GET'     => $this->getRoutes,
            'POST'    => $this->postRoutes,
            'PUT'     => $this->putRoutes,
            'DELETE'  => $this->deleteRoutes,
            'PATCH'   => $this->patchRoutes,
            default   => [],
        };
    }

    /* ─── Dispatch — entry point ───────────────────────────────────── */

    /**
     * Match a Request to the best route, extract path parameters, call handler.
     *
     * Returns:
     *   • Response from matching route handler        (2xx)
     *   • 405 if path exists but wrong method         (405)
     *   • 404 if no path matches at all               (404)
     */
    public function dispatch(Request $request): Response
    {
        $path   = $request->path();
        $method = $request->method();

        // Step 1: iterate routes registered for the *current* HTTP method,
        //          using pattern matching (supports dynamic params like /users/{id}).
        foreach ($this->getMethodRoutes($method) as $route) {
            $params = self::matchParams($route->path, $path);
            if ($params === null) {
                continue;
            }

            // Step 2: pattern matched — enrich the Request with route params
            // while preserving query/queryString/post body state.
            $withParams = new Request(
                method:      $method,
                path:        $path,
                queryString: $request->queryString(),
                query:       $request->query(),
                params:      $params + $request->params(),
                postBody:    $request->post(),
            );

            return ($route->handler)($withParams);
        }

        // Step 3: current method has no matching path.
        //         Scan routes registered under OTHER methods for the same pattern.
        foreach (self::ALL_METHODS as $altMethod) {
            if ($altMethod === $method) {
                continue;
            }
            foreach ($this->getMethodRoutes($altMethod) as $route) {
                $params = self::matchParams($route->path, $path);
                if ($params !== null) {
                    return Response::methodNotAllowed();
                }
            }
        }

        // Step 4: no route matched at all → 404.
        return Response::notFound();
    }

    /* ─── Param matching helper ────────────────────────────────────── */

    /**
     * Convert a route pattern (e.g. `/users/{id}/posts/{slug}`) into
     * extracted parameters for the given URL path, or null on mismatch.
     */
    private static function matchParams(string $pattern, string $path): ?array
    {
        // Trailing-slash normalisation (route /users/42 matches /users/42 and /users/42/).
        $path = rtrim($path, '/');
        if ($path === '') {
            $path = '/';
        }

        // Root route: '/' matches exactly '/'.
        if ($pattern === '/') {
            return $path === '/' ? [] : null;
        }

        // Normalise both to the same form for comparison.
        $segments  = explode('/', trim($pattern, '/'));
        $parts     = explode('/', trim($path, '/'));

        if (\count($parts) !== \count($segments)) {
            return null;
        }

        /** @var array<string,int> */
        $names = [];
        $i     = 0;
        foreach ($segments as $seg) {
            if (str_contains($seg, '{') && str_contains($seg, '}')) {
                // Dynamic segment — must align positionally.
                $name   = substr($seg, 1, -1);
                if ($parts[$i] === '') {
                    return null;
                }
                $names[$i] = $name;
            } else {
                // Literal segment — exact match required.
                if ($parts[$i] !== $seg) {
                    return null;
                }
            }
            $i++;
        }

        // Build the result array from captured names.
        $result = [];
        foreach ($names as $idx => $name) {
            $value = $parts[$idx];
            if (is_numeric($value)) {
                $value = ctype_digit($value) ? (int)$value : (float)$value;
            }
            $result[$name] = $value;
        }

        return $result;
    }
}

/** @internal Route entry — immutable-by-convention value object. */
final class RoutingEntry
{
    public function __construct(
        public string $path,
        /** @var callable */
        public         $handler,
    ) {}
}


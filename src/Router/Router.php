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

    /** @var array<string, string[]> Allowed methods per matched path. */
    private array $methodMap = [];

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
        // Normalise: ensure single leading slash.
        $path = '/' . ltrim($uri, '/');

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
        $path    = $request->path();
        $method  = $request->method();

        // Collect all methods that serve this path.
        $allowedMethods = $this->methodMap[$path] ?? [];

        if ($allowedMethods !== []) {
            // Path is registered, but we're on the wrong method → 405.
            if ($method !== 'OPTIONS' && !\in_array($method, $allowedMethods, true)) {
                return Response::methodNotAllowed();
            }

            // Retrieve the correct bucket for dispatching.
            $routes = match ($method) {
                'GET'     => $this->getRoutes,
                'POST'    => $this->postRoutes,
                'PUT'     => $this->putRoutes,
                'DELETE'  => $this->deleteRoutes,
                'PATCH'   => $this->patchRoutes,
                default   => [],
            };

            if ($routes === []) {
                return Response::methodNotAllowed();
            }

            // Search this method's routes for an exact path match.
            foreach ($routes as $route) {
                if ($route->path !== $path) continue;

                // Convert `/users/{id}/posts/{slug}` → regex, extract params.
                $params = self::matchParams($route->path, $path);

                // If param extraction succeeds, the route matches.
                if ($params !== null) {
                    // Clone $request with extracted params so handlers receive them.
                    $withParams = new Request(
                        method:   $method,
                        path:     $path,
                        params:   $params + $request->params(),
                        postBody: $request->post(),
                    );

                    // Call the handler with the enriched request.
                    return ($route->handler)($withParams);
                }
            }
        }

        // No path matched at all → 404.
        return Response::notFound();
    }

    /* ─── Param matching helper ────────────────────────────────────── */

    /**
     * Convert a route pattern (e.g. `/users/{id}/posts/{slug}`) into
     * extracted parameters for the given URL path, or null on mismatch.
     */
    private static function matchParams(string $pattern, string $path): ?array
    {
        // /prefix/{name}/suffix/… → preg_quote segments + named capture groups.
        $segments   = explode('/', trim($pattern, '/'));
        $expressions = [];
        /** @var array<string,int> */
        $names       = [];

        foreach ($segments as $i => $seg) {
            if ($seg === '') continue;  // skip empty leading/trailing segments.

            // Named param like {id} → (?P<id>[^/]+).
            if (str_contains($seg, '{') && str_contains($seg, '}')) {
                $name = substr($seg, 1, -1);  // strip braces.
                $expressions[]    = "(?P<{$name}>[^/]+)";
                $names[$i]       = $name;
            } else {
                // Literal segment → regex-escape it.
                $expressions[]     = preg_quote($seg, '/');
            }
        }

        if ($expressions === []) return null;

        $regex = '/' . implode('/', $expressions) . '$/';

        if (!preg_match($regex, rtrim($path, '/'), $matches)) {
            return null;
        }

        // Extract only named groups, cast values.
        $result = [];
        foreach ($names as $idx => $name) {
            $value = $matches["{$name}"];
            // Auto-cast integers where possible (e.g. /users/42).
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


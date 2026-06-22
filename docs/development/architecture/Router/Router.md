# Router Class

## Overview

The unified mode-aware router supporting both HTTP routes and CLI commands.
Documentation: docs/development/architecture/Router/Router.md

It is a non-singleton `final class` instantiated as `new Router($mode)` where `$mode` is one of `MODE_WEB` or `MODE_CLI`. The router manages route tables separately for each HTTP method (GET, POST, PUT, DELETE, PATCH) and maintains a CLI command map. It **never** interacts with the DI container — all handler resolution is done via plain callables directly bound during registration, and path-parameter values are embedded into a fresh Web request object before dispatch to invoke handlers as `Route::dispatch(Web $req)` or equivalent.

## Mode-driven construction

```php
$router = new Router(Router::MODE_WEB);  // web mode (default)
$cli    = new Router(Router::MODE_CLI);  // cli mode
```

The constructor throws `\InvalidArgumentException` if mode is not one of the two allowed constants:

```php
new Router('FAKE');  // InvalidArgumentException
```

Mode determines how `dispatch()` behaves. WEB expects a Web request, CLI expects Cli. Incompatible type → `InvalidArgumentException`. The constant values are defined on-class.

## Responsibilities

- **Route registration** — Stores registered route handlers organized by HTTP method bucket (five private indexed arrays) or CLI command name keys.
- **Pattern matching + param extraction** — Converts URI patterns like `/users/{id}` into a callable match using dynamic segment parsing with numeric type coercion, returning extracted path params as an associative array that gets injected back into a fresh Web request object before invoking the handler.
- **Method-not-allowed fallback** — When no route matches the requested method+path pair, scans other methods' routes for the same pattern; if it finds a match on another method, returns a 405 response instead of 404.

## Public API

### HTTP Route registration (fluent return)

Each helper accepts `(string $uri, callable $handler)` and returns `$this` for chaining:

```php
$router->get(string|callable): self     // GET route
$router->post(string|callable): self    // POST route
$router->put(string|callable): self     // PUT route
$router->delete(string|callable): self  // DELETE route
$router->patch(string|callable): self   // PATCH route
$router->any(string $uri, callable $handler): self  // registers on ALL five methods at once
```

Each helper internally normalizes the URI (leading single slash, no trailing slash) then stores it in the matching route array as a `RoutingEntry`.

**Examples:**

```php
$router = new Router(Router::MODE_WEB);
$router->get('/', static function (Web $req): Response {
    return Response::html('<h1>Hello</h1>');
});

// POST routes are registered separately:
$router->post('/users', static fn (Web $req): Response => ...);

// Dynamic params in URI → injected into new Web() before dispatch:
$router->get('/users/{id}', static function (Web $req): Response {
    // $req->param('id') is accessible here after injection step.
    return Response::html("User {$req->param('id')}");
});

// Registers the same handler on all HTTP methods:
$router->any('/fallback', static fn (Web $req): Response => Response::notFound());
```

### CLI command registration

Registers named commands (dot-separated string + callable, returns `$this`):

```php
$router = new Router(Router::MODE_CLI);
$router->command('core.install', static function (Cli $req): Response {
    return Response::text("Installing...\n");
});
```

CLI command names must not be empty strings. Dispatch in CLI mode looks up the exact command name string in the commands map and invokes its handler if found; not-found returns a 404 text response rather than throwing.

### `add()` — core route registration

Registers any HTTP method to a handler: `(string $method, string $uri, callable $handler): self`. Normalizes the URI (leading slash, strip trailing) and stores it in the appropriate bucket. Returns `$this` for chaining.

This is the shared implementation behind all shortcut helpers (`get()`, `post()`, etc.).

### `dispatch()` — routing entry point

Signature: `dispatch(Web|Cli $request): Response`. Accepts one of two Request types depending on mode (Web in WEB mode, Cli in CLI mode). Throws `InvalidArgumentException` when the request type mismatches. **Always** returns exactly one `Response` instance.

WEB mode (`new Router(Router::MODE_WEB)`):
- Iterates routes registered for the exact current HTTP method using `matchParams()` for dynamic segment detection.
- When a pattern matches, injects extracted params into a fresh Web request preserving query/queryString/postBody state via new Web object constructor, then invokes the matched handler closure and returns its Response directly (no wrapping).
- If no route on the requested method matches: scans routes registered under OTHER methods for the same path pattern. Any hit → `Response::methodNotAllowed()`; no hits at all → `Response::notFound()`.

CLI mode (`new Router(Router::MODE_CLI)`):
- Looks up command name in commands map keyed by dot-string; invokes `$handler($request)`. If result is not already a Response, wraps as plain `Response::text("$result")`.

## Implementation details

### Route storage (internal private properties)

```php
private string $mode;                                   // MODE_WEB or MODE_CLI
/** @var list<RoutingEntry> */
private array $getRoutes      = [];  // GET routes indexed
private array $postRoutes     = [];  // POST routes indexed
private array $putRoutes      = [];  // PUT routes indexed
private array $deleteRoutes   = [];  // DELETE routes indexed
private array $patchRoutes    = [];  // PATCH routes indexed
/** @var array<string, callable> */
private array $commands       = [];  // CLI commands keyed by name
```

The five HTTP method arrays each store `RoutingEntry` objects (a private non-readonly final class) with public `$path` and `$handler` properties. Each registered route is stored in the bucket corresponding to its method type.

### Pattern matching algorithm (`matchParams()`)

Private static method that converts a URI pattern (e.g., `/users/{id}/posts/{slug}`) into extracted parameters for an incoming URL path, or `null` on mismatch:

1. Strip trailing slash from the path; fallback root to `'/'`
2. Root route — `/` matches only `/`. Returns `[]` if matched, `null` otherwise.
3. Split both pattern and path by `/`, trimming slashes off both sides. If segment counts differ → `null`.
4. Iterate segments positionaly (same index):
   - **Dynamic segment** (`{name}`) — extract name from braces; must align positionally with a non-empty string in the matched path. Record name→value pair.
   - **Literal segment** — exact string match required at same index.
5. On success, build an associative array from captured `{name}` → value pairs. If `ctype_digit($value)` is true, cast to `(int)`.

No wildcards or regex patterns are supported — only positional alignment and brace-delimited dynamic parameters.

### Method-not-allowed detection

When no route matches the requested method+path in step 1:
1. For each remaining HTTP method (other than the request's), test `matchParams()` on every alternate-method route against the path at its current index.
2. If any alternative-method route matches the pattern → return `Response::methodNotAllowed()`.
3. If none match either → fall through to `Response::notFound()`.

### CLI dispatch algorithm

In CLI mode, retrieves the command name from `Cli::command()` and looks it up in `$this->commands`:
- Empty string or not-found → 404 text response with `"Command not found: {$command}\n"`.
- Found → invoke `$handler($request)`; if result is a Response return it directly, otherwise coerce to `Response::text((string)$result)`.

## Public methods (summary table)

| Method | Arguments | Return | Description |
|--------|-----------|--------|-------------|
| `__construct(string $mode = MODE_WEB)` | Mode constant (`Router::MODE_WEB` or `Router::MODE_CLI`) | — | Validates mode, stores it. Throws for invalid input. |
| `add(string $method, string $uri, callable $handler): self` | HTTP method, URI pattern, Callable handler | `$this` | Normalizes path, adds to appropriate bucket. Chainable fluent return. |
| `get(string $uri, callable $handler): self` | URI, handler | `$this` | Shorthand for add('GET', ...) |
| `post(string $uri, callable $handler): self` | URI, handler | `$this` | Shorthand for add('POST', ...) |
| `put(string $uri, callable $handler): self` | URI, handler | `$this` | Shorthand for add('PUT', ...) |
| `delete(string $uri, callable $handler): self` | URI, handler | `$this` | Shorthand for add('DELETE', ...) |
| `patch(string $uri, callable $handler): self` | URI, handler | `$this` | Shorthand for add('PATCH', ...) |
| `any(string $uri, callable $handler): self` | URI, handler | `$this` | Registers on ALL five HTTP methods at once |
| `command(string $name, callable $handler): self` | Command name, handler closure | `$this` | Registers named CLI command (dot-notation). Name cannot be empty. |
| `dispatch(Web|Cli $request): Response` | Web request or Cli request depending on mode | `Response` | Matches route(s), injects path params, invokes handler, returns a Response always never null or error codes or void. In WEB matches routes by method first then alternate-methods as fallback; CLI does string-lookup command name dispatch. |
| `getMethodRoutes(string $method): array` | HTTP method (internal access) | `array<int,RoutingEntry>` (or empty []) | Returns the bucket of registered routes for a given HTTP method. Used internally by dispatch() to select the correct route source array |

## Limitations

### Dynamic parameter format only

Only `{name}` braces work; no glob, regex, or wildcards are supported. Pattern matching is purely positional — all segments in the pattern must align exactly with path parts by count and index. This means `/users/{id}` matches `/users/42` but NOT `/users/42/posts` (different segment count).

### No middleware chain

There is no middleware stack or pipeline system built into the Router class. Each handler closure executes directly without any pre-processing hooks — only a Response return from each matched route. Extensions wanting to wrap handlers must do so at registration time.

## Example — Full WEB usage pattern

```php
$router = new Router(Router::MODE_WEB);

// Static pages:
$router->get('/',     static fn (Web $req): Response => Response::html('<h1>Home</h1>'));
$router->get('/about', static fn (Web $req): Response => Response::html('<h1>About</h1>'));

// Dynamic routes with params:
$router->get('/users/{id}',
    static function (Web $req): Response {
        // $req->params()['id'] is accessible here via the injection step above.
        return Response::json(['user_id' => $req->param('id')]);
    }
);

// POST form submission:
$router->post('/users',
    static fn (Web $req): Response => ..., // ... = actual handler body not shown here for brevity.
);

// Dispatch (WEB mode expects Web request):
$request = Web::fromGlobals();
$response = $router->dispatch($request);  // matches routes → executes handler → Response return.
```

## RoutingEntry structure (internal helper value object)

Non-readonly final class `RoutingEntry` with two public properties:

```php
final class RoutingEntry {
    public string     $path;       // normalised URI path pattern 
    public callable   $handler;    // The matched handler callback    
    public function __construct(string $path, callable $handler) {}
}
```

All routes are stored as `RoutingEntry` objects in typed arrays indexed by HTTP method (the five route arrays: get, post, put, delete, patch). Each entry stores the URI path and the callable bound at registration. The property names are `$path` and `$handler`.

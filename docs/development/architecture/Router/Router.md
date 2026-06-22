# Router Component

## Overview

The `Router` class is a unified, mode-aware routing subsystem that serves two purposes: HTTP URI routing (WEB mode) and CLI command dispatch (CLI mode). It is constructed with a mode, registered with routes and/or commands, then dispatched against a request object. Extensions can register routes or commands during the `router.register` hook fired by Bootstrap before dispatch.

## Responsibilities

- **Route registration** for HTTP methods (GET, POST, PUT, DELETE, PATCH) with dynamic parameter patterns.
- **Command registration** for CLI subcommands using dot-notation names (e.g. `core.config.show`).
- **Request dispatch** — matches the incoming request (Web or Cli) against registered routes/commands.
- **Default responses** — returns 404 and 405 HTML responses when no route/command matches.
- **Dynamic parameter extraction** — extracts `{name}` path segments from URI patterns, auto-type-casting numeric values to int/float.

### Supported Modes

| Constant | String   | Dispatch Input Type      | Matches Against     |
|----------|----------|-------------------------|---------------------|
| `MODE_WEB` | `'WEB'` | `Web` (from globals)    | HTTP routes by method + path |
| `MODE_CLI` | `'CLI'` | `Cli` (from argv)       | CLI command names              |

## Architecture

### Internal Layout

```
Router
├── getRoutes     : RoutingEntry[]  — registered via ->get() or ->add('GET', …)
├── postRoutes    : RoutingEntry[]  — registered via ->post() or ->add('POST', …)
├── putRoutes     : RoutingEntry[]  — registered via ->put() or ->add('PUT', …)
├── deleteRoutes  : RoutingEntry[]  — registered via ->delete() or ->add('DELETE', …)
├── patchRoutes   : RoutingEntry[]  — registered via ->patch() or ->add('PATCH', …)
├── commands      : array<string, callable> — CLI command name → handler
├── matchParams() : private static method — pattern matching for {name} segments
└── RoutingEntry  : internal value object (path + handler callable)
```

Each route category is a simple indexed array of `RoutingEntry` objects. Routes are iterated in registration order — first match wins. The all-methods array constant `ALL_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']` drives 405 detection.

### Route Registration

Route registration methods return `$this` for chaining:

```php
$router->get('/hello', function($request) { /* ... */ });
$router->post('/users', function($request) { /* ... */ });
$router->put('/users/{id}', fn($req) => Response::ok());  // chaining example
$router->patch('/users/{slug}/profile', fn() => Response::json([]));

// Any HTTP method to the same handler:
$router->any('/debug/echo', function($req) { /* responds to all methods */ });
```

The `add()` method normalizes URIs (leading slash, strip trailing slash) and stores entries in the appropriate bucket based on the uppercase HTTP method. Unsupported methods throw `\InvalidArgumentException`.

### Command Registration

CLI commands use dot-notation names with `command()`:

```php
$router->command('hello.world', function($request) {
    return Response::text("Hello, {$request->arg(0)}\n");
});

$router->command('core.config.show', function($request) {
    // command logic
    return 'showing config';
});
```

Command names are trimmed and validated (empty name throws `\InvalidArgumentException`). No validation is performed on the handler — it must be callable.

### Dynamic Parameter Matching

Path patterns use `{name}` for dynamic segments:

```php
// Pattern /users/{id}/posts/{slug} matches:
//   /users/42/posts/hello-world → ['id' => 42, 'slug' => 'hello-world']
//   /users/foo/posts/bar        → ['id' => 'foo', 'slug' => 'bar']
```

Matching algorithm (inside `matchParams()`):

1. Trailing-slash normalization on the request path.
2. Segment-by-segment comparison between pattern and URL.
3. `{name}` segments become named keys in the result array.
4. Numeric string values are cast to `(int)` if all digits, else `(float)`.
5. Literal segments require exact case-sensitive match.
6. Segment count mismatch returns `null` (no match).

### Dispatch Lifecycle — WEB Mode

```php
// Inside dispatchWeb(Web $request):
$router->get('/users/{id}', fn($req) => Response::html("User {$req->param('id')}"));
$response = $router->dispatch(Web::fromGlobals());
```

Full dispatch lifecycle:

| Step | Action | Detail |
|------|--------|--------|
| 1 | Method lookup | Retrieve routes for `$request->method()` (GET bucket, POST bucket, etc.) |
| 2 | URI matching | Iterate routes in registration order; `matchParams()` extracts path params on match. First match wins — handler is invoked with an enriched Web object containing the params + query + postBody from the original request. |
| 3 | Method resolution (405 scan) | If step 2 finds nothing for the *current* method, scans ALL method buckets for routes matching the same URI pattern. If found under a different method → `Response::methodNotAllowed()` (405). |
| 4 | No match (404) | If no routes matched in any method bucket → `Response::notFound()` (404 HTML response). |

### Dispatch Lifecycle — CLI Mode

```php
$router->command('hello.world', fn($req) => "Hello, {$req->arg(0)}");
$response = $router->dispatch(Cli::fromArgv(['cli', 'hello.world', 'Louis']));
$response->send(); // outputs: Hello, Louis
```

Full dispatch lifecycle:

| Step | Action | Detail |
|------|--------|--------|
| 1 | Command lookup | Exact-key lookup in `$this->commands`. Empty command name or missing key → `Response::text("Command not found: {$command}\n", 404)`. |
| 2 | Handler invocation | Calls the registered callable with the Cli request object as argument. The handler may return a `Response` (passed through directly) or any scalar (cast to string, wrapped in `text()` response at OK status). |

### `router.register` Hook Integration

Bootstrap fires the `router.register` hook after creating the Router instance but before dispatch:

```php
$registry->trigger('router.register', [
    'router'    => $router,     // Router instance — call ->get(), ->command(), etc.
    'container' => static::$instance,  // DI hub full of bootstrapped services
    'mode'      => 'web',       // or 'cli'
]);
```

Extensions use this hook to register routes or commands:

```php
// Inside a plugin / theme registration callback for 'router.register':
$registry->trigger('router.register', static function(array $ctx): void {
    $router = $ctx['router'];
    if ($ctx['mode'] === 'web') {
        $router->get('/hello.plugin', fn() => Response::html('<h1>From Plugin</h1>'));
    } else {
        $router->command('plugin.greet', static fn($req) => "Greeting from {$req->arg(0)}!");
    }
});
```

### Example: Complete WEB Route Setup

```php
// During bootstrap — before router.register fires, or in plugin hooks:
(new Bootstrap('WEB'));  // Bootstrap creates Router internally

// In a plugin's router.register handler or post-bootstrap:
$router = Bootstrap::container()->resolve('router');
$router->get('/', fn() => Response::html('<h1>Home</h1>'));
$router->get('/users/{id}', static function(Web $req) {
    return Response::json(['user' => $req->param('id')]);
});
$router->post('/users', static function(Web $req) {
    // body handling via $req->post()
    return Response::json(['created' => true], 201);
});
```

### Example: Complete CLI Command Setup

```php
// During bootstrap:
(new Bootstrap('CLI'));

// In a plugin's router.register handler or post-bootstrap:
$router = Bootstrap::container()->resolve('router');
$router->command('hello', fn() => "Hello World");
$router->command('hello.world', static function(Cli $req) {
    return sprintf("Hello, %s! Flags: %s\n", 
        $req->arg(0) ?: 'stranger', 
        json_encode($req->flags())
    );
});
```

CLI invocation examples on the installed binary:

```bash
php cli hello.world Louis          # → Hello, Louis! Flags: {}
php cli hello.world Louis --upper  # → Hello, Louis! Flags: {upper: true}
php cli hello.world --format=json  # → Hello, stranger! Flags: {format: "json"}
```

### Future Middleware Support

The Router currently has no middleware layer. Planned evolution includes:

- **Global middleware** — error handling, CSRF checking (when enabled), and session start are conceptually separate concerns that will be wired into the dispatch chain. 
- **Route-level middleware groups** — e.g., `->get('/admin', $handler, ['auth'])`.
- **Priority ordering for hooks** — extensions may register routes during `router.register` at different times; priority control is future work.

## Examples

### Route registration

```php
$router->get('/hello', function(Web $r) {
    return Response::html('<h1>Hello World</h1>');
});

// Chained registration:
$router->delete('/items/{id}', fn() => Response::ok())
       ->patch('/items/{slug}', fn() => Response::ok());
```

### Command registration

```php
$router->command('core.config.show', function(Cli $r) {
    return Config::toArray();   // assuming container resolution later
});

// Multi-command setup:
$router->command('core.version', fn() => '1.0.0')
       ->command('core.install', function(Cli $r) {
           return "Installing to {$r->arg(0)}";
       });
```

## Limitations

- **No query-string parameter extraction** — routing only matches on the URI path; `$_GET` data is available in `Web::query()` but not used for route matching.
- **Exact segment count required** — no wildcard segments (e.g. `{path*}`). A pattern with 2 segments won't match a URL with 3 segments, even if the extra parts are static.
- **No regex patterns** — dynamic parameters use fixed `{name}` placeholders only; no character-class constraints on parameter values. No support for optional segments (`/users/{id}?`) or sub-patterns like `/api/v[1-2]/users`.
- **Method matching is manual, not auto-discovered** — 405 detection scans all method buckets but does so only when the current method has zero matches; it won't fire if multiple methods match.

## Future Enhancements

- Wildcard segments (`{path*}`) for catch-all routes.
- Regex patterns on dynamic parameters (e.g. `{id:\d+}`).
- Route groups with shared prefixes and middleware.
- Named routes with reverse lookup (`$router->named('users.show', '/users/{id}')`).
- Request lifecycle hooks that extensions can attach to (pre-dispatch, post-match, pre-output).

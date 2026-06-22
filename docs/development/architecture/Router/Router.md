# Router

## Purpose

Final class providing unified mode-aware routing for HTTP routes and CLI commands within the Core-Web framework.

## Responsibilities

- Store HTTP routes separately by method (GET, POST, PUT, DELETE, PATCH) in indexed arrays of `RoutingEntry` objects.
- Register CLI commands keyed by dot-notation names (`hello.world`, `core.config.show`).
- Normalise URIs on registration: single leading `/`, stripped trailing `/`.
- Match routes segment-by-segment, case-sensitively; dynamic params accept `{name}` only (no regex or wildcards).
- Auto-cast numeric captured values to `int` (all digits) or `float` (decimal digits).
- Detect HTTP 405 when the current method's route has no path match but an alternate method does.
- Return text 404 for missing CLI commands.

## Public API

### Class Constants

| Constant | Value |
|----------|-------|
| `MODE_WEB`  | `'WEB'` |
| `MODE_CLI`  | `'CLI'` |

### Constructor

```php
__construct(string $mode = self::MODE_WEB)
```

- Accepts `self::MODE_WEB` or `self::MODE_CLI`. Throws `\InvalidArgumentException` for any other value.
- Stored in `$mode`; determines which dispatch path is taken during `dispatch()`.

### HTTP Route Registration (all return `$this`)

| Signature | Description |
|-----------|-------------|
| `get(string $uri, callable $handler): self` | Register a GET route. Normalises URI, creates `RoutingEntry`, stores in `$getRoutes`. |
| `post(string $uri, callable $handler): self` | Register a POST route (same logic → `$postRoutes`). |
| `put(string $uri, callable $handler): self` | Register a PUT route → `$putRoutes`. |
| `delete(string $uri, callable $handler): self` | Register a DELETE route → `$deleteRoutes`. |
| `patch(string $uri, callable $handler): self` | Register a PATCH route → `$patchRoutes`. |
| `any(string $uri, callable $handler): self` | Shortcut: registers the same handler across all five HTTP methods. |

### Add (HTTP Route Registration — Canonical)

```php
add(string $method, string $uri, callable $handler): self
```

- Normalises URI: `rtrim('/' . ltrim($uri, '/'), '/') ?: '/'`.
- Wraps (`$path`, `$handler`) into `new RoutingEntry()`.
- Uses match-expression on `strtoupper($method)` to route into the correct array.
- Throws `\InvalidArgumentException` for unsupported methods (anything not GET/POST/PUT/DELETE/PATCH).

### CLI Command Registration

```php
command(string $name, callable $handler): self
```

- Trims `$name`; throws `\InvalidArgumentException` if empty after trimming.
- Stores in `$this->commands[$name]`.
- Handlers may return `Response` or any value castable to string (via `Response::text()`).
- Command names use dot-notation (e.g. `"hello.world"`, `"core.config.show"`).

### Dispatch (Entry Point)

```php
dispatch(Web|Cli $request): Response
```

- Accepts union type `Web` or `Cli`. Throws `\InvalidArgumentException` if the wrong request type is passed for the current `$mode`.
- Delegates to `dispatchWeb()` or `dispatchCli()` based on mode.

## Internal Architecture

### Route Storage

Routes are stored in five separate arrays, each an indexed list of `RoutingEntry` objects:

| Property | Shape | Purpose |
|----------|-------|---------|
| `$getRoutes` | `array` of `RoutingEntry` | GET routes |
| `$postRoutes` | `array` of `RoutingEntry` | POST routes |
| `$putRoutes` | `array` of `RoutingEntry` | PUT routes |
| `$deleteRoutes` | `array` of `RoutingEntry` | DELETE routes |
| `$patchRoutes` | `array` of `RoutingEntry` | PATCH routes |

Each entry is a `final class RoutingEntry` with two public members:

- `string $path` — normalised route path (leading `/`, no trailing `/`).
- `callable $handler` — the handler callable invoked during dispatch. Handlers receive a `Web|Cli` request (type depends on mode) and return a `Response`.

The `$mode` property determines which dispatch path (`dispatchWeb()` or `dispatchCli()`) is taken by `dispatch()`.

### CLI Command Storage

Single associative array:

- `private array $commands = [];` — keyed by dot-notation command name (e.g. `"hello.world"`), values are `callable`.
- The handler receives a `Cli` request and may return any value castable to string or a `Response`.

### Internal Static Helper

```php
private static function matchParams(string $pattern, string $path): ?array
```

Matches a route pattern (e.g. `/users/{id}/posts/{slug}`) against an incoming URL path. Algorithm:

1. Trims trailing slashes from `$path`; root `/` matches exactly `/`.
2. Splits both into segments by `/`, trims surrounding slashes.
3. Checks segment count equality — returns `null` immediately if counts differ.
4. Iterates positionally: literal segments require exact match; dynamic segments (`{name}`) capture the value by name.
5. **Only `{name}` is supported** — no regex patterns or wildcards.
6. Numeric captured values are auto-cast to `int` (all digits) or `float`; all others remain strings.
7. Returns associative array of parameter names → values, or `null` on mismatch.

### Web Dispatch Flow (`dispatchWeb()`)

1. Gets `$path = $request->path()` and `$method = $request->method()`.
2. **Current-method scan** — iterates `getMethodRoutes($method)` in registration order; calls `matchParams(route->path, $path)`.
3. **On match**: creates a new `Web` instance with captured params merged into existing params (preserves query/postBody state). Calls `$route- handler($withParams)`.
4. **Method-not-allowed scan** — if no path matched, iterates all alternate methods from `self::ALL_METHODS = [GET, POST, PUT, DELETE, PATCH]`; if any alternate method has a matching pattern → returns `Response::methodNotAllowed()`.
5. **Final fallback**: returns `Response::notFound()`.

### CLI Dispatch Flow (`dispatchCli()`)

1. Gets `$command = $request->command()`.
2. If command is empty or not in `$this->commands`: returns text Response with status 404.
3. Invokes `$this- commands[$command]($request)` → result may be `Response` (returned directly) or any value (wrapped in `Response::text()`).

### Method Routes Lookup (`getMethodRoutes()`)

```php
private function getMethodRoutes(string $method): array
```

Match-expression resolving the method name to the corresponding `$getRoutes`, `$postRoutes`, etc. Returns empty array for unknown methods.

## Dependencies

- **RoutingEntry** — internal final class (same file); holds route path and handler.
- **Web / Cli** — request classes from `Laswitchtech\CoreWeb\Router\Request` namespace; passed to handlers during dispatch.
- **Response** — response class from `Laswitchtech\CoreWeb\Router` namespace; factory methods used (`Response::text()`, `Response::notFound()`, `Response::methodNotAllowed()`).

## Lifecycle

1. **Construction** (`new Router(MODE_WEB | MODE_CLI)`): Validates mode, stores in `$mode`. No lazy initialisation; route/command arrays start empty.
2. **Registration** (web routes via `get()` / `post()` / etc., CLI commands via `command()`): each call appends to the correct internal array or map. No ordering constraints between web and CLI registrations.
3. **Dispatch** (`dispatch($request)`): resolves method routes or command lookup, invokes handler, returns Response synchronously.
4. **Destruction** — PHP garbage-collects all route entries, commands, and the Router instance when the script ends.

## Future Enhancements

- **Optional path segments** — trailing optional segments (`/users/{id}?`) are not supported (segment count must match exactly in `matchParams()`); all path segments must have a corresponding route segment.

# Router

## Purpose

The Router provides unified mode-aware routing for HTTP routes and CLI commands within the Core-Web framework.

## Responsibilities

_(none)_

## Public API

_(none)_

## Internal Architecture

### Route Storage

Routes are stored in five separate arrays keyed by HTTP method, each holding `RoutingEntry` objects:

| Property | Type | Purpose |
|----------|------|---------|
| `$getRoutes` | `array<string, RoutingEntry>` | GET routes |
| `$postRoutes` | `array<string, RoutingEntry>` | POST routes |
| `$putRoutes` | `array<string, RoutingEntry>` | PUT routes |
| `$deleteRoutes` | `array<string, RoutingEntry>` | DELETE routes |
| `$patchRoutes` | `array<string, RoutingEntry>` | PATCH routes |

Each `RoutingEntry` is an internal final class holding two public members:

- `string $path` — normalized (leading `/`, stripped trailing) route path.
- `mixed $handler` — the callable invoked during dispatch (accepts `Web|Cli`).

The `add()` method stores the entry into the correct array based on `strtoupper($method)` via match-expression. The `$mode` property determines which dispatch path (`dispatchWeb()` or `dispatchCli()`) is taken by `dispatch()`.

### CLI Command Storage

CLI commands are stored in a single associative map:

- `private $commands = []` keyed by dot-notation command name (e.g. `"hello.world"`) mapped to `callable`.
- The handler receives a `Cli` request object and may return either a `Response` or any scalar (`string|int|void`).

### Internal Static Helper

```php
private static function matchParams(string $pattern, string $path): ?array
```

- Converts route patterns like `/users/{id}/posts/{slug}` into extracted parameters.
- Normalizes both pattern and path by trimming leading/trailing slashes before splitting.
- Literal segments must exactly match; dynamic segments (`{name}`) capture values positionally.
- Numeric values are cast to `int` (if all digits) or `float`; all other types remain strings.
- Returns an associative array of parameter names → values, or `null` on mismatch.

### Method-Not-Allowed Detection Flow

When `dispatchWeb()` finds no matching route for the current method:

1. Iterates `self::ALL_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']`.
2. For each alternate method, calls `matchParams()` with that method's routes.
3. If any alternate method has a path match → returns `Response::methodNotAllowed()`.

## Dependencies

---

## Lifecycle

---

## Future Enhancements

---

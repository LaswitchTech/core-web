# Web Request

## Purpose

The Web Request component is an immutable value object that encapsulates a single HTTP request into typed, framework-native data accessible through getters only. It wraps `$_SERVER`, `$_GET`, and `$_POST` so handlers receive clean values rather than raw globals.

## Responsibilities

- Provide normalised access to HTTP method, URL path, query string, route parameters, and POST body.
- Parse raw query strings into structured arrays when explicitly requested.
- Normalise paths to a single leading slash with no trailing slash (except root).

## Public API

| Method | Description |
|---|---|
| `__construct(string $method, string $path, string $queryString = '', array $query = [], array $params = [], array $postBody = [])` | Immutable constructor. Normalises `$method` via `strtoupper()`, normalises `$path` to a single leading slash with no trailing slash (root becomes `/`). Parses `$queryString` into `$this->query` **only** when `$query` is empty and `$queryString` is non-empty; otherwise uses `$query` directly as-is. |
| `static fromGlobals(): self` | Entry point that reads `$_SERVER['REQUEST_METHOD']` and `$_SERVER['REQUEST_URI']`. Splits query string from path at the first `?`. Normalises path to one leading slash, no trailing slash (except root). Passes `$_GET ?? []` as `$query` and `$_POST ?? []` as `$postBody`. Route params start empty (filled later during dispatch). |
| `path(): string` | Normalised URL path: always begins with `/`, never ends with `/` except when the path is root (`/`). |
| `method(): string` | Uppercase HTTP method: one of `GET`, `POST`, `PUT`, `DELETE`, `PATCH`. |
| `query(): array` | Query parameters as associative array of strings. Populated from `$_GET` by `fromGlobals()`, or parsed from `$queryString` in the constructor when `$query` is empty and `$queryString` is non-empty. |
| `isGet(): bool` | Returns `true` when method equals `GET`. |
| `isPost(): bool` | Returns `true` when method equals `POST`. |
| `isPut(): bool` | Returns `true` when method equals `PUT`. |
| `isDelete(): bool` | Returns `true` when method equals `DELETE`. |
| `isPatch(): bool` | Returns `true` when method equals `PATCH`. |
| `params(): array` | Route path parameters filled by the dispatcher (e.g. `['id' => 42]`). Starts empty in `fromGlobals()`, populated after routing matches and extracts named segments. |
| `post(): array` | POST body parameters as associative array. Populated from `$_POST` by `fromGlobals()` or passed to the constructor. |
| `param(string $name, mixed $default = null): mixed` | Shortcut for `$this->params()[$name]`. Returns `$default` when `$name` is unset. |
| `queryParam(string $name, mixed $default = null): mixed` | Shortcut for `$this->query()[$name]`. Returns `$default` when `$name` is unset. |
| `postParam(string $name, mixed $default = null): mixed` | Shortcut for `$this->post()[$name]`. Returns `$default` when `$name` is unset. |
| `queryString(): string` | Raw query string without the leading `?`. Empty string when no query was present. |

## Internal Architecture

- **Path normalisation**: `'/' . ltrim($path, '/')` ensures one leading slash; `rtrim(..., '/') + ?: '/'` strips trailing slashes while preserving root `/`.
- **Query-string parsing** (`parseQueryString(string $qs): array`, private static): splits on `&` then `=`, applies `rawurldecode()` to both key and value. Skips empty pairs. Only invoked by the constructor when `$query === []` and `$queryString !== ''`.
- **Method normalisation**: always uppercased via `strtoupper()`.

## Dependencies

- No external dependencies; all globals (`$_SERVER`, `$_GET`, `$_POST`) are read directly within `fromGlobals()`.

## Lifecycle

1. **Instantiation** — either via direct `__construct()` with explicit values or through `fromGlobals()` which reads current request state. The object is fully immutable after construction (all properties are `readonly`).
2. **Dispatch use** — passed to route handlers; dispatcher populates `$params` between routing and handler invocation by mutating a new copy (value semantics).
3. **Destruction** — PHP garbage-collects the object when it goes out of scope.

## Future Enhancements

- File upload tracking (`$FILES`) not yet implemented.
- Cookie reading via `$_COOKIE` not yet implemented.
- Header access via `$_SERVER['HTTP_*']` keys not yet implemented.

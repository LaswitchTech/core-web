# Web Request Class

## Overview

The `Web` class is an immutable value object representing a single HTTP request. It wraps `$_SERVER['REQUEST_METHOD']`, `$_SERVER['REQUEST_URI']`, `$_GET`, and `$_POST` state into typed properties accessible only through public getters — no public mutators. Used by the Router to provide route handlers with a clean, framework-native request object rather than raw globals.

## Responsibilities

- **Immutable encapsulation** of HTTP method, URL path, query string, `$_GET` data, route path parameters (injected during dispatch), and `$_POST` body data.
- **Static factory via `fromGlobals()`** — reads the current server state at construction time and normalises URL paths to a single leading slash with no trailing slash.

### Supported Public Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `__construct(string $method, string $path, string $queryString = '', array $query = [], array $params = [], array $postBody = [])` | — | Immutable value-object constructor (named-args) |
| `static fromGlobals(): self` | `self` | Class that creates a Web instance directly reads current `$_SERVER['REQUEST_METHOD']`, `$_SERVER['REQUEST_URI']`, `$_GET`, and `$_POST` state |
| `path(): string` | `string` | URL path segment without query (e.g., `/users/42`) — single leading slash, no trailing slash |
| `method(): string` | `string` | Normalised HTTP method in uppercase ('GET', 'POST', 'PUT', 'DELETE', 'PATCH') |
| `queryString(): string` | `string` | Raw query string without the leading ':' character |
| `query(): array` | `array` | All query parameters (from `$_GET`) as an associative array |
| `params(): array` | `array` | Route path parameters filled by the dispatcher (e.g., `['id' => 42]`) |
| `post(): array` | `array` | Raw `$_POST` data as an associative array |
| `isGet(): bool`, `isPost(): bool`, `isPut(): bool`, `isDelete(): bool`, `isPatch(): bool` | `bool` | Boolean shortcuts for the current HTTP method |
| `param(string $name, mixed $default): mixed` | mixed | Shortcut for `$this->params()[$name]` with optional fallback default (route path parameter) |
| `queryParam(string $name, mixed $default): mixed` | mixed | Shortcut for `$this->query[$name]` with optional fallback default (individual query string value) |
| `postParam(string $name, mixed $default): mixed` | mixed | Shortcut for `$this->postBody[$name]` with optional fallback default (individual post body field) |

## Architecture

### Internal Storage (private readonly properties)

| Property | Type | Source |
|----------|------|--------|
| `$method` | string | Upper-cased value of `$_SERVER['REQUEST_METHOD']` or `'GET'` as default | 
| `$path` | string | URI path without query, normalised to one leading slash, no trailing slash |
| `$queryString` | string | Raw query portion of `$_SERVER['REQUEST_URI']`, stripped of the initial '?' character |
| `$query`  | array | Value of `$_GET` (when provided explicitly) or an empty array | 
| `$params` | array | Route path parameters injected during dispatch, merged from constructor arguments | 
| `$postBody` | array | Value of `$_POST` (from global state at construction) or an empty array from constructor args |

### Construction Flow

`Web::fromGlobals()` is the standard entry point; it performs three normalisation steps before creating a new instance:

1. **Read method** — extracts `$_SERVER['REQUEST_METHOD']`, upper-cases it; defaults to `'GET'`.
2. **Parse path + query string** — splits `$_SERVER['REQUEST_URI']` on the first '?' character into `$uri` and `$query_string`.
3. **Normalise** — strips any initial slashes, prepends a single leading slash, then right-trims any trailing slashes; if the result would be empty the path is set to `'/'.

### Internal Helpers

| Method | Arguments | Access | Purpose |
|--------|-----------|--------|---------|
| `parseQueryString(string $qs): array` | `$qs` — raw query string without leading `'?'` character | `private static` | Splits on '&', then '=' on each pair, URL-decodes both key and value; returns an associative array |

## Usage Example — Handler Pattern

```php
$router->get('/users/{id}', function (Web $req): Response {
    // Access route path parameters:
    // `$req->params()` → ['id' => 42]
    $userId = $req->param('id');     // shortcut: same as $req->params()['id']

    // Access query parameters:
    // `$req->query()` → ['page' => '1', 'sort' => 'name']
    $page = $req->queryParam('page', 0);   // int or fallback default

    // Access post body in POST requests:
    if ($req->isPost()) {
        $email = $req->postParam('email'); // string field from $_POST['email']
    }

    return Response::html('<h1>User ' . e($userId) . '</h1>');
});
```

## Limitations

- **No header or server variable access** — the Web class only wraps method, path, query string `query params`, route path parameters, and post body data. There is no mechanism to read HTTP headers (Content-Type, Authorization, etc.) or `$_SERVER` beyond the two values used for construction (`_REQUEST_METHOD`, `_REQUEST_URI`).
- **No file upload representation** — `__FILES` is never read; code that needs upload information must access $_FILES directly.
- **No cookie access** — `$_COOKIE` is not included in this value object; if needed, use `$request->query()` which reflects the raw query from the current HTTP request state rather than being a separate global state.

## Future Enhancements

- Add a `header(string $name)` method to allow reading individual headers (Content-Type, Authorization, etc.) as needed by middleware and plugins.
- Add file upload support that wraps `$_FILES` in a structured representation with validation helpers.
- Provide more convenience methods for common use cases such as CSRF token extraction from hidden form fields.

(End of page 143)

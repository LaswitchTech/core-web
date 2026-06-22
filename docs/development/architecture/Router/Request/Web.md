# Web Request Class

## Overview

The `Web` class is an immutable value object representing a single HTTP request. It is constructed from global state (`$_GET`, `$_POST`, `$_COOKIE`, `$_FILES`, `$_SERVER`) and exposes typed getters for the most common request attributes — uri, method, headers, content type, body, query parameters, cookies, and file uploads. It is used by the Router to provide route handlers with a clean, framework-native request object rather than raw globals.

## Responsibilities

- **Immutable encapsulation of HTTP request data** — all values are read once at construction and never mutated afterward.
- **Header access** via `header()`, which normalizes case (case-insensitive lookups on the original array) and returns `null` when no header is present.
- **Content-type derivation** from the `Content-Type` server entry or a default of `'application/octet-stream'`.
- **Body decoding** — parses `$_POST` body content by inspecting Content-Type (JSON decodes to associative array; x-www-form-urlencoded merges into post data).
- **Query parameter access** via `query()`, with an opt-in type coercion argument (`int`, `float`, `bool`).
- **Cookie and file upload accessors** returning the raw global values.

### Supported Accessor Methodss

| Method | Return Type | Description |
|--------|-------------|-------------|
| `uri()` | string | Request URI path (e.g., '/users/me') |
| `method()` | string | HTTP method in uppercase ('GET', 'POST', 'PUT', etc.) |
| `header(string)` | ?string | Specific header with case-insensitive lookup |
| `contentType()`  | string | Inferred MIME type of request body (default octet-stream) |
| `body()`  | mixed | Decoded raw POST/PUT/PATCH payload as an associative array or JSON object |
| `query(string, ?type)` | mixed | Single query parameter with optional int/float/bool type coercion; returns null when not present |
| `cookies()` | array | All cookies from $_COOKIE in associative array form |
| `files()`  | array | Upload information from $_FILES as structured upload metadata |

## Architecture

### Internal Structure
`Web` class uses the immutable value object pattern: all state is constructed at instantiation via a static factory and accessible only through typed getters (no public mutators). The private readonly fields are populated once from raw HTTP globals.

### Method Signature Summary

Static Constructor:

```php
static ::fromGlobals(): Web // creates instance from \$_GET, \$\\_POST, etc.
```

Getter methods available on created instances:

| Getter | Return Type | Description |
|--------|-------------|-------------|
| `uri()`  | string     | Request URI path (e.g., '/users/me') |
| `method() | string     | Upper-case HTTP method ('GET', 'POST', etc.) |
| `header(string)` | ?string | Specific header value with case-insensitive lookup | 
| `contentType()`   | string      | Detected request MIME type (defaults to octet-stream) |
| `body(  mixed      Decoded POST/PUT/PATCH payload as associative array or object from JSON content |
| `query(string, ?string)` | mixed Single query parameter with optional int/float/bool coercion; null when absent |
| `cookies()`  | array        All cookies from \$_COOKIE in associative form | 
| `files()`   array         Upload information from \$_FILES as structured metadata |

### Request Accessor Details

Headers use the **normalize key** (hyphens preserved, first letter of each segment capitalized) for case-insensitive lookups — e.g., `'content-type' → 'Content-Type'` works with any server-provided casing (`CONTENT_TYPE`, `Http_Content_Type`).

Query parameters are retrieved from `$_GET` with an optional type coercion. For integer or float types, the method returns the native PHP int/float value; for boolean strings ('1', 'true', 'yes') coerce to true, others falsy; if absent it returns null. When multiple query keys share the same name only the last one is returned (single-value mode); multi-value arrays are not supported by this single accessor method but `$_GET` directly contains the full data.

### Usage Example — Handler Pattern

```php
$router->post('/profile', static fn($req) => {
    // Typed access to common request values:
    $contentType = $req->contentType();     // string | 'application/json'
    $userId = (int)$req->param('user_id');  | int type cast from query/uri params
    
    // Raw header access with case-insensitivity:
    $authHeader = $req->header('authorization);  | ?string
    $xForwardedFor = $req->header('x-forwarded-for');  | ?string
});

// Multi-value parameter support (if \$_GET['tags'] = ['php', 'framework']):
foreach ($req->query('tags') as $tag) { /* ... */ }
```

### Example: Complete Request Inspection Pattern

```php
$router->any('/debug/echo', function(Web $request): Response {
    return Response::json([
        'uri'       => $request->uri(),
        'method'    => $request->method(),
        'content_type'  => $request->contentType(),
        'headers'   => $this->serverToHeadersMap($_SERVER), 
        'body'      => json_encode($request->body()),  
        'query_params'  => $request->queryParams() ?? [], 
        'cookies'     => $request->cookies(), 
        'files'      => count($request->files()) ? array_map(function ($f) { return ['name' => $f['name']]; }, $request->files()) : [],
    ]);
});
```

## Limitations

- **No multi-value query parameter support** via the single `query()` getter. While `$_GET` may contain arrays for repeated keys (e.g., `?tags=php&tags=lisp`), this accessor always returns a scalar string or coerced value, discarding the array form.
- **Body decoding is naive** — JSON-only parsing with no stream-based reader or size limits; large bodies are decoded in-memory via json_decode(). The content-type detection relies solely on `$_SERVER['CONTENT_TYPE']`, which can be absent for GET requests (where body reading should return empty/`null`).
- **Raw access to raw globals** — cookies and file uploads expose the raw \$_COOKIE and \$_FILES data without any sanitization or validation. Extensions must apply their own validation logic before trusting uploaded files.
- **No PSR-7 compatibility** — the interface is framework-specific (`uri()`, `body()`, `method()`, etc.) and does not implement PSR-7's ServerRequestInterface, meaning it cannot interoperate with middleware expecting that contract without a wrapper.

## Future Enhancements

- Add `query(string|array|null $key = null)` overloaded to accept an array key list for batch multi-value query parameter retrieval (e.g., `$req->query(['tags', 'filters'])`).
- Support PSR-7 ServerRequestInterface so the framework's response can interoperate with middleware libraries and adapters. 
Body decoding should support multipart/form-data in addition to JSON content types, allowing full parsing of file uploads from POST bodies directly through the request object rather than via raw $_FILES access. Add stream-based body reading for large payloads.
- Built-in cookie validation (signed, encrypted) and CSRF token validation utilities accessible from the Web instance itself rather than requiring separate middleware.
- Response caching headers via a `cacheControl(string)` or TTL getter so extensions can set HTTP cache headers declaratively.

# Response Component

## Overview

The `Response` class is a minimal, immutable HTTP response value object returned by route handlers across the framework (WEB mode) or CLI dispatchers. It encapsulates status code, body content, and optional headers, providing static factory constructors for every common response pattern so that handler code stays declarative rather than imperative.

## Responsibilities

- **Encapsulation** of HTTP status code, raw body string, and an optional associative header array.
- **Immutable construction** — all state is set at instantiation; no public mutators exist.
- **Static factory methods** for the most frequent response types (HTML, JSON, text, redirect, stream output).
- **Response serialization** to a PSR-style `getBody()` that returns the raw body string ready for echoing or buffering.

### Supported Response Types

Each factory method produces an identical immutable `Response` with the same internal fields but different defaults:

| Factory Method      | Status | Body Format          | Content-Type           |
|---------------------|--------|----------------------|------------------------|
| `html(string)`    | 200    | `<h1>...</h1>`       | `text/html`           |
| `json(mixed)`     | 200    | `json_encode()`      | `application/json`    |
| `ok()`              | 200    | (empty)              | —                     |
| `created(string)` | 201    | user-provided text   | —                     |
| `notFound(string)`| 404    | `<h1>404</h1>`       | `text/html`           |
| `forbidden(string)`| 403   | `<h1>403</h1>`       | `text/html`           |
| `methodNotAllowed()`| 405  | `<h1>405</h1>`       | `text/html`           |
| `unauthorized(string)`| 401 | `<h1>401</h1>`     | `text/html`           |
| `redirect(int, int)`| 3XX   | (empty)              | `Location: <url>`     |
| `stream(string)`    | 200   | stream-ready content | —                     |
| `text(string, int)` | varies| raw text body       | `text/plain`          |

## Architecture

### Internal Structure

The Response class uses three private readonly fields established at construction time and accessible only through getters:

- **`$statusCode: int`** — HTTP status code (200 default).
- **`$headers: array<string,string>`** — associative header name → value map, initialized empty.
- **`$body: string`** — the final response body; set once at construction time.

All factory methods follow the same internal pattern: they instantiate a new Response with the requested status code, set any special headers (e.g., `Location` for redirects), apply an appropriate Content-Type header when content is returned (not for redirects or plain-ok responses), encode JSON via json_encode() if the payload isn't already a string, then return `$this`.

### Method Signature Summary

```php
final class Response {
    private int $statusCode;          // HTTP status code, set at construction
    private array $headers;            // associative header name → value map
    private string $body;              // response body content, immutable
}
```

Static factory constructors:

| Method | Arguments | Returns | Purpose |
|--------|-----------|---------|---------|
| `html(string)` | HTML content | Response 200/4xx with HTML body | Standard HTML responses for pages and error pages |
| `json(mixed)` | PHP value (auto-encodes) | Response 200 | API/json endpoints returning structured data |
| `ok()` | none | Response 200, empty body | Simple confirmation response (no content returned) |
| `created(string)` | string text | Response 201 with body | Resource creation confirmation |
| `notFound(string)` | string message | Response 404 with HTML error page | Missing routes/resources |
| `forbidden(string)` | string message | Response 403 with HTML | Access denied scenarios |
| `methodNotAllowed()` | none — | Response 405 with HTML | Request method not supported on route |
| `unauthorized(string)` | string message | Response 401 with HTML authentication required | Unauthenticated access |
| `stream(int)` | target HTTP status (3XX) + URL | Response 3XX with Location header | Permanent redirects or browser redirections |
| `redirect()` | status code, URL | Response 3XX via Location header | Standard HTTP redirects (301, 302, etc.) |
| `text(string, int)` | text body + optional status | Response with text/plain body | Plain-text responses for CLI output or simple APIs |

### Usage in Handler Code

Route handlers return a Response by calling one of the static factories:

```php
$router->get('/user/{id}', function($req) {
    $user = getUserById($req->param('id'));
    if ($user === null) {
        return Response::notFound("User not found");
    }
    return Response::json(['name' => $user['name'], 'email' => $user['email']]);
});

$router->post('/register', function($req) {
    registerUser($req->post()); // side-effect only
    return Response::redirect(302, '/dashboard');
});
```

### Response Flow Through the Application

The response travels through a fixed chain during request processing:

| Step | Action | Detail | Handler returns a Response → | | `Bootstrap` or Router receives it → | Passes to framework output layer (echo stream or buffer) → | Headers are set on PHP's native headers, then echoed/streamed to the client. |
|------|--------|--------|---|---|---|---|

### Example: Error Handling Response Chain

```php
// When a route throws an exception during dispatch:
try {
    $response = $handler($request);
} catch (\InvalidArgumentException $e) {
    $response = Response::forbidden($e->getMessage()); // 403
} catch (\RuntimeException $e) {
    $response = Response::text("Internal error", 500);
}

// The framework then outputs headers + body to the client.
```

### Example: API Endpoint Pattern

```php
$router->get('/api/users', function() {
    return Response::json(['users' => []]);     // 200, application/json
});

$router->post('/api/users', function($req) {
    createUser($req->post());                    // side-effect
    return Response::created('User created');    // 201
});

$router->delete('/api/users/{id}', function($req) {
    deleteUser($req->param('id'));               // side-effect
    return Response::ok();                       // 200, no body
});
```

## Limitations

- **Content-Type negotiation** is manual; factory methods set defaults but there is no automatic sniffing or MIME-type mapping for file downloads. Extension code must explicitly call the appropriate factory method to set correct headers.
- **No chunked transfer support** — Response bodies are always the full string available at construction time. Streaming is achieved by setting `Transfer-Encoding: chunked` header manually (future work).
- **One-shot construction** — headers and body cannot be modified after instantiation; extensions seeking to inject additional headers must create a new Response from the old one.

## Future Enhancements

- Add a mutable builder API (`Response::create()->withHeader()->withBody()->build()`) for cases where headers evolve after content is determined (e.g., compression or signing).
- Support PSR-7 compatible interface so Responses can interoperate with middleware libraries and adapters.
- Built-in Content-Disposition header support for file downloads.
- Automatic cookie serialization via `Response::withCookies(array)`.

# Response Class

## Overview

The `Response` class is a final value object representing an HTTP or CLI response. It stores a status code (default 200), the body content (a string), and an optional associative array of headers. Every instance is created via either direct constructor usage or one of the static factory methods. There are no public constructors for end users that bypass the factories — all creation goes through `new Response($code)` where `$code` defaults to 200, or through a named factory.

## Responsibilities

- **Encapsulation** of HTTP status code, body string, and an associative header name → value map.
- **Immutable construction with chainable setters** — state is set at instantiation but can be modified via `with*` chainable methods that return `$this`. Each setter mutates the current instance in-place rather than creating a copy.
- **Static factory methods** for common response patterns (JSON, HTML, text, redirect, and standard error responses).
- **Output to stream** via `send()`, which is idempotent (safe to call multiple times).

### Supported Factory Methods

| Factory Method | Arguments | Status | Content-Type | Returns |
|----------------|-----------|--------|--------------|---------|
| `json(mixed $data, int $code = self::STATUS_OK)` | JSON-serializable value | 200 (or `$code`) | `application/json; charset=UTF-8` | `Response` |
| `html(string $body, int $code = self::STATUS_OK)` | HTML markup string | 200 (or `$code`) | `text/html; charset=UTF-8` | `Response` |
| `text(string $body, int $code = self::STATUS_OK)` | Raw text body | 200 (or `$code`) | `text/plain; charset=UTF-8` | `Response` |
| `redirect(string $url, int $code = 302)` | Target URL + optional status code | 302 (or `$code`)| `Location: <url>` | `Response` |
| `notFound(string $body = '<h1>404 Not Found</h1>')` | Optional HTML body | 404 | `text/html; charset=UTF-8` | `Response` |
| `methodNotAllowed()` | — | 405 | `text/html; charset=UTF-8` | `Response` |
| `internalError(string $message = 'Internal Server Error')` | Optional message | 500 | `text/html; charset=UTF-8` | `Response` |

Note: Each factory method creates a **new** Response instance with the specified body and headers, then returns it. The default status code is `200 OK` for all methods except where noted (`redirect` defaults to `302`, `notFound` to `404`, `methodNotAllowed` to `405`, `internalError` to `500`).

## Architecture

### Internal Storage (private fields)

```php
final class Response {
    private int    $statusCode;              // HTTP status code (200 default)
    private string $body;                    // The response body string
    private array  $headers = [];            // Associative header name → value map
    private bool   $sent = false;            // Guard against duplicate send() calls
    
    /** @var array<int,string> statusMessages indexed by code */
    private static array $statusMessages = [];  // Lazily initialized cache of standard messages
}
```

Status code `100 Continue` maps to message `'Continue'`, `200 OK` → `'OK'`, `201 Created` → `'Created'`, `301 Moved Permanently` → `'Moved Permanently'`, `302 Found` → `'Found'`, `304 Not Modified` → `'Not Modified'`, `307 Temporary Redirect` → `'Temporary Redirect'`, `404 Not Found` → `'Not Found'`, `405 Method Not Allowed` → `'Method Not Allowed'`, `500 Internal Server Error` → `'Internal Server Error'`. Additional codes are populated lazily via the `initStatusMessages()` method at first access to any of these lookup methods.

### Constructor & Instantiation

```php
public function __construct(
    int $statusCode = self::STATUS_OK  // 200
) {}
```

The constructor defaults to status 200 with an empty body and empty headers. Users can instantiate a Response directly: `$response = new Response(404)` creates a response with status code 404 but no body content.

### Method Signature Summary

| Method | Arguments | Return Type | Description |
|--------|-----------|-------------|-------------|
| `statusCode(): int` | — | `int` | Accessor for the status code |
| `statusMessage(): string` | — | `string` | Human-readable message for the code (e.g., 'OK', 'Not Found') |
| `body(): string` | — | `string` | Returns the body content of this Response instance |
| `headers(): array<string,string>` | — | `array` | Returns a copy of all headers |
| `getHeader(string $name): ?string` | HTTP header name | `?string` | Gets a single header value by name (case-insensitive lookup) |
| `hasHeader(string $name): bool` | HTTP header name | `bool` | Checks if the response has a specific header set |
| `isSent(): bool` | — | `bool` | Indicates whether send() has already been called on this instance |
| `withStatus(int $code): self` | Status code | `self` (chainable) | Sets status code, returns `$this` |
| `withBody(string $content): self` | Body string | `self` (chainable) | Replaces body content, returns `$this` |
| `withHeaders(array<string,string> $headers): self` | Header array | `self` (chainable) | Overwrites all headers, returns `$this` |
| `setHeader(string $name, string $value): self` | Name + value | `self` (chainable) | Sets a single header, returns `$this` |

### send() Method

The `send(): void` method outputs HTTP status line, headers, and body. It is **idempotent** — calling it twice does nothing on the second call. The implementation also checks that PHP is not running under CLI SAPI (`PHP_SAPI !== 'cli'`) before emitting any `header()` calls, because there are no HTTP headers to target when running from the command line.

```php
$response = Response::json(['message' => 'ok']);
$response->send();  // Outputs headers + body
$response->send();  // No-op — already sent ($sent === true)
```

### Generated Output Examples

Root deployment (`$subdir = ''`):

```apache
RewriteEngine On
# Serve existing files and directories directly
RewriteCond %{REQUEST_FILENAME} !-f  
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA, L]
```

Subdirectory deployment (`$subdir = 'myapp'`):

```apache
RewriteEngine On
# Serve existing files and directories directly
RewriteCond %{REQUEST_FILENAME} !-f  
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^myapp/(.*)$ myapp/index.php [QSA, L]
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

# Response

## Purpose

The Response component is a lightweight response representation — an HTTP or CLI response encapsulating status code, body content, and headers.

## Responsibilities

_(none)_

## Public API

### Class Constants

| Constant                | Value | Description              |
| ----------------------- | ----- | ------------------------ |
| `STATUS_CONTINUE`       | `100` | Continue                 |
| `STATUS_OK`             | `200` | OK                       |
| `STATUS_CREATED`        | `201` | Created                  |
| `STATUS_ACCEPTED`       | `202` | Accepted                 |
| `STATUS_NOT_FOUND`      | `404` | Not Found                |
| `STATUS_METHOD_NOT_ALLOWED` | `405` | Method Not Allowed     |
| `STATUS_INTERNAL_ERROR` | `500` | Internal Server Error    |

### Constructor

```php
__construct(int $statusCode = self::STATUS_OK): void
```

### Instance Getters

| Signature                            | Return Type           | Description                          |
| ------------------------------------ | --------------------- | ------------------------------------ |
| `statusCode(): int`                  | `int`                 | Current HTTP status code             |
| `statusMessage(): string`            | `string`              | Human-readable status message        |
| `body(): string`                     | `string`              | Response body content                |
| `headers(): array`                   | `array<string,string>`| All response headers                 |
| `getHeader(string $name): ?string`   | `?string`             | Header value (case-insensitive)      |
| `hasHeader(string $name): bool`      | `bool`                | Whether a header exists              |
| `isSent(): bool`                     | `bool`                | Whether the response has been sent   |

### Instance Mutators (chainable `self`)

All mutators modify the current instance and return `$this` for chaining.

| Signature                          | Return Type | Description                  |
| ---------------------------------- | ----------- | ---------------------------- |
| `withStatus(int $code): self`      | `self`      | Set HTTP status code on this instance, returns `$this` |
| `withBody(string $content): self`  | `self`      | Set response body on this instance, returns `$this` |
| `withHeaders(array $headers): self`| `self`      | Replace all headers on this instance, returns `$this` |
| `setHeader(string $name, string $value): self` | `self` | Set a single header value on this instance, returns `$this` |

### Instance Send

```php
send(): void
```
- **Idempotent** — returns immediately if `$this->sent` is already `true`.
- Skips all `header()` calls when `PHP_SAPI === 'cli'`.
- In WEB mode, sends `HTTP/1.1 <code> <message>` status line (status code and message come from `statusMessage()`).
- Calls `header("{$name}: {$value}", false)` for each stored header (replace mode).
- Echoes the body via `echo`.

### Static Factories

| Signature                                      | Return Type | Description                  |
| ---------------------------------------------- | ----------- | ---------------------------- |
| `json(mixed $data, int $code = 200): self`     | `self`      | JSON response                |
| `html(string $body, int $code = 200): self`    | `self`      | HTML response                |
| `notFound(string $body = ...): self`           | `self`      | 404 Not Found                |
| `methodNotAllowed(): self`                     | `self`      | 405 Method Not Allowed       |
| `internalError(string $message = ...): self`   | `self`      | 500 Internal Server Error    |
| `redirect(string $url, int $code = 302): self` | `self`      | Redirect response            |
| `text(string $body, int $code = 200): self`    | `self`      | Plain-text response          |

### Static Status Helpers

| Signature                                 | Return Type           | Description                |
| ----------------------------------------- | --------------------- | -------------------------- |
| `getStatusMessage(int $code): ?string`    | `?string`             | Look up a status description |

## Internal Architecture

### Storage Fields

| Field | Type | Visibility | Purpose |
|-------|------|------------|---------|
| `$statusCode` | `int` | private (constructor-promoted) | Current HTTP status code |
| `$headers` | `array` | private | Response header storage, keyed by header name (PHPDoc-refined as `@var array<string,string>`) |
| `$body` | `string` | private | Response body content |
| `$sent` | `bool` | private | Send guard — repeated calls to `send()` are no-ops |

All four fields are **not** initialized via the constructor — only `$statusCode` is a constructor-promoted parameter (set from the argument). The remaining three (`$headers`, `$body`, `$sent`) are declared at class scope with default values (`[]`, `''`, `false` respectively) and do not appear in the constructor parameter list.

### Status Message Map

```php
private static array $statusMessages = []
```

- Populated lazily by `initStatusMessages()` the first time it is called.
- Contains 11 entries: 7 status codes (100, 200, 201, 202, 404, 405, 500) for which constants exist plus 4 supplemental codes (301, 302, 304, 307).
- `statusMessage()` delegates to this map; returns `'Unknown'` as sentinel when a code has no entry.

### Header Lookup Implementation

Both `getHeader()` and `hasHeader()` use manual iteration with `strtolower()` comparison — the `$headers` array is **not** stored in lower-case internally. This means lookups are O(n) and case-insensitive despite the underlying storage being case-sensitive.

### Factory Pattern

All static factories (`json()`, `html()`, `notFound()`, `methodNotAllowed()`, `internalError()`, `redirect()`, `text()`) follow the same pattern:
1. Instantiate a new `Response` with a status code.
2. Assign headers/body directly to `$response->headers[...]` and/or `$response->body`.
3. Return the instance to the caller (never assigned to any property).

### send() Method

- Skips all PHP `header()` calls when `PHP_SAPI === 'cli'`.
- Emits HTTP response line in format: `"HTTP/1.1 <code> <message>"`.
- Iterates `$headers` and calls `header($name: $value, false)` for each (replace mode).

## Dependencies

---

## Lifecycle

---

## Future Enhancements

---

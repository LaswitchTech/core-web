# Routing & Requests

The Router is **mode-aware**: in WEB mode it dispatches HTTP requests to
route handlers; in CLI mode it dispatches argv to command handlers. The same
class serves both, so route-registration code looks almost identical either
way.

Routes and commands are registered during boot, through the
`router.register` hook — see [Creating Extensions](09-creating-extensions.md)
for the full plugin wiring. Inside a hook handler you receive the `Router`
instance in the hook context:

```php
public static function registerRoutes(array $context): void
{
    $router = $context['router'];
    // ...
}
```

## Web Routes

```php
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Response;

$router->get('/users/{id}', function (Web $req): Response {
    return Response::html('<p>User ' . $req->param('id') . '</p>');
});

$router->post('/users',     function (Web $req): Response { /* ... */ });
$router->put('/users/{id}', function (Web $req): Response { /* ... */ });
$router->patch('/users/{id}', function (Web $req): Response { /* ... */ });
$router->delete('/users/{id}', function (Web $req): Response { /* ... */ });
```

### Path Parameters

- `{name}` — matches exactly one path segment.
- `{...name}` — catch-all; matches the rest of the path. Must be the **last**
  segment.

```php
$router->get('/files/{...path}', function (Web $req): Response {
    $relative = $req->param('path'); // e.g. "docs/guide/index.md"
    return Response::text('file: ' . $relative);
});
```

### The Web Request Object

`Web` is an immutable value object built from superglobals.

| Method | Returns |
|--------|---------|
| `path()` | Request path (e.g. `/users/42`). |
| `method()` | HTTP method, uppercase. |
| `params()` / `param($name, $default = null)` | Matched path parameters. |
| `query()` / `queryParam($name, $default = null)` | Query-string values. |
| `post()` / `postParam($name, $default = null)` | POST body values. |
| `queryString()` | Raw query string. |
| `isGet()` / `isPost()` / `isPut()` / `isPatch()` / `isDelete()` | Method checks. |
| `files()` / `file($name)` / `hasUploadedFile($name)` / `getUploadedFile($name)` | Uploaded files. |

```php
$router->get('/search', function (Web $req): Response {
    $q = $req->queryParam('q', '');
    return Response::html('Search: ' . htmlspecialchars($q));
});
```

### The Response Object

```php
Response::html('<h1>Hi</h1>');                  // 200, text/html
Response::text('plain text', 404);              // status code + body
Response::json(['ok' => true]);                 // 200, application/json
Response::redirect('/login');                   // 302
```

For anything else, build it directly:

```php
$response = new Response(201);
$response->setHeader('Location', '/users/7');
$response->withBody('created');
```

### 404s

If no registered route matches the method + path, the framework returns a
404 automatically.

## CLI Commands

Commands are registered with a `namespace.subcommand` name:

```php
use Laswitchtech\CoreWeb\Router\Request\Cli;
use Laswitchtech\CoreWeb\Router\Response;

$router->command('report.daily', function (Cli $req): Response {
    return Response::text("daily report for " . ($req->arg(0) ?? 'today') . "\n");
});
```

Invocation:

```sh
./cli report.daily 2026-09-09
```

### The Cli Request Object

| Method | Returns |
|--------|---------|
| `command()` | The command name (e.g. `report.daily`). |
| `args()` | Positional arguments, in order. |
| `arg($index, $default = null)` | One positional argument. |
| `flags()` | All `--flag` values. |
| `flag($name, $default = null)` | One flag value. |

```php
$router->command('user.import', function (Cli $req): Response {
    $file  = $req->arg(0);              // ./cli user.import data.csv
    $dry   = (bool) $req->flag('dry');  // ./cli user.import data.csv --dry
    return Response::text("import {$file} (dry run: " . ($dry ? 'yes' : 'no') . ")\n");
});
```

Command output is the response body; the status code becomes the process
exit code (0 = success).

## Dispatch Flow (WEB mode)

```
Request
  → match method + path against registered routes
  → inject path parameters into the Web request
  → call handler(Web $req): Response
  → emit status, headers, body
```

Handlers must return a `Response`. Anything thrown inside a handler is
surfaced according to `app.debug` (detailed error when `true`, minimal
output when `false`).

# Getting Started

This chapter takes you from an empty directory to a running Core-Web
application, both as a web app and as a CLI.

## Requirements

- PHP **8.2** or newer
- Composer
- No web server configuration required to start (the PHP built-in server
  works as-is; the framework also generates `config/router/` files for
  Apache, Nginx, and IIS when you run `core.install`)

## 1. Create the Application Skeleton

Use the built-in scaffolder from any directory that already has the
framework installed, or from a fresh project:

```sh
composer require laswitchtech/core-web
php cli core.init ./my-app
```

This creates:

```
my-app/
├── index.php              # Web entry point
├── cli                    # CLI entry point (executable)
├── config/
│   ├── core.cfg           # Application config (JSON)
│   └── local.cfg          # Local overrides (empty {})
├── storage/
│   ├── cache/
│   └── logs/
├── Templates/
│   ├── mail/
│   └── sms/
├── ext/
│   ├── plugins/
│   └── themes/
```

`core.init` never overwrites existing files. Re-run with `--force` to fill in
anything missing without touching what's already there:

```sh
php cli core.init ./my-app --force
```

### The Two Entry Points

Everything runs from these two files. There is no framework-level
configuration to do first.

`index.php` (WEB mode):

```php
<?php declare(strict_types=1);
/* Application entry point */
require_once __DIR__ . "/vendor/autoload.php";
$BOOTSTRAP = new \Laswitchtech\CoreWeb\Bootstrap("WEB");
```

`cli` (CLI mode):

```php
#!/usr/bin/env php
<?php
require_once __DIR__ . '/vendor/autoload.php';
new \Laswitchtech\CoreWeb\Bootstrap('CLI');
```

Both do exactly the same thing: load Composer autoloading, then hand the
process to `Bootstrap`, which initializes config, the container, extensions,
and the subsystem for the requested mode.

## 2. Run the Web App

From the app root, the PHP built-in server is all you need:

```sh
php -S localhost:8000
```

Then open <http://localhost:8000>.

For Apache/Nginx/IIS deployments, run the installer to validate your
environment and generate the router configuration:

```sh
./cli core.install check    # environment summary
./cli core.install run      # generate config/router/{.htaccess,nginx.conf,web.config}
```

## 3. Run the CLI

The CLI is invoked as `./cli <command> <subcommand> [args] [--flags]`.
Core commands available out of the box:

| Command | Purpose |
|---------|---------|
| `core.info` | Smoke test — prints `Core OK` |
| `core.install check` / `run` | Environment check / router config generation |
| `core.init <target>` | Scaffold a new application |
| `core.config show [key]` / `set <key> <value>` / `unset <key>` | Inspect or modify configuration |
| `core.db <subcmd>` | Database utilities (connect, read, create, update, delete, smoke) |
| `core.extension <subcmd>` | Extension management |
| `core.smtp <subcmd>` / `core.sms <subcmd>` | Messaging diagnostics |

Your own commands are registered by plugins — see
[Creating Extensions](09-creating-extensions.md).

## 4. First Page

Core-Web apps register routes and render views through **plugins** (see
[Creating Extensions](09-creating-extensions.md)). A minimal plugin that
registers a route and renders a view looks like this:

`ext/plugins/hello-world/manifest.json`:

```json
{
    "type": "plugin",
    "name": "Hello World",
    "version": "1.0.0",
    "hooks": [
        "router.register::App\\Plugin\\HelloWorld::registerRoutes",
        "renderer.register::App\\Plugin\\HelloWorld::registerRenderer",
        "asset.register::App\\Plugin\\HelloWorld::registerAssets"
    ],
    "autoload": {
        "psr-4": {
            "App\\Plugin\\": "src/"
        }
    }
}
```

`ext/plugins/hello-world/src/HelloWorld.php`:

```php
<?php declare(strict_types=1);

namespace App\Plugin;

use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Request\Web;

final class HelloWorld
{
    public static function registerRoutes(array $context): void
    {
        $router = $context['router'];

        $router->get('/hello/{name}', static function (Web $req): Response {
            return Response::html('<h1>Hello ' . htmlspecialchars($req->param('name')) . '!</h1>');
        });
    }
}
```

Now `http://localhost:8000/hello/world` renders the page.

For rendered views inside a layout (recommended), see
[Rendering](04-rendering.md).

## 5. Verify

```sh
./cli core.info
```

Expected output:

```
Core OK
```

You now have a working application. Next chapters cover each subsystem in
depth.

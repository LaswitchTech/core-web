# Creating Extensions

Extensions are how you add routes, views, assets, helpers, commands, and
engines to a Core-Web application — and how you ship reusable features.
Everything in the framework, including the kernel itself, is wired through
the same extension system.

There are two extension types:

- **Plugin** — code. Registers routes, commands, views, assets, helpers.
- **Theme** — presentation. Provides layouts and styling.

## Directory Layout

Extensions live under `ext/`. Both the kernel and your app have an `ext/`
root; **app extensions override kernel extensions with the same name**.

```
ext/
├── plugins/
│   └── my-plugin/
│       ├── manifest.json        # or extension.json
│       ├── src/                 # PHP classes
│       ├── views/
│       ├── templates/
│       ├── layouts/
│       └── Assets/
│           ├── css/
│           └── js/
└── themes/
    └── my-theme/
        ├── manifest.json
        ├── src/
        ├── layouts/
        └── Assets/
```

## The Manifest

`manifest.json` (or `extension.json`) in the extension root.

| Key | Required | Description |
|-----|----------|-------------|
| `type` | ✅ | `plugin` or `theme`. |
| `name` | ✅ | Human-readable name. Used for dependency resolution and override matching. |
| `version` | ✅ | Semver `X.Y.Z`. |
| `description` | — | Free text. |
| `hooks` | — | List of hook registrations (see below). |
| `layouts` | — | List of layout identifiers this extension provides. |
| `depends` | — | List of extension **names** this one requires. |
| `autoload.psr-4` | — | PSR-4 namespace → directory map for this extension's classes. |
| `kernel-compat` | — | Kernel version constraint (see below). |
| `locked` | — | `true`/`false`. Kernel extensions default to locked; app extensions default to unlocked. |

### Hook Registration Strings

Each entry in `hooks` is either:

- **A callback binding** — `"hook.name::Vendor\\Class::method"`.
  The method is called with the hook's context array when the hook fires.
- **A bare hook name** — `"layout.header"` (no `::`). Registers the hook
  namespace as a placeholder.

The first `::` separates the hook name; the last `::` separates class from
method. Example:

```json
"hooks": [
    "router.register::App\\Plugin\\MyPlugin\\MyPlugin::registerRoutes",
    "renderer.register::App\\Plugin\\MyPlugin\\MyPlugin::registerRenderer",
    "asset.register::App\\Plugin\\MyPlugin\\MyPlugin::registerAssets",
    "helper.register::App\\Plugin\\MyPlugin\\MyPlugin::registerHelpers"
]
```

### `kernel-compat`

Constraints use Composer-style operators:

| Syntax | Meaning |
|--------|---------|
| `^1.0.0` | Same major version as the kernel. |
| `~1.0.0` | Same major and minor; kernel patch ≥ constraint patch. |
| `1.0.0` | Exact match. |
| *(omitted)* | Unconstrained — always compatible. |

Unrecognized patterns are treated as compatible (permissive).

## Loading Order & Rules

1. **Discovery** scans `ext/{themes,plugins}/` in both the kernel and app
   roots. Malformed manifests are skipped with a warning (tolerant).
2. **Deduplication** — an app extension with the same `name` as a kernel
   extension replaces it.
3. **Lifecycle filtering** — only *enabled* extensions proceed (see
   Enable/Disable below).
4. **Dependency check** — fails fast if a `depends` entry can't be resolved.
5. **Topological sort** — dependencies load before dependents.
6. **Autoloading** — PSR-4 maps from every manifest are registered, plus a
   legacy fallback for `Laswitchtech\CoreWeb\Plugin\` and
   `Laswitchtech\CoreWeb\Theme\` namespaces under each `src/`.
7. **Hook registration** — each manifest's hooks are attached to the hook
   registry.

## Enable / Disable

Extension lifecycle state is persisted in `config/extensions.cfg` (falls
back to reading `extensions.json` if present; writes always target
`.cfg`).

- **No file** → all extensions are enabled.
- **File present, empty lists** → all enabled (zero-state = unfiltered).
- **File present with lists** → only extensions whose slug is in the
  matching list (`plugins` or `themes`) are enabled.

The slug is the extension directory name, lowercased.

Manage state through the `core.extension` CLI command rather than hand-editing:

```sh
cli core.extension list                 # all extensions
cli core.extension list plugins         # plugins only
cli core.extension status plugin.my-plugin
cli core.extension disable plugin.my-plugin
cli core.extension enable plugin.my-plugin
```

Targets use the `plugin.<slug>` / `theme.<slug>` form.

## A Complete Minimal Plugin

### `ext/plugins/my-plugin/manifest.json`

```json
{
    "type": "plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Adds a /report route.",
    "autoload": {
        "psr-4": {
            "App\\Plugin\\MyPlugin\\": "src"
        }
    },
    "hooks": [
        "router.register::App\\Plugin\\MyPlugin\\MyPlugin::registerRoutes"
    ]
}
```

### `ext/plugins/my-plugin/src/MyPlugin.php`

```php
<?php declare(strict_types=1);

namespace App\Plugin\MyPlugin;

use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Response;

final class MyPlugin
{
    public static function registerRoutes(array $context): void
    {
        $router = $context['router'];

        $router->get('/report', static function (Web $req): Response {
            return Response::html('<h1>Report</h1>');
        });
    }
}
```

That's a fully working extension. Restart the app (or refresh) and the route
is live.

## The Hook Reference

Hooks fire during bootstrap. Each hook's context array provides specific
objects. A hook handler is a `static` method receiving one `array $context`.

| Hook | When it fires | Context keys |
|------|---------------|--------------|
| `plugin.started` | At the start of the web or cli boot. | `mode` (`web`\|`cli`) |
| `renderer.engine.register` | After core engines are registered, before renderer setup. | `engineRegistry`, `container`, `mode` |
| `renderer.register` | After the renderer + registry are built. | `registry`, `renderer`, `container`, `mode` |
| `router.register` | After the router is created. | `router`, `container`, `mode` |
| `asset.register` | During asset registration. | `registry`, `container`, `mode` |
| `helper.register` | During helper registration. | `registry`, `container`, `mode` |

> **Note:** `mode` is the *lowercased* string (`web`, `cli`) for most hooks.
> Guard your handler for the mode you care about if it only applies to one.

### `router.register`

Receive the `Router`; register HTTP routes and/or CLI commands.

```php
public static function registerRoutes(array $context): void
{
    $router = $context['router'];

    $router->get('/my-page', static fn (Web $req): Response => Response::html('<h1>Hi</h1>'));
    $router->command('my.cmd', static fn ($req): Response => Response::text('done'));
}
```

### `renderer.register`

Receive the renderer `Registry`; register layouts, templates, and views.
See [Rendering](04-rendering.md).

```php
public static function registerRenderer(array $context): void
{
    $registry = $context['registry'];
    $dir = self::pluginDir();

    $registry->add('my.view', 'view', "{$dir}/views/my.php", 'plugin');
}
```

### `asset.register`

Receive the asset `Registry`; register CSS/JS. See [Assets](07-assets.md).

```php
public static function registerAssets(array $context): void
{
    $registry = $context['registry'];
    $dir = self::pluginDir();

    $registry->css('plugins/my-plugin', 'my.css', "{$dir}/Assets/css/my.css", 'plugin');
}
```

### `helper.register`

Receive the helper `Registry`; register helper instances. See
[Helpers](08-helpers.md).

```php
public static function registerHelpers(array $context): void
{
    $context['registry']->register(new MyHelper(), 'plugin');
}
```

### `renderer.engine.register`

Receive the engine `Registry`; register a custom `EngineInterface`.

```php
public static function registerEngine(array $context): void
{
    $context['engineRegistry']->register(new MyEngine());
}
```

### `plugin.started`

A general "I'm up" signal. Useful for warm-ups or diagnostics.

```php
public static function onStarted(array $context): void
{
    // $context['mode'] is 'web' or 'cli'
}
```

## Resolving Framework Services

Inside any hook or route handler, get the DI container to resolve services:

```php
use Laswitchtech\CoreWeb\Bootstrap;

$c = Bootstrap::container();

$renderer = $c->resolve('renderer');
$db       = $c->resolve('database');
$helpers  = $c->resolve('helpers');
```

Most hook contexts also pass `container` directly — use it when available.

## A Minimal Theme

A theme is structurally identical to a plugin but provides layouts and
styling.

### `ext/themes/my-theme/manifest.json`

```json
{
    "type": "theme",
    "name": "My Theme",
    "version": "1.0.0",
    "layouts": ["my.layout"],
    "hooks": [
        "asset.register::App\\Theme\\MyTheme\\MyTheme::registerAssets"
    ]
}
```

### `ext/themes/my-theme/src/MyTheme.php`

```php
<?php declare(strict_types=1);

namespace App\Theme\MyTheme;

final class MyTheme
{
    public static function registerAssets(array $context): void
    {
        $registry = $context['registry'];
        $dir = self::themeDir();

        $registry->css('themes/my-theme', 'theme.css', "{$dir}/Assets/css/theme.css", 'theme');
    }
}
```

Because themes rank **above** plugins and the kernel in asset and renderer
precedence, a theme's CSS and layouts override lower-ranked providers that
register the same scope/name.

## Determining Your Extension's Path

A common helper to resolve the extension's own root directory (works for
both plugins and themes):

```php
private static ?string $dir = null;

private static function pluginDir(): ?string
{
    if (self::$dir === null) {
        // __DIR__ is .../ext/plugins/my-plugin/src
        self::$dir = dirname(__DIR__);
    }
    return self::$dir;
}
```

Use this to build absolute paths for views, templates, and assets.

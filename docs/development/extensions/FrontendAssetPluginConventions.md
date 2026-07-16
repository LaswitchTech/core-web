# Frontend Asset Plugin Conventions

## Purpose

Frontend asset plugins package client-side assets — JavaScript, CSS, and fonts — for inclusion in web pages. Only **CSS** and **JavaScript** are currently supported types in the Asset Registry; fonts may be bundled with a plugin and referenced from CSS but are not registered as an Asset Registry type. Plugins declare dependencies on other extensions via the manifest `depends` field and provide an Asset Provider class (typically a hook callback) that registers the CSS and JavaScript files to emit; layouts then place generated CSS tags in `<head>` and JavaScript tags before `</body>`.

## Plugin Structure

A frontend asset plugin follows this directory layout:

```
ext/plugins/{plugin}/
├── Assets/
│   ├── css/
│   ├── js/
│   └── fonts/
├── src/
└── manifest.json
```

- **`Assets/css/`** — Served CSS files (e.g. `plugin.css`, `plugin.min.css`).
- **`Assets/js/`** — Served JavaScript files (e.g. `plugin.js`, `plugin.min.js`).
- **`Assets/fonts/`** — Font files referenced by the plugin's CSS.
- **`src/`** — PHP source code for the extension, including the Asset Provider class registered via a hook callback.
- **`manifest.json`** — Extension metadata, including `depends` for runtime ordering.

Only the directories needed by a given plugin must exist; unused folders may be omitted entirely. For example, a pure-JS plugin needs only `Assets/js/`, not `Assets/css/` or `Assets/fonts/`.

## Asset Registration

### Provider callback

A frontend asset plugin packages its client-side files (JavaScript, CSS, fonts) under `Assets/`. Core-Web does **not** scan the `Assets/` directory automatically; instead, the plugin supplies a provider callback that — given the current bootstrap mode (`$context['mode']`, lowercase `"web"` or `"cli"`) — resolves the concrete local paths and explicitly registers each asset to emit. Only CSS and JS are currently supported registry types. Registered files are later read by Core-Web when they are compiled or served on a page.

### Canonical Registration API

Assets are registered through the `Asset\Registry` methods `$registry->css()` and `$registry->js()`. Both signatures share the same first five parameters; optional metadata is passed as a sixth argument on JS only:

```php
$registry->css(
    string $scope,      // Extension directory slug (e.g. 'plugins/example')
    string $filename,   // Public leaf filename (e.g. 'example.css')
    string $path,       // Resolved absolute physical path
    int    $provider,   // Entry::PROVIDER_* constant
    int    $priority,   // Output ordering priority
);

$registry->js(
    string $scope,      // Extension directory slug (e.g. 'plugins/example')
    string $filename,   // Public leaf filename (e.g. 'example.js')
    string $path,       // Resolved absolute physical path
    int    $provider,   // Entry::PROVIDER_* constant
    int    $priority,   // Output ordering priority
    array  $defaults = [], // ['default' => true] for single-file JS entries
);
```

**Plugin CSS:**

```php
$registry->css(
    'plugins/example',
    'example.css',
    $absolutePath,
    Entry::PROVIDER_PLUGIN,
    400,
);
```

**Plugin JS with explicit default:**

```php
$registry->js(
    'plugins/example',
    'example.js',
    $absolutePath,
    Entry::PROVIDER_PLUGIN,
    400,
    ['default' => true],
);
```

**Theme CSS:**

```php
$registry->css(
    'themes/example-theme',
    'theme.css',
    $absolutePath,
    Entry::PROVIDER_THEME,
    300,
);
```

### Migrating a legacy registration

The old unsupported registration form passed four positional arguments with the scope acting as a freeform name:

```php
$registry->js(
    'example',
    $absolutePath,
    Entry::PROVIDER_PLUGIN,
    400,
);
```

This form is obsolete and must be migrated to:

```php
$registry->js(
    'plugins/example',
    'example.js',
    $absolutePath,
    Entry::PROVIDER_PLUGIN,
    400,
);
```

Migration steps:

1. **Change the scope** from a freeform name to `plugins/{slug}` or `themes/{slug}`.
2. **Pass the public leaf filename** as the second argument (e.g., `'example.js'`).
3. **Keep the resolved physical path** as the third argument (`$absolutePath`), obtained via `realpath()` at provider-call time.
4. **Keep provider and priority metadata** unchanged — `Entry::PROVIDER_PLUGIN` / `Entry::PROVIDER_THEME` and the numeric priority.
5. **Mark at most one entry per type and scope as default** by adding `['default' => true]` to exactly one JS registration in that `(type, scope)` pair.
6. **Remove extension-defined asset delivery routes.** All public asset delivery must flow through the framework's `/css` and `/js` aggregate routes; extensions must not define their own public paths for this purpose.

### Validation and delivery security

The registry validates extension scopes and filenames at registration time:

* Extension scope must have exactly two path segments separated by a single `/`.
* The first segment of the scope must be `plugins` or `themes`.
* The second segment (extension slug) may contain only lowercase letters, digits, underscores (`_`), and hyphens (`-`).
* The filename must be a leaf filename — no directory separators permitted.
* The filename cannot contain `/`, `\`, null bytes, `.`, or `..`.

Invalid registrations throw `InvalidArgumentException` before the entry is stored.

### Guard rails in `url()`

- Only `Entry::TYPE_CSS` (`'css'`) and `Entry::TYPE_JS` (`'js') are accepted; any other type yields `''`.
- `$scope === 'kernel' || $scope === 'app'` → two-segment canonical: `/type/scope`.
- Empty `$entry->file` (after trim) → `''` (the route has nothing to serve).

### Manifest declarations vs. runtime registration

An extension's manifest records only structural metadata (`type`, `name`, `version`, `depends`, `hooks`, `layouts`, `autoload`). Neither the current manifest schema nor the discovery process infers which asset files a plugin distributes; all assets in `Assets/js/` and `Assets/css/` may or may not be loaded on any given page.

The **only** mechanism for actually registering an asset file is the runtime call to `$registry->css()` or `$registry->js()` inside an `asset.register` hook callback — at no point does the framework scan a plugin's `Assets/` directory, read it from a manifest field, or emit it automatically.

## Required Dependencies

An extension declares its required dependencies as an array of extension names in the `depends` field of `manifest.json`. The framework enforces the following rules:

* Every name listed in `depends` must be discovered and enabled; a missing dependency stops bootstrap.
* A plugin is never loaded until all extensions it depends on are registered first — `depends` defines ordering constraints between extensions, not between individual files within an extension.
* The framework performs no version resolution or semantics checking against the values inside `depends`; version constraints are not supported by this field.
* Circular dependencies between extensions stop bootstrap — cyclically dependent plugins are never loaded.

Example:

```json
"depends": [
    "jquery"
]
```

## Optional Integrations

The current manifest format has no `optional-dependencies` field — optional vendor integrations cannot be declared within the same extension's `depends`. Every required integration must instead use a separate plugin.

For example, if an extension requires both `datatables` and `datatables-bootstrap`, those would be two distinct extensions:

* **datatables** — provides the DataTables library
* **datatables-bootstrap** — adds Bootstrap-style rendering on top of DataTables

The `datatables-bootstrap` plugin declares its own required dependencies:

```json
"depends": [
    "datatables",
    "bootstrap"
]
```

## Deterministic Load Order

Assets load across two phases, each with deterministic ordering:

### 1. Extension dependency order

Extensions are registered in topological order of their `depends` declarations before any asset callback fires. Plugins that depend on other plugins always register after those dependencies.

### 2. Asset Registry order

Within an extension's `asset.register` callback the framework sorts output using three tie-breaking keys, applied **in this sequence**:

1. **priority ascending** — lower numeric priority renders first
2. **registration order ascending** — earlier entry registration wins ties
3. **name ascending** — case-insensitive filename as final tie-breaker

A plugin entry registered at priority `400` loads **after** core entries (`100`), application entries (`200`), and theme entries (`300`).

## Asset Names and Overrides

* Asset names are normalized to lowercase on registration; `bootstrap` and `Bootstrap` resolve to the same key.
* Uniqueness is scoped by both asset type and name: a CSS entry for `"plugin"` and a JS entry for `"plugin"` occupy different slots in `\Laswitchtech\CoreWeb\Asset\Registry`.

### Output ordering

When assets are sorted for output, the framework applies three tie-breaking keys **in this sequence**:

1. **priority ascending** — lower numeric priority renders first
2. **registration order ascending** — earlier Asset Registry registration wins ties
3. **name ascending** — case-insensitive filename as final tie-breaker

A plugin entry registered at priority `400` loads **after** core entries (`100`), application entries (`200`), and theme entries (`300`).

### Conflict resolution for identical `(type, name)`

When two sources register the same `(type, name)` identifier, the framework applies these rules **in sequence**:

1. **higher numeric priority wins** — a higher numeric priority takes precedence (`400` beats `300`)
2. **lower provider rank wins** — among equal-priority entries: app > theme > plugin > core  
3. **earlier existing registration wins** — if both priority and provider rank also tie, whichever was registered first stays

Applications and themes carry lower provider-rank numbers than plugins (app = `0`, theme = `1`, plugin = `2`, core = `3`), so they win over plugins via this second rule when priorities are equal.

## Application Layout Usage

The helper `$helpers` is injected automatically by the renderer during view rendering; it is **not** available outside of renderer-managed templates. The container is **not** automatically injected into helpers — any helper method that requires service resolution must be called with `$container` explicitly passed as an argument and must not assume implicit access.

### CSS output

Place this in the `<head>` section of your layout:

```php
<?= $helpers->asset->css($container) ?>
```

CSS entries should always be emitted before body content to prevent style flash / FOUC (flash of unstyled content).

### JS output

Place this before `</body>` in your layout:

```php
<?= $helpers->asset->js($container) ?>
```

### Layout convention

Layouts request all enabled registered assets rather than naming Bootstrap, jQuery, DataTables, or Chart.js directly. This keeps the layout decoupled from individual plugin names and ensures only assets that have been explicitly registered for the current route are emitted.

## Example Manifest

```json
{
    "type": "plugin",
    "name": "datatables-bootstrap",
    "version": "1.0.0",
    "depends": [
        "datatables",
        "bootstrap"
    ],
    "autoload": {
        "psr-4": {
            "DatatablesBootstrap\\": "src/"
        }
    },
    "hooks": [
        "asset.register::DatatablesBootstrap\\Asset\\Provider::register"
    ]
}
```

This example declares:

* `type` — plugin.
* `name` — the extension's name-slug, used for dependency references (e.g., `"jquery"`).
* `version` — SemVer string (`X.Y.Z`).
* `depends` — required dependencies on the `datatables` and `bootstrap` plugins; bootstrap will halt if unresolved.
* `autoload.psr-4` — maps the namespace prefix to a directory for Core-Web's extension autoloader.
* `hooks` — flat-string hook registration on the `asset.register` event in the format `event::class::method`.

No additional manifest fields beyond those above are used — there is no synthetic `assets` or `optional-dependencies` key in the parser schema.

## Example Asset Providers

### Plugin Provider

```php
<?php declare(strict_types=1);

namespace DatatablesBootstrap\Asset;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

use function is_file;
use function is_readable;
use function realpath;

final class Provider
{
    public static function register(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $registry = $context['registry'];
        $pluginRoot = realpath(__DIR__ . '/../../');
        if ($pluginRoot === false) {
            return;
        }

        $cssFile = $pluginRoot . '/Assets/css/datatables-bootstrap.css';
        $jsFile  = $pluginRoot . '/Assets/js/datatables-bootstrap.js';

        if (!is_file($cssFile) || !is_readable($cssFile)) {
            return;
        }
        if (!is_file($jsFile) || !is_readable($jsFile)) {
            return;
        }

        $registry->css(
            'plugins/datatables-bootstrap', // scope: extension directory slug
            'datatables-bootstrap.css',     // filename: public leaf name only
            realpath($cssFile),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        $registry->js(
            'plugins/datatables-bootstrap',
            'datatables-bootstrap.js',
            realpath($jsFile),
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );
    }
}
```

This example demonstrates:

* **Registry validation** — returns early when `$context['registry']` is missing or not an `Asset\Registry` instance.
* **Root resolution** — uses `realpath(__DIR__ . '/../../')` to locate the plugin directory from the provider file's position.
* **Readability checks** — calls `is_file()` and `is_readable()` before registration; returns early if files are missing or unreadable.
* **Scope-based registration** — `$scope` is the extension directory slug (`'plugins/datatables-bootstrap'`), not a flat name. Uniqueness within CSS is keyed by `($scope, $filename)` pairs.
* **Filename convention** — only the leaf filename (`datatables-bootstrap.css`) is supplied; no directory components are included in the `$filename` argument.
* **Entry::PROVIDER_PLUGIN** — used as the provider constant so the registry can apply provider-rank tie-breaking correctly.
* **Priority `400`** — matches the framework's bootstrap convention ensuring plugin assets load *after* core (100), application (200), and theme (300).

### Theme Provider

```php
<?php declare(strict_types=1);

namespace ExampleTheme\Asset;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

use function is_file;
use function realpath;

final class Provider
{
    public static function register(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $registry = $context['registry'];
        $themeRoot = realpath(__DIR__ . '/..');
        if ($themeRoot === false) {
            return;
        }

        $cssFile = $themeRoot . '/Assets/css/theme.css';

        if (!is_file($cssFile)) {
            return;
        }

        $registry->css(
            'themes/example-theme', // scope: extension directory slug
            'theme.css',            // filename: public leaf name only
            realpath($cssFile),
            Entry::PROVIDER_THEME,
            300,
        );
    }
}
```

This example shows:

* **Priority `300`** — theme assets load after core (100) and application (200).
* **Entry::PROVIDER_THEME** — the theme provider constant enables scope-specific conflict resolution.

# Assets

Frontend assets (CSS and JS) are **registered, not hard-linked**. The asset
registry collects entries from the kernel, your app, and every extension;
the framework serves them over well-known routes and the asset helper emits
the matching `<link>` / `<script>` tags for your layouts.

## What's Registered Automatically

During boot the framework registers (each only if the file exists):

| Asset | Source | Scope |
|-------|--------|-------|
| Kernel CSS | kernel `Assets/less/styles.less` → `Assets/css/styles.css` (first found) | `kernel` |
| Kernel JS | kernel `Assets/js/kernel.js`, `Assets/js/panel.js`, and every `Assets/js/components/**/*.js` | `kernel` |
| App CSS | `{appRoot}/Assets/less/styles.less` → `{appRoot}/Assets/css/styles.css` (first found) | `app` |
| App JS | `{appRoot}/Assets/js/app.js` | `app` |

Kernel entries register at priority 100; app entries at priority 200 (so the
app wins conflicts on the same scope/file).

So a minimal app just needs to drop files in `Assets/` — no registration
code required.

## Scopes

Every asset entry belongs to a scope:

| Scope | Meaning |
|-------|---------|
| `kernel` | Framework-owned assets. |
| `app` | Your application's assets. |
| `themes/{name}` | Assets of the theme `name`. |
| `plugins/{name}` | Assets of the plugin `name`. |

Extension scopes must be exactly two segments and the name must match
`[a-z0-9][a-z0-9_-]*`.

## Registering Your Own Assets

Extensions register assets through the `asset.register` hook (context key:
`registry`). See [Creating Extensions](09-creating-extensions.md).

```php
public static function registerAssets(array $context): void
{
    $registry = $context['registry'];
    $dir = self::getPluginDir();

    $registry->css(
        scope:    'plugins/hello-world',
        file:     'hello.css',
        path:     "{$dir}/Assets/css/hello.css",
        provider: 'plugin',
        priority: 0,
        metadata: []
    );

    $registry->js(
        scope:    'plugins/hello-world',
        file:     'hello.js',
        path:     "{$dir}/Assets/js/hello.js",
        provider: 'plugin',
    );
}
```

`metadata` is free-form associative data carried on the entry.

### Conflicts & Precedence

If two entries claim the same (type, scope, file), the resolver prefers
higher `priority`, then higher provider rank (`app` > `theme` > `plugin` >
`core`). `register()` is additive; `replace(type, scope, file, $entry)` is
unconditional (and `replace(..., null)` removes an entry).

## Serving Assets

Core delivery routes (WEB mode):

| Route | Serves |
|-------|--------|
| `/css` | Compiled LESS output. |
| `/js/kernel` | Kernel JavaScript (`kernel.js`). |
| `/js/app` | App JavaScript (`app.js`). |
| `/{type}/kernel/{file}`, `/{type}/app/{file}` | A specific kernel/app asset (e.g. `/css/kernel/styles.css`, `/js/kernel/panel.js`). |
| `/{type}/plugins/{ext}`, `/{type}/themes/{ext}` | A plugin/theme's **default** registered asset. |
| `/{type}/plugins/{ext}/{file}`, `/{type}/themes/{ext}/{file}` | A specific plugin/theme asset file. |

(`{type}` is `css` or `js`.)

### LESS Compilation

If your app (or an extension) registers `.less` files, the framework
compiles them to a single stylesheet served at `/css`, cached under
`renderer.less.cache_dir` (default `storage/cache/renderer/less`). The
asset helper emits one `<link href="/css">` for all LESS sources and
suppresses individual links for the compiled file.

## Emitting Tags in Layouts

The `asset` helper renders all registered assets in deterministic order:

```php
<?php
$asset = $helpers->asset;
// or: $asset = $container->resolve('helpers')->resolve('asset');

echo $asset->css($container);  // all <link> tags
echo $asset->js($container);   // all <script> tags
?>
```

Output order: plugin CSS → framework CSS → compiled `/css` → theme CSS;
JS follows registry order. In the kernel `panel.layout` these are passed in
as the `cssOutput` / `jsOutput` variables (see [Rendering](04-rendering.md)).

### Single-Entry URLs

To link one specific asset manually:

```php
$url = $asset->url($entry); // Entry from $container->resolve('asset_registry')
```

The two canonical bundles flatten to `/js/kernel` and `/js/app`; every other
entry (including other kernel/app files and all extension assets) resolves
to `/{type}/{scope}/{file}` (e.g. `/css/kernel/styles.css`,
`/js/plugins/hello-world/hello.js`).

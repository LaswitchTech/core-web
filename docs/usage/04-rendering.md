# Rendering

The Renderer composes three named resources into one HTML document:

```
layout  ⊃  template  ⊃  view
   │          │          │
 outer     middle     your   (each is a registered, named resource)
 shell     section    content
```

- **Layout** — the outer HTML document (doctype, head, body, navigation).
- **Template** — a section wrapper inside the layout (header, content area,
  footer).
- **View** — the actual page content.

Each of the three is a **named registration** in the renderer registry, so
layouts, templates, and views can come from different providers: the kernel
(a *core* layout), a theme, a plugin, or your app.

## Using the Renderer

```php
$renderer = $container->resolve('renderer');
$html = $renderer->render($layout, $template, $view, $data);
```

- `$layout`, `$template`, `$view` — registered **names** (strings).
- `$data` — an array of variables made available to every layer.

The `$helpers` bag is **always** injected into `$data`, so `$helpers` is
available in every view, template, and layout without passing it.

### Where to Call It

Inside a route handler:

```php
$router->get('/dashboard', function (Web $req) use ($renderer): Response {
    return Response::html(
        $renderer->render('app.layout', 'app.template', 'dashboard.view', [
            'title' => 'Dashboard',
            'items' => $items,
        ]),
    );
});
```

## Registering Layouts, Templates, and Views

Resources are registered through the `renderer.register` hook (see
[Creating Extensions](09-creating-extensions.md)). The hook context provides
`registry`, `renderer`, `container`, and `mode`.

```php
public static function registerRenderer(array $context): void
{
    $registry = $context['registry'];
    $dir = self::getPluginDir(); // path to this extension's root

    $registry->add(
        name:     'hello.layout',
        type:     'layout',
        path:     "{$dir}/layouts/hello.layout.php",
        provider: 'plugin',          // app | theme | plugin | core
        priority: 0,
        metadata: ['engine' => 'php'] // optional; defaults to 'php'
    );

    $registry->add('hello.template', 'template', "{$dir}/templates/hello.template.php", 'plugin');
    $registry->add('hello.view',     'view',     "{$dir}/views/hello.view.php",         'plugin');
}
```

| Parameter | Notes |
|-----------|-------|
| `name` | The name you pass to `render()`. Dotted namespaces are conventional (`app.dashboard.view`). |
| `type` | `layout`, `template`, or `view`. |
| `path` | Absolute path to the template file. |
| `provider` | `app`, `theme`, `plugin`, or `core`. Affects precedence. |
| `priority` | Higher wins. Default `0`. |
| `metadata` | `['engine' => 'latte']` switches this resource to the Latte engine. |

### Precedence

If several providers register the **same** name + type, the resolver picks
the best entry by: highest `priority` → highest provider rank
(`app` > `theme` > `plugin` > `core`) → earliest registration. This is what
lets your app override a kernel layout, and a theme override a plugin's.

## The Kernel Panel Layout

The kernel registers one layout out of the box: `panel.layout` (Latte).
It expects these data variables:

| Variable | Purpose |
|----------|---------|
| `pageTitle` | `<title>` and topbar title. |
| `pageDescription` | Optional subtitle. |
| `cssOutput` | Compiled `<link>` tags (from the asset helper). |
| `jsOutput` | Compiled `<script>` tags (from the asset helper). |
| `templateContent` | The rendered template + view output. |
| `appName` | Application name. |
| `sidebarMenu`, `historyBreadcrumbs`, `routeBreadcrumbs`, `userMenu` | Navigation fragments (empty is fine). |
| `appLogo`, `appFooter` | Optional brand/logo/footer strings. |
| `currentRouteUrl`, `currentRouteLabel`, `currentRouteDescription`, `currentRouteIcon` | Topbar route metadata. |
| `year` | Footer year. |

A typical handler using the panel layout (the pipeline fills
`templateContent` / `viewContent` automatically):

```php
$router->get('/panel', function (Web $req) use ($renderer, $container): Response {
    $helpers = $container->resolve('helpers');
    $asset   = $helpers->resolve('asset');

    $html = $renderer->render('panel.layout', 'app.template', 'home.view', [
        'pageTitle' => 'Home',
        'cssOutput' => $asset->css($container),
        'jsOutput'  => $asset->js($container),
        'appName'   => 'My App',
        'year'      => (new \DateTimeImmutable())->format('Y'),
    ]);

    return Response::html($html);
});
```

## Engines

Two engines ship with the framework:

| Engine | `name()` | File extensions | Notes |
|--------|----------|-----------------|-------|
| PHP | `php` | `.php` | Raw PHP templates. Variables from `$data` are `extract()`ed into scope. |
| Latte | `latte` | `.latte` | [Latte](https://latte.nette.org) 3.x. Cache dir from `renderer.latte.cache_path`. |

The engine for a resource is chosen by its `metadata['engine']`; the default
is `php`.

```php
// Latte view:
$registry->add('home.view', 'view', "{$dir}/views/home.latte", 'plugin', 0, ['engine' => 'latte']);
```

### Adding Your Own Engine

Register an `EngineInterface` implementation through the
`renderer.engine.register` hook (context key: `engineRegistry`). The engine
is then selectable via `['engine' => 'my-engine']` metadata.

## PHP View Example

`views/hello.view.php`:

```php
<h1>Hello <?= htmlspecialchars($name) ?>!</h1>
```

```php
$renderer->render('app.layout', 'app.template', 'hello.view', ['name' => 'World']);
```

Every key in `$data` becomes a local variable. `$helpers` is always present.

## Latte View Example

`views/hello.view.latte`:

```latte
<h1>Hello {$name}!</h1>
```

```php
$renderer->render('app.layout', 'app.template', 'hello.latte.view', ['name' => 'World']);
```

## Direct Rendering (No Pipeline)

To render a single registered resource without the layout/template wrapping:

```php
$entry = $registry->resolve('hello.view', 'view');
$html  = $renderer->renderResource($entry, ['name' => 'World']);
```

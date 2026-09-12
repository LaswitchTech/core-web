# Dev Plugin

The Dev plugin provides development tools for the Core-Web admin panel,
including a theme preview page and a variable inspector for debugging
page rendering context.

## What It Provides

- Theme preview page at `/admin/dev/preview`
- Source code viewer at `/admin/dev/source`
- Variable inspector endpoint at `/admin/dev/variables`
- Tab registry for extensible developer tool panels
- Frontend assets for the preview UI and developer trigger

## Routes

| URL | Purpose |
|-----|---------|
| `/admin/dev/preview` | Theme preview page |
| `/admin/dev/source` | Source code viewer (accepts `?file=` query param) |
| `/admin/dev/variables` | JSON endpoint returning current page variables |

## Menu Entry

Registers a `dev-preview` menu entry in the `developer` section of the
admin sidebar:

- **Label:** Theme Preview
- **URL:** `/admin/dev/preview`
- **Priority:** 100

## Theme Preview

The preview page renders your current theme in an isolated context.
It loads the theme's assets and layout so you can see changes in
real-time without navigating the full application.

Access it at `/admin/dev/preview` when logged in as an admin.

## Variable Inspector

The `/admin/dev/variables` endpoint returns a JSON payload of all
variables available in the current rendering context. This is useful
for debugging what data a view or template receives.

```sh
curl http://localhost/admin/dev/variables
```

Response:

```json
{
    "view": "admin.dashboard",
    "variables": {
        "title": "Dashboard",
        "entries": [...]
    }
}
```

## Tab Registry

The `TabRegistry` class provides a static registry for developer tool
tabs. Other plugins can register tabs that appear in the developer
console:

```php
use Laswitchtech\CoreWeb\Plugin\Dev\TabRegistry;

TabRegistry::register('my-tool', [
    'label' => 'My Debug Tool',
    'url' => '/admin/dev/my-tool',
    'priority' => 50,
]);
```

Methods:

| Method | Purpose |
|--------|---------|
| `register(string $id, array $tab): void` | Add a tab |
| `getTabs(): array` | Get all tabs sorted by priority (descending) |
| `getTab(string $id): ?array` | Get a specific tab |
| `unregister(string $id): void` | Remove a tab |
| `clear(): void` | Remove all tabs |
| `registerHook(string $hook, callable $callback): void` | Register a hook callback |

## Assets

| File | Type | Priority |
|------|------|----------|
| `preview.less` | CSS (LESS) | 400 |
| `preview.js` | JavaScript | 400 |
| `developer-trigger.less` | CSS (LESS) | 401 |
| `developer-trigger.js` | JavaScript | 401 |
| `variable-inspector.js` | JavaScript | 402 |

All assets use scope `plugins/dev`.

## Renderer Resources

| Slug | Type | File |
|------|------|------|
| `dev.preview` | VIEW | `views/preview.php` |

## Dependencies

None. Requires the `administration` plugin to be active for the admin
menu integration.

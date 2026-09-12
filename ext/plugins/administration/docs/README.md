# Administration Plugin

The Administration plugin provides the extensible admin panel mounted
at `/admin`. It includes a dashboard with overview widgets, a settings
page, a log viewer, and a menu/sidebar system that other plugins can
extend.

## What It Provides

- Admin panel routes: `/admin` (dashboard), `/admin/settings`, `/admin/logs`
- Extensible menu system (sidebar navigation)
- Overview widget registry for the dashboard
- Settings registry with categorized entries
- Log viewer with channel and level filtering
- Renderer resources (template + views)
- Frontend assets (LESS, JS) for all admin pages

## Routes

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/admin` | Dashboard with overview widgets |
| POST | `/admin/overview/order` | Reorder overview widgets |
| GET | `/admin/settings` | Application settings form |
| POST | `/admin/settings` | Save settings |
| GET | `/admin/logs` | Log viewer |
| GET | `/admin/logs/data` | JSON log entries (for live filtering) |

All routes require authentication (admin context).

## Menu System

The sidebar is built from a `Menu\Registry`. Each entry is an immutable
`Menu\Entry` value object with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (pattern: `^[a-z][a-z0-9._-]*$`) |
| `label` | string | Display text |
| `url` | string | Link target |
| `icon` | string | CSS class or inline SVG |
| `description` | string | Optional description |
| `tooltip` | string | Optional tooltip text |
| `color` | string | Optional accent color |
| `section` | string | Grouping key (default: `general`) |
| `parent` | string | Parent entry ID for nested items |
| `priority` | int | Resolution priority (higher wins) |
| `provider` | string | `kernel`, `plugin`, or `application` |
| `order` | int | Display order (auto-assigned if not set) |
| `metadata` | array | Arbitrary extra data |

### Adding Menu Entries from Your Plugin

Implement the `admin.menu.register` hook:

```php
public static function registerMenu(array $context): void {
    $registry = $context['registry'];

    $registry->register(
        id: 'reports',
        label: 'Reports',
        url: '/admin/reports',
        icon: 'bi-bar-chart',
        section: 'management',
        priority: 50
    );
}
```

In your plugin's `manifest.json`:

```json
{
    "hooks": [
        "admin.menu.register::MyPlugin\\MenuProvider::registerMenu"
    ]
}
```

### Built-in Menu Entry

The plugin registers a `dashboard` entry (label: "Overview", URL:
`/admin`, section: `general`) with an inline SVG icon.

## Overview Widgets

The dashboard displays widgets from the `Overview\Registry`. Each
widget is an `Overview\Entry` with:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `component` | string | Builder component slug (e.g., `badge`, `card`) |
| `config` | array | Component-specific configuration |
| `columns` | int | Grid column span (default: 1) |
| `priority` | int | Resolution priority |
| `provider` | string | Provider origin |

### Adding Overview Widgets

Implement the `admin.overview.register` hook:

```php
public static function registerWidgets(array $context): void {
    $registry = $context['registry'];

    $registry->register(
        id: 'active_users',
        component: 'stat',
        config: ['label' => 'Active Users', 'value' => 42],
        columns: 2
    );
}
```

### Built-in Widgets

The plugin registers a `coreweb_version` badge showing the framework
version, enabled/disabled extension counts, and the active database
driver.

## Settings

The settings page is built from the `Settings\Registry`. Each entry is
a `Settings\Entry` with:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Config key (pattern: `^[a-z][a-z0-9._/]*$`) |
| `label` | string | Display label |
| `description` | string | Help text |
| `type` | string | Input type: `string`, `integer`, `float`, `boolean`, `array`, `url`, `file`, `email`, `text` |
| `default` | mixed | Default value |
| `validator` | callable | Optional validation function |
| `category` | string | Grouping: `general`, `branding`, `display`, `security`, `performance`, `notifications` |
| `priority` | int | Resolution priority |

### Adding Settings Entries

Implement the `admin.settings.register` hook:

```php
public static function registerSettings(array $context): void {
    $registry = $context['registry'];

    $registry->register(
        key: 'myplugin.enabled',
        label: 'Enable My Plugin',
        description: 'Toggle the plugin on or off',
        type: 'boolean',
        default: true,
        category: 'general'
    );
}
```

### Built-in Settings

The plugin registers branding settings under the `branding` category:

| Key | Label | Type | Default |
|-----|-------|------|---------|
| `application.name` | Application Name | text | `Core-Web` |
| `application.logo` | Logo | file | — |
| `application.footer` | Footer Text | text | — |

## Log Viewer

The `/admin/logs` page provides a log viewer with:

- **Channel filtering** — select which log channel to view
- **Level filtering** — filter by severity (debug, info, warning, error)
- **Live data endpoint** — `/admin/logs/data` returns JSON log entries

## Assets

| File | Type | Priority |
|------|------|----------|
| `overview.less` | CSS (LESS) | 400 |
| `overview.js` | JavaScript | 400 |
| `settings.less` | CSS (LESS) | 400 |
| `settings.js` | JavaScript | 400 |
| `logs.less` | CSS (LESS) | 400 |
| `logs.js` | JavaScript | 400 |

All assets use scope `plugins/administration`.

## Renderer Resources

| Slug | Type | File |
|------|------|------|
| `admin.template` | TEMPLATE | `templates/admin.php` |
| `admin.dashboard` | VIEW | `views/dashboard.php` |
| `admin.settings` | VIEW | `views/settings.php` |
| `admin.logs` | VIEW | `views/logs.php` |

## Extension Points Summary

| Hook | Purpose |
|------|---------|
| `admin.menu.register` | Add sidebar menu entries |
| `admin.overview.register` | Add dashboard widgets |
| `admin.settings.register` | Add settings form fields |

## Dependencies

None.

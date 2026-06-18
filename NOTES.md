# Project Notes — Core-Web Framework

## Vision

A PHP framework for web applications that is:
- Portable across web servers (Apache, Nginx, Windows IIS, etc.)
- Drop-and-play — users download, deploy, and it just works with minimal setup
- Database flexible — supports SQLite and MySQL/MariaDB
- Extension-first architecture — extensions come in two categories: themes and plugins

## Application Bootstrap

Setting up a new application must be 2 steps:

1. `composer require laswitchtech/core-web`
2. Create a basic `index.php` in the root

## Admin Panel

### Minimum Scaffolding — `/admin` Panel
Every fresh application starts with an Administration panel at `/admin`, including:

- **Dashboard** — overview of system status
- **Updates** — kernel-level and application-level update checks
- **System Settings** — brand name, logo, etc.
- **Developer Console** — inspect currently available variables in a page
- **Theme Preview** — test themes against all existing UI components

## CLI System

### Command Pattern
```
php cli core.<command> [args...]
php cli plugin.<command> [args...]
```
- Commands are segmented by namespace (core = framework, plugin = extension)
- Follows router pattern: segment → handler resolution
- Plugin commands discoverable and registered at bootstrap

### Core Commands (Planned)
- `core.init` — scaffold new project structure
- `core.auth create-user <username> <password>` — admin user creation
- `core.config show` — display current config values
- `core.db migrate` — run database migrations
- `core.test` — run test suite
- `core.update check` — check for framework/app updates

## Future Considerations

### Messaging System
- SMTP (email)
- SMS
- Both extensible via plugins (e.g., adding new providers)

### UI Builder
- Extensible through plugins
- Generates form inputs, tables, modals, cards, and other common components

### Renderer
- Supports layouts
- Same layout usable with multiple views/purposes
- Layouts are composable and overrideable

### Hook Registry
- Central registry for available hooks
- Used by renderer to expose insertion points for extensions
- Hooks are named, prioritized, and orderable

## Extensibility Model

### Extensions (installed at application level)

**Themes:** Visual overrides (CSS, layout templates, asset bundles). They can override:
- Layouts
- UI component styles
- Admin panel skin

**Plugins:** Functional additions. They can hook into:
- Message providers (email, SMS)
- UI builder components
- Renderer layout slots / hooks
- Application lifecycle events

### Extension API Surface
Extensions register via a manifest file (`extension.json` or similar) with fields: name, type (theme/plugin), version, hooks, layouts, priority.

## CLI System

### Command Pattern
```
php cli core.<command> [args...]
php cli plugin.<command> [args...]
```
- Commands are segmented by namespace (core = framework, plugin = extension)
- Follows router pattern: segment → handler resolution
- Plugin commands discoverable and registered at bootstrap

### Core Commands (Planned)
- `core.init` — scaffold new project structure
- `core.auth create-user <username> <password>` — admin user creation
- `core.config show` — display current config values
- `core.db migrate` — run database migrations
- `core.test` — run test suite
- `core.update check` — check for framework/app updates

## Future Considerations
- Multi-tenant support could be a plugin
- Caching layer (file, Redis, APCu)
- Packaging extensions as composer packages

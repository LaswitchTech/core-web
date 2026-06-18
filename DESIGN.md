# Design Notes — Core-Web Framework

## Guiding Principles

1. **Deploy anywhere, zero config** — The framework must run on Apache, Nginx, IIS, PHP built-in server with no manual configuration where possible. Auto-detect environment and adapt.

2. **Minimal bootstrap** — A new app is `composer require laswitchtech/core-web` + one `index.php`. Everything else boots from that single entry point.

3. **Extension-first design** — Every subsystem exposes hooks, providers, or plugins interfaces before providing default implementations. "Extensible by default" not "extensible by accident."

4. **Convention over configuration** — The framework provides sensible defaults via conventions (directory structure, naming). Configuration is opt-in, not required.

5. **Single source of truth for state** — Each subsystem owns its own state; no global mutable variables. Dependency injection and container resolution are the only ways to share dependencies.

## Architecture Overview

```
index.php (1 line)
  └── CoreWeb\Application
        ├── Routing
        │     ├── Router (server-aware)
        │     └── .htaccess / nginx.conf generators
        ├── DI Container
        ├── Configuration (auto-detect → defaults → user config)
        ├── Database (SQLite/MySQL, driver abstraction)
        ├── Messaging
        │     ├── Mailer (SMTP driver)
        │     └── SMS (SMS provider driver)
        ├── UI Builder
        │     ├── Component library
        │     └── Plugin component registry
        ├── Renderer
        │     ├── Layout engine
        │     └── Hook Registry
        ├── Extension Manager
        │     ├── Theme loader
        │     └── Plugin loader
        └── Admin
              ├── Dashboard
              ├── Updates
              ├── Settings
              ├── Developer Console
              └── Theme Preview
```

## Technical Constraints

- **Minimum PHP 8.2** — modern features: typed properties, match expressions, union types, readonly classes, fiber support, intersection types for interfaces-only bounds.

### Config System
- Config files use `.cfg` extension and contain JSON
- Default config lives in `config/core.cfg`
- User overrides live in `config/local.cfg` (gitignored)
- Merge strategy: user → core (local.cfg wins over core.cfg)
- Runtime modifications write to `local.cfg` only
- Config class provides typed getters with fallbacks

### Server Detection Strategy
Detect server type by checking `$_SERVER` keys (`SERVER_SOFTWARE`, `GATEWAY_INTERFACE`). This is the first boot step — before routing is set up. The detection feeds into a strategy that selects the correct `.htaccess` / `nginx.conf` snippet and serves it to `.well-known/core-web/` for the user to copy/download.

### Extension Loading
- Extensions live in `extensions/{theme,plugin}/{name}/`
- Each extension has a manifest with: type, name, version, hooks (array), layouts (array), depends (optional)
- Loader walks directories, validates manifests, registers hooks and plugins into the container
- Hooks are registered during a pre-boot phase; resolved at render time

### Hook Registry Design
```
HookRegistry::register(string $name, int $priority = 0)
HookRegistry::addCallback(string $hook, callable $callback, int $priority = 0)
HookRegistry::trigger(string $hook, array $context = []) : array
HookRegistry::getHooks(string $hook) : array
```
- Hooks are named namespaces (e.g., `layout.header`, `page.before_render`)
- Multiple callbacks can register to the same hook; sorted by priority descending
- Triggering returns accumulated results for composable hooks

### Layout System Design
```
Renderer::setLayout(Layout $layout)
Renderer::render(string $view, array $data = []) : string
```
- Layouts define slots (e.g., `header`, `content`, `sidebar`, `footer`)
- Views fill slots and compose into the layout
- Plugins can supply alternate layouts that swap in via hook on `layout.resolved`
- Default layout: a simple single-column full-width wrapper

### Admin Panel Design
- Mounted at `/admin`, requires auth middleware
- Split into two contexts: admin (logged-in admin) and developer (also needs dev console access)
- Developer Console accesses internal app state via the container — read-only introspection, no mutation

### Database Abstraction
```
Database::connection(string $driver = 'pdo') → PDO
Connection::table(string $name) → QueryBuilder
QueryBuilder::select($columns)->from($table)->where(...)->get()
```
- SQLite-first default (zero setup). MySQL/MariaDB when `DATABASE_URL` is set to `mysql://...`
- No migration system in day-one (use raw SQL files if needed)

### Security Posture
- CSRF tokens on all forms (renderer includes token helper)
- Password hashing via `password_hash()` defaults
- Output escaping baked into renderer (`e()`, `h()`)
- File uploads validated by extension, not framework defaults

## Implementation Order (Proposed)

1. Application bootstrap (`index.php` → single entry point)
2. DI Container (minimal)
3. Configuration loader (env → defaults → config files)
4. Router (server detection + routing rules)
5. Database abstraction (SQLite → MySQL)
6. Hook Registry
7. Renderer (layouts + views)
8. UI Builder (components)
9. Extension Manager (loader + manifest parser)
10. Messaging (SMTP → SMS provider interface)
11. Admin panel (dashboard, settings, dev console, theme preview)

## Naming Conventions

- Classes: `PascalCase` with meaningful prefixes (`Router`, `HookRegistry`, `ExtensionManifest`)
- Interfaces: `Interface` suffix (`MessageProviderInterface`, `PluginInterface`)
- Config files: kebab-case (`.env`, `extension.json`)
- Database tables: snake_case, plural (`users`, `admin_settings`)

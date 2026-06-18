# Kanban

## Todo

- [ ] Database
  Tags: framework, database
  - [ ] SQLite Driver <!-- created_at: 2026-06-18T10:52:22-04:00 priority: high -->
    - Zero-config database backend, file-based storage
    Tags: feature
    - [ ] Implement PDO wrapper with SQLite defaults <!-- created_at: 2026-06-18T10:53:03-04:00 priority: high -->
    - [ ] Support custom path for database file location <!-- created_at: 2026-06-18T10:54:00-04:00 priority: normal -->
    - [ ] Auto-create data directory on connection <!-- created_at: 2026-06-18T10:55:00-04:00 priority: normal -->

- [ ] Config
  Tags: framework, config
  - [ ] Config Manager <!-- created_at: 2026-06-18T11:00:00-04:00 priority: high -->
    - Load, merge, and provide access to application configuration (core.cfg + local.cfg)
    Tags: feature
    - [ ] Implement Config class with typed getters <!-- created_at: 2026-06-18T11:01:00-04:00 priority: high -->
    - [ ] Support deep nested key access <!-- created_at: 2026-06-18T11:01:30-04:00 priority: normal -->
    - [ ] Implement merge strategy (local.cfg overrides core.cfg) <!-- created_at: 2026-06-18T11:02:00-04:00 priority: high -->
    - [ ] Auto-save changes to local.cfg only <!-- created_at: 2026-06-18T11:02:30-04:00 priority: normal -->

- [ ] Routing
  Tags: framework, routing
  - [ ] Router Class <!-- created_at: 2026-06-18T10:59:23-04:00 priority: high -->
    - HTTP method-aware router with dynamic route matching and controller binding
    Tags: feature
    - [ ] Implement base URL detection from server config <!-- created_at: 2026-06-18T11:05:00-04:00 priority: high -->
    - [ ] Support all HTTP methods (GET, POST, PUT, DELETE, PATCH) as first-class routes with middleware pipeline support <!-- created_at: 2026-06-18T11:05:30-04:00 priority: high -->
    - [ ] Implement parameter extraction from URL paths including query string access <!-- created_at: 2026-06-18T11:06:00-04:00 priority: high -->
    - [ ] Add middleware pipeline pattern with before/after hooks per route and global middleware support <!-- created_at: 2026-06-18T11:07:00-04:00 priority: normal -->

  - [ ] Apache Support <!-- created_at: 2026-06-18T10:59:32-04:00 priority: high -->
    - Provide RewriteEngine rules that route all requests to index.php, support DocumentRoot and subdirectory deployments via base-path detection
    Tags: feature
    - [ ] Verify .htaccess handles both root and subpath installations correctly <!-- created_at: 2026-06-18T11:10:00-04:00 priority: normal -->

  - [ ] Nginx Support <!-- created_at: 2026-06-18T09:59:41-04:00 priority: high -->
    - Provide try_files directive that passes unknown paths to index.php, support subdirectory deployments via parameterizable root and location blocks
    Tags: feature
    - [ ] Verify nginx snippet handles both root and alias configurations correctly <!-- created_at: 2026-06-18T11:10:30-04:00 priority: normal -->

  - [ ] IIS Support <!-- created_at: 2026-06-18T10:00:04-04:00 priority: high -->
    - Provide URL Rewrite module rules for Windows IIS deployment with auto-detect for root vs subdirectory paths and fallback to PHP built-in server for local development
    Tags: feature
    - [ ] Verify web.config handles both static files routing and PHP-FPM fastcgi correctly <!-- created_at: 2026-06-18T11:11:00-04:00 priority: normal -->

- [ ] DI Container
  Tags: framework, container
  - [ ] Container Implementation <!-- created_at: 2026-06-18T11:15:00-04:00 priority: high -->
    - Lightweight, minimal dependency injection container for core services
    Tags: feature
    - [ ] Implement register/resolve with singleton support <!-- created_at: 2026-06-18T11:16:00-04:00 priority: high -->
    - [ ] Support factory closures and auto-wiring for simple classes <!-- created_at: 2026-06-18T11:17:00-04:00 priority: normal -->
    - [ ] Implement resolution with typed container accessors <!-- created_at: 2026-06-18T11:17:30-04:01-04:00 priority: high -->

- [ ] Extension System
  Tags: framework, extensions
  - [ ] Extension Manager <!-- created_at: 2026-06-18T11:20:00-04:00 priority: normal -->
    - Discover, load, validate and manage themes and plugins
    Tags: feature
    - [ ] Implement extension manifest parser (extension.json schema) <!-- created_at: 2026-06-18T11:21:00-04:00 priority: normal -->
    - [ ] Implement directory walker and registration for themes and plugins <!-- created_at: 2026-06-18T11:22:00-04:00 priority: normal -->

- [ ] Messaging System
  Tags: framework, messaging
  - [ ] Message Provider Interface <!-- created_at: 2026-06-18T11:30:00-04:00 priority: normal -->
    - Contract for extensible email and SMS messaging
    Tags: feature
    - [ ] Implement SMTP mailer driver <!-- created_at: 2026-06-18T11:31:00-04:00 priority: normal -->
    - [ ] Define plugin interface for additional providers <!-- created_at: 2026-06-18T11:32:00-04:00 priority: normal -->

- [ ] UI Builder
  Tags: framework, ui
  - [ ] Component Library <!-- created_at: 2026-06-18T11:40:00-04:00 priority: normal -->
    - Renderable UI components with plugin extensibility
    Tags: feature
    - [ ] Implement base UIComponent interface and HTML sanitizer <!-- created_at: 2026-06-18T11:41:00-04:00 priority: normal -->

- [ ] Renderer
  Tags: framework, renderer
  - [ ] Layout Engine <!-- created_at: 2026-06-18T11:50:00-04:00 priority: normal -->
    - View rendering with layout composition and hook-driven slot insertion
    Tags: feature
    - [ ] Implement Layout class with named slots, plugin override support, and render pipeline with before/after hooks <!-- created_at: 2026-06-18T10:55:00-04:00 priority: normal -->

- [ ] Hook Registry
  Tags: framework, hooks
  - [ ] Hook System <!-- created_at: 2026-06-18T12:00:00-04:00 priority: high -->
    - Central hook registration and triggering system for layout slots, plugin events, core lifecycle
    Tags: feature
    - [ ] Implement register/addCallback/trigger with priority ordering <!-- created_at: 2026-06-18T12:01:00-04:00 priority: high -->
    - [ ] Support hook namespaces (layout.*, page.*, lifecycle.*) and batch triggering of multiple patterns <!-- created_at: 2026-06-18T12:02:00-04:00 priority: normal -->

- [ ] CLI System
  Tags: framework, cli
  - [ ] CLI Router <!-- created_at: 2026-06-18T13:00:00-04:00 priority: high -->
    - Namespace-aware command routing (core vs plugin segments), arg parsing, help display
    Tags: feature
    - [ ] Parse `php cli namespace.command args[]` invocation pattern <!-- created_at: 2026-06-18T13:01:00-04:00 priority: high -->
    - [ ] Implement command handler resolution by namespace + command name with help display fallback <!-- created_at: 2026-06-18T13:02:00-04:00 priority: high -->
    - [ ] Implement plugin command registry integration — plugins register commands at bootstrap <!-- created_at: 2026-06-18T13:03:00-04:00 priority: normal -->

  - [ ] Core Commands
    Tags: feature
    - [ ] core.init — scaffold new project structure with directory layout and base config files <!-- created_at: 2026-06-18T13:04:00-04:00 priority: high -->
    - [ ] core.auth create-user <username> <password> — admin user creation with hashed passwords <!-- created_at: 2026-06-18T13:05:00-04:00 priority: normal -->
    - [ ] core.config show — display current config values from core.cfg + local.cfg merge <!-- created_at: 2026-06-18T13:06:00-04:00 priority: normal -->
    - [ ] core.db migrate — run database migrations from migration files in data directory <!-- created_at: 2026-06-18T13:07:00-04:00 priority: normal -->
    - [ ] core.test — run test suite, discover tests in configured test paths <!-- created_at: 2026-06-18T13:08:00-04:00 priority: normal -->
    - [ ] core.update check — check for framework and application updates via remote manifest URL <!-- created_at: 2026-06-18T13:09:00-04:00 priority: normal -->

- [ ] CLI System
  Tags: framework, cli
  - [ ] CLI Router <!-- created_at: 2026-06-18T13:00:00-04:00 priority: high -->
    - Dispatcher for plugin and core CLI commands with same interface pattern as HTTP router (php cli <source>.<command> <arguments>)
    Tags: feature
    - [ ] Implement entry point `cli` file and command routing to source.command handlers <!-- created_at: 2026-06-18T13:01:00-04:00 priority: high -->
    - [ ] Support argument parsing with positional params, quoted strings, and optional flags <!-- created_at: 2026-06-18T13:02:00-04:00 priority: normal -->
    - [ ] Implement plugin discovery for CLI commands alongside core kernel commands <!-- created_at: 2026-06-18T13:03:00-04:00 priority: high -->

  - [ ] Core CLI Commands <!-- created_at: 2026-06-18T13:05:00-04:00 priority: normal -->
    - Bootstrap commands for testing, configuring and managing the framework
    Tags: feature
    - [ ] `core.init` — scaffold a new application (index.php boilerplate, config directory setup) <!-- created_at: 2026-06-18T13:06:00-04:00 priority: normal -->
    - [ ] `core.auth create-user <username> <password>` — create admin users from CLI <!-- created_at: 2026-06-18T13:07:00-04:00 priority: normal -->
    - [ ] `core.db connect <driver> --path=<sqlite path>|--dsn=mysql://...` — test and configure database connectivity <!-- created_at: 2026-06-18T13:08:00-04:00 priority: normal -->
    - [ ] `core.config show --key=<path.to.key>` — display the resolved merged config for a given key or all config <!-- created_at: 2026-06-18T13:09:00-04:00 priority: normal -->
    - [ ] `core.config set <key> <value>` — write a value to local.cfg (never core.cfg) <!-- created_at: 2026-06-18T13:10:00-04:00 priority: normal -->
    - [ ] `core.install` — run framework bootstrap (create default config, validate paths, verify server compatibility) <!-- created_at: 2026-06-18T13:11:00-04:00 priority: normal -->
    - [ ] `core.info` — display system info (PHP version, loaded extensions, database status, config paths, available plugins) <!-- created_at: 2026-06-18T13:12:00-04:00 priority: normal -->

## Planning & Documentation
  - [ ] Administration Panel <!-- created_at: 2026-06-18T12:10:00-04:00 priority: normal -->
    - `/admin` panel with all required sub-systems
    Tags: feature, admin
    - [ ] Dashboard (system status overview) <!-- created_at: 2026-06-18T12:11:00-04:00 priority: normal -->
    - [ ] Updates system (kernel + application version checking) <!-- created_at: 2026-06-18T12:12:00-04:00 priority: normal -->
    - [ ] System Settings (brand name, logo, etc.) <!-- created_at: 2026-06-18T12:13:00-04:00 priority: normal -->
    - [ ] Developer Console (variable introspection) <!-- created_at: 2026-06-18T12:14:00-04:00 priority: normal -->
    - [ ] Theme Preview (test against all UI components) <!-- created_at: 2026-06-18T12:15:00-04:00 priority: normal -->

## Planning & Documentation

- [ ] Routing Design Doc
  Tags: documentation
  - [ ] Write routing documentation <!-- created_at: 2026-06-18T10:52:22-04:00 priority: high -->
    - Document router API, supported platforms, and integration patterns
    Tags: documentation
    - [ ] Draft routing architecture overview with server detection strategy (Apache/Nginx/IIS auto-detect via $_SERVER) for .htaccess or nginx.conf delivery <!-- created_at: 2026-06-18T10:53:03-04:00 priority: high -->
    - [ ] Document HTTP method handlers and parameter binding syntax with middleware pipeline examples <!-- created_at: 2026-06-18T10:54:00-04:00 priority: normal -->
    - [ ] Document deploy snippets (Apache .htaccess, Nginx config, IIS web.config) with usage instructions for root and subdir installations <!-- created_at: 2026-06-18T10:55:00-04:00 priority: normal -->

- [ ] Config Doc
  Tags: documentation
  - [ ] Write config system documentation <!-- created_at: 2026-06-18T11:00:00-04:00 priority: high -->
    - Document config format, merge strategy, and configuration patterns
    Tags: documentation

## In Progress

## Validation

- [ ] Testing & Verification
  Tags: testing
  - [ ] Verify routing across all platforms <!-- created_at: 2026-06-18T13:00:00-04:00 priority: high -->
    - Test Apache, Nginx, and IIS routing with the skeleton application on localhost
    Tags: testing

## Done
- Initial project setup and documentation (README, KANBAN, DESIGN.md, NOTES.md) <!-- created_at: 2026-06-18T10:00:00-04:00 -->
- Composer initialization with PSR-4 autoload for Laswitchtech\CoreWeb<!-- created_at: 2026-06-18T10:05:00-04:00 -->
- Skeleton config/core.cfg creation with app, database, mail, admin, and session settings <!-- created_at: 2026-06-18T10:10:00-04:00 -->

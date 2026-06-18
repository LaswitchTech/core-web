# Kanban

## Todo
- [ ] Database <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, database
  - [ ] SQLite Driver <!-- created_at: 2026-06-18T10:52:22-04:00 priority: high -->
    - Zero-config database backend, file-based storage
    - Tags: feature
    - [ ] Implement PDO wrapper with SQLite defaults <!-- created_at: 2026-06-18T10:53:03-04:00 priority: high -->
    - [ ] Support custom path for database file location <!-- created_at: 2026-06-18T10:54:00-04:00 priority: normal -->
    - [ ] Auto-create data directory on connection <!-- created_at: 2026-06-18T10:55:00-04:00 priority: normal -->
- [~] Configuration Manager <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, config
  - [x] Config Manager <!-- created_at: 2026-06-18T11:00:00-04:00 priority: high -->
    - Load, merge, and provide access to application configuration (core.cfg + local.cfg)
    - Tags: feature
    - [x] Implement Config class with typed getters ✓ — get()/all() + deep-merge persistence <!-- committed e59081b -->
    - Generic dot-notation access; no per-type getters but all config payloads fully available for read-only inspection
    - [x] Support deep nested key access ✓ <!-- committed e59081b -->
    - [x] Implement merge strategy (local.cfg overrides core.cfg) ✓ <!-- committed e59081b -->
    - [-] Auto-save changes to local.cfg only ✗ — NO save/write/persist method exists in src/Config.php; pending implementation
- [ ] Routing <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, routing
  - [ ] Router Class <!-- created_at: 2026-06-18T10:59:23-04:00 priority: high -->
    - HTTP method-aware router with dynamic route matching and controller binding
    - Tags: feature
    - [ ] Implement base URL detection from server config <!-- created_at: 2026-06-18T11:05:00-04:00 priority: high -->
    - [ ] Support all HTTP methods (GET, POST, PUT, DELETE, PATCH) as first-class routes with middleware pipeline support <!-- created_at: 2026-06-18T11:05:30-04:00 priority: high -->
    - [ ] Implement parameter extraction from URL paths including query string access <!-- created_at: 2026-06-18T11:06:00-04:00 priority: high -->
    - [ ] Add middleware pipeline pattern with before/after hooks per route and global middleware support <!-- created_at: 2026-06-18T11:07:00-04:00 priority: normal -->
  - [ ] Apache Support <!-- created_at: 2026-06-18T10:59:32-04:00 priority: high -->
    - Provide RewriteEngine rules that route all requests to index.php, support DocumentRoot and subdirectory deployments via base-path detection
    - Tags: feature
    - [ ] Verify .htaccess handles both root and subpath installations correctly <!-- created_at: 2026-06-18T11:10:00-04:00 priority: normal -->
  - [ ] Nginx Support <!-- created_at: 2026-06-18T09:59:41-04:00 priority: high -->
    - Provide try_files directive that passes unknown paths to index.php, support subdirectory deployments via parameterizable root and location blocks
    - Tags: feature
    - [ ] Verify nginx snippet handles both root and alias configurations correctly <!-- created_at: 2026-06-18T11:10:30-04:00 priority: normal -->
  - [ ] IIS Support <!-- created_at: 2026-06-18T10:00:04-04:00 priority: high -->
    - Provide URL Rewrite module rules for Windows IIS deployment with auto-detect for root vs subdirectory paths and fallback to PHP built-in server for local development
    - Tags: feature
    - [ ] Verify web.config handles both static files routing and PHP-FPM fastcgi correctly <!-- created_at: 2026-06-18T11:11:00-04:00 priority: normal -->
- [ ] DI Container <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, container
  - [x] Container Implementation <!-- created_at: 2026-06-18T11:15:00-04:00 priority: high -->
    - Lightweight, minimal dependency injection container for core services
    - Tags: feature
    - [x] Implement register/resolve with singleton support <!-- created_at: 2026-06-18T11:16:00-04:00 priority: high -->
    - [x] Support factory closures and auto-wiring for simple classes <!-- created_at: 2026-06-18T11:17:00-04:00 priority: normal -->
    - [x] Implement resolution with typed container accessors <!-- created_at: 2026-06-18T11:17:30-04:01-04:00 priority: high -->
- [ ] Extension System <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, extensions
  - [~] Manifest Parser
    - Discover, parse, and validate extension manifests (manifest.json). Version normalization (X.Y.Z), hook format validation, type/name/version required fields. Partial: class::method registration from Bootstrap exists; layout registration from Bootstrap is stubbed.
    - Tags: feature
    - [x] Implement manifest schema validation ✓ <!-- committed 5fc42f2 -->
    - [ ] Implement actual plugin/theme lifecycle (activation/deactivation) <!-- TODO -->
  - [~] Directory Walker / Extension Loader
    - Walk ext/themes/* and ext/plugins/*/ subdirectories. Validate manifests, check dependencies against known extensions, register hooks into the Hook\Registry singleton. Partial: metadata indexing into Container works; layout/ hook callback registration is stubbed.
    - Tags: feature
    - [x] Implement directory walker manifest discovery ✓ <!-- committed 5fc42f2 -->
    - [ ] Implement actual extension loading (plugin/service hooks, theme assets) <!-- TODO -->
- [ ] Messaging System <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, messaging
  - [ ] Message Provider Interface <!-- created_at: 2026-06-18T11:30:00-04:00 priority: normal -->
    - Contract for extensible email and SMS messaging
    - Tags: feature
    - [ ] Implement SMTP mailer driver <!-- created_at: 2026-06-18T11:31:00-04:00 priority: normal -->
    - [ ] Define plugin interface for additional providers <!-- created_at: 2026-06-18T11:32:00-04:00 priority: normal -->
- [ ] UI Builder <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, ui
  - [ ] Component Library <!-- created_at: 2026-06-18T11:40:00-04:00 priority: normal -->
    - Renderable UI components with plugin extensibility
    - Tags: feature
    - [ ] Implement base UIComponent interface and HTML sanitizer <!-- created_at: 2026-06-18T11:41:00-04:00 priority: normal -->
- [ ] Renderer <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, renderer
  - [ ] Layout Engine <!-- created_at: 2026-06-18T11:50:00-04:00 priority: normal -->
    - View rendering with layout composition and hook-driven slot insertion
    - Tags: feature
    - [ ] Implement Layout class with named slots, plugin override support, and render pipeline with before/after hooks <!-- created_at: 2026-06-18T10:55:00-04:00 priority: normal -->
- [ ] Hook Registry <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: framework, hooks
  - [ ] Hook System <!-- created_at: 2026-06-18T12:00:00-04:00 priority: high -->
    - Central hook registration and triggering system for layout slots, plugin events, core lifecycle
    - Tags: feature
    - [x] Implement register/addCallback/trigger with priority ordering ✓  <!-- committed 5fc42f2 — src/Hook/Registry.php + Plugin.php fully implemented (class method fallback, namespace dot-notation dispatch) -->
    - [ ] Support hook namespaces (layout.*, page.*, lifecycle.*) and batch triggering of multiple patterns

- [ ] Administration Panel <!-- created_at: 2026-06-18T12:10:00-04:00 priority: normal -->
  - `/admin` panel with all required sub-systems
  Tags: feature, admin
  - [ ] Dashboard (system status overview) <!-- created_at: 2026-06-18T12:11:00-04:00 priority: normal -->
  - [ ] Updates system (kernel + application version checking) <!-- created_at: 2026-06-18T12:12:00-04:00 priority: normal -->
  - [ ] System Settings (brand name, logo, etc.) <!-- created_at: 2026-06-18T12:13:00-04:00 priority: normal -->
  - [ ] Developer Console (variable introspection) <!-- created_at: 2026-06-18T12:14:00-04:00 priority: normal -->
  - [ ] Theme Preview (test against all UI components) <!-- created_at: 2026-06-18T12:15:00-04:00 priority: normal -->
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

## In Progress

- [x] Bootstrap Architecture <!-- created_at: 2026-06-18T14:10:00-04:00 priority: high -->
  - Design document for the mode-driven bootstrap system and both entry-point patterns
    Tags: framework, bootstrap, documentation
    - [x] Document BOOTSTRAP_MODES table (WEB vs CLI responsibilities) <!-- created_at: 2026-06-18T14:10:30-04:00 priority: high -->
    - [x] Document exact 2-line entry pattern for `/index.php` and `/cli` <!-- created_at: 2026-06-18T14:11:00-04:00 priority: high -->
    - [x] Specify `resolveConfigPath()` conventions for Config references <!-- created_at: 2026-06-18T14:11:30-04:00 priority: normal -->

- [ ] Bootstrap Implementation <!-- created_at: 2026-06-18T14:15:00-04:00 priority: high -->
  - Orchestration class (`Laswitchtech\CoreWeb\Bootstrap`) — mode-driven single-entry boot for WEB and CLI. Prerequisite for all other work.
    Tags: framework, bootstrap, feature
    - [x] Implement `new Bootstrap("WEB")` / `new Bootstrap("CLI")` constructor with static container() getter <!-- created_at: 2026-06-18T14:15:30-04:00 priority: high -->
      - Throws RuntimeException if container accessed before init
    Tags: feature-implement
    - [x] Implement `initConfig()` — load core.cfg, deep-merge local.cfg on top, store in Config singleton <!-- created_at: 2026-06-18T14:16:00-04:00 priority: high -->
    - [x] Implement `initContainer()` — create DI container instance as static singleton <!-- created_at: 2026-06-18T14:16:30-04:00 priority: high -->
    - [x] Implement `registerCoreServices(Container $c)` — register config, hook registry, session into container <!-- created_at: 2026-06-18T14:17:00-04:00 priority: high -->
    - [~] Implement `initExtensions()` — scan ext/{themes,plugins}/{name}/, validate manifests, register hooks <!-- created_at: 2026-06-18T14:17:30-04:00 priority: high -->
    - [ ] Implement `bootSubsystem("WEB")` chain: Router → global middleware → Request parse → dispatch → Response output <!-- created_at: 2026-06-18T14:18:00-04:00 priority: high -->
    - [ ] Implement `bootSubsystem("CLI")` chain: CLIRouter → load registered commands → arg parse → resolve handler → execute → exit code <!-- created_at: 2026-06-18T14:18:30-04:00 priority: high -->
    - [x] Implement `resolveConfigPath()` — return framework core.cfg + conditional local.cfg if path exists <!-- created_at: 2026-06-18T14:19:00-04:00 priority: high -->
    - [x] Create skeleton `/index.php` and `/cli` files matching the exact 2-line user pattern

## Validation
- [ ] Testing & Verification <!-- created_at: 2026-06-18T11:48:12-04:00 priority: normal -->
  - Tags: testing
  - [ ] Verify routing across all platforms <!-- created_at: 2026-06-18T13:00:00-04:00 priority: high -->
    - Test Apache, Nginx, and IIS routing with the skeleton application on localhost
    - Tags: testing

## Done

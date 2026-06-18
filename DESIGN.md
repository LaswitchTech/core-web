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
- Extensions live in `ext/{themes,plugins}/{name}/`
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

1. Application bootstrap (`index.php` → **Bootstrap class** with mode-driven initialization)
2. Configuration loader (core.cfg → local.cfg merge, Config class)
3. DI Container (minimal)
4. Router (server detection + routing rules)
5. Database abstraction (SQLite → MySQL)
6. Hook Registry
7. Renderer (layouts + views)
8. UI Builder (components)
9. Extension Manager (loader + manifest parser)
10. Messaging (SMTP → SMS provider interface)
11. CLI system (router-like command dispatch)
12. Admin panel (dashboard, settings, dev console, theme preview)

## Bootstrap Architecture

### Entry Points (`index.php` and `cli`)

Both follow the exact same 2-line pattern:

```php
require_once dirname(__DIR__) . "/vendor/autoload.php";
$BOOTSTRAP = new Laswitchtech\CoreWeb\Bootstrap("WEB"); // or "CLI"
```

### Bootstrap Class Responsibilities

Mode-driven single-entry bootstrap that handles all initialization. The mode string determines which subsystem chain runs:

| Mode | Responsibility |
|---------|----------------|
| `WEB` | Config → DI → Router → Request parse → Middleware pipeline → Route dispatch → Response output |
| `CLI`   | Config → CLI router → Args parse → Command resolve → Execute → Exit code |

### Bootstrap Execution Flow (ROUTER Mode)

```
Bootstrap("ROUTER")
  └── initConfig()
        load core.cfg
        merge local.cfg on top
        store in Config singleton

  └── initContainer()
        register core services (config, router, hook registry, session)
        return Container instance stored as static

  └── initExtensions()
         scan ext/{themes,plugins}/{name}/ directories
        register hooks and plugin providers

  └── bootSubsystem("ROUTER")
        create Router
        attach global middleware (error handling, CSRF check when on, session start)
        parse $_GET / $_POST / headers → Request object
        dispatch to matched route
        capture response → output buffered or stream directly
```

### Bootstrap Execution Flow (CLI Mode)

```
Bootstrap("CLI")
  └── initConfig()    // same as ROUTER mode

  └── initContainer() // same as ROUTER mode, but CLI subsystem registered instead of HTTP router

  └── bootSubsystem("CLI")
        load all plugin-registered commands
        parse $_SERVER["argv"] → namespace + command + args[]
        resolve handler:
          "core.*" → CoreWeb\CLI\Command\<namespace> classes
          "*"      → Extension-registered callbacks
        execute command
        return exit code (0 success, 1 error)
```

### Subsystem Selection Pattern

Both modes share the same initialization chain up to `bootSubsystem()`:

```php
class Bootstrap {
    public const MODE_ROUTER = "ROUTER";
    public const MODE_CLI    = "CLI";

    private string $mode;
    private static ?Container $instance = null;

    public function __construct(string $mode) {
        $this->mode = $mode;
        $this->run();
    }

    private function run(): void {
        Config::load($this->resolveConfigPath());  // core.cfg + local.cfg
        static::$instance = new Container();        // DI container initialized

        $this->registerCoreServices(static::$instance);  // config, hook registry, session

        switch ($this->mode) {
            case self::MODE_ROUTER:
                $router = new Router(static::$instance);
                $router->detectServerType();       // Apache / Nginx / IIS / built-in
                $router->loadCoreRoutes();         // framework-level routes (/admin, etc.)
                $response = $router->dispatch($_SERVER);
                echo $response->getBody();          // output the final response
                break;

            case self::MODE_CLI:
                $cli = new CLIRouter(static::$instance);
                $cli->loadRegisteredCommands();      // core commands + plugin-registered
                $exitCode = $cli->dispatch($_SERVER["argv"]);
                exit($exitCode);
                break;
        }
    }

    private function resolveConfigPath(): array {
        $basePath = __DIR__ . "/../../config/";  // framework path
        return [
            $basePath . "core.cfg",
            file_exists("./config/local.cfg") ? "./config/local.cfg" : null,
        ];
    }

    public static function container(): Container {
        if (static::$instance === null) {
            throw new RuntimeException("Bootstrap not initiated yet. Call Bootstrap::MODE_ROUTER or BOOTSTRAP_CLI first.");
        }
        return static::$instance;
    }
}
```

### What the Skeleton `index.php` Should Look Like

For end-users, the file stays minimal — one line of actual code:

```php
<?php
require_once dirname(__DIR__) . "/vendor/autoload.php";
$BOOTSTRAP = new Laswitchtech\CoreWeb\Bootstrap("WEB"); // or "CLI"
```

Any routing or custom logic lives inside `routes/` or a user-created bootstrap override. The framework handles request lifecycle end-to-end by default. Users can hook in via:

1. Extension hooks (non-invasive, plugin-driven)
2. Override file `index.php` with their own code before `new Bootstrap()`
3. Route-level middleware for selective request customization

## Naming Conventions

- Classes: `PascalCase` with meaningful prefixes (`Router`, `HookRegistry`, `ExtensionManifest`)
- Interfaces: `Interface` suffix (`MessageProviderInterface`, `PluginInterface`)
- Config files: kebab-case (`.env`, `extension.json`)
- Database tables: snake_case, plural (`users`, `admin_settings`)

# Bootstrap Component

## Overview

The `Bootstrap` class is the single-entry orchestrator for a Core-Web application. It runs a deterministic initialization chain — **Config → Container → Core Services → Extensions → Mode-Specific Subsystem** — inside the constructor, guaranteeing every request starts from an identical, well-defined state.

Two modes are supported:

| Mode | Meaning |
|------|---------|
| `WEB`   | HTTP request lifecycle (Router dispatch, response output) |
| `CLI`   | CLI command execution (argv parsing, command resolution, exit code) |

### Why This Design

#### Single Responsibility Without Duplication

Bootstrap does not contain routing logic, configuration parsing, or extension discovery. It *coordinates* those concerns in the correct sequence so that every subsystem finds its dependencies available when it boots.

#### Mode-Driven Branching at Construction

Accepting a mode string lets Bootstrap serve both web and CLI contexts through the same shared prefix (config → container → services), branching only during `bootWeb()` / `bootCli()`. No scattered `if` conditions appear downstream.

## Construction & Usage

```php
// index.php (WEB) — two lines, zero framework knowledge
require_once __DIR__ . '/vendor/autoload.php';
new Laswitchtech\CoreWeb\Bootstrap('WEB');
```

```bash
# cli (CLI)
#!/usr/bin/env php
<?php
require_once __DIR__ . '/vendor/autoload.php';
new Laswitchtech\CoreWeb\Bootstrap('CLI');
```

Both chains execute fully inside the constructor. Invalid mode values throw `\InvalidArgumentException` before any subsystem touches data.

## Properties

| Property | Type | Purpose |
|----------|------|---------|
| `$mode` | `readonly string` | `'WEB'` or `'CLI'` |
| `$appRoot` | `readonly string` | Resolved application root (absolute path) |
| `$configPaths` | `readonly list<string>` | `[core.cfg, local.cfg?]` in resolve order |

## Initialization Chain

### 1. App Root Resolution (`resolveAppRoot`)

Resolves the application root via priority:

1. **Constant override**: If `CORE_WEB_ROOT` is defined, use that value.
2. **Script filename**: Use `dirname(realpath($_SERVER['SCRIPT_FILENAME']))` (typical WEB).
3. **Current working directory**: Use `getcwd()` for CLI setups.
4. **Package fallback**: Use `dirname(__DIR__)` relative to this file — Composer installs without a user app root.

### 2. Config Path Resolution (`resolveConfigPaths`)

Searches `{appRoot}/config/`:

1. `core.cfg` — mandatory application config (JSON). If missing, skipped.
2. `local.cfg` — optional user overrides that merge on top of `core.cfg`.

Both paths are passed through `realpath()` for canonical absolute paths. Empty array is valid.

### 3. Config Loading (`initConfig`)

Delegates to `Config::load($this->configPaths)`. Deep-merge semantics inside load() make later files override earlier ones. See [Config Component](/docs/development/architecture/Config.md).

### 4. Container Creation (`initContainer`)

```php
static::$instance = new Container();
```

The container is the sole DI hub for all framework services and the only way subsystems communicate after bootstrap completes.

### 5. Core Service Registration (`registerCoreServices`)

Registers essential keys into the container:

| Key | Value | Why |
|-----|-------|-----|
| `config` | `'Laswitchtech\CoreWeb\Config'` (string) | Class ref for downstream introspection; Config is static so no instance needed. |
| `mode` | `'WEB'` or `'CLI'` | Subsystem routing selection (router vs CLI). |

### 6. Extension Discovery (`initExtensions`)

Walks `ext/{themes,plugins}/{name}/`, parses manifests, validates dependencies, registers hooks and layouts into the Hook Registry, indexes metadata in the Container, and installs an autoloader.

1. **Resolve base path**: Checks two candidates — user app root then vendor fallback. Stops at first found.
2. **Discover manifests**: Calls `Manifest\Parser::discover($extBase)`. Individual malformed manifests are logged to STDERR and skipped.
3. **Early return if no manifests**: Registers fresh `Hook\Registry` + `(object)[]`, returns silently. Normal for Composer-only installs.
4. **Dependency sanity (fail fast)**: For each manifest with non-empty `depends`, checks names against all known manifests. Throws `\RuntimeException` on unresolved deps.
5. **Autoloader**: Collects `src/` dirs from all extensions, registers a custom `spl_autoload_register` for `Laswitchtech\CoreWeb\Plugin\*` and `Laswitchtech\CoreWeb\Theme\*` namespaces.
6. **Hook / Layout processing**: Iterates manifests — hooks (dotted → empty callback placeholder or `class::method` → `addClassCall`), layouts → `layout.<name>`, indexes metadata into `$extIndex`.
7. **Bind**: `hook_registry` and `extension_index` stored in container.

### 7. Mode-Specific Boot (`bootWeb` / `bootCli`)

#### WEB Mode — Full Request Lifecycle

```php
$registry->trigger('plugin.started', ['mode' => 'web']);         // Step A: fire plugin hook
$router = new Router(Router::MODE_WEB);                          // Step B: create router
static::$instance->set('router', $router);                       // C: register in container
$registry->trigger('router.register', [...]                      // D: notify extensions
    ['router' => $router, 'container' => static::$instance]);
$response = $router->dispatch(Web::fromGlobals());               // E: build request + dispatch
$response->send();                                               // F: output headers + body
```

#### CLI Mode — Command Lifecycle

```php
$registry->trigger('plugin.started', ['mode' => 'cli']);         // Step A
$router = new Router(Router::MODE_CLI);                          // B
static::$instance->set('router', $router);                       // C
$registry->trigger('router.register', [...]);                    // D
$response = $router->dispatch(Cli::fromArgv($_SERVER['argv'])); // E
$response->send();                                               // F (body to stdout, no HTTP headers in CLI)
```

#### Hook Details

**`plugin.started`** is fired at step A so test / boot-time plugins can run logic before routing begins. Extensions receive `['mode' => 'web'|'cli']` as context.

**`router.register`** fires at step D after the Router instance is created and bound but *before* dispatch. It gives extensions a chance to register routes (for WEB) or commands (for CLI):

```php
$registry->trigger('router.register', [
    'router'    => $router,     // Router instance — call ->get(), ->command(), etc.
    'container' => static::$instance,  // DI hub full of services
    'mode'      => 'web',      // or 'cli'
]);
```

### 8. Response Lifecycle

| Step | Description | WEB behavior | CLI behavior |
|------|-------------|--------------|--------------|
| F1 | `send()` idempotency guard | No-op if already sent (safety for double-dispatch) | Same |
| F2 | HTTP headers emitted via PHP `header()` | Status line + Content-Type + custom headers | Skipped (`PHP_SAPI !== 'cli'`) |
| F3 | Output | `echo $this->body` → response to browser | `$stdout` (pipeable, not a page) |

## Lifecycle Diagram

```mermaid
sequenceDiagram
    participant App as index.php
    participant B as Bootstrap
    participant Cfg as Config
    participant DI as Container
    participant Ext as Extensions
    participant Hook as Registry
    participant R as Router
    participant W as Web/Cli request
    participant Resp as Response

    App->>+B: new Bootstrap('WEB'|'CLI')
    B->>B: resolveAppRoot()
    B->>B: resolveConfigPaths()

    B->>Cfg: ::load(core.cfg [, local.cfg])

    B->>DI: new Container()
    B->>DI: set('config', Config::class)
    B->>DI: set('mode', …)

    B->>B: initExtensions()
    Ext->>Ext: discover manifests
    Ext->>Hook: install callbacks for hooks/layouts
    Ext→DI: set('hook_registry', $reg)
    Ext→DI: set('extension_index', $idx)

    B->>R: new Router(MODE)
    R→DI: set('router', $router)
    B->>Hook: trigger('plugin.started')
    B->>Hook: trigger('router.register')

    alt WEB mode
        B->>W: Web::fromGlobals()
    else CLI mode
        B->>W: Cli::fromArgv(argv[])
    end

    B->>R: dispatch($request)
    R-->>B: Response

    B->>Resp: send()
    Resp-->>App: headers+body (WEB) or stdout (CLI)
    B-->>-App: exit(0) or return

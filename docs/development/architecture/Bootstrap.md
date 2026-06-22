# Bootstrap Component

## Purpose

Mode-driven single-entry bootstrap for Core-Web applications. Orchestrates the full initialization chain (Config → Container → Core Services → Extensions → Subsystem) so that every application starts from an identical, well-defined state regardless of deployment target.

## Responsibilities

- Accept a mode string (`'WEB'` or `'CLI'`) and validate it on construction.
- Resolve the application root directory (via `CORE_WEB_ROOT` constant, `SCRIPT_FILENAME`, `getcwd()`, or relative to source file).
- Locate `config/core.cfg` and optionally `config/local.cfg` for config loading.
- Create a DI Container and bind core services (**config**, **mode**) into it.
- Discover extensions under `{appRoot}/ext/` (or package `ext/` fallback), parse their manifests, validate dependencies, and register hooks/layouts.
- Dispatch the request through a mode-specific router and output the response.
- Provide static access to the initialized Container via `Bootstrap::container()`.

## Public API

### Class Constants

| Constant | Value |
|----------|-------|
| `MODE_WEB`  | `'WEB'` |
| `MODE_CLI`  | `'CLI'` |

### Constructor

```php
__construct(string $mode): void
```

- Accepts exactly `'WEB'` or `'CLI'`.
- Throws `\InvalidArgumentException` for any other value.
- Runs the full init chain synchronously in the constructor; exits via `die()` on boot failure (graceful stderr message when running under PHP's built-in server).

### Static Methods

| Signature | Returns | Throws |
|-----------|---------|--------|
| `static container(): \Laswitchtech\CoreWeb\Container` | The initialized DI container. | `\RuntimeException` if bootstrap has not run yet. |

## Internal Architecture

### Instance Properties (readonly)

Each Bootstrap instance holds three readonly properties resolved once in the constructor:

| Property | Type | Resolution |
|----------|------|------------|
| `$mode` | `string` | The argument passed to the constructor (`'WEB'` or `'CLI'`). |
| `$appRoot` | `string` | Resolved by `resolveAppRoot()` (see Path Resolution below). |
| `$configPaths` | `array<non-empty-string>` | Resolved by `resolveConfigPaths()` — always includes `core.cfg`, optionally includes `local.cfg`. |

### Shared Static Store

```php
private static ?Container $instance = null;
```

The DI container is stored in the private static property `$instance` and is set during `initContainer()`. It becomes available via `Bootstrap::container()` after construction completes successfully.

### Initialization Chain (`run()`)

The constructor invokes `run()` which executes this exact sequence inside a try/catch:

1. **`initConfig()`** — Calls `Config::load($this->configPaths)` (deep-merge internally; later files override earlier).
2. **`initContainer()`** — Creates `$instance = new Container()`.
3. **`registerCoreServices($instance)`** — Binds two services:
   - `'config'` → `Config::class`
   - `'mode'` → the resolved mode string (`'WEB'` or `'CLI'`)
4. **`initExtensions()`** (see Extension Flow below).
5. **Mode-specific subsystem dispatch**:
   - WEB → `bootWeb()`
   - CLI → `bootCli()`

If any step throws `\Throwable`, the catch block writes to STDERR (built-in server) or calls `die()` (everything else).

### Path Resolution

**`resolveAppRoot(): string`** — search order (priority descending):

1. Constant `CORE_WEB_ROOT` (if defined, cast to string).
2. Directory of `$_SERVER['SCRIPT_FILENAME']` (resolved via `realpath()`).
3. Current working directory (`getcwd()`).
4. `dirname(__DIR__)` — relative to this file's source (fallback for package/install installs).

**`resolveConfigPaths(): array`** — search order:

1. `{appRoot}/config/core.cfg` — required; found via `realpath()`.
2. `{appRoot}/config/local.cfg` — optional overlay; merged on top inside `Config::load()` when present.

### Extension Flow (`registerExtensions()`)

This method handles all extension discovery and registration as a single step:

1. **Resolve app root** — already stored in `$this->appRoot`.
2. **Find ext base** — walks two candidate directories:
   - `{$this->appRoot}/ext` (primary, user application)
   - `dirname(__DIR__) . '/ext'` (fallback, package/vendor install)
   Stores the first existing directory as `$extBase` and binds it to the container under `'extension_base'`. Also binds `$this->appRoot` under `'app_root'`.
3. **Early return if no ext/ found** — if neither candidate is a directory, registers an empty `\Laswitchtech\CoreWeb\Hook\Registry()` (under `'hook_registry'`) and an empty stdClass object (under `'extension_index'`), then returns.
4. **Discover & parse manifests** — calls `Manifest\Parser::discover($extBase)` which walks `{themes,plugins}/{name}/manifest.json` files in every subdirectory, parses them as JSON, validates required keys (`type`, `name`, `version`, `hooks`, `layouts`), and returns an array of `\Laswitchtech\CoreWeb\Manifest\Extension` objects.
5. **Dependency sanity check** — if manifests were found but no dependencies are declared, skips to registration. If dependencies exist, iterates them: throws `\RuntimeException` on the first unresolved dependency (uses `array_column($manifests, 'name')` as the set of known names). Discovery itself is tolerant; only *unresolved* deps cause failure.
6. **Collect extension src directories** — for every manifest with an existing `{directory}/src` subdirectory, appends that path to `$srcDirs`.
7. **Register autoloader** — registers a closure via `spl_autoload_register()` that handles prefixes `Laswitchtech\CoreWeb\Plugin\` and `Laswitchtech\CoreWeb\Theme\`. For each matching class, strips the prefix, converts `\` to `/`, appends `.php`, and checks every collected `$srcDir` for the file (using `require_once`).
8. **Parse hooks into Registry** — creates a new `\Laswitchtech\CoreWeb\Hook\Registry()`. For each manifest:
   - **Hook definitions**: entries without `::` are registered as named hook stubs (empty callback) so downstream code can inspect them. Entries with `::` are split on the first `::` for the hook name and the last `::` for `classFqcn::methodName`. The autoloader from step 7 must be active before `addClassCall()` runs (so ReflectionClass can load the class). All callbacks register at priority 0.
   - **Layout definitions**: each string layout identifier registers a placeholder callback on `"layout.{$layoutDef}"` via `addCallback()`.
9. **Store extension index** — builds an associative array keyed by extension name with fields: `type`, `version`, `directory`, `depends`. Stored in the container under `'extension_index'` as `<object>`.
10. **Bind resolved services** — `'hook_registry'` → the populated `\Laswitchtech\CoreWeb\Hook\Registry()`.

### WEB Flow (`bootWeb()`)

```php
private function bootWeb(): void
```

1. Triggers `plugin.started` hook via `$registry->trigger('plugin.started', ['mode' => 'web'])` (only if the registry instance is `\Laswitchtech\CoreWeb\Hook\Registry`).
2. Creates a new `Router(Router::MODE_WEB)`.
3. Binds `'router'` → the Router instance in the container.
4. Triggers `router.register` hook with `['router' => $router, 'container' => static::$instance, 'mode' => 'web']`.
5. Dispatches the request: `$router->dispatch(Web::fromGlobals())`.
6. Sends response: `$response->send()`.

### CLI Flow (`bootCli()`)

```php
private function bootCli(): void
```

1. Triggers `plugin.started` hook via `$registry->trigger('plugin.started', ['mode' => 'cli'])` (same guard as WEB).
2. Creates a new `Router(Router::MODE_CLI)`.
3. Binds `'router'` → the Router instance in the container.
4. Triggers `router.register` hook with `['router' => $router, 'container' => static::$instance, 'mode' => 'cli']`.
5. Dispatches the request: `$router->dispatch(Cli::fromArgv($_SERVER['argv'] ?? []))`.
6. Sends response: `$response->send()`.

### Container Bindings Summary

The Bootstrap class binds exactly these keys into the container (in registration order):

| Key | Value | Time of binding |
|-----|-------|-----------------|
| `config` | `Config::class` | `registerCoreServices()` |
| `mode` | `'WEB'` or `'CLI'` | `registerCoreServices()` |
| `app_root` | resolved application root path (`$this->appRoot`) | `registerExtensions()` |
| `extension_base` | first existing `ext/` directory, or `null` | `registerExtensions()` |
| `hook_registry` | `\Laswitchtech\CoreWeb\Hook\Registry()` (empty or populated) | `registerExtensions()` |
| `extension_index` | `<object>` of `{name => [type, version, directory, depends]}` | `registerExtensions()` |
| `router` | `Router` instance | `bootWeb()` / `bootCli()` |

## Lifecycle

1. **Construction** (`new Bootstrap('WEB')`): Constructor validates mode → resolves app root → resolves config paths → calls `run()`.
2. **Init chain** (inside `run()`): Config loads → Container created → core services bound (`config`, `mode`) → extensions discovered and registered → mode-specific boot runs.
3. **Dispatch**: Router processes the request; response is sent synchronously. No further Bootstrap interaction is needed.
4. **Destruct** — PHP garbage-collects the container and all bound objects when the request/script ends. The static `$instance` remains until the process terminates (CLI) or the next bootstrap replaces it (built-in server multi-worker).

## Future Enhancements

- **Mode detection from environment** — currently requires explicit mode argument; could auto-detect WEB vs CLI via `PHP_SAPI`.
- **Graceful shutdown hooks** — no mechanism exists to run cleanup code between response output and process termination.
- **Per-extension lifecycle management** — extensions are discovered once at boot with no way to hot-reload or unregister them mid-request.
- **Config reload capability** — `Config::load()` is called once during bootstrap; no runtime reload API is exposed.

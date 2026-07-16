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

### Renderer Initialization (`initRenderer()`)

The renderer subsystem is initialized by `initRenderer(string $mode): Renderer`, called from both `bootWeb()` and `bootCli()`:

1. **Create EngineRegistry** — instantiates a fresh engine registry.
2. **Register PhpEngine** — registers the built-in PHP template engine as `'php'`.
3. **Register LatteEngine($appRoot)** — registers the Latte engine, passing `$this->appRoot` so its cache directory can be resolved.
4. **Trigger `renderer.engine.register`** — fires the hook via the Hook\Registry with context `[engineRegistry, container, mode]`, allowing extensions to add engines before renderer creation.
5. **Create RendererRegistry** — instantiates a fresh resource registry for layouts/templates/views.
6. **Create Renderer(registry, engineRegistry)** — wires both registries into the renderer pipeline.
7. **Store three keys in the container**:
   - `'renderer_registry'` → `Renderer\Registry` instance
   - `'renderer_engine_registry'` → `Renderer\Engine\Registry` instance
   - `'renderer'` → `Renderer` instance
8. **Return** the `$renderer` instance.

### WEB Flow (`bootWeb()`)

```php
private function bootWeb(): void
```

1. Triggers `plugin.started` hook via `$registry->trigger('plugin.started', ['mode' => 'web'])` (only if the registry instance is `\Laswitchtech\CoreWeb\Hook\Registry`).
2. Calls `initRenderer('web')`, resolves $renderer.
3. Resolves `$rendererRegistry` from container (`renderer_registry`).
4. Triggers `renderer.register` hook with `[registry => $rendererRegistry, renderer => $renderer, container => static::$instance, mode => 'web']`.
5. Creates a new `Router(Router::MODE_WEB)`.
6. Binds `'router'` → the Router instance in the container.
7. Triggers `router.register` hook with `['router' => $router, 'container' => static::$instance, 'mode' => 'web']`.
8. Dispatches the request: `$response = $router->dispatch(Web::fromGlobals())`.
9. Sends response: `$response->send()`.

### CLI Flow (`bootCli()`)

```php
private function bootCli(): void
```

1. Triggers `plugin.started` hook via `$registry->trigger('plugin.started', ['mode' => 'cli'])` (same guard as WEB).
2. Calls `initRenderer('cli')`, resolves $renderer.
3. Resolves `$rendererRegistry` from container (`renderer_registry`).
4. Triggers `renderer.register` hook with `[registry => $rendererRegistry, renderer => $renderer, container => static::$instance, mode => 'cli']`.
5. Creates a new `Router(Router::MODE_CLI)`.
6. Binds `'router'` → the Router instance in the container.
7. Triggers `router.register` hook with `['router' => $router, 'container' => static::$instance, 'mode' => 'cli']`.
8. Dispatches the request: `$response = $router->dispatch(Cli::fromArgv($_SERVER['argv'] ?? []))`.
9. Sends response: `$response->send()`.

### Asset Lifecycle (`initAssets()` + Canonical Routes)

#### `initAssets()` — Registry Creation and Population Conventions

Executed after `initExtensions()` but before mode-specific dispatch. Creates the asset registry with kernel/application discovery conventions, stores it in the container, then triggers the `asset.register` hook for extension population:

1. **Create fresh `$registry = new AssetRegistry()`**
2. **Conventional kernel discovery** — checks for kernel assets using these paths (LESS is checked before CSS):

   ```
   {kernelRoot}/Assets/less/styles.less
   {kernelRoot}/Assets/css/styles.css
   {kernelRoot}/Assets/js/kernel.js
   ```

   Rules:
   - LESS (`styles.less`) is checked before CSS (`styles.css`).
   - Only the **first readable regular stylesheet** found at a given location is registered.
   - Kernel JavaScript discovery is independent from kernel stylesheet discovery.
   - When a file exists, it is resolved via `realpath()` and registered with:

     ```php
     // Kernel styles (stylesheet)
     $registry->css(
         'kernel',           // scope
         'styles.less',      // file name (leaf)
         realpath($resolvedKernelPath),  // physical path
         AssetEntry::PROVIDER_CORE,      // provider
         100,                            // priority
     );

     // Kernel JavaScript
     $registry->js(
         'kernel',                        // scope
         'kernel.js',                     // file name (leaf)
         realpath($resolvedKernelJs),     // physical path
         AssetEntry::PROVIDER_CORE,       // provider
         100,                             // priority
     );
     ```

   Kernel assets use `scope = 'kernel'`, `provider = 'core'` (or `AssetEntry::PROVIDER_CORE`), and `priority = 100`.

3. **Conventional application discovery** — checks for application assets using these paths (LESS is checked before CSS):

   ```
   {appRoot}/Assets/less/styles.less
   {appRoot}/Assets/css/styles.css
   {appRoot}/Assets/js/app.js
   ```

   Rules:
   - LESS (`styles.less`) is checked before CSS (`styles.css`).
   - Only the **first readable regular stylesheet** found at a given location is registered.
   - Application JavaScript discovery is independent from application stylesheet discovery.
   - When a file exists AND does not duplicate a kernel asset (duplicate suppression, see below), it is resolved via `realpath()` and registered with:

     ```php
     // Application styles (stylesheet)
     $registry->css(
         'app',                         // scope
         'styles.less',                 // file name (leaf)
         realpath($resolvedAppPath),    // physical path
         AssetEntry::PROVIDER_APP,      // provider
         200,                           // priority
     );

     // Application JavaScript
     $registry->js(
         'app',                          // scope
         'app.js',                       // file name (leaf)
         realpath($resolvedAppJs),       // physical path
         AssetEntry::PROVIDER_APP,       // provider
         200,                            // priority
     );
     ```

   Application assets use `scope = 'app'`, `provider = 'app'` (or `AssetEntry::PROVIDER_APP`), and `priority = 200`.

4. **Duplicate suppression** — at each discovery step (kernel → app):
   - **Application CSS is skipped** when it resolves to the same physical file as kernel CSS (`realpath($appCss) === realpath($kernelCss)`).
   - **Application JS is skipped** when it resolves to the same physical file as kernel JS (`realpath($appJs) === realpath($kernelJs)`).
   Skipping prevents duplicate compilation of identical compiled output.

5. **Store in container**: `$c->set('asset_registry', $registry)`
6. **Trigger `asset.register` hook** — fires only if the registry instance is `\Laswitchtech\CoreWeb\Hook\Registry`, passing:
     - `'registry'` → the populated AssetRegistry
     - `'container'` → `static::$instance` (current bootstrap run)
     - `'mode'` → lowercase string (`'web'` or `'cli'`)

This is where enabled themes/plugins register their CSS/JS assets by calling `$registry->css('...', ...)` or `$registry->js('...', ...)`. Only **enabled** extensions have their hooks registered (in `initExtensions()`), so disabled extensions cannot populate the asset registry.

#### Canonical Routes — Request-Time Dispatch and Resolution

The following routes are registered at request time by `bootWeb()`. All extension-provided routes resolve their physical files from Asset Registry entries; route parameters are **never** directly converted into filesystem paths.

| Route Pattern | Description / Behavior |
|---|---|
| `/css` | Compiled LESS output (all `.less` entries registered in the registry, merged and compiled). Returns 200 with `text/css`. |
| `/css/kernel` | Kernel scoped CSS compilation (`scope = 'kernel'`). Returns 404 when no kernel entry exists. |
| `/js/kernel` | Kernel scoped JS emission (`scope = 'kernel'`). Returns 404 when no kernel entry exists. |
| `/css/app` | Application scoped CSS compilation (`scope = 'app'`). Returns 404 when no app entry exists. |
| `/js/app` | Application scoped JS emission (`scope = 'app'`). Returns 404 when no app entry exists. |
| `/{type}/themes/{extension}/{file}` / `/{type}/plugins/{extension}/{file}` | Single extension asset lookup by type (css/js), scope prefix, and file name. Extension aliases require exactly one explicit default; physical path is resolved from the Registry entry stored during init. Returns 403 for remote-registered paths, 404 for missing physical files or malformed identities. |
| `/{type}/themes/{extension}` / `/{type}/plugins/{extension}` | Directory listing fallback — requires one explicit default asset to resolve; returns 404 when no matching entry exists. |

**Resolution rules:**
- Physical paths are resolved exclusively from Asset Registry entries populated at init time.
- Route parameters are never directly converted into filesystem paths.
- Malformed or unknown identities return **404**.
- Remote-registered paths return **403**.
- Missing physical files on disk return **404**.

#### Compile-time Caching (Production / Debug-Off)

When `app.debug` is `false`, compiled CSS for scope-scoped routes is persisted to the cache directory (`renderer.less.cache_dir`, defaulting to `{appRoot}/storage/cache/renderer/less`) keyed by a hash of resolved physical paths. Subsequent requests serve from disk when source files have not changed, avoiding re-compilation. The `/css` flat-route always compiles fresh in this mode unless a matching cache key exists.

---

---

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
| `template_registry` | `\Laswitchtech\CoreWeb\Message\Template\Registry` instance | `initTemplateRegistry()` |
| `renderer_registry` | `Renderer\Registry` instance | `initRenderer()` |
| `renderer_engine_registry` | `Renderer\Engine\Registry` instance | `initRenderer()` |
| `renderer` | `Renderer` instance wired with both registries | `initRenderer()` |
| `router` | `Router` instance | `bootWeb()` / `bootCli()` |
| `db_driver`      | `\Laswitchtech\CoreWeb\Database\Driver\Sqlite` (singleton) | `registerDbServices()`           |
| `db_connection`  | `Connection` (lazy singleton — resolved only on first access) | `registerDbServices()`           |

---

### Database Initialization (`registerDbServices()`)

Called after `registerCoreServices()` and before `initExtensions()`:

1. **Validate driver** — reads `database.driver` from config; Phase 1 requires `'sqlite'` and throws `\RuntimeException` for any other value.
2. **Resolve database path** — reads `database.path`; defaults to `'data/app.db'` from core.cfg fallback.
3. **Register driver singleton** — binds `'db_driver'` to `\Laswitchtech\CoreWeb\Database\Driver\Sqlite`.
4. **Register connection factory** — binds `'db_connection'` as a lazy singleton; the closure:
   - Resolves `$driver = $container->resolve('db_driver')` (unwraps Sqlite).
   - Reads `app_root` for base-path resolution (defaults to `getcwd()` if missing).
   - Calls `$driver->connect(['path' => $databasePath, 'basePath' => $basePath])`.
5. If any step fails, throws `\RuntimeException` which is caught by the bootstrap's global `try/catch(\Throwable)` and surfaces as a boot error (`die()` or stderr).

---

### Extension Loading and Hook Registration

#### Manifest Discovery

1. Walk `{extBase}/plugins/` + `{extBase}/themes/`.
2. For each subdirectory, attempt to parse `manifest.json`.
3. Validate required fields (`type`, `name`, `version`, `hooks`, `layouts`).
4. Invalid manifests are **skipped** (tolerant — one broken manifest does not block discovery).

#### Hook Registration

For every manifest with non-empty hooks:

1. If the extension has a `src/` directory, register an autoloader for it.
2. For each hook entry in manifest:
    - Simple name (e.g., `"my.hook"`) → registers as a named stub on `Hook\Registry`.
    - Dotted namespace (e.g., `"layout.header::app.MyView"`) → calls `$registry->addClassCall('layout.header', 'MyView', 0)`.

For every manifest with non-empty layouts:

1. Register placeholder callbacks for each layout name into the Hook\Registry.

#### Extension Index

After all manifests are processed, an index is built and bound into the container as a stdClass object containing `{name => [type, version, directory]}` for each successfully parsed extension.

#### Template Registry Initialization

During bootstrap initialization, the `initTemplateRegistry()` method scans all discovered extensions in the extension index for template files. Templates are loaded according to their priority within the registry (kernel-plugin=100, kernel-theme=200, app-plugin=300, app-theme=400, core=0) and are registered under the appropriate namespace (`mail` or `sms`). This ensures that extensions can override core templates while maintaining a single point of template discovery.

---

### Key Design Decisions

1. **Engine registry fires before renderer creation** — extensions can add engines during `renderer.engine.register`; these will be available when the Renderer is created and later used during rendering.

2. **Three container bindings per subsystem** — the renderer subsystem stores `renderer_registry`, `renderer_engine_registry`, AND `renderer` separately, allowing extensions to inject into registries after `renderer.register` fires but before first render occurs.

3. **Extension discovery happens before ANY subsystem** — all hooks are registered prior to router creation, meaning route registrations in `renderer.register` and `router.register` can reference resources added by other plugins.

4. **Lazy extension source loading** — the autoloader is only registered when extensions with `src/` directories exist; empty `ext/` folders cause no issues or overhead.

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

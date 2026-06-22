<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;
use Laswitchtech\CoreWeb\Router\Router;

/**
 * Mode-driven single-entry bootstrap.
 * Documentation: docs/development/architecture/bootstrap.md
 *
 * Orchestrates the full initialization chain:
 *   Config -> Container -> CoreServices -> Extensions -> Subsystem
 *
 * Two modes are supported:
 *   "WEB"    -- HTTP request lifecycle (Router, middleware, dispatch, output)
 *   "CLI"    -- CLI command lifecycle (Router in CLI mode, arguments, execute, output)
 */
class Bootstrap
{
    /** Container reference -- shared static store so subsystems can call
     *  `Bootstrap::container()` after bootstrap completes.               */
    private static ?Container $instance = null;

    const MODE_WEB  = 'WEB';
    const MODE_CLI  = 'CLI';

    private readonly string $mode;

    /** Resolved application root directory (used by config, extensions, etc.). */
    private readonly string $appRoot;

    /** Resolved config file paths: core.cfg (+ optional local.cfg on top). */
    private readonly array $configPaths;

    /* ------------------------------------------------------------------ --/
     /  Constructor                                                         */
    /* ------------------------------------------------------------------ */

    public function __construct(string $mode)
    {
        if (!in_array($mode, [self::MODE_WEB, self::MODE_CLI], true)) {
            throw new \InvalidArgumentException(
                "Bootstrap mode must be 'WEB' or 'CLI'. Got: {$mode}"
            );
        }

        $this->mode        = $mode;
        $this->appRoot     = $this->resolveAppRoot();
        $this->configPaths = $this->resolveConfigPaths();
        $this->run();
    }

    /* ------------------------------------------------------------------ --/
     /  Boot Chain                                                          */
    /* ------------------------------------------------------------------ */

    private function run(): void
    {
        try {
            $this->initConfig();
            $this->initContainer();
            $this->registerCoreServices(static::$instance);
            $this->initExtensions();

            switch ($this->mode) {
                case self::MODE_WEB:
                    $this->bootWeb();
                    break;

                case self::MODE_CLI:
                    $this->bootCli();
                    break;
            }
        } catch (\Throwable $e) {
            if (defined('PHP_CLI_SERVER_WORKERS')) {
                fwrite(STDERR, "Bootstrap failure: {$e->getMessage()}\n");
            } else {
                die("Bootstrap failure: " . $e->getMessage() . "\n");
            }
        }
    }

     /* ------------------------------------------------------------------ --/
      /  Config                                                              */
    /* ------------------------------------------------------------------ */

    /**
     * Resolve the application root directory.
     *
     * Search order (priority descending):
     *   1. Constant CORE_WEB_ROOT (if defined)
     *   2. SCRIPT_FILENAME of the executing script
     *   3. Current working directory
     *   4. Relative to this file (__DIR__/.. — fallback for CLI / package installs)
     */
    private function resolveAppRoot(): string
    {
        // Allow external override.
        if (defined('CORE_WEB_ROOT')) {
            return (string) CORE_WEB_ROOT;
        }

        // Try the executing script's directory (typical WEB deployment).
        $script = $_SERVER['SCRIPT_FILENAME'] ?? null;
        if (is_string($script) && $script !== '') {
            $resolved = realpath($script);
            if ($resolved !== false) {
                return dirname($resolved);
            }
        }

        // Fallback to getcwd() for CLI / simple setups.
        $cwd = getcwd();
        if ($cwd !== false) {
            return $cwd;
        }

        // Ultimate fallback -- relative to this file (package/vendor installs).
        return dirname(__DIR__);
    }

    private function initConfig(): void
    {
        // Config::load handles deep-merge internally (later files override earlier).
        if ($this->configPaths !== []) {
            Config::load($this->configPaths);
        }
    }

    /**
     * Locate core.cfg then append local.cfg if present.
     *
     * Search order (same for both config files):
     *   1. App-root         -> {appRoot}/config/core.cfg
     */
    private function resolveConfigPaths(): array
    {
        $paths = [];

        // Find core.cfg in app-root only.
        $candidate = "{$this->appRoot}/config/core.cfg";
        if (is_file($candidate)) {
            $real = realpath($candidate);
            if ($real !== false) {
                $paths[] = $real;
            }
        }

        // Append local.cfg (optional override).
        $candidate = "{$this->appRoot}/config/local.cfg";
        if (is_file($candidate)) {
            $real = realpath($candidate);
            if ($real !== false) {
                $paths[] = $real;  // merges on top inside Config::load().
            }
        }

        return $paths;
    }

    /* ------------------------------------------------------------------ --/
     /  DI Container                                                          */
    /* ------------------------------------------------------------------ */

    private function initContainer(): void
    {
        static::$instance = new Container();
    }

    /** Register core framework services into the container. */
    private function registerCoreServices(Container $c): void
    {
        // Configuration class reference -- Config::load() is static, but storing
        // it here keeps the container as the single shared knowledge point.
        $c->set('config', Config::class);

        // Bootstrap mode for downstream subsystem selection (router vs cli).
        $c->set('mode', $this->mode);
    }

    /* ------------------------------------------------------------------ --/
     /  Extensions                                                          */
    /* ------------------------------------------------------------------ */

    /** Entry point for extension discovery — delegates to ``registerExtensions()``. */
    private function initExtensions(): void
    {
        $this->registerExtensions();
    }

    /**
     * Walk ``ext/{themes,plugins}/{name}/``, parse/validate manifests, check dependencies,
     * register hook callbacks into Hook\Registry, and store extension metadata in the Container.
     *
     * Manifest discovery is tolerant: individual malformed manifests are logged to STDERR and
     * skipped so one broken extension does not block discovery of valid extensions.
     * Bootstrap still fails fast on unresolved dependencies between successfully parsed manifests.
     *
     * If no ``ext/`` directory exists, registers an empty hook registry and returns silently —
     * this is normal for Composer installs that ship without extensions by default.
     */
    private function registerExtensions(): void
    {
        $c     = static::$instance;
        if ($c === null) {
            throw new \RuntimeException('Container not yet initialised when initExtensions() runs.');
        }

        // Resolve extension base directories — app root first, then vendor fallback.
        $candidates = [
            "{$this->appRoot}/ext",                    // primary: user's application root
            dirname(__DIR__) . '/ext',                  // fallback: package/vendor install
        ];

        // If no ext/ directory is found, register empty hooks and return early.
        // Composer installs may ship without extensions by default.
        foreach ($candidates as $dir) {
            if (is_dir($dir)) {
                $extBase = $dir;
                break;
            }
        }

        // Diagnostic bindings: useful for debugging install layout and extension discovery.
        // These are informational values, not required runtime services.
        $c->set('app_root',      $this->appRoot);
        $c->set('extension_base', isset($extBase) ? $extBase : null);

        if (!isset($extBase)) {
            // No ext/ directory found — register empty hooks and return.
            // This is normal for Composer installs that ship without extensions
            // by default; users create ext/{name}/manifest.json when ready.
            $c->set('hook_registry', new \Laswitchtech\CoreWeb\Hook\Registry());
            $c->set('extension_index', (object) []);

            return;
        }

        // ── 2. Discover & parse every manifest (tolerant — bad manifests are logged and skipped). -
        $manifests = Manifest\Parser::discover($extBase);

        if ($manifests === []) {
            // Register empty registry so `bootWeb()` / `bootCli()` can still resolve 'hook_registry'.
            $c->set('hook_registry', new \Laswitchtech\CoreWeb\Hook\Registry());
            $c->set('extension_index', (object) []);

            return; // Nothing to do -- no extensions found.
        }

        // ── 3. Dependency sanity check (throws — fail fast on *unresolved* deps only, discovery is tolerant). -
        $knownNames = array_column($manifests, 'name');
        foreach ($manifests as $m) {
            if ($m->depends === []) {
                continue;
            }
            foreach ($m->depends as $dep) {
                if (!in_array($dep, $knownNames, true)) {
                    throw new \RuntimeException(
                        "Extension '{$m->name}': unresolved dependency '{$dep}'. "
                        . 'Known: ' . implode(', ', array_unique($knownNames))
                    );
                }
            }
        }

        // ── 4. Collect src/ directories from all extensions (before any hook processing) --
        $srcDirs = [];
        foreach ($manifests as $manifest) {
            if (is_dir("{$manifest->directory}/src")) {
                $srcDirs[] = "{$manifest->directory}/src";
            }
        }

        // ── 5. Register extension autoloader BEFORE parsing hooks --------------
        $uniqueSrcDirs = array_values(array_unique($srcDirs));

        spl_autoload_register(function (string $class) use ($uniqueSrcDirs): void {
            if (str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\') === false
                && str_starts_with($class, 'Laswitchtech\\CoreWeb\\Theme\\') === false) {
                return;
            }

            $prefix   = str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\')
                ? strlen('Laswitchtech\\CoreWeb\\Plugin\\')
                : strlen('Laswitchtech\\CoreWeb\\Theme\\');
            $relPath  = str_replace('\\', '/', substr($class, $prefix));

            foreach ($uniqueSrcDirs as $dir) {
                $file = "{$dir}/{$relPath}.php";
                if (is_file($file)) {
                    require_once $file;
                    return;
                }
            }
        });

        // ── 6. Create Hook\Registry and iterate manifests --------------------
        $hookRegistry = new \Laswitchtech\CoreWeb\Hook\Registry();
        $extIndex     = [];

        foreach ($manifests as $manifest) {

            // -- Hooks (class::method or dotted namespace) -------------------------
            foreach ($manifest->hooks as $hookDef) {
                if (!str_contains($hookDef, '::')) {
                    // Dotted namespace hook (e.g. "layout.header") -- register with
                    // empty callback placeholder so subsystems can inspect the hook later.
                    $hookRegistry->addCallback($hookDef, static fn () => [], 0);
                    continue;
                }

                // Split on "::" -- first occurrence separates hook name from class::method pair.
                $firstColon = strpos($hookDef, '::');
                $hookName   = substr($hookDef, 0, $firstColon);
                $classMethod= trim(substr($hookDef, $firstColon + 2));

                // Find the last "::" within classMethod to split class FQCN from method name.
                $lastDblPos = strrpos($classMethod, '::');
                if ($lastDblPos === false) {
                    $hookRegistry->addCallback($hookName, static fn () => [], 0);
                    continue;
                }

                // Try to register via class_exists + addClassCall (requires the autoloader
                // from §5 to be in place so ReflectionClass can load it).
                $classFqcn = substr($classMethod, 0, $lastDblPos);
                $methodNm  = substr($classMethod, $lastDblPos + 2);

                $hookRegistry->addClassCall($hookName, "{$classFqcn}::{$methodNm}", 0);
            }

            // -- Layouts (list of layout identifiers) ------------------------------
            foreach ($manifest->layouts as $layoutDef) {
                if (is_string($layoutDef)) {
                    $hookRegistry->addCallback("layout.{$layoutDef}", static fn () => [], 0);
                }
            }

            // -- Index extension metadata into Container ---------------------------
            $extIndex[$manifest->name] = [
                'type'      => $manifest->type,
                'version'   => $manifest->version,
                'directory' => $manifest->directory,
                'depends'   => $manifest->depends,
            ];
        }

        // -- Bind resolved Hook\Registry and extension index into container -----
        $c->set('hook_registry', $hookRegistry);
        $c->set('extension_index', (object) $extIndex);
    }

    /* ------------------------------------------------------------------ --/
     /  Subsystems (mode-specific)                                          */
    /* ------------------------------------------------------------------ */

    /** BOOTSTRAP WEB CHAIN. */
    private function bootWeb(): void
    {
        // Fire plugin-started hook so test plugins can run bootstrap-time.
        $registry = static::$instance->resolve('hook_registry');
        if ($registry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $registry->trigger('plugin.started', ['mode' => 'web']);
        }

        // Create router in WEB mode and fire the route-registration hook.
        $router = new Router(Router::MODE_WEB);
        if (static::$instance !== null) {
            static::$instance->set('router', $router);
        }
        if ($registry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $registry->trigger('router.register', [
                'router'    => $router,
                'container' => static::$instance,
                'mode'      => 'web',
            ]);
        }

        // Dispatch the request and send response.
        $response = $router->dispatch(Web::fromGlobals());
        $response->send();
    }

    /** BOOTSTRAP CLI CHAIN. */
    private function bootCli(): void
    {
        // Fire plugin-started hook so test plugins can run bootstrap-time.
        $registry = static::$instance->resolve('hook_registry');
        if ($registry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $registry->trigger('plugin.started', ['mode' => 'cli']);
        }

        // Create router in CLI mode and fire the route-registration hook.
        $router = new Router(Router::MODE_CLI);
        if (static::$instance !== null) {
            static::$instance->set('router', $router);
        }
        if ($registry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $registry->trigger('router.register', [
                'router'    => $router,
                'container' => static::$instance,
                'mode'      => 'cli',
            ]);
        }

        // Dispatch the request and exit with the response code.
        $response = $router->dispatch(Cli::fromArgv($_SERVER['argv'] ?? []));
        $response->send();
    }

    /* ------------------------------------------------------------------ --/
     /  Static Access                                                         */
    /* ------------------------------------------------------------------ */

    /** Return the active container. Throws if bootstrap has not run yet. */
    public static function container(): Container
    {
        if (static::$instance === null) {
            throw new \RuntimeException(
                'Bootstrap not initialized: call "new Bootstrap("MODE") before accessing the container'
            );
        }

        return static::$instance;
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

/**
 * Mode-driven single-entry bootstrap.
 * Documentation: docs/development/architecture/bootstrap.md
 *
 * Orchestrates the full initialization chain:
 *   Config -> Container -> CoreServices -> Extensions -> Subsystem
 *
 * Two modes are supported:
 *   "WEB"    -- HTTP request lifecycle (Router, middleware, dispatch, output)
 *   "CLI"    -- CLI command lifecycle (CLIRouter, arguments, execute, exit)
 */
class Bootstrap
{
    /** Container reference -- shared static store so subsystems can call
     *  `Bootstrap::container()` after bootstrap completes.               */
    private static ?Container $instance = null;

    const string MODE_WEB  = 'WEB';
    const string MODE_CLI  = 'CLI';

    private readonly string        $mode;

    /** Resolved config file paths: core.cfg (+ optional local.cfg on top). */
    private readonly array         $configPaths;

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
     * Search order (same for both):
     *   1. CWD-relative       -> ./config/core.cfg
     *   2. Framework vendor   -> __DIR__/../../config/core.cfg
     */
    private function resolveConfigPaths(): array
    {
        $paths = [];
        $cwd   = @getcwd();

        // Find core.cfg.
        foreach ([
            $cwd !== false ? "{$cwd}/config/core.cfg" : null,
            __DIR__ . '/../../config/core.cfg',
        ] as $candidate) {
            if ($candidate === null || !is_file($candidate)) {
                continue;
            }
            $real = realpath($candidate);
            if ($real === false) {
                continue;
            }
            if (!in_array($real, $paths, true)) {
                $paths[] = $real;
                break;  // core.cfg found -- stop searching.
            }
        }

        // Append local.cfg (optional override).
        foreach ([
            $cwd !== false ? "{$cwd}/config/local.cfg" : null,
            __DIR__ . '/../../config/local.cfg',
        ] as $candidate) {
            if ($candidate === null || !is_file($candidate)) {
                continue;
            }
            $real = realpath($candidate);
            if ($real !== false) {
                $paths[] = $real;  // local.cfg merges on top inside Config::load().
                break;
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
     * Runs at bootstrap time and throws on any invalid manifest or unresolved dependency —
     * failing fast before any subsystem starts.
     */
    private function registerExtensions(): void
    {
        $c   = static::$instance;
        if ($c === null) {
            throw new \RuntimeException('Container not yet initialised when initExtensions() runs.');
        }

        // ── 1. Resolve ext/ base directory (framework vendor path) ────────────
        $extBase = __DIR__ . '/../../ext';

        // ── 2. Discover & parse every manifest ────────────────────────────────
        $manifests = Manifest\Parser::discover($extBase);

        if ($manifests === []) {
            return; // Nothing to do -- no extensions found.
        }

        // ── 3. Quick dependency sanity check (fail fast) ──────────────────────
        $knownNames = array_column($manifests, 'name');
        foreach ($manifests as $manifest) {
            if ($manifest->depends === []) {
                continue;
            }
            foreach ($manifest->depends as $dep) {
                if (!in_array($dep, $knownNames, true)) {
                    throw new \RuntimeException(
                        "Extension '{$manifest->name}': unresolved dependency '{$dep}'. "
                        . 'Known: ' . implode(', ', array_unique($knownNames))
                    );
                }
            }
        }

        // ── 4. Register hooks, layouts, and index metadata into Container ───────
        $hookRegistry = new \Laswitchtech\CoreWeb\Hook\Registry();  // one instance per bootstrap run
        $extIndex    = [];                   // extension name -> array{type, version, directory}
        $srcDirs     = [];                   // collect src/ dirs for autoloader

        foreach ($manifests as $manifest) {
            // ── Extension src/ dir into namespace-aware autoloader ───────────────
            foreach ($manifest->hooks as $hookDef) {
                // Attempt class::method registration; if it fails, fall back to
                // treating the hook name itself as a callable hint.
                if (str_contains($hookDef, '::')) {
                    try {
                        $hookRegistry->addClassCall($hookDef, $hookDef);  // uses hook name as callback too
                        continue;
                    } catch (\Throwable $_) {
                        // Not an invokable class -- treat as a regular hook name below.
                    }
                }
                // Dotted namespace hook (e.g. "layout.header") — register with empty callback
                // placeholder so that subsystems can inspect the hook later.
                $hookRegistry->addCallback($hookDef, static fn () => [], 0);
            }

            // – Layouts (list of layout identifiers) ─────────────────────────
            if ($manifest->layouts !== []) {
                foreach ($manifest->layouts as $layoutDef) {
                    // Layout hooks follow the convention: "layout.<name>"
                    if (is_string($layoutDef)) {
                        $hookRegistry->addCallback("layout.{$layoutDef}", static fn () => [], 0);
                    }
                }
            }

            // – Index extension metadata into Container ──────────────────────
            $extIndex[$manifest->name] = [
                'type'      => $manifest->type,
                'version'   => $manifest->version,
                'directory' => $manifest->directory,
                'depends'   => $manifest->depends,
            ];
        }

        // – Bind resolved Hook\Registry into the container ────────────────────────
        $c->set('hook_registry', $hookRegistry);

        // – Store extension index keyed by name ──────────────────────────────────
        $c->set('extension_index', (object) $extIndex);
    }

    /* ------------------------------------------------------------------ --/
     /  Subsystems (mode-specific)                                          */
    /* ------------------------------------------------------------------ */

    /** BOOTSTRAP WEB CHAIN. Stubbed until Router & middleware exist. */
    private function bootWeb(): void
    {
        // TODO: $router = new Router(static::$instance);
        //       $router->detectServerType();     -> Apache / Nginx / IIS / built-in
        //       $router->loadCoreRoutes();       -> framework-level routes (/admin etc.)
        //       $response = $router->dispatch($_SERVER);
        //       echo (string)$response->getBody();

        // Graceful early return for now -- no subsystem to serve this request.
    }

    /** BOOTSTRAP CLI CHAIN. Stubbed until CLIRouter & commands exist. */
    private function bootCli(): void
    {
        // TODO: $cli = new CLIRouter(static::$instance);
        //       $cli->loadRegisteredCommands();  -> core + plugin commands
        //       $exitCode = $cli->dispatch($_SERVER['argv']);
        //       exit($exitCode);
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

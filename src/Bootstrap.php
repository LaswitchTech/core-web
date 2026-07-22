<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Renderer\Registry as RendererRegistry;
use Laswitchtech\CoreWeb\Renderer\Renderer;
use Laswitchtech\CoreWeb\Renderer\Engine\PhpEngine;
use Laswitchtech\CoreWeb\Renderer\Engine\LatteEngine;
use Laswitchtech\CoreWeb\Renderer\Engine\Registry as EngineRegistry;
use Laswitchtech\CoreWeb\Database\Driver\Mysql;
use Laswitchtech\CoreWeb\Database\Driver\Sqlite;
use Laswitchtech\CoreWeb\Database\Query\Compiler\MysqlCompiler;
use Laswitchtech\CoreWeb\Database\Query\Compiler\SqliteCompiler;
use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Database\Database;
use Laswitchtech\CoreWeb\Database\Error\DatabaseException;
use Laswitchtech\CoreWeb\Database\Seeding\SeedLoader;
use Laswitchtech\CoreWeb\Database\Seeding\Seeder;
use Laswitchtech\CoreWeb\Database\Seeding\RegistryTable as SeedRegistryTable;
use Laswitchtech\CoreWeb\Logger\Logger;
use Laswitchtech\CoreWeb\Logger\Level;
use Laswitchtech\CoreWeb\Helper\HelperInterface;
use Laswitchtech\CoreWeb\Helper\Url;
use Laswitchtech\CoreWeb\Helper\Html;
use Laswitchtech\CoreWeb\Helper\Str;
use Laswitchtech\CoreWeb\Helper\Date;
use Laswitchtech\CoreWeb\Helper\Asset;
use Laswitchtech\CoreWeb\Helper\Config as ConfigHelper;
use Laswitchtech\CoreWeb\Helper\Registry as HelperRegistry;
use Laswitchtech\CoreWeb\Helper\Bag;
use Laswitchtech\CoreWeb\Manifest\Parser as ManifestParser;
use Laswitchtech\CoreWeb\Asset\Entry as AssetEntry;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry as RendererResourceEntry;
use Laswitchtech\CoreWeb\Asset\Registry as AssetRegistry;
use Laswitchtech\CoreWeb\Asset\LessCompiler;
use Laswitchtech\CoreWeb\Message\Template\TemplateRegistry;
use Laswitchtech\CoreWeb\Message\Template\TemplateRegistryInterface;

/**


 * Mode-driven single-entry bootstrap.
 * Documentation: docs/development/architecture/Bootstrap.md
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
            $c = static::$instance;
            $this->registerCoreServices($c);
            $this->registerLoggerServices($c);
            $this->registerDbServices($c);
            $this->registerSeedingServices($c);
            $this->initExtensions();
            $this->initTemplateRegistry();
            $c = static::$instance;
            $this->registerMessagingServices($c);
            $this->registerHelperServices($c);
            $this->fireLifecycleHooks();
            $this->initAssets();

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

     /** Register core kernel services into the container. */
    private function registerCoreServices(Container $c): void
    {
        // Configuration class reference -- Config::load() is static, but storing
        // it here keeps the container as the single shared knowledge point.
        $c->set('config', Config::class);

        // Bootstrap mode for downstream subsystem selection (router vs cli).
        $c->set('mode', $this->mode);
    }

    /* ------------------------------------------------------------------ --/
      /  Logging Services                                                   */
    /* ------------------------------------------------------------------ */

    /** Register logging services into the container. */
    private function registerLoggerServices(Container $c): void
    {
        $appRoot    = $this->appRoot;
        $enabled    = (bool) Config::get('logging.enabled', true);
        $path       = Config::get('logging.path', 'log');
        $relativePath = is_string($path) && $path !== '' ? $path : 'log';
        $levelConfig = Config::get('logging.level', 'debug');
        if (!is_string($levelConfig) || $levelConfig === '') {
            $levelConfig = 'debug';
        }
        $levelKey   = match (strtolower($levelConfig)) {
            'debug'       => Level::DEBUG,
            'info'        => Level::INFO,
            'warning'     => Level::WARNING,
            'error'       => Level::ERROR,
            'critical'    => Level::CRITICAL,
            default       => Level::DEBUG,
        };

        $loggerFactory = function (string $channel) use ($appRoot, $enabled, $relativePath, $levelKey): Logger {
            return new Logger($channel, $appRoot, $relativePath, $enabled, $levelKey);
        };

        // Expose a factory callable so callers can create their own channels.
        $c->set('logger_factory', $loggerFactory);

        // Register the default app logger and commonly-used channel singletons.
        $c->registerSingleton('logger', function ($container) use ($loggerFactory): Logger {
            return $loggerFactory('app');
        });

        foreach (['app', 'error', 'database', 'auth', 'migration', 'debug'] as $channel) {
            $ch = $channel;
            $c->registerSingleton("logger.{$ch}", function ($container) use ($loggerFactory, $ch): Logger {
                return $loggerFactory($ch);
            });
        }
    }

    /* ------------------------------------------------------------------ --/
      /  Database Services                                                   */
    /* ------------------------------------------------------------------ */

    /** Register database services (driver + lazy singleton connection). */
    private function registerDbServices(Container $c): void
    {
        $appRoot   = $this->resolveAppRoot();

        $driverKey = Config::get('database.driver', 'sqlite');
        if (!is_string($driverKey) || $driverKey === '') {
            $driverKey = 'sqlite';
        } else {
            $driverKey = strtolower($driverKey);
        }

        // Resolve the correct driver singleton.
        $c->registerSingleton('db_driver', static fn ($container) => match ($driverKey) {
            'mysql', 'mariadb' => new Mysql(),
            'sqlite'           => new Sqlite(),
            default            => throw new DatabaseException(
                "Unsupported database driver: '{$driverKey}'. Supported: sqlite, mysql, mariadb."
            ),
        });

        // Lazy connection — directory creation and driver-specific validation happen on first resolution, not boot.
        $c->registerSingleton('db_connection', static fn ($container) =>
            match ($driverKey) {
                'mysql', 'mariadb' => $container->resolve('db_driver')
                    ->connect([
                        'host'     => Config::get('database.host', '127.0.0.1'),
                        'port'     => Config::get('database.port', 3306),
                        'database' => Config::get('database.database', ''),
                        'charset'  => Config::get('database.charset', 'utf8mb4'),
                        'username' => Config::get('database.username', ''),
                        'password' => Config::get('database.password', ''),
                        'dsn'      => Config::get('database.dsn', null),
                    ]),
                'sqlite' => $container->resolve('db_driver')
                    ->connect([
                        'path'     => (string) (Config::get('database.path') ?: 'data/app.db'),
                        'basePath' => $appRoot,
                    ]),
                default => throw new DatabaseException(
                    "Unsupported database driver: '{$driverKey}'. Supported: sqlite, mysql, mariadb."
                ),
            }
        );

        // Facade service — wraps db_connection + dialect compiler and exposes the public API.
        $c->registerSingleton('database', function ($container) use ($driverKey) {
            $compiler = match ($driverKey) {
                'mysql', 'mariadb' => new MysqlCompiler(),
                'sqlite'            => new SqliteCompiler(),
                default             => throw new DatabaseException(
                    "Unsupported database driver: '{$driverKey}'. Supported: sqlite, mysql, mariadb."
                ),
            };
            return new Database($container->resolve('db_connection'), $compiler);
        });

        // ——— Migration subsystem services (after database is ready) ———
        $coreMigrationsPath  = self::resolveCoreMigrationsPath();
        $appMigrationsPath   = "{$appRoot}/migrations";

        $promoters = [
            new Migration\Promoter\CorePromoter($coreMigrationsPath),
            new Migration\Promoter\AppPromoter($appMigrationsPath),
        ];

        // Registry — lazy singleton shared by all migration services.
        $c->registerSingleton('migration_registry', static fn ($container) => new Migration\RegistryTable($container->resolve('db_connection')));

        // Runner — the public entry point, wires in promoters and registry.
        $c->registerSingleton('migration_runner', static function ($container) use ($promoters, $driverKey) {
            return new Migration\Runner(
                $promoters,
                $container->resolve('db_connection'),
                $driverKey,
                $container->resolve('migration_registry'),
            );
        });
    }

    /* ------------------------------------------------------------------ --/
      /  Seeding Services                                         */
    /* ------------------------------------------------------------------ */

    /** Register seeding services (lazy singleton SeedLoader). */
    private function registerSeedingServices(Container $c): void
    {
        $appRoot  = $this->resolveAppRoot();
        $coreRoot = dirname(__DIR__);

        // Lazy singleton — directory scanning happens on first resolution, not boot.
        $c->registerSingleton('seed_loader', static function ($container) use ($coreRoot, $appRoot): SeedLoader {
            return new SeedLoader($coreRoot, $appRoot);
        });

        // Seeder — lazy singleton; wiring is deferred to first resolution (connection must exist).
        $c->registerSingleton('seeder', static function ($container): Seeder {
            return new Seeder(
                $container->resolve('db_connection'),
                $container->resolve('seed_loader'),
                new SeedRegistryTable($container->resolve('db_connection')),
            );
        });
    }

    /* ------------------------------------------------------------------ --/
      /  Messaging Services                                                   */

    /** Register messaging services into the container.
      *
      *  Provides a scaffold for mail (SMTP) and SMS subsystem wiring.
     */
    private function registerMessagingServices(Container $c): void
    {
        // registry-based template loader — delegates to TemplateRegistry

        $c->registerSingleton('message_template_loader', static fn ($container) => new \Laswitchtech\CoreWeb\Message\Template\RegistryTemplateLoader(
            $container->resolve('template_registry'),
        ));

        // ── smtp/sms defaults ────────────────────────────────────────
        // Read after template loader so the bootstrap chain (config → container → extensions → registry → messaging) stays intact.

        $appRoot = $this->resolveAppRoot();

        $smtpDefaults = [];
        if (file_exists("{$appRoot}/config/smtp.cfg")) {
            $decoded = json_decode(file_get_contents("{$appRoot}/config/smtp.cfg"), true);
            if (is_array($decoded)) {
                $smtpDefaults = $decoded;
            }
        }

        $smsDefaults = [];
        if (file_exists("{$appRoot}/config/sms.cfg")) {
            $decoded = json_decode(file_get_contents("{$appRoot}/config/sms.cfg"), true);
            if (is_array($decoded)) {
                $smsDefaults = $decoded;
            }
        }

        // ── load local.cfg override for sms configuration
        if (file_exists("./config/local.cfg")) {
            $localCfg = json_decode(file_get_contents("./config/local.cfg"), true);
            if ($localCfg !== null && is_array($localCfg) && isset($localCfg['sms'])) {
                // Merge local config with existing defaults - not overwrite!
                $smsDefaults = array_merge($smsDefaults, $localCfg['sms']);
            }
        }

        // ── smtp_config ───────────────────────────────────────────────
        // Reads from Config::get('smtp.*'). Returns a disabled config when enabled is falsy.

        /** dot-notation resolver for flat smtp.cfg defaults.
         *
         * Tier 1 — Config::all() nested path (core.cfg + local.cfg).
         * Tier 2 — $smtpDefaults[basename] (flat file key).
         * Tier 3 — literal fallback. */
        $res = static function ($key, $fallback = null) use ($smtpDefaults): mixed {
            $keyPath = explode('.', $key);

            // tier 1 — nested Config path (core.cfg / local.cfg)
            if (($cfgRaw = \Laswitchtech\CoreWeb\Config::all()) !== null) {
                $cur = $cfgRaw;
                foreach ($keyPath as $tk) {
                    if (is_array($cur) && array_key_exists($tk, $cur)) {
                        $cur = $cur[$tk];
                    } else {
                        $cur = null;
                        break;
                    }
                }
                if ($cur !== null) {
                    return $cur;   // user override wins
                }
            }

            // tier 2 — smtp.cfg flat file (last path segment is the key)
            $flatKey    = array_pop($keyPath);
            if (isset($smtpDefaults[$flatKey])) {
                return $smtpDefaults[$flatKey];
            }

            // tier 3 — Bootstrap literal fallback
            return $fallback;
        };

        $c->registerSingleton('smtp_config', static function () use ($res): \Laswitchtech\CoreWeb\Mail\SmtpConfig {
            $enabled = (bool) $res('smtp.enabled', false);
            if (!$enabled) {
                return \Laswitchtech\CoreWeb\Mail\SmtpConfig::disabled();
            }

            return new \Laswitchtech\CoreWeb\Mail\SmtpConfig(
                enabled:             true,
                host:                (string)        $res('smtp.host', 'localhost'),
                port:                (int)           max(1, (int)    $res('smtp.port', 587)),
                encryption:          (string)        $res('smtp.encryption', 'tls'),
                username:            (string)        $res('smtp.username', ''),
                password:            (string)        $res('smtp.password', ''),
                fromAddress:         (string)        $res('smtp.from_address', ''),
                fromName:            (string)        $res('smtp.from_name', 'Core-Web'),
                debug:               (bool)        $res('smtp.debug', false),
                timeout:             (int)           max(1, (int)    $res('smtp.timeout', 30)),
                connectionAttempts:  (int)           max(1, (int)    $res('smtp.connection_attempts', 1)),
                templateNamespace:   (string)        $res('smtp.template_namespace', 'mail'),
            );
        });
        // ── smtp_provider ─────────────────────────────────────────────
        // Conditional singleton: only when enabled by config.

        $c->registerSingleton('smtp_provider', static function ($container): ?\Laswitchtech\CoreWeb\Mail\Provider\SmtpProvider {
            /** @var \Laswitchtech\CoreWeb\Mail\SmtpConfig $cfg */
            $cfg = $container->resolve('smtp_config');
            return $cfg->enabled
                ? new \Laswitchtech\CoreWeb\Mail\Provider\SmtpProvider($cfg)
                : null;
        });

        // ── mailer ────────────────────────────────────────────────────
        // Conditional singleton: only when smtp is enabled.

        $c->registerSingleton('mailer', static function ($container): ?\Laswitchtech\CoreWeb\Mail\Mailer {
            /** @var \Laswitchtech\CoreWeb\Mail\SmtpConfig $cfg */
            $cfg = $container->resolve('smtp_config');
            if (!$cfg->enabled) {
                return null;
            }

            /** @var \Laswitchtech\CoreWeb\Message\Template\TemplateLoaderInterface $templateLoader */
            $templateLoader = $container->resolve('message_template_loader');

            /** @var \Laswitchtech\CoreWeb\Mail\Provider\SmtpProvider|null $provider */
            $provider = $container->resolve('smtp_provider');
            if ($provider === null) {
                return null;
            }

            return new \Laswitchtech\CoreWeb\Mail\Mailer($provider, $templateLoader, $cfg);
        });

        // ── sms_registry ──────────────────────────────────────────────
        // Registry for SMS providers; always available but gated consumers check `sms.enabled`.

        $c->registerSingleton('sms_registry', static fn ($container) => new \Laswitchtech\CoreWeb\Sms\Registry());

        // ── sms_resolver ──────────────────────────────────────────────

        /** dot-notation resolver for flat sms.cfg defaults.
         *
         * Tier 1 — Config::all() nested path (core.cfg / local.cfg).
         * Tier 2 — $smsDefaults[basename] (flat file key).
         * Tier 3 — literal fallback. */
        $smsRes = static function ($key, $fallback = null) use ($smsDefaults): mixed {
            $keyPath = explode('.', $key);

            // tier 1 — nested Config path (core.cfg / local.cfg)
            if (($cfgRaw = \Laswitchtech\CoreWeb\Config::all()) !== null) {
                $cur = $cfgRaw;
                foreach ($keyPath as $tk) {
                    if (is_array($cur) && array_key_exists($tk, $cur)) {
                        $cur = $cur[$tk];
                    } else {
                        $cur = null;
                        break;
                    }
                }
                if ($cur !== null) {
                    return $cur;   // user override wins
                }
            }

            // tier 2 — sms.cfg flat file (last path segment is the key)
            $flatKey    = array_pop($keyPath);
            if (isset($smsDefaults[$flatKey])) {
                return $smsDefaults[$flatKey];
            }

            // tier 3 — Bootstrap literal fallback
            return $fallback;
        };

        $c->registerSingleton('sms_resolver', static function ($container) use ($smsRes): \Laswitchtech\CoreWeb\Sms\Resolver {
            /** @var \Laswitchtech\CoreWeb\Sms\Registry $registry */
            $registry  = $container->resolve('sms_registry');
            $default   = $smsRes('sms.default', '');
            return new \Laswitchtech\CoreWeb\Sms\Resolver($registry, (string) $default);
        });

        // ── sms.provider.register hook ────────────────────────────────
        // Fire so extensions can register their SMS providers.

        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $hookRegistry->trigger('sms.provider.register', [
                'registry'  => static::$instance->resolve('sms_registry'),
                'container' => static::$instance,
                'mode'      => strtolower($this->mode),
            ]);
        }

        // ── sms_service ───────────────────────────────────────────────
        // Convenience SMS service; always wired but callers should gate on `sms.enabled`.

        $c->registerSingleton('sms_service', static function ($container) use ($smsRes): \Laswitchtech\CoreWeb\Sms\SmsService {
            /** @var \Laswitchtech\CoreWeb\Sms\Resolver $resolver */
            $resolver  = $container->resolve('sms_resolver');
            /** @var \Laswitchtech\CoreWeb\Message\Template\TemplateLoaderInterface $templates */
            $templates = $container->resolve('message_template_loader');
            $namespace  = $smsRes('sms.template_namespace', 'sms');
            return new \Laswitchtech\CoreWeb\Sms\SmsService($resolver, $templates, (string) $namespace);
        });
    }

    /* ------------------------------------------------------------------ --/
      /  Helper Services                                                    */
    /* ------------------------------------------------------------------ */

    /** Register helper services into the container.
     *
     * Creates a Helper\\Registry, registers the six core helpers (Url, Html, Str, Date, Asset, Config),
     * fires ``helper.register`` so extensions can add their own, then binds the registry (wrapped
     * in Bag) to the ``helpers`` container key. */
    private function registerHelperServices(Container $c): void
    {
        // 1. Create registry and register core helpers.
        $registry = new HelperRegistry();

        $coreHelpers = [
            new Url(),
            new Html(),
            new Str(),
            new Date(),
            new Asset(),
            new ConfigHelper(),
        ];

        foreach ($coreHelpers as $helper) {
            if ($helper instanceof HelperInterface) {
                $registry->register($helper);
            }
        }

        // 2. Trigger helper.register so extensions can add helpers.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $hookRegistry->trigger('helper.register', [
                'registry'  => $registry,
                'container' => static::$instance,
                'mode'      => strtolower($this->mode),
            ]);
        }

        // 3. Bind registry (Bag wraps it as a singleton below).
        $c->set('helper_registry', $registry);
        $c->registerSingleton('helpers', static fn ($container) => new Bag($container->resolve('helper_registry')));
    }

    /* ------------------------------------------------------------------ --/
      /  Asset Registry                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Initialise the `Asset\Registry`, store it in the container, and fire
     * ``asset.register`` so extensions can push CSS / JS entries.
     *
     * Placed after helper-registration so plugins that need helpers during
     * registration (e.g. asset helpers) have them available.
     */
    private function initAssets(): void
    {
        $registry = new AssetRegistry();

        // ── 1. Kernel asset (first compilation tier) -----------------------------
        // Lookup order: {kernelRoot}/Assets/less/styles.less → {kernelRoot}/Assets/css/styles.css
        $kernelRoot       = defined('CORE_WEB_ROOT') ? (string) CORE_WEB_ROOT : dirname(__DIR__);
        // Always initialise before use — kernel CSS guard does not set it.
        $kernelJsReal     = false;

        $resolvedAbsolutePath   = false;
        foreach (['less', 'css'] as $ext) {
            $candidate = "{$kernelRoot}/Assets/{$ext}/styles.{$ext}";
            if (is_file($candidate) && is_readable($candidate)) {
                $real = realpath($candidate);
                if ($real !== false) {
                    $resolvedAbsolutePath = $real;
                    break;       // first readable match wins
                }
            }
        }

        if ($resolvedAbsolutePath !== false) {
            $registry->css(
                'kernel',
                basename($resolvedAbsolutePath),
                $resolvedAbsolutePath,
                AssetEntry::PROVIDER_CORE,
                100,
            );
        } // end if resolvedAbsolutePath !== false (kernel CSS guard)

        // Kernel JavaScript registration — independent of kernel CSS availability
        $kernelJsCandidate = "{$kernelRoot}/Assets/js/kernel.js";
        if (is_file($kernelJsCandidate) && is_readable($kernelJsCandidate)) {
            $realJs = realpath($kernelJsCandidate);
            if ($realJs !== false) {
                $kernelJsReal = $realJs;
                $registry->js(
                    'kernel',
                    'kernel.js',
                    $realJs,
                    AssetEntry::PROVIDER_CORE,
                    100,
                );
            }
        }

        // Panel kernel JavaScript registration — independent of kernel JS availability
        $panelJsCandidate = "{$kernelRoot}/Assets/js/panel.js";
        if (is_file($panelJsCandidate) && is_readable($panelJsCandidate)) {
            $realPanelJs = realpath($panelJsCandidate);
            if ($realPanelJs !== false) {
                $registry->js(
                    'kernel',
                    'panel.js',
                    $realPanelJs,
                    AssetEntry::PROVIDER_CORE,
                    100,
                );
            }
        }

        // Kernel component JavaScript registration — deterministic discovery of
        // readable JavaScript files beneath Assets/js/components/.
        //
        // Components are registered only when kernel.js was registered because
        // every built-in component depends on the Builder runtime.
        if ($kernelJsReal !== false) {
            $componentsDirectory =
                "{$kernelRoot}/Assets/js/components";

            $assetsJsDirectory =
                "{$kernelRoot}/Assets/js";

            $realComponentsDirectory =
                realpath($componentsDirectory);

            $realAssetsJsDirectory =
                realpath($assetsJsDirectory);

            if (
                $realComponentsDirectory !== false
                && $realAssetsJsDirectory !== false
                && is_dir($realComponentsDirectory)
            ) {
                $componentAssets = [];

                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator(
                        $realComponentsDirectory,
                        \FilesystemIterator::SKIP_DOTS
                    ),
                    \RecursiveIteratorIterator::LEAVES_ONLY
                );

                foreach ($iterator as $fileInfo) {
                    if (
                        !$fileInfo instanceof \SplFileInfo
                        || !$fileInfo->isFile()
                        || !$fileInfo->isReadable()
                        || strtolower(
                            $fileInfo->getExtension()
                        ) !== 'js'
                    ) {
                        continue;
                    }

                    $realFile =
                        $fileInfo->getRealPath();

                    if ($realFile === false) {
                        continue;
                    }

                    $normalizedFile =
                        str_replace('\\', '/', $realFile);

                    $normalizedComponentsDirectory =
                        rtrim(
                            str_replace(
                                '\\',
                                '/',
                                $realComponentsDirectory
                            ),
                            '/'
                        );

                    $normalizedAssetsJsDirectory =
                        rtrim(
                            str_replace(
                                '\\',
                                '/',
                                $realAssetsJsDirectory
                            ),
                            '/'
                        );

                    if (
                        !str_starts_with(
                            $normalizedFile,
                            $normalizedComponentsDirectory . '/'
                        )
                        || !str_starts_with(
                            $normalizedFile,
                            $normalizedAssetsJsDirectory . '/'
                        )
                    ) {
                        continue;
                    }

                    $relativeFilename =
                        substr(
                            $normalizedFile,
                            strlen(
                                $normalizedAssetsJsDirectory
                            ) + 1
                        );

                    if (
                        $relativeFilename === ''
                        || !str_starts_with(
                            $relativeFilename,
                            'components/'
                        )
                        || str_contains(
                            $relativeFilename,
                            '..'
                        )
                    ) {
                        continue;
                    }

                    if (
                        isset(
                            $componentAssets[
                                $relativeFilename
                            ]
                        )
                    ) {
                        continue;
                    }

                    $componentAssets[
                        $relativeFilename
                    ] = $realFile;
                }

                ksort(
                    $componentAssets,
                    SORT_STRING
                );

                foreach (
                    $componentAssets
                    as $relativeFilename => $realFile
                ) {
                    $registry->js(
                        'kernel',
                        $relativeFilename,
                        $realFile,
                        AssetEntry::PROVIDER_CORE,
                        100,
                    );
                }
            }
        }

        // Application JavaScript registration
        $appJsCandidate = "{$this->appRoot}/Assets/js/app.js";
        if (is_file($appJsCandidate) && is_readable($appJsCandidate)) {
            $realAppJs = realpath($appJsCandidate);
            if ($realAppJs !== false) {
                // Prevent duplicate physical registration: skip when app
                // javascript resolves to the same physical file as kernel.
                $noDuplicate = $kernelJsReal === false || $realAppJs !== $kernelJsReal;
                if ($noDuplicate) {
                    $registry->js(
                        'app',
                        'app.js',
                        $realAppJs,
                        AssetEntry::PROVIDER_APP,
                        200,
                    );
                }
            }
        }

        // ── 2. Application asset (second tier) -----------------------------------
        // Lookup order: {appRoot}/Assets/less/styles.less → {appRoot}/Assets/css/styles.css
        $resolvedAppPath    = false;
        foreach (['less', 'css'] as $ext) {
            $candidate = "{$this->appRoot}/Assets/{$ext}/styles.{$ext}";
            if (is_file($candidate) && is_readable($candidate)) {
                $real = realpath($candidate);
                if ($real !== false) {
                    $resolvedAppPath = $real;
                    break;       // first readable match wins
                }
            }
        }

        // Prevent duplicate compilation: skip when app stylesheet resolves to
        // the same physical file as the kernel stylesheet.
        $hasDuplicate = $resolvedAbsolutePath !== false && $resolvedAppPath !== false && $resolvedAppPath === $resolvedAbsolutePath;

        if ($resolvedAppPath !== false && ! $hasDuplicate) {
            $registry->css(
                'app',
                basename($resolvedAppPath),
                $resolvedAppPath,
                AssetEntry::PROVIDER_APP,
                200,
            );
        }

        static::$instance->set('asset_registry', $registry);

        // Fire extension hook so plugins / themes can register CSS & JS assets.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $hookRegistry->trigger('asset.register', [
                'registry'  => $registry,
                'container' => static::$instance,
                'mode'      => strtolower($this->mode),
            ]);
        }
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
     * Initialize the template registry with core (vendor) templates AND any
     * enabled extension templates.
     *
     * Priority order (higher = wins):
     *   400 — app theme        (app > kernel, theme > plugin)
     *   300 — app plugin
     *   200 — kernel theme
     *   100 — kernel plugin
     *     0 — core (vendor)
     *
     * Registration uses the ``extension_index`` binding produced by
     * ``registerExtensions()``; only enabled extensions are visited.
     */
    private function initTemplateRegistry(): void
    {
        $c = static::$instance;
        if ($c === null) {
            throw new \RuntimeException('Container not yet initialized when initTemplateRegistry() runs.');
        }

        // Create registry and store in container.
        $registry = new TemplateRegistry();
        $c->set('template_registry', $registry);

        // ── 1. Register core (vendor) templates -----------------------------
        $coreRoot = defined('CORE_WEB_ROOT') ? (string) CORE_WEB_ROOT : dirname(__DIR__);

        foreach (['mail', 'sms'] as $namespace) {
            $templateDir = "{$coreRoot}/Templates/{$namespace}";

            if (!is_dir($templateDir)) {
                continue;
            }

            foreach (scandir($templateDir) as $file) {
                if (!str_ends_with($file, '.json')) {
                    continue;
                }

                $templateName = basename($file, '.json');

                $registry->register(
                    namespace:  $namespace,
                    template:   $templateName,
                    path:       realpath("{$templateDir}/{$file}"),
                    priority:   0,
                    origin:     'core',
                    extension:  null,
                );
            }
        }

        // ── 2. Register app templates ---------------------------------------
        foreach (['mail', 'sms'] as $namespace) {
            $templateDir = "{$this->appRoot}/Templates/{$namespace}";

            if (!is_dir($templateDir)) {
                continue;
            }

            foreach (scandir($templateDir) as $file) {
                if (!str_ends_with($file, '.json')) {
                    continue;
                }

                $templateName = basename($file, '.json');

                $registry->register(
                    namespace:  $namespace,
                    template:   $templateName,
                    path:       realpath("{$templateDir}/{$file}"),
                    priority:   250,
                    origin:     'app',
                    extension:  null,
                );
            }
        }

        // ── 3. Register enabled extension templates -------------------------
        $extIndex = static::$instance->resolve('extension_index');
        if ($extIndex !== null && isset($extIndex) && is_object($extIndex)) {
            foreach ($extIndex as $name => $meta) {
                // Extract fields from the associative-array storage.
                $type      = $meta['type'];
                $origin    = $meta['origin'];
                $directory = $meta['directory'];

                // Build origin string and priority based on type → origin × type cross-product.
                if ($type === 'plugin') {
                    $originStr = "{$origin}-plugin";
                    $priority  = $origin === 'kernel' ? 100 : 300;
                } else {
                    // theme
                    $originStr = "{$origin}-theme";
                    $priority  = $origin === 'kernel' ? 200 : 400;
                }

                foreach (['mail', 'sms'] as $namespace) {
                    $templateDir = "{$directory}/templates/{$namespace}";

                    if (!is_dir($templateDir)) {
                        continue;
                    }

                    foreach (scandir($templateDir) as $file) {
                        if (!str_ends_with($file, '.json')) {
                            continue;
                        }

                        $templateName = basename($file, '.json');

                        $registry->register(
                            namespace:  $namespace,
                            template:   $templateName,
                            path:       realpath("{$templateDir}/{$file}"),
                            priority:   $priority,
                            origin:     $originStr,
                            extension:  $name === '' ? null : $name,
                        );
                    }
                }
            }
        }

        // ── 3. Bind the registry for later consumption ----------------------
        // (already bound at line 670 above; here we keep it idempotent-safe by
        // simply leaving the instance in place.)
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

    /**
     * Sort extension manifests by their declared dependencies so that every dependency
     * appears before any extension that requires it (topological order).
     *
     * The algorithm currently serves as a stable insertion point; it returns the input
     * array unmodified and MUST NOT alter extension discoverability or priority.
     */
    private function sortExtensionsByDependencies(array $manifests): array
    {
        // Build a local associative index keyed by each manifest's name.
        $named = [];

        // Track each manifest's original numeric position.
        $position = [];

        // Build dependency indegree / reverse-index (dependents) for topological sort.
        $indegree  = [];
        $dependents = [];

        foreach ($manifests as $idx => $ext) {
            $named[$ext->name]       = $ext;
            $position[$ext->name]    = $idx;

            // Initialise indegree to zero for every known extension.
            if (!isset($indegree[$ext->name])) {
                $indegree[$ext->name] = 0;
            }

            // Count outgoing dependencies (each dep removes one in-degree from the dependent).
            foreach ($ext->depends as $dep) {
                $indegree[$ext->name]++;
                $dependents[$dep][]   = $ext->name;
            }
        }

        // Seed the initial queue with manifests whose indegree is zero, sorted by original position asc.
        $queue = [];
        foreach ($named as $name => $ext) {
            if ($indegree[$name] === 0) {
                $queue[] = $ext;
            }
        }

        // Sort queue entries by their original array index (stable order preservation).
        usort($queue, function ($a, $b) use ($position): int {
            return ($position[$a->name] ?? 0) <=> ($position[$b->name] ?? 0);
        });

        // ── Kahn's algorithm — stable topological sort ────────────────────────────────
        $result = [];   // final ordered list of \Laswitchtech\CoreWeb\Manifest\Extension

        while ($queue !== []) {
            // Pop the first element (lowest original position in current queue).
            $current = array_shift($queue);

            // Emit this manifest.
            $result[] = $current;

            // Feed its dependents: decrement their indegree and enqueue when zero.
            $newlyZero = [];
            foreach ($dependents[$current->name] ?? [] as $dependentName) {
                $indegree[$dependentName]--;
                if ($indegree[$dependentName] === 0) {
                    $newlyZero[] = $named[$dependentName];
                }
            }

            // Insert newly ready dependents into the queue at their correct sorted position.
            if ($newlyZero !== []) {
                usort($newlyZero, function ($a, $b) use ($position): int {
                    return ($position[$a->name] ?? 0) <=> ($position[$b->name] ?? 0);
                });

                // Append newly-ready dependents then re-sort by original position.
                $queue = array_merge($queue, $newlyZero);
                usort($queue, function ($a, $b) use ($position): int {
                    return ($position[$a->name] ?? 0) <=> ($position[$b->name] ?? 0);
                });
            }
        }

        // Cycle detection — compare sorted count to the original manifest array length.
        if (count($result) !== count($manifests)) {
            $sortedNames = [];
            foreach ($result as $r) {
                $sortedNames[$r->name] = true;
            }

            $unsorted = [];
            foreach ($named as $name => $ext) {
                if (!isset($sortedNames[$name])) {
                    $unsorted[] = $name;
                }
            }

            throw new \RuntimeException(
                sprintf('Extension dependency cycle detected among: %s', implode(', ', $unsorted))
            );
        }

        return array_values($result);
    }

    private function registerExtensions(): void
    {
        $c     = static::$instance;
        if ($c === null) {
            throw new \RuntimeException('Container not yet initialised when initExtensions() runs.');
        }

        // Resolve existing extension roots (order matters: kernel first, then app).
        $roots = [];

        // 1. Kernel root — package/vendor install with shipped extensions.
        $kernelExt = dirname(__DIR__) . '/ext';
        if (is_dir($kernelExt)) {
            $roots[] = [$kernelExt, 'kernel'];
        }

        // 2. Application root — user's application directory.
        $appExt = "{$this->appRoot}/ext";
        if (is_dir($appExt)) {
            $roots[] = [$appExt, 'app'];
        }

        // If no extension roots exist, register empty hooks and return early.
        // Composer installs may ship without extensions by default.
        if ($roots === []) {
            $c->set('extension_base', null);
            $c->set('hook_registry', new \Laswitchtech\CoreWeb\Hook\Registry());
            $c->set('extension_index', (object) []);

            return;
        }

        // Diagnostic bindings.
        $c->set('app_root',      $this->appRoot);
        $c->set('extension_base', $kernelExt ?? ($appExt));

        // ── Discover & parse every manifest across all existing roots (tolerant). -
        $manifests = [];
        foreach ($roots as [$root, $origin]) {
            $discovered = Manifest\Parser::discover($root, $origin);
            if ($discovered !== []) {
                $manifests[] = $discovered;
            }

            // Diagnostic binding: track where the last root was located.
            $c->set("extension_base.{$origin}", $root);
        }
        $manifests = $manifests === [] ? [] : \array_merge(...$manifests);

        // ── 2½. Deduplicate by extension name: last-write wins → app over kernel (app is processed second). -
        $deduplicated = [];
        foreach ($manifests as $ext) {
            // Associative-array key collision naturally replaces a kernel extension
            // with an identically named app extension without any origin comparison.
            $deduplicated[$ext->name] = $ext;
        }
        $manifests = array_values($deduplicated);   // re-index to [0..n-1].

        // ── 2½a. Build metadata index for ALL deduplicated extensions (before any filtering). -
        $lifecycle = $this->loadLifecycleState();

        $allIndex = [];
        foreach ($manifests as $m) {
            $rawCompat   = $m->kernelCompat ?? '';
            $isCompatible = ManifestParser::checkCompat($rawCompat, ManifestParser::KERNEL_VERSION);

            if ($rawCompat === '') {
                $compatStatus = 'unconstrained';
            } elseif ($isCompatible) {
                $compatStatus = 'compatible';
            } else {
                fwrite(STDERR, (string)"Extension '{$m->name}': kernel-compat '$rawCompat' incompatible with running kernel " . ManifestParser::KERNEL_VERSION . "\n");
                $compatStatus = 'incompatible';
            }

            // Determine lifecycle state.
            // When the config file is absent *and* no enabled lists exist → all are effectively "enabled".
            if ($lifecycle['exists']) {
                $typeKey = $m->type === 'theme' ? 'themes' : 'plugins';
                $inEnabledList = in_array($m->name, $lifecycle['enabled'][$typeKey], true);

                // Persisted but empty enabled list => all are still "enabled" (zero-state = unfiltered).
                if ($lifecycle['enabled'] === ['plugins' => [], 'themes' => []]) {
                    $lifecycleState = 'enabled';
                } elseif ($inEnabledList) {
                    $lifecycleState = 'enabled';
                } else {
                    $lifecycleState = 'disabled';
                }
            } else {
                $lifecycleState = 'enabled';
            }

            // Derive slug from directory basename: lowercased, spaces → -, underscores → -, remove invalid chars.
            $slug = (string) preg_replace('/[^a-z0-9\-]/', '', str_replace('_', '-', str_replace(' ', '-', strtolower(basename($m->directory)))));

            $allIndex[$m->name] = [
                'type'          => $m->type,
                'version'       => $m->version,
                'directory'     => $m->directory,
                'slug'          => $slug,
                'depends'       => $m->depends,
                'origin'        => $m->origin,
                'kernelCompat'  => $rawCompat,
                'compatStatus'  => $compatStatus,
                'lifecycleState'=> $lifecycleState,
                'locked'        => $m->isLocked(),
            ];
        }

        $c->set('extension_index_all', (object) $allIndex);

        // ── 2½b. Filter manifests by lifecycle state — only enabled entries proceed. -
        $enabledManifests = [];  // name ⇒ Extension, in insertion order
        $disabledIndex    = [];

        foreach ($manifests as $m) {
            $entry   = $allIndex[$m->name];
            $lState  = $entry['lifecycleState'];

            if ($lState === 'enabled') {
                $enabledManifests[$m->name] = $m;
            } else {
                $disabledIndex[$m->name] = $entry;
            }
        }

        // Persist disabled list.
        $c->set('extension_index_disabled', (object) $disabledIndex);

        // Replace `$manifests` with the filtered set so dependency check, autoloader,
        // hook registration, and index population only see enabled extensions.
        $manifests = array_values($enabledManifests);

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

        // ── Ordered by dependency (stable Kahn topological sort). -----------------
        $manifests = $this->sortExtensionsByDependencies($manifests);

        // ── 4. Collect manifests with PSR-4 autoload support + src/ fallback dirs --
        $psr4Manifests = [];   // prefix → [Manifest\Extension, Manifest\Extension, ...]
        $srcDirs       = [];  // legacy fallback directories

        foreach ($manifests as $manifest) {
            if (is_dir("{$manifest->directory}/src")) {
                $srcDirs[] = "{$manifest->directory}/src";
            }

            // Gather PSR-4 mappings from every manifest.
            if ($manifest->psr4Mappings === []) {
                continue;
            }

            foreach ($manifest->psr4Mappings as $mapping) {
                $prefix    = rtrim($mapping['prefix'], '\\') . '\\';  // normalise to single trailing \
                $extDir    = $mapping['directory'];                    // already slash-normalised in the parser
                $candidate = "{$manifest->directory}/{$extDir}";

                if (is_dir($candidate)) {
                    $psr4Manifests[$prefix][] = ['manifest' => $manifest, 'dir' => $candidate];
                }
            }
        }

        // Sort PSR-4 keys by longest prefix first so the most specific prefix wins.
        uksort($psr4Manifests, static fn ($a, $b) => strlen($b) <=> strlen($a));

        // ── 5. Register extension autoloader (PSR-4 first, legacy fallback after) --
        $uniqueSrcDirs = array_values(array_unique($srcDirs));

        spl_autoload_register(function (string $class) use ($psr4Manifests, $uniqueSrcDirs): void {
            // --- PSR-4 resolution (most specific prefix wins) ---
            foreach ($psr4Manifests as $prefix => $_entries) {
                if (!str_starts_with($class, $prefix)) {
                    continue;
                }

                $relPath  = substr($class, strlen($prefix));
                $relPathF = str_replace('\\', '/', $relPath);

                foreach ($_entries as ['manifest' => $m, 'dir' => $d]) {
                    $fpath = "{$d}/{$relPathF}.php";
                    if (is_file($fpath)) {
                        require_once $fpath;
                        return;
                    }
                }
            }

            // --- Legacy fallback: Laswitchtech\\CoreWeb\\Plugin\\ / \\Theme\\ ----------
            if (str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\') === false
                && str_starts_with($class, 'Laswitchtech\\CoreWeb\\Theme\\') === false) {
                return;
            }

            $prefixLen = str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\')
                ? strlen('Laswitchtech\\CoreWeb\\Plugin\\')
                : strlen('Laswitchtech\\CoreWeb\\Theme\\');
            $relPath   = str_replace('\\', '/', substr($class, $prefixLen));

            foreach ($uniqueSrcDirs as $dir) {
                $fpath = "{$dir}/{$relPath}.php";
                if (is_file($fpath)) {
                    require_once $fpath;
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

            // -- Compute compatibility --------------------------------------------------
            $rawCompat   = $manifest->kernelCompat ?? '';
            $isCompatible = ManifestParser::checkCompat($rawCompat, ManifestParser::KERNEL_VERSION);

            if ($rawCompat === '') {
                $compatStatus = 'unconstrained';
            } elseif ($isCompatible) {
                $compatStatus = 'compatible';
            } else {
                // Tolerant: warn but do not block.
                fwrite(STDERR, (string)"Extension '{$manifest->name}': kernel-compat '$rawCompat' incompatible with running kernel " . ManifestParser::KERNEL_VERSION . "\n");
                $compatStatus = 'incompatible';
            }

            // Derive slug from directory basename: lowercased, spaces → -, underscores → -, remove invalid chars.
            $slug = (string) preg_replace('/[^a-z0-9\-]/', '', str_replace('_', '-', str_replace(' ', '-', strtolower(basename($manifest->directory)))));

            // -- Index extension metadata into Container ---------------------------
            $extIndex[$manifest->name] = [
                'type'          => $manifest->type,
                'version'       => $manifest->version,
                'directory'     => $manifest->directory,
                'slug'          => $slug,
                'depends'       => $manifest->depends,
                'origin'        => $manifest->origin,
                'kernelCompat'  => $manifest->kernelCompat,
                'compatStatus'  => $compatStatus,
                'locked'        => $manifest->isLocked(),
            ];
        }

        // -- Bind resolved Hook\Registry and extension index into container -----
        $c->set('hook_registry', $hookRegistry);
        $c->set('extension_index', (object) $extIndex);
    }

    /* ------------------------------------------------------------------ --/
      /  Extension Lifecycle State Helpers                                   */
    /* ------------------------------------------------------------------ */

    /** Return the path where lifecycle state is persisted (``extensions.cfg``).

     *  On read, falls back to ``extensions.json`` if the ``.cfg`` file is absent;
     *  writes always target ``extensions.cfg``. */
    private function extensionStatePath(): string
    {
        return "{$this->appRoot}/config/extensions.cfg";
    }

    /** Check whether the lifecycle-state file exists for this application. */
    private function lifecycleStateExists(): bool
    {
        return is_file($this->extensionStatePath())
            || $this->legacyStateFileExists();
    }

    /** Return true when the legacy ``extensions.json`` state file is present. */
    private function legacyStateFileExists(): bool
    {
        return is_file("{$this->appRoot}/config/extensions.json");
    }

    /** Load and normalise the lifecycle-state file.

     *  @return array{exists:bool, enabled:array{plugins:list<string>, themes:list<string>}, pending:list<array{action:string,type:string,name:string,source:string}>}
     */
    private function loadLifecycleState(): array
    {
        $path = $this->extensionStatePath();

        // File absent — check legacy .json as read-only fallback.
        if (!is_file($path)) {
            $legacyPath = "{$this->appRoot}/config/extensions.json";
            if (is_file($legacyPath)) {
                /** @var array<string, mixed> */
                $legacyJson = json_decode(file_get_contents($legacyPath), true);
                if (!is_array($legacyJson) || !isset($legacyJson['enabled']) || !isset($legacyJson['pending'])) {
                    return [
                        'exists'  => false,
                        'enabled' => ['plugins' => [], 'themes' => []],
                        'pending' => [],
                    ];
                }
                $readPath = $legacyPath; // use legacy file above
            } else {
                return [
                    'exists'  => false,
                    'enabled' => ['plugins' => [], 'themes' => []],
                    'pending' => [],
                ];
            }
        } elseif (is_file($path)) {
            $readPath = $path; // use primary state file
        }

        if (!isset($readPath) || !is_file($readPath)) {
            return [
                'exists'  => false,
                'enabled' => ['plugins' => [], 'themes' => []],
                'pending' => [],
            ];
        }

        $jsonContent = file_get_contents($readPath);
        if ($jsonContent === false) {
            // Unreadable (permissions / race): degrade to default.
            return [
                'exists'  => false,
                'enabled' => ['plugins' => [], 'themes' => []],
                'pending' => [],
            ];
        }

        $json = json_decode($jsonContent, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Malformed JSON: degrade to default.
            return [
                'exists'  => false,
                'enabled' => ['plugins' => [], 'themes' => []],
                'pending' => [],
            ];
        }

        if (!is_array($json)) {
            // Top-level must be an object/array.
            return [
                'exists'  => false,
                'enabled' => ['plugins' => [], 'themes' => []],
                'pending' => [],
            ];
        }

        $enabledPlugins = [];
        $enabledThemes  = [];

        // Extract + normalise enabled plugins.
        if (isset($json['enabled']['plugins']) && is_array($json['enabled']['plugins'])) {
            foreach ($json['enabled']['plugins'] as $v) {
                if (is_string($v) && $v !== '') {
                    $enabledPlugins[] = $v;
                }
            }
        }

        // Extract + normalise enabled themes.
        if (isset($json['enabled']['themes']) && is_array($json['enabled']['themes'])) {
            foreach ($json['enabled']['themes'] as $v) {
                if (is_string($v) && $v !== '') {
                    $enabledThemes[] = $v;
                }
            }
        }

        // Extract + normalise pending entries.
        $pending = [];
        if (isset($json['pending']) && is_array($json['pending'])) {
            foreach ($json['pending'] as $item) {
                if (!is_array($item)) {
                    continue;
                }

                // Each entry must have every expected key and correct type.
                if (
                    !isset($item['action'], $item['type'], $item['name'], $item['source'])
                    || !is_string($item['action'])  || ($item['action'] !== 'enable' && $item['action'] !== 'disable')
                    || !is_string($item['type'])     || ($item['type'] !== 'plugins' && $item['type'] !== 'themes')
                    || !is_string($item['name'])     || $item['name'] === ''
                    || !is_string($item['source'])   || $item['source'] === ''
                ) {
                    continue; // tolerate malformed pending items silently.
                }

                $pending[] = [
                    'action' => $item['action'],
                    'type'   => $item['type'],
                    'name'   => $item['name'],
                    'source' => $item['source'],
                ];
            }
        }

        return [
            'exists'  => true,
            'enabled' => ['plugins' => array_values($enabledPlugins), 'themes' => array_values($enabledThemes)],
            'pending' => array_values($pending),
        ];
    }

    /** Fire pending lifecycle hooks for every unresolved pending entry.

     *  Reads the latest ``pending`` list via the Config loader from `config/extensions.cfg`, falling back to `config/extensions.json` for legacy state files.
     *  For each entry, fires a pre-hook → post-hook pair in order:
     *
     *    enable  → extension.pre_enable  then  extension.post_enable
     *    disable → extension.pre_disable then  extension.post_disable
     *
     *  On success the pending list is cleared and the state persisted.
     *  If there are no pending entries (or the registry is not a ``Hook\Registry``),
     *  this method returns without side-effects. */
    private function fireLifecycleHooks(): void
    {
        $lifecycle = $this->loadLifecycleState();

        // Nothing pending → no-op. Do NOT modify config when the list is empty.
        if ($lifecycle['pending'] === []) {
            return;
        }

        // Must have a hook registry to fire events.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if (!($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry)) {
            fwrite(STDERR, 'Bootstrap: hook_registry not a Hook\Registry — skipping pending lifecycle hooks' . PHP_EOL);

            return;
        }

        // Build context array for every pending entry.
        $contexts = [];
        foreach ($lifecycle['pending'] as $entry) {
            $action = (string)($entry['action'] ?? '');
            $name   = (string)($entry['name'] ?? '');
            if ($action === '' || $name === '') {
                continue; // tolerate malformed entries silently.
            }

            $contexts[] = [
                'action' => $action,
                'name'   => $name,
                'type'   => (string)($entry['type'] ?? ($action === 'enable' ? 'plugins' : 'plugins')),
                'source' => (string)($entry['source'] ?? 'CLI'),
            ];
        }

        if ($contexts === []) {
            // All entries malformed → save clears nothing.
            return;
        }

        foreach ($contexts as $ctx) {
            $action = $ctx['action'];

            if ($action === 'enable') {
                $hookRegistry->trigger('extension.pre_enable', $ctx);
                $hookRegistry->trigger('extension.post_enable', $ctx);
            } elseif ($action === 'disable') {
                $hookRegistry->trigger('extension.pre_disable', $ctx);
                $hookRegistry->trigger('extension.post_disable', $ctx);
            }
        }

        // Success — clear pending and persist (enabled list is preserved unchanged).
        $state = [
            'enabled' => $lifecycle['enabled'],
            'pending' => [],
        ];

        try {
            $this->saveLifecycleState($state);
        } catch (\Throwable $_) {
            fwrite(STDERR, 'Bootstrap: failed to clear pending lifecycle hooks — state file not updated' . PHP_EOL);
        }
    }

    /** Persist lifecycle state to the application's config directory.

     *  Validates enabled arrays and pending entries before writing;
     *  creates the parent directory if it does not exist; uses LOCK_EX.
     *
     *  @throws \RuntimeException on directory creation or write failure.
     */
    private function saveLifecycleState(array $state): void
    {
        $path = $this->extensionStatePath();
        $dir  = dirname($path);

        // Ensure the parent directory exists (idempotent mkdir).
        if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
            throw new \RuntimeException("Cannot create directory for lifecycle state: {$dir}");
        }

        // Validate the incoming shape before encoding.
        if (
            !isset($state['enabled']['plugins']) || !is_array($state['enabled']['plugins'])
            || !isset($state['enabled']['themes'])  || !is_array($state['enabled']['themes'])
        ) {
            throw new \InvalidArgumentException('saveLifecycleState: enabled.plugins / enabled.themes must both be arrays.');
        }

        if (isset($state['pending']) && is_array($state['pending'])) {
            foreach ($state['pending'] as $idx => $item) {
                if (!is_array($item)) {
                    throw new \InvalidArgumentException("saveLifecycleState: pending item at index {$idx} must be an array.");
                }
                // Quick structural check — full normalisation happens inside json_encode.
                if (!isset($item['action'], $item['type'], $item['name'], $item['source'])) {
                    throw new \InvalidArgumentException("saveLifecycleState: pending item at index {$idx} is missing required keys.");
                }
            }
        }

        // Build output preserving only the canonical shape.
        $output = [
            'enabled' => [
                'plugins' => array_values(array_unique($state['enabled']['plugins'])),
                'themes'  => array_values(array_unique($state['enabled']['themes'])),
            ],
            'pending' => array_values(array_map(
                fn (array $i): array => [
                    'action' => $i['action'],
                    'type'   => $i['type'],
                    'name'   => $i['name'],
                    'source' => $i['source'],
                ],
                is_array($state['pending']) ? $state['pending'] : [],
            )),
        ];

        $json = json_encode($output, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);

        if (file_put_contents($path, $json . "\n", LOCK_EX) === false) {
            throw new \RuntimeException("Cannot write lifecycle state to {$path}");
        }
    }

    /* ------------------------------------------------------------------ --/
     /  Subsystems (mode-specific)                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Initialise the renderer subsystem: create registries, register core engines,
     * trigger ``renderer.engine.register``, then fire ``renderer.register``.
     *
     * Bootstrap returns the Renderer instance; both registries remain in the container.
     */
    private function initRenderer(string $mode): Renderer
    {
        // 1. Create engine registry and register core engines -- appRoot provides the
        //    application layout so the Latte cache path can be built inside storage/.
        $engineRegistry = new EngineRegistry();
        $engineRegistry->register(new PhpEngine());
        $engineRegistry->register(new LatteEngine($this->appRoot));

        // 2. Trigger renderer.engine.register hook so extensions can add engines.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $hookRegistry->trigger('renderer.engine.register', [
                'engineRegistry' => $engineRegistry,
                'container'      => static::$instance,
                'mode'           => $mode,
            ]);
        }

        // 3. Create renderer registry and register kernel layout entries.
        $rendererRegistry = new RendererRegistry();
        $rendererRegistry->register(new RendererResourceEntry(
            'panel.layout',
            RendererResourceEntry::TYPE_LAYOUT,
            __DIR__ . '/../Assets/layouts/panel.latte',
            RendererResourceEntry::PROVIDER_CORE,
            0,
            ['engine' => 'latte'],
        ));

        // 4. Create renderer pipeline and return it.
        $renderer         = new Renderer($rendererRegistry, $engineRegistry);

        // Store both registries in container for extensions and downstream code.
        if (static::$instance !== null) {
            static::$instance->set('renderer_registry',       $rendererRegistry);
            static::$instance->set('renderer_engine_registry', $engineRegistry);
            static::$instance->set('renderer',                 $renderer);
        }

        return $renderer;
    }

    /** BOOTSTRAP WEB CHAIN. */
    private function bootWeb(): void
    {
        // Fire plugin-started hook so test plugins can run bootstrap-time.
        $registry = static::$instance->resolve('hook_registry');
        if ($registry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $registry->trigger('plugin.started', ['mode' => 'web']);
        }

        // Initialize renderer, engine registry and all bindings.
        $renderer = $this->initRenderer('web');

        // Wire helpers into renderer context so every render call gets $helpers available.
        if (static::$instance !== null) {
            $helperBag = static::$instance->resolve('helpers');
            if ($helperBag instanceof \Laswitchtech\CoreWeb\Helper\Bag) {
                $renderer->setHelpers($helperBag);
            }
        }

        // Fire renderer.register hook so plugins can register layouts, templates, views.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $rendererRegistry = static::$instance->resolve('renderer_registry');
            $hookRegistry->trigger('renderer.register', [
                'registry'  => $rendererRegistry,
                'renderer'  => $renderer,
                'container' => static::$instance,
                'mode'      => 'web',
            ]);
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

        // Register core /css route for compiled Less output (WEB only).
        $c = static::$instance;
        if ($c !== null) {
            $appRoot = $c->resolve('app_root');
            if (is_string($appRoot) && $appRoot !== '') {
                $router->get('/css', static function () use ($c, $appRoot): Response {
                    // Validate app_root at request time.
                    if (!is_string($appRoot) || $appRoot === '') {
                        return (new Response(400))
                            ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                            ->withBody('Invalid app root');
                    }

                    // Resolve cache_dir at request time.
                    $rawCacheDir = Config::get('renderer.less.cache_dir', 'storage/cache/renderer/less');
                    if (!is_string($rawCacheDir) || $rawCacheDir === '') {
                        $rawCacheDir = 'storage/cache/renderer/less';
                    }
                    $cacheDir = str_starts_with($rawCacheDir, '/') ? $rawCacheDir : "{$appRoot}/{$rawCacheDir}";

                    // Create cache directory at request time.
                    if (!is_dir($cacheDir)) {
                        @mkdir($cacheDir, 0755, true);
                    }

                    // Resolve debug mode and asset registry at request time.
                    $debug         = (bool) Config::get('app.debug', false);
                    /* @var \Laswitchtech\CoreWeb\Asset\Registry */
                    $assetRegistry = $c->resolve('asset_registry');

                    // Compile Less per-request (enables debug: recompile on every /css request).
                    $compiler      = new LessCompiler($appRoot, $cacheDir);
                    $css           = $compiler->compile($assetRegistry, $debug);

                    return (new Response(200))
                        ->setHeader('Content-Type', 'text/css; charset=UTF-8')
                        ->withBody($css);
                });
            }
        }

        // Register core asset delivery routes (WEB only).
        $c = static::$instance;
        if ($c !== null) {
            $appRoot = $c->resolve('app_root');
            if (is_string($appRoot) && $appRoot !== '') {

                // -- Root-scope routes: /{type}/kernel and /{type}/app ------------------

                foreach ([AssetEntry::TYPE_CSS, AssetEntry::TYPE_JS] as $scopeType) {
                    foreach (['kernel', 'app'] as $scopeName) {
                        $route = '/'. $scopeType .'/'. $scopeName;
                        $router->get($route, static function (Web $request) use ($c, $appRoot, $scopeType, $scopeName): Response {
                            if (!is_string($appRoot) || $appRoot === '') {
                                return (new Response(400))
                                    ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                    ->withBody('Invalid app root');
                            }

                            // Resolve asset registry at request time.
                            /* @var \Laswitchtech\CoreWeb\Asset\Registry */
                            $assetRegistry = $c->resolve('asset_registry');
                            if (!($assetRegistry instanceof \Laswitchtech\CoreWeb\Asset\Registry)) {
                                return (new Response(500))
                                    ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                    ->withBody('Internal error');
                            }

                            $aliasFile = match ([$scopeType, $scopeName]) {
                                [AssetEntry::TYPE_JS, 'kernel'] => 'kernel.js',
                                [AssetEntry::TYPE_JS, 'app'] => 'app.js',
                                default => null,
                            };

                            if ($aliasFile === null) {
                                return (new Response(404))
                                    ->setHeader(
                                        'Content-Type',
                                        'text/plain; charset=UTF-8'
                                    )
                                    ->withBody('Not found');
                            }

                            $entry = $assetRegistry->get(
                                $scopeType,
                                $scopeName,
                                $aliasFile
                            );

                            if (
                                !(
                                    $entry
                                    instanceof
                                    \Laswitchtech\CoreWeb\Asset\Entry
                                )
                            ) {
                                return (new Response(404))
                                    ->setHeader(
                                        'Content-Type',
                                        'text/plain; charset=UTF-8'
                                    )
                                    ->withBody('Not found');
                            }

                            // Reject http:// and https:// URLs.
                            if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                                return (new Response(403))
                                    ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                    ->withBody('Forbidden');
                            }

                            $fullPath = str_starts_with($entry->path, '/') ? $entry->path : "{$appRoot}/{$entry->path}";

                            if (!is_file($fullPath) || !is_readable($fullPath)) {
                                return (new Response(404))
                                    ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                    ->withBody('Not found');
                            }

                            $contentType = ($scopeType === AssetEntry::TYPE_CSS)
                                ? 'text/css; charset=UTF-8'
                                : 'application/javascript';

                            return (new Response(200))
                                ->setHeader('Content-Type', $contentType)
                                ->withBody(file_get_contents($fullPath));
                        });
                    }
                }

                // -- Filename-aware root-scope routes: /{type}/kernel/{file...} and /{type}/app/{file..} -----

                foreach ([AssetEntry::TYPE_CSS, AssetEntry::TYPE_JS] as $scopeType) {
                    foreach (['kernel', 'app'] as $scopeName) {
                        $route =
                            '/'
                            . $scopeType
                            . '/'
                            . $scopeName
                            . '/{file...}';

                        $router->get(
                            $route,
                            static function (Web $request) use (
                                $c,
                                $appRoot,
                                $scopeType,
                                $scopeName
                            ): Response {
                                if (!is_string($appRoot) || $appRoot === '') {
                                    return (new Response(400))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Invalid app root');
                                }

                                $file =
                                    trim(
                                        (string) $request->param(
                                            'file'
                                        )
                                    );

                                if (
                                    $file === ''
                                    || str_contains($file, '\\')
                                    || str_contains($file, '..')
                                ) {
                                    return (new Response(404))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Not found');
                                }

                                $assetRegistry =
                                    $c->resolve('asset_registry');

                                if (
                                    !(
                                        $assetRegistry
                                        instanceof
                                        \Laswitchtech\CoreWeb\Asset\Registry
                                    )
                                ) {
                                    return (new Response(500))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Internal error');
                                }

                                $entry =
                                    $assetRegistry->get(
                                        $scopeType,
                                        $scopeName,
                                        $file
                                    );

                                if (
                                    !(
                                        $entry
                                        instanceof
                                        \Laswitchtech\CoreWeb\Asset\Entry
                                    )
                                ) {
                                    return (new Response(404))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Not found');
                                }

                                if (
                                    str_starts_with(
                                        $entry->path,
                                        'http://'
                                    )
                                    || str_starts_with(
                                        $entry->path,
                                        'https://'
                                    )
                                ) {
                                    return (new Response(403))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Forbidden');
                                }

                                $fullPath =
                                    str_starts_with(
                                        $entry->path,
                                        '/'
                                    )
                                        ? $entry->path
                                        : "{$appRoot}/{$entry->path}";

                                if (
                                    !is_file($fullPath)
                                    || !is_readable($fullPath)
                                ) {
                                    return (new Response(404))
                                        ->setHeader(
                                            'Content-Type',
                                            'text/plain; charset=UTF-8'
                                        )
                                        ->withBody('Not found');
                                }

                                $contentType =
                                    $scopeType
                                    === AssetEntry::TYPE_CSS
                                        ? 'text/css; charset=UTF-8'
                                        : 'application/javascript';

                                return (new Response(200))
                                    ->setHeader(
                                        'Content-Type',
                                        $contentType
                                    )
                                    ->withBody(
                                        file_get_contents(
                                            $fullPath
                                        )
                                    );
                            }
                        );
                    }
                }

                // -- Extension default alias routes: /{type}/themes/{extension} -----------
                    //   and /{type}/plugins/{extension} (resolves via getDefault only) ----

                    foreach ([AssetEntry::TYPE_CSS, AssetEntry::TYPE_JS] as $scopeType) {
                        foreach (['themes', 'plugins'] as $extPrefix) {
                            $route = '/' . $scopeType . '/' . $extPrefix . '/{extension}';
                            $router->get($route, static function (Web $request) use ($c, $appRoot, $scopeType, $extPrefix): Response {
                                if (!is_string($appRoot) || $appRoot === '') {
                                    return (new Response(400))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Invalid app root');
                                }

                                // Resolve and validate the extension parameter.
                                $extension = trim((string) $request->param('extension'));
                                if ($extension === '' || str_contains($extension, '/') || str_contains($extension, '\\') || str_contains($extension, '..')) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                // Build the scope and resolve only through getDefault.
                                $scope = strtolower(trim($extPrefix . '/' . $extension));
                                if ($scope === '') {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                /* @var \Laswitchtech\CoreWeb\Asset\Registry */
                                $assetRegistry = $c->resolve('asset_registry');
                                if (!($assetRegistry instanceof \Laswitchtech\CoreWeb\Asset\Registry)) {
                                    return (new Response(500))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Internal error');
                                }

                                $entry = $assetRegistry->getDefault($scopeType, $scope);
                                if (!($entry instanceof \Laswitchtech\CoreWeb\Asset\Entry)) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                // Reject http:// and https:// URLs.
                                if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                                    return (new Response(403))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Forbidden');
                                }

                                $fullPath = str_starts_with($entry->path, '/') ? $entry->path : "{$appRoot}/{$entry->path}";

                                if (!is_file($fullPath) || !is_readable($fullPath)) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                $contentType = ($scopeType === AssetEntry::TYPE_CSS)
                                    ? 'text/css; charset=UTF-8'
                                    : 'application/javascript';

                                return (new Response(200))
                                    ->setHeader('Content-Type', $contentType)
                                    ->withBody(file_get_contents($fullPath));
                            });
                        }
                    }

                    // -- Extension routes: /{type}/themes/{extension}/{file} ---------------
                    //   and /{type}/plugins/{extension}/{file} -----------------------------

                    foreach ([AssetEntry::TYPE_CSS, AssetEntry::TYPE_JS] as $scopeType) {
                        foreach (['themes', 'plugins'] as $extPrefix) {
                            $route = '/'. $scopeType .'/'. $extPrefix .'/{extension}/{file}';
                            $router->get($route, static function (Web $request) use ($c, $appRoot, $scopeType, $extPrefix): Response {
                                if (!is_string($appRoot) || $appRoot === '') {
                                    return (new Response(400))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Invalid app root');
                                }

                                // Resolve request parameters.
                                $extension = trim((string) $request->param('extension'));
                                $file      = trim((string) $request->param('file'));

                                // Reject path traversal characters in route parameters.
                                if ($extension === '' || str_contains($extension, '/') || str_contains($extension, '\\') || str_contains($extension, '..')) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                if ($file === '' || str_contains($file, '/') || str_contains($file, '\\') || str_contains($file, '..')) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                // Build canonical scope.
                                $scope = $extPrefix .'/'. $extension;

                                // Resolve asset registry at request time.
                                /* @var \Laswitchtech\CoreWeb\Asset\Registry */
                                $assetRegistry = $c->resolve('asset_registry');
                                if (!($assetRegistry instanceof \Laswitchtech\CoreWeb\Asset\Registry)) {
                                    return (new Response(500))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Internal error');
                                }

                                // Look up the asset entry; reject unknown assets.
                                $entry = $assetRegistry->get($scopeType, $scope, $file);
                                if (!($entry instanceof \Laswitchtech\CoreWeb\Asset\Entry)) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                // Reject http:// and https:// URLs.
                                if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                                    return (new Response(403))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Forbidden');
                                }

                                $fullPath = str_starts_with($entry->path, '/') ? $entry->path : "{$appRoot}/{$entry->path}";

                                if (!is_file($fullPath) || !is_readable($fullPath)) {
                                    return (new Response(404))
                                        ->setHeader('Content-Type', 'text/plain; charset=UTF-8')
                                        ->withBody('Not found');
                                }

                                $contentType = ($scopeType === AssetEntry::TYPE_CSS)
                                    ? 'text/css; charset=UTF-8'
                                    : 'application/javascript';

                                return (new Response(200))
                                    ->setHeader('Content-Type', $contentType)
                                    ->withBody(file_get_contents($fullPath));
                            });
                        }
                    }
            }
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

        // Initialize renderer, engine registry and all bindings.
        $renderer = $this->initRenderer('cli');

        // Wire helpers into renderer context so every render call gets $helpers available.
        if (static::$instance !== null) {
            $helperBag = static::$instance->resolve('helpers');
            if ($helperBag instanceof \Laswitchtech\CoreWeb\Helper\Bag) {
                $renderer->setHelpers($helperBag);
            }
        }

        // Fire renderer.register hook so plugins can register layouts, templates, views.
        $hookRegistry = static::$instance->resolve('hook_registry');
        if ($hookRegistry instanceof \Laswitchtech\CoreWeb\Hook\Registry) {
            $rendererRegistry = static::$instance->resolve('renderer_registry');
            $hookRegistry->trigger('renderer.register', [
                'registry'  => $rendererRegistry,
                'renderer'  => $renderer,
                'container' => static::$instance,
                'mode'      => 'cli',
            ]);
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

    /**
      * Resolve the core kernel migrations directory path.
     *
     * Search order (priority descending):
     *   1. Config 'migrations.core_path' key (user override)
     *   2. Define CORE_WEB_ROOT constant — Core-Web package root
     *   3. Relative to this file (__DIR__/. . /migrations)
     */
    public static function resolveCoreMigrationsPath(): string {
        // 1. User config override (if set).
        $userPath = Config::get('migrations.core_path');
        if (is_string($userPath) && $userPath !== '') {
            return rtrim($userPath, '/\\');
        }

        // 2. CORE_WEB_ROOT constant — package/vendor install scenarios.
        if (defined('CORE_WEB_ROOT')) {
            return rtrim((string)CORE_WEB_ROOT . '/migrations', '/\\');
        }

        // 3. Relative to this file (standard Composer/vendor installs).
        $basePath = dirname(__DIR__);
        $candidate = "{$basePath}/migrations";
        if (is_dir($candidate)) {
            return rtrim($candidate, '/\\');
        }

        // Ultimate fallback: vendor core-web path.
        return rtrim($basePath . '/migrations', '/\\');
    }

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

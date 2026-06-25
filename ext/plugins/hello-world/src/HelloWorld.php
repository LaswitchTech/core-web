<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Config;
use Laswitchtech\CoreWeb\Renderer\Registry;
use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;

final class HelloWorld
{
    /** Full path to this plugin's manifest directory. */
    private static ?string $pluginDir = null;

    /** Register routes: /hello (web) + hello.world (cli). */
    public static function registerRoutes(array $context): void
    {
        if (!isset($context['router']) || !$context['router'] instanceof Router) {
            // Router not ready — skip.
            return;
        }

        /** @var Router $router */
        $router = $context['router'];

        /* ------------------------------------------------------------------ --/
         /  Renderer-dependent routes                                           */
        /* ------------------------------------------------------------------ */

        // Resolve the renderer from the container established during bootstrap.
        /** @var \Laswitchtech\CoreWeb\Renderer\Renderer|null $renderer */
        $renderer = null;
        try {
            $c = Bootstrap::container();
            if ($c->has('renderer')) {
                $renderer = $c->resolve('renderer');
            }
        } catch (\Throwable $_e) {
            // Container not ready — skip renderer routes (registry still usable).
        }

        if ($renderer instanceof \Laswitchtech\CoreWeb\Renderer\Renderer) {
            /** @var Renderer $renderer */
            $layout = 'hello.layout';
            $tmpl   = 'hello.template';
            $view   = 'hello.view';
            $data   = ['name' => 'World'];

            // Web route: /hello-render using the full layout -> template -> view pipeline.
            $router->get('/hello-render', function (Web $_req) use ($renderer, $layout, $tmpl, $view, $data): Response {
                return Response::html(
                    $renderer->render($layout, $tmpl, $view, $data),
                );
            });

            // CLI route: hello.render also exercises the pipeline.
            $router->command('hello.render', function (Cli $_req) use ($renderer, $layout, $tmpl, $view, $data): Response {
                return Response::text(
                    $renderer->render($layout, $tmpl, $view, $data) . PHP_EOL,
                );
            });

            // Latte smoke test: /hello-latte renders via layout -> template -> .latte view.
            $latteData  = ['name' => 'World'];
            $router->get('/hello-latte', function (Web $_req) use ($renderer, $latteData): Response {
                return Response::html(
                    $renderer->render('hello.layout', 'hello.template', 'hello.latte.view', $latteData),
                );
            });

            // CLI route: hello.latte also exercises the pipeline.
            $router->command('hello.latte', function (Cli $_req) use ($renderer, $latteData): Response {
                return Response::text(
                    $renderer->render('hello.layout', 'hello.template', 'hello.latte.view', $latteData) . PHP_EOL,
                );
            });

            // Legacy /hello route (no renderer).
            $router->get('/hello', fn (Web $_req) => Response::html('<h1>Hello World!</h1>'));
        } else {
            // Fallback when renderer is not available.
            $router->get('/hello', fn (Web $_req) => Response::html('<h1>Hello World!</h1>'));
        }

        // Legacy CLI route.
        $router->command('hello.world', function (Cli $req): Response {
            return Response::text('Hello ' . $req->arg(0, 'World') . "!\n");
        });

        /* ------------------------------------------------------------------ --/
         /  Temporary DB smoke-validation command                               */
        /* ------------------------------------------------------------------ */

        /** @var \Laswitchtech\CoreWeb\Bootstrap */
        if ($c = Bootstrap::container()) {
            $router->command('hello.db', function (Cli $_req) use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Connection */
                    $conn = $c->resolve('db_connection');
                    $stmt = $conn->query('SELECT sqlite_version() AS version');
                    if ($stmt === false) {
                        return Response::text("SQLite FAILED: sqlite_version query failed\n", 500);
                    }
                    $row = $stmt->fetch();
                    if (!\is_array($row) || !isset($row['version'])) {
                        return Response::text("SQLite FAILED: sqlite_version result missing\n", 500);
                    }
                    return Response::text("SQLite OK: {$row['version']}\n");
                } catch (\Throwable $_e) {
                    return Response::text("SQLite FAILED: {$_e->getMessage()}\n", 500);
                }
            });

            // Temporary smoke validation for the Query Builder (Phase 1F).
            $router->command('hello.query', function (Cli $_req) use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db = $c->resolve('database');

                    // Raw-PDO setup.
                    $pdo  = $db->pdo();
                    $pdo->exec("CREATE TABLE IF NOT EXISTS query_smoke (id INTEGER PRIMARY KEY, name TEXT)");
                    $pdo->exec("DELETE FROM query_smoke WHERE id = 1");
                    $pdo->exec("INSERT INTO query_smoke (id, name) VALUES (1, 'smoke')");

                    // Query via the fluent builder.
                    $row = $db->select('query_smoke')
                        ->where(['id' => 1])
                        ->fetch();

                    if (!\is_array($row) || !isset($row['name'])) {
                        return Response::text("Query FAILED: result row missing or name column not set\n", 500);
                    }

                    return Response::text("Query OK: {$row['name']}\n");
                } catch (\Throwable $_e) {
                    return Response::text("Query FAILED: {$_e->getMessage()}\n", 500);
                }
            });

            /* ------------------------------------------------------------------ --/
             /  Temporary CLI smoke command — migration Runner (Phase 1)         */
            /* ------------------------------------------------------------------ */

            /** @var \Laswitchtech\CoreWeb\Bootstrap */
            $router->command('hello.migrate', function (Cli $_req): Response {
                $tmpDir    = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'core-web-migration-smoke-' . bin2hex(random_bytes(8));
                $migrationsDir  = "{$tmpDir}/migrations";
                $dbFile       = "{$tmpDir}/smoke.db";
                $migrationSql = 'CREATE TABLE _migration_smoke (id INTEGER PRIMARY KEY, name TEXT NOT NULL)';

                try {
                    // 1. Create temp directories & migration file
                    if (!mkdir($migrationsDir, 0700, true)) {
                        return Response::text("Migration FAILED: could not create migrations directory\n", 500);
                    }
                    $migrationFile = "{$migrationsDir}/20260625000000_create_smoke_table.sql";
                    // File content: up (CREATE TABLE) + down (DROP TABLE).
                    if (!file_put_contents($migrationFile, $migrationSql . "\n\n-- Down:\nDROP TABLE _migration_smoke")) {
                        return Response::text("Migration FAILED: could not write migration file\n", 500);
                    }

                    // 2. Create a raw PDO for the smoke test database, then wrap it.
                    $pdo      = new \PDO(
                        "sqlite:{$dbFile}",
                        null,
                        null,
                        [
                            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                        ],
                    );
                    $conn     = new \Laswitchtech\CoreWeb\Database\Connection($pdo);

                    // 3. Instantiate core migration classes directly.
                    // CorePromoter (priority 0) is needed first — pass an empty temp dir so discover() returns [].
                    $emptyCoreDir   = sys_get_temp_dir() . '/core-web-smoke-empty-' . bin2hex(random_bytes(4));
                    mkdir($emptyCoreDir, 0700, true);

                    // Use CorePromoter (priority 0) with an empty dir so discover() returns [],
                    // and AppPromoter (priority 1) to exercise Migration::fromFile() + discover().
                    /** @var \Laswitchtech\CoreWeb\Migration\RegistryTable */
                    $registry     = new \Laswitchtech\CoreWeb\Migration\RegistryTable($conn);

                    $corePromoter  = new \Laswitchtech\CoreWeb\Migration\Promoter\CorePromoter($emptyCoreDir);
                    $appPromoter   = new \Laswitchtech\CoreWeb\Migration\Promoter\AppPromoter($migrationsDir);
                    $runner        = new \Laswitchtech\CoreWeb\Migration\Runner(
                        [$corePromoter, $appPromoter],
                        $conn,
                        'sqlite',
                        $registry,
                    );

                    // 4. Ensure the tracking table exists before the first run().
                    $registry->ensureTable();

                    // 5. First migration run — expect exactly one applied version.
                    $applied = $runner->run();
                    if (\count($applied) !== 1 || !\in_array('20260625000000', $applied, true)) {
                        return Response::text("Migration FAILED: expected 1 applied version, got " . \count($applied) . "\n", 500);
                    }

                    // 6. Second migration run — expect zero applied (already applied, idempotent).
                    $again = $runner->run();
                    if (\count($again) !== 0) {
                        return Response::text("Migration FAILED: second run should have zero applied versions, got " . \count($again) . "\n", 500);
                    }

                    // 7. Rollback one batch — verify registry row removed.
                    $rolledBack = $runner->rollback(1);
                    if (\count($rolledBack) !== 1 || !\in_array('20260625000000', $rolledBack, true)) {
                        return Response::text("Migration FAILED: rollback did not remove expected version\n", 500);
                    }

                    // 8. Verify the migration tracking row is gone.
                    if ($registry->isApplied('20260625000000')) {
                        return Response::text("Migration FAILED: registry still reports version as applied after rollback\n", 500);
                    }

                    // 9. Verify _migration_smoke table no longer exists in the database.
                    $pdo = $conn->pdo();
                    $stmt = $pdo->query(
                        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_migration_smoke'"
                    );
                    if ($stmt === false) {
                        return Response::text("Migration FAILED: could not verify smoke table removal\n", 500);
                    }
                    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
                    if ($row !== false) {
                        return Response::text("Migration FAILED: _migration_smoke table still exists after rollback\n", 500);
                    }

                    // Cleanup temp files.
                    @unlink($dbFile);
                    @unlink($migrationFile);
                    @rmdir($migrationsDir);
                    @rmdir($emptyCoreDir);
                    @rmdir($tmpDir);

                    return Response::text("Migration OK\n");
                } catch (\Throwable $_e) {
                    // Best-effort cleanup on failure so smoke-test leaves nothing behind.
                    if (isset($migrationFile) && is_file($migrationFile)) { @unlink($migrationFile); }
                    if (isset($dbFile) && is_file($dbFile))        { @unlink($dbFile); }
                    if (isset($migrationsDir) && is_dir($migrationsDir))   { @rmdir($migrationsDir); }
                    if (isset($emptyCoreDir)  && is_dir($emptyCoreDir))    { @rmdir($emptyCoreDir); }
                    if (isset($tmpDir)        && is_dir($tmpDir))          { @rmdir($tmpDir); }
                    return Response::text("Migration FAILED: " . $_e->getMessage() . "\n", 500);
                }
            });

            /* ------------------------------------------------------------------ --/
             /  Temporary CLI smoke command — logger (Phase 1)                   */
            /* ------------------------------------------------------------------ */

            $router->command('hello.log', function (Cli $_req) use ($c): Response {
                try {
                    /** @var mixed */
                    $logger = null;

                    if ($c->has('logger.hello')) {
                        $logger = $c->resolve('logger.hello');
                    } elseif ($c->has('logger_factory')) {
                        $logger = $c->resolve('logger_factory')('hello');
                    } else {
                        return Response::text("Logger FAILED: no logger service available\n", 500);
                    }

                    if (!$logger instanceof \Laswitchtech\CoreWeb\Logger\Logger) {
                        return Response::text("Logger FAILED: resolved logger is not a Logger instance\n", 500);
                    }

                    $logger->info('Hello logger smoke', ['source' => 'hello.log']);

                    /* ------------------------------------------------------------------ --/
                     /  Verify file and content                                             */
                    /* ------------------------------------------------------------------ */

                    $appRoot = $c->resolve('app_root');

                    // Guard: app_root must be a non-empty string for path resolution.
                    if (!is_string($appRoot) || $appRoot === '') {
                        return Response::text("Logger FAILED: app_root is not available\n", 500);
                    }

                    // Respect logging.path from config, defaulting to "log".
                    $loggingPath = Config::get('logging.path', 'log');
                    if (!is_string($loggingPath) || $loggingPath === '') {
                        $loggingPath = 'log';
                    }

                    $logFile = $appRoot . '/' . trim($loggingPath, '/\\') . '/hello.log';

                    if (!is_file($logFile)) {
                        return Response::text("Logger FAILED: log file does not exist: {$logFile}\n", 500);
                    }

                    $content = file_get_contents($logFile);
                    if ($content === false || str_contains($content, 'Hello logger smoke') === false) {
                        return Response::text("Logger FAILED: log file does not contain expected message\n", 500);
                    }

                    /** @var \Laswitchtech\CoreWeb\Logger\Level */
                    return Response::text("Logger OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("Logger FAILED: " . $_e->getMessage() . "\n", 500);
                }
            });
        }
    }

    /** Register renderer resources into the registry during discovery. */
    public static function registerRenderer(array $context): void
    {
        if (!isset($context['registry']) || !$context['registry'] instanceof Registry) {
            return;
        }

        /** @var Registry $registry */
        $registry = $context['registry'];
        $dir      = self::getPluginDir();

        // If the plugin directory is not yet known we cannot register resources.
        if ($dir === null) {
            return;
        }

        $registry->add('hello.layout',     'layout',   "{$dir}/layouts/hello-view.php",  'plugin');
        $registry->add('hello.template',    'template', "{$dir}/templates/hello-view.php", 'plugin');
        $registry->add('hello.view',        'view',     "{$dir}/views/hello-view.php",    'plugin');
        $registry->add('hello.latte.view',  'view',     "{$dir}/views/hello-view.latte",  \Laswitchtech\CoreWeb\Renderer\Resource\Entry::PROVIDER_PLUGIN, 0, ['engine' => 'latte']);
    }

    /** Return the plugin directory (lazily resolved). */
    private static function getPluginDir(): ?string
    {
        if (self::$pluginDir === null) {
            $m = __FILE__;                       // src/HelloWorld.php
            $r = realpath($m);
            self::$pluginDir = $r !== false
                ? dirname(dirname($r))        // ...->hello-world
                : null;
        }

        return self::$pluginDir;
    }
}

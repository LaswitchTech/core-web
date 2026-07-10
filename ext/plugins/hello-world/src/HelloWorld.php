<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Config;
use Laswitchtech\CoreWeb\Renderer\Registry;
use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;
use Laswitchtech\CoreWeb\Asset\Entry as AssetEntry;
use Laswitchtech\CoreWeb\Asset\Registry as AssetRegistry;

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
             /  Temporary CLI smoke command — insert builder (Phase 1F)           */
            /* ------------------------------------------------------------------ */

            $router->command('hello.insert', function () use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db = $c->resolve('database');

                    // Setup: create table, clean slate.
                    $pdo  = $db->pdo();
                    $pdo->exec("CREATE TABLE IF NOT EXISTS insert_smoke (id INTEGER PRIMARY KEY, name TEXT, active INTEGER)");
                    $pdo->exec("DELETE FROM insert_smoke WHERE id = 1");

                    // Insert via builder → verify affected rows.
                    $affected = $db->insert('insert_smoke', ['id' => 1, 'name' => 'inserted', 'active' => true])->execute();
                    if ($affected < 1) {
                        return Response::text("Insert FAILED: expected >= 1 affected rows\n", 500);
                    }

                    // Verify row exists and active was cast to integer (1).
                    $row = $pdo->query("SELECT id, active FROM insert_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (!\is_array($row) || $row['active'] !== 1) {
                        return Response::text("Insert FAILED: row id=1 not found or active is " . var_export($row ?? null, true) . "\n", 500);
                    }

                    return Response::text("Insert OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("Insert FAILED: " . $_e->getMessage() . "\n", 500);
                }
            });

            /* ------------------------------------------------------------------ --/
              /  Temporary CLI smoke command — update builder (Phase 1F)           */
            /* ------------------------------------------------------------------ */

            $router->command('hello.update', function () use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db    = $c->resolve('database');
                    $pdo   = $db->pdo();

                    // Setup: create / clean table.
                    $pdo->exec("CREATE TABLE IF NOT EXISTS update_smoke (id INTEGER PRIMARY KEY, name TEXT, active INTEGER)");
                    $pdo->exec("DELETE FROM update_smoke WHERE id = 1");

                    // Seed row using raw PDO.
                    $pdo->exec("INSERT INTO update_smoke (id, name, active) VALUES (1, 'original', 1)");

                    // Update via fluent builder — active=false must cast to integer 0.
                    $affected = $db->update('update_smoke', ['name' => 'updated', 'active' => false])
                        ->where(['id' => 1])
                        ->execute();

                    if ($affected < 1) {
                        return Response::text("Update FAILED: expected >= 1 affected rows\n", 500);
                    }

                    // Verify column values.
                    $row = $pdo->query("SELECT name, active FROM update_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (!\is_array($row)) {
                        return Response::text("Update FAILED: result row missing\n", 500);
                    }
                    if ($row['name'] !== 'updated') {
                        return Response::text("Update FAILED: name expected 'updated', got " . var_export($row ?? null, true) . "\n", 500);
                    }
                    if ($row['active'] !== 0) {
                        return Response::text("Update FAILED: active expected 0, got " . var_export($row ?? null, true) . "\n", 500);
                    }

                    // Additional assertion exercising string-form where('id', 1).
                    $affected = $db->update('update_smoke', ['name' => 're-verified'])
                        ->where('id', 1)
                        ->execute();
                    if ($affected < 1) {
                        return Response::text("Update FAILED: string where() did not affect row\n", 500);
                    }

                    $row = $pdo->query("SELECT name FROM update_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (!\is_array($row) || $row['name'] !== 're-verified') {
                        return Response::text("Update FAILED: string where() result mismatch\n", 500);
                    }

                    return Response::text("Update OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("Update FAILED: " . $_e->getMessage() . "\n", 500);
                }
            });

            /* ------------------------------------------------------------------ --/
              /  Temporary CLI smoke command — delete builder (Phase 1F)           */
            /* ------------------------------------------------------------------ */

            $router->command('hello.delete', function () use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db    = $c->resolve('database');
                    $pdo   = $db->pdo();

                    // Setup: create / clean table.
                    $pdo->exec("CREATE TABLE IF NOT EXISTS delete_smoke (id INTEGER PRIMARY KEY, name TEXT)");
                    $pdo->exec("DELETE FROM delete_smoke WHERE id = 1");

                    // Seed row using raw PDO.
                    $pdo->exec("INSERT INTO delete_smoke (id, name) VALUES (1, 'to_delete')");

                    // Verify row exists before delete.
                    $row = $pdo->query("SELECT * FROM delete_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (!\is_array($row) || $row['id'] !== 1) {
                        return Response::text("Delete FAILED: seed row not found before delete\n", 500);
                    }

                    // Delete via fluent builder.
                    $affected = $db->delete('delete_smoke')
                        ->where(['id' => 1])
                        ->execute();

                    if ($affected < 1) {
                        return Response::text("Delete FAILED: expected >= 1 affected rows\n", 500);
                    }

                    // Verify row no longer exists.
                    $row = $pdo->query("SELECT * FROM delete_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (\is_array($row) && $row['id'] === 1) {
                        return Response::text("Delete FAILED: row still exists after delete\n", 500);
                    }

                    // Additional assertion exercising string-form where('id', 1).
                    $pdo->exec("INSERT INTO delete_smoke (id, name) VALUES (1, 're-deleted')");
                    $affected = $db->delete('delete_smoke')
                        ->where('id', 1)
                        ->execute();
                    if ($affected < 1) {
                        return Response::text("Delete FAILED: string where() did not affect row\n", 500);
                    }

                    return Response::text("Delete OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("Delete FAILED: " . $_e->getMessage() . "\n", 500);
                }
            });

            /* ------------------------------------------------------------------ --/
              /  Temporary CLI smoke command — transaction (Phase 1F)              */
            /* ------------------------------------------------------------------ */

            /** @var \Laswitchtech\CoreWeb\Bootstrap */
            $router->command('hello.transaction', function (Cli $_req) use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db    = $c->resolve('database');
                    $pdo   = $db->pdo();

                    // Create / clean up.
                    $pdo->exec("CREATE TABLE IF NOT EXISTS transaction_smoke (id INTEGER PRIMARY KEY, name TEXT)");
                    $pdo->exec("DELETE FROM transaction_smoke WHERE id IN (1, 2)");

                    // Successful transaction: insert id=1, name='committed'.
                    $db->transaction(function ($innerDb) use ($pdo) {
                        $innerPdo = $innerDb->pdo();
                        $innerPdo->prepare("INSERT INTO transaction_smoke (id, name) VALUES (?, ?)")
                            ->execute([1, 'committed']);
                    });

                    // 1. Verify id=1 exists after the transaction.
                    $row = $pdo->query("SELECT name FROM transaction_smoke WHERE id = 1")->fetch(\PDO::FETCH_ASSOC);
                    if (!\is_array($row) || $row['name'] !== 'committed') {
                        return Response::text(
                            "Transaction FAILED: id=1/committed should exist after successful transaction\n",
                            500,
                        );
                    }

                    // Failing transaction: insert id=2, name='rolled_back', then throw.
                    try {
                        $db->transaction(function ($innerDb) use ($pdo) {
                            $innerPdo = $innerDb->pdo();
                            $innerPdo->prepare("INSERT INTO transaction_smoke (id, name) VALUES (?, ?)")
                                ->execute([2, 'rolled_back']);
                            throw new \RuntimeException('Intentional failure');
                        });
                    } catch (\RuntimeException $_e) {
                        // Expected — do nothing, verification below.
                    }

                    // 2. Verify id=2 does NOT exist after rollback.
                    $row = $pdo->query("SELECT id FROM transaction_smoke WHERE id = 2")->fetch(\PDO::FETCH_ASSOC);
                    if (\is_array($row)) {
                        return Response::text(
                            "Transaction FAILED: id=2 should not exist after rollback\n",
                            500,
                        );
                    }

                    // 3. Verify inTransaction() returns false at the end.
                    if ($db->inTransaction()) {
                        return Response::text(
                            "Transaction FAILED: inTransaction() is true when it should be false\n",
                            500,
                        );
                    }

                    return Response::text("Transaction OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("Transaction FAILED: " . $_e->getMessage() . "\n", 500);
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
              /  Temporary CLI smoke command — JOIN validation (Phase 2A)          */
            /* ------------------------------------------------------------------ */

            $router->command('hello.join', function () use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Database */
                    $db    = $c->resolve('database');
                    $pdo   = $db->pdo();

                    // Create two temporary tables for JOIN validation.
                    $pdo->exec("DROP TABLE IF EXISTS smoke_join_users");
                    $pdo->exec("CREATE TABLE smoke_join_users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, role_id INTEGER NULL)");

                    $pdo->exec("DROP TABLE IF EXISTS smoke_join_roles");
                    $pdo->exec("CREATE TABLE smoke_join_roles (id INTEGER PRIMARY KEY, name TEXT NOT NULL)");

                    // Seed deterministic smoke rows.
                    $pdo->exec("INSERT OR REPLACE INTO smoke_join_roles VALUES (10, 'admin')");
                    $pdo->exec("INSERT OR REPLACE INTO smoke_join_users VALUES (1, 'Alice', 10)");
                    $pdo->exec("INSERT OR REPLACE INTO smoke_join_users VALUES (2, 'Bob', NULL)");

                    // INNER JOIN: Alice should join to admin.
                    // Select only the target table column to avoid key collisions with FETCH_ASSOC.
                    $innerRows = $db->select('smoke_join_users', ['smoke_join_roles.name'])
                        ->join('smoke_join_roles', 'smoke_join_users.role_id', '=', 'smoke_join_roles.id')
                        ->where(['smoke_join_users.id' => 1])
                        ->all();

                    if (count($innerRows) !== 1 || ($innerRows[0]['name'] ?? null) !== 'admin') {
                        return Response::text("INNER JOIN FAILED: expected Alice→admin\n", 500);
                    }

                    // LEFT JOIN: Bob (null role_id) should still appear with a valid name.
                    $leftJoinRows = $db->select('smoke_join_users', ['smoke_join_users.name'])
                        ->leftJoin('smoke_join_roles', 'smoke_join_users.role_id', '=', 'smoke_join_roles.id')
                        ->where(['smoke_join_users.id' => 2])
                        ->all();

                    if (count($leftJoinRows) !== 1 || ($leftJoinRows[0]['name'] ?? null) !== 'Bob') {
                        return Response::text("LEFT JOIN FAILED: expected Bob with no matching role\n", 500);
                    }

                    return Response::text("JOIN OK\n");
                } catch (\Throwable $_e) {
                    return Response::text("JOIN FAILED: " . $_e->getMessage() . "\n", 500);
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

    /** Register demo CSS + JS entries during `asset.register`. */
    public static function registerAssets(array $context): void
    {
        if (!isset($context['registry']) || !$context['registry'] instanceof AssetRegistry) {
            return;
        }

        /** @var AssetRegistry $registry */
        $registry = $context['registry'];
        $dir      = self::getPluginDir();

        // One CSS entry (priority 0 → plugin rank) — local LESS source file.
        $name     = 'hello-world';
        if ($dir !== null) {
            $cssSrc = "{$dir}/styles/style.less";
        } else {
            $cssSrc = "https://cdn.example.com/vendor/{$name}/style.css?v=1.0.0";
        }
        $cssEntry = new AssetEntry(
            "{$name}/style.css",
            $cssSrc,
            AssetEntry::TYPE_CSS,
            AssetEntry::PROVIDER_PLUGIN,
            400,
            ['integrity' => 'sha384-example-css', 'preload' => true],
        );
        $registry->register($cssEntry);

        // One JS entry (priority → plugin rank).
        $jsEntry = new AssetEntry(
            "{$name}/app.js",
            "https://cdn.example.com/vendor/{$name}/app.js?v=1.0.0",
            AssetEntry::TYPE_JS,
            AssetEntry::PROVIDER_PLUGIN,
            0,
            ['integrity' => 'sha384-example-js', 'defer' => true],
        );
        $registry->register($jsEntry);
    }
}

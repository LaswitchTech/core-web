<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;

final class Core
{
    /** Register core routes via the router.register hook. */
    public static function registerRoutes(array $context): void
    {
        // Bootstrap must have completed to resolve container services.
        if (!class_exists(Bootstrap::class, true)) {
            return;
        }
        if (!isset($context['router']) || !$context['router'] instanceof Router) {
            return;
        }

        $router = $context['router'];

        // Placeholder CLI command — core.info echos a confirmation.
        $router->command('core.info', static function (): Response {
            return Response::text("Core OK\n");
        });

        /* ------------------------------------------------------------------ --/
          /  core.db — single dispatcher for all subcommands                  */
        /* ------------------------------------------------------------------ */

        /** @var \Laswitchtech\CoreWeb\Container */
        $c = Bootstrap::container();
        if ($c !== null) {
            $router->command('core.db', static function ($req) use ($c): Response {
                // arg(0): subcommand (connect, read, create, update, delete, smoke).
                $subcmd = $req->arg(0);
                if ($subcmd === null || $subcmd === '') {
                    return Response::text("core.db: subcommand required (connect|read|create|update|delete|smoke)\n", 400);
                }

                switch ($subcmd) {
                    case 'connect':
                        return self::handleConnect($c);

                    case 'read':
                        return self::handleRead($req, $c);

                    case 'create':
                        return self::handleCreate($req, $c);

                    case 'update':
                        return self::handleUpdate($req, $c);

                    case 'delete':
                        return self::handleDelete($req, $c);

                    case 'smoke':
                        return self::handleSmoke($c);

                    case 'seed-smoke':
                        return self::handleSeedSmoke($c);

                    default:
                        return Response::text("core.db: unknown subcommand '{$subcmd}' (connect|read|create|update|delete|smoke)\n", 400);
                }
            });
        }

        /* ------------------------------------------------------------------ */

    } // registerRoutes()

    /* ================================================================== */
    /*  Subcommand handlers                                                 */
    /* ================================================================== */

    /** core.db subcmd=connect — validate configured database connectivity.  */
    private static function handleConnect(\Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db      = $c->resolve('database');
            $pdo     = $db->pdo();
            $driver  = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);

            // Verify connectivity with a trivial query.
            $result = $pdo->query('SELECT 1 AS ok');

            if ($result === false) {
                throw new \RuntimeException('SELECT 1 FAILED: no result returned');
            }

            return Response::text("Database OK: {$driver}\n");
        } catch (\Throwable $_e) {
            return Response::text("Database FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** core.db subcmd=smoke — full CRUD cycle on a temporary table.          */
    private static function handleSmoke(\Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db = $c->resolve('database');

            // -- Create table if not exists (raw SQL: query builder has no DDL) ---
            $stmt = $db->pdo()->exec('CREATE TABLE IF NOT EXISTS core_db_smoke (
                id   INTEGER PRIMARY KEY,
                name TEXT,
                active INTEGER
            )');
            if ($stmt === false) {
                throw new \RuntimeException('table creation failed: ' . implode('; ', $db->pdo()->errorInfo()));
            }

            // -- Cleanup from previous runs (raw IN clause) --------------------
            $delPrepared = $db->prepare('DELETE FROM core_db_smoke WHERE id IN (1, 2)');
            if (!$delPrepared || !$delPrepared->execute()) {
                throw new \RuntimeException('cleanup failed: ' . implode('; ', $db->pdo()->errorInfo()));
            }

            // -- CREATE row id=1, name='Alice', active=true ----------------------
            $inserted = $db->insert('core_db_smoke', ['id' => 1, 'name' => 'Alice', 'active' => true])->execute();
            if ($inserted === false || $inserted < 1) {
                throw new \RuntimeException("insert returned {$inserted}");
            }

            // -- READ row id=1 and verify active=1 -------------------------------
            $row = $db->select('core_db_smoke')->where(['id' => 1])->fetch();
            if ($row === null) {
                throw new \RuntimeException("read id=1 returned null");
            }
            // true serializes to 1 in SQLite.
            if ($row['active'] != 1) {
                throw new \RuntimeException("active expected 1, got " . var_export($row['active'], true));
            }

            // -- UPDATE row id=1 → name='Bob', active=false ----------------------
            $updated = $db->update('core_db_smoke', ['name' => 'Bob', 'active' => false])->where(['id' => 1])->execute();
            if ($updated === false || $updated < 1) {
                throw new \RuntimeException("update returned {$updated}");
            }

            // -- READ row id=1 and verify name='Bob', active=0 ------------------
            $row = $db->select('core_db_smoke')->where(['id' => 1])->fetch();
            if ($row === null) {
                throw new \RuntimeException("read after update returned null");
            }
            if ($row['name'] !== 'Bob') {
                throw new \RuntimeException("name expected 'Bob', got '{$row['name']}'");
            }
            // false serializes to 0 in SQLite.
            if ($row['active'] != 0) {
                throw new \RuntimeException("active expected 0, got " . var_export($row['active'], true));
            }

            // -- DELETE row id=1 -------------------------------------------------
            $deleted = $db->delete('core_db_smoke')->where(['id' => 1])->execute();
            if ($deleted === false || $deleted < 1) {
                throw new \RuntimeException("delete returned {$deleted}");
            }

            // -- VERIFY row id=1 no longer exists --------------------------------
            $row = $db->select('core_db_smoke')->where(['id' => 1])->fetch();
            if ($row !== null) {
                throw new \RuntimeException("post-delete read still returned a row: " . json_encode($row));
            }

            return Response::text("Core DB Smoke OK\n");

        } catch (\Throwable $_e) {
            return Response::text("Core DB Smoke FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** core.db subcmd=seed-smoke — validate seeding via temporary group.      */
    private static function handleSeedSmoke(\Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            /** @var \Laswitchtech\CoreWeb\Database\Connection */
            $conn = $c->resolve('db_connection');

            // Create a temporary seed group with a single harmless INSERT.
            $tmpDir  = sys_get_temp_dir() . '/core-web-seed-smoke-' . uniqid('', true);
            $groupDir = $tmpDir . '/seeds/smoke_test';
            mkdir($groupDir, 0755, true);

            // Seed filename uses YYYYMMDDHHmmss_<name>.sql format (must be valid date).
            $timestamp = date('YmdHis');
            $fileName   = "{$timestamp}_smoke.sql";
            $sqlFile    = "{$groupDir}/{$fileName}";
            if (file_put_contents($sqlFile, "SELECT 1 AS smoke_ok") === false) {
                throw new \RuntimeException("Could not write temporary seed file");
            }

            // Wire a fresh Seeder pointing at the temp root.
            /** @var \Laswitchtech\CoreWeb\Database\Seeding\SeedLoader */
            $loader = new \Laswitchtech\CoreWeb\Database\Seeding\SeedLoader($tmpDir, $tmpDir);
            /** @var \Laswitchtech\CoreWeb\Database\Seeding\RegistryTable */
            $reg    = new \Laswitchtech\CoreWeb\Database\Seeding\RegistryTable($conn);
            $seeder = new \Laswitchtech\CoreWeb\Database\Seeding\Seeder($conn, $loader, $reg);

            // First run — expect one applied seed.
            $result1 = $seeder->run('smoke_test');
            if ($result1 === [] || $result1[0]['status'] !== 'applied') {
                throw new \RuntimeException("First seed run expected 1 applied result: " . json_encode($result1));
            }

            // Second run — idempotency check: same group, expect one skipped seed.
            $result2 = $seeder->run('smoke_test');
            if ($result2 === [] || $result2[0]['status'] !== 'skipped') {
                throw new \RuntimeException("Second seed run expected 1 skipped (idempotent): " . json_encode($result2));
            }

            /* Clean up */
            unlink($sqlFile);
            rmdir($groupDir);
            rmdir("{$tmpDir}/seeds");
            rmdir($tmpDir);

            return Response::text("Core DB Seed Smoke OK\n");

        } catch (\Throwable $_e) {
            return Response::text("Core DB Seed Smoke FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** helper: validate a table/column name.                                 */
    private static function validateColumnName(string $name): string|false
    {
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name)) {
            return "invalid column/table name '{$name}'";
        }
        return false; // ok
    }

    /** helper: parse where expression → [col, op, val].                       */
    private static function parseWhere(string $whereExpr): array|false|string
    {
        $parts = preg_split('/\s+/', trim($whereExpr), 3, PREG_SPLIT_NO_EMPTY);
        if (\count($parts) !== 3) {
            return "expected '<column> <operator> <value>'";
        }

        [$col, $op, $val] = $parts;

        $e = self::validateColumnName($col);
        if ($e !== false) {
            return $e;
        }

        $validOps = ['=', '!=', '<', '>', '<=', '>=', 'LIKE'];
        if (!in_array($op, $validOps, true)) {
            return "unsupported operator '{$op}'";
        }

        // Treat value as numeric (int or float) if it looks like a number;
        // otherwise string.
        if (is_numeric($val)) {
            $val = ctype_digit($val) ? (int)$val : (float)$val;
        }

        return [$col, $op, $val];
    }

    /** helper: validate JSON data columns.                                    */
    private static function validateJsonData(array $data): string|false
    {
        $keyPattern = '/^[a-zA-Z_][a-zA-Z0-9_]*$/';
        foreach (\array_keys($data) as $key) {
            if (!\preg_match($keyPattern, $key)) {
                return "invalid column name '{$key}' in JSON data";
            }
        }
        return false; // ok
    }

    /* ------------------------------------------------------------------ */

    /** core.db subcmd=read — SELECT rows with optional where clause         */
    private static function handleRead(\Laswitchtech\CoreWeb\Router\Request $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            // arg(1) is the table name (arg(0) is subcmd=).
            $table = $req->arg(1);
            if ($table === null || $table === '') {
                return Response::text("Read FAILED: table name is required\n", 400);
            }

            $e = self::validateColumnName($table);
            if ($e !== false) {
                return Response::text("Read FAILED: {$e}\n", 400);
            }

            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db       = $c->resolve('database');
            $builder  = $db->select($table);

            // Parse optional where expression (arg(2)).
            $whereExpr = $req->arg(2);
            if ($whereExpr !== null && $whereExpr !== '') {
                $result = self::parseWhere($whereExpr);
                if (\is_string($result)) {
                    return Response::text("Read FAILED: invalid where expression '{$whereExpr}' — {$result}\n", 400);
                }
                [$col, $op, $val] = $result;
                $builder->where($col, $op, $val);
            }

            $rows   = $builder->all();
            return Response::text(json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");

        } catch (\Throwable $_e) {
            return Response::text("Read FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** core.db subcmd=create — INSERT a row from JSON data                  */
    private static function handleCreate(\Laswitchtech\CoreWeb\Router\Request $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            // arg(1): table name, required.
            $table = $req->arg(1);
            if ($table === null || $table === '') {
                return Response::text("Create FAILED: table name is required\n", 400);
            }

            $e = self::validateColumnName($table);
            if ($e !== false) {
                return Response::text("Create FAILED: {$e}\n", 400);
            }

            // arg(2): JSON data, required.
            $json = $req->arg(2);
            if ($json === null || $json === '') {
                return Response::text("Create FAILED: JSON data is required\n", 400);
            }

            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db   = $c->resolve('database');

            $data = json_decode($json, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return Response::text("Create FAILED: invalid JSON — " . json_last_error_msg() . "\n", 400);
            }

            if (!\is_array($data)) {
                return Response::text("Create FAILED: JSON must decode to a JSON object\n", 400);
            }

            if (empty($data)) {
                return Response::text("Create FAILED: JSON data must not be empty\n", 400);
            }

            $ve = self::validateJsonData($data);
            if ($ve !== false) {
                return Response::text("Create FAILED: {$ve}\n", 400);
            }

            /** @var \Laswitchtech\CoreWeb\Database\InsertBuilder */
            $affected  = $db->insert($table, $data)->execute();

            return Response::text("Created: {$affected}\n");

        } catch (\Throwable $_e) {
            return Response::text("Create FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** core.db subcmd=update — UPDATE rows from JSON data (where required)  */
    private static function handleUpdate(\Laswitchtech\CoreWeb\Router\Request $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            $table = $req->arg(1);
            if ($table === null || $table === '') {
                return Response::text("Update FAILED: table name is required\n", 400);
            }

            $e = self::validateColumnName($table);
            if ($e !== false) {
                return Response::text("Update FAILED: {$e}\n", 400);
            }

            $json = $req->arg(2);
            if ($json === null || $json === '') {
                return Response::text("Update FAILED: JSON data is required\n", 400);
            }

            $data = json_decode($json, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return Response::text("Update FAILED: invalid JSON — " . json_last_error_msg() . "\n", 400);
            }

            if (!\is_array($data)) {
                return Response::text("Update FAILED: JSON must decode to a JSON object\n", 400);
            }

            if (empty($data)) {
                return Response::text("Update FAILED: JSON data must not be empty\n", 400);
            }

            $ve = self::validateJsonData($data);
            if ($ve !== false) {
                return Response::text("Update FAILED: {$ve}\n", 400);
            }

            // where expression (arg(3)) — REQUIRED for safety.
            $whereExpr = $req->arg(3);
            if ($whereExpr === null || $whereExpr === '') {
                return Response::text("Update FAILED: WHERE condition required\n", 400);
            }

            $result = self::parseWhere($whereExpr);
            if (\is_string($result)) {
                return Response::text("Update FAILED: invalid where expression '{$whereExpr}' — {$result}\n", 400);
            }
            [$col, $op, $val] = $result;

            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db    = $c->resolve('database');
            $new   = $db->update($table, $data)->where($col, $op, $val)->execute();

            return Response::text("Updated: {$new}\n");

        } catch (\Throwable $_e) {
            return Response::text("Update FAILED: {$_e->getMessage()}\n", 500);
        }
    }

    /** core.db subcmd=delete — DELETE rows (where required)                */
    private static function handleDelete(\Laswitchtech\CoreWeb\Router\Request $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        try {
            $table = $req->arg(1);
            if ($table === null || $table === '') {
                return Response::text("Delete FAILED: table name is required\n", 400);
            }

            $e = self::validateColumnName($table);
            if ($e !== false) {
                return Response::text("Delete FAILED: {$e}\n", 400);
            }

            // where expression (arg(2)) — REQUIRED for safety.
            $whereExpr = $req->arg(2);
            if ($whereExpr === null || $whereExpr === '') {
                return Response::text("Delete FAILED: WHERE condition required\n", 400);
            }

            $result = self::parseWhere($whereExpr);
            if (\is_string($result)) {
                return Response::text("Delete FAILED: invalid where expression '{$whereExpr}' — {$result}\n", 400);
            }
            [$col, $op, $val] = $result;

            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db    = $c->resolve('database');
            $del   = $db->delete($table)->where($col, $op, $val)->execute();

            return Response::text("Deleted: {$del}\n");

        } catch (\Throwable $_e) {
            return Response::text("Delete FAILED: {$_e->getMessage()}\n", 500);
        }
    }
}

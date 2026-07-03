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

        /* ------------------------------------------------------------------ --/
          /  core.extension — skeleton (handlers not yet implemented)            */
        /* ------------------------------------------------------------------ */

        $router->command('core.extension', static function ($req) use ($c): Response {
            $subcmd = $req->arg(0);

            switch ($subcmd) {
                case 'list':
                    return self::handleListSubcmd($req, $c);

                case 'enable':
                    return self::handleEnableSubcmd($req, $c);

                case 'disable':
                    return self::handleDisableSubcmd($req, $c);

                case 'status':
                    return self::handleStatusSubcmd($req, $c);

                default:
                    return Response::text("Usage: core.extension list [plugins|themes] | status [plugin.<slug>|theme.<slug>] | enable plugin.<slug>|theme.<slug> | disable plugin.<slug>|theme.<slug>\n", 400);
            }
        });

        /* ------------------------------------------------------------------ --/
          /  core.smtp — smoke-test send via mailer                           */
        /* ------------------------------------------------------------------ */

        $router->command('core.smtp', static function ($req) use ($c): Response {
            $subcmd = $req->arg(0);
            if ($subcmd === null || $subcmd === '') {
                return Response::text("Usage: core.smtp send <to> <subject>\n", 400);
            }

            switch ($subcmd) {
                case 'send': {
                    /** @var \Laswitchtech\CoreWeb\Mail\Mailer|null */
                    $mailer = $c->resolve('mailer');
                    if ($mailer === null) {
                        return Response::text("SMTP is not enabled — cannot send mail.\n", 500);
                    }

                    $to      = trim($req->arg(1) ?? '');
                    $subject = trim($req->arg(2) ?? '');

                    if ($to === '' || !str_contains($to, '@')) {
                        return Response::text("core.smtp send FAILED: recipient address required (must contain @)\n", 400);
                    }
                    if ($subject === '') {
                        return Response::text("core.smtp send FAILED: subject is required\n", 400);
                    }

                    /** @var \Laswitchtech\CoreWeb\Message\EmailAddress $emailAddress */
                    $emailAddress = new \Laswitchtech\CoreWeb\Message\EmailAddress($to, '');

                    try {
                        $mailer->sendTemplate(
                            'test',
                            [
                                'subject'  => $subject,
                                'app_name' => (string)\Laswitchtech\CoreWeb\Config::get('app.name', 'Core-Web App'),
                                'sent_at'    => date('Y-m-d H:i:s T'),
                            ],
                            ['to' => [$emailAddress]],
                        );

                        return Response::text("Mail to {$to}: OK\n");
                    } catch (\Throwable $e) {
                        return Response::text("core.smtp send FAILED: {$e->getMessage()}\n", 500);
                    }
                }

                default:
                    return Response::text("Usage: core.smtp send <to> <subject>\n", 400);
            }
        });

        /* ------------------------------------------------------------------ --/
          /  core.sms — smoke-test send via sms_service                       */
        /* ------------------------------------------------------------------ */

        $router->command('core.sms', static function ($req) use ($c): Response {
            $subcmd = $req->arg(0);
            if ($subcmd === null || $subcmd === '') {
                return Response::text("Usage: core.sms send <phone> <subject>\n", 400);
            }

            switch ($subcmd) {
                case 'send': {
                    /** @var \Laswitchtech\CoreWeb\Sms\SmsService|null */
                    $sms = $c->resolve('sms_service');
                    if ($sms === null) {
                        return Response::text("SMS service is not enabled — cannot send SMS.\n", 500);
                    }

                    $phone = trim($req->arg(1) ?? '');
                    $subject = trim($req->arg(2) ?? '');

                    if ($phone === '') {
                        return Response::text("core.sms send FAILED: phone number required\n", 400);
                    }
                    if ($subject === '') {
                        return Response::text("core.sms send FAILED: subject is required\n", 400);
                    }

                    try {
                        $result = $sms->sendTemplate(
                            $phone,
                            'test',
                            [
                                'subject'  => $subject,
                                'app_name' => (string)\Laswitchtech\CoreWeb\Config::get('app.name', 'Core-Web App'),
                                'sent_at'    => date('Y-m-d H:i:s T'),
                            ],
                        );

                        if ($result->success) {
                            return Response::text("SMS to {$phone}: OK ({$result->messageId})\n");
                        }

                        return Response::text("SMS to {$phone} FAILED: {$result->error}\n", 500);
                    } catch (\Throwable $e) {
                        return Response::text("core.sms send FAILED: {$e->getMessage()}\n", 500);
                    }
                }

                default:
                    return Response::text("Usage: core.sms send <phone> <subject>\n", 400);
            }
        });

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
            /** @var \Laswitchtech\CoreWeb\Database\Database */
            $db = $c->resolve('database');

            // Create a temporary seed group with a harmless table mutation.
            $tmpDir  = sys_get_temp_dir() . '/core-web-seed-smoke-' . uniqid('', true);
            $groupDir = $tmpDir . '/seeds/smoke_test';
            mkdir($groupDir, 0755, true);

            // Seed filename uses YYYYMMDDHHmmss_<name>.sql format (must be valid date).
            $timestamp = date('YmdHis');
            $fileName   = "{$timestamp}_smoke.sql";
            $sqlFile    = "{$groupDir}/{$fileName}";
            $seedSql = <<<'SQL'
CREATE TABLE IF NOT EXISTS core_seed_smoke (
    id INTEGER PRIMARY KEY,
    name TEXT
);
DELETE FROM core_seed_smoke WHERE id = 1;
INSERT INTO core_seed_smoke (id, name) VALUES (1, 'seed-smoke');
SQL;
            if (file_put_contents($sqlFile, $seedSql) === false) {
                throw new \RuntimeException("Could not write temporary seed file");
            }

            // Wire a fresh Seeder pointing at the temp root.
            /** @var \Laswitchtech\CoreWeb\Database\Seeding\SeedLoader */
            $loader = new \Laswitchtech\CoreWeb\Database\Seeding\SeedLoader($tmpDir, $tmpDir);
            /** @var \Laswitchtech\CoreWeb\Database\Seeding\RegistryTable */
            $reg    = new \Laswitchtech\CoreWeb\Database\Seeding\RegistryTable($conn);
            $seeder = new \Laswitchtech\CoreWeb\Database\Seeding\Seeder($conn, $loader, $reg);

            // First run — expect one applied seed and a real database row.
            $result1 = $seeder->run('smoke_test');
            if ($result1 === [] || $result1[0]['status'] !== 'applied') {
                throw new \RuntimeException("First seed run expected 1 applied result: " . json_encode($result1));
            }

            $row = $db->select('core_seed_smoke')->where(['id' => 1])->fetch();
            if ($row === null || ($row['name'] ?? null) !== 'seed-smoke') {
                throw new \RuntimeException("Seed smoke row verification failed: " . json_encode($row));
            }

            // Second run — idempotency check: same group, expect one skipped seed.
            $result2 = $seeder->run('smoke_test');
            if ($result2 === [] || $result2[0]['status'] !== 'skipped') {
                throw new \RuntimeException("Second seed run expected 1 skipped (idempotent): " . json_encode($result2));
            }

            /* Clean up */
            $db->delete('core_seed_smoke')->where(['id' => 1])->execute();
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

    /** core.extension subcmd=disable — disable a discovered extension.         */
    private static function handleDisableSubcmd(
        mixed $req,
        \Laswitchtech\CoreWeb\Container     $c,
    ): Response {
        // 1. Parse selector → type + name + validate format.
        $selector = trim($req->arg(1) ?? '');
        if ($selector === '') {
            return Response::text("Error: selector required (type.name)\n", 400);
        }

        $parts = explode('.', $selector, 2);
        if (\count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            return Response::text("Error: invalid selector format '{$selector}' (expected type.name)\n", 400);
        }

        [$rawType, $inputName] = $parts;

        // Canonical selector format is singular only: plugin.<slug> or theme.<slug>.
        if ($rawType !== 'plugin' && $rawType !== 'theme') {
            return Response::text("Error: unknown extension type '{$rawType}' (plugin|theme)\n", 400);
        }

        // Internal helpers: state key uses plural keys; index-match uses singular.
        $typeState   = self::pluralise($rawType);   // 'plugins' / 'themes' for state file keys
        $typeForMatch = $rawType;                     // 'plugin' / 'theme' for index-entry match

        // 2. Resolve extension_index_all early (needed below for seeding and lookup).
        /** @var object */
        $index   = $c->resolve('extension_index_all');
        $found   = null;
        $lookup  = null;

        // Try normalised slug match first (canonical lookup).
        $slug = self::normaliseSlug($parts[1] ?? '');
        if ($slug !== '') {
            foreach ((array) $index as $_n => $_e) {
                if (($typeForMatch && ($_e['type'] ?? '') !== $typeForMatch)) { continue; }
                if (self::normaliseSlug($_e['slug'] ?? '') === $slug) {
                    $found  = $_e;
                    $lookup = $_n;
                    break;
                }
            }
        }

        // Fallback: treat selector name as a literal manifest name, keyed lookup.
        if (!$found && isset($index->{$parts[1] ?? ''})) {
            $candidate = $index->{$parts[1]};
            if ($typeForMatch === '' || ($candidate['type'] ?? '') === $typeForMatch) {
                $found  = $candidate;
                $lookup = $parts[1];
            }
        }

        if (!$found) {
            return Response::text("Error: Extension '{$selector}' is not installed.\n", 400);
        }

        // For existing code paths below we need 'name' to hold the manifest name.
        $name = $lookup;

        // Locked protection: extension lifecycle state (enable/disable) is blocked while locked.
        if (!empty($found['locked'])) {
            return Response::text("Error: Extension '{$selector}' is locked and cannot be enabled or disabled.\n", 400);
        }

        // ——— 4. Load lifecycle-state; create defaults from discovered index when missing. —————
        $appRoot   = $c->resolve('app_root');
        $statePath = "{$appRoot}/config/extensions.cfg";
        $legacyPath = "{$appRoot}/config/extensions.json";
        $configDir  = dirname($statePath);

        // Resolve the seed source for the state-file: use `extension_index_all` from container.
        /** @var object */
        $seedIndex = isset($index) ? $index : $c->resolve('extension_index_all');

        $needsCreate = !is_file($statePath) && !is_file($legacyPath);

        if ($needsCreate && !is_dir($configDir)) { // phpcs:ignore
            mkdir($configDir, 0755, true);         // phpcs:ignore
        }

        if (!is_file($statePath) && !is_file($legacyPath)) { // phpcs:ignore
            // Seed enabled list from every discovered extension so user overrides are not lost.
            $enabledPlugins = [];
            $enabledThemes  = [];
            foreach ((array)$seedIndex as $_n => $entry) {
                if (($entry['type'] ?? '') === 'plugin') { $enabledPlugins[] = $_n; }
                elseif (($entry['type'] ?? '') === 'theme') { $enabledThemes[]  = $_n; }
            }

            $payload  = [
                'enabled' => ['plugins' => $enabledPlugins, 'themes' => $enabledThemes],
                'pending' => [],
            ];
            file_put_contents($statePath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        // ——— 5. Load current state (read legacy if cfg absent).                  */
        $readPath   = is_file($statePath) ? $statePath : $legacyPath;
        /** @var array{enabled:array{plugins:list<string>,themes:list<string>},pending:list<array{action:string,type:string,name:string,source:string}>} */
        $state      = json_decode(file_get_contents($readPath), true) ?: [
            'enabled' => ['plugins' => [], 'themes' => []],
            'pending' => [],
        ];

        // ——— 6. Already disabled?                                              ————————
        if (!in_array($name, (array)($state['enabled'][$typeState] ?? []), true)) {
            return Response::text("Already disabled: {$selector}\n");
        }

        // ——— 7. Remove the target name from its type's enabled array.          ——————
        $e =& $state['enabled'][$typeState];
        $idx = array_search($name, $e, true);
        if ($idx !== false) {
            unset($e[$idx]);
            $e = array_values($e);
        }

        // ——— 8. Add pending event and persist to disk so the lifecycle engine    —————
        // picks it up on the next bootstrap / CLI run.
        $state['pending'][] = [
            'action' => 'disable',
            'type'   => $typeState,
            'name'   => $name,
            'source' => 'CLI',
        ];

        file_put_contents($statePath, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 9. Output confirmation.
        return Response::text("Disabled: {$selector}\nNOTE: Changes take effect on next bootstrap/CLI run.\n");
    }

    /** core.extension subcmd=status — show table of all/discovered extensions */
    private static function handleStatusSubcmd(mixed $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        /** @var object */
        $all = $c->resolve('extension_index_all');

        if (empty($all)) {
            return Response::text("No extensions discovered.\n");
        }

        // ——— Optional single-extension selector:  type.<slug>/type.<name>                  */
        $selector = trim($req->arg(1) ?? '');
        if ($selector !== '') {
            return self::showDetailForSelector($selector, $c);
        }

        // Build lookup keyed by extension name from the disabled index.
        $isDisabled = [];
        /** @var object */
        $disabled = $c->resolve('extension_index_disabled');
        foreach ((array) ($disabled ?? new \stdClass()) as $name => $entry) {
            $isDisabled[$name] = true;
        }

        // Classify every discovered extension by its own metadata.
        $enabled  = [];
        $disabledNames = [];

        foreach ((array) $all as $name => $entry) {
            $type     = $entry['type'] ?? '-';
            $selector = isset($entry['slug']) ? "{$type}.{$entry['slug']}" : "{$type}.{$name}";
            if (isset($isDisabled[$name])) {
                $disabledNames[] = [$type, $name, $selector, $entry['version'] ?? '-'];
            } else {
                $enabled[]  = [$type, $name, $selector, $entry['version'] ?? '-'];
            }
        }

        if (\count($enabled) + \count($disabledNames) === 0) {
            return Response::text("No extensions discovered.\n");
        }

        $lines = ["\n"];

        // Header (own line).
        $lines[] = sprintf('%7s  %-25s  %-30s  %-10s  %8s', 'TYPE', 'NAME', 'SELECTOR', 'VERSION', 'STATE') . "\n";

        // Separator — widths match visible column lengths exactly.
        $lines[] = str_repeat('-', 7)   . '  '
                 . str_repeat('-', 25) . '  '
                 . str_repeat('-', 30) . '  '
                 . str_repeat('-', 10) . '  '
                 . str_repeat('-', 8)    . "\n";

        // All rows (no section labels).
        foreach ($enabled as [$type, $name, $selector, $ver]) {
            $lines[] = sprintf('%7s  %-25s  %-30s  %-10s  %8s', ucfirst($type), $name, $selector, $ver, 'ENABLED') . "\n";
        }

        foreach ($disabledNames as [$type, $name, $selector, $ver]) {
            $lines[] = sprintf('%7s  %-25s  %-30s  %-10s  %8s', ucfirst($type), $name, $selector, $ver, 'DISABLED') . "\n";
        }

        return Response::text(implode('', $lines));
    }

    /** core.extension subcmd=list — list discovered extensions by type.          */
    private static function handleListSubcmd(mixed $req, \Laswitchtech\CoreWeb\Container $c): Response
    {
        /** @var object */
        $index     = $c->resolve('extension_index_all');

        if (empty($index)) {
            return Response::text("No extensions discovered.\n");
        }

        /* arg(1): optional filter — 'plugins' or 'themes'.  */
        $filterType = trim($req->arg(1) ?? '');

        if ($filterType !== '' && $filterType !== 'plugins' && $filterType !== 'themes') {
            return Response::text("Error: Unknown extension type '{$filterType}'. Use 'plugins' or 'themes'.\n", 400);
        }

        /* Look up disabled extensions so we can display lifecycle state.        */
        /** @var object */
        $disabled = $c->resolve('extension_index_disabled');
        $isDisabled = [];
        foreach ((array) ($disabled ?? new \stdClass()) as $name => $_entry) {
            $isDisabled[$name] = true;
        }

        /* Classify every discovered extension.                                   */
        $pluginRows  = [];
        $themeRows   = [];

        foreach ((array) $index as $name => $entry) {
            $type      = $entry['type'] ?? '-';
            $version   = $entry['version'] ?? '-';
            $lifecycle = isset($isDisabled[$name]) ? 'DISABLED' : 'ENABLED';
            $origin    = $entry['origin'] ?? '-';
            $compat    = $entry['kernelCompat'] ?? null;

            // Build: type_display, manifest_name, selector (type.<slug>), origin
            $selector = isset($entry['slug']) ? "{$type}.{$entry['slug']}" : "{$type}.{$name}";
            $row      = [ucfirst($type), $name, $selector, $origin];

            if ($type === 'plugin' && ($filterType === '' || $filterType === 'plugins')) {
                $pluginRows[] = $row;
            } elseif ($type === 'theme' && ($filterType === '' || $filterType === 'themes')) {
                $themeRows[]  = $row;
            }
        }

        if (\count($pluginRows) + \count($themeRows) === 0) {
            $label = $filterType !== '' ? $filterType : 'extensions';
            return Response::text("No {$label} discovered.\n");
        }

        /* ---- Build plain-text output table ---- */
        $lines = ["\n"];

        // Header (own line).
        $lines[] = sprintf('%8s  %-20s  %-21s  %-7s', 'TYPE', 'NAME', 'SELECTOR', 'ORIGIN') . "\n";

        // Separator (own line).
        $lines[] = str_repeat('-', 8)  . '  '
                  . str_repeat('-', 20) . '  '
                  . str_repeat('-', 21) . '  '
                  . str_repeat('-', 7)     . "\n";

        // Rows.
        foreach (\array_merge($pluginRows, $themeRows) as $row) {
            [$ty, $nm, $sel, $or] = $row;
            $lines[] = sprintf('%8s  %-20s  %-21s  %s', $ty, $nm, $sel, $or) . "\n";
        }

        return Response::text(implode('', $lines));
    }

    /** core.extension subcmd=enable — enable a discovered extension.           */
    private static function handleEnableSubcmd(
        mixed $req,
        \Laswitchtech\CoreWeb\Container $c,
    ): Response {
        // 1. Parse selector → type + name + validate format.
        $selector = trim($req->arg(1) ?? '');
        if ($selector === '') {
            return Response::text("Error: selector required (type.name)\n", 400);
        }

        $parts = explode('.', $selector, 2);
        if (\count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            return Response::text("Error: invalid selector format '{$selector}' (expected type.name)\n", 400);
        }

        [$rawType, $name] = $parts;

        // Canonical selector format is singular: plugin.<slug> or theme.<slug>.
        if ($rawType !== 'plugin' && $rawType !== 'theme') {
            return Response::text("Error: unknown extension type '{$rawType}' (plugin|theme)\n", 400);
        }

        // ——— Internal helpers                                              */
        $typeState    = self::pluralise($rawType);   // 'plugins' / 'themes' for state file keys
        $typeForMatch = $rawType;                     // 'plugin' / 'theme' for index-entry match

        // 2. Validate that the name part is not empty after selector parsing.
        if ($name === '') {
            return Response::text("Error: invalid selector format '{$selector}' (expected type.name)\n", 400);
        }

        // Resolve canonical lookup: slug first, then fallback to literal name.
        /** @var object */
        $index   = $c->resolve('extension_index_all');
        $found  = null;
        $lookup = null;

        // Slug-normalised match against extension metadata.
        $slug = static::normaliseSlug($name);
        if ($slug !== '') {
            foreach ((array) $index as $_n => $_e) {
                if (($typeForMatch && ($_e['type'] ?? '') !== $typeForMatch)) { continue; }
                if (static::normaliseSlug($_e['slug'] ?? '') === $slug) {
                    $found  = $_e;
                    $lookup = $_n;
                    break;
                }
            }
        }

        // Fallback: direct name-keyed lookup for backward compat.
        if (!$found && isset($index->{$name})) {
            $candidate = $index->{$name};
            if ($typeForMatch === '' || ($candidate['type'] ?? '') === $typeForMatch) {
                $found  = $candidate;
                $lookup = $name;
            }
        }

        // 3. Validate found entry and cross-check types.
        if (!$found) {
            return Response::text("Error: Extension '{$selector}' is not installed.\n", 400);
        }

        // Ensure 'name' holds the manifest name for downstream code paths.
        $name = $lookup;

        // Locked protection: extension cannot be enabled or disabled while locked.
        if (($found['locked'] ?? false) === true) {
            return Response::text("Error: Extension '{$selector}' is locked and cannot be enabled or disabled.\n", 400);
        }

        // 4. Load lifecycle-state; create from discovered index if missing.
        $appRoot = $c->resolve('app_root');
        $legacyPath = "{$appRoot}/config/extensions.json";
        $statePath   = "{$appRoot}/config/extensions.cfg";
        $configDir   = dirname($statePath);
        $needsCreate = !is_file($statePath) && !is_file($legacyPath);

        if ($needsCreate && !is_dir($configDir)) { // phpcs:ignore
            mkdir($configDir, 0755, true);         // phpcs:ignore
        }

        if (!is_file($statePath) && !is_file($legacyPath)) { // phpcs:ignore
            // Seed enabled list from every currently-discovered extension so that
            // existing user overrides are not lost when the state file did not yet exist.
            $enabledPlugins = [];
            $enabledThemes  = [];
            /** @var object */
            $allIndex = $c->resolve('extension_index_all');

            foreach ((array) $allIndex as $_n => $entry) {
                if (($entry['type'] ?? '') === 'plugin') {
                    $enabledPlugins[] = $_n;
                } elseif (($entry['type'] ?? '') === 'theme') {
                    $enabledThemes[]  = $_n;
                }
            }

            $payload  = [
                'enabled' => ['plugins' => $enabledPlugins, 'themes' => $enabledThemes],
                'pending' => [],
            ];
            file_put_contents($statePath, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        // 5. Read state (fall back to legacy .json when .cfg absent).
        $readPath = is_file($statePath) ? $statePath : $legacyPath;
        // 6. Load current state into a mutable array.
        /** @var array{enabled:array{plugins:list<string>,themes:list<string>},pending:list<array{action:string,type:string,name:string,source:string}>} */
        $state = json_decode(file_get_contents($readPath), true) ?: [
            'enabled' => ['plugins' => [], 'themes' => []],
            'pending' => [],
        ];

        // 7. Already enabled?
        if (in_array($name, (array)($state['enabled'][$typeState] ?? []), true)) {
            return Response::text("Already enabled: {$selector}\n");
        }

        // 8. Check direct depends against currently-enabled plugins + themes.
        $targetDeps    = ($found['depends'] ?? []) ?: [];

        if (\count($targetDeps) > 0) {
            $missing = [];
            foreach ($targetDeps as $depName) {
                $depInPlugins = in_array($depName, (array)($state['enabled']['plugins'] ?? []), true);
                $depInThemes  = in_array($depName, (array)($state['enabled']['themes'] ?? []), true);

                if (!$depInPlugins && !$depInThemes) {
                    $missing[] = $depName;
                }
            }

            if ($missing !== []) {
                return Response::text(sprintf("Error: '%s' depends on: %s\n", $selector, implode(', ', $missing)), 400);
            }
        }

        // 8. Add target name to enabled[type] (state file uses plural keys).
        $e =& $state['enabled'][$typeState];
        $e[] = $name;

        // 9. Append pending event and persist to disk so the lifecycle engine picks up on the next bootstrap / CLI run.
        $state['pending'][] = [
            'action' => 'enable',
            'type'   => $typeState,
            'name'   => $name,
            'source' => 'CLI',
        ];

        file_put_contents($statePath, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // 10. Output confirmation.
        return Response::text("Enabled: {$selector}\nNOTE: Changes take effect on next bootstrap/CLI run.\n");
    }

    /*     * Normalise a candidate string into a canonical extension slug.           */
    public static function normaliseSlug(string $input): string
    {
        $slug = str_replace(['/', ' ', '_'], '-', $input);  // forward-slash, space, underscore → dash
        $slug = strtolower($slug);                           // lowercase
        $slug = preg_replace('/[^a-z0-9\-]/', '', $slug);   // strip non-alphanumeric except dash
        return rtrim($slug, '-');                             // trim trailing dashes
    }

    /** Pluralise an extension type for state-file key lookup.                  */
    public static function pluralise(string $type): string
    {
        return ($type === 'plugin') ? 'plugins' : 'themes';
    }

    /* ================================================================== */

    /** Register a harmless smoke helper during the ``helper.register`` hook. */
    public static function registerSmokeHelper(array $context): void
    {
        // Idempotent guard — skip when registry is missing or not a Registry instance.
        if (! isset($context['registry']) || ! method_exists($context['registry'], 'register')) {
            return;
        }

        /** @var \Laswitchtech\CoreWeb\Helper\Registry */
        $registry = $context['registry'];

        // Register only if not already present (double-hook safety).
        if (! $registry->has('smoke')) {
            $helper = new class implements \Laswitchtech\CoreWeb\Helper\HelperInterface {
                public function name(): string { return 'smoke'; }
                public function test(): string  { return 'helper.register is working'; }
            };

            $registry->register($helper, 'plugin');
        }
    }

    /** Resolve a selector to a detail block for a single extension.              */
    private static function showDetailForSelector(string $selector, \Laswitchtech\CoreWeb\Container $c): Response
    {
        if ($selector === '') {
            return Response::text("Error: selector required (type.name)\n", 400);
        }

        $parts = explode('.', $selector, 2);
        if (\count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            return Response::text("Error: invalid selector format '{$selector}' (expected type.name)\n", 400);
        }

        [$rawType, $name] = $parts;

        if ($rawType !== 'plugin' && $rawType !== 'theme') {
            return Response::text("Error: invalid selector type '{$rawType}'. Use 'plugin' or 'theme'.\n", 400);
        }

        // Canonical selector format is always singular: plugin.<slug> or theme.<slug>.
        $typeForMatch = $rawType;
        $stateKey     = self::pluralise($rawType);

        // Resolve via slug match, fallback to literal manifest name.
        /** @var object */
        $index   = $c->resolve('extension_index_all');
        $found  = null;
        $lookup = null; // manifest name for internal lookup

        $slug = self::normaliseSlug($name);
        if ($slug !== '') {
            foreach ((array) $index as $_n => $_e) {
                if (($typeForMatch && ($_e['type'] ?? '') !== $typeForMatch)) { continue; }
                if (self::normaliseSlug($_e['slug'] ?? '') === $slug) {
                    $found  = $_e;
                    $lookup = $_n;
                    break;
                }
            }
        }

        if (!$found && isset($index->{$name})) {
            $candidate = $index->{$name};
            if ($typeForMatch === '' || ($candidate['type'] ?? '') === $typeForMatch) {
                $found  = $candidate;
                $lookup = $name;
            }
        }

        if (!$found) {
            return Response::text("Error: Extension '{$selector}' is not installed.\n", 400);
        }

        // ——— Resolve locked state from container index                              */
        $lockedStr = !empty($found['locked']) ? 'true' : 'false';

        // Determine lifecycle state for display: a disabled entry appears DISABLED,
        // otherwise ENABLED (the user may have disabled it but discovery still runs).
        $isDisabled = false;
        /** @var object $disabled */
        if (isset($found['lifecycleState'])) {
            $isDisabled = $found['lifecycleState'] !== 'enabled';
        }
        $stateStr = $isDisabled ? 'DISABLED' : 'ENABLED';

        // ——— Load description from manifest (not stored in container metadata)     */
        /** @var array{directory:string} $dirEntry */
        $dir = $found['directory'] ?? '';
        $desc = self::loadManifestDescription($dir);

        // Resolve kernel compatibility alias ("compatible"/"incompatible") to the
        // same string shown in the table column of core.version.
        $compatTableStatus = $found['compatStatus'] ?? '';
        $compatStr = match ($compatTableStatus) {
            'unconstrained' => 'Unconstrained',
            'compatible' => 'Compatible',
            'incompatible' => 'Incompatible',
            default => 'Unknown',
        };

        // Build 10-line detail output.
        $resolvedSelector = "{$typeForMatch}.{$name}";
        $lines = ["\n"];
        $rows = [
            ['Type',         (string)ucfirst($found['type'] ?? '-')],
            ['Origin',       ($found['origin'] ?? '') !== '' ? (string)ucfirst($found['origin']) : '-'],
            ['Name',         (string)$lookup],
            ['Slug',         (string)$name],
            ['Selector',     (string)$resolvedSelector],
            ['Description',  $desc],
            ['State',        $stateStr],
            ['Locked',       $lockedStr],
            ['Version',      (string)($found['version'] ?? '-') . ($isDisabled ? '  (disabled)' : '')],
            ['Compatibility', $compatStr],
        ];

        /** @var list<array{0: string, 1: string}> $rows */
        foreach ($rows as [$label, $value]) {
            $lines[] = sprintf("    %-14s %s\n", "{$label}:", $value);
        }

        return Response::text(implode('', $lines));
    }

    /** Load the description from an extension's manifest.                        */
    private static function loadManifestDescription(string $dir): string
    {
        foreach (['manifest.json', 'extension.json'] as $file) {
            $path = $dir . '/' . $file;
            if (!is_file($path)) { continue; }
            $raw = @json_decode(file_get_contents($path), true);
            if (\is_array($raw) && isset($raw['description'])) { return trim($raw['description']); }
        }
        return '-';
    }

}

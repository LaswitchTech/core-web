<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration\Driver;

use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Migration\Migration;

/**
 * Executes SQL migration files against a database connection.
 *
 * Supports dialect-specific companion files for SQLite/MySQL differences:
 *   - {version}_{slug}.sql          (base, always used)
 *   - {version}_{slug}.mysql.sql    (MySQL/MariaDB override)
 *   - {version}_{slug}.sqlite.sql   (SQLite override)
 *
 * When a companion file exists for the active driver, its up or down section
 * completely replaces the corresponding section from the base file.
 *
 * Multi-statement support: PDO::exec() does not reliably execute multiple SQL
 * statements separated by semicolons across SQLite and MySQL drivers in PHP.
 * For Phase 1 each migration must contain exactly one DDL/DML statement, or
 * zero (empty). Companion files follow the same single-statement rule.
 * If you need multiple statements, split them into separate versioned migrations.
 *
 * Documentation: docs/development/architecture/Migration/Driver/SqlMigrationDriver.md
 */
final class SqlMigrationDriver implements MigrationDriverInterface {

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    public function __construct(
        private readonly Connection $connection,
        private readonly string     $activeDriver, // 'sqlite', 'mysql', or 'mariadb'
    ) {}

    /* ------------------------------------------------------------------ */
    /*  Execution: up / down                                               */
    /* ------------------------------------------------------------------ */

    public function executeUp(Migration $migration): bool {
        $sql = $this->resolveSql($migration, 'up');
        if ($sql === '') return true; // nothing to execute

        return $this->execute($sql);
    }

    public function executeDown(Migration $migration): bool {
        // Resolve the down SQL first — companions can supply down even when base has none.
        $sql = $this->resolveSql($migration, 'down');

        if ($sql === '') {
            throw new \RuntimeException(
                "Migration {$migration->version} has no down SQL (base file plus all companions are empty)."
            );
        }

        return $this->execute($sql);
    }

    /* ------------------------------------------------------------------ */
    /*  SQL resolution: base + dialect override                            */
    /* ------------------------------------------------------------------ */

    /**
     * Resolve the up or down section for a migration.
     *
     * Priority order for each section:
     *   1. Dialect-specific companion file section (e.g., .mysql.sql up/down)
     *   2. Base file Migration::$up or Migration::$down properties (already parsed on construct)
     */
    private function resolveSql(Migration $migration, string $section): string {
        $part = strtolower($section === 'up' ? 'Up' : 'Down');

        // Build companion filename: strip .sql suffix then add .{dialect}.sql
        $baseDir  = dirname($migration->file);
        $basename = basename($migration->file);
        $dialectKey = ($this->activeDriver === 'mariadb') ? 'mysql' : $this->activeDriver;
        $companionFile = "{$baseDir}/" . preg_replace('/\.sql$/i', ".{$dialectKey}.sql", $basename);

        if (is_file($companionFile)) {
            $content = file_get_contents($companionFile);
            if ($content === false) {
                throw new \RuntimeException(
                    "Cannot read companion migration file: {$companionFile}"
                );
            }

            [$cUp, $cDown] = self::splitSections($content);
            return match ($part) {
                'up' => $cUp !== '' ? $cUp : $migration->up,
                'down' => $cDown !== '' ? $cDown : $migration->down,
            };
        }

        // No companion — use the base file's already-parsed section from Migration.
        return match ($part) {
            'up'   => $migration->up,
            'down' => $migration->down,
        };
    }

    /** Execute a single DDL/DML statement via PDO::exec(). Returns false on failure. */
    private function execute(string $sql): bool {
        // Phase 1: enforce exactly one statement per migration section.
        $trimmed = trim($sql);
        if ($trimmed !== '') {
            // Optional trailing semicolon — remove it for the content check.
            $inner = rtrim($trimmed, ';');

            // Any remaining semicolon means multiple statements — reject immediately.
            if (str_contains($inner, ';')) {
                throw new \RuntimeException(
                    "Migration SQL contains multiple statements; split them into separate migrations."
                );
            }
        }

        return $this->connection->pdo()->exec($sql) !== false;
    }

    /** Split file content at the "-- Down:" marker for companion overrides.          */
    private static function splitSections(string $content): array {
        $lines = preg_split('/\r?\n/', $content);
        $markerPos = null;

        foreach ($lines as $i => $line) {
            if (preg_match('/^\s*--\s+Down\s*:/i', $line)) {
                $markerPos = $i;
                break;
            }
        }

        if ($markerPos === null) return [$content, ''];

        $up   = trim(implode("\n", array_slice($lines, 0, $markerPos)));
        $down = trim(implode("\n", array_slice($lines, $markerPos + 1)));

        return [$up, $down];
    }
}

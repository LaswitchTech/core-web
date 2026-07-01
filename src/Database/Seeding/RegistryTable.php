<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Seeding;

use Laswitchtech\CoreWeb\Database\Connection;

/**
 * Seed application table (__schema_seeds) CRUD and DDL.
 *
 * Handles table creation, seed-applied tracking inserts/queries — driver agnostic via
 * the Connection facade. Mirrors Migration\RegistryTable structure with a separate
 * `__schema_seeds` table to keep seeding history independent of migration history.
 *
 * Documentation: docs/development/architecture/Database/Seeding/RegistryTable.md
 */
final class RegistryTable {

    /** Default name for the seed-applied tracking table. */
    public const TABLE_NAME = '__schema_seeds';

    /** DDL — dialect-aware table schema (group_name + version composite PK). */
    private const CREATE_TABLE_SQLITE = <<<'SQL'
        CREATE TABLE IF NOT EXISTS __schema_seeds (
            group_name TEXT NOT NULL,
            version    TEXT NOT NULL,
            file_path  TEXT,
            checksum   TEXT,
            applied_at INTEGER NOT NULL DEFAULT (unixepoch()),
            PRIMARY KEY (group_name, version)
        )
        SQL;

    private const CREATE_TABLE_MYSQL = <<<'SQL'
        CREATE TABLE IF NOT EXISTS __schema_seeds (
            group_name VARCHAR(255) NOT NULL,
            version    VARCHAR(255) NOT NULL,
            file_path  TEXT,
            checksum   VARCHAR(64),
            applied_at INTEGER,
            PRIMARY KEY (group_name, version)
        )
        SQL;

    private readonly string $createSql;

    public function __construct(
        private readonly Connection $connection,
    ) {
        // Choose dialect-safe DDL.
        $driver = $connection->pdo()->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'mysql') {
            $this->createSql = self::CREATE_TABLE_MYSQL . " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        } else {
            // sqlite and everything else.
            $this->createSql = self::CREATE_TABLE_SQLITE;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  DDL — table creation                                               */
    /* ------------------------------------------------------------------ */

    /** Ensure the seed-applied tracking table exists in the database. */
    public function ensureTable(): void {
        $pdo = $this->connection->pdo();
        if ($pdo->exec($this->createSql) === false) {
            throw new \RuntimeException(
                "Failed to create seed tracking table '" . self::TABLE_NAME . "': "
                    . ($pdo->errorInfo()[2] ?? 'unknown error')
            );
        }
    }

    /* ------------------------------------------------------------------ */
    /*  DML — applied-seed queries & mutations                             */
    /* ------------------------------------------------------------------ */

    /**
     * Check whether a specific seed version has already been applied (group-aware).
     */
    public function isApplied(string $group, string $version): bool {
        $table = self::TABLE_NAME;
        $sql   = "SELECT 1 FROM {$table} WHERE group_name = ? AND version = ? LIMIT 1";
        $stmt  = $this->connection->prepare($sql);
        if ($stmt === false) {
            return false;
        }

        $stmt->bindValue(1, $group, \PDO::PARAM_STR);
        $stmt->bindValue(2, $version, \PDO::PARAM_STR);
        $stmt->execute();

        $row   = $stmt->fetch();

        return $row !== false && (bool) $row[0];
    }

    /**
     * Get already-applied seed versions and their stored checksums for a specific group.
     * @return array<string, string|null> Version → checksum mapping (nullable for legacy rows).
     */
    public function getAppliedChecksums(string $group): array {
        $table = self::TABLE_NAME;
        $sql   = "SELECT version, checksum FROM {$table} WHERE group_name = ? ORDER BY version ASC";
        $stmt  = $this->connection->prepare($sql);

        if ($stmt === false) {
            return [];
        }

        $stmt->bindValue(1, $group, \PDO::PARAM_STR);
        $stmt->execute();

        $records = [];
        foreach ($stmt as $row) {
            $v = (string)($row['version'] ?? '');
            $c = $row['checksum'] ?? null;  // nullable for legacy rows (before checksum added).
            if ($v !== '') {
                $records[$v] = is_string($c) ? $c : null;
            }
        }

        return $records;
    }

    /**
     * Insert a record for a newly applied seed.
     */
    public function insert(string $group, string $version, string $filePath, string $checksum): void {
        $table = self::TABLE_NAME;
        $sql   = "INSERT INTO {$table} (group_name, version, file_path, checksum, applied_at) VALUES (?, ?, ?, ?, ?)";
        $stmt  = $this->connection->prepare($sql);
        if ($stmt === false) {
            throw new \RuntimeException(
                "Failed to prepare seed tracking insert: {$version}"
            );
        }

        $stmt->bindValue(1, $group, \PDO::PARAM_STR);
        $stmt->bindValue(2, $version, \PDO::PARAM_STR);
        $stmt->bindValue(3, $filePath, \PDO::PARAM_STR);
        $stmt->bindValue(4, $checksum, \PDO::PARAM_STR);
        $stmt->bindValue(5, time(), \PDO::PARAM_INT);

        if (!$stmt->execute()) {
            throw new \RuntimeException(
                "Failed to insert seed tracking record: {$version}. "
                . 'Check database constraints and permissions.'
            );
        }
    }
}

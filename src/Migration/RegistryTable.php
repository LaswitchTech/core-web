<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration;

use Laswitchtech\CoreWeb\Database\Connection;

/**
 * Schema version table (__schema_migrations) CRUD and DDL.
 *
 * Handles table creation, version tracking inserts/queries, checksum storage,
 * and batch management — driver agnostic via the Connection facade.
 *
 * Documentation: docs/development/architecture/Migration/RegistryTable.md
 */
final class RegistryTable {

    /** Default name for the schema migration tracking table. */
    public const TABLE_NAME = '__schema_migrations';

    /** DDL — dialect-aware table schema. */
    private const CREATE_TABLE_SQLITE = <<<'SQL'
        CREATE TABLE IF NOT EXISTS __schema_migrations (
            version   TEXT PRIMARY KEY,
            applied   INTEGER NOT NULL DEFAULT 0,
            checksum  TEXT,
            batch     INTEGER NOT NULL DEFAULT 0
        )
        SQL;

    private const CREATE_TABLE_MYSQL = <<<'SQL'
        CREATE TABLE IF NOT EXISTS __schema_migrations (
            version   VARCHAR(255) PRIMARY KEY,
            applied   INTEGER NOT NULL DEFAULT 0,
            checksum  VARCHAR(64),
            batch     INTEGER NOT NULL DEFAULT 0
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

    /** Ensure the schema version table exists in the database. */
    public function ensureTable(): void {
        $pdo = $this->connection->pdo();
        if ($pdo->exec($this->createSql) === false) {
            throw new \RuntimeException(
                "Failed to create migration tracking table '" . self::TABLE_NAME . "': "
                    . ($pdo->errorInfo()[2] ?? 'unknown error')
            );
        }
    }

    /* ------------------------------------------------------------------ */
    /*  DML — version queries & mutations                                   */
    /* ------------------------------------------------------------------ */

    /**
     * Get all version keys for migrations that are already applied.
     * @return list<string> Sorted ascending.
     */
    public function getAppliedVersions(): array {
        $table = self::TABLE_NAME;
        $sql = "SELECT version FROM {$table} ORDER BY batch ASC, version ASC";
        $stmt = $this->connection->query($sql);
        if ($stmt === false) {
            return [];
        }

        $versions = [];
        foreach ($stmt as $row) {
            $version = $row['version'] ?? '';
            if ($version !== '') {
                $versions[] = $version;
            }
        }
        return $versions;
    }

    /**
     * Get the latest batch number currently stored, or 0 if no migrations applied.
     */
    public function latestBatch(): int {
        $table = self::TABLE_NAME;
        $sql   = "SELECT COALESCE(MAX(batch), 0) AS mx FROM {$table}";
        $row   = $this->connection->query($sql);

        if ($row === false) {
            return 0;
        }

        // $row is a PDOStatement for SELECT — fetch the column.
        $value = $row->fetchColumn(0);
        if ($value === false || $value === null) {
            return 0;
        }

        return (int)$value;
    }

    /**
     * Insert a record for a newly applied migration.
     */
    public function insert(string $version, int $applied, string $checksum, int $batch): void {
        $table = self::TABLE_NAME;
        $sql = "INSERT INTO {$table} (version, applied, checksum, batch) VALUES (?, ?, ?, ?)";
        $stmt = $this->connection->prepare($sql);
        if ($stmt === false) {
            throw new \RuntimeException(
                "Failed to prepare migration tracking insert: {$version}"
            );
        }

        $stmt->bindValue(1, $version, \PDO::PARAM_STR);
        $stmt->bindValue(2, (int) $applied, \PDO::PARAM_INT);
        $stmt->bindValue(3, $checksum, \PDO::PARAM_STR);
        $stmt->bindValue(4, (int) $batch, \PDO::PARAM_INT);

        if (!$stmt->execute()) {
            throw new \RuntimeException(
                "Failed to insert migration tracking record: {$version}. "
                . 'Check database constraints and permissions.'
            );
        }
    }

    /**
     * Check whether a specific version has already been applied.
     */
    public function isApplied(string $version): bool {
        $table = self::TABLE_NAME;
        $sql   = "SELECT 1 FROM {$table} WHERE version = ? LIMIT 1";
        $stmt  = $this->connection->prepare($sql);
        if ($stmt === false) {
            return false;
        }

        $stmt->bindValue(1, $version, \PDO::PARAM_STR);
        $stmt->execute();
        $row   = $stmt->fetch();

        return $row !== false && (bool) $row[0];
    }

    /**
     * Get the checksum stored for a specific version (returns '' if not found).
     */
    public function getChecksum(string $version): string {
        $table = self::TABLE_NAME;
        $sql   = "SELECT checksum FROM {$table} WHERE version = ? LIMIT 1";
        $stmt  = $this->connection->prepare($sql);
        if ($stmt === false) {
            return '';
        }

        $stmt->bindValue(1, $version, \PDO::PARAM_STR);
        $stmt->execute();
        $row   = $stmt->fetch();

        return $row !== false ? ((string)($row['checksum'] ?? '')) : '';
    }

    /**
     * Delete a tracking record for a given version.
     * Used when rolling back a previously applied migration.
     */
    public function delete(string $version): void {
        $table = self::TABLE_NAME;
        $sql   = "DELETE FROM {$table} WHERE version = ?";
        $stmt  = $this->connection->prepare($sql);
        if ($stmt === false) {
            throw new \RuntimeException(
                "Failed to prepare migration tracking delete: {$version}"
            );
        }

        $stmt->bindValue(1, $version, \PDO::PARAM_STR);
        if (!$stmt->execute()) {
            throw new \RuntimeException(
                "Failed to delete migration tracking record: {$version}."
            );
        }
    }

    /**
     * Get all applied versions with their stored checksums.
     * @return array<string, string> version => checksum (empty string = no checksum stored).
     */
    public function getAppliedVersionsWithChecksum(): array {
        $table = self::TABLE_NAME;
        $sql = "SELECT version, checksum FROM {$table} ORDER BY version ASC";
        $stmt = $this->connection->query($sql);
        if ($stmt === false) {
            return [];
        }

        $result = [];
        foreach ($stmt as $row) {
            $v = (string)($row['version'] ?? '');
            if ($v !== '') {
                $result[$v] = (string)($row['checksum'] ?? '');
            }
        }
        return $result;
    }

    /**
     * Get all tracking rows including down-available count for a list of version keys.
     *
     * @return array<string, array{applied:int, checksum:string}> keyed by version.
     */
    public function queryVersionDetails(array $versions): array {
        if (empty($versions)) {
            return [];
        }

        // Build parameter placeholders: ?,?,? for up to 100 at a time; split if more.
        $placeholders = implode(',', array_fill(0, count($versions), '?'));
        $table = self::TABLE_NAME;
        $sql = "SELECT version, applied, checksum FROM {$table} WHERE version IN ({$placeholders})";

        $results = [];
        $stmt    = $this->connection->prepare($sql);
        if ($stmt === false) {
            return [];
        }

        foreach ($versions as $i => $version) {
            $stmt->bindValue($i + 1, $version, \PDO::PARAM_STR);
        }

        if (!$stmt->execute()) {
            return [];
        }

        foreach ($stmt as $row) {
            $v = (string)($row['version'] ?? '');
            if ($v !== '') {
                $results[$v] = [
                    'applied'  => (int) ($row['applied'] ?? 0),
                    'checksum' => (string) ($row['checksum'] ?? ''),
                ];
            }
        }

        return $results;
    }

    /* ------------------------------------------------------------------ */
    /*  DDL cleanup — schema table destruction                             */
    /* ------------------------------------------------------------------ */

    /**
     * Drop the migration tracking table entirely.
     *
     * WARNING: Destroys all migration history. Use only during reset / teardown tests.
     */
    public function dropTable(): void {
        $table = self::TABLE_NAME;
        $sql   = "DROP TABLE IF EXISTS {$table}";
        if ($this->connection->pdo()->exec($sql) === false) {
            $pdo = $this->connection->pdo();
            throw new \RuntimeException(
                "Failed to drop migration tracking table '{$table}': "
                    . ($pdo->errorInfo()[2] ?? 'unknown error')
            );
        }
    }
}

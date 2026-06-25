<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration;

use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Migration\Driver\SqlMigrationDriver;
use Laswitchtech\CoreWeb\Migration\Promoter\MigrationPromoterInterface;

/**
 * Orchestrates the full migration workflow across all promoters.
 *
 * Responsibilities:
 * - Merge discovered migrations from multiple sources (core, app, extensions)
 * - Deduplicate by version (highest-priority promoter wins)
 * - Execute up or down in deterministic order with per-migration transactions
 * - Update __schema_migrations registry inside each successful migration transaction
 *
 * Documentation: docs/development/architecture/Migration/Runner.md
 */
final class Runner {

    private readonly RegistryTable $registry;
    private readonly SqlMigrationDriver $driver;
    private readonly Connection $connection;

    /**
     * @param list<MigrationPromoterInterface> $promoters Ordered by priority (lowest first).
     */
    public function __construct(
        array                   $promoters,
        Connection              $connection,
        string                  $activeDriver, // 'sqlite', 'mysql', or 'mariadb'
        RegistryTable|null      $registry = null,
    ) {
        $this->registry   = $registry !== null
            ? $registry
            : new RegistryTable($connection);
        $this->driver     = new SqlMigrationDriver($connection, $activeDriver);
        $this->connection = $connection;

        // Verify promoters are sorted by priority ascending.
        $expected = 0;
        foreach ($promoters as $promoter) {
            if ($promoter->priority() !== $expected++) {
                throw new \InvalidArgumentException(
                    'Promoters must be provided in priority-sorted order. Got priority ' . $promoter->priority() . ', expected ' . ($expected - 1) . '.'
                );
            }
        }

        $this->promoters = $promoters;
    }

    /** @var list<MigrationPromoterInterface> */
    private readonly array $promoters;

    /* ------------------------------------------------------------------ */
    /*  Public API — run / rollback                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Run pending (not yet applied) up migrations.
     *
     * @return list<string> Versions successfully applied.
     * @throws \RuntimeException On first-fail in a migration (no global transaction).
     */
    public function run(): array {
        // Ensure schema table exists before querying applied versions.
        $this->registry->ensureTable();

        $promised = $this->discoverPending();  // already deduplicated + sorted asc by version

        if (empty($promised)) {
            return []; // nothing to do
        }

        $appliedVersions   = [];
        $batchNumber       = $this->registry->latestBatch() + 1;

        foreach ($promised as $migration) {
            $version = $migration->version;

            // Per-migration transaction: begin + execute up SQL.
            $this->connection->beginTransaction();

            try {
                if (!$this->driver->executeUp($migration)) {
                    throw new \RuntimeException(
                        "Migration {$version} failed to execute up migration."
                    );
                }

                // Insert tracking record INSIDE the transaction (before commit).
                $this->registry->insert(
                    $version,
                    time(),
                    $migration->checksum,
                    $batchNumber
                );

                $this->connection->commit();

                $appliedVersions[] = $version;
            } catch (\Throwable $e) {
                // Only rollback if a transaction was active.
                try {
                    $this->connection->rollBack();
                } catch (\Throwable $_) {
                    // Already rolled back or no transaction — ignore.
                }

                throw new \RuntimeException(
                    "Migration {$version} failed (" . $e->getMessage() . "). "
                        . "No global rollback applied; previously applied migrations remain intact.",
                    previous: $e
                );
            }
        }

        return $appliedVersions;
    }

    /**
     * Rollback the most recent batch of migrations.
     *
     * Executes down SQL for every migration in the target batch, in reverse
     * application order, with per-migration transactions just like run().
     *
     * @param int $count Number of batches to rollback (1 = most recent). Default: 1.
     * @return list<string> Versions successfully rolled back.
     * @throws \RuntimeException On first-fail in a migration or no batches to roll back.
     */
    public function rollback(int $count = 1): array {
        if ($count < 1) {
            throw new \InvalidArgumentException("Rollback count must be >= 1.");
        }

        // Ensure schema table exists before querying.
        $this->registry->ensureTable();

        // Get ALL applied versions with their batch numbers via a full query.
        $rows = $this->getBatchInfo(); // list of ['version' => string, 'batch' => int]

        if (empty($rows)) {
            throw new \RuntimeException("No migration history found; nothing to roll back.");
        }

        // Identify distinct batch numbers for rollback.
        /** @var array<int> $allBatches */
        $allBatches = [];
        foreach ($rows as $row) {
            $allBatches[] = (int)$row['batch'];
        }
        sort($allBatches, SORT_NUMERIC);
        $allBatches = array_values(array_unique($allBatches));

        // Roll back the last $count batches (most recent first).
        $toRollback = [];
        $startIndex = max(0, count($allBatches) - $count);
        for ($i = count($allBatches) - 1; $i >= $startIndex; $i--) {
            $toRollback[] = $allBatches[$i];
        }

        // Collect all versions belonging to target batches.
        /** @var array<int, list<string>> $batchVersions indexed ascending batch */
        $batchVersions = [];
        foreach ($rows as $row) {
            $b = (int)$row['batch'];
            if (in_array($b, $toRollback, true)) {
                $batchVersions[$b][] = $row['version'];
            }
        }

        if (empty($batchVersions)) {
            throw new \RuntimeException("No migrations found in the selected batch(es) to roll back.");
        }

        // We need the actual migration objects — resolve them by scanning promoters.
        $allDiscovered = []; // version => Migration
        foreach ($this->promoters as $promoter) {
            foreach ($promoter->discover() as $migration) {
                if (!isset($allDiscovered[$migration->version])) {
                    $allDiscovered[$migration->version] = $migration;
                }
            }
        }

        // Build rollback queue: batches ascending → within each batch newest-first (descending version).
        /** @var list<Migration> $rollbackQueue */
        $rollbackQueue = [];
        
        foreach ($toRollback as $batchNum) {
            if (!isset($batchVersions[$batchNum]) || empty($batchVersions[$batchNum])) {
                continue;
            }
            // Sort descending so newest version is rolled back first within each batch.
            rsort($batchVersions[$batchNum]);

            foreach ($batchVersions[$batchNum] as $version) {
                if (!isset($allDiscovered[$version])) {
                    throw new \RuntimeException(
                        "Migration for applied version {$version} not found on disk — cannot rollback."
                    );
                }
                $rollbackQueue[] = $allDiscovered[$version];
            }
        }

        if (empty($rollbackQueue)) {
            throw new \RuntimeException("No migrations found in the selected batch(es) to roll back.");
        }

        $rolledBack   = [];
        
        foreach ($rollbackQueue as $migration) {
            $version = $migration->version;

            // Per-migration transaction: begin.
            $this->connection->beginTransaction();

            try {
                // 1. Execute down SQL via driver (uses Migration::$down or companion).
                if (!$this->driver->executeDown($migration)) {
                    throw new \RuntimeException(
                        "Migration {$version} failed to execute down migration."
                    );
                }

                // 2. Delete tracking record BEFORE commit so rollback leaves no residue.
                $this->registry->delete($version);

                // 3. Commit per-migration transaction.
                $this->connection->commit();

                $rolledBack[] = $version;
            } catch (\Throwable $e) {
                // Only rollback if a transaction was active.
                try {
                    $this->connection->rollBack();
                } catch (\Throwable $_) {
                    // Already rolled back or no transaction — ignore.
                }

                throw new \RuntimeException(
                    "Rollback of migration {$version} failed (" . $e->getMessage() . "). "
                        . "Previously rolled-back migrations remain intact.",
                    previous: $e
                );
            }
        }

        return $rolledBack;
    }

    /* ------------------------------------------------------------------ */
    /*  Discovery & deduplication                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Discover all pending (not yet applied) migrations across all promoters.
     * Duplicates resolved: highest-priority promoter wins (lowest priority number first in array).
     * Sorts final list by version ascending for deterministic execution order.
     *
     * @return list<Migration>
     */
    private function discoverPending(): array {
        $deduplicated = [];

        foreach ($this->promoters as $promoter) {
            $migrations = $promoter->discover();

            foreach ($migrations as $migration) {
                $version = $migration->version;

                // Deduplication: higher-priority promoter (lower index in sorted array) wins.
                if (isset($deduplicated[$version])) {
                    continue;
                }

                // Skip if already applied: check stored checksum to detect tampered files.
                $storedChecksum = $this->registry->getChecksum($version);
                if ($storedChecksum !== '') {
                    if ($storedChecksum === $migration->checksum) {
                        continue; // unchanged — already applied
                    }
                    // Checksum mismatch: warn and skip (do not re-apply).
                    fwrite(STDERR, "[migration] Warning: version {$version} checksum changed. Skipping.\n");
                    continue;
                }

                $deduplicated[$version] = $migration;
            }
        }

        usort($deduplicated, static fn (Migration $a, Migration $b): int => strcmp($a->version, $b->version));

        return array_values($deduplicated);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Fetch all tracking rows with version and batch info.
     * @return list<array{version:string, batch:int}>
     */
    private function getBatchInfo(): array {
        $table = RegistryTable::TABLE_NAME;
        $sql   = "SELECT version, batch FROM {$table} ORDER BY batch ASC, version ASC";
        $stmt = $this->connection->query($sql);

        if ($stmt === false) {
            return [];
        }

        $result = [];
        foreach ($stmt as $row) {
            $result[] = [
                'version' => (string)($row['version'] ?? ''),
                'batch'   => (int)($row['batch'] ?? 0),
            ];
        }
        return $result;
    }
}

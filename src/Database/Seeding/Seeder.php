<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Seeding;

use Laswitchtech\CoreWeb\Database\Connection;

/**
 * Application-level seed orchestrator — dependency-injected skeleton.
 *
 * Responsibilities for the seeding lifecycle:
 *   - Resolve seeds (via ``SeedLoader``) for a given group or all groups.
 *   - Sort deduplicated seeds ascending by version; then within same version alphabetically by name.
 *   - Query ``RegistryTable`` to determine which seeds are already applied.
 *   - Execute SQL per seed inside a transaction, then mark applied in the registry.
 *
 * Documentation: docs/development/architecture/Database/Seeding/Seeder.md
 */
final class Seeder {

    /* ------------------------------------------------------------------ */
    /*  Dependencies                                                       */
    /* ------------------------------------------------------------------ */

    public function __construct(

        /** Database connection for future SQL execution. */
        private readonly Connection $connection,

        /** Seed file loader — provides raw seed objects from disk discovery. */
        private readonly SeedLoader $loader,

        /** Seed application tracking table DDL/DML facade. */
        private readonly RegistryTable $registry,
    ) {
    }

    /* ------------------------------------------------------------------ */
    /*  Orchestration                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Run a seed group ensuring idempotency.
     *
     * Steps executed in order:
     *   1. Ensure the seed registry table exists (DDL).
     *   2. Load seeds for the requested group via ``SeedLoader``.
     *   3. Collect already-applied versions + checksums from the registry.
     *   4. Sort deduplicated seed list ascending by version, then alphabetically by name.
     *   5. For each unapplied seed: read SQL → execute inside a transaction → insert into ``__schema_seeds`` table.
     *   6. Return a list of applied-seed info (version + name).
     *
     * @param string|null $group Discovery group to run; null = all groups.
     * @return array<int, array{status: 'applied'|'skipped', group: string, version: string, name: string}> Result list grouped by status.
     */
    public function run(?string $group = 'default'): array {

        // 1. ── Ensure registry table exists (DDL) ─────────────────────────
        $this->registry->ensureTable();

        // 2. ── Load seed candidates for the requested group ──
        if ($group === null) {
            $results = [];
            foreach ($this->loader->allGroups() as $seedGroup) {
                foreach ($this->run($seedGroup) as $row) {
                    $results[] = $row;
                }
            }
            return $results;
        }

        $seeds = $this->loader->load((string) $group);

        if ($seeds === []) {
            return [];
        }

        // 3. ── Collect already-applied versions + checksums from registry ──
        /** @var array<string, string|null> $checksums */
        $checksums            = $this->registry->getAppliedChecksums((string) $group);
        $appliedChecksums   = [];
        foreach ($checksums as $ver => $cksum) {
            $appliedChecksums["{$group}/{$ver}"] = $cksum;
        }

        // 4. ── Sort deduplicated seed list ascending by version, then name ─
        usort(
            $seeds,
            static function (Seed $a, Seed $b): int {
                if ($a->version < $b->version) return -1;
                if ($a->version > $b->version) return 1;
                if ($a->name < $b->name) return -1;
                if ($a->name > $b->name) return 1;
                return 0;
            },
        );

        // 5. ── Process each seed (skip applied, execute unapplied in TXN) ─
        /** @var list<array{status: string, group: string, version: string, name: string}> $results */
        $results   = [];

        foreach ($seeds as $seed) {

            // Already applied — skip silently (idempotency).
            $compositeKey = "{$seed->group}/{$seed->version}";
            if (array_key_exists($compositeKey, $appliedChecksums)) {
                // Tampered-file check: if version exists, verify checksum matches.
                if ($appliedChecksums[$compositeKey] !== null && $appliedChecksums[$compositeKey] !== $seed->checksum) {
                    throw new \RuntimeException(
                        "Seed '{$seed->filename()}' (v{$seed->version}) was applied with a different checksum.\n"
                        . 'Please review or remove the seed file.'
                    );
                }
                // Version exists and has matching checksum (or no stored checksum).
                $results[] = [
                    'status'  => 'skipped',
                    'group'   => $seed->group,
                    'version' => $seed->version,
                    'name'    => $seed->name,
                ];
                continue;
            }

            // Unapplied — read SQL and execute.
            $sql = file_get_contents($seed->path);
            if ($sql === false) {
                throw new \RuntimeException("Cannot read seed file: {$seed->path}");
            }

            // Execute inside a transaction to guarantee rollback on error.
            $this->connection->transaction(function (Connection $cx) use ($sql, $seed): void {
                if ($cx->pdo()->exec($sql) === false) {
                    throw new \RuntimeException(
                        "Failed to execute seed '{$seed->filename()}': " . ($cx->pdo()->errorInfo()[2] ?? 'unknown')
                    );
                }
            });

            // Record application in __schema_seeds (group-aware identity: group + version).
            $this->registry->insert($seed->group, $seed->version, $seed->path, $seed->checksum);

            $results[] = [
                'status'  => 'applied',
                'group'   => $seed->group,
                'version' => $seed->version,
                'name'    => $seed->name,
            ];
        }

        return $results;
    }
}

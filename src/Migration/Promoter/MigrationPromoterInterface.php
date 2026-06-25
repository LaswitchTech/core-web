<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration\Promoter;

use Laswitchtech\CoreWeb\Migration\Migration;

/**
 * Contract for discovering and returning candidate migration files from a source directory.
 *
 * Documentation: docs/development/architecture/Migration/Promoter.md
 */
interface MigrationPromoterInterface {

    /** Priority rank (lower = higher priority in execution order). */
    public function priority(): int;

    /** Returns the base directory that this promoter scans. */
    public function migrationDirectory(): string;

    /**
     * Discover all .sql migration files, returning an array of Migration objects.
     * @return list<Migration> Sorted by version ascending (deterministic).
     */
    public function discover(): array;
}

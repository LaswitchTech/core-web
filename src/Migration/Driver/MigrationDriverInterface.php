<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration\Driver;

use Laswitchtech\CoreWeb\Migration\Migration;

/**
 * Contract for executing SQL migration files against a database connection.
 *
 * Documentation: docs/development/architecture/Migration/Driver/SqlMigrationDriver.md
 */
interface MigrationDriverInterface {

    /**
     * Execute the up (forward) section of a migration.
     */
    public function executeUp(Migration $migration): bool;

    /**
     * Execute the down (rollback) section of a migration.
     *
     * @throws \RuntimeException When the migration has no down section available.
     */
    public function executeDown(Migration $migration): bool;
}

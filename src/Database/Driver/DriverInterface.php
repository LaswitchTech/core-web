<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Driver;

use Laswitchtech\CoreWeb\Database\Connection;

/**
 * Common contract for database drivers.
 *
 * Documentation: docs/development/architecture/Database/Driver/DriverInterface.md
 */
interface DriverInterface {

    /** Create a Connection using the provided configuration array. */
    public function connect(array $config): Connection;

}

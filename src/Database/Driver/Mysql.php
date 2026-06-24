<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Driver;

use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Database\Error\DatabaseException;
use PDO;
use PDOException;

/**
 * MySQL/MariaDB driver — creates a PDO-backed Connection for MySQL/MariaDB servers.
 *
 * Documentation: docs/development/architecture/Database/Driver/Mysql.md
 */
final class Mysql implements DriverInterface {

    /* ------------------------------------------------------------------ */
    /*  Connection factory                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * Create a PDO-backed Connection for MySQL/MariaDB.
     *
     * Configuration keys (all optional with defaults):
     *   host       — default '127.0.0.1'
     *   port       — default 3306
     *   database   — required unless DSN is provided, default ''
     *   charset    — default 'utf8mb4'
     *   username   — default ''
     *   password   — default ''
     *   dsn        — if non-empty string, used verbatim as the PDO DSN
     */
    public function connect(array $config): Connection {

        /* --- extension check --------------------------------------------------- */

        if (!\extension_loaded('pdo_mysql')) {
            throw new DatabaseException(
                'The PDO MySQL extension (pdo_mysql) is not loaded.'
            );
        }

        /* --- config extraction ------------------------------------------------- */

        $host     = $config['host'] ?? '127.0.0.1';
        $port     = (int) ($config['port'] ?? 3306);
        $database = $config['database'] ?? '';
        $charset  = $config['charset'] ?? 'utf8mb4';
        $username = $config['username'] ?? '';
        $password = $config['password'] ?? '';

        /* --- DSN resolution ---------------------------------------------------- */

        if (isset($config['dsn'])) {
            // DSN key explicitly provided.
            if ($config['dsn'] === '') {
                throw new DatabaseException('MySQL DSN must not be empty.');
            }
            $dsn = (string) $config['dsn'];
        } else {
            // No DSN provided — database name is required.
            if ($database === '') {
                throw new DatabaseException(
                    'MySQL database name must not be empty unless a DSN is provided.'
                );
            }
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";
        }

        /* --- PDO construction -------------------------------------------------- */

        try {
            $pdo = new PDO(
                $dsn,
                $username !== '' ? $username : null,
                $password !== '' ? $password : null,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_PERSISTENT         => false,
                ]
            );
        } catch (PDOException $e) {
            throw new DatabaseException(
                "PDO MySQL connection failed: {$e->getMessage()}",
                0,
                $e
            );
        }

        return new Connection($pdo);
    }
}

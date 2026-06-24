<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database;

use PDO;
use PDOStatement;

/**
 * Thin wrapper around PDO providing typed convenience methods.
 *
 * Documentation: docs/development/architecture/Database/Connection.md
 */
final class Connection {

    /** @var PDO The underlying PDO instance (nullable after close). */
    private ?PDO $pdo = null;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

    /** Return the underlying PDO instance for raw access when needed.     */
    public function pdo(): PDO {
        return $this->pdo;
    }

    /* ------------------------------------------------------------------ */
    /*  Query helpers (thin pass-throughs to native PDO)                   */
    /* ------------------------------------------------------------------ */

    /** Execute a query and return the statement result, or false on failure. */
    public function query(string $sql): PDOStatement|false {
        return $this->pdo->query($sql);
    }

    /** Prepare a statement for execution with native PDO parameters.      */
    public function prepare(string $sql): PDOStatement|false {
        return $this->pdo->prepare($sql);
    }

    /* ------------------------------------------------------------------ */
    /*  Transaction helpers                                                */
    /* ------------------------------------------------------------------ */

    /** Begin a database transaction. Returns true on success.             */
    public function beginTransaction(): bool {
        return $this->pdo->beginTransaction();
    }

    /** Commit the current transaction. Returns true on success.           */
    public function commit(): bool {
        return $this->pdo->commit();
    }

    /** Roll back the current transaction. Returns true on success.        */
    public function rollback(): bool {
        return $this->pdo->rollBack();
    }

    /* ------------------------------------------------------------------ */
    /*  Metadata                                                           */
    /* ------------------------------------------------------------------ */

    /** Return the ID of the last inserted row.                            */
    public function lastInsertId(?string $name = null): string|false {
        return $this->pdo->lastInsertId($name); // @phpstan-ignore argument.type
    }

}

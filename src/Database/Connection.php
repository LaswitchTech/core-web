<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database;

use PDO;
use PDOStatement;
use RuntimeException;
use Throwable;

/**
 * Thin wrapper around PDO providing typed convenience methods.
 *
 * Documentation: docs/development/architecture/Database/Connection.md
 */
final class Connection {

    /** @var PDO The underlying PDO instance (always set by the constructor). */
    private PDO $pdo;

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

    /** Return whether the connection is currently inside a transaction.    */
    public function inTransaction(): bool {
        return $this->pdo->inTransaction();
    }

    /**
     * Execute a callback inside a transaction.
     *
     * Nested transactions (calls while already inside a transaction) throw
     * ``RuntimeException``.  Savepoints are not supported.
     *
     * @param callable(self):mixed $callback receives this connection as argument.
     * @return mixed The callback's return value on success.
     * @throws RuntimeException  When called inside an existing transaction.
     * @throws Throwable         Re-thrown after rollback (transaction is guaranteed clean).
     */
    public function transaction(callable $callback): mixed {
        if ($this->pdo->inTransaction()) {
            throw new RuntimeException('Nested database transactions are not supported.');
        }

        try {
            if (!$this->beginTransaction()) {
                throw new RuntimeException('Failed to begin database transaction.');
            }
            $result = $callback($this);
            if (!$this->commit()) {
                throw new RuntimeException('Failed to commit database transaction.');
            }
            return $result;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->rollback();
            }
            throw $e;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Metadata                                                           */
    /* ------------------------------------------------------------------ */

    /** Return the ID of the last inserted row.                            */
    public function lastInsertId(?string $name = null): string|false {
        return $this->pdo->lastInsertId($name); // @phpstan-ignore argument.type
    }

}

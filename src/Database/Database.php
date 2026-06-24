<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database;

use PDO;
use PDOStatement;
use Laswitchtech\CoreWeb\Database\Query\Builder;
use Laswitchtech\CoreWeb\Database\Query\CompilerInterface;

/**
 * Database facade / public entry point for the database subsystem.
 *
 * Wraps a ``Connection`` (thin PDO wrapper) and a selected ``CompilerInterface``
 * (dialect-specific SQL generator), exposing both raw query execution and the
 * fluent SELECT builder with built-in compilation + prepared-statement execution.
 *
 * ```php
 * $db->select('users')
 *    ->where(['id' => 1])
 *    ->fetch();                 // ?array — first row or null
 *    ->all();                  // list<array> — every row
 * ```
 *
 * Documentation: docs/development/architecture/Database/Database.md
 */
final class Database {

    /** @var Connection The wrapped connection (always set by the constructor). */
    private readonly Connection $connection;

    /** @var CompilerInterface The SQL dialect compiler for this database. */
    private readonly CompilerInterface $compiler;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a new Database facade wrapping the supplied connection and compiler.
     *
     * Called during bootstrap as a lazy singleton:
     *   ``new Database($container->resolve('db_connection'), $compiler)``
     *
     * @param Connection        $connection thin PDO wrapper — never null.
     * @param CompilerInterface $compiler SQL dialect compiler — never null.
     */
    public function __construct(Connection $connection, CompilerInterface $compiler) {
        $this->connection = $connection;
        $this->compiler   = $compiler;
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

    /** Return the underlying PDO instance for raw access when needed.      */
    public function pdo(): PDO {
        return $this->connection->pdo();
    }

    /* ------------------------------------------------------------------ */
    /*  Query helpers (thin pass-throughs to Connection / native PDO)     */
    /* ------------------------------------------------------------------ */

    /** Execute a query and return the statement result, or false on failure. */
    public function query(string $sql): PDOStatement|false {
        return $this->connection->query($sql);
    }

    /** Prepare a statement for execution with native PDO parameters.      */
    public function prepare(string $sql): PDOStatement|false {
        return $this->connection->prepare($sql);
    }

    /* ------------------------------------------------------------------ */
    /*  Fluent query builder                                               */
    /* ------------------------------------------------------------------ */

    /**
     * Start a fluent SELECT query against the given table.
     *
     * Each call creates a fresh ``Builder`` instance so that calling code can
     * chain methods independently without mutating shared state.
     *
     * ```php
     * $db->select('users')
     *    ->where(['id' => 1])
     *    ->fetch();
     * ```
     *
     * @param string          $table   table to query.
     * @param non-empty-list<string> $columns column names; defaults to ['*'].
     * @return Builder                 a fresh builder for the given target.
     */
    public function select(string $table, array $columns = ['*']): Builder {
        return new Builder($this->connection, $this->compiler, $table, $columns);
    }

}

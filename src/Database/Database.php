<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database;

use PDO;
use PDOStatement;
use Laswitchtech\CoreWeb\Database\Query\Builder;
use Laswitchtech\CoreWeb\Database\Query\CompilerInterface;
use Laswitchtech\CoreWeb\Database\Query\InsertBuilder;
use Laswitchtech\CoreWeb\Database\Query\DeleteBuilder;
use Laswitchtech\CoreWeb\Database\Query\UpdateBuilder;

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

    /** Return whether the wrapped connection is inside a transaction.       */
    public function inTransaction(): bool {
        return $this->connection->inTransaction();
    }

    /**
     * Execute a callback inside a database transaction.
     *
     * The callback receives the ``Database`` facade as its argument, not the raw
     * ``Connection``, so callers always work with the same fluent API they expect.
     *
     * ```php
     * $db->transaction(function ($db) {
     *     $db->update('users', ['name' => 'Bob'])->where(['id' => 1])->execute();
     * });
     * ```
     *
     * @param callable(self):mixed $callback receives this Database facade.
     * @return mixed The callback's return value on success.
     * @throws RuntimeException When called inside an existing transaction.
     * @throws Throwable  Re-thrown after rollback (transaction is guaranteed clean).
     */
    public function transaction(callable $callback): mixed {
        return $this->connection->transaction(function () use ($callback) {
            return $callback($this);
        });
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

    /**
     * Start a fluent INSERT query against the given table.
     *
     * Each call creates a fresh ``InsertBuilder`` instance so that calling code can
     * chain ``execute()`` independently without mutating shared state.
     *
     * ```php
     * $db->insert('users', ['name' => 'Alice'])
     *    ->execute();              // int — rows affected
     * ```
     *
     * @param string           $table  table to insert into (non-empty).
     * @param array<string, mixed> $data column-value pairs (non-empty, keys must be non-empty strings).
     * @return InsertBuilder           a fresh builder for the given target.
     */
    public function insert(string $table, array $data): InsertBuilder {
        return new InsertBuilder($this->connection, $this->compiler, $table, $data);
    }

    /** Start a fluent UPDATE query against the given table.
     *
     * Each call creates a fresh ``UpdateBuilder`` instance so that calling code can
     * chain ``where()`` and ``execute()`` independently without mutating shared state.
     *
     * ```php
     * $db->update('users', ['name' => 'Bob'])
     *    ->where(['id' => 1])
     *    ->execute();              // int — rows affected
     * ```
     *
     * @param string          $table  table to update (non-empty).
     * @param array<string, mixed> $data column-value pairs (non-empty, keys must be non-empty strings).
     * @return UpdateBuilder           a fresh builder for the given target.
     */
    public function update(string $table, array $data): UpdateBuilder {
        return new UpdateBuilder($this->connection, $this->compiler, $table, $data);
    }

    /**
     * Start a fluent DELETE query against the given table.
     *
     * Each call creates a fresh ``DeleteBuilder`` instance so that calling code can
     * chain ``where()`` and ``execute()`` independently without mutating shared state.
     *
     * ```php
     * $db->delete('users')
     *    ->where(['id' => 1])
     *    ->execute();              // int — rows affected
     * ```
     *
     * @param string          $table  table to delete from (non-empty).
     * @return DeleteBuilder           a fresh builder for the given target.
     */
    public function delete(string $table): DeleteBuilder {
        return new DeleteBuilder($this->connection, $this->compiler, $table);
    }

}

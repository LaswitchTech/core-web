<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query;

use InvalidArgumentException;
use Laswitchtech\CoreWeb\Database\Connection;
use RuntimeException;

/**
 * Immutable INSERT builder — holds table + column list + data values.
 *
 * Calls ``compileInsert()`` on the configured compiler and executes via
 * prepared statement with positional parameter binding (1-based).
 *
 * ```php
 * $db->insert('users', ['name' => 'Alice', 'active' => true])
 *    ->execute();                        // int — rows affected
 * ```
 */
final class InsertBuilder {

    /* ------------------------------------------------------------------ */
    /*  Properties                                                         */
    /* ------------------------------------------------------------------ */

    /** @var string Table name (non-empty). */
    private readonly string $table;

    /** @var list<string> Column names in order. */
    private readonly array $columns;

    /** @var array<string, mixed> Data keyed by column name. */
    private readonly array $data;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a new INSERT builder.
     *
     * @param Connection        $connection the database connection (never null).
     * @param CompilerInterface $compiler   the SQL-dialect compiler (never null).
     * @param string            $table      table to insert into (non-empty).
     * @param array<string, mixed> $data    column-value pairs (non-empty, keys must be non-empty strings).
     */
    public function __construct(
        private readonly Connection $connection,
        private readonly CompilerInterface $compiler,
        string $table,
        array $data,
    ) {
        if ($table === '') {
            throw new InvalidArgumentException('InsertBuilder table must not be empty.');
        }

        if (empty($data)) {
            throw new InvalidArgumentException('InsertBuilder data must not be empty.');
        }

        foreach (array_keys($data) as $key) {
            if (!is_string($key) || $key === '') {
                throw new InvalidArgumentException(
                    sprintf('InsertBuilder data keys must be non-empty strings, got: %s', var_export($key, true))
                );
            }
        }

        $this->table   = $table;
        $this->columns = array_keys($data);
        $this->data    = $data;
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

    /** Return the table name. */
    public function table(): string {
        return $this->table;
    }

    /** Return all column names (in order, matching `$data` keys). */
    public function columns(): array {
        return $this->columns;
    }

    /** Return data keyed by column name. */
    public function data(): array {
        return $this->data;
    }

    /* ------------------------------------------------------------------ */
    /*  Execution                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Execute the INSERT and return rows affected.
     *
     * Prepares the compiled SQL via ``$connection->prepare()``, binds every
     * parameter at its 1-based positional index (PDO parameter numbers are
     * one-indexed), executes, and returns ``rowCount()``.
     *
     * If ``prepare()`` returns ``false`` a ``RuntimeException`` is thrown with
     * a message derived from ``errorInfo()``.  Any ``PDOException`` propagated
     * by ``execute()`` will bubble up unfiltered.
     *
     * @return int Rows affected.
     */
    public function execute(): int {
        $compiled = $this->compiler->compileInsert($this);

        $stmt = $this->connection->prepare($compiled['sql']);

        if ($stmt === false) {
            $errorInfo = $this->connection->pdo()->errorInfo();
            throw new RuntimeException(
                sprintf('Query prepare failed: %s', $errorInfo[2] ?? 'unknown error')
            );
        }

        // Bind parameters by 1-based positional index.
        $i = 1;
        foreach ($compiled['params'] as $param) {
            $stmt->bindValue($i, $param);
            $i++;
        }

        if (!$stmt->execute()) {
            throw new RuntimeException('INSERT execution failed without throwing PDOException.');
        }

        return $stmt->rowCount();
    }

}

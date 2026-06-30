<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query;

use InvalidArgumentException;
use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Database\Query\Clause\WhereClause;
use RuntimeException;

/**
 * Immutable UPDATE builder — holds table, column-value pairs, and WHERE conditions.
 *
 * Compiles through the assigned ``CompilerInterface``, prepares via ``$connection->prepare()``,
 * binds every parameter at its 1-based positional index, executes, and returns ``rowCount()``.
 *
 * ```php
 * $db->update('users', ['name' => 'Bob'])
 *    ->where(['id' => 1])
 *    ->execute();                 // int — rows affected
 * ```
 */
final class UpdateBuilder {

    /* ------------------------------------------------------------------ */
    /*  Properties                                                         */
    /* ------------------------------------------------------------------ */

    /** @var string Table name (non-empty). */
    private readonly string $table;

    /** @var array<string, mixed> Data keyed by column name. */
    private readonly array $data;

    /** @var list<WhereClause> WHERE conditions collected via where() / orWhere(). */
    private array $whereClauses = [];

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a new UPDATE builder.
     *
     * @param Connection        $connection the database connection (never null).
     * @param CompilerInterface $compiler   the SQL-dialect compiler (never null).
     * @param string            $table      table to update (non-empty).
     * @param array<string, mixed> $data    column-value pairs to set (non-empty, keys must be non-empty strings).
     */
    public function __construct(
        private readonly Connection $connection,
        private readonly CompilerInterface $compiler,
        string $table,
        array $data,
    ) {
        if ($table === '') {
            throw new InvalidArgumentException('UpdateBuilder table must not be empty.');
        }

        if (empty($data)) {
            throw new InvalidArgumentException('UpdateBuilder data must not be empty.');
        }

        foreach (array_keys($data) as $key) {
            if (!is_string($key) || $key === '') {
                throw new InvalidArgumentException(
                    sprintf('UpdateBuilder data keys must be non-empty strings, got: %s', var_export($key, true))
                );
            }
        }

        $this->table = $table;
        $this->data  = $data;
    }

    /* ------------------------------------------------------------------ */
    /*  WHERE clause helpers                                               */
    /* ------------------------------------------------------------------ */

    /**
     * Add a WHERE condition (AND).
     *
     * Supports the following call forms:
     * - ``where(['id' => 1])`` — single-key array maps to column=value with '=' operator.
     * - ``where('id', 1)`` — column and value; '=' defaulted for non-null, 'IS NULL' for null.
     * - ``where('id', '=', 1)`` — explicit column, operator, value.
     */
    public function where(string|array $column, mixed $operatorOrValue = null, mixed $value = null): self {
        if (is_array($column)) {
            foreach ($column as $k => $v) {
                $op = '=';
                if (is_null($v)) {
                    $op = 'IS NULL';
                }

                $whereClause = new WhereClause($k, $op, $v);
                $this->whereClauses[] = $whereClause;
            }

            return $this;
        }

        // String column: determine the actual operator and value from parameters.
        if (is_string($operatorOrValue) && in_array(strtoupper($operatorOrValue), ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'], true)) {
            // Explicit operator: where('id', '=', 1).
            $operator = $operatorOrValue;
            if ($value === null && !in_array($operator, ['IS NULL', 'IS NOT NULL'], true)) {
                $operator = 'IS NULL';
                $value    = null;
            }
            $whereClause = new WhereClause($column, $operator, $value);
            $this->whereClauses[] = $whereClause;
        } elseif ($operatorOrValue === null) {
            // where('col') or where('col', null) → col IS NULL.
            $whereClause = new WhereClause($column, 'IS NULL', null);
            $this->whereClauses[] = $whereClause;
        } else {
            // where('id', 1) — second param is value, '=' defaulted.
            $whereClause = new WhereClause($column, '=', $operatorOrValue);
            $this->whereClauses[] = $whereClause;
        }

        return $this;
    }

    /**
     * Add a WHERE condition combined via OR.
     *
     * Mirrors ``where()`` call forms but sets the internal ``$or`` flag to true so
     * the compiler emits this clause with ``OR`` instead of ``AND``.
     */
    public function orWhere(string|array $column, mixed $operatorOrValue = null, mixed $value = null): self {
        if (is_array($column)) {
            foreach ($column as $k => $v) {
                $op = '=';
                if (is_null($v)) {
                    $op = 'IS NULL';
                }

                $whereClause = new WhereClause($k, $op, $v, or: true);
                $this->whereClauses[] = $whereClause;
            }

            return $this;
        }

        if (is_string($operatorOrValue) && in_array(strtoupper($operatorOrValue), ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'], true)) {
            // Explicit operator: orWhere('id', '=', 1).
            $operator = $operatorOrValue;
            if ($value === null && !in_array($operator, ['IS NULL', 'IS NOT NULL'], true)) {
                $operator = 'IS NULL';
                $value    = null;
            }
            $whereClause = new WhereClause($column, $operator, $value, or: true);
            $this->whereClauses[] = $whereClause;
        } elseif ($operatorOrValue === null) {
            // orWhere('col') or orWhere('col', null) → col IS NULL.
            $whereClause = new WhereClause($column, 'IS NULL', null, or: true);
            $this->whereClauses[] = $whereClause;
        } else {
            // orWhere('id', 1) — second param is value, '=' defaulted.
            $whereClause = new WhereClause($column, '=', $operatorOrValue, or: true);
            $this->whereClauses[] = $whereClause;
        }

        return $this;
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

    /** Return the table name. */
    public function table(): string {
        return $this->table;
    }

    /** Return data keyed by column name. */
    public function data(): array {
        return $this->data;
    }

    /** Return all WHERE clauses. */
    public function wheres(): array {
        return $this->whereClauses;
    }

    /* ------------------------------------------------------------------ */
    /*  Execution                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Execute the UPDATE and return rows affected.
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
        $compiled = $this->compiler->compileUpdate($this);

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
            throw new RuntimeException('UPDATE execution failed without throwing PDOException.');
        }

        return $stmt->rowCount();
    }

}

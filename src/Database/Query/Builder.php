<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query;

use InvalidArgumentException;
use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Database\Query\Clause\JoinClause;
use Laswitchtech\CoreWeb\Database\Query\Clause\OrderByClause;
use Laswitchtech\CoreWeb\Database\Query\Clause\WhereClause;
use RuntimeException;

/**
 * Fluent SELECT builder — intent model + execution layer.
 *
 * Stores query intent as immutable clause value objects (Phase 1B) so
 * the later compiler stage can translate them to driver-specific SQL, and
 * when ``fetch()`` or ``all()`` is called translates that intent into a
 * prepared-statement round trip via the configured dialect compiler.
 */
final class Builder {

    /* ------------------------------------------------------------------ */
    /*  Properties                                                         */
    /* ------------------------------------------------------------------ */

    public string $table;
    /** @var list<string> */
    private array $columns;
    /** @var list<WhereClause> */
    private array $wheres;
    /** @var list<JoinClause> */
    private array $joins;
    /** @var list<OrderByClause> */
    private array $orderBys;
    public ?int $limitValue;
    public ?int $offsetValue;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a new SELECT builder.
     *
     * @param Connection        $connection the database connection (never null).
     * @param CompilerInterface $compiler   the SQL-dialect compiler (never null).
     * @param string            $table      table to query (non-empty).
     * @param list<string>      $columns    column names; defaults to ['*'].
     */
    public function __construct(
        private readonly Connection $connection,
        private readonly CompilerInterface $compiler,
        string $table,
        array $columns,
    ) {
        if ($table === '') {
            throw new InvalidArgumentException('Builder table must not be empty.');
        }
        $this->table = $table;

        if (empty($columns)) {
            throw new InvalidArgumentException('Builder columns must not be empty.');
        }
        $this->columns    = $columns;
        $this->wheres     = [];
        $this->joins      = [];
        $this->orderBys   = [];
        $this->limitValue = null;
        $this->offsetValue= null;
    }

    /* ------------------------------------------------------------------ */
    /*  Where clauses                                                      */
    /* ------------------------------------------------------------------ */

    /**
     * Add a WHERE condition (AND by default).
     *
     * - where(['id' => 1, 'active' => 1]) adds two equality WHERE clauses.
     * - where('id', 1) means id = 1.
     * - where('id', '=', 1) is an explicit comparison.
     */
    public function where(string|array $column, mixed $operatorOrValue = null, mixed $value = null): self {
        // Array notation: ['col' => val, ...] → multiple equality clauses.
        if (is_array($column)) {
            foreach ($column as $name => $val) {
                $this->wheres[] = new WhereClause($name, '=', $val);
            }
            return $this;
        }

        // where('id', 1) → id = 1 (operator inferred unless value is null).
        if ($operatorOrValue === null || !is_string($operatorOrValue)) {
            if ($operatorOrValue === null && $value === null) {
                // where('col', null) → col IS NULL
                return $this->where($column, 'IS NULL', null);
            }
            return $this->where($column, '=', $operatorOrValue);
        }

        $this->wheres[] = new WhereClause($column, $operatorOrValue, $value);
        return $this;
    }

    /**
     * Add a WHERE condition combined with OR.
     * Mirrors where(), but sets the clause @or flag to true.
     */
    public function orWhere(string|array $column, mixed $operatorOrValue = null, mixed $value = null): self {
        if (is_array($column)) {
            foreach ($column as $name => $val) {
                if ($val === null) {
                    $this->wheres[] = new WhereClause($name, 'IS NULL', null, or: true);
                } else {
                    $this->wheres[] = new WhereClause($name, '=', $val, or: true);
                }
            }
            return $this;
        }

        if ($operatorOrValue === null || !is_string($operatorOrValue)) {
            $operator = '=';
            $value    = $operatorOrValue;

            // orWhere('col', null) → col IS NULL
            if ($value === null) {
                return $this->orWhere($column, 'IS NULL');
            }
        } else {
            $operator = $operatorOrValue;
        }

        $this->wheres[] = new WhereClause($column, (string) $operator, $value, or: true);
        return $this;
    }

    /* ------------------------------------------------------------------ */
    /*  Joins                                                              */
    /* ------------------------------------------------------------------ */

    /** Add an INNER join. */
    public function join(string $table, string $left, string $operator, string $right): self {
        $this->joins[] = new JoinClause('INNER', $table, $left, $operator, $right);
        return $this;
    }

    /** Add a LEFT join. */
    public function leftJoin(string $table, string $left, string $operator, string $right): self {
        $this->joins[] = new JoinClause('LEFT', $table, $left, $operator, $right);
        return $this;
    }

    /* ------------------------------------------------------------------ */
    /*  Ordering                                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Add an ORDER BY clause. Multiple calls are supported.
     */
    public function orderBy(string $column, string $direction = 'ASC'): self {
        $this->orderBys[] = new OrderByClause($column, $direction);
        return $this;
    }

    /* ------------------------------------------------------------------ */
    /*  Paging                                                             */
    /* ------------------------------------------------------------------ */

    /** Set the LIMIT clause. Rejects negative values; zero is valid. */
    public function limit(int $limit): self {
        if ($limit < 0) {
            throw new InvalidArgumentException('Builder limit must not be negative.');
        }
        $this->limitValue = $limit;
        return $this;
    }

    /** Set the OFFSET clause. Rejects negative values; zero is valid. */
    public function offset(int $offset): self {
        if ($offset < 0) {
            throw new InvalidArgumentException('Builder offset must not be negative.');
        }
        $this->offsetValue = $offset;
        return $this;
    }

    /* ------------------------------------------------------------------ */
    /*  Read-only introspection getters                                     */
    /* ------------------------------------------------------------------ */

    /** Returns the qualified table name. */
    public function table(): string {
        return $this->table;
    }

    /** Returns the requested column list. */
    public function columns(): array {
        return $this->columns;
    }

    /** Returns all WHERE clauses (AND and OR combined). */
    public function wheres(): array {
        return $this->wheres;
    }

    /** Returns all JOIN clauses. */
    public function joins(): array {
        return $this->joins;
    }

    /** Returns the ordered list of ORDER BY clauses. */
    public function orderBys(): array {
        return $this->orderBys;
    }

    /** Returns the LIMIT value, or null when not set. */
    public function limitValue(): ?int {
        return $this->limitValue;
    }

    /** Returns the OFFSET value, or null when not set. */
    public function offsetValue(): ?int {
        return $this->offsetValue;
    }

    /* ------------------------------------------------------------------ */
    /*  Execution                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Execute the query and return the first row as an associative array,
     * or ``null`` when no rows match.
     *
     * Prepares the compiled SQL via ``$connection->prepare()``, binds every
     * parameter at its 1-based positional index (PDO parameter numbers are
     * one-indexed), executes, and fetches the first row in ``PDO::FETCH_ASSOC``
     * mode.
     *
     * If ``prepare()`` returns ``false`` a ``RuntimeException`` is thrown with
     * a message derived from ``errorInfo()``.  Any ``PDOException`` propagated
     * by ``execute()`` / ``fetch()`` will bubble up unfiltered.
     *
     * @return array<string, mixed>|null First row or null.
     */
    public function fetch(): ?array {
        $compiled = $this->compiler->compile($this);
        $stmt     = $this->connection->prepare($compiled['sql']);

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
            return null; // Execution failed without throwing — fall back to null for safety.
        }

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Execute the query and return every row as an list of associative arrays.
     *
     * Uses the same compile → prepare → bind → execute flow as ``fetch()``,
     * but calls ``fetchAll(PDO::FETCH_ASSOC)`` instead.
     *
     * If ``prepare()`` returns ``false`` a ``RuntimeException`` is thrown with
     * the same message convention as ``fetch()``.  Any ``PDOException`` propagated
     * by ``execute()`` / ``fetchAll()`` will bubble up unfiltered.
     *
     * @return list<array<string, mixed>> Every row in the result set.
     */
    public function all(): array {
        $compiled = $this->compiler->compile($this);
        $stmt     = $this->connection->prepare($compiled['sql']);

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
            return []; // Execution failed without throwing — fall back to empty list.
        }

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

}

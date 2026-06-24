<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query\Compiler;

use Laswitchtech\CoreWeb\Database\Query\Builder;
use Laswitchtech\CoreWeb\Database\Query\Clause\JoinClause;
use Laswitchtech\CoreWeb\Database\Query\Clause\OrderByClause;
use Laswitchtech\CoreWeb\Database\Query\Clause\WhereClause;
use Laswitchtech\CoreWeb\Database\Query\CompilerInterface;

/**
 * MySQL / MariaDB dialect compiler.
 *
 * Produces SQL using backtick-quoted identifiers and `?` positional
 * placeholders.  Boolean parameters are cast to integers (0/1).  
 * MySQL and MariaDB share the same compiler because they use identical
 * SELECT syntax for the features covered in Phase&nbsp;1D.
 */
final readonly class MysqlCompiler implements CompilerInterface {

    /* ------------------------------------------------------------------ */
    /*  Backtick constants                                                 */
    /* ------------------------------------------------------------------ */

    private const QUOTE = '`';

    /* ------------------------------------------------------------------ */
    /*  Identifier helpers                                                 */
    /* ------------------------------------------------------------------ */

    /** Quote a single identifier segment with backticks. */
    private function quoteIdentifier(string $identifier): string {
        return self::QUOTE . $identifier . self::QUOTE;
    }

    /**
     * Quote a dot-separated column reference.
     *
     * `users.id` → `` `users`.`id` ``
     * The sentinel `*` is returned unquoted.
     */
    private function quoteDotIdentifier(string $reference): string {
        if ($reference === '*') {
            return '*';
        }

        $parts = explode('.', $reference, 2);
        if (count($parts) === 1) {
            return $this->quoteIdentifier($parts[0]);
        }

        return $this->quoteIdentifier($parts[0]) . '.' . $this->quoteIdentifier($parts[1]);
    }

    /** Quote a bare table name. */
    private function quoteTable(string $table): string {
        return self::QUOTE . $table . self::QUOTE;
    }

    /* ------------------------------------------------------------------ */
    /*  Value helpers                                                      */
    /* ------------------------------------------------------------------ */

    /**
     * Return a param placeholder and append the cast value.
     *
     * Booleans are cast to integers for consistency across dialects.
     *
     * @return string The placeholder (`?`).
     */
    private function addParam(mixed $value, array &$params): string {
        if (is_bool($value)) {
            // Both MySQL and MariaDB store booleans as TINYINT(1).
            $params[] = (int) $value;
        } else {
            $params[] = $value;
        }
        return '?';
    }

    /* ------------------------------------------------------------------ */
    /*  Clause helpers                                                     */
    /* ------------------------------------------------------------------ */

    /** Compile the FROM / table portion. */
    private function compileTable(Builder $builder): string {
        return ' FROM ' . $this->quoteTable($builder->table());
    }

    /** Compile WHERE clauses into a SQL string fragment and bound params. */
    private function compileWheres(array $wheres, array &$params): string {
        if (empty($wheres)) {
            return '';
        }

        $sql = ' WHERE';
        $first = true;

        foreach ($wheres as $clause) {
            // Separate AND / OR.
            $sql .= $first ? ' ' : ($clause->or ? '  OR ' : ' AND ');
            $first = false;

            $column = $this->quoteDotIdentifier($clause->column);

            // Operators that do NOT bind parameters (IS NULL / IS NOT NULL).
            $noParamOperators = ['IS NULL', 'IS NOT NULL'];
            if (in_array($clause->operator, $noParamOperators, true)) {
                $sql .= sprintf('%s %s', $column, $clause->operator);
                continue;
            }

            // IN operator: expand to (?, ?, ...).
            if ($clause->operator === 'IN' && is_array($clause->value)) {
                $placeholders = [];
                foreach ($clause->value as $item) {
                    $placeholders[] = $this->addParam($item, $params);
                }
                $sql .= sprintf('%s IN (%s)', $column, implode(', ', $placeholders));
                continue;
            }

            // Normal operators: compare operator + placeholder.
            $placeholder = $this->addParam($clause->value, $params);
            $sql .= sprintf('%s %s %s', $column, $clause->operator, $placeholder);
        }

        return $sql;
    }

    /** Compile JOIN clauses into SQL fragment and bound params. */
    private function compileJoins(array $joins, array &$params): string {
        if (empty($joins)) {
            return '';
        }

        $sql = '';
        foreach ($joins as $clause) {
            $left  = $this->quoteDotIdentifier($clause->left);
            $right = $this->quoteDotIdentifier($clause->right);
            $table = $this->quoteTable($clause->table);

            $sql .= sprintf(
                ' %s JOIN %s ON %s %s %s',
                $clause->type,
                $table,
                $left,
                $clause->operator,
                $right,
            );
        }

        return $sql;
    }

    /** Compile ORDER BY clauses into SQL fragment. */
    private function compileOrderBy(array $orderBys): string {
        if (empty($orderBys)) {
            return '';
        }

        $parts = [];
        foreach ($orderBys as $clause) {
            $parts[] = sprintf(
                '%s %s',
                $this->quoteDotIdentifier($clause->column),
                $clause->direction,
            );
        }

        return ' ORDER BY ' . implode(', ', $parts);
    }

    /** Compile LIMIT / OFFSET into SQL fragment. */
    private function compilePaging(Builder $builder): string {
        $sql = '';

        if ($builder->limitValue() !== null) {
            $sql .= sprintf(' LIMIT %d', $builder->limitValue());
        }

        if ($builder->offsetValue() !== null) {
            $sql .= sprintf(' OFFSET %d', $builder->offsetValue());
        }

        return $sql;
    }

    /* ------------------------------------------------------------------ */
    /*  CompilerInterface                                                  */
    /* ------------------------------------------------------------------ */

    public function compile(Builder $builder): array {
        $params = [];

        // SELECT columns: `*` for star, backtick-quoted identifiers otherwise.
        $columns = $builder->columns();
        if ($columns === ['*']) {
            $sql = 'SELECT *';
        } else {
            $quotedColumns = [];
            foreach ($columns as $col) {
                $quotedColumns[] = $this->quoteDotIdentifier($col);
            }
            $sql = 'SELECT ' . implode(', ', $quotedColumns);
        }

        // FROM.
        $sql .= $this->compileTable($builder);

        // JOINs (no param binding).
        $sql .= $this->compileJoins($builder->joins(), $params);

        // WHERE (collects params).
        $sql .= $this->compileWheres($builder->wheres(), $params);

        // ORDER BY.
        $sql .= $this->compileOrderBy($builder->orderBys());

        // LIMIT / OFFSET.
        $sql .= $this->compilePaging($builder);

        return [
            'sql'    => $sql,
            'params' => $params,
        ];
    }

}

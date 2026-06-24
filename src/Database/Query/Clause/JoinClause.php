<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query\Clause;

/**
 * Immutable JOIN clause value object for the future SELECT builder.
 *
 * Phase&nbsp;1 joins are column-to-column only (no expression-based on
 * clauses).  No SQL generation is performed here.
 */
final readonly class JoinClause {

    /** @var list<string> Allowed JOIN comparison operators. */
    private const ALLOWED_OPERATORS = ['=', '!=', '<', '>', '<=', '>='];

    /** @var string JOIN type — INNER or LEFT. */
    public string $type;

    /** @var string Table to join against. */
    public string $table;

    /** @var string Left-side column (e.g. "users.id"). */
    public string $left;

    /** @var string JOIN operator (=, !=, <, >, <=, >=). */
    public string $operator;

    /** @var string Right-side column (e.g. "orders.user_id"). */
    public string $right;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a JOIN clause value object.
     *
     * Validation at construction time guarantees that every instance holds
     * legal data — the builder and compilers can rely on it without
     * re-validating.
     *
     * @param string $type       INNER or LEFT only.
     * @param string $table      table name to join.
     * @param string $left       left-side column (non-empty).
     * @param string $operator   comparison operator.
     * @param string $right      right-side column (non-empty).
     */
    public function __construct(string $type, string $table, string $left, string $operator, string $right) {
        // JOIN type validated: only INNER and LEFT supported in Phase 1.
        $normalized = strtoupper(trim($type));
        if (!in_array($normalized, ['INNER', 'LEFT'], true)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid JOIN type "%s". Allowed: INNER, LEFT.',
                $type,
            ));
        }
        $this->type = $normalized;

        // Table must not be empty.
        if (trim($table) === '') {
            throw new \InvalidArgumentException('JOIN table must not be empty.');
        }
        $this->table = $table;

        // Left column must not be empty.
        if ($left === '') {
            throw new \InvalidArgumentException('JOIN left column must not be empty.');
        }
        $this->left = $left;

        // Validate operator against class constant.
        $normOp   = strtoupper(trim($operator));
        if (!in_array($normOp, self::ALLOWED_OPERATORS, true)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid JOIN operator "%s". Allowed: =, !=, <, >, <=, >=.',
                $operator,
            ));
        }
        $this->operator = $normOp;

        // Right column must not be empty.
        if ($right === '') {
            throw new \InvalidArgumentException('JOIN right column must not be empty.');
        }
        $this->right = $right;
    }

}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query\Clause;

/**
 * Immutable WHERE clause value object for the future SELECT builder.
 *
 * No SQL generation is performed here — this class only holds validated data
 * and surfaces it as typed properties so the builder/compiler stages can use
 * them safely.
 */
final readonly class WhereClause {

    /** @var list<string> Allowed WHERE operators (uppercase lexical, symbolic preserved). */
    private const ALLOWED_OPERATORS = [
        '=', '!=', '<', '>', '<=', '>=', 'LIKE',
        'IN', 'IS NULL', 'IS NOT NULL',
    ];

    /** @var string Column name to compare against. */
    public string $column;

    /** @var string Normalized operator (uppercase, except symbolic operators like !=, <=). */
    public string $operator;

    /** @var mixed Bound value for the where condition. */
    public mixed $value;

    /** @var bool Whether this clause is combined via OR instead of AND. */
    public bool $or;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create a WHERE clause value object.
     *
     * Validation at construction time guarantees that every instance holds
     * legal data — the builder and compilers can rely on it without
     * re-validating.
     *
     * @param string $column       column name (non-empty).
     * @param string $operator     operator (uppercase, except symbolic).
     * @param mixed  $value        value to compare against (ignored for IS NULL / IS NOT NULL).
     * @param bool   $or           true when combined via OR.
     */
    public function __construct(string $column, string $operator, mixed $value, bool $or = false) {
        // Column must not be empty.
        if ($column === '') {
            throw new \InvalidArgumentException('WHERE column must not be empty.');
        }
        $this->column = $column;

        // Normalize operator: uppercase *except* symbolic operators.
        $normalized = preg_match('/[a-z]/i', $operator)
            ? strtoupper($operator)
            : $operator;

        if (!in_array($normalized, self::ALLOWED_OPERATORS, true)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid WHERE operator "%s". Allowed: %s',
                $operator,
                implode(', ', self::ALLOWED_OPERATORS),
            ));
        }
        $this->operator = $normalized;

        // IN requires a non-empty array value.
        if ($this->operator === 'IN' && (!is_array($value) || empty($value))) {
            throw new \InvalidArgumentException('IN operator requires a non-empty array value.');
        }

        // IS NULL / IS NOT NULL ignore the provided value entirely.
        $this->value = in_array($this->operator, ['IS NULL', 'IS NOT NULL'])
            ? null
            : $value;

        $this->or = $or;
    }

}

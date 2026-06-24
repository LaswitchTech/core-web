<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query\Clause;

/**
 * Immutable ORDER BY clause value object for the future SELECT builder.
 */
final readonly class OrderByClause {

    /** @var string Column name to sort by. */
    public string $column;

    /** @var string Direction — ASC or DESC (uppercase). */
    public string $direction;

    /* ------------------------------------------------------------------ */
    /*  Constructor                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Create an ORDER BY clause value object.
     *
     * Validation at construction time guarantees that every instance holds
     * legal data — the builder and compilers can rely on it without
     * re-validating.
     *
     * @param string $column  column name (non-empty).
     * @param string $direction  ASC or DESC, normalized to uppercase.
     */
    public function __construct(string $column, string $direction) {
        // Column must not be empty.
        if ($column === '') {
            throw new \InvalidArgumentException('ORDER BY column must not be empty.');
        }
        $this->column = $column;

        // Direction: only ASC or DESC, normalized uppercase.
        $normalized = strtoupper(trim($direction));
        if (!in_array($normalized, ['ASC', 'DESC'], true)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid ORDER BY direction "%s". Allowed: ASC, DESC.',
                $direction,
            ));
        }
        $this->direction = $normalized;
    }

}

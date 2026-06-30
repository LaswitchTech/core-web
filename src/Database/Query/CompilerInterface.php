<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Query;

/**
 * Contract for a SQL dialect compiler.
 *
 * Each implementation translates a query intent (Builder) into driver-safe
 * SQL and bound parameters without exposing dialect-specific syntax to
 * application code.
 */
interface CompilerInterface {

    /**
     * Compile a SELECT query builder into raw SQL and parameters.
     *
     * @param Builder $builder query intent model.
     * @return array{sql: string, params: list<mixed>} Compiled SQL statement and bound parameters in positional order.
     */
    public function compile(Builder $builder): array;

    /**
     * Compile an INSERT builder into raw SQL and parameters.
     *
     * @param InsertBuilder $builder insert intent model.
     * @return array{sql: string, params: list<mixed>} Compiled SQL statement and bound parameters in positional order.
     */
    public function compileInsert(InsertBuilder $builder): array;

    /**
     * Compile an UPDATE query builder into raw SQL and parameters.
     *
     * @param UpdateBuilder $builder update intent model.
     * @return array{sql: string, params: list<mixed>} Compiled SQL statement and bound parameters in positional order (SET params before WHERE params).
     */
    public function compileUpdate(UpdateBuilder $builder): array;

    /**
     * Compile a DELETE query builder into raw SQL and parameters.
     *
     * @param DeleteBuilder $builder delete intent model.
     * @return array{sql: string, params: list<mixed>} Compiled SQL statement and bound parameters in positional order.
     */
    public function compileDelete(DeleteBuilder $builder): array;

}

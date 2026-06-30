# CompilerInterface

## Metadata

- **File:** `src/Database/Query/CompilerInterface.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query\Compiler`
- **Type:** Interface (contract)
- **Phase:** 1E (DML support in progress, V2 complete)

## Purpose

Defines the single method that all SQL dialect compilers must implement. This interface isolates the SELECT Builder's internal state from driver-specific SQL generation, allowing new database back-ends to be added without modifying existing code.

Additionally, DML builders (InsertBuilder, UpdateBuilder, DeleteBuilder) call their own compile methods (`compileInsert`, `compileUpdate`, `compileDelete`) on the same compiler instance. All three DML signatures share the same parameter-binding conventions: positional `?` placeholders with boolean casting to `(int)` 0/1.

## SELECT Compilation Method Signature

```php
public function compile(Builder $builder): array{sql: string, params: list<mixed>}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `$builder` | `Builder` | The query intent model containing tables, columns, clauses, and paging info. |

### Return Value

Returns a shape-typed array with two keys:

| Key | Type | Description |
|-----|------|-------------|
| `sql` | `string` | The compiled SQL statement with positional `?` placeholders for all bound values. |
| `params` | `list<mixed>` | Parameters in positional order, to be binded to the prepared statement. |

## DML Compilation Method Signatures

### INSERT

```php
public function compileInsert(InsertBuilder $builder): array{sql: string, params: list<mixed>}
```

Compiles an INSERT statement with values from `$builder->data()`. Parameters follow column order (first `$data` key → `params[0]`). Boolean values are cast to `(int)` in the compiler; this is handled by the concrete compilers, not the builder. Returns a fresh params array for each compilation.

### UPDATE

```php
public function compileUpdate(UpdateBuilder $builder): array{sql: string, params: list<mixed>}
```

Compiles an UPDATE statement with SET values **first**, followed by WHERE clause values **second**. This ordering is critical: the compilers append SET param values to the params array before calling ``compileWheresUpdate()`` for WHERE clauses. Parameters within each phase follow iteration order of the source collection (data key order / where-clause addition order). Boolean values within each phase are cast to `(int)`.

### DELETE

```php
public function compileDelete(DeleteBuilder $builder): array{sql: string, params: list<mixed>}
```

Compiles a DELETE statement with WHERE clause values appended in clause-addition order. WHERE clause parameters all appear after any hypothetical DML parameter phase (currently none for DELETE). Boolean values are cast to `(int)`. Note: ``compileDelete`` is defined on the interface but not yet implemented in SqliteCompiler or MysqlCompiler as of V1.0.

## Implementations

- `SqliteCompiler` — SQLite dialect with double-quote identifiers.
- `MysqlCompiler` — MySQL / MariaDB dialect with backtick identifiers (both share the same SQL syntax for Phase 1D features).

## Implementation Checklist for New Compilers

When adding a new compiler:

1. Implement `CompilerInterface` in namespace `Laswitchtech\CoreWeb\Database\Query\Compiler`.
2. Use your database backend's identifier quoting convention.
3. Always produce positional `?` placeholders (never named placeholders).
4. Cast boolean parameters to integers for cross-database consistency.
5. Return the shape `array{sql: string, params: list<mixed>}` exactly — no extra keys.
6. Respect the DML parameter ordering contract: INSERT uses single-order params; UPDATE appends SET before WHERE; DELETE uses clause-addition order only.

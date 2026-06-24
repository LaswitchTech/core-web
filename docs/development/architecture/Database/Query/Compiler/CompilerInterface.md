# CompilerInterface

## Metadata

- **File:** `src/Database/Query/CompilerInterface.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query`
- **Type:** Interface (contract)

## Purpose

Defines the single method that all SQL dialect compilers must implement. This interface isolates the Builder's internal state from driver-specific SQL generation, allowing new database back-ends to be added without modifying existing code.

## Method Signature

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

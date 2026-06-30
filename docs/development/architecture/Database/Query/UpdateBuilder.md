# UpdateBuilder.md — UPDATE query builder

## Metadata

- **File:** `src/Database/Query/UpdateBuilder.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query`
- **Class type:** `final`, mostly immutable (WHERE clauses mutable)

## Purpose

Holds immutable UPDATE intent — a table name, column-value SET pairs, and WHERE conditions. Compiles through the configured ``CompilerInterface`` and executes as a prepared statement. Unlike InsertBuilder, UpdateBuilder accumulates WHERE clauses via ``where()``/``orWhere()`` before execution is possible.

The builder enforces immutability on its core data (table name and SET values) but is **partially mutable** in that WHERE clauses can be chained before execute:

| Property | Mutability | Description |
|----------|-----------|-------------|
| `$connection` | readonly | Database connection. |
| `$compiler` | readonly | Dialect SQL compiler. |
| `$table` | readonly | Table name — validated non-empty at construction, never changes. |
| `$data` | readonly | SET key-value pairs — validated non-empty at construction, never changes. |
| `$whereClauses` | mutable | `list<WhereClause>` — accumulates via ``where()``/``orWhere()`` until execution. |

## Construction Validation

Same rules as InsertBuilder apply to the constructor:

| Constraint | Exception | Message excerpt |
|---|---|---|
| `$table` empty | ``InvalidArgumentException`` | `"UpdateBuilder table must not be empty."` |
| `$data` empty | ``InvalidArgumentException`` | `"UpdateBuilder data must not be empty."` |
| Non-string key | ``InvalidArgumentException`` | `"UpdateBuilder data keys must be non-empty strings, got: {key}"` |

## WHERE Clause Helpers

Both ``where()`` and ``orWhere()`` accept three call forms with identical behavior in both methods. The only difference is that ``orWhere()`` sets the internal `$or` flag to `true` on each clause so the compiler emits `OR` instead of `AND`.

### Call Form 1: Associative array `where(['id' => 1])`

Single or multi-key arrays map columns to values with operator `'='` (or `'IS NULL'` if value is null):

```php
$db->update('users', ['name' => 'Bob'])
   ->where(['id' => 1])
   where(['status' => null]); // → WHERE `id` = ? AND `status` IS NULL
```

### Call Form 2: Column + value `where('id', 1)`

Second parameter (when operator is ``null``) is always the value. Default operator:
- `'='` if value is non-null
- `'IS NULL'` if value is null

```php
->where('active', true);  // → WHERE `active` = ?
->where('deleted_at');     // → WHERE `deleted_at` IS NULL (no third param)
```

### Call Form 3: Column + operator + value `where('id', '>', 1)`

All six comparison operators from WhereClause are supported:

````text
=  !=  <  >  <=  >=
````

```php
->where('score', '>=', 50);   // → WHERE `score` >= ?
->where('status', '=', 'active'); // → WHERE `status` = ?
```

### Null Detection Rule (All Forms)

In **all three call forms**, when the value is ``null``, the operator defaults to `'IS NULL'`. No parameter is bound for IS NULL / IS NOT NULL columns. The same rule applies inside ``orWhere()``.

## Accessors

| Method | Return | Description |
|--------|--------|-------------|
| `table(): string` | Table name | Always non-empty. |
| `data(): array<string, mixed>` | SET values keyed by column | Never null — empty list is rejected at construction. |
| `wheres(): list<WhereClause>` | WHERE clauses accumulated via where() / orWhere() | May be empty (all rows updated). |

## Fluent Factory Method (Database Facade)

```php
$db->update(string $table, array $data): UpdateBuilder
```

Each call produces a fresh builder so that ``where()``/``orWhere()`` chaining and ``execute()`` do not mutate shared state.

## Compilation — SET / Param Ordering

Update is the only DML operation with **two phases** of parameters, and ordering matters:

```
compileUpdate($builder)
    ├── Phase 1: SET values (params[0]..params[n-1]) → appended FIRST
    └── Phase 2: WHERE values (params[n]..params[m-1]) → appended SECOND
```

This ordering is enforced by the compilers (`compileWheresUpdate`) to avoid dialect-specific issues where a column named in SET might be confused with a WHERE column. Parameters are positional — ``bindValue(1, ...)`` maps to `params[0]`.

### Why This Matters

The compiler appends **SET values** before any WHERE clause values into the params array. Both SqliteCompiler and MysqlCompiler follow this contract: first loop over `$builder->data()` for SET columns, then call ``compileWheresUpdate()`` which appends WHERE params. The InsertBuilder uses a single-order pattern identical to INSERT, but UPDATE needs positional ordering guarantees across both phases.

## SQL Output Examples

### Simple UPDATE (SQLite)

```php
$db->update('users', ['name' => 'Bob'])->where(['id' => 1])->execute();
```

```sql
UPDATE "users" SET "name" = ? WHERE "id" = ?
```

Params: `['Bob', 1]` (SET value first, WHERE value second).

### UPDATE with OR condition and boolean cast (SQLite)

```php
$db->update('users', ['status' => 'inactive'])
   ->where(['id' => 5])
   ->orWhere(['archived', true])
   ->execute();
```

```sql
UPDATE "users" SET "status" = ? WHERE "id" = ? OR "archived" = ?
```

Params: `['inactive', 5, 1]` (SET param at index 0, WHERE params at indices 1–2; boolean cast to integer).

### UPDATE with IS NULL (SQLite)

```php
$db->update('users', ['verified_at' => '2026-01-01'])
   ->where(['email' => null])
   ->execute();
```

```sql
UPDATE "users" SET "verified_at" = ? WHERE "email" IS NULL
```

Params: `['2026-01-01']` (only SET param; IS NULL does not bind a value).

### UPDATE with explicit operators (MySQL)

````sql
UPDATE `users` SET `active` = ?, `score` = ? WHERE `id` > ? OR `score` >= 50
````

Params: `[1, 95, 3]` (SET values before WHERE values; booleans → int).

## Execution Flow

```
UpdateBuilder::execute()
    ├── compileUpdate($this) → array{sql, params}
    ├── prepare(sql) → PDOStatement|false
    │   └── false → RuntimeException(message from errorInfo[2])
    ├── bindValue(1-based positional index, param) — SET params first in order, WHERE params after
    ├── execute() → bool
    │   └── false → RuntimeException("UPDATE execution failed without throwing PDOException.")
    └── return: rowCount() (int) — rows affected
```

- **Positional parameter binding**: Parameters are bound at their 1-based positional index. `$params[0]` → ``bindValue(1, ...)``. Return value always reflects the row count.
- **Prepare failures**: Yielding `false` produces a ``RuntimeException`` with ``errorInfo()[2]`` as message.
- **Execute failures**: Propagate as-is (typically ``PDOException``).

## Design Guarantees

1. **SET values are immutable** — columns/values cannot be modified after construction; new update queries must call ``->update()`` on the facade again.
2. **WHERE clauses accumulate** — the only mutable state is `$whereClauses`, cleared implicitly when a new builder is created (not per-operation). Each builder instance starts with an empty WHERE list.
3. **Positional parameter ordering** — SET values bind before WHERE values; within each phase, order follows the array key / argument order at construction/call time.
4. **No multi-update row count splitting** — a single ``execute()`` returns total affected rows; if you need per-row counts, use transactions with individual updates.

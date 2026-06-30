# DeleteBuilder.md — DELETE query builder

## Metadata

- **File:** `src/Database/Query/DeleteBuilder.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query`
- **Class type:** `final` with partially mutable state

## Purpose

Holds immutable DELETE intent — a table name and WHERE conditions — then compiles to SQL via the configured ``CompilerInterface``, prepares via ``$connection->prepare()``, binds parameters at 1-based positional indices, executes, and returns ``rowCount()`` (number of rows deleted).

The builder is partially mutable: the WHERE clause list (`$whereClauses`) accumulates via ``where()`` / ``orWhere()`` calls before execution. The table name cannot be modified after construction.

| Property | Mutability | Description |
|----------|-----------|-------------|
| `$connection` | readonly | Database connection (PDO wrapper). |
| `$compiler` | readonly | SQL dialect compiler for this database. |
| `$table` | readonly | Table name — validated non-empty at construction, never changes. |
| `$whereClauses` | mutable | `list<WhereClause>` — accumulates via ``where()`` / ``orWhere()`` until execution. |

## Construction Validation

| Constraint | Exception | Message excerpt |
|---|---|---|
| `$table` empty | ``InvalidArgumentException`` | `"DeleteBuilder table must not be empty."` |

After construction the builder's core identity (table name) is immutable; WHERE clauses accumulate via method chaining.

## WHERE Clause Helpers

Both ``where()`` and ``orWhere()`` accept **three call forms** with identical behavior in both methods. The only difference is that ``orWhere()`` sets the internal `$or` flag to `true` on each clause so the compiler emits `OR` instead of `AND`.

### Call Form 1: Associative array `where(['id' => 1])`

Single or multi-key arrays map column names to values with operator `'='` (or `'IS NULL'` if value is null):

```php
$db->delete('users')
   ->where(['id' => 1])                        // WHERE "id" = ?
   ->where(['status' => null]);                 // AND "status" IS NULL
```

### Call Form 2: Column + value `where('id', 1)`

When operator is ``null``, the second parameter (when present) is always treated as the value. The default operator:

- `'='` if value is non-null
- `'IS NULL'` if value is null

```php
->where('active', true);  // → WHERE "active" = ?
->where('deleted_at');     // → WHERE "deleted_at" IS NULL (no third param)
```

### Call Form 3: Column + operator + value `where('id', '>', 1)`

All six comparison operators supported in WhereClause:

````text
=  !=  <  >  <=  >=
````

```php
->where('score', '>=', 50);   // → WHERE "score" >= ?
->where('status', '=', 'active'); // → WHERE "status" = ?
```

### Null Detection Rule (All Forms)

In **all three call forms**, when the value is ``null``, the operator defaults to `'IS NULL'`. No parameter is bound for IS NULL / IS NOT NULL columns. The same rule applies inside ``orWhere()``.

## Accessors

| Method | Return | Description |
|--------|--------|-------------|
| `table(): string` | Table name | Always non-empty (validated at construction). |
| `wheres(): list<WhereClause>` | WHERE clauses accumulated via where()/orWhere() | May be empty — deletes all rows. |

## Execution Flow

```
DeleteBuilder::execute()
    ├── compileDelete($this) → array{sql, params}
     │   (compiled via CompilerInterface)
    ├── $connection->prepare(sql) → PDOStatement|false
    │   └── false → RuntimeException(message from errorInfo[2])
    ├── bindValue(1-based positional index, param) for each param in order
    ├── execute() → bool
    │   └── false → RuntimeException("DELETE execution failed without throwing PDOException.")
    └── return: rowCount() (int) — rows deleted
```

- Parameters are bound at 1-based positional indices. `$params[0]` → ``bindValue(1, ...)``.
- Prepare failures that yield `false` produce a ``RuntimeException`` with the message from ``errorInfo()[2]``.
- Execute failures propagate as-is (typically ``PDOException``).

## SQL Output Examples

### Simple DELETE (SQLite)

```php
$db->delete('users')->where(['id' => 1])->execute();
```

````sql
DELETE FROM "users" WHERE "id" = ?
````

Params: `[1]`

### DELETE with multiple AND conditions (SQLite)

````sql
DELETE FROM "users" WHERE "email" IS NULL AND "created_at" < ?
````

Params: `['2020-01-01', 1]`

### DELETE with OR condition and boolean cast (MySQL)

````sql
DELETE FROM `posts` WHERE `author_id` = ? OR `author_id` IS NULL
````

Params: `[42, 0]` (boolean cast to integer; SET params before WHERE if any UPDATE component present).

### DELETE all rows (no WHERE clauses)

```php
$db->delete('sessions')->execute(); // caution — affects all rows
```

```sql
DELETE FROM "sessions"
```

Params: `[]` — no conditions bound.

## Deferred Features

| Feature | Status | Notes |
|---------|--------|-------|
| DELETE with LIMIT | ❌ deferred | Post-V1.0; would require dialect-specific syntax (e.g., `DELETE FROM ... WHERE ... LIMIT ?`). |
| DELETE with OFFSET | ❌ deferred | Post-V1.0; rarely needed, usually solved with subqueries. |
| RETURNING clause | ❌ deferred | Post-V1.0; would allow fetching deleted rows after execution (SQLite 3.35+ / PostgreSQL). |

## Design Guarantees

1. **WHERE clauses accumulate** — only mutable state is `$whereClauses`; table name and compiler are immutable after construction. Each new builder starts with an empty WHERE list.
2. **Positional parameter binding** — parameters follow clause-order: first WHERE params from ``where()``, then any WHERE params from ``orWhere()`` (all AND clauses before OR). Order reflects call order at execution time.
3. **Intent + execute model** — DeleteBuilder accepts no direct user SQL; only the builder API is supported. No raw DELETE string injection.

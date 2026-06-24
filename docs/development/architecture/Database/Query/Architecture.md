# Query Builder Architecture

## Overview

The query builder subsystem translates fluent query intent into driver-safe SQL through a multi-stage pipeline:

```
Builder (intent model)
    │
    ▼
CompilerInterface (contract)
    │
    ├── SqliteCompiler (double-quote identifiers, `?` placeholders)
    └── MysqlCompiler (backtick identifiers, `?` placeholders)
    │
    ▼
array{sql: string, params: list<mixed>}
```

## Components

### Intent Model — `Builder`

- **File:** `src/Database/Query/Builder.php`
- Fluent SELECT **builder that mutates internally** to accumulate query intent.
- Properties hold validated clause value objects from Phase 1B.
- Read-only introspection getters expose internal state to the compiler stage.

### Clause Value Objects — `Clause\*`

Each clause type is an immutable, readonly value object validated at construction time:

| Class | File | Purpose |
|-------|------|---------|
| `WhereClause` | `src/Database/Query/Clause/WhereClause.php` | WHERE conditions with supported operators (=, !=, <, >, <=, >=, LIKE, IN, IS NULL, IS NOT NULL). Booleans cast to int. |
| `JoinClause` | `src/Database/Query/Clause/JoinClause.php` | Join specifications (INNER/LEFT) with column-to-column comparisons. |
| `OrderByClause` | `src/Database/Query/Clause/OrderByClause.php` | ORDER BY sort direction (ASC/DESC only). |

### Compiler Contract — `CompilerInterface`

- **File:** `src/Database/Query/CompilerInterface.php`
- Defines the single method: `compile(Builder): array{sql: string, params: list<mixed>}`.
- Return shape is fixed for predictable downstream consumption.

### Dialect Compilers

| Compiler | File | Identifier Quoting | Placeholder Style | Boolean Casting |
|----------|------|--------------------|-------------------|-----------------|
| `SqliteCompiler` | `src/Database/Query/Compiler/SqliteCompiler.php` | Double quotes (`"users".id`) | Positional `?` | bool → int (0/1) |
| `MysqlCompiler` | `src/Database/Query/Compiler/MysqlCompiler.php` | Backticks (`` `users`.`id` ``) | Positional `?` | bool → int (0/1) |

Both compilers support the same feature set: FROM, WHERE (AND/OR), INNER JOIN, LEFT JOIN, ORDER BY, LIMIT, OFFSET. LIMIT and OFFSET are validated integer literals appended directly to SQL (not bound parameters).

## Identifier Quoting Rules

- Dot notation quotes each segment individually: `users.id` → `"users"."id"` or `` `users`.`id` ``.
- The `*` sentinel is returned unquoted (no identifier wrapping).
- Bare table names are always quoted with the dialect's quote character.

## SQL Output Examples

### Simple SELECT *

```
$db->select('users')->where(['id' => 1])
```

| Dialect | Compiled SQL |
|---------|-------------|
| SQLite | `SELECT * FROM "users" WHERE "id" = ?` |
| MySQL | `SELECT * FROM \`users\` WHERE \`id\` = ?` |

### Explicit Columns with JOIN and ORDER BY

```
$db->select('users', ['id', 'name'])
   ->join('orders', 'users.id', '=', 'orders.user_id')
   ->orderBy('name')
```

| Dialect | Compiled SQL |
|---------|-------------|
| SQLite | `SELECT "id", "name" FROM "users" INNER JOIN "orders" ON "users"."id" = "orders"."user_id" ORDER BY "name" ASC` |
| MySQL | ``SELECT `id`, \`name\` FROM \`users\` INNER JOIN \`orders\` ON \`users\`.\`id\` = \`orders\`.\`user_id\` ORDER BY \`name\` ASC`` |

## Parameter Binding

- Parameters are positional (`?`) and passed in the `params` array.
- Booleans are cast to integers (0/1) in both compilers for consistent behavior across dialects.
- The `IN` operator expands to individual placeholders: `id IN (1, 2, 3)` → `WHERE "id" IN (?, ?, ?)`.
- `IS NULL` and `IS NOT NULL` do not bind parameters.

## JOIN Type Limitations

- **Supported**: INNER, LEFT (column-to-column only).
- **Deferred**: RIGHT, CROSS, FULL OUTER, NATURAL, and expression-based join conditions.
- `JoinClause` restricts to `INNER` and `LEFT` types via validation at construction time.

---

## Ordering

Only column names are supported in ORDER BY. Expression-based sorting (e.g. `LOWER(name)`) is a future addition.

---

## LIMIT / OFFSET

Both are optional, validated as non-negative integer literals appended directly to SQL (not bound parameters). SQLite and MySQL/MariaDB share identical semantics:
- `LIMIT n` returns the first `n` rows.
- `OFFSET m` skips the first `m` rows (only meaningful with `LIMIT`).
- Negative values are rejected at the Builder level via ``InvalidArgumentException``.

---

## Future RETURNING Support

Phase 1E compilers return only `{sql, params}` — affected-row counts and generated IDs are not yet returned. A future phase may return an extra `PDOStatement` for SQLite's `RETURNING` / MySQL's `lastInsertId()` workflows.

---

## Files

| File | Purpose |
|------|---------|
| `src/Database/Query/Builder.php` | Query intent model with execute methods (fetch()/all()). |
| `src/Database/Query/CompilerInterface.php` | Contract between Builder and compilers. |
| `src/Database/Query/Compiler/SqliteCompiler.php` | SQLite dialect compiler. |
| `src/Database/Query/Compiler/MysqlCompiler.php` | MySQL / MariaDB dialect compiler. |
| `src/Database/Query/Clause/*.php` | Immutable clause value objects (WhereClause, JoinClause, OrderByClause). |


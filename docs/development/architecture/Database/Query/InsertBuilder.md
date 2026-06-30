# InsertBuilder.md — INSERT query builder

## Metadata

- **File:** `src/Database/Query/InsertBuilder.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query`
- **Class type:** `final`, immutable (all properties readonly)

## Purpose

Holds immutable INSERT intent — a table name, column list (derived from `$data` keys), and data values — then compiles to SQL via the configured ``CompilerInterface`` and executes it as a prepared statement.

Unlike the SELECT ``Builder`` which accumulates query clauses into a fluent chain and executes separately on ``fetch()``/``all()``, InsertBuilder is simpler: columns are fixed at construction time, and execution always happens in one call to ``execute()``.

## Construction Validation

Every constraint is enforced in `__construct()`:

| Constraint | Exception | Message excerpt |
|---|---|---|
| `$table` empty | ``InvalidArgumentException`` | `"InsertBuilder table must not be empty."` |
| `$data` empty | ``InvalidArgumentException`` | `"InsertBuilder data must not be empty."` |
| Non-string key | ``InvalidArgumentException`` | `"InsertBuilder data keys must be non-empty strings, got: {key}"` |

After construction the builder is fully immutable — no mutating methods exist.

## Accessors

| Method | Return | Description |
|--------|--------|-------------|
| `table(): string` | Table name | Always non-empty (validated at construction). |
| `columns(): list<string>` | Column names in insertion order | Reflects `$data` key order preserved from construction. |
| `data(): array<string, mixed>` | Data keyed by column | Returns the original data array passed to constructor. |

## Fluent Factory Method (Database Facade)

```php
$db->insert(string $table, array $data): InsertBuilder
```

Each call produces a fresh builder so that ``execute()`` chaining does not mutate shared state.

## Compilation

InsertBuilder calls `compileInsert()` on the assigned ``CompilerInterface``:

```
InsertBuilder::execute()
    └── compileInsert($this) → array{sql, params}
        ├── Column list → double-quoted (SQLite) / backtick-quoted (MySQL)
        ├── Values → ? placeholder + append to params (booleans → int)
```

### SET / Param Ordering

For INSERT, there is exactly one phase of parameters: the SET values. Parameters are appended in builder-defined order (the `$data` key insertion order at construction time). Both compilers produce identical ordering — `params[0]` always corresponds to the value for the first column in `$columns`.

### SQL Output Examples

#### Single-row INSERT (SQLite)

```php
$db->insert('users', ['name' => 'Alice', 'active' => true])
   ->execute();
```

```sql
INSERT INTO "users" ("name", "active") VALUES (?, ?)
```

Params: `['Alice', 1]` (boolean `true` cast to `(int)` `1`. Param order follows `$data` key insertion order.)

#### Single-row INSERT (MySQL)

```sql
INSERT INTO `users` (`name`, `active`) VALUES (?, ?)
```

Params: `['Alice', 1]` — boolean `true` cast to `(int)` `1`. Param order follows `$data` key insertion order.

## Execution Flow

```
InsertBuilder::execute()
    ├── compileInsert($this) → array{sql, params}
    ├── prepare(sql) → PDOStatement|false
    │   └── false → RuntimeException(message from errorInfo[2])
    ├── bindValue(1-based positional index, param) for each param in order
    ├── execute() → bool
    │   └── false → RuntimeException("INSERT execution failed without throwing PDOException.")
    └── return: rowCount() (int) — number of rows inserted
```

- Parameters are bound at 1-based positional indices. `$params[0]` → ``bindValue(1, ...)``. Return value always reflects the row count from the prepared statement.
- Prepare failures that yield `false` (not thrown) produce a ``RuntimeException`` with the message from ``errorInfo()[2]``.
- Execute failures propagate as-is typically ``PDOException``.

## Design Guarantees

1. **Immutability** — columns are fixed at construction time; no post-construction mutation methods exist.
2. **Intent + execute model** — InsertBuilder does not separate intent accumulation from execution like ``Builder``; there is only ``execute()`` which compiles then runs in one call.
3. **Positional parameter binding** — parameters follow column order. No named placeholders. Booleans are cast to `(int)` 0/1 by compilers, not by the builder.

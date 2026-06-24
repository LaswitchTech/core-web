# Query Builder (Builder.php)

## Purpose

The `Builder` class is a mutable fluent SELECT query intent model with built-in execution. It accumulates clause metadata in **immutable value objects** while the Builder itself mutates its internal property lists to support fluent chaining, then delegates compilation to the dialect compiler when ``fetch()`` or ``all()`` is invoked.

## Architecture

```
new Builder($connection, $compiler, 'users', ['id','name'])
    └── chainable methods (mutating intent model):
        ├── ->where(col/conds)       → list<WhereClause>
        ├── ->orWhere(col/conds)     → list<WhereClause>  with or=true
        ├── ->join(table, l, op, r)  → list<JoinClause>
        ├── ->leftJoin(table, l, op, r)
        ├── ->orderBy(column, dir)   → list<OrderByClause>
        ├── ->limit(n)               → ?int
        └── ->offset(n)              → ?int
    └── execution (triggers compile + execute):
        ├── ->fetch()                → array<string,mixed>|null  (first row or null)
        └── ->all()                  → list<array<string,mixed>> (every row)
```

## Constructor

```php
public function __construct(
    Connection $connection,
    CompilerInterface $compiler,
    string $table,
    array $columns = ['*']
)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` (injected dependency, declared readonly for immutability of the *reference*) | Database connection — never null. Used for ``prepare()`` and PDO access. |
| `compiler` | `CompilerInterface` (injected dependency, declared readonly for immutability of the *reference*) | SQL dialect translator — never null. Carried to execution layer via ``compile($this)``. |
| `table` | `string` | The target table name (public, non-empty). |
| `columns` | `list<string>` | Selected columns; defaults to ``['*']``. |

The class is declared ``final``. Constructor-injected dependencies (`Connection`, `CompilerInterface`) are declared ``readonly``, but the Builder **itself is not immutable** — clause arrays, limit, and offset are mutable private properties so that fluent chaining can accumulate query state. The intent model (the accumulating builder) is mutable; only the clause data objects it creates are immutable.

## Intent Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `where()` | `(string|array $column, mixed $opOrVal = null, mixed $val = null): self` | `$this` | AND clauses (array → multiple equality). ``where('col', null)`` produces ``IS NULL``. |
| `orWhere()` | `(string|array $column, mixed $opOrVal = null, mixed $val = null): self` | `$this` | OR-combined WHERE (mirrors ``where()``). Mirrors null-check behavior. |
| `join()` | `(string $table, string $left, string $op, string $right): self` | `$this` | INNER JOIN. |
| `leftJoin()` | `(string $table, string $left, string $op, string $right): self` | `$this` | LEFT JOIN. |
| `orderBy()` | `(string $column, string $dir = 'ASC'): self` | `$this` | ORDER BY (multiple calls supported). |
| `limit()` | `(int $limit): self` | `$this` | LIMIT (validated non-negative integer literal appended to SQL, not bound param). |
| `offset()` | `(int $offset): self` | `$this` | OFFSET (validated non-negative integer literal appended to SQL, not bound param). |

## Execution Methods

### ``fetch()`` → `array<string, mixed>|null`

Compiles the query intent into SQL via the compiler, prepares with ``Connection::prepare()``, binds parameters by 1-based positional index, executes, and returns the **first** row as an associative array or ``null``.

```php
$container = Bootstrap::container();
/** @var \Laswitchtech\CoreWeb\Database\Database $db */
$db = $container->resolve('database');

$row = $db->select('users')
    ->where(['id' => 1])
    ->fetch(); // array{0 => ['id' => '(int)', 'name' => '(string)']}|null

$builder = $db->select('users')->where(['id' => 1]);
$row     = $builder->fetch();       // fetches the first row
$id      = $builder->table();       // table() still returns "users" after execution
```

### ``all()`` → `list<array<string, mixed>>`

Same compile → prepare → bind → execute flow as ``fetch()``, but returns **every** row in the result set.

```php
$users = $db->select('users')
    ->where(['active' => 1])
    ->orderBy('name', 'ASC')
    ->all(); // list<array{id: int, name: string, ...}>
```

### Execution details

| Aspect | Detail |
|--------|--------|
| **Parameter binding** | Positional, 1-based (PDO convention). ``$params[0]`` → ``bindValue(1, …)``. |
| **Prepare failure (returns ``false``)** | Throws ``RuntimeException`` with message derived from ``$pdo->errorInfo()[2]``. |
| **Execute failure (`!stmt->execute()`)** | ``fetch()`` returns ``null``, ``all()`` returns ``[]``. No exception thrown. |
| **PDOException propagation** | Propagates unfiltered if it occurs from ``execute()`` or ``fetchAll()``/``fetch()``. |
| **SQL injection safety** | All user-provided values are bound via PDO parameterized placeholders — never interpolated into SQL text. WHERE IN clause expansions also use positional placeholders. |

## Dialect-Specific Details

The compiler layer translates Builder intent to dialect-specific SQL:

| Aspect | SQLite | MySQL/MariaDB |
|--------|--------|---------------|
| Identifier quoting | Double-quoted ``"table"."column"`` | Backtick-quoted ``\`table\`.\`column\` `` |
| Boolean parameters | Cast to integer `(int) true → 1` | Cast to integer `(int) true → 1` |
| LIKE escaping | `LIKE '%value%'` (parameterized) | Same (MySQL handles backticks transparently) |
| Paging syntax | `LIMIT n OFFSET m` | Standard `LIMIT n OFFSET m` |

### Example: SQLite output

```php
$db->select('users')
   ->where(['id' => 1])
   ->leftJoin('profiles', 'profiles.user_id', '=', 'users.id')
   ->orderBy('name', 'ASC')
   ->limit(20)
   ->offset(40)
   ->fetch();
```

Compiled SQL (SQLite):

```sql
SELECT "id", "name", "email" FROM "users"
LEFT JOIN "profiles" ON "profiles"."user_id" = "users"."id"
WHERE "id" = ?
ORDER BY "name" ASC
LIMIT 20 OFFSET 40
```

Bound parameters (1-based positional indexes): `[1]` → `bindValue(1, 1)`

### Example: MySQL output

Identical SQL but with backtick identifiers:

```sql
SELECT `id`, `name`, `email` FROM `users`
LEFT JOIN `profiles` ON `profiles`.`user_id` = `users`.`id`
WHERE `id` = ?
ORDER BY `name` ASC
LIMIT 20 OFFSET 40
```

## Inspecting Builder State

All chain methods return `$this`, enabling fluent composition. After a chain is assembled, its internal state can be inspected via the following getters (which expose accumulated clause data, not snapshots):

| Method | Return type | Description |
|--------|-------------|-------------|
| `table()` | `string` | The target table name. |
| `columns()` | `list<string>` | Selected columns (star as sentinel). |
| `wheres()` | `list<WhereClause>` | All WHERE clauses accumulated. |
| `joins()` | `list<JoinClause>` | All JOIN clauses accumulated. |
| `orderBys()` | `list<OrderByClause>` | ORDER BY clauses in registration order. |
| `limitValue()` | `?int` | Current limit, or null. |
| `offsetValue()` | `?int` | Current offset, or null. |

## Files

| File | Purpose |
|------|---------|
| `src/Database/Query/Builder.php` | Builder intent model + fetch()/all() execution. |
| `src/Database/Query/Clause/WhereClause.php` | Immutable WHERE condition value object. |
| `src/Database/Query/Clause/JoinClause.php` | Immutable JOIN condition value object. |
| `src/Database/Query/Clause/OrderByClause.php` | Immutable ORDER BY value object. |
| `docs/development/architecture/Database/Architecture.md` | Overall subsystem architecture. |
| `docs/development/architecture/Database/Database.md` | Database facade wiring + execution contract. |

## Status

**[x] Complete (Phase 1E)** — Builder constructor accepts Connection + CompilerInterface; select() passes them through; fetch()/all() compile, bind positional params, execute, and return results with proper error handling.

# Database Facade (Database.php)

## Purpose

The `Database` class is the public facade / entry-point for the database subsystem. It wraps a single ``Connection`` instance (itself a thin PDO wrapper) and a selected ``CompilerInterface`` (dialect-specific SQL generator), exposing both raw query execution and fluent SELECT queries that automatically compile to the active dialect and execute as prepared statements.

| Method | Return type | Description |
|--------|-------------|-------------|
| `pdo()` | `PDO` | Pass-through to the underlying connection's PDO instance. |
| `query(string $sql)` | `PDOStatement\|false` | Execute a SQL query; returns the result statement or false on failure. |
| `prepare(string $sql)` | `PDOStatement\|false` | Prepare a statement for later binding and execution. |
| `select(string $table, array $columns = ['*'])` | `Builder` | Start a fluent SELECT query; passes connection + compiler to ``Builder``. |
| `inTransaction()` | `bool` | Pass-through to ``Connection::inTransaction()`` — reports if the wrapped connection is inside an open transaction. |
| `transaction(callable $callback)` | `mixed` | All-or-nothing transaction block; passes the **Database facade** to the callback (not the raw Connection), delegates to ``Connection::transaction()``. |

The class is **final** and has only a constructor and public read-only methods — no mutable state beyond the private, readonly `$connection` and `$compiler` properties.

## `inTransaction(): bool`

Pass-through to ``$this->connection->inTransaction()``. Reports whether the wrapped Connection is currently inside an open database transaction. Use before calling ``transaction()`` if you want explicit pre-checking; ``transaction()`` itself guards against nesting and will throw ``RuntimeException`` when called inside an existing transaction.

## `transaction(callable $callback): mixed`

Delegates to ``$this->connection->transaction(...)`` while passing the **Database facade** (not the raw Connection) to the user callback:

```php
$db->transaction(function ($db): int {
    // $db is Laswitchtech\CoreWeb\Database\Database, not Connection.
    $stmt = $db->pdo()->prepare('INSERT INTO accounts (balance) VALUES (?)');
    $stmt->execute([1000]);
    return 42;
});
// Returns 42 — the transaction commits after the callback returns normally.

// On any Throwable inside the callback:
// The transaction rolls back, then the original Throwable is re-thrown unchanged.
```

**Behavior inherited from ``Connection::transaction()``:**

| Guarantee | Detail |
|-----------|--------|
| Commits on success | Callback's return value propagated after commit. |
| Rolls back on error | Any ``Throwable`` triggers rollback before propagation. |
| Re-throws original | Exception is never swallowed or wrapped. |
| No savepoints | Nested calls throw `RuntimeException("Nested database transactions are not supported.")` — V1.0 does not implement SAVEPOINT support. |

**Important: callback receives the Database facade**

Unlike ``Connection::transaction()`` which passes the Connection wrapper to its callback, ``Database::transaction()`` wraps the inner call so that the user's ``$db`` argument is always the same ``Database`` instance they called ``transaction()`` on. This means all fluent methods (`select()`, `pdo()`, etc.) are available inside the callback:

```php
$db->transaction(function ($db): void {
    // Fluent API (Database facade) — correct:
    $db->select('users')->where(['id' => 1])->fetch();

    // Raw PDO — also correct:
    $db->pdo()->exec("SELECT ...");
});
```

The class is **final** and has only a constructor and public read-only methods — no mutable state beyond the private, readonly `$connection` and `$compiler` properties.

## Constructor

```php
public function __construct(Connection $connection, CompilerInterface $compiler)
```

- `Connection $connection`: thin PDO wrapper — never null.
- `CompilerInterface $compiler`: SQL dialect compiler for this database — never null.
- Invoked during bootstrap via the container key **`database`** (see Wiring below).

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `$connection` | `Connection` | The wrapped connection (always set by the constructor). |
| `$compiler` | `CompilerInterface` | The SQL dialect compiler for this database. |

## Bootstrap Integration

Database services are wired in `Bootstrap::registerDbServices()`:

```php
$c->registerSingleton('db_driver', /* ... */);   // sqlite or mysql driver singleton
$c->registerSingleton('db_connection', /* ... */); // lazily resolves db_driver, creates Connection

$c->registerSingleton('database', function ($container) use ($driverKey) {
    $compiler = match ($driverKey) {
        'mysql', 'mariadb' => new MysqlCompiler(),
        'sqlite'           => new SqliteCompiler(),
        default            => throw DatabaseException(...),
    };
    return new Database($container->resolve('db_connection'), $compiler);
});
```

| Binding Key | Type | Lifetime | Description |
|-------------|------|----------|-------------|
| `db_driver` | `DriverInterface` (Sqlite or Mysql) | lazy singleton | The driver instance. **Does NOT** return a Connection. |
| `db_connection` | `Connection` | lazy singleton | PDO wrapper — lazy-initialized via `$driver->connect(...)`. |
| `database` | `Database` | lazy singleton | Facade wrapping `db_connection` + selected compiler. **No `db` alias**. |

The ``database`` key is a lazy singleton — it resolves `db_connection` and instantiates the appropriate `CompilerInterface` on first demand. Neither the Connection nor the compiler is ever null because the container guarantees resolution at that point, and both classes are instantiated within the same closure before being passed to `Database`.

## Fluent SELECT Builder (Phase 1E)

The ``select()`` method creates a fresh Builder instance that carries the connection and compiler into query intent. When ``fetch()`` or ``all()`` is called on the builder:

```
Builder::fetch() or all()
    └── compile → CompilerInterface->compile($builder) : array{sql, params}
        └── prepare → $connection->prepare($sql) : PDOStatement|false
            ├── If false → RuntimeException with errorInfo[2] message
            ├── bindParams(1-based positional index) → foreach ($params as $idx => $val) stmt->bindValue($idx+1, $val)
            └── execute() → fetch()/fetchAll(PDO::FETCH_ASSOC)
```

### Return values

| Method | Success | Prepare failure (`false`) | Execute failure (non-PDOException) | PDOException propagation |
|--------|---------|--------------------------|------------------------------------|--------------------------|
| ``fetch()`` | `array<string, mixed>\|null` (first row or null) | Throws RuntimeException | Returns `null` | Propagates unfiltered |
| ``all()`` | `list<array<string, mixed>>` | Throws RuntimeException | Returns `[]` | Propagates unfiltered |

### Design guarantees

1. **Intent-only chaining** — calling `fetch()` or `all()` does not mutate the Builder's clause state; the builder preserves its accumulated intent across multiple executions, so the same chain can be replayed.
2. **Positional parameter binding** — parameters are bound at their 1-based positional index (PDO convention); `$compiled['params'][0]` maps to `bindValue(1, ...)`.
3. **Exception hierarchy** — `prepare()` failures that return `false` (not thrown) are converted to ``RuntimeException`` with the message from ``$pdo->errorInfo()[2]``. Exceptions from `execute()` or `fetchAll()`/`fetch()` propagate as-is (typically ``PDOException``).

## Design Principles Applied

1. **Thin facade** — no logic duplication; every method delegates to ``Connection`` or ``CompilerInterface``.
2. **Facade over raw drivers** — Database facade has readonly dependencies; Builder is mutable fluent state; fetch()/all() do not mutate Builder state.
3. **Container-first** — created by the DI container, not instantiated by callers directly.
4. **No global state** — the class stores nothing but its private constructor arguments.
5. **Dialect separation** — SQL generation is delegated to ``CompilerInterface`` implementations; Database remains dialect-agnostic.

## Files

| File | Purpose |
|------|---------|
| `src/Database/Database.php` | This facade class. |
| `docs/development/architecture/Database/Architecture.md` | Overall subsystem architecture (driver discovery, connection lifecycle). |
| `docs/development/architecture/Database/Query/Builder.md` | Query Builder intent model + execution documentation. |
| `docs/development/architecture/Database/Query/Compiler/{SqliteCompiler,MysqlCompiler}.md` | Dialect-specific SQL translation rules. |

## Status

**[x] Complete (Phase 1E)** — Facade, wiring, SELECT execution, INSERT helper, and fluent UPDATE/DELETE helpers are implemented and wired via the ``Database`` facade.

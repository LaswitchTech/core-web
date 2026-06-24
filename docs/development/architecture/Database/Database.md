# Database Facade (Database.php)

## Purpose

The `Database` class is the public facade / entry-point for the database subsystem. It wraps a single ``Connection`` instance (itself a thin PDO wrapper) and a selected ``CompilerInterface`` (dialect-specific SQL generator), exposing both raw query execution and fluent SELECT queries that automatically compile to the active dialect and execute as prepared statements.

| Method | Return type | Description |
|--------|-------------|-------------|
| `pdo()` | `PDO` | Pass-through to the underlying connection's PDO instance. |
| `query(string $sql)` | `PDOStatement\|false` | Execute a SQL query; returns the result statement or false on failure. |
| `prepare(string $sql)` | `PDOStatement\|false` | Prepare a statement for later binding and execution. |
| `select(string $table, array $columns = ['*'])` | `Builder` | Start a fluent SELECT query; passes connection + compiler to ``Builder``. |

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

1. **Intent-only chaining** — calling `fetch()` or `all()` is non-mutating; the builder state is preserved across multiple executions because PHP 8+ readonly classes create copies per call site, and our Builder uses no mutable internal state outside of clause accumulation during chain build-up.
2. **Positional parameter binding** — parameters are bound at their 1-based positional index (PDO convention); `$compiled['params'][0]` maps to `bindValue(1, ...)`.
3. **Exception hierarchy** — `prepare()` failures that return `false` (not thrown) are converted to ``RuntimeException`` with the message from ``$pdo->errorInfo()[2]``. Exceptions from `execute()` or `fetchAll()`/`fetch()` propagate as-is (typically ``PDOException``).

## Design Principles Applied

1. **Thin facade** — no logic duplication; every method delegates to ``Connection``.
2. **Immutable state** — no mutations after construction; all public methods are pure pass-throughs.
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

**[x] Complete (Phase 1E)** — Facade, wiring, and SELECT execution are complete; INSERT helper methods and fluent UPDATE/DELETE helpers await a future KANBAN task.

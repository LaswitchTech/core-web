# Database Subsystem — Phase 2A (Multi-Driver)

## Overview

The Database subsystem provides a minimal PDO-based driver abstraction layer for Core-Web with two production-ready drivers — **SQLite** (zero-config, default) and **MySQL/MariaDB** (server-based) — plus a fluent Query Builder that compiles to prepared statements at the dialect level.

Architecture layers:

```
┌─────────────────────────────────────────────┐
│  Database Facade (Database.php)              │  ← public entry / builder factory
│  + select(table, columns) → Builder          │
├─────────────────────────────────────────────┤
│  Query Builder (Builder.php)                 │  ✓ Phase 1E — SELECT intent + fetch()/all()
│  + where/orWhere/join/orderBy/limit/offset   │
│  + fetch(): ?array                            │
│  + all(): list<array>                         │
├─────────────────────────────────────────────┤
│  Compiler Layer (CompilerInterface)          │  ✓ Phase 1E — SQL translation
│    SqliteCompiler  → double-quoted, positional │
│    MysqlCompiler   → backtick-quoted           │
├─────────────────────────────────────────────┤
│  Connection (Connection.php)                 │  ✓ Phase 2A — PDO wrapper
│  + pdo(), query(), prepare()                 │
├─────────────────────────────────────────────┤
│  Drivers (DriverInterface, Mysql, Sqlite)    │  ✓ Phase 2A — DSN/connection
│  + connect(string $dsn): PDO                 │
└─────────────────────────────────────────────┘
```

This document describes the multi-driver architecture and components as of Phase 2A with the Query Builder layer additions from Phase 1E. Future phases will extend this with migration tools, schema introspection, ORM, and data management tooling.

---

## Architecture

```
Bootstrap::registerDbServices()
    ├── Read config: $config = Config::get('database')
    ├── Resolve driver name ("sqlite" | "mysql" | "mariadb")
    └── Container bindings registered:
            │
            ├─ db_driver      → singleton → Sqlite or Mysql (via driver)
            └─ db_connection  → singleton → Connection (lazy — resolved on first access, not at registration)
```

The connection is **lazy**: database file opening, directory creation, and SQLite extension verification all happen on the *first* `$container->resolve('db_connection')` call, not during bootstrap. This avoids filesystem work at init time when database services are never used.

---

## Driver Selection

The driver is selected by the `database.driver` configuration key in `config/core.cfg`:

| `database.driver` value | Resolved class                                          | Notes                                   |
|------------------------|---------------------------------------------------------|-----------------------------------------|
| `"sqlite"`             | `Laswitchtech\CoreWeb\Database\Driver\Sqlite`          | Default — zero-config file-based DB     |
| `"mysql"`              | `Laswitchtech\CoreWeb\Database\Driver\Mysql`           | Uses PDO MySQL protocol                 |
| `"mariadb"`            | `Laswitchtech\CoreWeb\Database\Driver\Mysql` (alias)   | MariaDB maps to same Mysql class        |

Bootstrap normalizes the driver name and instantiates the appropriate driver during `registerDbServices()`. The container never returns a driver directly — it always resolves through `db_driver` (the driver instance) or `db_connection` (the Connection object created by the driver).

### Driver Comparison

| Aspect             | `sqlite`                         | `mysql` / `mariadb`                          |
|--------------------|----------------------------------|----------------------------------------------|
| Class              | `Laswitchtech\CoreWeb\Database\Driver\Sqlite` | `Laswitchtech\CoreWeb\Database\Driver\Mysql` |
| Required extension | `pdo_sqlite`                     | `pdo_mysql`                                  |
| Zero-config        | Yes                              | No (requires host/database credentials)      |
| Typical use case   | Local development, embedded apps  | Production/shared hosting/server deployments  |

---

## Database Configuration

### SQLite Config Keys

| key      | type    | default         | required | notes                       |
|----------|---------|-----------------|----------|-----------------------------|
| driver   | string  | `sqlite`        | yes      | Driver identifier (lowercase) |
| path     | string  | `data/app.db`   | no       | Database file path; auto-created |

### MySQL/MariaDB Config Keys

| Key           | Type             | Default    | Required          | Notes                                    |
|---------------|------------------|------------|--------------------|-------------------------------------------|
| host          | string           | `127.0.0.1` | no               | Server hostname                            |
| port          | integer          | `3306`     | no               | Server port                                |
| database      | string           | `""`       | **yes** if dsn is absent | Target schema/schema name              |
| charset       | string           | `utf8mb4`  | no               | Connection character set                   |
| username      | string           | `""`       | no               | Authentication username                    |
| password      | string           | `""`       | no               | Authentication password                    |
| dsn           | string\|`null`   | `null`     | no               | Full DSN override (see DSN Behavior below) |

### DSN Override Behavior

- If `dsn` is provided as a **non-empty string**, it is used verbatim as the PDO DSN. All other host/port/database/charset keys are retained in config but ignored for DSN construction.
- If `dsn` is an **empty string** (`""`), a `DatabaseException` is thrown: `"MySQL DSN must not be empty."`
- If `dsn` is **not provided** (key absent or `null`), the driver builds the DSN from individual keys:

```
mysql:host={host};port={port};dbname={database};charset={charset}
```

In this mode, `database` must be a non-empty string; otherwise a `DatabaseException` is thrown.

---

## Container Bindings

| Binding Key       | Type                                                | Lifetime   | Description                                                                                                      |
|-------------------|-----------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------|
| `db_driver`       | `DriverInterface` (Sqlite or Mysql)                 | lazy singleton | The driver instance — **does NOT return a Connection**. Returns the driver itself (`Sqlite`, `Mysql`, etc.) |
| `db_connection`   | `Laswitchtech\CoreWeb\Database\Connection`           | lazy singleton | PDO wrapper — lazy-initialized via `$driver->connect(...)`. Resolved on first access only                      |
| `database`        | `Laswitchtech\CoreWeb\Database\Database`             | lazy singleton | Database facade wrapping `db_connection` + selected compiler. **No `db` alias**.                                   |

### Critical Distinction

- **`db_driver`** does NOT return a Connection. It returns the driver instance (e.g., `Sqlite|class:Mysql`). Use it if you need to introspect which driver is active or call driver-specific factory methods.
- **`db_connection`** returns the Connection object. This is the primary interface for raw PDO access via `$conn->prepare()`, `$conn->query()`, and `$conn->pdo()`.
- **`database`** wraps both `db_connection` + `CompilerInterface`; use it for fluent query building (`->select()->where()->fetch()`) or raw SQL through delegation.

### Accessing the Database

```php
$container = Laswitchtech\CoreWeb\Bootstrap::container();
/** @var \Laswitchtech\CoreWeb\Database\Connection */
$conn = $container->resolve('db_connection');

// Use native PDO through the Connection wrapper:
$stmt = $conn->prepare('SELECT * FROM users WHERE id = ?');
$stmt->bindValue(1, 42);
$row    = $stmt->fetch() ?? null;

// Raw PDO access (when extension-specific methods are needed):
$rawPdo = $conn->pdo(); // PDO with 'sqlite:' or 'mysql:' DSN depending on config
```

---

## Database Facade (Phase 1E)

The `Database` class wraps ``Connection`` + ``CompilerInterface`` and exposes:

| Method | Return type | Description |
|--------|-------------|-------------|
| `pdo()` | `PDO` | Pass-through to the underlying connection's PDO. |
| `query(string $sql)` | `PDOStatement\|false` | Execute a SQL query; returns result statement or false. |
| `select(table, columns = ['*'])` | `Builder` | Fluent SELECT — passes ``Connection`` + ``CompilerInterface`` to ``Builder``. |

The facade is the public entry point for both raw and fluent queries.

### Bootstrap Wiring

```php
$driverKey = /* 'sqlite'|'mysql'|'mariadb' from config */;

$c->registerSingleton('db_driver', /* ... */);      // Sqlite or Mysql driver singleton
$c->registerSingleton('db_connection', /* ... */);   // Connection via lazy db_driver factory
$c->registerSingleton('database', fn($container) =>  // Lazy singleton — resolved on first use
    new Database(
        $container->resolve('db_connection'),
        match ($driverKey) {
            'mysql', 'mariadb' => new MysqlCompiler(),
            'sqlite'           => new SqliteCompiler(),
            default            => throw new \DomainException("Unsupported driver: {$driverKey}"),
        },
    ),
);
```

Neither the ``Connection`` nor the compiler is ever `null` because both are resolved/created within the factory closure. ``binParams()`` validates this invariant: if `$this->pdo !== null && $this->stmt` has not been set at execution time, it throws a ``DomainException`` rather than a ``TypeError``, preserving backward compatibility with existing callers.

---

## Directory Structure

```
src/Database/
├── Connection.php                 # Laswitchtech\CoreWeb\Database\Connection
├── Database.php                   # Laswitchtech\CoreWeb\Database\Database (Phase 1E)
├── Error/
│   └── DatabaseException.php      # Laswitchtech\CoreWeb\Database\Error\DatabaseException
├── Query/
│   ├── Builder.php                # Laswitchtech\CoreWeb\Database\Query\Builder (Phase 1E)
│   ├── Clause/
│   │   ├── JoinClause.php         # Immutable JOIN condition value object (Phase 1E)
│   │   ├── OrderByClause.php      # Immutable ORDER BY value object (Phase 1E)
│   │   └── WhereClause.php        # Immutable WHERE condition value object (Phase 1E)
│   ├── Compiler/
│   │   ├── SqliteCompiler.php     # SQLite SQL generation: double-quoted, positional (Phase 1E)
│   │   └── MysqlCompiler.php      # MySQL/MariaDB SQL generation: backticks (Phase 1E)
│   └── CompilerInterface.php      # Contract between Builder and dialect compilers (Phase 1E)
└── Driver/
    ├── DriverInterface.php        # Laswitchtech\CoreWeb\Database\Driver\DriverInterface
    ├── Mysql.php                  # Laswitchtech\CoreWeb\Database\Driver\Mysql (Phase 2A)
    └── Sqlite.php                 # Laswitchtech\CoreWeb\Database\Driver\Sqlite

docs/development/architecture/Database/
├── Architecture.md                # this file
├── Database.md                    # docs/development/architecture/Database/Database.md (Phase 1E)
├── Error/
│   └── DatabaseException.md       # docs/development/architecture/Database/Error/DatabaseException.md
├── Query/
│   ├── Builder.md                 # docs/development/architecture/Database/Query/Builder.md (Phase 1E)
│   ├── Clause/
│   │   ├── JoinClause.md          # docs/development/architecture/Database/Query/Clause/JoinClause.md
│   │   ├── OrderByClause.md       # docs/development/architecture/Database/Query/Clause/OrderByClause.md
│   │   └── WhereClause.md         # docs/development/architecture/Database/Query/Clause/WhereClause.md
│   ├── Compiler/
│   │   ├── CompilerInterface.md   # docs/development/architecture/Database/Query/Compiler/CompilerInterface.md (Phase 1E)
│   │   ├── SqliteCompiler.md      # docs/development/architecture/Database/Query/Compiler/SqliteCompiler.md (Phase 1E)
│   │   └── MysqlCompiler.md       # docs/development/architecture/Database/Query/Compiler/MysqlCompiler.md (Phase 1E)
│   └── Architecture.md           # Phase 1E — Query Builder layer overview + SQL output examples
└── Driver/
    ├── DriverInterface.md         # docs/development/architecture/Database/Driver/DriverInterface.md
    ├── Mysql.md                   # docs/development/architecture/Database/Driver/Mysql.md (Phase 2A)
    └── Sqlite.md                  # docs/development/architecture/Database/Driver/Sqlite.md
```

---

## Limitations — Phase 2A

| Item                        | Status           | Notes                                                          |
|-----------------------------|------------------|----------------------------------------------------------------|
| MySQL / MariaDB driver      | ✅ Implemented   | Bootstrap resolves `mysql` and `mariadb` to Mysql class       |
| PostgreSQL driver           | ❌ Not yet       | Out of scope for Phase 2A                                      |
| Connection pooling          | ❌ Not yet       | SQLite does not need pool; MySQL version deferred              |
| Query Builder               | ✅ Phase 1E implemented (SELECT + fetch()/all()) | INSERT/UPDATE/DELETE builders also implemented and wired through Database facade |
| ORM / Active Record         | ❌ Future phase  | Beyond the scope of a driver layer                             |
| Database migrations          | ❌ Future phase  | DESIGN.md states "No migration system in day-one"              |
| Schema introspection        | ❌ Not yet       | Table/column metadata APIs not implemented                     |
| Backup / Restore CLI        | ❌ Not yet       | Data management tooling — future `core.db.*` commands          |
| Admin panel DB settings     | ❌ Not yet       | KANBAN-admin UI task separate from driver implementation        |
| Database seeding             | ❌ Future phase  | Seed/fixture system planned for a later data infrastructure task |

### Phase 2A Explicitly Out of Scope (Not Deferred — Out of Scope)

The following items are strictly out of scope and will not be added until a dedicated future scope:

- **Driver-level JOIN helpers** — Raw drivers do not provide joins; they return PDO connections only. JOIN support is provided exclusively by the Query Builder (Phase 1E) for INNER and LEFT JOIN on SELECT queries.
- **TLS/SSL** — `MYSQL_ATTR_SSL_*` options not included; consider DSN override for TLS connections
- **Transaction helpers** — Only raw PDO methods (`beginTransaction()`, `commit()`, `rollBack()`); helper wrappers deferred
- **PDO options beyond core set above** — e.g., `MYSQL_ATTR_INIT_COMMAND`, driver-specific settings (e.g. `CLIENT_SSL`)

### What Is Supported in Phase 2A

| Capability                  | SQLite       | MySQL/MariaDB    |
|-----------------------------|--------------|------------------|
| Connection creation          | ✅           | ✅               |
| Lazy initialization         | ✅           | ✅               |
| Native prepared statements  | ✅           | ✅                |
| Raw SQL via PDO             | ✅           | ✅               |
| PRAGMA (SQLite)            | ✅           | N/A              |
| Custom DSN override         | ❌           | ✅               |
| Extension validation         | ✅           | ✅               |

---

## Validation — Phase 2A

### CLI Smoke Test (Temporary — HelloWorld extension)

```bash
php cli hello.db
# → "SQLite OK: {version}\n"  on success
# → "SQLite FAILED: {message}\n"  with HTTP-500 status on failure
```

> This command is a **Phase 1 placeholder** inside the HelloWorld smoke-test extension. It will be replaced by a permanent `core.db.*` CLI subsystem in a later phase. The temporary command lives in `ext/plugins/hello-world/src/HelloWorld.php`.

### Manual Validation Checklist

1. `php -l src/Database/Error/DatabaseException.php` — syntax check
2. `php -l src/Database/Connection.php` — syntax check
3. `php -l src/Database/Driver/DriverInterface.php` — syntax check
4. `php -l src/Database/Driver/Mysql.php` — syntax check (Phase 2A)
5. `php -l src/Database/Driver/Sqlite.php` — syntax check
6. `php cli hello.db` — runtime validation (lazy connect + PRAGMA)
7. Verify `$container->has('db_driver')` and `$container->has('db_connection')` are both true after bootstrap

---

## Design Decisions

### Why PDO Over Native SQLite3 API?

PDO provides a consistent driver interface; the framework can eventually add MySQL/MariaDB via `mysql://` DSN without rewriting the adapter layer. Using PDO's native `PDOStatement` and `PDO::ATTR_...` constants directly (instead of custom wrappers) keeps the implementation transparent and eliminates abstraction leaks.

### Why Lazy Connection?

Database directory creation, file IO, and extension checks are filesystem/OS work that should not happen during boot unless a user actually queries the database. By registering as a singleton factory whose closure is only invoked on first `resolve()`, we avoid filesystem side effects at bootstrap time while still delivering a single shared connection for the lifetime of the process.

### Why No `close()` Method?

PDO handles connection teardown via its destructor (`__destruct`). An explicit `close()` was not implemented in Phase 1 because there is no resource cleanup work needed beyond what PHP's garbage collector already does at script termination. If a future need arises (shared connections, graceful shutdown), `close()` can be added without breaking existing code since callers primarily use `resolve('db_connection')` which caches the instance.

### PRAGMA Best-Effort

Both `PRAGMA journal_mode=WAL` and `PRAGMA foreign_keys=ON` are executed as best-effort wrapped in try/catch. SQLite versions earlier than 3.7.0 do not support PRAGMA statement execution; these failures produce no error or warning — the connection still works with default behaviors (rollback journal, foreign keys disabled). Future iterations could expose these as configurable options.

### Path Validation

Phase 1 validates that `pdo_sqlite` is loaded and rejects an empty path string. Beyond that, no additional validation is implemented (e.g., path traversal checks are left for future security hardening since the basePath always originates from bootstrap-resolved values).

---

## Future Expansion Plan

| Priority | Task                                   | Status     | Notes                                           |
|----------|---------------------------------------|------------|-------------------------------------------------|
| P1        | `core.db` CLI commands                | ⏳ Deferred  | Replaces temporary HelloWorld `hello.db`           |
| P2        | MySQL / MariaDB Driver via PDO::mysql  | ✅ Implemented | Same interface contract as SQLite — swap at registration level |
| P3        | Connection persistence for MySQL       | ⏳ Deferred  | Requires `$config['persistent'] = true` option    |
| P4        | Query Builder                              | ✅ Implemented | Phase 1E — SELECT with fetch()/all() complete (DML deferred)  |
| P5        | Schema manager                             | ⏳ Deferred  | Table/column introspection + DDL helpers           |

---

## Files Reference

See the linked documentation files in this directory for each component:

- [DatabaseException](./Error/DatabaseException.md) — exception classes used during driver initialization
- [DriverInterface](./Driver/DriverInterface.md) — contract shared by all drivers
- [Sqlite Driver](./Driver/Sqlite.md) — SQLite-specific implementation details
- [Mysql Driver](./Driver/Mysql.md) — MySQL/MariaDB PDO driver specific implementation (Phase 2A)

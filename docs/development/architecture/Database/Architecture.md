# Database Subsystem — Phase 2A (Multi-Driver)

## Overview

The Database subsystem provides a minimal PDO-based driver abstraction layer for Core-Web with two production-ready drivers: **SQLite** (zero-config, default) and **MySQL/MariaDB** (server-based). It is intentionally limited to connection creation, lazy initialization, and basic transaction support — no query builder, ORM, or schema management.

This document describes the multi-driver architecture and components as of Phase 2A. Future phases will extend this with migration tools and the Query Builder subsystem.

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

### Critical Distinction

- **`db_driver`** does NOT return a Connection. It returns the driver instance (e.g., `Sqlite|class:Mysql`). Use it if you need to introspect which driver is active or call driver-specific factory methods.
- **`db_connection`** returns the Connection object. This is the primary interface for raw PDO access via `$conn->prepare()`, `$conn->query()`, and `$conn->pdo()`.

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

## Directory Structure

```
src/Database/
├── Connection.php                 # Laswitchtech\CoreWeb\Database\Connection
├── Error/
│   └── DatabaseException.php      # Laswitchtech\CoreWeb\Database\Error\DatabaseException
└── Driver/
    ├── DriverInterface.php        # Laswitchtech\CoreWeb\Database\Driver\DriverInterface
    ├── Mysql.php                  # Laswitchtech\CoreWeb\Database\Driver\Mysql (Phase 2A)
    └── Sqlite.php                 # Laswitchtech\CoreWeb\Database\Driver\Sqlite

docs/development/architecture/Database/
├── Architecture.md                # this file
├── Error/
│   └── DatabaseException.md       # docs/development/architecture/Database/Error/DatabaseException.md
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
| Query Builder               | ❌ Future phase  | KANBAN-designated future work; use native PDO until available  |
| ORM / Active Record         | ❌ Future phase  | Beyond the scope of a driver layer                             |
| Database migrations          | ❌ Future phase  | DESIGN.md states "No migration system in day-one"              |
| Schema introspection        | ❌ Not yet       | Table/column metadata APIs not implemented                     |
| Backup / Restore CLI        | ❌ Not yet       | Data management tooling — future `core.db.*` commands          |
| Admin panel DB settings     | ❌ Not yet       | KANBAN-admin UI task separate from driver implementation        |
| Database seeding             | ❌ Future phase  | Seed/fixture system planned for a later data infrastructure task |

### Phase 2A Explicitly Out of Scope (Not Deferred — Out of Scope)

The following items are strictly out of scope and will not be added until a dedicated future scope:

- **Join support** — Even though MySQL/MariaDB support joins, the driver provides raw connection only
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
| P4        | Migration system                        | ⏳ Deferred  | DESIGN.md: "No migration system in day-one"        |
| P5        | Query Builder                              | ⏳ Deferred  | Future KANBAN task                                  |
| P6        | Schema manager                             | ⏳ Deferred  | Table/column introspection + DDL helpers           |

---

## Files Reference

See the linked documentation files in this directory for each component:

- [DatabaseException](./Error/DatabaseException.md) — exception classes used during driver initialization
- [DriverInterface](./Driver/DriverInterface.md) — contract shared by all drivers
- [Sqlite Driver](./Driver/Sqlite.md) — SQLite-specific implementation details
- [Mysql Driver](./Driver/Mysql.md) — MySQL/MariaDB PDO driver specific implementation (Phase 2A)

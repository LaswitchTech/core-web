# Database Subsystem — Phase 1

## Overview

The Database subsystem provides a minimal PDO-based SQLite driver for Core-Web as the day-one data persistence layer. It is intentionally limited to connection creation, lazy initialization, and basic transaction support — no query builder, ORM, or schema management.

This document describes the architecture and components of the current implementation. Future phases will extend this with MySQL/MariaDB drivers, migration tools, and the Query Builder subsystem.

---

## Architecture

```
Bootstrap::registerDbServices()
    ├── Config::get('database.driver')  → 'sqlite' ← (validated by Phase-1 guard)
    ├── Config::get('database.path')    → 'data/app.db' ← default from core.cfg
    └── Container bindings registered:
            │
            ├─ db_driver      → singleton → Laswitchtech\CoreWeb\Database\Driver\Sqlite
            └─ db_connection  → singleton → Connection (lazy — resolved on first access, not at registration)
```

The connection is **lazy**: database file opening, directory creation, and SQLite extension verification all happen on the *first* `$container->resolve('db_connection')` call, not during bootstrap. This avoids filesystem work at init time when database services are never used.

---

## Container Bindings

| Binding Key       | Type                                          | Lifetime   | Description                                                      |
|-------------------|-----------------------------------------------|------------|------------------------------------------------------------------|
| `db_driver`       | `Laswitchtech\CoreWeb\Database\Driver\Sqlite` | singleton  | SQLite database driver — resolves a PDO-connected Connection.    |
| `db_connection`   | `Laswitchtech\CoreWeb\Database\Connection`     | singleton  | Thin PDO wrapper — lazy-initialized; directory creation happens at first access. |

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
$rawPdo = $conn->pdo(); // PDO with 'sqlite:' DSN
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
    └── Sqlite.php                 # Laswitchtech\CoreWeb\Database\Driver\Sqlite

docs/development/architecture/Database/
├── Architecture.md                # this file
├── Error/
│   └── DatabaseException.md       # docs/development/architecture/Database/Error/DatabaseException.md
└── Driver/
    ├── DriverInterface.md         # docs/development/architecture/Database/Driver/DriverInterface.md
    └── Sqlite.md                  # docs/development/architecture/Database/Driver/Sqlite.md
```

---

## Limitations (Phase 1)

| Item                        | Status           | Notes                                                          |
|-----------------------------|------------------|----------------------------------------------------------------|
| MySQL / MariaDB driver      | ❌ Not yet       | Bootstrap guard rejects non-sqlite drivers at registration     |
| PostgreSQL driver           | ❌ Not yet       | Out of scope for Phase 1                                       |
| Connection pooling          | ❌ Not yet       | SQLite does not need pool; MySQL version deferred             |
| Query Builder               | ❌ Future phase  | KANBAN-designated future work; use native PDO until available  |
| ORM / Active Record         | ❌ Future phase  | Beyond the scope of a driver layer                             |
| Database migrations          | ❌ Future phase  | DESIGN.md states "No migration system in day-one"              |
| Schema introspection        | ❌ Not yet       | Table/column metadata APIs not implemented                     |
| Backup / Restore CLI        | ❌ Not yet       | Data management tooling — future `core.db.*` commands          |
| Admin panel DB settings     | ❌ Not yet       | KANBAN-admin UI task separate from driver implementation        |
| Database seeding             | ❌ Future phase  | Seed/fixture system planned for a later data infrastructure task |

---

## Validation (Phase 1)

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
4. `php -l src/Database/Driver/Sqlite.php` — syntax check
5. `php cli hello.db` — runtime validation (lazy connect + PRAGMA)
6. Verify `$container->has('db_driver')` and `$container->has('db_connection')` are both true after bootstrap

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
| P2        | MySQL / MariaDB Driver via PDO::mysql  | ⏳ Deferred  | Same interface contract as SQLite — swap at registration level |
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

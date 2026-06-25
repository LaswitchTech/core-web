# RegistryTable

## File reference

- **Src path:** `src/Migration/RegistryTable.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration`
- **Class:** `RegistryTable` (immutable operations wrapper)
- **Constant:** `TABLE_NAME = '__schema_migrations'`

## Table schema (DDL)

### SQLite

```sql
CREATE TABLE IF NOT EXISTS __schema_migrations (
    version   TEXT PRIMARY KEY,
    applied   INTEGER NOT NULL DEFAULT 0,
    checksum  TEXT,
    batch     INTEGER NOT NULL DEFAULT 0
)
```

SQLite default DDL — no engine or charset options. Both `version` and `checksum` use bare `TEXT`.

### MySQL / MariaDB

```sql
CREATE TABLE IF NOT EXISTS __schema_migrations (
    version   VARCHAR(255) PRIMARY KEY,
    applied   INTEGER NOT NULL DEFAULT 0,
    checksum  VARCHAR(64),
    batch     INTEGER NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

MySQL uses `VARCHAR(255)` for the version column (TEXT is not indexable as PRIMARY KEY in MySQL without a length prefix). The `ENGINE=InnoDB` clause is required for transaction support since each migration executes in its own transaction. `utf8mb4` charset supports full Unicode including emoji and CJK characters.

### Dialect selection

The constructor inspects `$connection->pdo()->getAttribute(\PDO::ATTR_DRIVER_NAME)`:
- If the driver name is `'mysql'`, the MySQL DDL constant is used (with appended `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`).
- For all other drivers (including `'sqlite'`), the SQLite DDL constant is used.

## Public API

### ensureTable(): void

Creates the table if it does not exist. Throws `RuntimeException` on DDL failure.

### getAppliedVersions(): list<string>

Returns version strings of all applied migrations, sorted ascending by batch then version. Empty list if none.

### latestBatch(): int

Returns the highest batch number in the table, or 0 when empty.

### insert(version: string, applied: int, checksum: string, batch: int): void

Inserts a new tracking record for a successfully applied migration.

### isApplied(version: string): bool

True if a tracking record exists for `$version`.

### getChecksum(version: string): string

Returns the stored checksum for `$version`, or `''` when not found.

### delete(version: string): void

Removes the tracking record for a given version (used during rollback).

### queryVersionDetails(versions: list<string>): array<string, array{applied:int, checksum:string}>

Bulk lookup of applied timestamps and checksums for the provided version keys. Returns empty array when `$versions` is empty or no rows match.

### dropTable(): void

Drops the entire migration tracking table. **WARNING** — destroys all migration history. Use only in teardown/test scenarios.

## Constructor parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `$connection` | `Connection` | required | PDO facade for executing DDL/DML |

## Thread-safety / immutability

All methods are pure operations on the `Connection` facade. The class itself holds only readonly properties and has no internal mutable state, making it safe across concurrent invocations sharing the same connection instance (concurrent database transactions would be serialized by the DB engine regardless).

---

See also: [Architecture](./Architecture.md), [Runner](./Runner.md) for how this table is consumed.

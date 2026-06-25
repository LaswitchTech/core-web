# SqlMigrationDriver.php

## File reference

- **Src path:** `src/Migration/Driver/SqlMigrationDriver.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration\Driver`
- **Type:** Final class implementing MigrationDriverInterface
- **Purpose:** Executes up/down SQL from migration files against a database connection, supporting dialect-specific companion file overrides.

## Dialect Override Resolution

For each migration file `YYYYMMDDHHmmss_slug.sql`, the driver searches for companion overrides in the same directory:

| Companion key pattern | Example (14-digit version) |
|------------------------|----------------------------|
| `{version}_{slug}.sqlite.sql` | `20230615120042_create_users.sqlite.sql` |
| `{version}_{slug}.mysql.sql` | `20230615120042_create_users.mysql.sql` |

When a companion file exists for the active driver, its full contents replace the corresponding up/down section of the base file. If only one section needs dialect-specific content (e.g., the companion has no `-- Down:` marker), that section falls back to the base file's version.

### Resolution algorithm

```
For each {up|down} request:
    companion = find "{version}_{slug}.{$dialect}.sql" in same directory
    if companion exists:
        split companion into its own up/down sections via -- Down: marker
        return (companion_up ?? base_up) for up requests
        return (companion_down ?? base_down) for down requests
    else:
        return section from base file directly
```

Where `$dialect` is `'mysql'` (also used for MariaDB queries) or `'sqlite'`.

## Public API

### executeUp(Migration $migration): bool

1. Resolve SQL (companion if available, else base).
2. Execute via `$connection->pdo()->exec(sql)`.
3. Returns `true` on success, `false` on failure. Empty sections short-circuit to `true`.

### executeDown(Migration $migration): bool

1. Resolve the down SQL first (same companion-first logic as up).
2. If resolved down SQL is empty, throw `RuntimeException`.
3. Execute via `$connection->pdo()->exec(sql)`.
4. Returns `true` on success, `false` on failure.

## Constructor parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `$connection` | `Connection` | required | PDO facade for executing SQL |
| `$activeDriver` | string | `'sqlite'` | Current database driver — used to select companion override files |

## Section extraction (companion file parsing)

A companion file is structured identically to a base migration file. **Phase 1 requires exactly one SQL statement per section;** multi-statement sections are not supported.

### Phase 1 limitation: semicolon detection

Single-statement validation is intentionally simple and rejects any non-trailing semicolon, including semicolons inside string literals. Split such statements into separate migrations or avoid semicolons in string literals.

```sql
-- Up:
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);

-- Down:
DROP TABLE IF EXISTS users;
```

The `-- Down:` line at the start of a line (with optional whitespace prefix) splits up and down sections. If no `-- Down:` marker exists, the entire file content is treated as the up section with an empty down section.

---

See also: [Architecture](../Architecture.md), [Runner](./Runner.md).

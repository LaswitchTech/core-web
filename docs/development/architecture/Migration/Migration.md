# Migration Value Object

## File reference

- **Src path:** `src/Migration/Migration.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration`
- **Type:** Immutable final class (value object)

## Purpose

Represents a single database migration as discovered from a `.sql` file on disk. Provides the version key, checksum, and SQL sections (`up`, `down`) used by promoters, runners, and drivers.

---

## Construction

### Static factory: `fromFile(string $filePath, int $priority = 0): self`

Reads a single migration SQL file and returns an immutable `Migration` value object.

1. Strips dialect suffixes from the filename (`.sqlite`, `.mysql`, `.mariadb`).
2. Extracts version (leading 14-digit timestamp) and slug from the base filename.
3. Validates version is a valid Gregorian timestamp via \DateTimeImmutable::createFromFormat('YmdHis', ...).
4. Computes SHA-256 checksum of the **full** file content via `hash_file('sha256', ...)`.
5. Reads file contents via `file_get_contents()`. Fails with `\InvalidArgumentException` if the file cannot be read.
6. Splits content at the `-- Down:` marker line (produces `$up`, `$down`).
7. Returns a new immutable `Migration` instance.

### Constructor parameters

| Param | Type | Description |
|-------|------|-------------|
| `$version` | `string` | 14-digit sortable timestamp (e.g., `"20260625120000"`). Never empty. |
| `$slug` | `string` | Human-readable description derived from the filename minus the version prefix. Never empty. |
| `$file` | `string` | Absolute path to the migration SQL file on disk. |
| `$checksum` | `string` | SHA-256 hex digest of the full file content — used for tamper/change detection. |
| `$content` | `string` | Full raw SQL content including any `-- Down:` marker (for introspection). |
| `$up` | `string` | Up-section SQL: everything before the `-- Down:` marker, trimmed. Empty if no marker exists. |
| `$down` | `string` | Down-section SQL: everything after the `-- Down:` marker, trimmed. Empty if absent. |
| `$priority` | `int` | Discovery priority — lower number = higher priority. Used by Runner for dedup rules. |

The constructor is public and accepts all listed parameters; in practice, instances are created via the `fromFile()` static factory which provides sensible defaults.

---

## Section extraction

The `-- Down:` marker splits a file into two sections:

```
Up section          ↓     Down section
(INSERT/DDL/DML)    |   (ROLLBACK/DDL/DML)
```

### Parsing rules

- Marker must be at the start of a line, optionally preceded by whitespace: `/^\s*--\s+Down\s*:/i`
- **Up** = all text before the marker (trimmed). If no marker, the entire file content is `up`.
- **Down** = all text after the marker (trimmed). If no text follows, `down` is empty string.

### Multi-statement restriction

> **Phase 1 limitation:** Each section must contain exactly **one** SQL statement.
> `PDO::exec()` does not reliably parse multiple statements separated by semicolons across SQLite and MySQL PHP drivers. Companion files follow the same rule.

---

## Public methods

### `hasDown(): bool`

Returns `true` if this migration has non-empty down SQL (i.e., rollback is possible).

```php
$migration = Migration::fromFile('20260625120000_create_users.sql');
$canRollback = $migration->hasDown(); // true if "-- Down:" section exists with content
```

### `supportsDriver(string $driver): bool`

Always returns `true`. Base migrations are considered driver-agnostic. Dialect-specific variants are handled via companion files by the SQL driver.

---

## Immutability

All properties are `readonly`. No public setters exist. The value object is safe to share across promoters, runners, and drivers without defensive copies or copy-on-write overhead.

---

## Example discovery flow

```
AppPromoter → scan /app/migrations/*.sql
  ├─ fromFile('20260625120000_create_users.sql', 1)
  │   → Migration(version='20260625120000', up='CREATE TABLE ...', down='DROP TABLE ...')
  ├─ fromFile('20260625130000_add_email.sql', 1)
  │   → Migration(version='20260625130000', up='ALTER TABLE ...', down='')
  └─ fromFile('invalid-no-timestamp.sql', 1)
      → throws \InvalidArgumentException (skipped by promoter try/catch)

CorePromoter → scan /vendor/core-web/migrations/*.sql
  └─ same fromFile() discovery, priority=0
```

---

See also: [Runner](./Runner.md), [SqlMigrationDriver](./Driver/SqlMigrationDriver.md).

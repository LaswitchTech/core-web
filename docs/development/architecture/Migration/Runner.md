# Migration Runner

## File reference

- **Src path:** `src/Migration/Runner.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration`
- **Class:** `Runner` (immutable orchestrator)
- **Constructor params:**
  - `$promoters`: list of `MigrationPromoterInterface`, must be priority-sorted ascending
  - `$connection`: `Connection` for transaction management
  - `$activeDriver`: `'sqlite'`, `'mysql'`, or `'mariadb'`
  - `$registry`: `RegistryTable` (optional — defaults to new instance)

## Public API

### run(): list<string>

Discovers pending migrations across all promoters, deduplicates by version, sorts deterministically, and executes each pending up migration in a per-migration transaction against the active driver. Returns applied version keys on success or throws `RuntimeException` on first failure (no global rollback).

### rollback(?int $count): list<string>

Rolls back the most recent `$count` batches (defaults to 1), executing down SQL for every migration in reverse-app-order within each batch, also with per-migration transactions. Returns rolled-back version keys or throws `RuntimeException` on first failure or if target batch(s) not found.

## Deduplication Strategy

When multiple promoters contain a Migration with the same version key, **the highest-priority promoter wins** (lowest rank number). Promoters are processed in priority order; later promoters simply cannot contribute versions already seen.

## Transaction Model

| Scope | Behavior |
|-------|----------|
| Per-migration up | Begin → executeUp → commit or rollBack on failure |
| Per-migration down | Begin → executeDown → delete tracking record → commit or rollBack on failure |

On failure: previously applied migrations remain untouched; failed migrations are not inserted into __schema_migrations, so re-running `run()` retries the failed migration.

## Dialect Override Resolution

For each migration file `YYYYMMDDHHmmss_slug.sql`, the Runner delegates to `SqlMigrationDriver` which resolves up/down SQL sections as follows:

1. If a companion file matching the active driver exists (e.g., `.mysql.sql`), its full content replaces the base file's corresponding section
2. Falls back to the base file's `-- Up:` / `-- Down:` sections

---

See also: [Promoter](./Promoter/MigrationPromoterInterface.md), [SqlMigrationDriver](./Driver/SqlMigrationDriver.md).

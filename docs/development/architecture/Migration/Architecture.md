# Migration Subsystem — Architecture

## Overview

The Migration subsystem provides a deterministic, rollback-capable versioning layer for Core-Web database schemas. It discovers `.sql` migration files from core, application, and extension directories, deduplicates them by 14-digit timestamp prefix, executes SQL in driver-appropriate order with per-migration transactions, and persists version tracking records in `__schema_migrations`.

## Key Decisions

### Full rollback support (Phase 1)

Down SQL content is extracted at file-load time from the base `.sql` file or its dialect-specific companion (`.sqlite.sql` / `.mysql.sql`). The Runner executes down sections within a per-migration transaction on `rollback()`, not deferred to a future phase.

### Dialect-specific companion files

For each migration `YYYYMMDDHHmmss_slug.sql` the system looks for companion overrides:

| File | Purpose |
|------|---------|
| `YYYYMMDDHHmmss_slug.sqlite.sql` | SQLite-only up/down substitution |
| `YYYYMMDDHHmmss_slug.mysql.sql` | MySQL/MariaDB (alias) up/down substitution |

When a companion exists for the active driver, its non-empty up/down section overrides the corresponding base section; empty companion sections fall back to the base migration section.

### Deterministic discovery order

Execution priority is enforced numerically via `MigrationPromoterInterface::priority()`:

1. **Core migrations** — rank 0 (highest)
2. **Application migrations** — rank 1
3. (Extensions would be added in a future phase, rank 2+)

### Per-migration transaction semantics

Each applied migration is wrapped in its own database transaction and committed before the next one begins. On failure:

- The current migration's transaction is rolled back.
- Previously applied migrations remain untouched (no global rollback).
- Failed migrations are not inserted into __schema_migrations, so re-running retries the failed migration.

### No automatic execution

Migrations are not executed automatically on web requests. They are invoked explicitly via CLI or manual trigger only.

## Architecture Layers

```
┌───────────────────────────────────────────────┐
│  Runner (Runner.php)                          │  ← public API: run(), rollback()
├───────────────────────────────────────────────┤
│  Promoters (CorePromoter, AppPromoter)        │  ✓ file scanning + priority ordering
│  + MigrationPromoterInterface                  │
├───────────────────────────────────────────────┤
│  RegistryTable (RegistryTable.php)            │  ✓ __schema_migrations DDL + CRUD
├───────────────────────────────────────────────┤
│  SqlMigrationDriver (SqlMigrationDriver.php)  │  ✓ up/down execution + dialect overrides
├───────────────────────────────────────────────┤
│  Migration (Migration.php)                    │  ✓ immutable value object
└───────────────────────────────────────────────┘
```

## Bootstrap Wiring

Services are registered lazily via `Bootstrap::registerDbServices()` as singleton keys:

| Container key | Class | Purpose |
|--------------|-------|---------|
| `migration_registry` | `RegistryTable` | Shared schema-tracking DDL/CRUD |
| `migration_runner` | `Runner` | Orchestrator: dedup + sort + transaction loop |

The promoter directories are resolved from Config (`migrations.core_path`) and the application root (`$appRoot . '/migrations'`).

## Future Work

- Extension migration discovery (promoter rank 2+)
- Migration batch number display and selective rollback count APIs
- Dry-run / preview mode for web/admin console
- Version conflict resolution strategies (warn vs error on checksum mismatch)

---

See also: [Migration Value Object](./Migration.md), [Runner](./Runner.md), [Promoter interface](./Promoter/MigrationPromoterInterface.md), [SqlMigrationDriver](./Driver/SqlMigrationDriver.md).

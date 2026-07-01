# Database Seeding

**Phase 2D · V1.0**

## Purpose

Database seeding provides a mechanism to load initial or repetitive data into an application's database tables for provisioning, installation, demo environments, and test fixtures.

Seeds complement migrations: whereas migrations evolve the **schema**, seeds populate the **data**.

See [Migrations](./Migration.md) for the table versioning system; this document covers seed-level repetition of row/record data.

## Migrations vs Seeds

| Criterion | Migrations | Seeds |
|---|---|---|
| Responsibility | Schema evolution (`CREATE` / `ALTER` / `DROP`). | Data provisioning (`INSERT` / `UPDATE` / `DELETE`). |
| Tracking table | `\__schema_migrations` (version, file_path, checksum, applied_at). | `\__schema_seeds` (group_name, version, file_path, checksum, applied_at). |
| Execution model | Manual (`core.migrate`) or deferred to installer. | Manual (`$seeder->run('group')`). No automatic execution. |
| Re-execution | Per-migration transaction; skipped by version key. | Idempotent by SHA-256 checksum match on group+version key. |
| Directionality | Up / down (rollback) pairs. | Forward-only only. Rollback is not supported. |
| Companion files | `*.sqlite.sql`, `*.mysql.sql`, `*.mariadb.sql`. | Not supported — each seed is a single SQL file. |

Both systems use the same two-table pattern: an independently tracked registry (`__schema_migrations` / `__schema_seeds`) with checksum-based tamper detection applied via the framework's connection layer.

## V1.0 Scope

V1.0 provides:

- Deterministic seed discovery across core and application directories.
- Deduplication where the application directory overrides its core counterpart when sharing an identical filename (version + slug).
- Execution in order of timestamp prefix, then alphabetically by name within the same version.
- Per-seed SQL execution inside a database transaction with automatic rollback on failure.
- Application registration in `\__schema_seeds` keyed by `(group_name, version)` for idempotent re-runs.
- SHA-256 checksum verification at discovery time and tamper-fault detection on subsequent runs.

## Deferred Features

The following capabilities are **not** part of V1.0:

- Plugin / extension seed directories (only `core` + `app`).
- PHP callable seeds (e.g. `\Closure::class`). Only raw SQL files are supported.
- Automatic execution on boot (no lifecycle or installer auto-seeding).
- CLI command to trigger seeding (`core.seed` — deferred to Phase 2D follow-on).
- Dialect-specific companion seed files (each seed is a single SQL file).
- Seed grouping by environment beyond static directory names.
- Rollback / undo functionality for previously applied seeds.

## Seed Directory Layout

Seeds live in named group directories under a `seeds/` root:

```
CORE_WEB_ROOT/seeds/{group}/   ← framework-supplied defaults
$APP_ROOT/seeds/{group}/       ← application overrides and custom groups
```

Where:

- **`CORE_WEB_ROOT`** is the core-web framework root path. Core seed directories are discovered from `"{coreRoot}/seeds/{$group}"`.
- **`$APP_ROOT`** is the application root (detected during bootstrap). Application seed directories are discovered from `"{appRoot}/seeds/{$group}"`.

Both paths are scanned for every requested group. Missing directories produce no seeds silently — they do not cause errors or failures.

## Supported Groups

| Group | Purpose |
|---------|-----------------------|
| `default` | Everyday application data (core defaults). |
| `install` | Bootstrap / one-time installation records. |
| `demo` | Sample/demo datasets for evaluation. |
| `development` | Developer-friendly filler data. |
| `testing` | Deterministic test fixtures. |

Additional groups can be created by creating a new directory name under the `seeds/` root in either core or application paths. The loader's `load($group)` call accepts any string without predefined validation.

## SQL Seed Naming Convention

Each seed file must follow:

```
YYYYMMDDHHmmss_slug.sql
```

Example: `20260630140000_default_admin_user.sql`

Constraints:

- **Version** (`YYYYMMDDHHmmss`) is a sortable 14-digit Unix timestamp prefix. It provides deterministic ordering and deduplication identity.
- **Slug** is an underscore- or hyphen-separated descriptive name derived from the file stem.
- The `.sql` extension (case-insensitive) identifies SQL-only seeds.

Invalid filenames are silently skipped with a `[seeds] Skip malformed filename:` warning to STDERR. Timestamps that fail \DateTimeImmutable validation are similarly excluded.

## Seed Discovery Order

The `SeedLoader::load($group)` method discovers candidates in this deterministic order:

1. **Core seeds** — files under `CORE_WEB_ROOT/seeds/{group}/`.
2. **App seeds** — files under `$APP_ROOT/seeds/{group}/`.
3. **Deduplication** — if an app seed shares the same filename (version + slug) as a core seed, the app version replaces the core one. Core-only files are carried forward unchanged.
4. **Append** — all app seeds that have no core counterpart are appended to the result set.

The final list is sorted:

1. Version ascending (earliest timestamp first).
2. Source priority: core before app when versions match.
3. File path ascending as the final tie-breaker.

Sorting produces a single reproducible execution order regardless of environment or deployment topology.

## Core vs App Override Behavior

When both core and application directories contain seed files with **identical filenames** (same timestamp prefix and slug) within the same group, the app seed supersedes the core seeded output. This enables simple override behavior:

```
$CORE/seeds/default/20260630140000_app_name.sql   ← core definition
$app/seeds/default/20260630140000_app_name.sql    ← overrides above
```

When the app version is absent, the core version executes as-is. App-only seeds (files only present in the applications' directory) are included without filtering.

## Explicit Execution Only

Seeds must be triggered explicitly through the container binding:

```php
$seeder = $container->resolve('seeder');
$results = $seeder->run('default');
// Returns: [['status' => 'applied'|'skipped', 'group' => '<group>', 'version' => '<ts>', 'name' => '<slug>'], ...]
```

There is **no automatic seeding** on framework boot, during migrations, or through any other lifecycle hook. Every invocation of `$seeder->run($group)` is a deliberate provisioning action (one-shot at install time, explicit in tests, etc.).

   Calling `run(null)` executes all discovered seed groups sequentially in alphabetical group order (the loader's default behavior when group parameter omitted). The `'default'` string remains the primary group for normal application seeding.

## Registry Behavior

The seed tracking table (`__schema_seeds`) lives independently of migration history and stores per-seed provenance:

| Column | Type (SQLite) | Type (MySQL/MariaDB) | Purpose |
|------------|----------------------|---------------------------|------------------------------|
| `group_name` | `TEXT NOT NULL` | `VARCHAR(255) NOT NULL` | Seed group directory name; part of composite primary key with version. |
| `version` | `TEXT NOT NULL` | `VARCHAR(255) NOT NULL` | Seed timestamp prefix; composite identity key alongside `group_name`. |
| `file_path` | `TEXT` | `TEXT` | Absolute path to the seed SQL file at execution time. Stored by `RegistryTable::insert(group, version, filePath, checksum)` from the loader-resolved real path. |
| `checksum` | `TEXT` | `VARCHAR(64)` | SHA-256 hex digest of the seed file content at discovery time. Used for tamper detection on re-runs. Nullable for legacy rows created before checksum storage was introduced. |
| `applied_at` | `INTEGER DEFAULT (unixepoch())` | `INTEGER` | UNIX timestamp of when the seed was applied written explicitly by `RegistryTable::insert()`. SQLite also has a DDL default, but the framework supplies the value explicitly. |

The table is **dialect-aware**: composite primary key `(group_name, version)` on both SQLite and MySQL/MariaDB. Table creation via `\__schema_seeds::ensureTable()` picks the correct DDL at runtime; no manual setup is required.

### Columns Not Stored

Note that **`name`** (the slug extracted from the filename) is **not stored in the database**. It is only available on the `Seed` value object during discovery and is returned in `$seeder->run()` results as part of the result metadata. The group directory name, however, **is** tracked as `group_name` for cross-group idempotency.

## Idempotency Expectations

Running `$seeder->run('default')` multiple times is safe:

1. Every seed is read at discovery time with its current SHA-256 checksum computed.
2. `__schema_seeds` is queried for all applied version keys.
 3. Seeds whose `group_name` + `version` already exist in the registry are **skipped silently** (idempotent no-op).
4. Only unapplied seeds have their SQL executed inside an individual transaction.

Multiple identical runs produce exactly one application per seed regardless of call count.

## Checksum Conflict Behavior

 If a `group_name` + `version` pair exists in `__schema_seeds` but the stored checksum differs from the current file checksum, the framework **throws a `\RuntimeException`**:

```
Seed '20260630140000_app_name.sql' (v20260630140000) was applied with a different checksum.
Please review or remove the seed file.
```

This detects tampered, replaced, or divergent seed files. The user should either restore the original file, update the version prefix to bypass deduplication, or clear the relevant row from `__schema_seeds` before re-running.

Legacy rows with no stored checksum (the column is nullable in the schema) skip this check and are treated as applied without verification.

## Current Limitations

The following constraints apply to V1.0:

- **No plugin seeds** — Discovery is limited to core framework root (`CORE_WEB_ROOT/seeds/`) and application root (`$APP_ROOT/seeds/`). Plugin extension seed directories are not scanned.
- **No PHP callable seeds** — Only raw `.sql` files are supported. Callable or class-based seed handlers are not implemented.
- **No automatic execution** — Seeding is manual/explicit only via `$container->resolve('seeder')->run($group)`. No installer or lifecycle integration yet.
- **No permanent `core.seed` CLI command** — Only a validation-only `core.db seed-smoke` subcommand exists for smoke-testing seeding behavior during development. General-purpose CLI is deferred to a follow-on update.

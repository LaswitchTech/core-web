# Migrations & Seeding

Schema changes and seed data are managed as timestamped SQL files. Both
systems are **idempotent** — re-running them is always safe — and track what
has been applied in registry tables.

## Migrations

### Migration Files

Place migrations in `migrations/` at your app root:

```
migrations/
├── 20260901120000_create_users_table.sql
└── 20260902093000_add_index_to_users.sql
```

File name format: `YYYYMMDDHHmmss_slug.sql` (a valid calendar timestamp).
The timestamp is the migration **version** and determines execution order.

Each file contains the **up** SQL. Optionally, a `-- Down:` marker splits
off the **down** SQL used for rollbacks:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Down:
DROP TABLE users;
```

### Sources & Precedence

Migrations are discovered from multiple sources and **deduplicated by
version** (highest-priority source wins):

1. Kernel (core framework) migrations
2. Application migrations (`{appRoot}/migrations`)

You can override a kernel migration by providing the same version filename
in your app's `migrations/`.

### Running Migrations

The runner is available from the container:

```php
$c = \Laswitchtech\CoreWeb\Bootstrap::container();

$runner = $c->resolve('migration_runner');

$applied = $runner->run();           // apply all pending, in version order
$applied // => ['20260901120000', '20260902093000']

$runner->run();                      // idempotent: returns [] when nothing pending

$rolledBack = $runner->rollback(1);  // roll back the most recent batch
$runner->rollback(2);                // roll back the two most recent batches
```

### Guarantees

- **Per-migration transactions** — a failure rolls back only the failing
  migration; previously applied migrations stay intact.
- **Checksum tracking** — each applied migration's file checksum is stored;
  if you edit an *already-applied* migration, the runner warns and skips it
  (never silently re-applies changed SQL).
- **Registry table** — `__schema_migrations` stores version, timestamp,
  checksum, and batch number.
- **Batches** — every `run()` call that applies at least one migration is a
  batch; `rollback($count)` undoes whole batches, newest first.

### Registering a CLI Command

There is no built-in `core.migrate` command; register your own in a plugin:

```php
$router->command('app.migrate', function (Cli $req) use ($container): Response {
    $runner = $container->resolve('migration_runner');

    if (($req->arg(0) ?? 'up') === 'rollback') {
        $done = $runner->rollback((int) ($req->arg(1) ?? 1));
        return Response::text('rolled back: ' . implode(', ', $done) . "\n");
    }

    $applied = $runner->run();
    return Response::text(
        empty($applied) ? 'up to date' : 'applied: ' . implode(', ', $applied),
    );
});
```

## Seeding

### Seed Files

Seeds live in `seeds/{group}/` at your app root, using the same timestamp
file naming:

```
seeds/
├── default/
│   └── 20260901120000_admin_user.sql
└── demo/
    └── 20260901121000_demo_posts.sql
```

Seed SQL executes as-is (no `-- Down:` concept):

```sql
INSERT INTO users (name, email) VALUES ('admin', 'admin@example.com');
```

### Groups

Each subdirectory of `seeds/` is a **group** (e.g. `default`, `demo`).
Groups let you separate install data, demo data, and fixtures.

### Running Seeds

```php
$seeder = $c->resolve('seeder');

$seeder->run('default');   // run the "default" group
$seeder->run('demo');      // run the "demo" group
$seeder->run(null);        // run ALL groups
```

Results report `applied` / `skipped` per seed.

### Precedence & Idempotency

- App seeds **override** kernel seeds with the same group + filename.
- Applied seeds are tracked in `__schema_seeds` (version + checksum), so
  re-running a group is safe — already-applied seeds are skipped.

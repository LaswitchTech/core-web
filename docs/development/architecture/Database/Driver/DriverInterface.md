# DriverInterface

## Purpose

Marker contract shared by all database drivers. Defines a single factory method — `connect()` — that takes a configuration array and returns a `Connection` instance. The container wiring in `Bootstrap::registerDbServices()` uses this interface as the type-hint for driver resolution.

## Interface Definition

```php
namespace Laswitchtech\CoreWeb\Database\Driver;

interface DriverInterface {
    public function connect(array $config): Connection;
}
```

### `connect(array $config): Connection`

- **Parameter**: An associative configuration array. Keys differ by driver:
  - SQLite — `path` (absolute or relative database file; defaults to `'data/app.db'`), `basePath` (base directory for resolving relative paths; defaults to `getcwd()` when null/absent). Defaults apply when the key is absent from the config.
  - MySQL / MariaDB — `host`, `port`, `database`, `charset`, `username`, `password`, and optionally `dsn`. If `dsn` is provided as a non-empty string it is used verbatim; otherwise a DSN is built from the individual keys.
- **Returns**: A `$Connection` instance backed by a PDO connection. Defaults apply when any MySQL key is absent (e.g. `host → '127.0.0.1'`, `port → 3306`).
- **Throws**: `DatabaseException` on validation failure (PDO extension missing, empty path, mkdir failure), `PDOException` if the underlying driver fails during construction (wrapped and re-thrown as `DatabaseException`).

## Current Implementations

| Driver      | Class                                           | Bootstrap config key       |
|-------------|-------------------------------------------------|----------------------------|
| SQLite      | `Laswitchtech\CoreWeb\Database\Driver\Sqlite`   | `"sqlite"`                 |
| MySQL       | `Laswitchtech\CoreWeb\Database\Driver\Mysql`    | `"mysql"`                  |
| MariaDB     | `Laswitchtech\CoreWeb\Database\Driver\Mysql`*   | `"mariadb"` (alias → Mysql)|

\* MariaDB and MySQL share the same `Mysql` driver class; PDO's `pdo_mysql` extension handles both databases transparently. The distinction is purely at the configuration level — Bootstrap normalizes both `"mysql"` and `"mariadb"` values to the `Mysql` class.

## Files

- **Source**: `src/Database/Driver/DriverInterface.php`
- **Lines** : 17

---

## Extending with Future Drivers

Beyond SQLite and MySQL/MariaDB, any additional driver must implement the same interface:

```php
final class PostgreSQL implements DriverInterface {
    public function connect(array $config): Connection {
        // Parse config['host'], ['database'], ['username'], ['password'] etc.
        // Build a pdo_pgsql DSN or use dsn verbatim if provided.
        return new Connection(new PDO('pgsql:host=...;dbname=...', ...));
    }
}
```

Bootstrap wiring does not need to change for each driver — it only reads `database.driver` and resolves the appropriate driver class through a matcher/lookup table.

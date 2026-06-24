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

- **Parameter**: An associative configuration array. For Phase 1, the expected keys are:
  - `path` — relative or absolute path to the database file (defaults to `'data/app.db'` when absent).
  - `basePath` — base directory for resolving relative paths; defaults to `getcwd()` when null/absent.
- **Returns**: A `$Connection` instance backed by a PDO connection.
- **Throws**: `DatabaseException` on validation failure (PDO extension missing, empty path, mkdir failure), `PDOException` if the underlying driver fails during construction (wrapped and re-thrown as `DatabaseException`).

## Extending with New Drivers

A future MySQL driver would implement the same interface:

```php
final class Mysql implements DriverInterface {
    public function connect(array $config): Connection {
        // Parse config['dsn'] or build it from host/port/database credentials.
        $pdo = new PDO('mysql:host=...;dbname=...', 'user', 'pass', [...]);
        return new Connection($pdo);
    }
}
```

The bootstrap container wiring (which resolves `'db_driver'` from config) would remain unchanged — it only reads `config['database.driver']` and passes a flat array to the driver. The interface guarantees consistent behavior at the contract level regardless of which driver is active.

## Files

- **Source**: `src/Database/Driver/DriverInterface.php`
- **Lines** : 17

# DatabaseException

## Purpose

Exception class shared by the database layer when a fatal configuration or initialization error occurs (e.g. missing PDO extension, empty path, unreadable directory).

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Database\Error;

class DatabaseException extends \RuntimeException { }
```

- **Extends** `\RuntimeException` — standard PHP built-in exception class.
- No custom properties or methods beyond those inherited from `RuntimeException`.

## Usage

Thrown by:

| Component                     | When                                                         |
|-------------------------------|--------------------------------------------------------------|
| Sqlite::connect               | PDO extension `pdo_sqlite` is not loaded                     |
| Sqlite::connect               | Config path resolves to empty string                         |
| Sqlite::connect               | Parent directory cannot be created (`mkdir` fails)           |
| Sqlite::connect               | PDO SQLite connection failure                                |
| Mysql::connect                | PDO extension `pdo_mysql` is not loaded                      |
| Mysql::connect                | DSN override provided as empty string                        |
| Mysql::connect                | DSN auto-build requires database name (missing/non-empty)    |
| Mysql::connect                | PDO MySQL connection failure                                 |
| Bootstrap::registerDbServices | Unsupported database.driver value is configured              |

Each driver documents its own specific `DatabaseException` throw conditions in its dedicated documentation. The examples below show only patterns, not exhaustive lists for all drivers.

### Example — SQLite: Extension Missing

```php
// If $config['path'] is 'data/app.db' but pdo_sqlite is not loaded:
throw new DatabaseException('The PDO SQLite extension (pdo_sqlite) is not loaded.');
```

### Example — MySQL: Empty DSN

```php
// If $config['dsn'] is explicitly set to an empty string:
throw new DatabaseException('MySQL DSN must not be empty.');
```

### Example — Wrapper on PDO Failure (both drivers)

Both drivers wrap `\PDOException` and re-throw as `DatabaseException`, using their own message prefix:

**SQLite:**

```php
try {
    $pdo = new PDO('sqlite:path/to/file.db');
} catch (\PDOException $e) {
    throw new DatabaseException(
        "PDO SQLite connection failed: {$e->getMessage()}",
        0,
        $e
    );
}
```

**MySQL:**

```php
try {
    $pdo = new PDO($dsn, $username, $password, [...]);
} catch (\PDOException $e) {
    throw new DatabaseException(
        "PDO MySQL connection failed: {$e->getMessage()}",
        0,
        $e
    );
}
```

## Error Handling Context

The bootstrap `run()` method wraps its entire init chain (including `registerDbServices()`) in a single `try { … } catch (\Throwable) { … }` block, so `DatabaseException` will surface as a boot failure. No explicit try/catch exists inside the container wiring — failures propagate upward to the bootstrap's error handler (`die()` or stderr output for built-in server).

## Files

- **Source**  : `src/Database/Error/DatabaseException.php`
- **Line count**: 12

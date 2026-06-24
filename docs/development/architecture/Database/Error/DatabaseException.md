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

| Component       | When                                                              |
|-----------------|-------------------------------------------------------------------|
| Sqlite::connect | PDO extension `pdo_sqlite` is not loaded                          |
| Sqlite::connect | Config path resolves to empty string                              |
| Sqlite::connect | Parent directory cannot be created (`mkdir` fails)                |
| PDO constructor | Any underlying SQLite connection failure (wrapped in catch block)  |

### Example — Extension Missing

```php
// If $config['path'] is 'data/app.db' but pdo_sqlite is not loaded:
throw new DatabaseException('The PDO SQLite extension (pdo_sqlite) is not loaded.');
```

### Example — Wrapper on PDO Failure

```php
try {
    $pdo = new PDO('sqlite:path/to/file.db');
} catch (\PDOException $e) {
    throw new DatabaseException(  // ← new instance carrying original as previous
        "PDO SQLite connection failed: {$e->getMessage()}",
        0,                           // preserves original error-code
        $e                           // injected as the inner exception
    );
}
```

## Error Handling Context

The bootstrap `run()` method wraps its entire init chain (including `registerDbServices()`) in a single `try { … } catch (\Throwable) { … }` block, so `DatabaseException` will surface as a boot failure. No explicit try/catch exists inside the container wiring — failures propagate upward to the bootstrap's error handler (`die()` or stderr output for built-in server).

## Files

- **Source**  : `src/Database/Error/DatabaseException.php`
- **Line count**: 12

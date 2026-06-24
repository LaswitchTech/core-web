# Connection Class

## Purpose

Thin, final class wrapping a `PDO` instance. Provides typed convenience methods for the most common operations (query, prepare, transactions, last-insert-id) while remaining a pass-through to raw PDO — no ORM, no query building, no abstraction over fetch modes or parameter binding.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Database;

final class Connection {
    private ?PDO $pdo = null;  // nullable after explicit close (Phase 1 does not implement close).

    public function __construct(PDO $pdo);
    public function pdo(): PDO;
    public function query(string $sql): PDOStatement|false;
    public function prepare(string $sql): PDOStatement|false;
    public function beginTransaction(): bool;
    public function commit(): bool;
    public function rollback(): bool;
    public function lastInsertId(?string $name = null): string|false;
}
```

### Constructor

Accepts a `PDO` instance and stores it in the private `$pdo` property. Called only by drivers (e.g., `Sqlite::connect()`); applications never instantiate Connection directly — they resolve it from the container via `'db_connection'`.

## Methods

### `pdo(): PDO`

**Returns**: The underlying PDO instance.

Used when a caller needs driver-specific features not covered by the wrapper (e.g., SQLite's custom methods like `sqliteConnection()`). Always returns non-null in Phase 1 because Connection is constructed from a valid PDO and Phase 1 does not implement a `close()` method.

### `query(string $sql): PDOStatement|false`

Pass-through to `$this->pdo->query($sql)`. Returns `PDOStatement` on success, `false` on failure (since PDO::ERRMODE_EXCEPTION is **not** set in the driver — this should return a thrown exception; however, the method signature includes `false` for backward-compatibility with existing code that checks the boolean).

### `prepare(string $sql): PDOStatement|false`

Pass-through to `$this->pdo->prepare($sql)`. Returns `PDOStatement` on success, `false` on failure. Parameters are bound using native PDO methods (`bindValue`, `bindParam`) via the returned statement object — the wrapper does not add parameter binding helpers in Phase 1.

### `beginTransaction(): bool`

Pass-through to `$this->pdo->beginTransaction()`. Returns `true` on success. Raises `\PDOException` if a transaction is already active (PDO default behavior).

### `commit(): bool`

Pass-through to `$this->pdo->commit()`. Returns `true` on success. Throws `\PDOException` if no transaction is active.

### `rollback(): bool`

Pass-through to `$this->pdo->rollBack()`. Returns `true` on success. Throws `\PDOException` if no transaction is active.

### `lastInsertId(?string $name = null): string|false`

Returns the last inserted row ID from the active connection. `$name` parameter enables cross-SQL-implementation support (e.g., Oracle sequences); ignored by SQLite. Returns `false` when called before any insert or when a transaction is still in progress without an explicit commit.

The nullable `$name` is necessary because PDO's method signature differs between drivers: SQLite's `lastInsertId()` does **not** accept a parameter, while the interface must remain compatible with future MySQL bindings that may require it. A `@phpstan-ignore argument.type` annotation suppresses static-analysis warnings from PHPStan on calls like `$conn->lastInsertId()`.

## Usage Example

```php
$conn = $container->resolve('db_connection');

// Basic query:
$row = $conn->query("SELECT name FROM users WHERE id = 1")->fetch() ?: null;

// Prepared statement with transactions:
$conn->beginTransaction();
$stmt = $conn->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
$stmt->bindValue(1, 'Alice');
$stmt->bindValue(2, 'alice@example.com');
$stmt->execute();
$userId = $conn->lastInsertId();
$conn->commit();

// Raw PDO access:
$rawPdo = $conn->pdo();  // Use extension-specific PDO methods if needed.
```

## Limitations — Phase 1

| Gap                                | Reason                                                   |
|------------------------------------|----------------------------------------------------------|
| No `close()` / `disconnect()`      | PDO destructor handles teardown; no explicit close API.  |
| No `exec()` pass-through           | Not needed yet; raw connection via `pdo()` suffices.     |
| No result-set wrapper              | Returns native `PDOStatement` — caller controls fetch modes and iteration. |
| Error mode relies on driver config | PDO::ERRMODE_EXCEPTION set in Sqlite, but Connection does not enforce it. Future drivers must match. |

## Files

- **Source**: `src/Database/Connection.php`
- **Lines** : 77

# Sqlite Driver

## Purpose

Phase 1 default database driver. Implements `DriverInterface` for SQLite via PDO, handling path resolution (relative to `basePath` or absolute), parent directory creation, PDO instantiation with safety options, and best-effort PRAGMA configuration.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Database\Driver;

final class Sqlite implements DriverInterface {
    public function connect(array $config): Connection { … }
}
```

### Constructor

No constructor — the `connect()` method is a static-like factory that takes `$config` and returns a fully initialized `Connection`. This keeps the driver lightweight (zero-instance overhead if never resolved) and avoids state leakage between calls.

## `connect(array $config): Connection`

### Configuration Options

| Key        | Type              | Default                | Description                                            |
|------------|-------------------|------------------------|--------------------------------------------------------|
| `path`     | `string`          | `'data/app.db'`       | Relative or absolute path to the database file.        |
| `basePath` | `string\|false`   | `getcwd()` (if null)  | Base directory for resolving relative `path`.          |

### Execution Steps (in order)

1. **Extension check** — Verifies `pdo_sqlite` is loaded via `\extension_loaded()`. Throws `DatabaseException` if not present.
2. **Path extraction** — Reads `$config['path']`; falls back to `'data/app.db'`. Rejects empty string immediately with `DatabaseException`.
3. **Base path resolution** — Reads `$config['basePath']`; defaults to `getcwd()` when null/missing. If `getcwd()` returns `false` (should be impossible on normal operation), stores empty string as a fallback sentinel.
4. **Path resolution**:
    - Absolute paths (via the class's `isAbsPath()` method) are used directly.
    - Relative paths are joined with `$basePath` (after `\rtrim($basePath, '/')` and `\ltrim($path, '/')`).
5. **Directory creation** — Calls `\dirname($resolvedPath)` and checks if the parent directory exists via `\is_dir()`. If not, attempts `\mkdir($parentDir, 0755, true)`. Uses triple-check pattern (`!is_dir && !mkdir && !is_dir`) to handle race conditions; failure produces a `DatabaseException`.
6. **PDO construction** — Creates PDO with:
   - DSN: `"sqlite:{$resolvedPath}"`
   - Username/Password: both `null` (unauthenticated local file — standard for SQLite).
   - Options array (`array`: `[PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_PERSISTENT => false]`)
   - Wraps in try/catch `\PDOException` → re-throws as `DatabaseException(`…`, 0, $e)` to preserve the original exception chain.
7. **PRAGMA execution** (best-effort):
   - `PRAGMA journal_mode=WAL` — enables write-ahead logging for better concurrent read performance. Wrapped in try/catch; silently ignored on older SQLite builds (< 3.7.0).
   - `PRAGMA foreign_keys=ON` — enforces referential integrity at the engine level. Same silent failure treatment as journal_mode.
8. **Return** `new Connection($pdo)` — wraps the live PDO in the thin Connection class for the application.

### Path Resolution Algorithm (Detailed)

The helper function `isAbsPath(string $path): bool` determines whether a path is absolute:

1. Empty strings return `false`.
2. Starts with `/` → Unix absolute (`true`).
3. Matches Windows patterns (`X:\`, `\\?\`, etc.) → Windows absolute (`true`).
4. Otherwise → relative (`false`).

For relative paths, resolution is simple string concatenation: `"{$basePath}/{$path}"`. No symlink following or canonicalization is performed in Phase 1 — the resolved path is stored as-is.

## Helper Function

### `isAbsPath(string $path): bool`

Package-level helper defined at the bottom of `Sqlite.php` (after the class body, separated by a comment block). Uses static analysis patterns from the project — no trailing newline after the closing brace. Returns `true` for Unix- or Windows-style absolute paths; `false` for relative paths and empty strings.

6. **PRAGMA execution** (best-effort):
    - `PRAGMA journal_mode=WAL` — enables write-ahead logging for better concurrent read performance. Wrapped in try/catch; silently ignored if the PRAGMA is unsupported.
    - `PRAGMA foreign_keys=ON` — enforces referential integrity at the engine level. Same silent-failure treatment as journal_mode.
7. **Return** `new Connection($pdo)` — wraps the live PDO in the thin Connection class for the application.

### Path Resolution Algorithm (Detailed)

The class method `isAbsPath(string $path): bool` determines whether a path is absolute:

1. Empty strings return `false`.
2. Starts with `/` → Unix absolute (`true`).
3. Matches Windows patterns (`X:\`, `\\?\', etc.) → Windows absolute (`true`).
4. Otherwise → relative (`false`).

For relative paths, resolution is simple string concatenation: `"{$basePath}/{$path}"`. No symlink following or canonicalization is performed in Phase 1 — the resolved path is stored as-is.

## Class Member Helper

### `isAbsPath(string $path): bool`

Private static method on the `Sqlite` class. Returns `true` for Unix- or Windows-style absolute paths; `false` for relative paths and empty strings.

Regex breakdown for Windows detection:
```
#^[A-Za-z]:[/\\\\]|^\\\\[|\\\\\\\\[?\?\\\\]#
```
- `[A-Za-z]:[/\\]` — letter-colon-slash or backslash (e.g., `C:\`, `D:/`)
- `^\\\\[` — UNC prefix like `\\server\share`
- `\\\\[?\?\\\\` — Win32 extended-length path prefix `\??\path`

## Files

- **Source**: `src/Database/Driver/Sqlite.php`
- **Lines** : 127

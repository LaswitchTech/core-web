# Configuration Manager

## Overview

The `Config` class provides a static, minimal configuration loader for Core-Web. It loads ordered JSON `.cfg` files, deep-merges them (later files override earlier), and exposes dot-notation key access.

This is the day-one implementation — focused on framework bootstrap. A richer Configuration Manager with typed getters, schema validation, runtime persistence, and hot-reload will follow when the formal configuration task begins.

## File Format

Configuration files use `.cfg` extension and contain JSON:

```json
{
  "app": {
    "name": "My Application",
    "debug": false
  },
  "database": {
    "driver": "sqlite",
    "path": "./data/app.db"
  }
}
```

## Loading and Merging

### Configurations Resolved in Order

| Step | File           | Required? | Purpose                              |
|------|----------------|-----------|--------------------------------------|
| 1    | `core.cfg`     | Yes       | Framework-level defaults             |
| 2    | `local.cfg`    | No        | User/application overrides           |

### Merge Strategy: Deep Override

Later files are **deep-merged** on top of earlier ones. The algorithm recurses into arrays, replacing keys that exist in both. Scalar types (strings, integers, booleans, null) and non-array values always override. `null` as a value in the later file deletes the key entirely:

```php
// core.cfg  → {"database": {"host": "localhost", "port": 3306}}
// local.cfg → {"database": {"host": "127.0.0.1"}}

// Result after deep-merge:
// {"database": {"host": "127.0.0.1", "port": 3306}}
```

**Deep merge rules:**

| `base[key]` type | `override[key]` type          | Result                                    |
|------------------|-------------------------------|-------------------------------------------|
| `array`          | `array`                       | Recursive deep merge (both must be arrays)|
| `scalar/anything` | `null`                       | **Key deleted** from result               |
| `anything`       | `scalar/array/object/partial-null` | **Full override** — no merging        |

This means if a base value is `{ "x": { "a": 1, "b": 2 } }` and the override is `{ "x": null }`, the `x` key is completely removed.

### Config Path Resolution (via Bootstrap)

The bootstrap resolves config file paths during construction:

1. Check CWD-relative path first (`./config/core.cfg`)
2. Fall back to framework vendor path (`<vendor>/laswitchtech/core-web/config/core.cfg`)
3. Stop at the first match for each file — prevents duplicate loading when CWD and vendor point to overlapping locations
4. `local.cfg` follows the same search order but is optional

This dual-location strategy allows config bundles to live both in user projects and within the framework package itself.

## Public API

### `load(string[] $paths): void`

Loads and merges one or more `.cfg` JSON files. Must be called before any other static method:

```php
Config::load([
    '/path/to/core.cfg',
    '/path/to/local.cfg',
]);
```

Throws `\JsonException` if a file fails to decode.

### `get(string $key, mixed $default = null): mixed`

Retrieves a value using dot-notation path access:

```php
// {"app": {"name": "CoreWeb", "debug": false}}

Config::get('app.name');        // 'CoreWeb'
Config::get('app.debug');       // false
Config::get('database.host');   // null (default) — key does not exist
Config::get('database.host', 'localhost');  // 'localhost' (explicit default)
```

### `all(): ?array`

Returns the complete configuration payload. Returns `null` if no config has been loaded:

```php
$config = Config::all(); // array|null — read-only reference to internal state
```

## Design Decisions

### Why Static Only?

The configuration system is a static singleton during bootstrap because:
1. Configuration is immutable after bootstrap completes (no hot-reload in day one)
2. No need for instance scoping (there's only one global configuration per process)
3. The container will be used to resolve a proper Config service instance when persistence and schema validation are added

This avoids circular dependency problems: the container itself needs `config` to initialize, so config must exist before the container exists — making it impossible to construct it as an injected object.

### Why Not `.env` or PHP Files?

- **`.env`** requires a separate parser; JSON natively supports arrays and nesting
- **PHP include/require** is executable and risky for config payloads (could contain arbitrary code)
- **YAML/XML** require external extensions; JSON is built-in to PHP

### Why Deep Merge Over Simple array_merge?

Shallow `array_merge()` overwrites nested arrays entirely, losing deep defaults:

```php
// With shallow merge, user's DB connection details would lose all
// framework-level settings (driver, prefix, timeout) the moment they add one key.

// Deep merge preserves untouched keys from core.cfg regardless of override depth.
```

### Future Runtime Persistence

The current implementation has **no write/save mechanism**. Configuration is loaded once at bootstrap and never written back to disk. The future configuration manager will need:
- A `save(string $key, mixed $value): void` method for runtime overrides (e.g., admin settings)
- Serialization logic that mirrors merge semantics on save
- Schema validation against registered config schemas

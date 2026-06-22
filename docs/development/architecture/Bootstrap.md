# Bootstrap Component

## Purpose

The Bootstrap component orchestrates the deterministic initialization chain for a Core-Web application, ensuring both WEB and CLI modes start from an identical, well-defined state through a shared prefix of config loading, container creation, and extension discovery.

## Responsibilities

_(none)_

## Public API

### Class Constants

| Constant | Value |
|----------|-------|
| `MODE_WEB`  | `'WEB'` |
| `MODE_CLI`  | `'CLI'` |

### Constructor

```php
__construct(string $mode): void
```

- Accepts `'WEB'` or `'CLI'`.
- Throws `\InvalidArgumentException` if mode is not one of the above.
- Runs the full init chain (Config → Container → Core Services → Extensions → Mode-Specific) and exits on failure.

### Static Methods

| Signature | Returns | Throws |
|-----------|---------|--------|
| `static container(): \Laswitchtech\CoreWeb\Container` | The initialized DI container instance. | `\RuntimeException` if bootstrap has not run yet. |

## Internal Architecture

### Initialization Chain (run())

The constructor invokes `run()` which executes this exact sequence:

1. Calls `initConfig()` → reads `config/core.cfg`, merges `config/local.cfg`, populates the Config singleton.
2. Calls `initContainer()` → creates a new Container; stores it in static `$CONTAINER`; registers core services (config, container proxy, hook registry).
3. Calls `initExtensions()` → discovers and instantiates all extensions (see below).
4. Conditionally calls `bootWeb()` (if mode is MODE_WEB) or `bootCli()` (if MODE_CLI).

### Configuration Storage

```php
private static $CONTAINER; // Container
```

- Single global entry point accessed via `static container()`.
- Returns null if bootstrap has not run yet.

### Extension Discovery Mechanism

`initExtensions()` walks all subdirectories under two paths:
- `{appRoot}/ext/themes/` — loads theme manifest.json into Config.
- `{appRoot}/ext/plugins/` — instantiates each plugin class (must have a valid `plugin-class` key in manifest) and registers it with the container via `$c->set($className, $instance)`.

The discovery loop does not validate dependencies or enforce ordering currently.

### Path Resolution

- `resolveAppRoot()` detects running inside a Composer package (`vendor/` detection), uses that as app root (framework is used as a package).
- `resolveConfigPaths()` returns an explicit two-element array: `{appRoot}/core.cfg` + optional `{appRoot}/local.cfg`. This list populates Config via the singleton.

## Dependencies

---

## Lifecycle

---

## Future Enhancements

---

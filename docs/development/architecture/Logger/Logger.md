---
title: "Logger"
status: "completed"
tags: ["Logger"]
---

# Logger

## Overview

The `Logger` class writes contextual log entries to per-channel files on disk. It provides level-based filtering, graceful degradation (STDERR fallback on filesystem errors), and channel separation through directory-based log file organization.

Loggers are constructed via a container-registered factory (`logger_factory`) or by resolving named singletons such as `logger`, `logger.app`, `logger.error`, etc.

## Config Keys (core.cfg)

Configured under the `"logging"` key in `config/core.cfg`:

| Config key | Default | Purpose |
|-----------|---------|---------|
| `logging.enabled` | `true` | Whether logging writes are active. When `false`, all log calls return immediately without I/O. |
| `logging.level` | `"debug"` | Minimum severity level for entries to pass filtering. Accepted values (case-insensitive): `"debug"`, `"info"`, `"warning"`, `"error"`, `"critical"`. Defaults to `"debug"` if the value is not a non-empty string. |
| `logging.path` | `"log"` | Relative subdirectory under the application root where log files are written. Trims leading/trailing slashes and backslashes before use. Defaults to `"log"` when empty or not a string. |

```jsonc
// config/core.cfg
{
    "logging": {
        "enabled": true,
        "level": "debug",
        "path": "log"
    }
}
```

## Constructor Arguments

```php
new Logger(
    string $channel,          // Log channel name (validated & normalized — see below)
    string $basePath,         // Application root directory (e.g. /var/www/app)
    string $relativePath = 'log', // Subdirectory under basePath for logs
    bool   $enabled = true,       // Whether logging is active
    Level  $minimumLevel = Level::DEBUG, // Minimum severity threshold
)
```

All constructor parameters except `$channel` are `readonly` properties on the final class. Logging state (`$enabled`, `$minimumLevel`) is determined at construction time — it cannot be changed after instantiation.

### Channel Validation

The channel name must match the following regex:

```regex
/^[a-z][a-z0-9_-]*$/i
```

Meaning: starts with a letter, followed by zero or more lowercase letters, digits, underscores, or hyphens. Invalid channels throw `InvalidArgumentException` at construction time with details about the invalid channel and the expected pattern.

### Channel Normalization

After validation, the channel name is loweredcased (`strtolower()`) before use in file paths and log output. For example, a logger constructed with `"HelloWorld"` will produce `helloworld.log` on disk and display `helloworld` in all log entries.

## File Path Behavior

Log files are written to:

```
{appRoot}/{logging.path}/{channel}.log
```

Examples (with defaults of `path = "log"`, `channel = "hello"`):

| Scenario | Resolved path |
|----------|--------------|
| Default config, app root `/var/www` | `/var/www/log/hello.log` |
| Custom path `"data/"`, channel `"error"` | `/var/www/data/error.log` |
| Path `"log/"` (trailing slash trimmed) | `/var/www/log/channel.log` |

Directories are created **lazily** on first successful `is_dir()` failure using `@mkdir(dirname, 0755, true)`. The directory is not created until the first log entry for that channel is written.

## Log Format

Each log entry uses `\t` (tab) as field separator:

```
[<ISO-8601 timestamp with timezone & microseconds>]\t[<channel>:<LEVEL>]\t<message>\t<context>
```

| Field | Detail |
|-------|--------|
| `<timestamp>` | ISO-8601, microsecond precision + UTC offset (e.g. `2026-06-25T14:30:00.123456+00:00`) |
| `<channel>` | Lowercased channel name |
| `<LEVEL>` | Uppercase enum case name (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) |
| `<message>` | The logged message string |
| `<context>` | JSON-encoded context object or `"-"` |

### Context Formatting

| Condition | Output |
|-----------|--------|
| `$context === []` | Literal dash: `"-"` |
| Non-empty `$context` | `json_encode($context, JSON_UNESCAPED_SLASHES \| JSON_UNESCAPED_UNICODE)` |
| `json_encode()` returns `false` on failure | Fallback: `'{"_error":"context_json_encode_failed"}'` |

Example entry:

```
[2026-06-25T14:30:00.123456+00:00]	helloworld:INFO	Hello logger smoke	{"source":"hello.log"}
```

### Convenience Methods

The class provides level-specific helpers as shorthand for `$this->log()`:

| Method | Level |
|--------|-------|
| `debug(string $msg, array $ctx = [])` | `Level::DEBUG` (0) |
| `info(string $msg, array $ctx = [])` | `Level::INFO` (1) |
| `warning(string $msg, array $ctx = [])` | `Level::WARNING` (2) |
| `error(string $msg, array $ctx = [])` | `Level::ERROR` (3) |
| `critical(string $msg, array $ctx = [])` | `Level::CRITICAL` (4) |

All return `$this` for potential call chaining.

## Filesystem Behavior

| Aspect | Detail |
|--------|--------|
| **Directory creation** | Lazy via `@mkdir($dir, 0755, true)`. The `@` prefix suppresses filesystem warnings; a thrown exception is only raised if both `mkdir` returns `false` and `is_dir()` subsequently reports the directory does not exist. |
| **File writing** | Uses `file_put_contents($file, $line, FILE_APPEND \| LOCK_EX)` — appends atomically with an advisory file lock. Any prior content in an existing file is preserved. |
| **Warning suppression** | Both `@mkdir()` and `@file_put_contents()` are prefixed with `@` to suppress PHP warnings (e.g., from permission errors race conditions). The functions operate silently; failures are handled via return checks or the catch block. |
| **Never throws from logging** | Write failures inside the `try` block trigger a fallback to STDERR rather than propagating an exception. This design ensures that logging itself never causes application crashes. |
| **STDERR fallback** | When all file I/O fails (caught via `\Throwable`), entries are written to STDERR using `@fwrite(STDERR, ...)` with `@` prefix to prevent STDERR-related warnings from surfacing in edge cases where the stderr descriptor is closed or unavailable. The STDERR output includes a compact timestamp, channel, level, and message — no context JSON (to avoid encoding cost on failure). |

## Bootstrap Service Registration (`src/Bootstrap.php`)

The `registerLoggerServices()` method registers the following container services during bootstrap:

| Service key | Type | Channel / Detail |
|------------|------|-----------------|
| `logger_factory` | Closure (shared) | A callable factory `(string $channel): Logger` that accepts any channel name and returns a new `Logger` instance configured with the shared settings (`$appRoot`, `$enabled`, `$minimumLevel`). Callers can create additional channels dynamically. |
| `logger` | Singleton | Resolves to `new Logger('app', ...)` — the default/primary application logger. |
| `logger.app` | Singleton | Same as `logger` — named `"app"` channel. |
| `logger.error` | Singleton | Named `"error"` channel. |
| `logger.database` | Singleton | Named `"database"` channel. |
| `logger.auth` | Singleton | Named `"auth"` channel. |
| `logger.migration` | Singleton | Named `"migration"` channel. |
| `logger.debug` | Singleton | Named `"debug"` channel. |

All named singletons pass through the shared `$loggerFactory`, so they all share the same base path, enabled/disabled state, and minimum level configuration from `Core.cfg`. Additional channels (not pre-registered) can be obtained at runtime by invoking `logger_factory`:

```php
$factory = $container->resolve('logger_factory');
$otherLogger = $factory('my-custom-channel'); // creates a new Logger instance dynamically
```

## Smoke Test — `hello.log` CLI Command

The `hello-world` plugin provides a CLI smoke command `hello.log` (`php cli hello.log`) that:

1. Resolves a logger from the container, trying `logger.hello` first and falling back to `$c->resolve('logger_factory')('hello')` if not present.
2. Writes an info-level entry: `'Hello logger smoke'` with context `['source' => 'hello.log']`.
3. Resolves `app_root` from the container and constructs the expected log file path using `Config::get('logging.path', 'log')`.
4. Verifies the log file exists on disk via `is_file()`.
5. Reads the file content and confirms it contains the string `'Hello logger smoke'`.
6. Returns `"Logger OK\n"` on success.

This command is documented in `ext/plugins/hello-world/README.md` alongside other smoke commands (hello.world, hello.render, hello.db, hello.query, hello.migrate).

## Deferred Work

The following Logger features are tracked as future considerations:

| Item | Priority | Description |
|------|----------|-------------|
| Log rotation | — | Size- or time-based log file rotation to prevent unbounded growth. |
| Log compression | — | Compress rotated log files (e.g., gzip) to save disk space. |
| PSR-3 adapter | — | Implement `Psr\Log\LoggerInterface` to allow the Logger to be used in place of any PSR-3-compatible logger. |
| Admin log viewer | — | Admin panel endpoint for inspecting log files via a web interface (filtering, searching, tailing). |
| External sinks | — | Ability to forward log entries to external services (e.g., syslog, HTTP/HTTPS webhook, cloud logging API). |
| Per-channel config overrides | — | Granular configuration allowing each channel to override its own minimum level or path independently of the global defaults. |

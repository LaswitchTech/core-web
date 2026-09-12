# Core Plugin

The Core plugin is the framework's built-in testing harness and
infrastructure plugin. It is locked (cannot be disabled) and provides
CLI commands for database operations, configuration management,
installation checks, extension lifecycle, and messaging smoke tests.

## What It Provides

- CLI commands for database CRUD operations and connectivity checks
- Configuration show/set/unset commands
- Installation pre-flight checks
- Application scaffolder (`core.init`)
- Extension lifecycle management (list, status, enable, disable)
- SMTP and SMS smoke-test senders
- A `smoke` helper for integration testing

## CLI Commands

### `core.info`

Displays framework version, PHP version, loaded extensions, and
environment info.

```sh
php cli core.info
```

### `core.db`

Database operations. Supports SQLite (default) and MySQL.

```sh
# Test connectivity
php cli core.db connect

# Read all rows from a table
php cli core.db read users

# Create a table
php cli core.db create users "id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE"

# Insert a row
php cli core.db update users "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')"

# Delete a row
php cli core.db delete users "WHERE id = 1"

# Run a full smoke test (create, insert, read, update, delete, drop)
php cli core.db smoke

# Seed the smoke test table with sample data
php cli core.db seed-smoke
```

Supported WHERE operators: `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE`.

### `core.config`

Inspect and modify configuration at runtime.

```sh
# Show all config
php cli core.config show

# Show a specific key
php cli core.config show database.driver

# Set a value (writes to local.cfg)
php cli core.config set application.name "My App"

# Remove a key
php cli core.config unset application.name
```

### `core.install`

Pre-flight checks for production readiness.

```sh
# Run all checks
php cli core.install check

# Execute setup steps (create storage dirs, generate router config)
php cli core.install run
```

Checks include: writable storage directory, valid config files,
database connectivity, and required PHP extensions.

### `core.init`

Scaffold a new application directory.

```sh
php cli core.init ./my-app
php cli core.init ./my-app --force
```

### `core.extension`

Manage plugin/theme lifecycle.

```sh
# List all extensions
php cli core.extension list

# Check status of a specific extension
php cli core.extension status administration

# Enable an extension
php cli core.extension enable my-plugin

# Disable an extension
php cli core.extension disable my-plugin
```

### `core.smtp send`

Send a test email via the configured SMTP provider.

```sh
php cli core.smtp send "recipient@example.com" "Test Subject" "Test Body"
```

### `core.sms send`

Send a test SMS via the first available SMS provider.

```sh
php cli core.sms send "+15551234567" "Hello from Core-Web"
```

## PHP Helper: `smoke`

Registered as a view helper for integration testing:

```php
// In a view or test
$result = smoke('db');       // Run DB smoke test
$result = smoke('config');   // Verify config loads
```

## Configuration

This plugin reads standard framework config sections:

| Key | Purpose |
|-----|---------|
| `database.*` | Connection settings for `core.db` commands |
| `smtp.*` | SMTP settings for `core.smtp send` |
| `sms.*` | SMS provider settings for `core.sms send` |

## Dependencies

None. This is a base plugin that other plugins may depend on.

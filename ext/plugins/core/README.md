# Core Plugin

Temporary plugin for core CLI commands (database connectivity, smoke testing, system info).

## Commands

- `core.info` — Placeholder echo (prints "Core OK")
- `core.db <subcommand>` — single dispatcher for all database subcommands

### core.db subcommands

#### connect
Validate configured database connectivity.
```sh
php cli core.db connect
```
Returns: `Database OK: <driver>` or `Database FAILED: <reason>`

#### smoke
Full CRUD smoke test — creates a temporary `core_db_smoke` table and exercises CREATE / READ / UPDATE / DELETE cycle.
```sh
php cli core.db smoke
```
Returns: `Core DB Smoke OK` or `Core DB Smoke FAILED: <reason>` (status 500).

#### read <table> [where]
SELECT rows with optional where clause (`<column> <operator> <value>`).
- Supported operators: `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE`
- Example: `php cli core.db read users "id = 42"`
- WHERE expressions must be quoted so they are passed as one CLI argument.

#### create <table> <json-data>
INSERT a row from JSON data.
- JSON must decode to a non-empty object with valid column name keys
- All keys must match `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- Example: `php cli core.db create users '{"name":"Alice","active":true}'`
- Returns: `Created: <affected_rows>`

#### update <table> <json-data> <where>
UPDATE rows from JSON data.
- WHERE condition is **required** (prevents accidental full-table updates)
- Where expression format: `<column> <operator> <value>`
- Supported operators: `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE`
- Example: `php cli core.db update users '{"name":"Bob"}' "id = 1"`
- Returns: `Updated: <affected_rows>`

#### delete <table> <where>
DELETE rows with required where clause.
- WHERE condition is **required** (prevents accidental full-table deletes)
- Where expression format: `<column> <operator> <value>`
- Supported operators: `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE`
- Example: `php cli core.db delete users "id = 1"`
- Returns: `Deleted: <affected_rows>`

See `ext/plugins/core/src/Core.php` for the registration hook callback signature.

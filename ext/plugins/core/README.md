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

#### seed-smoke
Validates the database seeding subsystem.
```sh
php cli core.db seed-smoke
```
- Creates a temporary `core_seed_smoke` table (seed group).
- Inserts a single row via the seed file.
- Verifies the row was inserted correctly.
- Reruns the seed to confirm idempotent skip behavior on the second execution.

### core.smtp subcommands

#### send <EMAIL_ADDRESS> <SUBJECT>

Sends a test email via the configured SMTP provider using the default `Default` template (`Templates/mail/Default.json`).

```sh
php cli core.smtp send user@example.com "Test subject"
```

- **Requirements**: SMTP must be configured and enabled in the application config. When no SMTP settings are present, the command returns an error (status 500).
- **Variables injected into the template**: `AppName`, `Subject`, `RecipientName`, `Body`, `Greetings`, `AppUrl`, `CurrentYear`, `Preheader`, `ActionUrl`, `ActionLabel`, `TermsUrl`, `PrivacyUrl`, `SupportUrl`, `Copyright`, `AppLogo`.
- **Success**: prints `Mail to <EMAIL>: OK`
- **Failure**: prints `core.smtp send FAILED: <reason>` with status 500.

### core.sms subcommands

#### send <PHONE> <SUBJECT>

Sends a test SMS via the registered default SMS provider using the default `Default` template (`Templates/sms/Default.json`).

```sh
php cli core.sms send +1234567890 "Test subject"
```

- **Requirements**: A default SMS provider must be registered in the config. When no provider is configured, the command returns an error (status 500).
- **Variables injected into the template**: `subject`, `app_name` (from config), `sent_at` (current timestamp).
- **Success**: prints `SMS to <PHONE>: OK (<message_id>)`
- **Failure**: prints `SMS to <PHONE> FAILED: <reason>` with status 500.

### Test Templates

The CLI commands use different default templates:

| Template | Path | Variables |
|----------|------|-----------|
| Mail     | `Templates/mail/Default.json` | `AppName`, `Subject`, `RecipientName`, `Body`, `Greetings`, `AppUrl`, `CurrentYear`, `Preheader`, `ActionUrl`, `ActionLabel`, `TermsUrl`, `PrivacyUrl`, `SupportUrl`, `Copyright`, `AppLogo` |
| SMS      | `Templates/sms/Default.json` | `subject`, `app_name`, `sent_at` |

### core.extension subcommands

#### list

Lists all discovered extensions or filters by type.

```sh
php cli core.extension list [plugins|themes]
```

- Without arguments, lists both plugins and themes.
- Pass `plugins` or `themes` to filter by type.

#### status

Display extended information about an extension.

```sh
php cli core.extension status [plugin.<slug>|theme.<slug>]
```

- Selectors are **singular**: use `plugin.<slug>` for a plugin or `theme.<slug>` for a theme.
- Without arguments, displays the enabled/disabled overview.

#### enable

Enables an extension so it is loaded on the next bootstrap.

```sh
php cli core.extension enable plugin.<slug>|theme.<slug>
```

- Selectors are **singular**: use `plugin.<slug>` or `theme.<slug>`.
- Locked extensions **cannot** be enabled via this command.
- Changes take effect on **next bootstrap / CLI run**.

#### disable

Disables an extension so it is no longer loaded on the next bootstrap.

```sh
php cli core.extension disable plugin.<slug>|theme.<slug>
```

- Selectors are **singular**: use `plugin.<slug>` or `theme.<slug>`.
- Locked extensions **cannot** be disabled via this command.
- Changes take effect on **next bootstrap / CLI run**.

See `ext/plugins/core/src/Core.php` for the registration hook callback signature.

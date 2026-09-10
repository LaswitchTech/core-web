# Configuration

Core-Web configuration is plain JSON in `.cfg` files. There is no required
configuration beyond `config/core.cfg` — every subsystem has a working
default.

## Files

| File | Purpose |
|------|---------|
| `config/core.cfg` | Application configuration. Checked in. |
| `config/local.cfg` | Local overrides. Gitignored. Same schema, partial is fine. |
| `config/extensions.cfg` | Extension lifecycle state (enabled/disabled). Managed by the framework; do not hand-edit casually. |
| `config/smtp.cfg` | SMTP credentials (optional; merged over `core.cfg`'s `mail` section). |
| `config/sms.cfg` | SMS provider credentials (optional). |
| `config/router/` | Generated web-server router files (`.htaccess`, `nginx.conf`, `web.config`). |

**Merge order:** `core.cfg` is loaded first, then `local.cfg` on top. For a
given key, the value in `local.cfg` wins. Missing keys simply keep the
`core.cfg` value or the framework default.

## Reading Configuration

### From PHP

```php
use Laswitchtech\CoreWeb\Config;

Config::get('app.name');                 // "My App"
Config::get('database.driver', 'sqlite'); // value or fallback default
```

Keys use dot notation. `Config::get('database.driver')` reads
`database → driver`.

In views, the `config` helper wraps the same API:

```php
<?php echo $helpers->config->get('app.name'); ?>
```

### From the CLI

```sh
./cli core.config show              # dump the merged configuration
./cli core.config show database     # one section
./cli core.config set app.debug true
./cli core.config unset app.debug
```

`set` and `unset` write to **`local.cfg` only** — `core.cfg` is never
modified at runtime, so committed defaults stay stable per environment.

## Reference: `core.cfg` Sections

### `app`

| Key | Default | Description |
|-----|---------|-------------|
| `name` | — | Application name (used in layout, CLI output). |
| `debug` | `false` | Verbose error output. Keep `false` in production. |
| `timezone` | — | PHP timezone for the application. |
| `locale` | — | Application locale. |

### `database`

| Key | Default | Description |
|-----|---------|-------------|
| `driver` | `sqlite` | `sqlite` or `mysql`. |
| `path` | `data/app.db` | SQLite file path (relative to app root). |
| `host` | — | MySQL host. |
| `port` | — | MySQL port. |
| `database` | — | MySQL database name. |
| `charset` | — | MySQL charset. |
| `username` | — | MySQL username. |
| `password` | — | MySQL password. |
| `dsn` | — | Explicit DSN override (wins over the other MySQL keys when set). |

SQLite is the zero-setup default: the first connection creates the file.

### `mail`

| Key | Description |
|-----|-------------|
| `driver` | Currently `smtp`. |
| `host`, `port`, `encryption` | SMTP server settings. |
| `username`, `password` | SMTP authentication. |
| `from_address`, `from_name` | Default sender. |

Credentials can also live in `config/smtp.cfg`, which is merged on top of
the `mail` section. See [Messaging & Logging](10-messaging-and-logging.md).

### `admin`

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | — | Enable the admin panel at `path`. |
| `path` | — | URL prefix for the admin panel. |
| `username` | — | Admin username. |
| `password_hash` | — | `password_hash()` output. |

### `session`

| Key | Default | Description |
|-----|---------|-------------|
| `driver` | `file` | Session handler. |
| `lifetime` | `120` | Session lifetime in seconds. |
| `path` | — | Session storage path. |

### `logging`

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | — | Master switch for file logging. |
| `level` | `debug` | Minimum level written (`debug`, `info`, `warning`, `error`, `critical`). |
| `path` | `log` | Log directory (relative to app root). |

### `renderer`

| Key | Default | Description |
|-----|---------|-------------|
| `default` | `php` | Default template engine (`php` or `latte`). |
| `latte.cache_path` | `storage/cache/renderer/latte` | Latte compiled-template cache. |
| `latte.strict_mode` | — | Latte strict mode. |
| `latte.debug_mode` | — | Latte debug output. |
| `less.cache_dir` | — | Compiled-LESS cache directory. |

## Local Overrides in Practice

Keep environment-specific values out of `core.cfg`:

`config/local.cfg`:

```json
{
    "database": {
        "driver": "mysql",
        "host": "127.0.0.1",
        "database": "prod",
        "username": "app",
        "password": "secret"
    },
    "logging": {
        "level": "warning"
    }
}
```

Everything not mentioned above inherits from `core.cfg`.

# Core-Web User Guide

Task-oriented guide for building applications with the Core-Web framework.
If you need component-level internals (design decisions, class responsibilities),
see [Development Architecture](../development/architecture/).

## Who This Guide Is For

Developers creating an application on top of `laswitchtech/core-web`:

- You want to set up a runnable app in minutes.
- You want to understand how routing, rendering, database access, assets,
  and extensions fit together.
- You want to build your own plugins or themes.

## Chapters

| # | Chapter | What You'll Learn |
|---|---------|-------------------|
| 1 | [Getting Started](01-getting-started.md) | Requirements, app skeleton, running the app and CLI |
| 2 | [Configuration](02-configuration.md) | Config files, merge order, all config sections, CLI config tooling |
| 3 | [Routing & Requests](03-routing-and-requests.md) | Web routes, CLI commands, request/response objects |
| 4 | [Rendering](04-rendering.md) | Layout → template → view pipeline, PHP & Latte engines |
| 5 | [Database](05-database.md) | Drivers, query builders, transactions, raw PDO |
| 6 | [Migrations & Seeding](06-migrations-and-seeding.md) | Schema migrations, rollback, seed groups |
| 7 | [Assets](07-assets.md) | CSS/JS registry, LESS compilation, asset delivery |
| 8 | [Helpers](08-helpers.md) | Core helper API, using helpers in views, custom helpers |
| 9 | [Creating Extensions](09-creating-extensions.md) | Plugins & themes, manifests, the full hook reference |
| 10 | [Messaging & Logging](10-messaging-and-logging.md) | Email, SMS, structured log channels |

## Quick Orientation

```
your-app/
├── index.php              # Web entry point (boots Bootstrap in WEB mode)
├── cli                    # CLI entry point (boots Bootstrap in CLI mode)
├── config/
│   ├── core.cfg           # Application config (JSON)
│   ├── local.cfg          # Local overrides (gitignored)
│   ├── extensions.cfg     # Extension lifecycle state
│   ├── smtp.cfg           # SMTP credentials (optional)
│   └── sms.cfg            # SMS credentials (optional)
├── Assets/
│   ├── js/app.js          # App JavaScript (auto-registered)
│   ├── less/styles.less   # App LESS (compiled and served at /css)
│   └── layouts/           # App layout files
├── Templates/
│   ├── mail/              # Mail templates (app → plugin → core resolution)
│   └── sms/               # SMS templates
├── ext/
│   ├── plugins/           # Your plugins
│   └── themes/            # Your themes
├── migrations/            # Schema migrations (timestamped .sql files)
├── seeds/                 # Seed data groups
├── data/                  # SQLite database file lives here by default
├── log/                   # Log files (one per channel)
└── storage/               # Caches (LESS, Latte)
```

Everything boots from `index.php` / `cli`. There is no required framework
config file beyond `config/core.cfg` — sensible defaults are applied for
everything else.

## Where Things Happen

| Concern | Chapter |
|---------|---------|
| "How do I add a page?" | [Routing](03-routing-and-requests.md) + [Rendering](04-rendering.md) |
| "How do I talk to the database?" | [Database](05-database.md) |
| "How do I ship a feature as reusable code?" | [Extensions](09-creating-extensions.md) |
| "How do I change settings?" | [Configuration](02-configuration.md) |
| "How do I add styles or scripts?" | [Assets](07-assets.md) |
| "How do I send an email / SMS?" | [Messaging](10-messaging-and-logging.md) |

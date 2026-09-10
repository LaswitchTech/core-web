# Core-Web Documentation

Core-Web is a PHP 8.2+ web framework built around a single entry point,
auto-detected servers, extension-first design, and convention over
configuration.

Start with the [Usage Guide](usage/index.md) if you're building an
application. Use the [Architecture Reference](development/architecture/) if
you're extending or debugging the framework itself.

## Usage Guide

Task-oriented walkthroughs for building applications on Core-Web.

| # | Chapter | Covers |
|---|---------|--------|
| 1 | [Getting Started](usage/01-getting-started.md) | Installation, app skeleton, first route, server setup. |
| 2 | [Configuration](usage/02-configuration.md) | `core.cfg` / `local.cfg` merge, dot-notation keys, `core.config` CLI. |
| 3 | [Routing & Requests](usage/03-routing-and-requests.md) | HTTP routes, URL params, request/response objects, CLI commands. |
| 4 | [Rendering](usage/04-rendering.md) | Layout/template/view composition, PHP & Latte engines, the panel layout. |
| 5 | [Database](usage/05-database.md) | SQLite/MySQL, query builder, transactions. |
| 6 | [Migrations & Seeding](usage/06-migrations-and-seeding.md) | Timestamped SQL migrations, rollback, seed groups. |
| 7 | [Assets](usage/07-assets.md) | Asset registry, scopes, LESS compilation, serving, emitting tags. |
| 8 | [Helpers](usage/08-helpers.md) | Core helpers, view usage, writing custom helpers. |
| 9 | [Creating Extensions](usage/09-creating-extensions.md) | Plugins & themes, manifest reference, full hook reference. |
| 10 | [Messaging & Logging](usage/10-messaging-and-logging.md) | Mail/SMS templates, channel-based logging. |

## Architecture Reference

Component-level design and API documentation, mirroring `src/`.

- [Bootstrap](development/architecture/Bootstrap.md) — mode-driven initialization.
- [Config](development/architecture/Config.md) / [Container](development/architecture/Container.md) — configuration and DI.
- [Router](development/architecture/Router/Router.md) — routing, [Web](development/architecture/Router/Request/Web.md) / [Cli](development/architecture/Router/Request/Cli.md) requests, [Response](development/architecture/Router/Response.md), server [configs](development/architecture/Router/Config/).
- [Renderer](development/architecture/Renderer/Renderer.md) — composition, [engines](development/architecture/Renderer/Engine/EngineInterface.md), [registry](development/architecture/Renderer/Register.md), [entries](development/architecture/Renderer/Resource/Entry.md).
- [Database](development/architecture/Database/Architecture.md) — [connection](development/architecture/Database/Connection.md), [drivers](development/architecture/Database/Driver/DriverInterface.md), [query builder](development/architecture/Database/Query/Builder.md), [seeding](development/architecture/Database/Seeding.md).
- [Migration](development/architecture/Migration/Architecture.md) — [runner](development/architecture/Migration/Runner.md), [drivers](development/architecture/Migration/Driver/SqlMigrationDriver.md), [promoters](development/architecture/Migration/Promoter/MigrationPromoterInterface.md).
- [Asset](development/architecture/Asset/Registry.md) — registry, entries, [LESS compiler](development/architecture/Asset/LessCompiler.md).
- [Helper](development/architecture/Helper/HelperInterface.md) — interface, [registry](development/architecture/Helper/Registry.md), [bag](development/architecture/Helper/Bag.md), [conventions](development/architecture/Helper/Conventions.md), [asset helper](development/architecture/Helper/Asset.md).
- [Hook](development/architecture/Hook/Registry.md) — hook registry and entries.
- [Manifest](development/architecture/Manifest/Parser.md) — extension manifest parsing and [extensions](development/architecture/Manifest/Extension.md).
- [Logger](development/architecture/Logger/Logger.md) — [levels](development/architecture/Logger/Level.md).

### Extension System

- [Extension Architecture](development/extensions/Architecture.md)
- [Extension Lifecycle](development/extensions/Lifecycle.md)
- [Frontend Asset Plugin Conventions](development/extensions/FrontendAssetPluginConventions.md)

### Messaging

- [SMTP / Mail](development/messaging/Smtp.md)
- [SMS](development/messaging/Sms.md)

## Conventions

- Classes: `PascalCase`; interfaces: `Interface` suffix.
- Config files: `.cfg` (JSON). Default `config/core.cfg`, overrides `config/local.cfg`.
- Database tables: `snake_case`, plural.
- Source: `src/` mirrors the namespace with `Laswitchtech\CoreWeb\` stripped.

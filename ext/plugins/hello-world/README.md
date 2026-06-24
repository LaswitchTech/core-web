# Hello World Plugin — Smoke Test

Active smoke-test plugin for CoreWeb's renderer and router subsystems.

## Features tested

| Subsystem | Route / Command | Description |
|-----------|------------------|-------------|
| `router.register` | `/hello` (web) | Legacy HTML route (no renderer) |
| `renderer.register` | `/hello-render` (web) | Full layout → template → PHP view pipeline |
| `renderer.register` | `hello.render` (CLI) | Same pipeline via CLI |
| `router.register` | `/hello-latte` (web) | Layout → template → Latte view pipeline |
| `router.register` | `hello.latte` (CLI) | Same Latte pipeline via CLI |
| `router.register` | `hello.world` (CLI) | Legacy CLI command (accepts optional name argument) |
| **temporary** | `hello.db` **(CLI)** | **Database smoke validation — resolves `db_connection` and runs `SELECT sqlite_version()` — Phase 1 placeholder for core.db.** |
| **temporary** | `hello.query` **(CLI)** | **Query Builder smoke validation — creates a temporary `query_smoke` table via raw PDO, inserts one row, queries it using `$db->select('query_smoke')->where(['id' => 1])->fetch()` — Phase 1F.** |

## Resource registration

Registered into the renderer registry during the `renderer.register` hook:

```
hello.layout       →  ext/plugins/hello-world/layouts/hello-view.php   (type: layout)
hello.template     →  ext/plugins/hello-world/templates/hello-view.php  (type: template)
hello.view         →  ext/plugins/hello-world/views/hello-view.php      (type: view, engine: php)
hello.latte.view   →  ext/plugins/hello-world/views/hello-view.latte    (type: view, engine: latte)
```

Provider priority: `plugin` — these resources can override core defaults, but theme and app resources have higher precedence.

### Renderer engine registration

Render engines **are not registered by HelloWorld**. They are registered by CoreWeb's Bootstrap during bootstrap:

| Engine | Registration | Usage |
|--------|-------------|-------|
| `php` | Registered first by Bootstrap | Default fallback for `.php` view files |
| `latte` | Registered second by Bootstrap | Handles `[engine => 'latte']` view entries (e.g. `hello.latte.view`) |

The engine selection algorithm is implemented in **Renderer\Engine\Registry::resolve()**.  It does not use registration order or first-match logic.  Instead it follows a strict priority:

1. **Metadata engine override** — If ``$entry->metadata['engine']`` is set to a registered name (e.g. ``'latte'``), that exact engine is returned.
2. **'php' default** — When no metadata engine is set, the registry falls back to the ``'php'`` engine.
3. **Error when metadata references an unregistered engine** — If ``metadata['engine']`` is set but the name does not match any registered engine, a ``RenderException`` is thrown (no fallback applied).

## Directory structure

```
hello-world/
├── manifest.json           # extension metadata, hooks
├── README.md               # this file
├── layouts/
│   └── hello-view.php     # layout wrapper (renders $templateContent)
├── templates/
│   └── hello-view.php     # template wrapper (renders $viewContent)
├── views/
│   ├── hello-view.php     # PHP view content (renders $name via htmlspecialchars)
│   └── hello-view.latte   # Latte view content (renders {$name})
└── src/
    └── HelloWorld.php     # registerRoutes() + registerRenderer() hooks
```

The `layouts/` and `templates/` directories contain renderer resources contributed to the pipeline — they are **not** standalone plugins or extensions.

## Usage

### CLI

```bash
php cli hello.world            # → "Hello World!\n" (accepts optional name argument)
php cli hello.render           # → rendered layout → template → PHP view HTML
php cli hello.latte            # → rendered layout → template → Latte view HTML
php cli hello.db               # → database smoke validation: "SQLite OK: {version}\n"
php cli hello.query            # → query builder smoke validation (Phase 1F)
```

### Temporary DB Smoke Command

> **Phase 1 only.** This command validates that the `db_connection` container binding works. It will be replaced by a permanent `core.db.*` CLI subsystem in a later phase.

### Web (browser)

```
GET /hello        — legacy static HTML
GET /hello-render — full pipeline (PHP view) rendering
GET /hello-latte  — layout → template → Latte view rendering
```

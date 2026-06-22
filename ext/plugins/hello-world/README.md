# Hello World Plugin — Smoke Test

Active smoke-test plugin for CoreWeb's renderer and router subsystems.

## Features tested

| Subsystem | Route / Command | Description |
|-----------|------------------|-------------|
| `router.register` | `/hello` (web) | Legacy HTML route (no renderer) |
| `renderer.register` | `/hello-render` (web) | Full layout → template → view pipeline |
| `renderer.register` | `hello.render` (CLI) | Same pipeline via CLI |
| `router.register` | `hello.world` (CLI) | Legacy CLI command |

## Resource registration

Registerer into the renderer registry during `renderer.register`:

```
hello.layout       →  ext/plugins/hello-world/layouts/hello-view.php   (type: layout)
hello.template     →  ext/plugins/hello-world/templates/hello-view.php  (type: template)
hello.view         →  ext/plugins/hello-world/views/hello-view.php      (type: view)
```

Provider priority: `app` (highest) — these override any core / plugin / theme defaults.

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
│   └── hello-view.php     # view content (renders $name via htmlspecialchars)
└── src/
    └── HelloWorld.php     # registerRoutes() + registerRenderer() hooks
```

## Usage

### CLI

```bash
php cli hello.world            # → "Hello World!\n"
php cli hello.render           # → rendered layout → template → view HTML
```

### Web (browser)

```
GET /hello        — legacy static HTML
GET /hello-render — full pipeline rendering
```

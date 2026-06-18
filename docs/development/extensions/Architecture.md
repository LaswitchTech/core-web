# Extension Management

## Overview

Extensions are user-provided packages that modify or extend Core-Web's behavior without modifying framework code. They consist of two types:

| Type     | Scope                | Can modify                    |
|----------|----------------------|-------------------------------|
| `theme`  | Presentation only    | Layouts, CSS/JS assets, views |
| `plugin` | Application behavior | Hooks, services, routes, CLI commands |

Extensions are installed under the application's `ext/` directory tree.

## Directory Structure

```
project-root/
├── ext/
│   ├── themes/
│   │   └── example-theme/          # Theme extension root
│   │       ├── manifest.json       # Extension metadata
│   │       ├── layouts/            # Layout templates
│   │       ├── assets/             # Static files (CSS, JS, images)
│   │       └── README.md           # User-facing documentation
│   └── plugins/
│       └── example-plugin/         # Plugin extension root
│       ├── src/                    # Plugin source code
│       ├── manifest.json
│       └── README.md
```

### Key Rules

- Extensions must **not** be stored in `vendor/`. They are application-level, not Composer dependencies.
- Each extension has exactly one directory under its type folder (`ext/themes/<name>/` or `ext/plugins/<name>/`).
- The `ext/` directory mirrors a conventional structure: two top-level type folders keep themes and plugins clearly partitioned by concern (presentation vs. behavior).

### Rationale for `ext/` over Alternatives

| Name           | Why rejected                                    |
|----------------|--------------------------------------------------|
| `extensions/`  | Too verbose; adds no semantic clarity over `ext/` |
| `lib/`         | Ambiguous — conventionally denotes "library source code" in many ecosystems (Node, Ruby), which would confuse developers about whether content is internal or user-provided. |
| `addons/`      | Vague in meaning; doesn't signal theme/plugin duality. |
| `packages/`    | Clashes with Composer package terminology.         |

`ext/` strikes the best balance: concise (`3 chars`), unambiguous, and consistent with conventions like `npm init <name>`'s `node_modules/.bin`.

## Extension Manifest

Each extension root contains a `manifest.json` file. The manifest is the single source of truth about an extension's metadata, dependencies, and framework bindings.

### Required Fields

```json
{
  "type": "theme|plugin",
  "name": "example-extension",
  "version": "1.0.0"
}
```

| Field   | Type     | Description                              | Example          |
|---------|----------|------------------------------------------|------------------|
| `type`  | string   | Extension type                           | `"plugin"`       |
| `name`  | string   | Unique extension identifier              | `"example-plugin"` |
| `version` | string | Semver-compatible version string         | `"1.0.0"`        |

### Optional Fields

```json
{
  "type": "plugin",
  "name": "example-plugin",
  "version": "1.0.0",
  "hooks": [
    {
      "name": "page.before_render",
      "callback": "Example\\Plugin::handleBeforeRender",
      "priority": 10
    }
  ],
  "layouts": [
    {
      "slot": "sidebar",
      "template": "layouts/sidebar.twig"
    }
  ],
  "depends": [
    "core.authentication"
  ],
  "author": "Louis",
  "description": "Example plugin demonstrating extension architecture."
}
```

| Field         | Type       | Description                                   |
|---------------|------------|-----------------------------------------------|
| `hooks`       | array      | Hooks to register during pre-boot phase       |
| `layouts`     | array      | Layout templates the extension provides       |
| `depends`     | string[]   | Plugin/theme names this extension requires    |
| `author`      | string     | Author name                                   |
| `description` | string     | Human-readable description                    |

### Hook Registration Format

Each hook entry maps a framework hook namespace to a callable:

```json
{
  "hooks": [
    {
      "name": "layout.header",
      "callback": "App\\Plugins\\MyPlugin::onLayoutHeader",
      "priority": 10
    }
  ]
}
```

| Field       | Type     | Description                                  | Default |
|-------------|----------|----------------------------------------------|---------|
| `name`      | string   | Hook namespace (e.g., `layout.header`)       | —       |
| `callback`  | string   | Fully-qualified callable path                | —       |
| `priority`  | int      | Call order (higher executes first)           | `0`     |

### Layout Registration Format

Each layout entry maps a slot to a template file:

```json
{
  "layouts": [
    {
      "slot": "sidebar",
      "template": "layouts/sidebar.twig"
    }
  ]
}
```

Layout templates are resolved relative to the extension root. A plugin providing `ext/plugins/example-plugin/layouts/sidebar.twig` registers its slot as `{"slot": "sidebar", "template": "layouts/sidebar.twig"}`.

## Extension Discovery

The `HookRegistry::loadRegisteredCommands()` method walks the `ext/` directory tree during bootstrap:

1. **Walk** `ext/{themes,plugins}/` directories
2. **Read** each extension's `manifest.json`
3. **Validate** required fields (`type`, `name`, `version`)
4. **Resolve** dependencies from `depends` array
5. **Register** hook callbacks into the HookRegistry during pre-boot phase
6. **Register** layouts with the Renderer for later slot composition

Discovery skips directories without a valid manifest or those whose manifests fail required-field validation. Errors are logged but do not halt bootstrap.

## Lifecycle

Extensions participate in the bootstrap lifecycle at two stages:

```
1. Pre-boot (initExtensions)     → manifest parse, dependency resolve, hook/slot registration
2. Runtime                       → hooks triggered, layout slots filled, plugin callbacks invoked
3. Extension manager commands     → CLI operations for install/uninstall/enable/disable
```

Discovery happens **before** subsystem booted (Router/CLI), ensuring all extension hooks are registered and available when the active subsystem dispatches requests.

## Constraints

- Manifests must be valid JSON parseable by `json_decode()` without errors.
- Required fields (`type`, `name`, `version`) must be non-empty strings matching their expected value space.
- Hook callbacks must resolve to an existing class/method pair; unresolvable callbacks are skipped with a log warning.
- Layout template paths are resolved relative to the extension root and verified for file existence before registration.
- A plugin/theme cannot depend on itself, directly or transitively (cycles are detected during resolution).

## Extension Manager Tasks

The Extension Manager subsystem (separate project-management task) is responsible for:

1. **Manifest parser** — Validate schemas, parse fields, normalize types.
2. **Discovery engine** — Walk `ext/`, read manifests, build loaded extension registry from the container.
3. **CLI commands** — `extension.list`, `extension.enable`, `extension.disable`, `extension.install`.
4. **Dependency resolution** — Topological sort of `depends` array for load ordering.
5. **Hook/slot registration** — Bind parsed manifest data into the HookRegistry and Renderer.

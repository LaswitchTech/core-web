# Extension Management

## Overview

Extensions are user-provided packages that modify or extend Core-Web's behavior without modifying framework code. They consist of two types:

| Type     | Scope                | Can modify                    |
|----------|----------------------|-------------------------------|
| `theme`  | Presentation only    | Layout placeholders           |
| `plugin` | Application behavior | Hooks                         |

Extensions are installed under the application's `ext/` directory tree.

## Directory Structure

```
project-root/
├── ext/
│   ├── themes/
│   │   └── example-theme/          # Theme extension root
│   │       ├── manifest.json       # Extension metadata
│   │       ├── layouts/            # Layout templates (future use)
│   │       ├── assets/             # Static files (CSS, JS, images)
│   │       └── README.md           # User-facing documentation
│   └── plugins/
│       └── example-plugin/         # Plugin extension root
│           ├── src/                # Plugin source code
│           ├── manifest.json
│           └── README.md
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

Each extension root contains a `manifest.json` (or `extension.json`) file. The manifest is the single source of truth about an extension's metadata and dependencies. Parsing and validation are handled by `Manifest\Parser::validate()`. Only the fields documented below are recognized; any other keys in the JSON are silently ignored.

### Required Fields

```json
{
  "type": "theme",
  "name": "example-extension",
  "version": "1.0.0"
}
```

| Field     | Type   | Description                              | Constraints                                     | Example          |
|-----------|--------|------------------------------------------|-------------------------------------------------|------------------|
| `type`    | string | Extension type                           | Must be `"theme"` or `"plugin"` (case-insensitive, lowered by parser) | `"plugin"`       |
| `name`    | string | Unique extension identifier              | Non-empty; trimmed by parser                    | `"example-plugin"` |
| `version` | string | Version string                           | Normalized to SemVer X.Y.Z format (strips leading v/V/= and whitespace) | `"1.0.0"`        |

### Optional Fields

```json
{
  "type": "plugin",
  "name": "example-plugin",
  "version": "1.0.0",
  "hooks": [
    "layout.header::Example\\Plugin\\onLayoutHeader",
    "page.before_render"
  ],
  "layouts": [
    "sidebar",
    "footer"
  ],
  "depends": [
    "core.authentication"
  ]
}
```

| Field     | Type       | Description                                       | Constraints                              | Default |
|-----------|------------|---------------------------------------------------|------------------------------------------|---------|
| `hooks`   | list<string> | Hook definitions registered during pre-boot phase. | See [Hook Format](#hook-format) below.   | `[]`    |
| `layouts` | list<string> | Layout placeholders provided by the extension.    | Each is a string identifier (not an object). | `[]`  |
| `depends` | list<string> | Extension name-slugs this extension requires.    | Non-empty strings; validated at bootstrap. Can contain any name. (Current implementation does not resolve these beyond existence checking.) | `[]` |

### Hook Format

Each hook entry is a **single string**, not a JSON object. The parser validates each entry with:

```
/^[a-zA-Z0-9_]+(?:[:.\\][a-zA-Z0-9_.\\:]*[a-zA-Z0-9_])?$/
```

Two patterns are supported:

1. **Dotted hook name only** — e.g. `"layout.header"`. Registers as an empty placeholder callback (the named hook exists but no callable is bound).
2. **Dotted hook name + class::method** — e.g. `"layout.header::Example\\Plugin\\onLayoutHeader"`. Split on the first `::` to extract the hook name (`layout.header`) and the class/method pair for autoloading via `Hook\Registry::addClassCall()`.

When a dotted-only hook is registered, Hook\Registry receives the hook name with an empty placeholder callback `fn() => []`. Callers can inspect which hooks exist without callbacks for introspection.

### Layout Format

Each layout entry is a **string identifier** (not an object with `slot`/`template`). The extension registers a placeholder hook named `layout.{layoutName}`:

```json
{
  "layouts": ["sidebar", "footer"]
}
```

This produces two placeholder hook registrations at bootstrap:
- `layout.sidebar` → empty callback (same as dotted-only hooks)
- `layout.footer` → empty callback

The identifier is used purely as a name; no template resolution or slot composition occurs.

## Extension Discovery

Bootstrap walks the `ext/` directory tree during `Bootstrap::registerExtensions()` (called from `initExtensions()` before Router/CLI subsystems boot):

1. **Walk** `ext/{themes,plugins}/` directories inside app `ext/` and package `vendor/core-web/ext/` roots
2. **Read** each extension's `manifest.json` or `extension.json`
3. **Validate** required fields (`type`, `name`, `version`) via `Manifest\Parser::validate()`
4. **Fail fast** on unresolved dependencies between successfully parsed manifests (flat existence check in Bootstrap)
5. **Register an autoloader** for `Laswitchtech\CoreWeb\Plugin\*` and `Laswitchtech\CoreWeb\Theme\*` from all extension `src/` directories
6. **Resolve each hook string**:
   - Dotted-only → placeholder callback on the named hook
   - Contains `::` → split into hook name + class/method; register via `Hook\Registry::addClassCall()` (fails bootstrap if class or method does not exist)
7. **Resolve each layout string** → placeholder callback on `layout.{name}` hook
8. **Index extension metadata** into the Container under `extension_index` keyed by `$manifest->name`, storing: `type`, `version`, `directory`, `depends`

Discovery is tolerant: individual malformed manifests are logged to STDERR and skipped so one broken extension does not block discovery of valid extensions. If no `ext/` directory exists, an empty Hook\Registry and empty `extension_index` are registered and the process returns silently.

## Lifecycle

Extensions participate in the bootstrap lifecycle at two stages:

```
1. Pre-boot (Bootstrap::registerExtensions)  → manifest parse, dependency check, autoloader install, hook/layout registration, index
2. Runtime                                  → hooks triggered via Hook\Registry::trigger(), router dispatches (plugin callbacks invoked when their hook fires)
```

Discovery happens **before** the active subsystem (Router/CLI) boots, ensuring all extension hooks are registered and available when dispatched requests fire hooks.

## Constraints

- Manifests must be valid JSON parseable by `json_decode()` without errors. Invalid JSON throws a JsonException at discovery time.
- Required fields (`type`, `name`, `version`) must be non-empty strings. The parser enforces type is 'theme' or 'plugin', normalizes version to X.Y.Z, and trims name whitespace.
- Hook strings are validated against the regex pattern shown above; invalid hooks throw an InvalidArgumentException during parsing.
- Class-based hook callbacks (strings containing `::`) fail bootstrap if the class or method does not exist — `Hook\Registry::addClassCall()` throws at registration time.
- Dotted-only hook names (no `::`) are registered as empty placeholder callbacks; they do **not** cause resolution failures.
- Dependency verification is a flat existence check: unresolved dependencies throw RuntimeException during Bootstrap, but no topological sort or transitive resolution is performed.

## Future Enhancements

The following features are planned but not yet implemented. They are listed here for reference only.

### Extension State Management
- `extension.enable` and `extension.disable` CLI commands to toggle extension activation state without removing files.

### CLI Commands
- `extension.list` — list all discovered extensions with type, version, status.
- `extension.install` / `extension.uninstall` — CLI-based install/uninstall workflows.

### Service & Route Registration
- Extension manifest support for service registration via the DI Container.
- Extension-managed route definitions (beyond hook-triggered routes).

### Richer Hook/CLi Integration
- CLI command registration from extension manifests (e.g., `cli.commands` field with namespace/command mapping).
- Plugin-provided CLI commands dispatched through a future CLIRouter or Command system.

### Renderer / Layout Slot Integration
- Full layout template resolution and slot-based rendering (Renderer subsystem).
- Object-schema layouts: `{"slot": "sidebar", "template": "layouts/sidebar.twig"}` for richer template routing beyond the current string-identifier placeholder approach.

### Dependency Resolution Improvements
- **Topological sort** of `depends` for proper load ordering instead of flat existence check.
- **Transitive dependency resolution** — follow depends chains to ensure all transitive dependencies are loaded before the extension activates.
- **Cycle detection** — detect and report direct and transitive dependency cycles during discovery.

### Manifest Schema Enrichment
- Optional richer hook object schema: `{"name": "...", "callback": "...", "priority": 10}` instead of plain strings.
- Layout template paths and slot metadata with full Renderer integration.

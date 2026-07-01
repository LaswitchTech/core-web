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

Bootstrap discovers extensions from **two base directories** during `Bootstrap::registerExtensions()` (called from `initExtensions()` before Router/CLI subsystems boot). Both roots are walked in a single pass:

1. **Framework root**. The package/vendor install directory (`vendor/laswitchtech/core-web/ext`).
2. **Application root**. The user's application directory (`<app-root>/ext`).

Discovery order matters because it determines override precedence (see below).

### Discovery Steps

Both roots are walked in the order listed above and their results merged before any downstream processing:

1. Discover & parse every manifest.json / extension.json across **both** roots
2. Deduplicate by extension `name`. The *last* entry for a given name wins, which means an application extension always overrides a framework extension with the same name.
3. Fail fast on unresolved dependencies between successfully parsed (deduplicated) manifests (flat existence check in Bootstrap).
4. Register an autoloader for `Laswitchtech\CoreWeb\Plugin\*` and `Laswitchtech\CoreWeb\Theme\*` from **deduplicated** extension `src/` directories.
5. Resolve each hook string on the deduplicated list:
   - Dotted-only → placeholder callback on the named hook
   - Contains `::` → split into hook name + class/method; register via `Hook\Registry::addClassCall()` (fails bootstrap if class or method does not exist)
6. Resolve each layout string → placeholder callback on `layout.{name}` hook (deduplicated).
7. Index extension metadata into the Container under `extension_index` keyed by `$manifest->name`, storing: `type`, `version`, `directory`, `depends`, `origin`, and `kernelCompat`.

All downstream operations (dependency checking, autoloading, hook registration, metadata indexing) operate **only on the deduplicated set**.

### Override Behavior

Extension identity is its `"name"` field. When two manifests from different bases share the same name:

- The application root manifest overrides the framework root manifest.
- Only the winning (deduplicated) extension is used for dependencies, autoloading, and hooks.
- Override happens via last-write-wins during the associative-array merge step; no explicit origin comparison is needed because Bootstrap always processes framework first, then app.

This makes it possible for a user to shadow any bundled framework extension simply by placing an extension of the same name in their own `ext/` directory.

### Origin Metadata

Each parsed `Extension` value object carries an `$origin` property indicating where it was discovered:

| Value       | Meaning                                         |
|-------------|-------------------------------------------------|
| `'framework'` | Extension lives in the framework/package `ext/` root.  |
| `'app'`         | Extension lives in the application `ext/` root.    |

The origin is set by `Parser::discover($baseDir, $origin)` at parse time and can be inspected at runtime (e.g., for diagnostics). It is not used to enforce policy — it is metadata only.

### Kernel Compatibility Metadata

Each manifest may optionally declare a `"kernel-compat"` field:

```json
{
  "type": "plugin",
  "name": "example",
  "version": "1.0.0",
  "kernel-compat": "^1.0"
}
```

| Field           | Type   | Description                                      | Constrained by |
|-----------------|--------|--------------------------------------------------|----------------|
| `kernel-compat` | string | Kernel compatibility constraint (e.g. `"^1.0"`). | Stored as-is; not enforced in V1.0. |

The value is passed through unchanged to the Extension value object (`$kernelCompat`). **It is stored but not enforced** — later tasks may add actual version-checking logic. In V1.0, any valid string (or absence of the field) is accepted.

### Multi-Root Diagnostics

Bootstrap binds diagnostic keys into the Container for each discovered root:

| Key | Value |
|-----|-------|
| `extension_base.framework` | Absolute path to framework `ext/` root (if found). |
| `extension_base.app`       | Absolute path to application `ext/` root (if found). |

Discovery is tolerant: individual malformed manifests are logged to STDERR and skipped so one broken extension does not block discovery of valid extensions. If no `ext/` directory exists on any base, an empty Hook\Registry and empty `extension_index` are registered and the process returns silently.

## Helper Registration

Plugins may register helpers via the `helper.register` hook. The hook fires during bootstrap, after manifest parsing but before the active subsystem (Router/CLI) boots. It receives the helper registry (`Helper\Registry`) as context:

```
Trigger hook "helper.register" → [registry => Registry]
```

### Registration Details

| Aspect | Detail |
|--------|--------|
| **Hook name** | `helper.register` |
| **Context** | `['registry' => Laswitchtech\CoreWeb\Helper\Registry]` |
| **Provider values** | `'core'`, `'app'`, `'plugin'` |
| **Resolution order** | Higher priority wins → provider precedence (app > plugin > core) → later registration wins |
| **Bag injection** | A `Helper\Bag` instance (wrapping the registry) is injected into layouts, templates, and views as `$helpers` |

### Plugin Usage

```php
// In a plugin's hook callback:
public function onHelperRegister(array $ctx): void {
    $registry = $ctx['registry'];
    $helper   = new Url(); // implements HelperInterface

    // Register with provider and priority for conflict resolution
    $registry->register($helper, 'plugin', 0, [/* optional metadata */]);
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `$registry` | `Registry` | The helper registry used by all registration code. Callers register via `register()` and introspect via `has()`, `get()`, `entry()`. |

### Bag Access in Templates

```php
// Method-style:
$helper = $helpers->resolve('url');

// Property-style (no arguments):
$helper = $helpers->url;

// Call-style (zero args — returns helper object itself):
$helper = $helpers->url();

// Use the helper directly:
echo $helper->to('/about');
```

### V1.0 Constraints

- No global helper functions (e.g., `url()`, `e()`) — helpers are resolved via `Bag` or registry only.
- No registry standardization refactor.
- No compatibility enforcement tied to helpers.
- No automatic asset manifest compilation.

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

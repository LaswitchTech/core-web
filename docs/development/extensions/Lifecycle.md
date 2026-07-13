# Extension Lifecycle

## Overview

Extensions participate in three phases of the Core-Web bootstrap lifecycle: **Discovery**, **Registration**, and **Runtime**. Discovery is executed by `Bootstrap::registerExtensions()` before any subsystem (Router/CLI) boots. Registered hooks are stored in the `Hook\Registry` and triggered at runtime when their corresponding hook names fire. Extension manifests that fail validation are skipped silently; extension dependency failures trigger a hard bootstrap error.

## Bootstrap-phase Lifecycle

The sequence is fixed — no hooks fire during discovery itself:

```
1. Multi-Root Discovery                        Parser::discover(root, origin) → list<Extension>
 2. Name Deduplication                          associative-array overwrites           → app wins kernel collisions
 3. All-extension metadata indexing             stored in `extension_index_all`       → full manifest snapshot
 4. Lifecycle filtering                         reads `config/extensions.cfg`         → enabled/locked/disabled pruning
 5. Dependency validation (enabled-only)        against filtered enabled manifests     → fail-fast on unresolved deps
 6. Dependency ordering                          topological sort of enabled set         → dependencies before dependents; unrelated preserve discovery order
 7. Autoloader Installation                     spl_autoload_register()               → Laswitchtech\CoreWeb\Plugin\* / Theme\*
 8. Hook + Layout Registration                  Registry::addCallback / addClassCall  → dotted hooks → placeholders
 9. Final enabled-only `extension_index`        Container::set()                      → keyed by name; lifecycle-ready
```

### Phase Details

#### 1. Manifest Discovery (Multi-Base)

Bootstrap walks **two extension bases** in a fixed order:

| Order | Root | Description |
|-------|------|-------------|
| 1 | Kernel     | `$vendor/laswitchtech/core-web/ext` — shipped kernel extensions |
| 2 | Application | `<app-root>/ext` — user-provided extensions |

For each base, `Parser::discover($baseDir, $origin)` walks `themes/` and `plugins/` subdirectories, parses each `manifest.json` or `extension.json`, normalizes fields via `Parser::validate()`, and returns a list of `Manifest\\Extension` value objects. Each parsed extension carries an `$origin` property (`'kernel'` or `'app'`) indicating where it was discovered.

Malformed manifests are logged to STDERR and removed from the list per-base (tolerant — no bootstrap failure).

If **neither** base directory exists, discovery returns an empty array; Bootstrap registers an empty Hook\Registry and `extension_index` object and proceeds without extensions.

#### 1b. Name Deduplication (Between-Base Merge)

After both bases are parsed, their results are merged into a single flat list. Any two entries sharing the same `$name` are **deduplicated** using last-write-wins semantics:

```php
$deduplicated = [];
foreach ($mergedManifests as $ext) {
    $deduplicated[$ext->name] = $ext;   // app overwrites kernel on collision
}
$deduplicated = array_values($deduplicated);   // re-index to [0..n-1]
```

Because the kernel base is always processed first, any identically-named extension in the application base naturally wins. **All downstream phases operate only on this deduplicated set.**

#### 2. Dependency Validation

After all manifests parse successfully, Bootstrap iterates them and checks each `$manifest->depends` entry against `$knownNames = array_column($manifests, 'name')` using a flat `in_array()` comparison:

```php
foreach ($m->depends as $dep) {
    if (!in_array($dep, $knownNames, true)) {
        throw new RuntimeException("Extension '{$m->name}': unresolved dependency '{$dep}'. ...");
    }
}
```

Unresolved dependencies cause a hard `RuntimeException` at bootstrap.

#### 3. Dependency Ordering (Topological Sort)

Enabled extensions are **stably topologically sorted** before any registration occurs:

- All dependency edges from the enabled set are collected and assembled into a DAG.
- A stable topological sort is performed; an extension that has no ordering constraint relative to another preserves its discovery order.
- Dependencies always appear before dependents in the final ordering — every transitive dependency is guaranteed to come first.
- If a cycle is detected during topological sorting, bootstrap fails immediately with a `RuntimeException` listing the manifests that could not be sorted.

This step ensures deterministic hook registration order: a plugin's hooks are registered only after all its (transitive) dependencies' hooks have been registered.

#### 4. Autoloader Installation

All extension `src/` directories are gathered and registered in a single `spl_autoload_register()` callback that responds to two namespace prefixes:

- `Laswitchtech\CoreWeb\Plugin\*`
- `Laswitchtech\CoreWeb\Theme\*`

This step runs **before** Hook registration so that class-based hook callbacks can be resolved via reflection. Duplicate directories are deduplicated.

#### 5. Hook Registration

For each extension, every `hooks` entry is processed:

| Entry format | Example | Behavior |
|---|---|---|
| Dotted-only (no `::`) | `"page.before_render"` | Registers `$hookName` with an empty placeholder callback `fn () => []`. No resolution failure. |
| Hook name + class::method | `"layout.header::Example\\Plugin\\onLayoutHeader"` | Split on first `::`, then on last `::` within the class/method part. Resolves via `Hook\Registry::addClassCall()`. **Fails bootstrap** if reflected class or method does not exist. |

#### 6. Layout Registration

Each `layouts` entry is a string identifier (e.g., `"sidebar"`). Bootstrap registers a placeholder hook named `layout.{identifier}`:

```php
foreach ($manifest->layouts as $layoutDef) {
    $hookRegistry->addCallback("layout.{$layoutDef}", static fn () => [], 0);
}
```

Layouts do **not** register via `addClassCall()`; they are purely placeholder hooks that signal the layout's existence to downstream subsystems.

#### 7. Metadata Indexing

Each extension's metadata is stored in the Container under `extension_index`, keyed by `$manifest->name`. The index stores nine fields: type, version, directory, slug, depends, origin, kernelCompat, compatStatus, and locked.

```
extension_index["example-plugin"] = {
    type:         "plugin",
    version:      "1.0.0",
    directory:    "/absolute/path/to/ext/plugins/example-plugin",
    slug:          "datatables-bootstrap",
    depends:       ["core.authentication"],
    origin:        "app",
    kernelCompat:  "^1.0",
    compatStatus:  "compatible",
    locked:         false,
}
```

The Container keys set are: `hook_registry`, `extension_index`, `app_root`, `extension_base`.

## Runtime-phase Lifecycle

After extensions are registered, the active subsystem (WEB or CLI) boots:

```
1. Boot subsystem (bootWeb() / bootCli())
   │
   ├─► Trigger hook "plugin.started" [mode => 'web'|'cli']
   │     → Plugin callbacks execute at this point.
   │
   ├─► Create Router(Router::MODE_WEB) or Router(Router::MODE_CLI)
   │
   ├─► Store $router in Container under key "router"
   │
   └─► Trigger hook "router.register" → [router, container, mode]
         → Plugins can register routes via the router object.
         → Container is available for introspection but not mutation at this point.
         → Subsystem dispatches request and sends response before returning to PHP.
```

### Hook trigger context

| Hook | Trigger point | Context passed |
|---|---|---|
| `plugin.started` | Immediately before Router creation | `['mode' => 'web'|'cli']` |
| `router.register` | After Router instantiation, before dispatch | `['router' => Router, 'container' => Container, 'mode' => 'web'|'cli']` |

### Lifecycle guarantees

- All hooks are registered **before** any route registration hook fires.
- All manifests parse before dependency validation; discovery never rolls back on partial failure (one bad manifest skips the rest).
- Dependency validation is a prerequisite for hook resolution — unresolved deps block bootstrap entirely.
- The autoloader is already in place when `addClassCall()` runs, so reflection-based class loading can succeed.
- Container services (`hook_registry`, `extension_index`) are resolved by subsystems after extensions are installed — there is no second-pass discovery.

## Error handling summary

| Failure point | Mechanism | Scope |
|---|---|---|
| Invalid manifest JSON | `json_decode()` → logged to STDERR; manifest skipped | Per-extension (tolerant) |
| Manifest missing required fields | `Parser::validate()` exceptions | Per-manifest (tolerant — skip) |
| Hook name regex mismatch | `InvalidArgumentException` on validate() | Per-hook definition (tolerant — skip) |
| Unresolved dependency | `RuntimeException` thrown during `$knownNames` loop | Bootstrap-wide (hard fail) |
| Dependency cycle detection | `RuntimeException` listing unsorted manifests | Bootstrap-wide (hard fail) |
| Class/method callback resolution | `addClassCall()` throws if class or method doesn't exist | Bootstrap-wide (hard fail) |
| Dotted-only hook name parsing | No error — registered as empty placeholder callback | Informational only |
| Missing ext/ directory | Silent early return with empty registry | Non-error (normal for Composer installs) |

## Extension Enable/Disable Lifecycle State

Starting with Phase 2I Prompt 10, extensions can be selectively enabled or disabled via CLI commands. This state is **persisted across bootstrap runs** and does not require file removal to deactivate an extension.

### Persistence File — `config/extensions.cfg`

| Aspect | Detail |
|--------|--------|
| **Path** | `<app-root>/config/extensions.cfg` (relative to application root) |
| **Writer** | `Bootstrap::saveLifecycleState()` — called after pending events are processed; also `Core::handleDisableSubcmd()` and `Core::handleEnableSubcmd()` for CLI mutation |
| **Reader** | `Bootstrap::loadLifecycleState()` — called during the pre-boot phase before subsystem boot |
| **Permission model** | Created with `0755`-safe permissions; parent directory auto-created if missing |
| **Backward compatibility** | If `config/extensions.cfg` does not exist, Bootstrap reads (read-only) `config/extensions.json` as a fallback. New/updated writes always target `.cfg`. |

### Schema

```json
{
  "enabled": {
    "plugins": [
      "Core",
      "SomePlugin"
    ],
    "themes": [
      "default-theme"
    ]
  },
  "pending": [
    {
      "action": "disable",
      "type": "plugins",
      "name": "SomePlugin",
      "source": "CLI"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `enabled.plugins` | `list<string>` | Plugin names currently enabled. Each string is the extension's `name` field from its manifest. |
| `enabled.themes` | `list<string>` | Theme names currently enabled, keyed identically to plugins. |
| `pending` | `list<object>` | Lifecycle events awaiting processing on the next bootstrap/CLI run. Cleared after successful hook firing and persistence. |

#### Pending Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `action` | `"enable"` or `"disable"` | The lifecycle action to fire. |
| `type` | `"plugins"` or `"themes"` | Which extension family the action targets. |
| `name` | `string` | The extension name from its manifest. |
| `source` | `string` | Origin of the request (e.g. `"CLI"`). |

### Default Behavior

When `config/extensions.cfg` **does not exist** on bootstrap:

- All discovered extensions are treated as **enabled** in memory. Bootstrap does not seed a fresh state file.
- CLI enable/disable commands will create `config/extensions.cfg` if it is absent.

When `config/extensions.cfg` **exists**:

- Only the names listed in `enabled.plugins` / `enabled.themes` are considered active (hooks fire for them; others are discovered but not activated).
- The existing enabled list takes precedence over discovery defaults.
- Pending events are processed if present, then cleared.

*Note: If `.cfg` is absent, Bootstrap reads `config/extensions.json` as a **read-only fallback** and persists all future writes solely to `.cfg`.

### Disabled Extensions Behavior

An extension that is **not** listed in the enabled arrays:

- Is still **discovered** during Bootstrap's manifest walk (its metadata appears in `extension_index_all` and `extension_index_disabled`).
- Is still **indexed** in `extension_index_all` alongside enabled extensions.
- Is **not autoloaded** — its `src/` directory is never registered with the autoloader.
- Has its hooks **NOT registered** in the `Hook\Registry`.
- Has its layouts **NOT registered** as layout placeholders.
- Is **not dependency validated during active bootstrap; dependency validation runs only against enabled manifests**.

### CLI Commands

| Command | Description |
|---------|-------------|
| `php cli core.extension status` | Display extended information about all discovered extensions (enabled/disabled state pending). |
| `php cli core.extension list [plugins\|themes]` | List all discovered extensions within the specified type (or both if no argument given). |
| `php cli core.extension enable plugin.<slug>\|theme.<slug>` | Enable a discovered extension by selector type (plugin or theme) and slug. Adds to enabled array and fires pre/post hooks on next bootstrap. |
| `php cli core.extension disable plugin.<slug>\|theme.<slug>` | Disable a discovered extension by selector type (plugin or theme) and slug. Removes from enabled array and adds pending fire-discovery hooks via CLI. |

### Locked Extensions

Locked extensions cannot be enabled or disabled. Locking is resolved from manifest `"locked"`; if omitted, kernel-origin extensions default locked and app-origin extensions default unlocked.

### Dependency Check on Enable

Before an extension is enrolled in the enabled list, Bootstrap validates each entry's declared `depends` against the names currently listed in `enabled.plugins` + `enabled.themes`: any dependency not satisfied by another **currently-enabled** extension will cause the enable to fail with a descriptive error:

```
Error: dependencies for 'SomePlugin' unresolved: depOne, depTwo
```

This check ensures that enabling an extension does not introduce a bootstrap-time fatal due to missing runtime dependencies.

### Compatibility — Warning-Only

Extension manifests may declare `kernel-compat` constraints. During discovery, these are validated and stored in the `compatStatus` field of `extension_index`:

| compatStatus | Meaning |
|--------------|---------|
| `unconstrained` | No `kernel-compat` field or empty/whitespace-only. |
| `compatible`  | Constraint parsed and matched running kernel version. |
| `incompatible`| Constraint parsed but mismatched; warning emitted to STDERR. |

Compliance is **warning-only**: incompatible extensions may still be enabled/disable, their hooks fire normally, and Bootstrap does not block on incompatibility at runtime. Only a STDERR message is produced:

```
Extension 'example': kernel-compat '^2.0' incompatible with running kernel 1.95.0
```

### Lifecycle Hooks Fired on Pending Events

Pending events are processed during `Bootstrap::fireLifecycleHooks()`, which reads state via `Bootstrap::loadLifecycleState()` and runs after discovery and hook registration but before the Router/CLI subsystem boots. For each pending entry, hooks are fired in sequence:

| Action | Hook fired (in order) | Context passed |
|--------|----------------------|----------------|
| `enable`  | `extension.pre_enable` → `extension.post_enable` | `['action'=> 'enable', 'name' => '<name>', 'type' => '<type>', 'source' => '<source>']` |
| `disable` | `extension.pre_disable` → `extension.post_disable` | `['action'=> 'disable', 'name' => '<name>', 'type' => '<type>', 'source' => '<source>']` |

The pending list is **cleared** after all hooks have fired successfully and the state file is re-persisted with an empty pending list. If hook firing fails, the pending entries remain intact for processing on the next bootstrap/CLI run.

### Interaction with Pre-existing Discovery Lifecycle

Extension enable/disable state does **not** modify manifest format or discovery mechanics:

1. **Discovery** (Step 1–6 in existing document): Unaffected — all manifests are parsed from disk regardless of enabled state.
2. **Deduplication** (Step 1b): Unaffected — same name-overwrites-app semantics unchanged.
3. **Dependency Validation on Discovery**: Dependency validation runs after lifecycle filtering and checks only enabled manifests.
4. **Lifecycle Engine** (new): After discovery indexing but before subsystem boot, `fireLifecycleHooks()` checks pending events, fires pre/post hooks, updates enabled lists via CLI commands if needed, and then the enabled arrays determine which extensions are subsequently activated at runtime.

### State Mutation Safety

- State changes from CLI commands only modify `config/extensions.cfg` (`extensions.json` is deprecated and supported as a read-only fallback for existing data).
- Enabled names are verified for existing in `extension_index` before mutation.
- Already-disabled extensions produce a confirmation message but no state change or pending event.

## Features Implemented Beyond Scope

Declared dependency chains are transitively ordered by the topological sort (Steps 3 and 6 in Bootstrap-phase Lifecycle): every direct dependency's own dependencies load before dependents. Every declared dependency must already be discovered and enabled; automatic enabling, installation, or acquisition of missing dependencies is not implemented. Dependency version constraints are not supported by `depends`; only existence checking against the known manifest set occurs.

## Lifecycle Features (Not Implemented)

The following lifecycle capabilities are planned but not present in the current codebase:

- **Version-constraint enforcement** — Currently `kernel-compat` constraints are warning-only during discovery; unrecognized patterns default to compatible instead of blocking bootstrap.
- **Automatic dependency installation** — Resolving and installing missing extensions from a repository.

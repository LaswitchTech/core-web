# Extension Lifecycle

## Overview

Extensions participate in three phases of the Core-Web bootstrap lifecycle: **Discovery**, **Registration**, and **Runtime**. Discovery is executed by `Bootstrap::registerExtensions()` before any subsystem (Router/CLI) boots. Registered hooks are stored in the `Hook\Registry` and triggered at runtime when their corresponding hook names fire. Extension manifests that fail validation are skipped silently; extension dependency failures trigger a hard bootstrap error.

## Bootstrap-phase Lifecycle

The sequence is fixed — no hooks fire during discovery itself:

```
1. Multi-Root Discovery        Parser::discover(root, origin) → list<Extension>
2. Name Deduplication          associative-array overwrites   → app wins framework collisions
3. Dependency Validation       $knownNames + in_array()      → fail-fast on unresolved deps
4. Autoloader Installation     spl_autoload_register()       → Laswitchtech\CoreWeb\Plugin\* / Theme\*
5. Hook Registration           Registry::addCallback()       → dotted-only hooks → empty placeholders
6. Layout Registration         Registry::addClassCall()      → class::method registrations
7. Metadata Indexing           Container::set()              → extension_index keyed by name
```

### Phase Details

#### 1. Manifest Discovery (Multi-Base)

Bootstrap walks **two extension bases** in a fixed order:

| Order | Root | Description |
|-------|------|-------------|
| 1 | Framework | `$vendor/laswitchtech/core-web/ext` — shipped framework extensions |
| 2 | Application | `<app-root>/ext` — user-provided extensions |

For each base, `Parser::discover($baseDir, $origin)` walks `themes/` and `plugins/` subdirectories, parses each `manifest.json` or `extension.json`, normalizes fields via `Parser::validate()`, and returns a list of `Manifest\Extension` value objects. Each parsed extension carries an `$origin` property (`'framework'` or `'app'`) indicating where it was discovered.

Malformed manifests are logged to STDERR and removed from the list per-base (tolerant — no bootstrap failure).

If **neither** base directory exists, discovery returns an empty array; Bootstrap registers an empty Hook\Registry and `extension_index` object and proceeds without extensions.

#### 1b. Name Deduplication (Between-Base Merge)

After both bases are parsed, their results are merged into a single flat list. Any two entries sharing the same `$name` are **deduplicated** using last-write-wins semantics:

```php
$deduplicated = [];
foreach ($mergedManifests as $ext) {
    $deduplicated[$ext->name] = $ext;   // app overwrites framework on collision
}
$deduplicated = array_values($deduplicated);   // re-index to [0..n-1]
```

Because the framework base is always processed first, any identically-named extension in the application base naturally wins. **All downstream phases operate only on this deduplicated set.**

#### 2. Dependency Validation

After all manifests parse successfully, Bootstrap iterates them and checks each `$manifest->depends` entry against `$knownNames = array_column($manifests, 'name')` using a flat `in_array()` comparison:

```php
foreach ($m->depends as $dep) {
    if (!in_array($dep, $knownNames, true)) {
        throw new RuntimeException("Extension '{$m->name}': unresolved dependency '{$dep}'. ...");
    }
}
```

Unresolved dependencies cause a hard `RuntimeException` at bootstrap. No topological sort or transitive resolution exists.

#### 3. Autoloader Installation

All extension `src/` directories are gathered and registered in a single `spl_autoload_register()` callback that responds to two namespace prefixes:

- `Laswitchtech\CoreWeb\Plugin\*`
- `Laswitchtech\CoreWeb\Theme\*`

This step runs **before** Hook registration so that class-based hook callbacks can be resolved via reflection. Duplicate directories are deduplicated.

#### 4. Hook Registration

For each extension, every `hooks` entry is processed:

| Entry format | Example | Behavior |
|---|---|---|
| Dotted-only (no `::`) | `"page.before_render"` | Registers `$hookName` with an empty placeholder callback `fn () => []`. No resolution failure. |
| Hook name + class::method | `"layout.header::Example\\Plugin\\onLayoutHeader"` | Split on first `::`, then on last `::` within the class/method part. Resolves via `Hook\Registry::addClassCall()`. **Fails bootstrap** if reflected class or method does not exist. |

#### 5. Layout Registration

Each `layouts` entry is a string identifier (e.g., `"sidebar"`). Bootstrap registers a placeholder hook named `layout.{identifier}`:

```php
foreach ($manifest->layouts as $layoutDef) {
    $hookRegistry->addCallback("layout.{$layoutDef}", static fn () => [], 0);
}
```

Layouts do **not** register via `addClassCall()`; they are purely placeholder hooks that signal the layout's existence to downstream subsystems.

#### 6. Metadata Indexing

Each extension's metadata is stored in the Container under `extension_index`, keyed by `$manifest->name`. The index stores six fields: type, version, directory, depends, origin, and kernelCompat.

```
extension_index["example-plugin"] = {
    type:          "plugin",
    version:       "1.0.0",
    directory:     "/absolute/path/to/ext/plugins/example-plugin",
    depends:        ["core.authentication"],
    origin:         "app",
    kernelCompat:   "^1.0",
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
| Class/method callback resolution | `addClassCall()` throws if class or method doesn't exist | Bootstrap-wide (hard fail) |
| Dotted-only hook name parsing | No error — registered as empty placeholder callback | Informational only |
| Missing ext/ directory | Silent early return with empty registry | Non-error (normal for Composer installs) |

## Future Lifecycle Features (Not Implemented)

The following lifecycle capabilities are planned but not present in the current codebase:

- **Enable/disable state** — `extension.enable` / `extension.disable` hooks or CLI commands to toggle activation.
- **State persistence** — Persisting enable/disable status across boots (e.g., via database or config).
- **Dependency ordering** — Topological sort of dependencies instead of flat existence check.
- **Activation/deactivation hooks** — Dedicated lifecycle callbacks (`install`, `uninstall`, `activate`, `deactivate`) not yet supported.
- **Transitive resolution** — Following dependency chains to ensure all transitive deps are satisfied.
- **Cycle detection** — Detecting and reporting circular dependencies during discovery.

# Asset\Registry

## Purpose

Store for CSS and JS asset registrations keyed by a three-level identity `(type → scope → file)`. Provides precedence-based conflict resolution, deterministic sorting, and explicit-default lookups. No legacy flat-name compatibility API exists — every public method addresses the composite `$scope` + `$file` identity directly.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final class Registry { }
```

- **`final`** — no subclassing expected.
- **Non-readonly** — mutable internal `$store` and monotonic `$nextOrder`.
- **Not a singleton** — one instance created per bootstrap, keyed as `'asset_registry'` in the container.

## Internal Identity & Storage

Entries are stored in a three-level nested array:

```php
/** @var array<string, array<string, array<string, Entry>>>  [type][scope][file] => Entry */
private array $store = [];

// Example populated store:
// [
//     'css' => [
//         'kernel'       => ['styles' => Entry{…}],
//         'app'          => ['styles' => Entry{…}],
//         'themes/my-th' => ['theme'  => Entry{…}],
//     ],
//     'js'  => [
//         'plugins/admin' => ['app'    => Entry{…}],
//     ],
// ]
```

Identity tuple: `(type, scope, file)` — all three are trimmed; `$scope` and `$type` are lowercased. No flat-name key exists anywhere in the public or internal API.

## Public API

### `css(string $scope, string $file, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self`

Register a CSS asset. Delegates to `doAdd()`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$scope` | — | Extension scope: `{kind}/{slug}` (e.g. `themes/my-theme`, `plugins/admin`) or root (`kernel`, `app`). Lowercase, no leading/trailing slashes. |
| `$file` | — | Leaf filename (no path separators). Preserves original casing after trim. |
| `$path` | — | Absolute or relative filesystem path to the source file. Not existence-validated at registration time. Must not be empty. |
| `$provider` | `core` | Source provider: `app`, `theme`, `plugin`, `core`. Determines precedence rank. |
| `$priority` | `0` | Higher numeric priority wins conflicts during insertion. |
| `$metadata` | `[]` | Arbitrary associative metadata (e.g. `['default' => true]`). |

Returns `$this` for method chaining.

```php
// Kernel stylesheet
$registry->css('kernel', 'styles.less', '/opt/app/kernel/styles.less', Entry::PROVIDER_CORE, 100);

// Application override with default marker
$registry->css('app', 'styles.less', '/opt/app/assets/app.scss', Entry::PROVIDER_APP, 200, ['default' => true]);

// Theme stylesheet
$registry->css('themes/my-theme', 'theme.less', __DIR__ . '/theme.less', Entry::PROVIDER_THEME, 300);

// Plugin JS
$registry->js('plugins/admin', 'app.js', __DIR__ . '/app.js', Entry::PROVIDER_PLUGIN, 400);
```

### `js(string $scope, string $file, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self`

Register a JS asset. Same signature and behavior as `css()`; uses `Entry::TYPE_JS`.

```php
$registry->js('plugins/admin', 'app.js', __DIR__ . '/app.js', Entry::PROVIDER_PLUGIN, 400);
```

### `register(Entry $entry): self`

Register an existing `Entry` object with full precedence enforcement. The entry is **copied** (not stored by reference) with a fresh `$order` number.

Precedence rules during insertion:

1. No existing entry for `(type, scope, file)` → insert unconditionally.
2. New `$priority` > existing `$priority` → replace.
3. New `$priority` < existing `$priority` → keep existing (higher priority wins).
4. Same priority → compare provider rank (lower = better: `app` beats `theme` beats `plugin` beats `core`). If new rank is worse, keep existing.
5. Same priority and same provider rank → compare order. Existing was registered earlier (lower `$order`), so keep it.

```php
$registry->register(new Entry('kernel', 'styles.less', '/css/kernel.css', Entry::TYPE_CSS, Entry::PROVIDER_CORE, 100));
// vs. replace(…): register() applies precedence; replace() bypasses it.
```

### `replace(string $type, string $scope, string $file, ?Entry $entry = null): ?Entry`

Unconditional replacement or removal — **bypasses all precedence rules**. Type must match on insertion.

| Call | Effect |
|------|--------|
| `replace('css', 'kernel', 'styles.less')` | Remove and return previous Entry (or `null`). |
| `replace('css', 'kernel', 'styles.less', null)` | Same as above. |
| `replace('css', 'kernel', 'styles.less', $newEntry)` | Unconditionally store `$newEntry`, return previous Entry (or `null`). |

```php
// Remove an entry
$prev = $registry->replace('css', 'kernel', 'styles.less');

// Swap with a new entry
$prev = $registry->replace('css', 'kernel', 'styles.less', $newEntry);
```

### `has(string $type, string $scope, string $file): bool`

Check whether an asset exists for `(type, scope, file)`. All three arguments are normalized (lowercased + trimmed; slashes stripped from scope).

```php
$exists = $registry->has('css', 'kernel', 'styles.less');  // true / false
```

### `get(string $type, string $scope, string $file): ?Entry`

Get a single entry by `(type, scope, file)`, or `null` if not found. Returns the stored Entry directly (not a copy).

```php
$entry = $registry->get('css', 'kernel', 'styles.less');
if ($entry !== null) {
    echo $entry->path;  // public property, no getter needed.
}
```

### `getScope(string $type, string $scope): array`

Return all entries matching an exact `(type, scope)` bucket (all files within that scope). Returns an empty array when the scope contains zero entries.

```php
$entries = $registry->getScope('css', 'kernel');  // Entry[] keyed by filename
// ['styles.less' => Entry{…}]
```

### `getDefault(string $type, string $scope): ?Entry`

Return the **explicitly marked** default entry for a given `(type, scope)`. An entry counts as default only when its metadata satisfies: `(metadata['default'] ?? false) === true`.

- Exactly one marked default → return that Entry.
- Zero or more than one marked defaults → return `null` (no inference, no best-effort fallback).

```php
$default = $registry->getDefault('css', 'app');
// If metadata['default'] === true on exactly one entry in store['css']['app']:
//   returns that Entry
// Otherwise: null
```

### `allCss()`, `allJs()` — unordered lists

```php
/** @var Entry[] */
$allCss = $registry->allCss();  // flat list, no sorting guarantees
$allJs  = $registry->allJs();
```

## Ordering & Conflict Precedence

### Deterministic Ordering

When entries need to be ordered (via `orderedCss()`, `orderedJs()`, or downstream consumers):

```
priority ↑ → registration order ($nextOrder++) ↑ → scope ↑ → filename ↑
```

- `$nextOrder++` increments on **every** call to `doAdd()` or `register()`, including entries whose insertion is later rejected by precedence.
- `$priority` ascending: lower values first. Default convention — kernel (100), app (200), theme (300), plugin (400).
- `$order` ascending: registration sequence number. Earlier registrations compile before later ones within the same priority.
- Scope then filename as final alphabetical tie-breaker when both priority and order collide (theoretically impossible in practice, but ensures a total order).

### Conflict Precedence for the Same Identity `(type, scope, file)`

At registration time (`doAdd()` / `register()`), when an entry for the exact same `(type, scope, file)` already exists:

1. **Higher `$priority` wins.** New > existing → replace; new < existing → keep existing.
2. **Same priority** → provider rank (lower rank = higher precedence). Provider order: `app(0) > theme(1) > plugin(2) > core(3)`. If new rank > existing, keep existing; if new < existing, replace.
3. **Same priority + same provider rank** → registration order. Existing was registered earlier (lower `$order`), so keep it.

```php
// Same (css, app, styles.less): higher-priority replacement wins
$registry->css('app', 'styles.less', '/a.css', Entry::PROVIDER_APP, 200);   // first: priority=200
$registry->css('app', 'styles.less', '/b.css', Entry::PROVIDER_APP, 300);   // second: priority=300 → replaces the above

// Same priority — provider rank tie-breaker
$registry->css('themes/x', 't.less', '/t1.css', Entry::PROVIDER_THEME, 300);  // theme = rank(1)
$registry->css('themes/y', 't.less', '/t2.css', Entry::PROVIDER_PLUGIN, 300); // plugin = rank(2) → keeps existing (theme wins)
```

### Key Design Decisions

- **Registry is order-neutral during storage.** Sorting is delegated entirely to consumers (`orderedCss()`, `LessCompiler`). The `$store` array carries no ordering guarantees.
- **`$nextOrder` increments unconditionally** on every registration attempt, guaranteeing strict total ordering without rollbacks.
- **Provider rank affects only conflict resolution**, not compilation or display order. Once a winner is chosen at registration time, the surviving entry's `$priority` and `$order` alone determine its position in compiled output.
- **No legacy flat-name API.** Every lookup method (`has()`, `get()`, `replace()`) requires all three identity arguments. There is no two-argument or name-only interface.

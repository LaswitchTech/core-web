# Asset\Registry

## Purpose

Store for CSS and JS asset registrations keyed by `(type, name)` with precedence-based conflict resolution. The registry is created during `Bootstrap::initAssets()`, populated with kernel and application conventions, then filled by enabled extensions through the `asset.register` hook. Compiled entries are passed to `LessCompiler` per-request via the `/css` route.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final class Registry { ... }
```

- **`final`** — no subclassing expected.
- **Non-readonly** — maintains mutable internal `$store` and `$nextOrder` counter for registration lifecycle.
- **Not a singleton** — one instance created per bootstrap run in `Bootstrap::initAssets()` and stored in the container as `'asset_registry'`.

## Storage Structure

Entries are stored as a nested array keyed by type then name:

```php
/** @var array<string, array<string, Entry>>  [type][name] => Entry */
private array $store = [];

// Internal structure example for CSS assets:
// [
//     'css' => [
//         'kernel/styles' => Entry{...},
//         'app/styles'    => Entry{...},
//     ],
// ]
```

The `$nextOrder` counter is monotonically increasing and increments for **every** registration attempt (including those rejected by precedence) at the time of the call, assigned to every inserted entry at registration time for deterministic tie-breaking during compilation.

## Public API

### `css(string $name, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self`

Convenience method to register a CSS asset. Delegates to `doAdd()` internally.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$name` | — | Asset name (case-insensitive). |
| `$path` | — | Absolute or relative file path. Not validated for existence at registration time. |
| `$provider` | `Entry::PROVIDER_CORE` | Source provider determining precedence rank. |
| `$priority` | `0` | Higher numeric priority wins conflicts. |
| `$metadata` | `[]` | Arbitrary associative metadata array. |

Returns `$this` for method chaining.

### `js(string $name, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self`

Convenience method to register a JS asset. Same signature and behavior as `css()`, uses `Entry::TYPE_JS`.

### `register(Entry $entry): self`

Register an existing `Entry` object with full precedence rule enforcement. The entry is **copied** (not stored by reference) with a fresh order number to prevent post-registration mutations from affecting resolution order.

Precedence rules during insertion:

1. If no existing entry for `(type, name)` — insert unconditionally.
2. New priority > existing priority — replace.
3. New priority < existing priority — keep existing (higher priority wins).
4. Same priority — compare provider rank (lower = better; `app` beats `theme`, which beats `plugin`, which beats `core`). If new rank is worse, keep existing.
5. Same priority and same rank — compare order. Existing was registered earlier (lower order), so keep it.

Throws `\InvalidArgumentException` if the entry has an invalid type or provider that isn't in `VALID_TYPES` / `VALID_PROVIDERS`.

### `replace(string $type, string $name, ?Entry $entry = null): ?Entry`

Unconditional replacement or removal — **bypasses all precedence rules**. Used for hot-swap scenarios.

| Behavior | Effect |
|----------|--------|
| `replace('css', 'name')` | Remove and return previous Entry (or `null`). |
| `replace('css', 'name', null)` | Same as above — remove and return previous Entry. |
| `replace('css', 'name', $newEntry)` | Unconditionally store replacement, return previous Entry (or `null`). New entry gets a fresh order number. Type must match lookup `$type`. |

### `has(string $type, string $name): bool`

Check whether an asset exists for the given `(type, name)`. Names are normalized (lowercased and trimmed) before lookup.

### `get(string $type, string $name): ?Entry`

Get a single entry by `(type, name)`, or `null` if not found. Returns a reference to the Entry object (not a copy).

### `allCss(): array<string, Entry>`

Return all registered CSS entries keyed by normalized asset name. Does not apply any sorting — entries are returned in whatever internal bucket order. Consumers (primarily `LessCompiler`) must sort before processing.

### `allJs(): array<string, Entry>`

Return all registered JS entries keyed by normalized asset name. Same behavior as `allCss()` but for JS type.

## Internal Implementation

### `register(Entry $entry): self` — Full Precedence Logic

```
1. Validate entry type and provider (throws \InvalidArgumentException on invalid).
2. Assign fresh $order = ++$nextOrder; normalize name. ($nextOrder increments here regardless of whether this registration will be accepted or rejected by precedence rules.)
3. Create a COPY of the Entry with fresh order number.
4. If no existing slot → insert unconditionally.
5. If existing slot:
    a. Compare priority: higher wins. New < existing → keep existing, return.
    b. Same priority → compare provider rank (lower=first). New rank > existing → keep existing, return.
    c. Same priority + same rank → compare order. new >= existing → keep existing, return.
6. New entry replaces existing: $this->store[$type][$norm] = $newEntry.
7. Return $this.
```

### `doAdd(string $name, string $path, string $type, string $provider, int $priority, array $metadata): self`

Internal: construct and insert an Entry with precedence enforcement. Called by `css()` and `js()`. Follows the exact same precedence rules as `register()`, but constructs the Entry directly instead of accepting one as a parameter. Provider is normalized to lowercase; validated against `VALID_PROVIDERS`. Throws `\InvalidArgumentException` on empty `$name` or `$path`.

## Bootstrap Lifecycle

### 1. Creation (during `Bootstrap::initAssets()`)

```
bootstrap run() chain:
   initConfig → initContainer → registerCoreServices → ... → initExtensions → initTemplateRegistry → registerMessagingServices → registerHelperServices → fireLifecycleHooks → **initAssets**

Inside initAssets():
   $registry = new AssetRegistry();
   
   // Register kernel styles.less (priority 100, Provider::CORE)
   if (is_file($kernelRoot . '/Assets/styles.less')) {
       $registry->css('kernel/styles', realpath(...), Entry::PROVIDER_CORE, 100);
   }
   
   // Register app styles.less (priority 200, Provider::APP) with dedup guard
   if (is_file($appRoot . '/Assets/styles.less')) {
       $realpath = realpath($appStyler);
       if ($kernelStyler is same file → skip; else register at priority 200, provider app)
   }
   
   $container->set('asset_registry', $registry);
```

### 2. Population (via `asset.register` hook)

After the registry is stored in the container, `initAssets()` triggers the `asset.register` hook:

```php
$hookRegistry->trigger('asset.register', [
    'registry'  => $registry,
    'container' => static::$instance,
    'mode'      => strtolower($this->mode), // 'web' or 'cli'
]);
```

This is the phase where:
- **Enabled themes** call `$registry->css('my-theme/theme', __DIR__ . '/assets/style.less', Entry::PROVIDER_THEME, 300);`
- **Enabled plugins** call `$registry->js('my-plugin/components', __DIR__ . '/js/components.js', Entry::PROVIDER_PLUGIN, 400);`
- A **CSS/LESS plugin example**: a provider plugin registering an absolute readable `.less` path at priority 400 — `$registry->css('my-plugin/forms', '/absolute/path/to/ext/plugins/my-plugin/assets/forms.less', Entry::PROVIDER_PLUGIN, 400);`
- Only themes and plugins whose manifests appear in the enabled state (from `extensions.cfg`) have their `$extensionBase/hooks` registered via `Hook\Registry::addClassCall()`, so only **enabled** extensions can populate the registry.

### 3. Compilation (per-request on `/css`)

The container key `'asset_registry'` is resolved at request time during the `/css` route handler in `bootWeb()`:

```php
$assetRegistry = $c->resolve('asset_registry');
$compiler = new LessCompiler($appRoot, $cacheDir);
$css      = $compiler->compile($assetRegistry, debugMode);
```

The registry does **not** perform any sorting. Sorting happens in `LessCompiler::compile()` using the three-key sort: `priority` ascending → `order` ascending → `name` ascending (alphabetical). Provider rank is explicitly **not used for compilation order** — only for precedence resolution during conflict/same-name collision handling.

## Conflict Resolution versus Compilation Order

A critical distinction: **conflict resolution at registration time** and **compile-time source ordering are two separate processes**.

### Registration-Time (Registry)

When duplicate `(type, name)` slots collide:
- Higher numeric `$priority` wins the conflict → becomes the sole surviving entry.
- Same priority → provider rank: `app(0) > theme(1) > plugin(2) > core(3)`.
- Same priority + same rank → registration order: first in wins (lower `$order`).

### Compilation-Time (LessCompiler)

The single surviving entries are sorted for compilation order by:
1. **`$priority` ascending** — lower numeric values compile first. The default source tier map is:
   - Kernel (priority 100) → compiles first
   - Application (priority 200) → compiles second
   - Theme (recommended priority 300) → compiles third
   - Plugin (recommended priority 400) → compiles fourth
   
   Higher priorities compile later, ensuring that lower-priority source CSS has its rules emitted first and higher-priority rules can override via normal CSS cascade.

2. **`$order` ascending** — deterministic tie-breaking within the same priority tier. Earlier registration → earlier compilation.

3. **`$name` string comparison** — final alphabetical tie-breaker when both `$priority` and `$order` are identical.

**Provider rank is not used for compilation order.** Provider rank only affects which entry wins a same-name conflict at registration time. Once resolved, the surviving entries compile by priority → order → name only.

## Key Design Decisions

### 1. Registry Is Order-Neutral; Compiler Enforces Ordering

The registry intentionally does **not** sort entries internally. It stores them as a plain nested array `[type][name]` to minimize overhead during registration and keep the store neutral with respect to iteration order (which is an implementation detail of PHP arrays). Sorting is delegated entirely to `LessCompiler`, which has access to all three sort keys (`priority`, `order`, `name`) needed for deterministic output.

### 2. Precedence Resolution Uses Three-Tier Tie-Breaking

A single numeric value (`$priority`) cannot distinguish between every unique source, so conflict resolution uses:
- Priority as the primary discriminator (configurable at registration time).
- Provider rank as the secondary discriminator (built-in convention for tier hierarchy).
- Registration order as the tertiary discriminator (monotonic counter ensures strict total ordering).

### 3. register() Copies, doAdd() Constructs a New Entry

`register()` creates a fresh **copy** of the supplied Entry object with a new `$order` number before storage, preventing mutation of the original. `doAdd()` constructs a **new** Entry directly (it does not accept one as a parameter). Both ensure registration-time semantics (priority, order) are stable for the lifetime of the bootstrap execution.

### 4. Path Is Not Validated at Registration

The Registry does not call `is_file()` or `realpath()` during `css()`, `js()`, or `register()`. The path is taken on trust:
- Kernel and application conventions pass `realpath()` directly to ensure valid, resolved paths.
- Extension hook callbacks resolve their own asset paths at runtime and call `$registry->css()` / `$registry->js()` with those absolute paths; the registry does not read paths from manifests.
- Validation (existence + readability) happens lazily in `LessCompiler::compile()`, which silently skips unreadable entries rather than throwing. This prevents a single missing asset from breaking the entire CSS pipeline.

### 5. replace() Bypasses Precedence Intentionally

`replace()` exists as an escape hatch — when code needs to unconditionally swap or remove an entry (e.g., programmatic test setup, admin overrides), precedence rules are not applied. The replacement Entry type must match the lookup type; mismatch throws `\InvalidArgumentException`.

## Current Behavior Notes / Limitations

### 1. No Type-Safe Asset Pipeline

The registry accepts arbitrary paths for `$path`. There is no built-in validation that `.less` files exist for CSS entries or that JS entry paths are actual JavaScript/TypeScript files. This applies at both the Registry and LessCompiler levels — `LessCompiler::compile()` filters to only `.less` files (checked by path suffix `.less`; case-insensitive check on last 5 characters), but a `.css` or other file registered as a CSS asset would sit silently in the store without being compiled.

### 2. All Entries Stored Per-Type Separately

CSS entries and JS entries live in completely separate buckets (`$store['css']` and `$store['js']`). There is no cross-type conflict resolution — registering both an entry named `foo.css` as type `css` and another named `foo` as type `js` does not produce a collision. They are independent registrations.

### 3. No Pagination or Batch Retrieval

The registry only provides `allCss()` / `allJs()` (entire bucket) and `get(type, name)` (single entry). There is no partial retrieval method (e.g., "give me entries with provider = 'theme' only"). Filtering is the responsibility of the consumer.

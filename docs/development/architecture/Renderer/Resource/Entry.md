# Resource\Entry — Renderer Phase 1 Documentation

**Class**: `Laswitchtech\CoreWeb\Renderer\Resource\Entry`  
**File**: `src/Renderer/Resource/Entry.php`  
**Namespace**: `Laswitchtech\CoreWeb\Renderer\Resource`

---

## Purpose

Immutable value object representing a renderer resource (layout, template, or view). Stored inside `Registry`. No filesystem access.

---

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `TYPE_LAYOUT` | `'layout'` | Layout resource type |
| `TYPE_TEMPLATE` | `'template'` | Template resource type |
| `TYPE_VIEW` | `'view'` | View resource type |
| `VALID_TYPES` | `['layout', 'template', 'view']` | All valid types (array) |
| `PROVIDER_APP` | `'app'` | App provider level |
| `PROVIDER_THEME` | `'theme'` | Theme provider level |
| `PROVIDER_PLUGIN` | `'plugin'` | Plugin provider level |
| `PROVIDER_CORE` | `'core'` | Core provider level |
| `VALID_PROVIDERS` | `['app', 'theme', 'plugin', 'core']` | All valid providers (array) |

---

## Constructor Parameters

```php
__construct(
    string $name,      // Resource name identifier
    string $type,      // One of TYPE_* constants
    string $path,      // Absolute filesystem path
    string $provider = self::PROVIDER_CORE,  // Provider rank
    int $priority = 0,        // Numeric priority (higher = better)
    array $metadata = [],     // Arbitrary key-value metadata
    int $order = 0,         // Deterministic order (lower = earlier)
)
```

- `$name`: arbitrary identifier for lookup (`resolve('name', 'type')`).
- `$path`: **absolute** path. Does not exist-on-write; validated at render time only.
- `$provider`: rank used in precedence resolution. Lower rank wins when priority ties.
- `$priority`: numeric value; higher wins first, before provider rank.

---

## Properties (readonly)

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Resource name |
| `type` | `string` | Resource type constant |
| `path` | `string` | Absolute path |
| `provider` | `string` | Provider rank |
| `priority` | `int` | Numeric priority |
| `metadata` | `array` | Custom metadata (shallow, mutable content) |
| `order` | `int` | Deterministic insertion order |

---

## Methods

### `providerRank(): int`

Returns the precedence rank of this entry's provider. Lower values win ties.  
Core = 3, Plugin = 2, Theme = 1, App = 0. Unknown providers return `\PHP_INT_MAX`.

Validated by Registry; Entry itself does no checks — it is a dumb data object.

### `isType(string $type): bool`

Returns `true` if `$this->type === $type`. Utility for type-checking outside the registry.

### `withName(string $name): self`

Returns a **new** Entry with the same values except `$name`.

### `withPath(string $path): self`

Returns a **new** Entry with the same values except `$path`.  
Useful for base-path normalization (e.g., converting relative paths to absolute).

### `withPriority(int $priority): self`

Returns a **new** Entry with the same values except `$priority`.

---

## Current Behavior Notes / Limitations

1. **No path normalization**: paths are stored verbatim from construction. If `fromArray()` or another factory normalizes, that logic lives outside this class (e.g., in `Registry`). Phase 1 has no such factory.

2. **`metadata` is not deep-immutable**: the outer array is readonly (cannot be replaced), but its contents may contain mutable references. This is intentional — metadata is typically flat key/value strings/integers.

3. **No validation in constructor**: Entry does not validate type or provider values. Validation is delegated to `Registry::add()` and `Registry::register()`. This keeps Entry lightweight and reusable as a value transfer object.

4. **`isType()` compares by exact string equality** against the stored `$type` property, not against constants — because constants are aliases for strings.

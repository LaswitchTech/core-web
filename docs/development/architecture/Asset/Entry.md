# Asset\Entry

## Purpose

Immutable value object representing a single CSS or JS asset registration. Carries the metadata (path, type, provider, priority, order) that the Asset Registry uses for precedence resolution and which the LessCompiler reads when collecting entries for compilation.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final readonly class Entry { ... }
```

- **`final readonly`** — all properties are declared `readonly`; no mutation after construction is possible.
- The name is **normalized** to lowercase trimmed form in the constructor and stored under that key in the Registry.
- Validated against allowed types (`css`, `js`) and providers (`app`, `theme`, `plugin`, `core`).

## Public Constants

```php
public const TYPE_CSS  = 'css';
public const TYPE_JS   = 'js';
public const VALID_TYPES = ['css', 'js'];

public const PROVIDER_APP     = 'app';
public const PROVIDER_THEME   = 'theme';
public const PROVIDER_PLUGIN  = 'plugin';
public const PROVIDER_CORE    = 'core';
public const VALID_PROVIDERS  = ['app', 'theme', 'plugin', 'core'];
```

## Properties

All declared as `public` (no getters). The name is normalized automatically.

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Normalized asset name (lowercase, trimmed). Used as the primary key alongside `$type`. |
| `path` | `readonly string` | Absolute or relative filesystem path to the source file. LessCompiler resolves and reads this at compile time. |
| `type` | `readonly string` | One of `css` or `js`. Validated on construction; rejected otherwise via `\InvalidArgumentException`. |
| `provider` | `readonly string` | Source provider: `core`, `app`, `theme`, or `plugin`. Determines **precedence rank** for conflict resolution. |
| `priority` | `readonly int` | Numeric priority passed during registration. Higher values win conflicts; used in LessCompiler ascending sort order. |
| `metadata` | `readonly array` | Arbitrary associative metadata attached to the entry (not used by core code). |
| `order` | `readonly int` | Monotonically increasing counter assigned by the Registry at registration time. Used for **deterministic** tie-breaking within same-priority/same-provider registry conflicts and for LessCompiler sorting order. |

### Provider Rank Table

Used internally for precedence resolution only. Lower rank = higher precedence in conflict situations:

| Provider | Rank |
|----------|------|
| `app`    | 0    |
| `theme`  | 1    |
| `plugin` | 2    |
| `core`   | 3    |

## Public API

### `__construct(string $name, string $path, string $type, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = [], int $order = 0)`

Creates a new immutable Entry. Normalizes `$name` to lowercase trimmed form; validates `$type` and `$provider`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$name` | — | Asset name (case-insensitive). Thrown on empty after trim. |
| `$path` | — | Filesystem path to the source file. Not validated for existence at construction time. |
| `$type` | — | One of `css` or `js`. |
| `$provider` | `Entry::PROVIDER_CORE` | Source provider determining precedence rank. |
| `$priority` | `0` | Numeric priority for conflict resolution (higher wins). |
| `$metadata` | `[]` | Arbitrary associative metadata array. |
| `$order` | `0` | Monotonic counter assigned by the Registry; default `0` is replaced during construction via the Registry. |

Throws `\InvalidArgumentException` when:
- `$type` is not in `{Entry::TYPE_CSS, Entry::TYPE_JS}`.
- `$provider` is not in valid providers.
- `$name` is empty after trimming.

### `providerRank(): int`

Returns the numeric precedence rank for this entry's provider (lower = higher priority). Used by Asset Registry during conflict resolution. Returns `\PHP_INT_MAX` for unknown providers.

## Construction Examples

```php
// Kernel-registered CoreWeb internal stylesheet
$entry = new Entry('kernel/styles', '/path/to/kernel/styles.less', Entry::TYPE_CSS, Entry::PROVIDER_CORE, 100);

// Application overrides
$appEntry = new Entry('app/styles', '/path/to/app/styles.less', 'css', 'app', 200);

// Theme-provided stylesheet
$themeEntry = new Entry('my-theme/theme.css', '/ext/themes/my-theme/assets/theme.less', 'css', 'theme', 300);

// Plugin-provided stylesheet - with metadata
$pluginEntry = new Entry('my-plugin/components/css', '/ext/plugins/my-plugin/src/assets/styles.less', 'css', 'plugin', 400, ['component' => 'forms']);
```

## Conflict Resolution Precedence Rules

When the Registry encounters duplicate (type, name) slots in `register()` or `doAdd()`:

1. **Higher numeric priority wins.** The new entry replaces the existing one if its `$priority` > existing's `$priority`.
2. **Same priority** → provider rank (lower rank = higher precedence). If new provider rank > existing, existing wins; if new < existing, new entry wins; if equal, fall through to rule 3.
3. **Same priority and same rank** → registration order (`order`). Earlier registration (lower order) wins because the new entry gets a later order number.

Provider rank is **only used during conflict resolution**. It does **not** affect LessCompiler sort order -- that uses `$priority` ascending first, then `$order` ascending, then `$name` string comparison.

## Design Notes

- The Entry class is intentionally minimal -- it carries metadata but has no behavior beyond `providerRank()`. All processing is done by Registry (precedence) or LessCompiler (compilation).
- Names are lowercased and trimmed at construction to ensure case-insensitive deduplication in the Registry store.
- Path validation is deferred: the Registry does not check whether `$path` exists; LessCompiler checks readability before compiling.

# Asset\Entry

## Purpose

Immutable value object representing a single CSS or JS asset registration. Carries metadata (scope, file, path, type, provider, priority, order) that the Asset Registry uses for precedence resolution and which the LessCompiler reads when collecting entries for compilation.

**Identity model: composite of `$scope` + `$file`.** The scope identifies *where* the asset lives (e.g. `kernel`, `app`, `themes/my-theme`, `plugins/my-plugin/components`); the file is the leaf filename within that scope. Neither part may be empty, and each has distinct constraints described below. The Registry stores entries in a three-level array keyed by `(type → scope → file)`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final readonly class Entry { ... }
```

- **`final readonly`** — all properties are declared `readonly`; no mutation after construction is possible.
- `$scope` is normalized to lowercase trimmed form; `$file` is trimmed but otherwise kept as-is (preserving original casing).
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

All declared as `public` (no getters). `$scope` is normalized to lowercase; `$file` is trimmed but preserves original casing.

| Property | Type | Description |
|----------|------|-------------|
| `scope` | `readonly string` | Logical scope of the asset: root scopes (`kernel`, `app`) or extension scopes (`themes/{name}`, `plugins/{name}`). Normalized to lowercase; trimmed. No leading/trailing slashes. Serves as the middle tier of `(type → scope → file)` identity. The physical `$path` is separate and not part of public identity. |
| `file` | `readonly string` | Leaf filename (non-empty, no `/` or `\`, no null byte, not `.` or `..`). Trimmed on construction but preserves original casing. The last component of the asset identity tuple `(type, scope, file)`. |
| `path` | `readonly string` | Absolute or relative filesystem path. **Physical file location only — not part of the public identity.** Used by LessCompiler to locate and read the source file at compile time. |
| `type` | `readonly string` | One of `css` or `js`. Validated on construction; rejected otherwise via `\InvalidArgumentException`. |
| `provider` | `readonly string` | Source provider: `core`, `app`, `theme`, or `plugin`. Determines **precedence metadata** for conflict resolution. Not part of the public identity or URL — only used internally to rank providers against each other. |
| `priority` | `readonly int` | Numeric priority passed during registration. Higher values win conflicts; used in LessCompiler ascending sort order. |
| `metadata` | `readonly array` | Arbitrary associative metadata attached to the entry (not used by core code). Default: `'default' = true` marks an entry as *eligible* for `getDefault()` resolution in the Registry. |
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

### `__construct(string $scope, string $file, string $path, string $type, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = [], int $order = 0)`

Creates a new immutable Entry. Normalizes `$scope` to lowercase trimmed form; validates `$file`, `$type` and `$provider`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `$scope` | — | Logical scope of the asset: root scopes (`kernel`, `app`) or extension scopes (`themes/{name}`, `plugins/{name}`). Lowercase; trimmed. Middle tier of `(type, scope, file)` identity. Thrown on empty after trim. |
| `$file` | — | Leaf filename (non-empty, no `/` or `\`, no null byte, not `.` or `..`). The final component of identity. Must pass `basename()` unchanged. |
| `$path` | — | Physical filesystem path to the source file. **Not part of the public identity** and never contributes to URLs. Not validated for existence at construction time. |
| `$type` | — | One of `css` or `js`. |
| `$provider` | `Entry::PROVIDER_CORE` | Source provider. Serves only as precedence metadata — does not appear in the public URL or contribute to identity. |
| `$priority` | `0` | Numeric priority for conflict resolution (higher wins). |
| `$metadata` | `[]` | Arbitrary associative metadata array. |
| `$order` | `0` | Monotonic counter assigned by the Registry; default `0` is replaced during construction via the Registry. |

Throws `\InvalidArgumentException` when:
- `$scope` is empty after trimming.
- `$file` fails filename constraints (non-empty, no `/`, no `\`, no null byte, not `.` or `..`).
- `$type` is not in `{Entry::TYPE_CSS, Entry::TYPE_JS}`.
- `$provider` is not in valid providers.

### `providerRank(): int`

Returns the numeric precedence rank for this entry's provider (lower = higher priority). Used by Asset Registry during conflict resolution. Returns `\PHP_INT_MAX` for unknown providers.

## Construction Examples

```php
$kernel = new Entry(
    'kernel',
    'styles.less',
    '/opt/core-web/Assets/less/styles.less',
    Entry::TYPE_CSS,
    Entry::PROVIDER_CORE,
    100,
);

$app = new Entry(
    'app',
    'app.js',
    '/srv/application/Assets/js/app.js',
    Entry::TYPE_JS,
    Entry::PROVIDER_APP,
    200,
);

$theme = new Entry(
    'themes/hello-theme',
    'theme.css',
    '/srv/application/ext/themes/hello-theme/Assets/css/theme.css',
    Entry::TYPE_CSS,
    Entry::PROVIDER_THEME,
    300,
);

$plugin = new Entry(
    'plugins/datatables',
    'datatables.min.js',
    '/srv/application/ext/plugins/datatables/Assets/js/datatables.min.js',
    Entry::TYPE_JS,
    Entry::PROVIDER_PLUGIN,
    400,
);
```

## Conflict Resolution Precedence Rules

When the Registry encounters duplicate `(type, scope, file)` slots in `register()` or `doAdd()`:

1. **Higher numeric priority wins.** The new entry replaces the existing one if its `$priority` > existing's `$priority`.
2. **Same priority** → provider rank (lower rank = higher precedence). If new provider rank > existing, existing wins; if new < existing, new entry wins; if equal, fall through to rule 3.
3. **Same priority and same rank** → registration order (`order`). Earlier registration (lower order) wins because the new entry gets a later order number.

Provider rank is **only used during conflict resolution**. It does **not** affect LessCompiler sort order -- that uses `$priority` ascending first, then `$order` ascending, then `$file` string comparison.

## Design Notes

- The Entry class is intentionally minimal -- it carries metadata but has no behavior beyond `providerRank()`. All processing is done by Registry (precedence) or LessCompiler (compilation).
- `$scope` is lowercased and trimmed at construction; `$file` is trimmed but preserves original casing. Identity `(type, scope, file)` uses lowercase `$scope` for case-insensitive deduplication in the Registry store.
- `$path` is physical file location — not identity — so no validation happens against it at construction time. LessCompiler checks readability before compiling.

# Helper Registry

## Overview

`Registry` stores registered helpers as `Entry` metadata objects. It handles resolution, deduplication, and priority-based conflict management when multiple sources provide the same named helper.

**File:** `src/Helper/Registry.php`
**Namespace:** `Laswitchtech\CoreWeb\Helper`

## Provider Values

| Provider | Meaning                                    | Internal precedence |
|----------|--------------------------------------------|---------------------|
| `core`   | Framework-bundled helpers (`vendor/...`)  | 1 (lowest)          |
| `plugin` | Extension/plugin-provided helper           | 2                   |
| `app`    | Application-level override                 | 3 (highest)         |

Providers are validated in the `Entry` constructor. Invalid values throw `\InvalidArgumentException`.

## Registration

```php
$registry->register(HelperInterface $helper, string $provider = 'core', int $priority = 0, array $metadata = []): void
```

- Accepts any object implementing `HelperInterface`.
- `$name` is derived from `$helper->name()` (lowercased, trimmed). If the name is empty after trimming, an `\InvalidArgumentException` is thrown in the `Entry` constructor.
- `$provider` must be one of: `'core'`, `'app'`, `'plugin'`.
- `$priority` is an integer — higher values win conflicts.
- `$metadata` is an arbitrary associative array stored alongside the entry (no schema enforcement).

## Resolution Rules (Deduplication)

When `register()` is called for a name that already exists, the existing and new entries are compared:

| Step | Rule | Tie-break continues? |
|------|------|---------------------|
| 1 | Higher `$priority` wins | Yes — compare provider on tie |
| 2 | **Provider precedence** wins (app > plugin > core) | Yes — later registration wins on full tie |
| 3 | Later registration wins (last-write-wins) | No |

In code terms:

```php
// If priorities differ → higher priority entry survives
// If priorities match → compare provider precedence values
//   app=3, plugin=2, core=1
//   Higher value wins
//   On provider tie → later registration (overwrite)
```

Resolution follows a strict priority chain: first compare priorities (higher wins); only on a priority tie does provider precedence decide; only on a full tie does later registration win.

## API Surface

| Method | Return type | Description |
|--------|-------------|-------------|
| `register()` | `void` | Register/update a helper entry |
| `has(string $name)` | `bool` | Check if a helper registry entry exists |
| `get(string $name)` | `HelperInterface\|null` | Resolve the helper object, or null |
| `entry(string $name)` | `Entry\|null` | Resolve the full Entry metadata object |
| `all()` | `array<string, HelperInterface>` | All helpers keyed by lowercase name |
| `entries()` | `array<string, Entry>` | All Entry objects keyed by lowercase name |

All lookup keys are **normalized to lowercase and trimmed** before comparison.

## Usage Examples

### Registration

```php
$registry->register($urlHelper, 'core', 0, []);         // framework helper
$registry->register($customUrlHelper, 'app', 10, []);   // app override — wins (priority)
$registry->register($pluginUrlHelper, 'plugin', 5, []); // plugin — loses to both above
```

### Resolution

```php
// Returns the helper object or null
$helper = $registry->get('URL');       // case-insensitive → resolves 'url'

// Returns Full Entry metadata
$entry = $registry->entry('url');
echo $entry->provider;                  // 'app'
echo $entry->priority;                  // 10
print_r($entry->metadata);              // ['key' => 'value']

// Bulk access
foreach ($registry->entries() as $name => $entry) {
    echo "$name → {$entry->provider} (pri: {$entry->priority})";
}
```

## Constraints & Notes

- Registry entries are **immutable once registered** — there is no `unregister()` method. To override, register a new entry with higher priority or better provider precedence and it will replace the existing one.
- The name field in `Entry` is lowercased during construction; the original-case value passed by the helper is not preserved.
- No validation of the provider against any external manifest — the contract is enforced purely by the type system at runtime.

## Related docs

- [Helper Conventions](./Conventions.md) — naming, registration, and resolution order
- [HelperInterface](./HelperInterface.md) — the minimal helper contract
- [Bag](./Bag.md) — shortcut container for renderer access

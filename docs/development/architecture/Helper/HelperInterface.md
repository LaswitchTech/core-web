# HelperInterface

## Overview

`HelperInterface` is the base contract for all helper implementations in Core-Web. Helpers are **objects/services**, not global functions. Every helper must implement this interface to participate in the registry system.

**File:** `src/Helper/HelperInterface.php`
**Namespace:** `Laswitchtech\CoreWeb\Helper`

## Contract

Helpers MUST implement a single method:

```php
interface HelperInterface
{
    /**
     * Returns the unique name of this helper.
     */
    public function name(): string;
}
```

| Method   | Return type | Description                         |
|----------|-------------|-------------------------------------|
| `name()` | `string`    | Unique identifier for the helper.  |

The name is used as the lookup key in `Registry` and `Bag`. Names are **normalized to lowercase** during registration, so `"url"` and `"URL"` resolve to the same entry.

## Design Decisions

- **Minimal interface.** No additional methods required. Helpers expose their own public API directly; callers invoke methods on the helper object returned by `resolve()`, not through a generic `call()` or `get()` abstraction.
- **Objects, not globals.** Helpers are resolved from the container / injected into renderers — no `$helper()` global function exists in V1.0.
- **Name casing is flexible.** The registry lowercases lookup keys, so callers can pass mixed-case names and still resolve correctly.

## Current Implementations

| Helper    | Class                | Purpose                         |
|-----------|----------------------|---------------------------------|
| `url`     | `Url`                | URL generation helpers          |
| `html`    | `Html`               | HTML escaping / building        |
| `str`     | `Str`                | String manipulation utilities   |
| `date`    | `Date`              | Date formatting helpers         |
| `asset`   | `Asset`             | Asset path resolving            |
| `config`  | `Config`            | Read-only configuration access  |

## Known Constraints

- V1.0 has **no global helper functions** (e.g., `url()`, `e()`) — helpers are resolved via `Bag` only.
- A helper's public API is defined entirely by its own class; the framework does not standardize method signatures across helpers.

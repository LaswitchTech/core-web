# Error\RenderException — Renderer Phase 1 Documentation

**Class**: `Laswitchtech\CoreWeb\RendererError\RenderException`  
**File**: `src/Renderer/Error/RenderException.php`  
**Namespace**: `Laswitchtech\CoreWeb\RendererError`

---

## Purpose

Exception class used by `Renderer` for runtime resource lookup failures and filesystem errors. Never used by `Registry`.

---

## Class Definition

```php
namespace Laswitchtech\CoreWeb\RendererError;

final class RenderException extends \RuntimeException
{
}
```

- No custom properties or methods. Inherits standard `\Throwable` API via `RuntimeException`.
- The "final" keyword prevents subclassing (no additional exception hierarchy needed for Phase 1).

---

## When It Is Thrown

| Condition | Message Template | Location |
|-----------|-----------------|----------|
| View name not found in registry | `"No registered view resource named '{$view}'."` | `Renderer::render()` (step 2) |
| Template name not found in registry | `"No registered template resource named '{$template}'."` | `Renderer::render()` (step 4) |
| Layout name not found in registry | `"No registered layout resource named '{$layout}'."` | `Renderer::render()` (step 6) |
| Resolved `$entry->path` does not exist as a file | `"Render path does not exist: {$entry->path}"` | `Renderer::renderResource()` |
| Resolved `$entry->path` is not readable | `"Render path is not readable: {$entry->path}"` | `Renderer::renderResource()` |

---

## Current Behavior Notes / Limitations

1. **No file-existence checks**: Registry does NOT call `is_file()` or `is_readable()`. File validation only happens at render time in `renderResource()`. This is intentional — registry registration is cheap.

2. **No stack trace modification**: Uses the default `\RuntimeException` behavior (full backtrace captured on construction). Messages are concise for logging; the full path/line info comes from the call site.

3. **Type safety**: Renderer checks `instanceof RenderException` in tests only; callers catching `\Throwable` should explicitly check for this class if they need to distinguish renderer failures from other errors (e.g., parse errors in included template files).

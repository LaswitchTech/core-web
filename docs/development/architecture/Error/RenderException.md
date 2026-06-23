# Error\RenderException — Current Implementation Documentation

**Class**: `Laswitchtech\CoreWeb\Renderer\Error\RenderException`  
**File**: `src/Renderer/Error/RenderException.php`  
**Namespace**: `Laswitchtech\CoreWeb\Renderer\Error`

---

## Purpose

Final exception class thrown by Renderer, PhpEngine, LatteEngine, and Engine\Registry when resource resolution or file I/O fails. No custom properties — inherits standard `\RuntimeException` behavior.

---

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Renderer\Error;

final class RenderException extends \RuntimeException
{
}
```

- No custom properties or methods. Inherits standard `\Throwable` API via `RuntimeException`.
- The `final` keyword prevents subclassing (no additional exception hierarchy needed for current implementation).

---

## When It Is Thrown

| Source | Condition | Message Template |
|--------|-----------|------------------|
| `Renderer::render()` | View, template, or layout name not registered in resource Registry | `No registered {$name} resource named '{$name}'.` |
| `Renderer::renderResource()` | `$entry->path` is not a file | `Render path does not exist: {path}` |
| `Renderer::renderResource()` | `$entry->path` is not readable | `Render path is not readable: {path}` |
| `PhpEngine::render()` | File at `$entry->path` not found on disk | `PHP engine: file not found: {path}; ...` |
| `PhpEngine::render()` | Output buffering / require throws `\Throwable` | `PHP engine: render failed: {$e->getMessage()}` (original exception stored as [$this->getPrevious()]()) |
| `LatteEngine::render()` | File at `$entry->path` not found on disk | `Latte engine: file not found: {path}; ...` |
| `LatteEngine::render()` | Latte\RuntimeException captured during render | `Latte engine: render failed: {$e->getMessage()}` (original exception stored as [$this->getPrevious()]()) |
| `Engine\Registry::resolve()` | Metadata references an unregistered engine name | `Engine '{engineName}' referenced in metadata but not registered.` |
| `Engine\Registry::resolve()` | No engines registered and no metadata override provided | `No renderer engines registered. At least 'php' must be registered.` |

---

## Current Behavior Notes / Limitations

1. **No file-existence checks at Registry layer**: Renderer's resource Registry does NOT call `is_file()` or `is_readable()`. File validation only happens in `renderResource()` (explicit check) and inside individual engines (PhpEngine via `file_exists()`, LatteEngine via `$this->latteLoader::getFile()->getFilename()`). This is intentional — registry registration is cheap.

2. **No stack trace modification**: Uses the default `\RuntimeException` behavior (full backtrace captured on construction). Messages are concise for logging; the full path/line info comes from the call site and backtrace.

3. **Caller guidance**: Callers catching `Throwable` should explicitly check `$e instanceof RenderException` if they need to distinguish renderer failures from other errors (e.g., parse errors in included template files). PhpEngine and LatteEngine wrap their original `\Throwable`/`\RuntimeException` as the previous exception, accessible via `$e->getPrevious()`.

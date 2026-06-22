# Renderer — Renderer Phase 1 Documentation

**Class**: `Laswitchtech\CoreWeb\Renderer\Renderer`  
**File**: `src/Renderer/Renderer.php`

## Purpose

Minimal renderer pipeline that composes layout, template, and view files. Uses output buffering to capture rendered output at each stage. Registry resolves resources by name and type.

## Architecture

```
Renderer → Registry → Entry path → file require (output buffer)
                    ↓
              Provider rank → precedence resolution
                    ↓
              Priority → tie-breaking
```

Composition order: view → template → layout

Data flow: `$data` passed through layers, accumulating results.

### Composition Pipeline

```
  $data + ['name' => 'World']
        │
        ▼
   ┌─────────┐
   │  View   │  ← renders into $viewContent
   └────┬────┘
        │
        ▼
┌───────────────┐
│  Template     │  ← receives $data + ['viewContent' => ...]
└───┬───────────┘
    │ renders into $templateContent
    ▼
┌───────────────┐
│   Layout      │  ← receives $data + ['templateContent' => ..., 'viewContent' => ...]
└───┬───────────┘
    │ rendered as final output
    ▼
  (string return)
```

## Public API

### render(string $layout, string $template, string $view, array $data = []): string

Main entry point. Resolves and composes all three layers in one call.

**Resolution**: Each name is looked up via `$this->registry->resolve($name, Entry::TYPE_*)`. If any lookup fails (null), renders an empty placeholder for that layer. No exceptions are thrown on missing resources — the renderer degrades gracefully.

### renderByName(string $name, string $type, array $data = []): string

Renders a single resource (layout/template/view) by name and type without composable chains. Uses `$this->registry->get(name, type)` resolution.

### renderResource(Entry $entry, array $data = []): string

Direct file rendering for a specific Entry object. Output buffer captures the require() output. 

## Internal Implementation

### Constructor Dependencies

```php
public function __construct(Registry $registry)
```

Takes a Registry instance for resource resolution. No container access needed — the Registry is responsible for finding entries.

### Key Design Decisions

#### 1. No Exceptions on Missing Resources

When `resolve()` returns null (resource not registered), the renderer uses empty strings as placeholders. This prevents boot-time failures and allows graceful degradation during development or testing where not all assets are available yet.

#### 2. Output Buffering for Rendering

```php
ob_start();
extract($data, EXTR_SKIP);
include $entry->path;
$result = ob_get_clean();
```

Output buffering captures file output without polluting the calling scope. `EXTR_SKIP` prevents variable collisions between layers — a view's `$title` won't accidentally overwrite the template's `$title`.

#### 3. Data Accumulation via Array Merge

Each layer receives the original `$data` plus its own content variable:
- Template: `$data + ['viewContent' => $viewContent]`
- Layout: `$data + ['templateContent' => $templateContent, 'viewContent' => $viewContent]`

This means the layout has access to everything — original context *plus* all rendered layers. Templates have access to the view output. Views only have access to their own `$data`.

## Current Behavior Notes / Limitations

### 1. Missing Resources → Empty Placeholders

If `registry.get(name, type)` returns null:
- `$viewContent`, `$templateContent`, or `$layoutContent` will be an empty string for that layer.
- This is **intentional** — it allows partial renders during development (e.g., just the view without a layout).

### 2. No Automatic Layout Detection

There is no auto-discovery of "default" layouts. Every render call must explicitly specify the layout name, template name, and view name. Defaults are not baked in because different applications have different needs.

### 3. Variable Naming Convention via Context Variables

| Layer | Receives from previous | Own variable injected |
|-------|----------------------|----------------------|
| View | `$data` (direct) | — |
| Template | `['viewContent' => $viewContent] + $data` | `$viewContent` |
| Layout | `['templateContent' => $templateContent, 'viewContent' => $viewContent] + $data` | `$templateContent`, `$viewContent` |

Files rendered with `include` (not `require_once`) and the current working directory remain unchanged. Variable scoping is isolated via `extract()`.

### 4. No Caching or Compilation

Every render call reads files from disk. There is no opcode cache layer, Twig compilation, or file modification-time checks. This is a Phase 1 limitation that may be addressed in later phases with a cache adapter interface.

### 5. Registry Resolution Behavior

Registry `get(name, type)` follows these precedence rules:
1. **Highest priority wins** — entries registered with higher priority numbers take precedence (registered first = lower priority)
2. **Provider rank breaks ties** — app > theme > plugin > core (higher rank = lower precedence when priority is equal)
3. **First-in-wins for identical priority + provider** — entries created during the same hook priority level are resolved in registration order

### 6. No Layout Slots or Named Sections

Unlike more advanced templating engines, layouts cannot define "named slots" (e.g., `{{ content }}`, `{{ sidebar }}`). The entire template content is placed into a single `$templateContent` variable. If you need conditional rendering inside layouts, that must be handled via PHP conditionals in the layout file itself.

### 7. Context Variable Leakage is Possible but Contained

Because all rendered layers share variables from their respective `extract()` calls, there *could* be accidental variable overlap between contexts. However, since each layer's content is captured in a dedicated container variable (`$viewContent`, `$templateContent`) before the next layer renders, this is not an actual problem — it is only a concern for template file authors who should use unique variable names for their own context variables.
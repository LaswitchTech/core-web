# Renderer — Current Implementation Documentation

**Class**: `Laswitchtech\CoreWeb\Renderer\Renderer`
**File**: `src/Renderer/Renderer.php`

## Purpose

Minimal renderer pipeline that composes layout → template → view through two registries and an engine layer. Each layer is resolved via the resource Registry, rendered by an engine from the engine registry, and composed into output.

## Architecture

```
Renderer
 ├── Registry            → resolves name/type → Entry (path + metadata)
 └── Engine\Registry     → resolves Entry  → engine (php / latte)
                            → renders Entry   → string output
```

Resolution order: **view → template → layout** (inside-out).

Each resolved `Entry` is rendered by `Engine\Registry::resolve($entry)->render($entry, $data)`. The Engine layer handles output buffering; the Renderer delegates file I/O to engines.

### Composition Pipeline

```
  $data + ['name' => 'World']
        │
        ▼
   ┌─────────┐   renders into $viewContent
   │  View   │
   └────┬────┘
        │
        ▼
   ┌───────────────┐  receives $data + ['viewContent' => ...]
   │  Template     │  → renders into $templateContent
   └───┬───────────┘
       │
       ▼
   ┌───────────────┐  receives $data + ['templateContent' => ..., 'viewContent' => ...]
   │   Layout      │  → rendered as final output (string)
   └───────────────┘
```

## Public API

### render(string $layout, string $template, string $view, array $data = []): string

Main entry point. Resolves and composes all three layers in **one call**. Each name is looked up via `$this->registry->resolve($name, Entry::TYPE_*)`.

- If any lookup fails (`null`), a `RenderException` is thrown immediately. No missing resource produces an empty placeholder.
- The pipeline proceeds through the layer only when its entry has been successfully resolved.

### renderResource(Entry $entry, array $data = []): string

Renders a single resource Entry directly. Validates that `$entry->path` exists and is readable (throws `RenderException` on failure), then delegates rendering to `Engine\Registry::resolve($entry)->render(...)`.

## Internal Implementation

### Constructor Dependencies

```php
public function __construct(Registry $registry, Engine\Registry $engineRegistry)
```

The Renderer requires **two** distinct registries:

| Dependency | Type | Role |
|------------|------|------|
| `$registry` | `Renderer\Registry` | Resolves resource names → Entries (path + metadata) |
| `$engineRegistry` | `Renderer\Engine\Registry` | Resolves entries to engine and delegates rendering |

### render() — Step-by-Step

1. **Resolve view** via `$this->registry->resolve($view, Entry::TYPE_VIEW)`. Throw `RenderException` if null.
2. **Render view** via `$this->engineRegistry->resolve($viewEntry)->render($viewEntry, $data)`. Result stored in `$viewContent`.
3. **Resolve template** via `$this->registry->resolve($template, Entry::TYPE_TEMPLATE)`. Throw `RenderException` if null.
4. **Render template** with `$data + ['viewContent' => $viewContent]`. Result stored in `$templateContent`.
5. **Resolve layout** via `$this->registry->resolve($layout, Entry::TYPE_LAYOUT)`. Throw `RenderException` if null.
6. **Render layout** with `$data + ['templateContent' => $templateContent, 'viewContent' => $viewContent]`. Return result.

### renderResource() — Precondition Checks

Before delegating to an engine, the Renderer validates:

| Check | Behavior on failure |
|-------|---------------------|
| `is_file($entry->path)` | `RenderException("Render path does not exist: ...")` |
| `is_readable($entry->path)` | `RenderException("Render path is not readable: ...")` |

## Key Design Decisions

### 1. Exceptions on Missing Resources

Every layer (view, template, layout) throws a `RenderException` when its resource name resolves to null via the Registry. There is **no** graceful degradation or empty placeholder rendering — every component must be registered.

### 2. Engine Delegation

The Renderer does not perform file I/O or output buffering itself. It delegates all rendering to engine instances resolved by `Engine\Registry`:

- PhpEngine: `ob_start()` → `extract($data, EXTR_SKIP)` → `require` → `ob_get_clean()`
- LatteEngine: compiles template, invokes Latte's `renderToHtml()`, catches `Latte\RuntimeException` as `RenderException`

The engine layer is the sole owner of output buffering semantics.

### 3. Data Accumulation via Array Merge

Each layer receives the original `$data` plus its own content variable:

| Layer | Receives |
|-------|----------|
| View | `$data` (direct) |
| Template | `array_merge($data, ['viewContent' => $viewContent])` |
| Layout | `array_merge($data, ['templateContent' => $templateContent, 'viewContent' => $viewContent])` |

The layout thus has access to original context plus all rendered layers. Templates see view output. Views only see their own `$data`.

## Current Behavior Notes / Limitations

### 1. Mandatory Resources — No Placeholders

If any of view, template, or layout is not registered in the resource Registry, `render()` throws `RenderException` rather than silently producing partial output. This ensures that production applications cannot render with missing components.

### 2. No Automatic Layout Detection

Every render call must explicitly specify the layout name, template name, and view name. Defaults are not baked in because different applications have different needs.

### 3. Registry Resolution Behavior

`Registry->resolve(name, type)` follows these precedence rules:

1. **Highest priority wins** — entries registered with higher priority numbers take precedence
2. **Provider rank breaks ties** — app > theme > plugin > core (higher rank = lower precedence when priority is equal)
3. **First-in-wins for identical priority + provider** — entries created during the same hook priority level are resolved in registration order

### 4. No Caching or Compilation

Every render call reads files from disk through engines. There is no opcode cache layer, compilation step, or file modification-time checks at the Renderer level (Latte handles its own caching internally).

### 5. File Validation Only in renderResource()

`render()` relies on the Registry for resolution and does not perform `is_file()` / `is_readable()` checks itself. `renderResource()` performs explicit validation before delegating. This distinction means that invalid entries bypassed by the Registry (null result) hit the exception path in `render()`, while valid Entries could still fail file I/O inside an engine.

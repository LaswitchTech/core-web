# Register — Renderer Phase 1 Documentation

**Class**: `Laswitchtech\CoreWeb\Renderer\Register`  
**File**: `src/Renderer/Register.php`

---

## Purpose

The Register class is the renderer registration API used by plugins and themes. It provides a fluent or direct method for registering layout, template, and view resources into the registry. This is the public-facing interface that extension code calls during the `renderer.register` hook.

## Registration Methods

### registerLayout(string $name, string $path, string $provider = 'core', int $priority = 0)

Registers a layout resource. Layout files are the outermost render layer (wrappers, chrome, page templates). The name is used as the key for `Renderer::render()` resolution. Path must be absolute. Provider determines precedence (app > theme > plugin > core).

### registerTemplate(string $name, string $path, string $provider = 'core', int $priority = 0)

Registers a template resource. Templates sit between layouts and views in the composition chain. They receive rendered view output as `$viewContent`.

### registerView(string $name, string $path, string $provider = 'core', int $priority = 0)

Registers a view resource. Views are the innermost layer — they contain the actual page content logic (HTML generation, variable interpolation).

## Registration Behavior

1. **No filesystem validation at registration time** — paths are stored as-is. Validation only occurs when `Renderer::render()` or `Renderer::renderFile()` is called with this resource name.

2. **Duplicate handling** — if a resource with the same (`type`, `name`) pair exists, the new entry takes precedence based on provider rank and priority. The previous entry is replaced (overwrites).

3. **Type enforcement** — each registration method validates that `$name` follows convention (alphanumeric + hyphens/underscores). Invalid names trigger an `\InvalidArgumentException`.

4. **Path normalization** — relative paths are converted to absolute using the extension base path or CORE_WEB_ROOT as the reference point.

## Usage Example

```php
// In a plugin's hook handler:
class MyPlugin {
    public static function onRendererRegister(array $context): void
    {
        $register = $context['register'];  // Register instance from context
        $pluginDir = dirname(__FILE__);   // Plugin base path
        
        $register->registerLayout('my-layout', $pluginDir . '/layouts/site.php', 'plugin');
        $register->registerTemplate('my-template', $pluginDir . '/templates/default.php', 'plugin');
        $register->registerView('my-view', $pluginDir . '/views/content.php', 'plugin');
    }
}
```

## Internal Behavior Notes / Limitations

1. **Context dependency** — The register instance is passed via the `renderer.register` hook context, not as a new global or container service. This keeps the API self-contained and predictable for extension developers.

2. **No namespace support** — All registrations are flat key-value pairs within each type. There is no path-based discovery or directory scanning. Extensions must explicitly register each file.

3. **Provider precedence mapping**:
   - `'app'` → rank 0 (highest)
   - `'theme'` → rank 1
   - `'plugin'` → rank 2
   - `'core'` → rank 3 (lowest)
   - Unknown provider → rank `\PHP_INT_MAX`

4. **Not thread-safe** — Register is stateful. Calls are expected during the `renderer.register` hook phase, which runs sequentially during bootstrap. Concurrent modification could cause race conditions in CLI or multi-process environments. This is acceptable for Phase 1 and documented as a known limitation.
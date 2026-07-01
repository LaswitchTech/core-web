# Helper Conventions

## Overview

This document describes the conventions, design rules, and authoring guidance for helpers in Core-Web.

**Namespace:** `Laswitchtech\CoreWeb\Helper`

---

## Helpers Are Services, Not Global Functions

Helpers are first-class objects registered with the `Registry`. They are never global functions — they always flow through the registry and (optionally) the `Bag` shortcut container.

```php
// ✅ Resolve via bag / registry
$helpers->resolve('url')->to('/about');
echo $helpers->html->e($value);
```

```php
// ❌ No global helper functions exist
// url('/about') — does not exist
// h($value)      — does not exist
```

---

## HelperInterface Contract

Every helper must implement `HelperInterface`, which currently requires only:

```php
interface HelperInterface
{
    public function name(): string;
}
```

Future additions to the interface (if any) will be added as a patch. Helpers are encouraged to evolve with additional public methods rather than growing interface requirements.

---

## Naming Conventions

- Helper names must be **lowercase ASCII** strings.
- Names should be **short** and **semantic**: `url`, `html`, `str`, `date`, `asset`, `config`.
- The registry **normalizes all lookup keys to lowercase** — case-mismatched lookups will still resolve.

Names are the primary identity of a helper within the registry.

---

## Registration

### Core Helpers

Core helpers (`url`, `html`, `str`, `date`, `asset`, `config`) are registered during bootstrap by `Bootstrap::registerHelperServices()`. Each is registered with provider `"core"` and priority `0`.

```php
$coreHelpers = [new Url(), new Html(), new Str(), new Date(), new Asset(), new Config()];
foreach ($coreHelpers as $helper) {
    $registry->register($helper, 'core', 0, []);
}
```

The core helper shown above is `Laswitchtech\CoreWeb\Helper\Config`. Bootstrap aliases it as `ConfigHelper` internally only to avoid a name collision with `\Laswitchtech\CoreWeb\Config` (the configuration loader). Plugin authors should use the real class name.

Core helpers are registered inside `Bootstrap::registerHelperServices()` which creates the \Helper\Registry, registers each core helper, then triggers the ``helper.register`` hook with an array context containing ``registry``, ``container``, and ``mode``.

### Plugin Helpers

Plugin helpers are resolved via a manifest-driven class method pattern:

```
helper.register::Vendor\\Plugin\\ClassName::methodName
```

The callback must accept `array $context`, read ``$context['registry']``, verify it has a ``register()`` method, then call ``$registry->register($helper, 'plugin', <priority>, [])``.

### Provider Levels

| Provider | Source                        | Registration timing        |
|----------|-------------------------------|----------------------------|
| `core`   | Framework bootstrap code            | During bootstrap, after extension hooks are registered and before renderer/router registration |
| `plugin` | Plugin manifest-driven callbacks    | During bootstrap, after extension hooks are registered and before renderer/router registration |
| `app`    | Application bootstrap (custom)      | Custom                                                      |

Higher registration timing wins ties — app registrations naturally outlast others.

### Resolution Order

When multiple sources provide the same helper name, resolution follows this tie-breaking chain:

1. **Priority** — higher integer wins
2. **Provider precedence** — `app` > `plugin` > `core`
3. **Late registration** — last-registered entry wins on a full tie

---

## Dependency Guidance

Helpers should be as lightweight and stateless as possible.

- **Avoid direct container dependency.** Helpers resolve only via registry/hook API, not via `\Laswitchtech\CoreWeb\Container::get()`.
- **Inject simple dependencies through the constructor** when needed (e.g., a URL generator may depend on a base-path string).
- The `Config` helper is **read-only** — it wraps `\Laswitchtech\CoreWeb\Config` without writes or persistence.

---

## Renderer Availability

The renderer receives helpers as an injected `Bag` instance, typically as `$helpers`. From within templates/views:

```php
// Direct resolution (method call)
$url = $helpers->resolve('url')->to('/about');

// Property-style access
echo $helpers->url->to('/about');

// Chained helper calls
echo $helpers->html->e($value);
echo $helpers->asset->path('css/style.css');
```

---

## Extension Authoring — Quick Start

To add a custom helper from a plugin:

1. **Create the helper class** implementing `HelperInterface`:

    ```php
    namespace Laswitchtech\Extension\MyPlugin\Helper;

    use Laswitchtech\CoreWeb\Helper\HelperInterface;

    final class MyHelper implements HelperInterface
    {
        public function name(): string          { return 'my_helper'; }
        public function doSomething(string $arg): string { /* ... */ }
    }
    ```

2. **Register via the `helper.register` hook** with a manifest-driven callback:

    ```
    helper.register::Vendor\\Plugin\\ClassName::methodName
    ```

3. **Declare the hook** in your plugin manifest:

    ```json
    {
      "type": "plugin",
      "name": "my-plugin",
      "version": "1.0.0",
      "hooks": ["helper.register"]
    }
    ```

---

## V1.0 Limitations & Known Gaps

The following are intentionally **not** included in V1.0:

| Feature                  | Status      | Reason                                      |
|--------------------------|-------------|---------------------------------------------|
| Global helper functions  | Not provided | Helpers flow through the registry explicitly — no implicit globals. |
| Automatic helper discovery | Not provided | Manual registration avoids surprise collisions. |
| Registry standardization refactor | Not planned | Current resolution logic is sufficient for V1.0. |
| Write-capable Config helper | Read-only | The `Config` helper wraps a read-only snapshot. Configuration mutations happen through the bootstrap/config system, not helpers. |
| Asset manifest compilation | Not provided | Static asset paths are resolved at render time by `Asset::path()`. Manifest builds are deferred to future work. |

These limitations are documented to prevent authoring assumptions that won't hold until a later release.

---

## See Also

- [HelperInterface](./HelperInterface.md)
- [Registry](./Registry.md) 
- [Bag](./Bag.md)

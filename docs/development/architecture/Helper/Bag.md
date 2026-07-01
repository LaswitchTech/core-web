# Helper Bag

## Overview

`Bag` is a convenience layer around `Registry` that provides shortcut access patterns for renderer, layout, and template code. It wraps the registry and exposes helpers via method, property, and callable syntax.

**File:** `src/Helper/Bag.php`
**Namespace:** `Laswitchtech\CoreWeb\Helper`

## Constructor

```php
public function __construct(Registry $registry)
```

Takes a `Registry` instance. No registration of its own — all resolution is delegated to the wrapped registry.

## Access Patterns

### Method-style: `resolve()`

```php
$helpers->resolve('url')          // returns HelperInterface|throw
```

- Returns the resolved helper object.
- Throws `\RuntimeException` with message `Helper "<name>" is not registered.` when the helper does not exist in the registry.
- Name normalization (lowercase, trimmed) is delegated to `Registry::get()`.

### Property-style: `$helpers->name`

```php
$helpers->url                     // resolves 'url' via __get()
```

Implemented via `__get()`. Delegates directly to `resolve()` — same throw behavior when not found.

### Callable-style: `$helpers->name()`

```php
$helpers->url()                   // resolves 'url' via __call(), returns helper object
```

Implemented via `__call()`. **Returns the helper object itself** (not a method call on the helper). Accepts zero arguments only.

- Calling with arguments throws `\RuntimeException`: `"Calling "<name>()" on a helper requires direct method invocation; use resolve()."`

## Full Example

```php
$helpers = new Bag($registry);

// Three equivalent ways to get a helper:
$h1 = $helpers->resolve('url');   // explicit
$h2 = $helpers->url;              // property shorthand (no args)
$h3 = $helpers->url();            // callable shorthand (zero args)

// Verify all three are the same object
assert($h1 === $h2 && $h2 === $h3);

// Use on helper directly:
echo $h1->to('/about');           // calling Url::to()

// Invalid — passing arguments to Bag's magic call:
$helpers->url('/about');          // throws RuntimeException
```

## Inspecting / Iterating

| Method | Return type | Description |
|--------|-------------|-------------|
| `has(string $name)` | `bool` | Check if a helper is registered |
| `all()` | `array<string, HelperInterface>` | All helpers keyed by lowercase name |

```php
if ($helpers->has('asset')) {
    echo 'Assets are available';
}

foreach ($helpers->all() as $name => $helper) {
    echo "Helper: $name\n";
}
```

## Renderer Integration

The renderer injects a `Bag` instance into layouts, templates, and views under the `$helpers` variable name. This makes helpers available to all rendered output without requiring explicit injection at the call site.

```php
// In a view or layout file:
<a href="<?= $helpers->url->to('/about') ?>">About</a>
<img src="<?= $helpers->asset->path('styles.css') ?>" />
<p><?= $helpers->html->e($content) ?></p>
```

**Note:** `resolve()` should be preferred when the helper name is dynamic at runtime (cannot use variable properties in PHP template syntax).

## Constraints & Design Decisions

- **Zero-arg restriction on `__call()`.** Helper methods are not forwarded through `Bag::call()`. This avoids unsafe implicit method dispatch and ensures callers invoke helper methods directly. The pattern is: `$helpers->name` / `$helpers->name()` → get the object, then call its methods like `$helper->method()`.
- **Property access (`__get`) mirrors `resolve()`.** No fallback to default values — if a helper isn't registered, accessing it as a property throws. This prevents silent failures in templates.
- **No automatic helper loading.** Helpers must be explicitly registered with the underlying `Registry` before being accessible via `Bag`. The bag is a view-layer convenience, not a loader or factory.

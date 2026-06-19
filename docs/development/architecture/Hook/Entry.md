# Hook\Entry

## Purpose

`Hook\Entry` is an immutable value object representing a single registered hook entry within the framework's hook system. It stores metadata about a callback without executing or resolving it — that responsibility belongs to `Hook\Registry`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Hook;

final readonly class Entry {
    public string $hook;          // dotted namespace, e.g. "layout.header"
    \Closure|array|string $callback; // the resolved callback
    int $priority;                // higher values fire first (default: 0)
}
```

### Property Types

| Property     | Type                      | Purpose                                              |
|--------------|---------------------------|-------------------------------------------------------|
| `$hook`      | `string`                  | Dotted hook namespace this entry belongs to.         |
| `$callback`  | `\Closure\|\|array|string|` | The resolved callback: a `\Closure`, `[Class, method]` array, or raw string (unresolved class::method). |
| `$priority`  | `int`                     | Execution order priority — higher fires first.       |

## Factory Method: `fromRaw()`

```php
Entry::fromRaw(string $hook, callable|string $callback, int $priority = 0): self
```

Constructs an `Entry` instance where the callback may be unresolved (raw class::method string) or already-resolved (callable/closure). Called internally by `Registry::addCallback()`:

```php
$this->hooks[$hook][$priority][] = Entry::fromRaw($hook, $callback, $priority);
```

The `$callback` parameter at registration time may be any of:
- A raw `"ClassName::methodName"` string (resolved later by Registry)
- An invokable `\Closure` (used directly on trigger)
- Any PHP callable (`[Object, 'method']`, `'functionName'`, etc.)

## Usage within the Framework

### Registration (via Registry)

```php
$registry->addCallback('layout.header', fn () => [], 10);
$registry->addClassCall('page.before_render', 'App\Renderer::init', 20);
```

Internally, `Registry::addClassCall()` validates class/method existence and wraps the callback into a closure before it reaches `Entry`.

### Trigger (via Registry)

During hook execution, the registry iterates priorities descending and invokes stored callbacks:

```php
$results[$priority][$i] = ($cb)($context);
```

The context is passed as a **single array argument** — not spread. Spreading (`($cb)(...$context)`) triggers PHP's named-argument expansion, which fatally breaks when the callback expects `array $context`.

Callbacks that throw receive an error wrapper instead of halting the entire trigger sequence:

```php
$results[$priority][$i] = ['__error' => $e->getMessage()];
```

### Inspection (via Registry)

Extensions can retrieve all registered entries for a hook via `Registry::getHooks($hook)`, which returns sorted `Entry` instances by descending priority. This is used by the Extension Manager to enumerate available hooks and layouts before dispatch.

## Design Decisions

### Immutable Value Object

Declared with `final readonly class` — properties cannot be modified after construction, ensuring the hook registry's state remains stable across a bootstrap lifecycle.

### Deferred Callable Resolution

The `$callback` property accepts raw strings (`ClassName::method`) via `fromRaw()`, deferring full resolution until Registry binds them into closures or invokes them on trigger. This keeps `Entry` decoupled from autoloading and namespace context, which are Bootstrap-time concerns. The actual resolved callable is stored as-is — if it's already a `\Closure`, no wrapping occurs.

### Explicit Callback Type Union

Using `\Closure|array|string` instead of the broader `callable` type reflects the class-by-class reality: callbacks stored in entries are either resolved closures, unresolved method strings (`ClassName::method`), or callable arrays (`[Object, 'method']`). This prevents accidental storage of non-callable types while remaining precise about what can actually appear in a registered entry.

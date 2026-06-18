# Hook\Plugin

## Purpose

`Hook\Plugin` is an immutable value object representing a single registered hook entry within the framework's hook system. It stores resolved metadata about a callback without executing or resolving it — that responsibility belongs to `Hook\Registry`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Hook;

final readonly class Plugin
{
    public string $hook;      // dotted namespace, e.g. "layout.header"
    mixed         $callback;  // callable or closure to invoke
    int           $priority;  // higher values fire first (default: 0)
}
```

## Properties

| Property   | Type              | Purpose                                              |
|------------|-------------------|-------------------------------------------------------|
| `$hook`    | `string`          | Dotted hook namespace this entry belongs to.         |
| `$callback`| `mixed` (callable)| The callback to invoke when the hook triggers.       |
| `$priority`| `int`             | Execution order priority — higher fires first.       |

## Factory Method: `fromRaw()`

```php
Plugin::fromRaw(string $hook, mixed $callback, int $priority = 0): self
```

Constructs a `Plugin` with deferred callable resolution. Called internally by `Registry::addCallback()`:

```php
$this->hooks[$hook][$priority][] = Plugin::fromRaw($hook, $callback, $priority);
```

The `$callback` parameter at registration time may be:
- A raw `ClassName::methodName` string (resolved later by Registry)
- An invokable closure (used directly on trigger)
- Any PHP callable (`[Object, 'method']`, `'functionName'`, etc.)

## Usage within the Framework

### Registration (via Registry)

```php
$registry->addCallback('layout.header', fn () => [], 10);
$registry->addClassCall('page.before_render', 'App\Renderer::init', 20);
```

Internally, `Registry::addClassCall()` validates class/method existence and wraps the callback into a closure before it reaches `Plugin`.

### Trigger (via Registry)

During hook execution, the registry iterates priorities descending and invokes stored callbacks:

```php
$results[$priority][$i] = [$hookEntry->callback(...$context)];
```

Callbacks that throw receive an error wrapper instead of halting the entire trigger sequence:

```php
$results[$priority][$i] = ['__error' => $e->getMessage()];
```

### Inspection (via Registry)

Plugins can retrieve all registered entries for a hook via `Registry::getHooks($hook)`, which returns sorted `Plugin` instances by descending priority. This is used by the Extension Manager to enumerate available hooks and layouts before dispatch.

## Design Decisions

### Immutable Value Object

Declared with `final readonly class` — properties cannot be modified after construction, ensuring the hook registry's state remains stable across a bootstrap lifecycle.

### Deferred Callable Resolution

The `$callback` property accepts raw strings (`ClassName::method`) via `fromRaw()`, deferring full resolution until Registry binds them into closures or invokes them on trigger. This keeps `Plugin` decoupled from autoloading and namespace context, which are Bootstrap-time concerns.

### Mixed Callable Type

Using `mixed` instead of `callable` reflects the class-by-class reality: at registration time callbacks may be strings (unresolved), and only later become actual callables after Registry wrapping.

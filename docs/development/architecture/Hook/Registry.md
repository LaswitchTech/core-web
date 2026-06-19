# Hook\Registry

## Purpose

`Hook\Registry` is a lightweight, non-singleton hook registry that enables plugin and theme callbacks to register under named hooks, fire them in priority order, and collect return values. Each Bootstrap run creates exactly one instance, which is bound into the Container as `hook_registry`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Hook;

final class Registry { ... }
```

- **`final`** — no subclassing expected.
- **`class` (non-readonly)** — maintains mutable internal `$hooks` array; the hook system requires registration and triggering in separate phases.
- Not a singleton: a fresh instance is created during `Bootstrap::registerExtensions()` and stored in the Container.

## Storage Structure

Hooks are stored as a nested array keyed by hook name, then priority (descending), then index:

```php
/** @var array<string,array<int,list<Entry>>> */
private array $hooks = [];

// Example shape for "layout.header":
// [
//     20 => [Entry@A, Entry@B],
//     10 => [Entry@C],
//      0 => [Entry@D, Entry@E],
// ]
```

Each `Entry` stores the hook name, a resolved callback (closure, callable array, or unresolved string), and priority.

## Public API

### `addCallback(string $hook, callable $callback, int $priority = 0): void`

Registers a callback under `$hook` at the given `$priority`. Wraps it in an `Entry::fromRaw()` which stores the raw callable/preserve type (Closure vs string). Callbacks are invoked with a single `array $context` argument — **never spread** — to avoid PHP's named-argument expansion.

```php
$registry->addCallback('layout.header', fn () => [], 10);
```

### `addClassCall(string $hook, string $callback, int $priority = 0): void`

Registers a `ClassName::methodName` callback with **fail-fast validation** at registration time:

| Condition | Exception                    |
|-----------|------------------------------|
| No `::` separator | `\InvalidArgumentException`        |
| Class does not exist (via `class_exists()`) | `\RuntimeException`            |
| Method does not exist (via `method_exists()`) | `\BadMethodCallException`      |

On success, wraps the raw string into a static closure and delegates to `addCallback()`:

```php
$this->addCallback($hook, static fn (array $context) => call_user_func([$classRef, $methodRef], $context), $priority);
```

> The `class_exists()` check requires that the autoloader (installed by `Bootstrap::registerExtensions()`) has been registered before calling `addClassCall()`. In practice this always holds because `registerExtensions()` installs the extension autoloader in step 5 before processing hooks in step 6.

### `trigger(string $hook, array $context = []): array`

Fires all registered callbacks for `$hook`, passing `$context` (as a single array) to each. Returns accumulated return values keyed by priority then index:

1. Returns `[]` if no callbacks are registered for `$hook`.
2. Sorts priorities descending via `krsort($this->hooks[$hook], SORT_REGULAR)` (highest first).
3. Invokes each callback: `($cb)($context)` — context passed as a single argument, **not** spread with `...$context`.
4. Individual failures produce `'__error' => $e->getMessage()` entries — **no hook halts the entire chain**.

```php
$results = $registry->trigger('layout.header', ['app' => $this]);
// [
//     20 => [['header_html']],
//      0 => [null, ['__error' => '...']],
// ]
```

### `getHooks(string $hook): array`

Returns all registered `Entry` entries for `$hook`, sorted by descending priority. Used by the Extension Manager to enumerate available hooks and layouts during bootstrap introspection.

```php
$entries = $registry->getHooks('layout.sidebar');
// [Entry@A, Entry@B, ...] — sorted by priority desc
```

## Private Methods

None. The Registry class is self-contained; no private helpers exist.

## Lifecycle Example

```php
$registry = new \Laswitchtech\CoreWeb\Hook\Registry();

// Registration phase (during Bootstrap::initExtensions)
$registry->addClassCall('layout.header', 'App\HeaderPlugin::render', 20);
$registry->addCallback('layout.header', fn () => [], 10);

// Trigger phase (during renderer output)
$results = $registry->trigger('layout.header', ['context' => $app]);

// Inspect phase (during admin/developer console)
$hooks = $registry->getHooks('layout.header'); // 2 Entry instances
```

## Design Decisions

### Per-Bootstrap Instance Instead of Singleton

A new `Registry` is created per `Bootstrap::registerExtensions()` call and stored in the Container as `hook_registry`. This:
- Avoids shared-state bugs across test runs or re-bootstrapping.
- Keeps the container as the authoritative DI hub.
- Matches the "no global mutable variables" design principle.

### Priority-Descending Fire Order

Higher numeric priorities fire first (`krsort`). This allows plugins to hook into a named event and prepend content (high priority) while later callbacks can modify or append — matching WordPress and typical PHP framework conventions.

### Context Passed as Single Array, Never Spread

Callbacks receive `$context` as a single array argument (`($cb)($context)`), not spread with `...$context`. Spreading triggers PHP's named-argument expansion when the callback signature expects `array $context`, causing fatal errors. This is a deliberate design constraint documented in the code comments.

### Callbacks Fail Isolated, Not Globally

`trigger()` catches `\Throwable` per-callback and records an `'__error'` value instead of propagating the exception. This ensures a single broken plugin cannot halt page rendering or CLI execution.

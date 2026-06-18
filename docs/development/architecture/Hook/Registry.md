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
/** @var array<string,array<int,list<\Laswitchtech\CoreWeb\Hook\Plugin>>> */
private array $hooks = [];

// Example shape for "layout.header":
// [
//     20 => [Plugin@A, Plugin@B],
//     10 => [Plugin@C],
//      0 => [Plugin@D, Plugin@E],
// ]
```

## Public API

### `addCallback(string $hook, callable $callback, int $priority = 0): void`

Registers a callback under `$hook` at the given `$priority`. Calls `Plugin::fromRaw()` to wrap it.

```php
$registry->addCallback('layout.header', fn () => [], 10);
```

### `addClassCall(string $hook, string $callback, int $priority = 0): void`

Registers a `ClassName::methodName` callback with **fail-fast validation**:

| Condition | Exception                    |
|-----------|------------------------------|
| No `::` separator | `\InvalidArgumentException`        |
| Class does not exist       | `\RuntimeException`            |
| Method does not exist      | `\BadMethodCallException`      |

On success, wraps the raw string into a static closure and delegates to `addCallback()`:

```php
$this->addCallback($hook, static fn (...$args) => $callback(...$args), $priority);
```

### `trigger(string $hook, array $context = []): array`

Fires all registered callbacks for `$hook`, passing `$context` to each. Returns accumulated return values keyed by priority then index:

1. Returns `[]` if no callbacks are registered for `$hook`.
2. Sorts priorities descending via `krsort()` (highest first).
3. Invokes each callback; individual failures produce `'__error' => $e->getMessage()` entries — **no hook halts the entire chain**.

```php
$results = $registry->trigger('layout.header', ['app' => $this]);
// [
//     20 => [['header_html']],
//      0 => [null, '__error: ...'],
// ]
```

### `getHooks(string $hook): array`

Returns all registered `Plugin` entries for `$hook`, sorted by descending priority. Used by the Extension Manager to enumerate available hooks and layouts during bootstrap introspection.

```php
$entries = $registry->getHooks('layout.sidebar');
// [Plugin@A, Plugin@B, ...] — sorted by priority desc
```

## Private Methods

### `resolvingCallable(string $callback): callable`

Resolves a `ClassName::method` string into an invokable static closure.

> **Note**: This method is defined but **never called** by any public API. `addClassCall()` performs its own in-line `class_exists()` / `method_exists()` checks and then wraps the callback manually via `static fn`. This appears to be dead code from a prior refactor where class resolution was extracted — it has not been reached since the initial commit.

## Lifecycle Example

```php
$registry = new \Laswitchtech\CoreWeb\Hook\Registry();

// Registration phase (during Bootstrap::initExtensions)
$registry->addClassCall('layout.header', 'App\HeaderPlugin::render', 20);
$registry->addCallback('layout.header', fn () => [], 10);

// Trigger phase (during renderer output)
$results = $registry->trigger('layout.header', ['context' => $app]);

// Inspect phase (during admin/developer console)
$hooks = $registry->getHooks('layout.header'); // 2 Plugin entries
```

## Design Decisions

### Per-Bootstrap Instance Instead of Singleton

A new `Registry` is created per `Bootstrap::registerExtensions()` call and stored in the Container as `hook_registry`. This:
- Avoids shared-state bugs across test runs or re-bootstrapping.
- Keeps the container as the authoritative DI hub.
- Matches the "no global mutable variables" design principle.

### Priority-Descending Fire Order

Higher numeric priorities fire first (`krsort`). This allows plugins to hook into a named event and prepend content (high priority) while later callbacks can modify or append — matching WordPress and typical PHP framework conventions.

### Callbacks Fail Isolated, Not Globally

`trigger()` catches `\Throwable` per-callback and records an `'__error'` value instead of propagating the exception. This ensures a single broken plugin cannot halt page rendering or CLI execution.

# Dependency Injection Container

## Overview

The `Container` class is a minimal dependency-injection container that manages service bindings and their resolution lifecycles. It supports three binding strategies — factory closures, singleton (cached-first-resolution), and direct value binding — without the complexity of reflection-based autowiring or service providers found in larger frameworks.

This simplicity is intentional: Core-Web needs only explicit, testable wiring at init time, not runtime class introspection. The container solves one problem — **where do objects come from when I need them?** — and does it with six methods.

## Internal Storage

The container tracks bindings across three private arrays (all keyed by service name):

| Property      | Purpose                                              |
|---------------|------------------------------------------------------|
| `$factories`  | Bound callables/factories (from `register()` or `set()`). Factory from `register()` receives the container as its argument; factory from `set()` is a zero-arg closure `fn () => \$value`. |
| `$singletons` | Set of keys marked as singleton (via `singleton()` or `registerSingleton()`). Contains only the key name, not the instance. |
| `$instances`  | Cached resolved instances — populated only for singletons on first resolution. |

A key can appear in both `$factories` and `$singletons`. A key appearing only in `$instances` means it was resolved once as a singleton before any `register()` or `set()` call cleared the flag.

## Binding Strategies

### Factory Registration (`register`)

Binds a factory closure to a keyed name. Every resolution calls the factory fresh, passing the container as the argument:

```php
$container->register('db', fn (Container $c) => new Database($c->resolve('config')));

// Each call creates a new instance.
$db1 = $container->resolve('db'); // Database instance #1
$db2 = $container->resolve('db'); // Database instance #2 (different object)
```

The closure receives the container as its first argument, allowing dependency composition:

```php
$container->register('mailer', fn (Container $c) => new Mailer(
    config: $c->resolve('config'),
    transport: $c->resolve('transport')
));
```

**Important:** Calling `register()` with a key that was previously marked as singleton **clears** the singleton flag and cached instance. The key becomes a pure factory binding thereafter.

### Singleton (`singleton`)

Marks an existing factory binding as singleton (if not already), resolves it once, caches the result. All subsequent calls return the cached instance:

```php
$conn = $container->singleton('db.connection'); // Must be pre-registered first — throws \InvalidArgumentException if not bound
// ...later...
$another = $container->singleton('db.connection'); // Returns same cached instance
assert($conn === $another); // true
```

**Important:** `singleton()` **does not** register a factory by itself. If the key has no entry in `$factories`, it throws `\InvalidArgumentException` (same as `resolve()`). To both register and mark singleton at once, use `registerSingleton()`.

Use singletons for stateful services where object identity matters (e.g., database connections, session handlers).

### `registerSingleton(string $key, callable $fn): void`

Registers a new factory as singleton in one step. Internally: sets `$factories[$key]`, sets `$singletons[$key] = true`, clears `$instances[$key]`. The factory is **not** immediately invoked — resolution happens on the next call to `singleton($key)` or `resolve($key)`.

### Direct Set Binding (`set`)

Stores a value directly without a factory wrapper. Under the hood, wraps the value in a zero-argument closure `fn () => $value`:

```php
$container->set('mode', 'CLI');
assert($container->resolve('mode') === 'CLI'); // true
```

Because the stored value is wrapped in a closure, `resolve()` invokes it (the closure simply returns the pre-bound value). This differs from `register()` where the closure receives the container as an argument.

**Important:** Calling `set()` with a key that was previously marked as singleton **clears** the singleton flag and cached instance. The key becomes a set binding thereafter.

## Resolution

### `resolve(string $key): mixed`

Finds the first binding matching `$key` in `$factories` and returns it. Throws `\InvalidArgumentException` if no binding exists:

```php
try {
    $obj = $container->resolve('missing_service');
} catch (\InvalidArgumentException $e) {
    // No service bound for: missing_service
}
```

Resolution logic by binding type:

1. **Singleton:** Checks `$singletons[$key]`. If set, returns cached `$instances[$key]` on second+ call; otherwise resolves via `$factories[$key]($this)` and caches.
2. **Factory (non-singleton):** Invokes `$factories[$key]($this)` directly every time.
3. **Set:** A set binding's factory is `static fn () => $value` — a zero-arg closure returning the stored value identically on every call.

### `singleton(string $key): mixed`

Sets `$singletons[$key] = true`, then calls `resolve($key)`. Effectively resolves once and caches for future resolutions of the same key. Same exception behavior as `resolve()` if the key is not bound.

## Introspection

### `has(string $key): bool`

Checks whether a key has **any** binding — factory stored in `$factories`, or a cached singleton instance stored in `$instances`. Does **not** require the key to have an active singleton flag:

```php
if ($container->has('cache.adapter')) {
    // Cache extension was loaded; use it.
    $adapter = $container->singleton('cache.adapter');
} else {
    // Fall back to in-memory cache.
}
```

### `isSingleton(string $key): bool`

Returns whether a key is currently marked as a singleton (exists in `$singletons`). A key can appear in `$factories` and `$instances` but still return `false` from `isSingleton()` if a subsequent `register()` or `set()` call cleared the singleton flag:

```php
if ($container->isSingleton('db.connection')) {
    // Connection is shared — safe to call close() carefully.
}
```

## Lifecycle Model

The container itself has no lifecycle methods like `shutdown()` or `dispose()`. Bound factories are closures; set values are stored directly; singleton results are cached in a plain array. All memory is freed when the container instance goes out of scope at script end.

This design means:
- **No cleanup hooks.** Services that need teardown should handle it internally (`__destruct`, `finally` blocks).
- **No eager initialization.** Bound factories are called only when resolved. No service starts "just because" it's registered.
- **Deterministic order dependency.** If service A depends on B, the factory for A must be resolved *after* B is bound (or the B closure self-initializes its dependencies).

## Design Decisions

### Why Not Reflection Wiring?

Reflection-based autowiring (e.g., constructing objects from type-hinted constructor parameters) adds a dependency inversion layer that hides explicit wiring. Core-Web's scope — a micro-framework with ~10–20 core services — favors **explicitness**: every binding is a documented, visible line of code in `index.php` or an extension manifest.

### Why Only Three Binding Strategies?

Additional strategies (constructor injection hints, named aliases, lazy-proxies) address use cases that Core-Web's service count doesn't need:
- Named aliases add indirection cost without benefit for 10–20 services.
- Lazy proxies complicate the simple resolution contract and hurt IDE static analysis.
- Eager-preload is unnecessary when boot time is dominated by file includes, not container operations.

When these constraints change (50+ services needed), this document will guide a rewrite or extension of the container class.

### Why `static fn () => $value` for Set Binding?

Using a closure to wrap set values unifies resolution across all strategies — there is exactly one code path that executes after `$factories[$key]` lookup. This prevents bugs where "set" bindings behaved differently than "register" bindings at any point in the future. The zero-arg variant (`static fn () => $value`) is used instead of accepting a container argument because set values don't need dependency composition.

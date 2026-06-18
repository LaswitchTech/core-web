# Dependency Injection Container

## Overview

The `Container` class is a minimal dependency-injection container that manages service bindings and their resolution lifecycles. It supports three binding strategies — factory closures, singleton (cached-first-resolution), and direct value binding — without the complexity of reflection-based autowiring or service providers found in larger frameworks.

This simplicity is intentional: Core-Web needs only explicit, testable wiring at init time, not runtime class introspection. The container solves one problem — **where do objects come from when I need them?** — and does it with six methods.

## Binding Strategies

### Factory Registration (`register`)

Binds a factory closure to a keyed name. Every resolution calls the factory fresh:

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

### Singleton (`singleton`)

Resolves and caches once. All subsequent calls return the identical object reference:

```php
$conn = $container->singleton('db.connection'); // Creates and caches
// ...later...
$another = $container->singleton('db.connection'); // Returns same instance
assert($conn === $another); // true
```

Use singletons for stateful services where object identity matters (e.g., database connections, session handlers).

### Direct Set Binding (`set`)

Stores a value directly without a factory wrapper. The stored value is resolved identically to a factory that returns a static:

```php
$container->set('mode', 'ROUTER');
assert($container->resolve('mode') === 'ROUTER'); // true
```

Under the hood, `set()` wraps the value in `fn () => $boundValue` so both registrations and sets resolve through the same path.

## Resolution

### `resolve(string $key): mixed`

Finds the first binding matching `$key` (factory, singleton cache, or set-stored value) and returns it. Throws `\InvalidArgumentException` if no binding exists:

```php
try {
    $obj = $container->resolve('missing_service');
} catch (\InvalidArgumentException $e) {
    // No service bound for: missing_service
}
```

### `singleton(string $key): mixed`

Resolves on first call, caches the result for all subsequent calls. Returns early from cache without calling the factory again.

## Introspection

### `has(string $key): bool`

Checks whether a key has any binding (factory, singleton, or set) without triggering resolution:

```php
if ($container->has('cache.adapter')) {
    // Cache extension was loaded; use it.
    $adapter = $container->singleton('cache.adapter');
} else {
    // Fall back to in-memory cache.
}
```

### `isSingleton(string $key): bool`

Returns whether a key is registered as a singleton (as opposed to factory or set). Useful for debugging and conditional logic:

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

Using a closure to wrap set values unifies resolution across all strategies — there is exactly one code path that executes after `factory[$key]` lookup. This prevents bugs where "set" bindings behaved differently than "register" bindings at any point in the future.

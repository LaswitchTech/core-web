# Renderer Engine Registry

**Purpose** — Keyed registry of rendering engines used by the ``Renderer`` to select an engine for each resource Entry.

## Registration

Engines are registered into the registry (which extends ``\ArrayObject``) via ``register()``:

```php
$engineRegistry = new \Laswitchtech\CoreWeb\Renderer\Engine\Registry();
$engineRegistry->register(new PhpEngine());
$engineRegistry->register(new LatteEngine($appRoot));
```

Each engine is **keyed by** its ``name()`` return value (a unique string like ``'php'`` or ``'latte'``).  Internally this calls ``offsetSet()`` on the ArrayObject parent.

## Resolve Flow

When the ``Renderer`` needs to process an Entry it calls ``resolve(Entry)``.  Resolution follows a strict three-step priority:

### Step 1 — Metadata engine override

If the Entry's ``metadata['engine']`` is set to a non-null string, that name is used directly:

```php
$engineName = $entry->metadata['engine'] ?? null;   // e.g. 'latte'
```

- **Registered** → return the registered engine immediately.
- **Not registered** → throw ``RenderException`` with message ``Engine '{name}' referenced in metadata but not registered.``

No fallback is applied when a name is explicitly given through metadata — if the caller asks for a specific engine it must exist.

### Step 2 — PHP default

When *no* metadata override is present the registry falls back to the first registered ``'php'`` engine:

```php
if ($this->offsetExists('php')) {
    return $this->offsetGet('php');
}
```

This is the **default** behaviour for all non-overridden entries.  CoreWeb registers ``PhpEngine`` as the first engine so this path always succeeds in a standard bootstrap.

### Step 3 — No engines registered

If no ``'php'`` entry exists (a configuration error), a ``RenderException`` is thrown:

```
No renderer engines registered.  At least 'php' must be registered.
```

## Metadata Engine Override

The metadata override path allows a single Entry to select an alternative engine without any conditional logic in the caller:

```php
// In hello.world plugin:
$rendererRegistry->registerView(
    'hello.latte.view',
    __DIR__ . '/views/hello-view.latte',
    ['engine' => 'latte']      // explicit override
);
```

The resolve logic checks ``$entry->metadata['engine']`` before any default path, making the Override authoritative.

## PHP Fallback Behavior

CoreWeb always registers ``PhpEngine`` first during bootstrap, making it both:

1. **The engine keyed as ``'php'``** in the registry.
2. **The default engine** for every Entry that does not specify a metadata override.

This guarantees that ``.php`` view files render correctly even when additional engines (e.g. Latte) are also registered.

## Integration with ``renderer.engine.register`` Hook

The ``initRenderer()`` method in Bootstrap constructs the engine registry, registers core engines (PhpEngine + LatteEngine), then fires the ``renderer.engine.register`` hook:

```php
$engineRegistry = new EngineRegistry();
$engineRegistry->register(new PhpEngine());
$engineRegistry->register(new LatteEngine($this->appRoot));

$hookRegistry->trigger('renderer.engine.register', [
    'engineRegistry' => $engineRegistry,   // Engines can be added here
    'container'      => static::$instance,  // Full DI container
    'mode'           => 'web'|'cli',        // Bootstrap mode
]);
```

Extensions receive the ``$engineRegistry`` instance in the hook payload and may call ``register()`` to add custom engines.  Registration happens **before** the registry is wired into the Renderer, so all additions are visible at render time.

# Engine Interface

**Purpose** — Contract implemented by all rendering engine classes that produce output from a template Entry.

## ``name()``

```php
public function name(): string
```

Return the unique engine name used for keyed lookup in the engine registry.

- Must be **unique** across all registered engines.
- The return value is used as the ArrayObject key during ``register()``.
- Examples: ``'php'``, ``'latte'``.

## ``render()``

```php
public function render(Entry $entry, array $data = []): string
```

Render the template Entry and return a string of output.

- **$entry** — The resource Entry containing the template file path and metadata.
- **$data**  — Optional associative array of variables available to the template.
- **Returns** — Rendered HTML / string output.
- **Throws** — ``\Laswitchtech\CoreWeb\Renderer\Error\RenderException`` on template parse / render failure.

Errors must not be swallowed inside the hook pipeline — they propagate so Bootstrap can handle them at the outermost layer.

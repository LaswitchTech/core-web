# PhpEngine

**Purpose** — Renderer engine that executes native PHP template files directly.

## How It Works

The template file is **not compiled** at runtime.  Instead it is included in an isolated variable scope so the variables passed as ``$data`` are available as locals inside the template.

### Output Buffering

Rendering uses output buffering to capture the echoed content of the PHP template:

```php
ob_start();
try {
    extract($data, EXTR_SKIP);    // import data keys as local variables
    require $entry->path;         // include and execute the template
} catch (\Throwable $e) {
    ob_end_clean();               // discard any partially captured output on error
    throw new RenderException(…);
}

return (string) ob_get_clean();   // return captured content as string
```

### ``extract($data, EXTR_SKIP)`` - Import data variables into local scope

- Each key in the ``$data`` array becomes a local PHP variable inside the template.
- ``EXTR_SKIP`` ensures that existing locals (if any) are _not_ overwritten by incoming data keys.
- This mirrors the behaviour of native ``.php`` views prior to engine abstraction.

### ``require $entry->path`` - Load the template file

The template path is taken from ``$entry->path`` (no modification).  The file is included within the isolated output-buffer scope so any echoed content becomes the return value.

### RenderException Behavior

If the template file does not exist:

```
PHP engine: file not found: {path}
```

If an exception occurs during execution (any ``\Throwable``):

```php
ob_end_clean();   // discard partial output
throw new RenderException("PHP engine: render failed: {$e->getMessage()}", 0, $e);
```

The original ``$e`` is preserved as the **cause** (third argument to Exception constructor).

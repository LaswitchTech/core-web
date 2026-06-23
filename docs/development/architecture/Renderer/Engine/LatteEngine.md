# LatteEngine

**Purpose** — Renderer engine that uses the [Latte templating library](https://github.com/nette/latte) to compile and render templates.

## Latte Integration

Each call to ``render()`` creates a **per-request** ``\Latte\Engine`` instance:

```php
$template = new \Latte\Engine();
$template->setTempDirectory($this->cacheDir);

try {
    return (string) $template->renderToString($entry->path, $data);
} catch (\Latte\RuntimeException $e) {
    throw new RenderException("Latte engine: render failed: {$e->getMessage()}", 0, $e);
}
```

- A new Latte instance is created on every ``render()`` call — state is not shared across invocations.
- ``renderToString()`` compiles the template on first use (warm-up) and caches subsequent compilations in the temp directory.

## Cache Directory

The cache (compiled template) directory is determined in the constructor by inspecting ``$appRoot``:

```php
$dir = rtrim($appRoot, '/') . '/storage/cache/renderer/latte';
```

### Directory Creation

The constructor attempts to create the full path recursively with ``0755`` permissions:

```php
$created  = @mkdir($dir, 0755, true);
$exists   = is_dir($dir);

if ($created || $exists) {
    $this->cacheDir = $dir;
    return;
}
```

- If the directory already exists ``is_dir()`` covers it.
- If both fail (filesystem permission denied, parent missing, etc.) a **fallback** is used.

### Fallback on mkdir Failure

```php
trigger_error(
    'LatteEngine: cannot create renderer cache directory "{path}" — falling back to sys_get_temp_dir()',
    E_USER_WARNING
);

$this->cacheDir = sys_get_temp_dir() . '/coreweb-latte';
```

The fallback uses ``sys_get_temp_dir()/coreweb-latte`` and triggers an ``E_USER_WARNING`` so administrators are notified but rendering is not blocked.

## renderToString() - Template Compilation

Latte compiles templates to PHP bytecode at runtime (the "warm" phase).  The compiled files are stored in the temp/cache directory identified above.

```php
return (string) $template->renderToString($entry->path, $data);
```

- **$entry->path** — Absolute path to the ``.latte`` template file.
- **$data** — Associative array of variables available inside the template as Latte macros (e.g. ``{$name}``).
- **Returns** — Rendered HTML / string output.

## RenderException Behavior

### File Not Found

If the template file does not exist at ``$entry->path``:

```
Latte engine: file not found: {path}
```

Thrown as ``\Laswitchtech\CoreWeb\Renderer\Error\RenderException`` before Latte is invoked.

### Runtime Render Failure

If Latte throws a ``\Latte\RuntimeException`` during compilation or rendering:

```php
throw new RenderException("Latte engine: render failed: {$e->getMessage()}", 0, $e);
```

The original `$e` is preserved as the exception **cause** (third argument).

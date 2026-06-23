<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Renderer engine that uses the Latte templating library.
 *
 * Templates are compiled to PHP cache (warm) and served with metadata for debugging.
 * The cache directory defaults to ``{tmp}/coreweb/latte-{ENVNAME}``; set the
 * ``latte_cache_dir`` config key during bootstrap if you need a custom path.
 *
 * Documentation: docs/development/architecture/Renderer/Engine/LatteEngine.md
 */
final class LatteEngine implements EngineInterface
{
    /** @var non-empty-string */
    private string $cacheDir;

    public function __construct(string $appRoot)
    {
        // Build cache path inside the application directory.
        $dir = rtrim($appRoot, '/') . '/storage/cache/renderer/latte';

        // Attempt to create the directory tree; tolerate if it already exists (--ignore-if-exists).
        $created  = @mkdir($dir, 0755, true);
        $exists   = is_dir($dir);

        if ($created || $exists) {
            $this->cacheDir = $dir;

            return;
        }

        // Fallback to system temp on mkdir failure -- do not throw to preserve compatibility.
        trigger_error(
            'LatteEngine: cannot create renderer cache directory "' . $dir . '" — '
            . 'falling back to sys_get_temp_dir()',
            E_USER_WARNING
        );

        $this->cacheDir = sys_get_temp_dir() . '/coreweb-latte';
    }

    public function name(): string
    {
        return 'latte';
    }

    public function render(Entry $entry, array $data = []): string
    {
        if (!is_file($entry->path)) {
            throw new \Laswitchtech\CoreWeb\Renderer\Error\RenderException("Latte engine: file not found: {$entry->path}");
        }

        // Use per-request Latte instance.
        $template = new \Latte\Engine();
        $template->setTempDirectory($this->cacheDir);

        try {
            return (string) $template->renderToString($entry->path, $data);
        } catch (\Latte\RuntimeException $e) {
            throw new \Laswitchtech\CoreWeb\Renderer\Error\RenderException("Latte engine: render failed: {$e->getMessage()}", 0, $e);
        }
    }
}

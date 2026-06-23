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

    public function __construct(string $cacheDir, string $tmpDir)
    {
        // Normalise cache directory so the trailing slash is predictable.
        $this->cacheDir  = rtrim($cacheDir, '/') . '/' . rawurlencode(basename($tmpDir));
    }

    public function name(): string
    {
        return 'latte';
    }

    public function supports(Entry $entry): bool
    {
        // Accept any entry type whose path ends with .latte.
        return substr($entry->path, -6) === '.latte';
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

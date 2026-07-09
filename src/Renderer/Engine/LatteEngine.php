<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Renderer engine that uses the Latte templating library.
 *
 * Templates are compiled to PHP cache (warm) and served with metadata for debugging.
 * The cache directory defaults to ``{tmp}/coreweb/latte-{ENVNAME}``; set the
 * ``renderer.latte.cache_path`` config key during bootstrap if you need a custom path.
 *
 * Documentation: docs/development/architecture/Renderer/Engine/LatteEngine.md
 */
final class LatteEngine implements EngineInterface
{
    /** @var non-empty-string */
    private string $cacheDir;

    private bool $useStrict;

    /** @param non-empty-string|null $cachePath  absolute or relative cache directory; null → defaults. */
    public function __construct(
        private readonly string         $appRoot,
        ?string                         $cachePath = null,
        private readonly bool           $strictMode = false,
        private readonly bool           $debugMode  = false,
    ) {
        // Resolve cache path: explicit → default.
        /** @var non-empty-string */
        $dir = $this->resolveCachePath($cachePath);

        // Attempt to create the directory tree; tolerate if it already exists (--ignore-if-exists).
        $created  = @mkdir($dir, 0755, true);
        $exists   = is_dir($dir);

        if ($created || $exists) {
            $this->cacheDir = $dir;

            return;
        }

        // Fallback to system temp on mkdir failure -- do not throw to preserve compatibility.
        trigger_error(
            'LatteEngine: cannot create renderer cache directory "' . $dir . '" -- '
            . 'falling back to sys_get_temp_dir()',
            E_USER_WARNING
        );

        $this->cacheDir = sys_get_temp_dir() . '/coreweb-latte';
    }

    /**
     * Resolve the cache dir from an explicit or implicit config value.
     *
     * - ``null`` / empty  -> default ``{appRoot}/storage/cache/renderer/latte``.
     * - Absolute path     -> used as-is.
     * - Relative path     -> resolved against ``$this->appRoot``.
     *
     * @param string|null $cachePath explicit value (may be empty).
     *
     * @return non-empty-string
     */
    private function resolveCachePath(?string $cachePath): string
    {
        if ($cachePath !== '' && $cachePath !== null) {
            // Absolute path -- use as-is (no /latte appended).
            if (is_string(parse_url($cachePath, PHP_URL_SCHEME)) || str_starts_with($cachePath, '/')) {
                return rtrim($cachePath, '/');
            }

            // Relative path -- resolve against appRoot exactly.
            return rtrim(rtrim($this->appRoot, '/') . '/' . ltrim($cachePath, '/'), '/');
        }

        // Default cache directory when no config path is set.
        return rtrim($this->appRoot, '/') . '/storage/cache/renderer/latte';
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

        // Apply strict mode (debug_mode is stored but not wired to any Latte API).
        try {
            if (is_callable([$template, 'setStrictTypes'])) {
                $template->setStrictTypes($this->useStrict);
            }
            if (is_callable([$template, 'setStrictParsing'])) {
                $template->setStrictParsing($this->useStrict);
            }
        } catch (\Throwable) { /* Continue on Latte version mismatch. */ }

        try {
            return (string) $template->renderToString($entry->path, $data);
        } catch (\Latte\RuntimeException $e) {
            throw new \Laswitchtech\CoreWeb\Renderer\Error\RenderException("Latte engine: render failed: {$e->getMessage()}", 0, $e);
        }
    }

    // ------------------------------------------------------------------ --/
     // Intentionally undocumented getters (used by unit tests / admin
     // introspection).  Do not rely on these in production code.            */

    /** Expose the resolved cache path for introspection only. */
    public function getCacheDir(): string
    {
        return $this->cacheDir;
    }

    /** Expose the strict-mode flag for introspection only. */
    public function getStrictMode(): bool
    {
        return $this->strictMode;
    }

    /** Expose the debug-mode flag for introspection only. */
    public function isDebugMode(): bool
    {
        return $this->debugMode;
    }
}

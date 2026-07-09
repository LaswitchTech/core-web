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
        // Resolve cache path: config → relative (wrt app_root) → default.
        $rawConfig = '';

        try {
            /** @var mixed $v */
            $v = \Laswitchtech\CoreWeb\Config::get('renderer.latte.cache_path', null);
            if (is_string($v) && $v !== '') {
                $rawConfig = $v;
            }
        } catch (\Throwable) { /* Config not yet loaded — use defaults below. */ }

        /** @var non-empty-string */
        $dir = $this->resolveCachePath($rawConfig, $appRoot);

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

    /**
     * Resolve the cache dir from a raw config value.
     *
     * - Empty / unknown  → default ``{app_root}/storage/cache/renderer/latte``.
     * - Absolute path     → used as-is.
     * - Relative path     → resolved against ``$appRoot``.
     *
     * @param string          $rawConfig value (may be empty).
     * @param non-empty-string $appRoot   application root directory.
     *
     * @return non-empty-string
     */
    private function resolveCachePath(string $rawConfig, string $appRoot): string
    {
        if ($rawConfig !== '') {
            // Absolute path — use as-is (no /latte appended).
            if (is_string(parse_url($rawConfig, PHP_URL_SCHEME)) || str_starts_with($rawConfig, '/')) {
                return rtrim($rawConfig, '/');
            }

            // Relative path — resolve against app_root exactly.
            return rtrim(rtrim($appRoot, '/') . '/' . ltrim($rawConfig, '/'), '/');
        }

        // Default cache directory when no config path is set.
        return rtrim($appRoot, '/') . '/storage/cache/renderer/latte';
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

        // Apply strict mode settings from config (defaults to false -- no change to current behavior).
        /** @var mixed $v */
        if (($v = \Laswitchtech\CoreWeb\Config::get('renderer.latte.strict_types', null)) === true) {
            $template->setStrictTypes(true);
        }
        /** @var mixed $w */
        if (($w = \Laswitchtech\CoreWeb\Config::get('renderer.latte.strict_parsing', null)) === true) {
            $template->setStrictParsing(true);
        }

        try {
            return (string) $template->renderToString($entry->path, $data);
        } catch (\Latte\RuntimeException $e) {
            throw new \Laswitchtech\CoreWeb\Renderer\Error\RenderException("Latte engine: render failed: {$e->getMessage()}", 0, $e);
        }
    }
}

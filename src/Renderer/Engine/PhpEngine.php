<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Error\RenderException;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Renderer engine that executes native PHP templates.
 *
 * The template file is included in an isolated scope via ``extract()`` so variables
 * passed as $context are available as locals inside the template. No compilation step
 * is performed at runtime — this engine mirrors existing behaviour for ``.php`` views.
 *
 * Documentation: docs/development/architecture/Renderer/Engine/PhpEngine.md
 */
final class PhpEngine implements EngineInterface
{
    public function name(): string
    {
        return 'php';
    }

    public function render(Entry $entry, array $data = []): string
    {
        if (!is_file($entry->path)) {
            throw new RenderException("PHP engine: file not found: {$entry->path}");
        }

        // Prevent variable leakage between requests by creating a scope.
        ob_start();
        try {
            extract($data, EXTR_SKIP);
            require $entry->path;
        } catch (\Throwable $e) {
            ob_end_clean();
            throw new RenderException("PHP engine: render failed: {$e->getMessage()}", 0, $e);
        }

        return (string) ob_get_clean();
    }
}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer;

use Laswitchtech\CoreWeb\Renderer\Error\RenderException;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Minimal renderer that composes layout -> template -> view through the Registry.
 *
 * Documentation: docs/development/architecture/Renderer/Renderer.md
 */
final class Renderer
{
    private Registry $registry;

    public function __construct(Registry $registry)
    {
        $this->registry = $registry;
    }

    /**
     * Resolve and compose layout, template, and view files.
     *
     * Pipeline: view -> template -> layout
     * Each layer resolves through the Registry and passes rendered output to the next.
     */
    public function render(
        string $layout,
        string $template,
        string $view,
        array $data = [],
    ): string {
        // 1. Resolve view entry.
        $viewEntry = $this->registry->resolve($view, Entry::TYPE_VIEW);
        if ($viewEntry === null) {
            throw new RenderException(
                "No registered view resource named '{$view}'."
            );
        }

        // 2. Render view file into $viewContent.
        $viewContent = $this->renderFile($viewEntry, $data);

        // 3. Resolve template entry.
        $templateEntry = $this->registry->resolve($template, Entry::TYPE_TEMPLATE);
        if ($templateEntry === null) {
            throw new RenderException(
                "No registered template resource named '{$template}'."
            );
        }

        // 4. Render template with viewContent and data into $templateContent.
        $templateData = array_merge($data, [
            'viewContent' => $viewContent,
        ]);
        $templateContent = $this->renderFile($templateEntry, $templateData);

        // 5. Resolve layout entry.
        $layoutEntry = $this->registry->resolve($layout, Entry::TYPE_LAYOUT);
        if ($layoutEntry === null) {
            throw new RenderException(
                "No registered layout resource named '{$layout}'."
            );
        }

        // 6. Render layout with templateContent, viewContent and data.
        $layoutData = array_merge($data, [
            'templateContent' => $templateContent,
            'viewContent'     => $viewContent,
        ]);

        return $this->renderFile($layoutEntry, $layoutData);
    }

    /**
     * Render a single resource Entry directly.
     *
     * Uses output buffering: extract data into scope and require the file.
     */
    public function renderResource(Entry $entry, array $data = []): string
    {
        return $this->renderFile($entry, $data);
    }

    /**
     * Render a single entry with buffered output protection.
     *
     * Detects Latte templates via Entry::metadata['engine'] and delegates accordingly.
     *
     * @throws RenderException if the file does not exist, is not readable, or throws during require.
     */
    private function renderFile(Entry $entry, array $data): string
    {
        // Validate file before rendering.
        if (!is_file($entry->path)) {
            throw new RenderException(
                "Render path does not exist: {$entry->path}"
            );
        }

        if (!is_readable($entry->path)) {
            throw new RenderException(
                "Render path is not readable: {$entry->path}"
            );
        }

        // Latte engine dispatch.
        if (($entry->metadata['engine'] ?? null) === 'latte') {
            return $this->renderLatte($entry, $data);
        }

        // Plain PHP rendering (default path).
        ob_start();

        try {
            extract($data, EXTR_SKIP);
            require $entry->path;
            return (string) ob_get_clean();
        } catch (\Throwable $e) {
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            throw new RenderException(
                "Failed to render resource '{$entry->name}': {$e->getMessage()}",
                0,
                $e
            );
        }
    }

    /**
     * Render a Latte template file and return the string output.
     *
     * @throws RenderException if Latte class is not available or rendering fails.
     */
    private function renderLatte(Entry $entry, array $data): string
    {
        if (!class_exists(\Latte\Engine::class)) {
            throw new RenderException('Latte is unavailable but requested for resource: '.$entry->name);
        }

        try {
            // Determine cache directory with fallback chain.
            $cacheBase = dirname(__DIR__, 2) . '/storage/cache/renderer/latte';

            if (!is_dir($cacheBase) && !mkdir($cacheBase, 0755, true) && !is_dir($cacheBase)) {
                $cacheBase = sys_get_temp_dir() . '/core-web-latte';

                if (!is_dir($cacheBase) && !mkdir($cacheBase, 0755, true) && !is_dir($cacheBase)) {
                    throw new RenderException('Unable to create Latte cache directory.');
                }
            }

            $engine = new \Latte\Engine();
            $engine->setTempDirectory($cacheBase);

            ob_start();

            try {
                $engine->render($entry->path, $data);
                return (string) ob_get_clean();
            } catch (\Throwable $e) {
                if (ob_get_level() > 0) {
                    ob_end_clean();
                }
                throw new RenderException(
                    "Failed to render Latte resource '{$entry->name}': {$e->getMessage()}",
                    0,
                    $e
                );
            }
        } catch (RenderException $re) {
            throw $re; // pass through already-render-exception cases.
        } catch (\Throwable $e) {
            throw new RenderException(
                "Failed to initialize Latte engine for '{$entry->name}': {$e->getMessage()}",
                0,
                $e
            );
        }
    }
}

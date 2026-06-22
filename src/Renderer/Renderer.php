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
}

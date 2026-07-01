<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer;

use Laswitchtech\CoreWeb\Helper\Bag;
use Laswitchtech\CoreWeb\Renderer\Error\RenderException;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Minimal renderer that composes layout -> template -> view through the Registry.
 *
 * Documentation: docs/development/architecture/Renderer/Renderer.md
 */
final class Renderer
{
    private ?Bag $helpers = null;

    private Registry $registry;
    private Engine\Registry $engineRegistry;

    public function __construct(Registry $registry, Engine\Registry $engineRegistry)
    {
        $this->registry       = $registry;
        $this->engineRegistry = $engineRegistry;
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
        // 1. Inject helpers into data so they are available in all layers (view → template → layout).
        if ($this->helpers !== null) {
            $data = array_merge($data, ['helpers' => $this->helpers]);
        }

        // 2. Resolve view entry.
        $viewEntry = $this->registry->resolve($view, Entry::TYPE_VIEW);
        if ($viewEntry === null) {
            throw new RenderException(
                "No registered view resource named '{$view}'."
            );
        }

        // 2. Render view file into $viewContent.
        $viewContent = $this->engineRegistry->resolve($viewEntry)->render($viewEntry, $data);

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
        $templateContent = $this->engineRegistry->resolve($templateEntry)->render($templateEntry, $templateData);

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

        return $this->engineRegistry->resolve($layoutEntry)->render($layoutEntry, $layoutData);
    }

    /**
     * Render a single resource Entry directly.
     */
    public function renderResource(Entry $entry, array $data = []): string
    {
        // Validate file before rendering.
        if (!is_file($entry->path)) {
            throw new RenderException("Render path does not exist: {$entry->path}");
        }

        if (!is_readable($entry->path)) {
            throw new RenderException("Render path is not readable: {$entry->path}");
        }

        // Inject helpers into data so they are available in the rendered entry.
        if ($this->helpers !== null) {
            $data = array_merge($data, ['helpers' => $this->helpers]);
        }

        return $this->engineRegistry->resolve($entry)->render($entry, $data);
    }

    /** Inject the helper Bag so ``$helpers`` becomes available in all view/template/layout layers. */
    public function setHelpers(Bag $bag): void
    {
        $this->helpers = $bag;
    }
}

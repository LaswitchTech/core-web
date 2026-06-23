<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Contract for a renderer engine that can produce output from a template Entry.
 *
 * Each engine implementation must:
 *   - Report its name via ``name()`` (used by the engine registry for keyed lookup).
 *   - Produce a string of rendered output via ``render()``.
 *
 * Documentation: docs/development/architecture/Renderer/EngineInterface.md
 */
interface EngineInterface
{
    /**
     * Return the engine name used for Container registration lookup.
     *
     * E.g. "php" or "latte" — must be unique across all registered engines.
     */
    public function name(): string;

    /**
     * Render the Entry and return a string.
     *
     * Implementations throw ``\Laswitchtech\CoreWeb\Renderer\Error\RenderException``
     * on template parse / render failure.
     * The calling code must not catch engine errors inside the hook pipeline — they
     * should propagate so Bootstrap can handle them at the outermost layer.
     */
    public function render(Entry $entry, array $data = []): string;
}

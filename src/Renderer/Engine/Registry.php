<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;
use Laswitchtech\CoreWeb\Renderer\Error\RenderException;

/**
 * Engine registry keyed by name for lazy instantiation and lookup.
 *
 * Documentation: docs/development/architecture/Renderer/EngineRegistry.md
 */
final class Registry extends \ArrayObject
{
    /**
     * Register an engine instance.
     */
    public function register(EngineInterface $engine): void
    {
        $this->offsetSet($engine->name(), $engine);
    }

    /**
     * Resolve the engine to use for a given Entry.
     *
     * Resolution strategy:
     *   1. If metadata['engine'] is set and registered, return that engine.
     *   2. If metadata['engine'] is set but not registered, throw RenderException.
     *   3. Otherwise return the default 'php' engine if registered.
     */
    public function resolve(Entry $entry): EngineInterface
    {
        // Try metadata override first.
        $engineName = $entry->metadata['engine'] ?? null;

        if (is_string($engineName)) {
            // Metadata is set: must be a registered engine — no fallback.
            if ($this->offsetExists($engineName)) {
                return $this->offsetGet($engineName);
            }

            throw new RenderException(
                "Engine '{$engineName}' referenced in metadata but not registered."
            );
        }

        // Fallback to 'php' engine when no engine metadata is set.
        if ($this->offsetExists('php')) {
            return $this->offsetGet('php');
        }

        throw new RenderException(
            "No renderer engines registered. At least 'php' must be registered."
        );
    }
}

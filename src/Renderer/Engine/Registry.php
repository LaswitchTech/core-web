<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;
use Laswitchtech\CoreWeb\Renderer\Error\RenderException;

/**
 * Engine registry keyed by name for lazy instantiation and lookup.
 *
 * Documentation: docs/development/architecture/Renderer/Engine/Registry.md
 */
final class Registry extends \ArrayObject
{
    /**
     * Register an engine instance.
     *
     * The engine is keyed by its ``name()`` return value.
     */
    public function register(EngineInterface $engine): void
    {
        $this->offsetSet($engine->name(), $engine);
    }

    /**
     * Replace or register an engine by a specific name.
     *
     * Returns the previous engine instance if one was replaced, or null.
     */
    public function replace(string $name, EngineInterface $engine): ?EngineInterface
    {
        $existing = null;
        if ($this->offsetExists($name)) {
            /** @var EngineInterface $existing */
            $existing = $this->offsetGet($name);
        }

        $this->offsetUnset($name);
        $this->offsetSet($name, $engine);

        return $existing;
    }

    /**
     * Resolve the engine to use for a given Entry.
     *
     * Resolution strategy:
     *   1. metadata['engine] first (registered only — no fallback).
     *   2. File extension fallback (.latte → latte, .php → php).
     *   3. renderer.default from config if set and registered.
     *   4. Final fallback to 'php' if registered.
     */
    public function resolve(Entry $entry): EngineInterface
    {
        // 1. Meta-data override (registered only — no fallback).
        $engineName = $entry->metadata['engine'] ?? null;

        if (is_string($engineName)) {
            if ($this->offsetExists($engineName)) {
                return $this->offsetGet($engineName);
            }

            throw new RenderException(
                "Engine '{$engineName}' referenced in meta-data but not registered."
            );
        }

        // 2. File extension fallback (map .ext to engine name).
        if (($engineName = $this->extensionToEngine($entry)) !== null) {
            if ($this->offsetExists($engineName)) {
                return $this->offsetGet($engineName);
            }
        }

        // 3. renderer.default from config (if set and registered).
        /** @var mixed $defaultEngine */
        $defaultEngine = \Laswitchtech\CoreWeb\Config::get('renderer.default', null);

        if (is_string($defaultEngine) && $defaultEngine !== '' && $this->offsetExists($defaultEngine)) {
            return $this->offsetGet($defaultEngine);
        }

        // 4. Final fallback to 'php'.
        if ($this->offsetExists('php')) {
            return $this->offsetGet('php');
        }

        throw new RenderException(
            "No renderer engines registered. At least 'php' must be registered."
        );
    }

    /**
     * Map an Entry's path extension to a known engine name.
     *
     * - .latte → latte
     * - .php   → php
     * Returns null when the extension has no mapping.
     */
    private function extensionToEngine(Entry $entry): ?string
    {
        $ext = strtolower(pathinfo($entry->path, PATHINFO_EXTENSION));

        return match ($ext) {
            'latte' => 'latte',
            'php' => 'php',
            default => null,
        };
    }
}

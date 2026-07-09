<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Engine;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;
use Laswitchtech\CoreWeb\Renderer\Error\RenderException;

/**
 * Engine registry keyed by name for lazy instantiation and lookup.
 *
 * Documentation: docs/development/architecture/Renderer/Engine/Registry.md
 */
final class Registry
{
    /** @var array<string, EngineInterface> */
    private array $engines = [];

    // --------------------------------------------------------------------
    // Public API
    // --------------------------------------------------------------------

    /**
     * Register an engine instance.
     *
     * The engine is keyed by its ``name()`` return value.
     */
    public function register(EngineInterface $engine): void
    {
        $this->engines[$engine->name()] = $engine;
    }

    /**
     * Replace or register an engine by a specific name.
     *
     * Returns the previous engine instance if one was replaced, or null.
     */
    public function replace(string $name, EngineInterface $engine): ?EngineInterface
    {
        $existing = $this->engines[$name] ?? null;
        unset($this->engines[$name]);

        $this->engines[$name] = $engine;

        return $existing;
    }

    /**
     * Check whether an engine with the given name is registered.
     */
    public function has(string $name): bool
    {
        return isset($this->engines[$name]);
    }

    /**
     * Get a registered engine by name, or null when not found.
     */
    public function get(string $name): ?EngineInterface
    {
        return $this->engines[$name] ?? null;
    }

    /**
     * Return all registered engines as an array keyed by name.
     *
     * @return array<string, EngineInterface>
     */
    public function all(): array
    {
        return $this->engines;
    }

    /**
     * Return the number of registered engines.
     */
    public function count(): int
    {
        return \count($this->engines);
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
            if (isset($this->engines[$engineName])) {
                return $this->engines[$engineName];
            }

            throw new RenderException(
                "Engine '{$engineName}' referenced in meta-data but not registered."
            );
        }

        // 2. File extension fallback (map .ext to engine name).
        if (($engineName = $this->extensionToEngine($entry)) !== null) {
            if (isset($this->engines[$engineName])) {
                return $this->engines[$engineName];
            }
        }

        // 3. renderer.default from config (if set and registered).
        /** @var mixed $defaultEngine */
        $defaultEngine = \Laswitchtech\CoreWeb\Config::get('renderer.default', null);

        if (is_string($defaultEngine) && $defaultEngine !== '' && isset($this->engines[$defaultEngine])) {
            return $this->engines[$defaultEngine];
        }

        // 4. Final fallback to 'php'.
        if (isset($this->engines['php'])) {
            return $this->engines['php'];
        }

        throw new RenderException(
            "No renderer engines registered. At least 'php' must be registered."
        );
    }

    // --------------------------------------------------------------------
    // Internal helpers
    // --------------------------------------------------------------------

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

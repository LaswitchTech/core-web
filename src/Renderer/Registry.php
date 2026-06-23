<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer;

use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

/**
 * Named registration store for renderer resources.
 *
 * Stores multiple entries per (name, type) pair and resolves the single best
 * Entry by precedence: highest priority -> provider rank -> earliest order.
 *
 * Documentation: docs/development/architecture/Renderer/Registry.md
 */
final class Registry
{
    /** @var array<string, array<string, array<int, Entry>>> indexed [type][name] -> [order => Entry] */
    private array $store = [];

    private int $nextOrder = 0;

    /* ------------------------------------------------------------------ --/
     /  Registration                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Add an entry by parameter.
     *
     * Validates name, type, path, and provider before inserting.
     */
    public function add(
        string $name,
        string $type,
        string $path,
        string $provider = Entry::PROVIDER_CORE,
        int $priority = 0,
        array $metadata = [],
    ): self {
        if ($name === '') {
            throw new \InvalidArgumentException('Entry name must not be empty.');
        }

        if ($type === '') {
            throw new \InvalidArgumentException('Entry type must not be empty.');
        }

        if (!in_array($type, Entry::VALID_TYPES, true)) {
            throw new \InvalidArgumentException(
                "Invalid entry type: {$type}. Must be one of: " . implode(', ', Entry::VALID_TYPES)
            );
        }

        if ($path === '') {
            throw new \InvalidArgumentException('Entry path must not be empty.');
        }

        if ($provider === '') {
            throw new \InvalidArgumentException('Entry provider must not be empty.');
        }

        if (!in_array($provider, Entry::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                "Invalid entry provider: {$provider}. Must be one of: " . implode(', ', Entry::VALID_PROVIDERS)
            );
        }

        $order = $this->nextOrder++;

        $entry = new Entry($name, $type, $path, $provider, $priority, $metadata, $order);

        // Ensure type bucket exists.
        if (!isset($this->store[$type])) {
            $this->store[$type] = [];
        }

        // Ensure name bucket exists under type.
        if (!isset($this->store[$type][$name])) {
            $this->store[$type][$name] = [];
        }

        // @phpstan-ignore-next-line — store declared as nested arrays; phpstan cannot infer nested generic types
        $this->store[$entry->type][$entry->name][$order] = $entry;

        return $this;
    }

    /** Register an existing Entry object into the store. */
    public function register(Entry $entry): self
    {
        // Re-validate to catch construction errors that bypass add() validation.
        if ($entry->name === '') {
            throw new \InvalidArgumentException('Entry name must not be empty.');
        }

        if (!in_array($entry->type, Entry::VALID_TYPES, true)) {
            throw new \InvalidArgumentException(
                "Invalid entry type: {$entry->type}. Must be one of: " . implode(', ', (static fn(): array => $entry::VALID_TYPES)())
            );
        }

        if ($entry->path === '') {
            throw new \InvalidArgumentException('Entry path must not be empty.');
        }

        if (!in_array($entry->provider, Entry::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                "Invalid entry provider: {$entry->provider}. Must be one of: " . implode(', ', (static fn(): array => $entry::VALID_PROVIDERS)())
            );
        }

        // Assign a fresh order so tie-breaking works correctly for registered entries.
        $order = $this->nextOrder++;

        // Entry is readonly — create a copy with the new order.
        $stored = new Entry(
            name:    $entry->name,
            type:    $entry->type,
            path:    $entry->path,
            provider:$entry->provider,
            priority:$entry->priority,
            metadata:$entry->metadata,
            order:   $order,
        );

        // Ensure type bucket exists.
        if (!isset($this->store[$stored->type])) {
            $this->store[$stored->type] = [];
        }

        // Ensure name bucket exists under type.
        if (!isset($this->store[$stored->type][$stored->name])) {
            $this->store[$stored->type][$stored->name] = [];
        }

        // @phpstan-ignore-next-line — store declared as nested arrays; phpstan cannot infer nested generic types
        $this->store[$stored->type][$stored->name][$order] = $stored;

        return $this;
    }

    /* ------------------------------------------------------------------ --/
     /  Resolution                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Resolve the single best Entry for ($name, $type).
     *
     * Returns null if no entries exist for the pair.
     *
     * Precedence rules:
     *   1. Highest priority (descending)
     *   2. Provider rank — app > theme > plugin > core (lower rank = better)
     *   3. Lowest order — earlier registration wins ties
     */
    public function resolve(string $name, string $type): ?Entry
    {
        if (!isset($this->store[$type][$name])) {
            return null;
        }

        // @phpstan-ignore-next-line — store declared as nested arrays; phpstan cannot infer nested generic types
        $entries = $this->store[$type][$name];
        if ($entries === []) {
            return null;
        }

        // Find the best entry by applying precedence rules.
        $best = null;
        $bestPriority = \PHP_INT_MIN;   // highest numeric wins
        $bestProviderRank = \PHP_INT_MAX;   // lowest rank wins
        $bestOrder = \PHP_INT_MAX;         // earliest registration wins

        foreach ($entries as $entry) {
            $providerRank = $entry->providerRank();

            if (
                $entry->priority > $bestPriority
                || (
                    $entry->priority === $bestPriority
                    && $providerRank < $bestProviderRank
                )
                || (
                    $entry->priority === $bestPriority
                    && $providerRank === $bestProviderRank
                    && $entry->order < $bestOrder
                )
            ) {
                $best             = $entry;
                $bestPriority     = $entry->priority;
                $bestProviderRank = $providerRank;
                $bestOrder        = $entry->order;
            }
        }

        return $best ?? null;
    }

    /* ------------------------------------------------------------------ --/
     /  Inspection                                                            */
    /* ------------------------------------------------------------------ */

    /** Check whether an entry for ($name, $type) exists. */
    public function has(string $name, string $type): bool
    {
        // @phpstan-ignore-next-line — store declared as nested arrays; phpstan cannot infer nested generic types
        return isset($this->store[$type][$name]) && $this->store[$type][$name] !== [];
    }

    /** Return all entries for a given type (indexed by name). */
    public function listByType(string $type): array
    {
        // @phpstan-ignore-next-line — store declared as nested arrays; phpstan cannot infer nested generic types
        return $this->store[$type] ?? [];
    }

    /** Return all entries for a given name across every type, ordered by insertion. */
    public function listByName(string $name): array
    {
        $result = [];
        foreach ($this->store as $entriesByType) {
            if (isset($entriesByType[$name])) {
                foreach ($entriesByType[$name] as $entry) {
                    $result[] = $entry;
                }
            }
        }

        // Sort by order to maintain insertion order across types.
        usort($result, static fn (Entry $a, Entry $b) => $a->order <=> $b->order);

        return $result;
    }

    /** Return the full store for inspection / debugging. */
    public function all(): array
    {
        // Flatten to a type -> name -> [Orderd entries] structure for readability.
        $result = [];
        foreach ($this->store as $type => $entriesByName) {
            foreach ($entriesByName as $name => $entriesByOrder) {
                usort($entriesByOrder, static fn (Entry $a, Entry $b) => $a->order <=> $b->order);
                $result[$type][$name] = array_values($entriesByOrder);
            }
        }

        return $result;
    }

    /** Clear all registered entries. */
    public function clear(): self
    {
        $this->store      = [];
        $this->nextOrder  = 0;

        return $this;
    }
}

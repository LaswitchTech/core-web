<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Asset;

/**
 * Store for CSS and JS asset registrations with precedence-based conflict resolution.
 *
 * Storage is a private collection keyed by (type, name). No ArrayObject inheritance.
 * Ordering: priority ↓ → order ↓ → registration order.
 *
 * Documentation: docs/development/architecture/Asset/Registry.md
 */
final class Registry
{
    /** @var array<string, array<string, Entry>>  [type][name] => Entry */
    private array $store = [];

    /** Monotonically increasing counter for tie-breaking. */
    private int $nextOrder = 0;

    /* ------------------------------------------------------------------ --/
     /  Public API                                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Register a CSS asset by name and path.
     *
     * @param string $name          Asset name (case-insensitive).
     * @param string $path          Absolute or relative file path.
     * @param string $provider      Source provider: app | theme | plugin | core.
     * @param int    $priority      Higher numeric wins conflicts.
     * @param array  $metadata      Arbitrary associative metadata.
     */
    public function css(string $name, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self
    {
        return $this->doAdd($name, $path, Entry::TYPE_CSS, $provider, $priority, $metadata);
    }

    /**
     * Register a JS asset by name and path.
     *
     * @param string $name          Asset name (case-insensitive).
     * @param string $path          Absolute or relative file path.
     * @param string $provider      Source provider: app | theme | plugin | core.
     * @param int    $priority      Higher numeric wins conflicts.
     * @param array  $metadata      Arbitrary associative metadata.
     */
    public function js(string $name, string $path, string $provider = Entry::PROVIDER_CORE, int $priority = 0, array $metadata = []): self
    {
        return $this->doAdd($name, $path, Entry::TYPE_JS, $provider, $priority, $metadata);
    }

    /**
     * Replace or remove the entry for (type, name). Unconditional — no precedence rules.
     *
     * - replace($type, $name) or replace($type, $name, null): remove, return previous Entry (or null).
     * - replace($type, $name, Entry $entry): unconditionally store replacement, return previous Entry (or null).
     *   The entry type must match the lookup $type.
     *
     * The replacement Entry is validated for matching type and copied with normalized type/name plus a fresh order number.
     *
     * @return Entry|null The previous entry, or null when none existed.
     */
    public function replace(string $type, string $name, ?Entry $entry = null): ?Entry
    {
        // Normalize lookup arguments — store keys are lowercased.
        $type   = strtolower(trim($type));
        $norm   = strtolower(trim($name));

        // Nothing to replace.
        if (!isset($this->store[$type]) || !isset($this->store[$type][$norm])) {
            return null;
        }

        // Snapshot and remove the old entry.
        $previous  = clone $this->store[$type][$norm];
        unset($this->store[$type][$norm]);

        if (empty($this->store[$type])) {
            unset($this->store[$type]);
        }

        // No replacement provided — remove is complete.
        if ($entry === null) {
            return $previous;
        }

        // The caller must not pass an incompatible type.
        $entryType = strtolower(trim($entry->type));
        if ($entryType !== $type) {
            throw new \InvalidArgumentException(
                "replace() mismatch: expected type '{$type}', got {$entry->type}."
            );
        }

        // Fresh order number and insert.
        $order  = $this->nextOrder++;

        // Ensure the type bucket exists.
        if (!isset($this->store[$type])) {
            $this->store[$type] = [];
        }

        $newEntry = new Entry(
            name:     $norm,
            path:     $entry->path,
            type:     $type,
            provider: $entry->provider,
            priority: $entry->priority,
            metadata: $entry->metadata ?? [],
            order:    $order,
        );

        $this->store[$type][$norm] = $newEntry;

        return $previous;
    }

    /**
     * Check whether an asset exists for (`$type`, `$name`).
     */
    public function has(string $type, string $name): bool
    {
        return isset($this->store[$type][strtolower(trim($name))]);
    }

    /**
     * Get a single entry by (type, name), or null.
     */
    public function get(string $type, string $name): ?Entry
    {
        return $this->store[$type][strtolower(trim($name))] ?? null;
    }

    /**
     * Return all CSS entries keyed by asset name.
     *
     * @return array<string, Entry>
     */
    public function allCss(): array
    {
        return $this->store[Entry::TYPE_CSS] ?? [];
    }

    /**
     * Return all JS entries keyed by asset name.
     *
     * @return array<string, Entry>
     */
    public function allJs(): array
    {
        return $this->store[Entry::TYPE_JS] ?? [];
    }

    /* ------------------------------------------------------------------ --/
      /  Ordered Retrieval                                                      */
    /* ------------------------------------------------------------------ */

    /**
     * Return all CSS entries sorted by priority → order → name (all ascending).
     *
     * @return Entry[]
     */
    public function orderedCss(): array
    {
        return $this->ordered(Entry::TYPE_CSS);
    }

    /**
     * Return all JS entries sorted by priority → order → name (all ascending).
     *
     * @return Entry[]
     */
    public function orderedJs(): array
    {
        return $this->ordered(Entry::TYPE_JS);
    }

    /* ------------------------------------------------------------------ --/
      /  Internal                                                             */
    /* ------------------------------------------------------------------ */

    /** Return sorted entry array for the given type, or empty array when none exist. */
    private function ordered(string $type): array
    {
        $entries = array_values($this->store[$type] ?? []);

        if ($entries === []) {
            return [];
        }

        usort($entries, fn (Entry $a, Entry $b): int => self::cmpEntry($a, $b));

        return $entries;
    }

    /** Shared comparator: priority ↑ → order ↑ → name ↑. */
    private static function cmpEntry(Entry $a, Entry $b): int
    {
        if ($a->priority !== $b->priority) {
            return $a->priority <=> $b->priority;
        }

        if ($a->order !== $b->order) {
            return $a->order <=> $b->order;
        }

        return $a->name <=> $b->name;
    }

    /** Register an existing Entry object with precedence enforcement. */
    public function register(Entry $entry): self
    {
        if (!in_array($entry->type, Entry::VALID_TYPES, true)) {
            throw new \InvalidArgumentException("Invalid asset type: {$entry->type}.");
        }

        if (!in_array($entry->provider, Entry::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException("Invalid provider: {$entry->provider}.");
        }

        $order  = $this->nextOrder++;
        $norm   = strtolower(trim($entry->name));

        // Create a copy with fresh order number so precedence works correctly.
        $newEntry = new Entry(
            name:    $norm,
            path:    $entry->path,
            type:    $entry->type,
            provider:$entry->provider,
            priority:$entry->priority,
            metadata:$entry->metadata,
            order:   $order,
        );

        // Ensure type bucket exists.
        if (!isset($this->store[$newEntry->type])) {
            $this->store[$newEntry->type] = [];
        }

        $existing = $this->store[$newEntry->type][$norm] ?? null;

        if ($existing !== null) {
            // Follow precedence: priority → provider rank → order.
            $newRank  = $newEntry->providerRank();
            $prevRank = $existing->providerRank();

            if ($newEntry->priority === $existing->priority) {
                // Same priority — compare provider rank (lower = better).
                if ($newRank > $prevRank) {
                    return $this; // Existing wins.
                }
                // Equal rank — existing was registered earlier, keep it.
                if ($newRank === $prevRank && $order >= $existing->order) {
                    return $this;
                }
            } elseif ($newEntry->priority < $existing->priority) {
                return $this; // Existing has higher priority.
            }
        }

        $this->store[$newEntry->type][$norm] = $newEntry;

        return $this;
    }

    /* ------------------------------------------------------------------ --/
     /  Internal                                                             */
    /* ------------------------------------------------------------------ */

    /** Internal: construct and insert an entry with precedence resolution. */
    private function doAdd(string $name, string $path, string $type, string $provider, int $priority, array $metadata): self
    {
        if (trim($name) === '') {
            throw new \InvalidArgumentException('Asset name must not be empty.');
        }

        if ($path === '') {
            throw new \InvalidArgumentException('Asset path must not be empty.');
        }

        $order  = $this->nextOrder++;
        $norm   = strtolower(trim($name));

        // Normalize provider to lowercase.
        $provider = strtolower($provider);
        if (!in_array($provider, Entry::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                "Invalid provider: {$provider}. Must be one of: " . implode(', ', Entry::VALID_PROVIDERS)
            );
        }

        $entry = new Entry($norm, $path, $type, $provider, $priority, $metadata, $order);

        // Ensure type bucket exists.
        if (!isset($this->store[$type])) {
            $this->store[$type] = [];
        }

        // If a name slot already exists under this type, check precedence.
        if (isset($this->store[$type][$norm])) {
            $prev = $this->store[$type][$norm];

            if ($priority === $prev->priority) {
                // Same priority — compare provider rank (lower = better).
                $newRank  = $entry->providerRank();
                $prevRank = $prev->providerRank();

                if ($newRank > $prevRank) {
                    return $this; // Existing wins.
                }

                // Equal rank — existing was registered earlier, keep it.
                if ($newRank === $prevRank && $order >= $prev->order) {
                    return $this;
                }
            } elseif ($priority < $prev->priority) {
                return $this; // Existing has higher priority.
            }
        }

        $this->store[$type][$norm] = $entry;

        return $this;
    }
}

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
    /** @var array<string, array<string, array<string, Entry>>> */
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
    public function css(
        string $scope,
        string $file,
        string $path,
        string $provider = Entry::PROVIDER_CORE,
        int $priority = 0,
        array $metadata = [],
    ): self
    {
        return $this->doAdd(
            $scope,
            $file,
            $path,
            Entry::TYPE_CSS,
            $provider,
            $priority,
            $metadata,
        );
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
    public function js(
        string $scope,
        string $file,
        string $path,
        string $provider = Entry::PROVIDER_CORE,
        int $priority = 0,
        array $metadata = [],
    ): self
    {
        return $this->doAdd(
            $scope,
            $file,
            $path,
            Entry::TYPE_JS,
            $provider,
            $priority,
            $metadata,
        );
    }

    /**
     * Replace or remove the entry for (`$type`, `$scope`, `$file`). Unconditional — no precedence rules.
     *
     * - replace($type, $scope, $file) or replace($type, $scope, $file, null): remove, return previous Entry (or null).
     * - replace($type, $scope, $file, Entry $entry): unconditionally store replacement, return previous Entry (or null).
     *   The entry type must match the lookup $type.
     *
     * The replacement Entry is validated for matching type and inserted with normalized scope/filename plus a fresh order number.
     *
     * @return Entry|null The previous entry, or null when none existed.
     */
    public function replace(string $type, string $scope, string $file, ?Entry $entry = null): ?Entry
    {
        // Normalize lookup arguments — store keys are lowercased.
        $tpe  = strtolower(trim($type));
        $scop = strtolower(trim($scope));
        $scop = trim($scop, '/');
        $fil  = trim($file);

        // Nothing to replace.
        if (!isset($this->store[$tpe][$scop]) || !isset($this->store[$tpe][$scop][$fil])) {
            return null;
        }

        // Snapshot and remove the old entry.
        $previous  = clone $this->store[$tpe][$scop][$fil];
        unset($this->store[$tpe][$scop][$fil]);

        if (empty($this->store[$tpe][$scop])) {
            unset($this->store[$tpe][$scop]);
        }

        // No replacement provided — remove is complete.
        if ($entry === null) {
            return $previous;
        }

        // The caller must not pass an incompatible type.
        $entryType = strtolower(trim($entry->type));
        if ($entryType !== $tpe) {
            throw new \InvalidArgumentException(
                "replace() mismatch: expected type '{$tpe}', got {$entry->type}."
            );
        }

        // Fresh order number and insert.
        $order  = $this->nextOrder++;

        // Ensure the type + scope bucket exists.
        if (!isset($this->store[$tpe][$scop])) {
            $this->store[$tpe][$scop] = [];
        }

        $newEntry = new Entry(
            $scop,
            $fil,
            $entry->path,
            $tpe,
            $entry->provider,
            $entry->priority,
            $entry->metadata ?? [],
            $order,
        );

        $this->store[$tpe][$scop][$fil] = $newEntry;

        return $previous;
    }

    /**
     * Check whether an asset exists for (`$type`, `$scope`, `$file`).
     */
    public function has(string $type, string $scope, string $file): bool
    {
        $type  = strtolower(trim($type));
        $scope = strtolower(trim($scope));
        $scope = trim($scope, '/');
        $file  = trim($file);

        return isset($this->store[$type][$scope][$file]);
    }

    /**
     * Get a single entry by (`$type`, `$scope`, `$file`), or null.
     */
    public function get(string $type, string $scope, string $file): ?Entry
    {
        $type  = strtolower(trim($type));
        $scope = strtolower(trim($scope));
        $scope = trim($scope, '/');
        $file  = trim($file);

        return $this->store[$type][$scope][$file] ?? null;
    }

    /**
     * Return all CSS entries as a flat list.
     *
     * @return Entry[]
     */
    public function allCss(): array
    {
        return $this->flatten(Entry::TYPE_CSS);
    }

    /**
     * Return all JS entries as a flat list.
     *
     * @return Entry[]
     */
    public function allJs(): array
    {
        return $this->flatten(Entry::TYPE_JS);
    }

    /**
     * Return all entries matching an exact type and scope.
     *
     * @return Entry[]
     */
    public function getScope(string $type, string $scope): array
    {
        $tpe   = strtolower(trim($type));
        $scop  = strtolower(trim($scope));
        $scop  = trim($scop, '/');

        return $this->store[$tpe][$scop] ?? [];
    }

    /**
     * Return the explicitly marked default entry for a given type and scope, or null.
     *
     * An entry is considered the default only when its metadata satisfies:
     * (`$entry[metadata]['default']` ?? false) === true.
     *
     * - Exactly one explicit default  → return it.
     * - Zero or more than one         → return null (no inference).
     */
    public function getDefault(string $type, string $scope): ?Entry
    {
        $tpe   = strtolower(trim($type));
        $scop  = strtolower(trim($scope));
        $scop  = trim($scop, '/');

        $defaults = [];

        foreach ($this->store[$tpe][$scop] ?? [] as $entry) {
            if (($entry->metadata['default'] ?? false) === true) {
                $defaults[] = $entry;
            }
        }

        return match (count($defaults)) {
            1 => $defaults[0],
            default => null,
        };
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

    /**
     * Flatten all entries for one asset type.
     *
     * @return Entry[]
     */
    private function flatten(string $type): array
    {
        $entries = [];

        foreach ($this->store[$type] ?? [] as $scopeEntries) {
            foreach ($scopeEntries as $entry) {
                if ($entry instanceof Entry) {
                    $entries[] = $entry;
                }
            }
        }

        return $entries;
    }

    /** Return sorted entry array for the given type, or empty array when none exist. */
    private function ordered(string $type): array
    {
        $entries = $this->flatten($type);

        if ($entries === []) {
            return [];
        }

        usort($entries, fn (Entry $a, Entry $b): int => self::cmpEntry($a, $b));

        return $entries;
    }

    /**
     * Shared comparator: priority ↑ → order ↑ → scope ↑ → file ↑.
     */
    private static function cmpEntry(Entry $a, Entry $b): int
    {
        if ($a->priority !== $b->priority) {
            return $a->priority <=> $b->priority;
        }

        if ($a->order !== $b->order) {
            return $a->order <=> $b->order;
        }

        if ($a->scope !== $b->scope) {
            return $a->scope <=> $b->scope;
        }

        return $a->file <=> $b->file;
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

        // Create a copy with fresh order number so precedence works correctly.
        $newEntry = new Entry(
            scope:  $entry->scope,
            file:   $entry->file,
            path:   $entry->path,
            type:   $entry->type,
            provider: $entry->provider,
            priority: $entry->priority,
            metadata: $entry->metadata,
            order:  $order,
        );

        // Ensure type bucket exists.
        if (!isset($this->store[$newEntry->type])) {
            $this->store[$newEntry->type] = [];
        }

        if (!isset($this->store[$newEntry->type][$newEntry->scope])) {
            $this->store[$newEntry->type][$newEntry->scope] = [];
        }

        $existing = $this->store[$newEntry->type][$newEntry->scope][$newEntry->file] ?? null;

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

        $this->store[$newEntry->type][$newEntry->scope][$newEntry->file] = $newEntry;

        return $this;
    }

    /* ------------------------------------------------------------------ --/
     /  Internal                                                             */
    /* ------------------------------------------------------------------ */

    /** Internal: construct and insert an entry with precedence resolution. */
    private function doAdd(
        string $scope,
        string $file,
        string $path,
        string $type,
        string $provider,
        int $priority,
        array $metadata,
    ): self
    {


        if ($path === '') {
            throw new \InvalidArgumentException('Asset path must not be empty.');
        }

        $order = $this->nextOrder++;

        // Normalize provider to lowercase.
        $provider = strtolower($provider);

        if (!in_array($provider, Entry::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                "Invalid provider: {$provider}. Must be one of: " . implode(', ', Entry::VALID_PROVIDERS)
            );
        }

        $entry = new Entry(
            scope: $scope,
            file: $file,
            path: $path,
            type: $type,
            provider: $provider,
            priority: $priority,
            metadata: $metadata,
            order: $order,
        );

        // Ensure type + scope buckets exist.
        if (!isset($this->store[$type])) {
            $this->store[$type] = [];
        }

        if (!isset($this->store[$type][$entry->scope])) {
            $this->store[$type][$entry->scope] = [];
        }

        // If an extension already exists under this scope, check precedence.
        if (isset($this->store[$type][$entry->scope][$entry->file])) {
            $prev = $this->store[$type][$entry->scope][$entry->file];
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

        $this->store[$type][$entry->scope][$entry->file] = $entry;

        return $this;
    }
}

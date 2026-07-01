<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

/**
 * Resolves, deduplicates, and stores helper registry entries by normalized name.
 */
final class Registry
{
    private const PROVIDER_PRECEDENCE = [
        'app' => 3,
        'plugin' => 2,
        'core' => 1,
    ];

    /** @var array<string, Entry> */
    private array $entries = [];

    /**
     * Register or update a helper in the registry using the resolution rules.
     *
     * Resolution (when another helper already claims this name):
     *   1. Higher priority wins.
     *   2. On tie, provider precedence wins: app > plugin > core.
     *   3. On further tie, later registration wins.
     */
    public function register(HelperInterface $helper, string $provider = 'core', int $priority = 0, array $metadata = []): void
    {
        $name = strtolower(trim($helper->name()));

        // Construct before conflict checks so invalid providers always throw immediately.
        $newEntry = new Entry($helper->name(), $helper, $provider, $priority, $metadata);

        if (isset($this->entries[$name])) {
            $existing = $this->entries[$name];

            if ($priority === $existing->priority) {
                $prevPrec   = self::PROVIDER_PRECEDENCE[$existing->provider] ?? 0;
                $newPrec    = self::PROVIDER_PRECEDENCE[$provider] ?? 0;

                // Existing provider is strictly better — keep it.
                if ($newPrec < $prevPrec) {
                    return;
                }

                // Higher new provider or equal tie-break (later registration wins): proceed to overwrite.
            } elseif ($priority > $existing->priority) {
                // New priority is superior: proceed to overwrite.
            } else {
                // Existing priority is better — keep it.
                return;
            }
        }

        $this->entries[$name] = $newEntry;
    }

    /**
     * Check if a helper exists under the given name.
     */
    public function has(string $name): bool
    {
        return isset($this->entries[strtolower(trim($name))]);
    }

    /**
     * Resolve the helper object by name, or null when not found.
     */
    public function get(string $name): ?HelperInterface
    {
        $entry = $this->entries[strtolower(trim($name))] ?? null;

        return $entry?->helper;
    }

    /**
     * Resolve the Entry metadata object by name, or null when not found.
     */
    public function entry(string $name): ?Entry
    {
        return $this->entries[strtolower(trim($name))] ?? null;
    }

    /**
     * Return all registered helpers keyed by their canonical (lowercase) name.
     *
     * @return array<string, HelperInterface>
     */
    public function all(): array
    {
        $result = [];

        foreach ($this->entries as $name => $entry) {
            $result[$name] = $entry->helper;
        }

        return $result;
    }

    /**
     * Return all registry entries keyed by their canonical (lowercase) name.
     *
     * @return array<string, Entry>
     */
    public function entries(): array
    {
        return $this->entries;
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration\Settings;

final class Registry
{
    /** @var array<string, list<Entry>> */
    private array $entries = [];

    private int $nextOrder = 0;

    public function register(Entry $entry): self
    {
        $entry = $entry->withOrder($this->nextOrder++);

        $this->entries[$entry->key()] ??= [];
        $this->entries[$entry->key()][] = $entry;

        return $this;
    }

    public function has(string $key): bool
    {
        return isset($this->entries[$key])
            && $this->entries[$key] !== [];
    }

    public function resolve(string $key): ?Entry
    {
        if (!$this->has($key)) {
            return null;
        }

        $entries = $this->entries[$key];

        usort($entries, $this->compare(...));

        return $entries[0] ?? null;
    }

    /** @return list<Entry> */
    public function resolved(): array
    {
        $resolved = [];

        foreach (array_keys($this->entries) as $key) {
            $entry = $this->resolve($key);

            if ($entry !== null) {
                $resolved[] = $entry;
            }
        }

        usort($resolved, $this->compareNavigation(...));

        return $resolved;
    }

    /** @return list<array<string, mixed>> */
    public function export(): array
    {
        return array_map(
            static fn (Entry $entry): array => $entry->toArray(),
            $this->resolved(),
        );
    }

    /** @return array<string, list<array<string, mixed>>> */
    public function exportByCategory(): array
    {
        $grouped = [];

        foreach ($this->resolved() as $entry) {
            $category = $entry->category();
            $grouped[$category][] = $entry->toArray();
        }

        return $grouped;
    }

    private function providerRank(string $provider): int
    {
        return match ($provider) {
            Entry::PROVIDER_APPLICATION => 0,
            Entry::PROVIDER_PLUGIN => 1,
            Entry::PROVIDER_KERNEL => 2,
            default => 3,
        };
    }

    private function compare(Entry $a, Entry $b): int
    {
        if ($a->priority() !== $b->priority()) {
            return $b->priority() <=> $a->priority();
        }

        $providerComparison = $this->providerRank($a->provider())
            <=> $this->providerRank($b->provider());

        if ($providerComparison !== 0) {
            return $providerComparison;
        }

        return $a->order() <=> $b->order();
    }

    private function compareNavigation(Entry $a, Entry $b): int
    {
        if ($a->category() !== $b->category()) {
            return $a->category() <=> $b->category();
        }

        if ($a->priority() !== $b->priority()) {
            return $b->priority() <=> $a->priority();
        }

        return $a->order() <=> $b->order();
    }
}

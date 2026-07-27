<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration\Overview;

final class Registry
{
    /** @var array<string, list<Entry>> */
    private array $entries = [];

    private int $nextOrder = 0;

    public function register(Entry $entry): self
    {
        $entry = $entry->withOrder($this->nextOrder++);

        $this->entries[$entry->id()] ??= [];
        $this->entries[$entry->id()][] = $entry;

        return $this;
    }

    public function has(string $id): bool
    {
        return isset($this->entries[$id])
            && $this->entries[$id] !== [];
    }

    public function resolve(string $id): ?Entry
    {
        if (!$this->has($id)) {
            return null;
        }

        $entries = $this->entries[$id];

        usort($entries, $this->compare(...));

        return $entries[0] ?? null;
    }

    /** @return list<Entry> */
    public function resolved(): array
    {
        $resolved = [];

        foreach (array_keys($this->entries) as $id) {
            $entry = $this->resolve($id);

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

    private function providerRank(string $provider): int
    {
        return match ($provider) {
            Entry::PROVIDER_APPLICATION => 0,
            Entry::PROVIDER_PLUGIN => 1,
            Entry::PROVIDER_KERNEL => 2,
            default => 3,
        };
    }

    private function compare(Entry $a, Entry $b):int
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
        if ($a->priority() !== $b->priority()) {
            return $b->priority() <=> $a->priority();
        }

        return $a->order() <=> $b->order();
    }
}

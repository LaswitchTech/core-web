<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Seeding;

/**
 * Discovers SQL seed files from core framework and application seed directories,
 * grouped by group directory name (e.g. "default", "install", "demo").
 *
 * App seeds override core seeds when they share the same filename in the same group.
 * Discovery is deterministic, dialect-aware, and silently skips malformed filenames.
 *
 * Documentation: docs/development/architecture/Database/Seeding/SeedLoader.md
 */
final class SeedLoader {

    /**
     * @param string $coreRoot Base path to the core-web framework root directory.
     * @param string $appRoot  Base path to the application root directory.
     */
    public function __construct(
        private readonly string $coreRoot,
        private readonly string $appRoot,
    ) {}

    /* ------------------------------------------------------------------ */
    /*  Public API                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Discover all seed files in a specific group across core and app paths.
     *
     * Discovery order:
     *   1. version ascending
     *   2. source priority (core before app) — unless the same filename exists in app (override)
     *   3. path ascending as final tie-breaker
     *
     * Missing seed directories are non-fatal and yield no seeds for that directory.
     * Malformed filenames produce a STDERR warning and are silently skipped.
     *
     * @param string $group Group directory name (e.g. "default", "install", "demo").
     * @return list<Seed> Discovered and deduplicated seed objects.
     */
    public function load(string $group = 'default'): array {
        // 1. Discover core seeds for the group.
        $corePath = "{$this->coreRoot}/seeds/{$group}";
        $coreSeeds = $this->discoverFromDirectory($corePath, Seed::SOURCE_CORE);

        // 2. Discover app seeds for the group.
        $appPath = "{$this->appRoot}/seeds/{$group}";
        $appSeeds = $this->discoverFromDirectory($appPath, Seed::SOURCE_APP);

        // 3. Build the app override set: group+filename keys that should replace core seeds.
        $overrideKeys = [];
        foreach ($appSeeds as $seed) {
            $overrideKeys[$seed->overrideKey()] = true;
        }

        // 4. Start with core seeds, removing any overridden by app (group+filename must match).
        $result = [];
        foreach ($coreSeeds as $seed) {
            if (!isset($overrideKeys[$seed->overrideKey()])) {
                $result[] = $seed;
            }
        }

        // 5. Append all app seeds (they may not have a core counterpart).
        foreach ($appSeeds as $seed) {
            $result[] = $seed;
        }

        // 6. Sort deterministically: version asc → source priority (core before app) → path asc.
        $this->sortSeeds($result);

        return $result;
    }

    /** All recognized groups across both paths (union of discovered group directories). */
    public function allGroups(): array {
        $groups = [];

        foreach (
            [
                "{$this->coreRoot}/seeds"   => Seed::SOURCE_CORE,
                "{$this->appRoot}/seeds"    => Seed::SOURCE_APP,
            ] as $seedParentPath => $_source
        ) {
            if (!is_dir($seedParentPath)) {
                continue;
            }

            foreach (scandir($seedParentPath) ?: [] as $group) {
                if ($group === '.' || $group === '..' || !is_dir("{$seedParentPath}/{$group}")) {
                    continue;
                }
                $groups[$group] = true;
            }
        }

        ksort($groups);

        return array_keys($groups);
    }

    /* ------------------------------------------------------------------ */
    /*  Discovery                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Scan a single directory for valid seed files, skipping malformed filenames.
     *
     * @param string $directory Absolute path to the seeds group directory (e.g. seeds/default/).
     * @return list<Seed> Valid discovered seeds. Missing directory returns empty array.
     */
    private function discoverFromDirectory(string $directory, string $source): array {
        if (!is_dir($directory)) {
            return [];
        }

        $seeds = [];
        $files = glob("{$directory}/*.sql");

        if ($files === false || empty($files)) {
            return [];
        }

        // Sort by path for deterministic traversal order.
        sort($files);

        foreach ($files as $seedFilePath) {
            try {
                $group = basename(dirname($seedFilePath));

                $seeds[] = Seed::fromFile($seedFilePath, $group, $source);
            } catch (\Throwable $e) {
                // Tolerant skip on any error (malformed filename, invalid date, unreadable file).
                fwrite(STDERR, "[seeds] Skip {$seedFilePath}: " . $e->getMessage() . "\n");
            }
        }

        return $seeds;
    }

    /* ------------------------------------------------------------------ */
    /*  Sorting                                                            */
    /* ------------------------------------------------------------------ */

    /** Sort seeds deterministically: version asc, source priority (core before app), path asc. */
    private static function sortSeeds(array &$seeds): void {
        if (empty($seeds)) {
            return;
        }

        uasort(
            $seeds,
            /** @param Seed $a */
            /** @param Seed $b */
            static function (Seed $a, Seed $b): int {
                // 1. Version ascending (timestamp comparison).
                if ($a->version > $b->version) {
                    return 1;
                }
                if ($a->version < $b->version) {
                    return -1;
                }

                // 2. Source priority: core before app when versions match.
                if ($a->isFromCore() && !$b->isFromCore()) {
                    return -1;
                }
                if (!$a->isFromCore() && $b->isFromCore()) {
                    return 1;
                }

                // 3. Path ascending as final tie-breaker.
                if ($a->path < $b->path) {
                    return -1;
                }
                if ($a->path > $b->path) {
                    return 1;
                }

                return 0;
            },
        );
    }
}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration\Promoter;

use Laswitchtech\CoreWeb\Migration\Migration;

/**
 * Discovers core framework migrations from a given directory path.
 *
 * Priority: 0 (highest — executed first).
 *
 * Documentation: docs/development/architecture/Migration/Promoter/CorePromoter.md
 */
final class CorePromoter implements MigrationPromoterInterface {

    public const PRIORITY = 0;

    public function __construct(
        private readonly string $directory, // path to the core migrations directory
    ) {}

    public function priority(): int {
        return self::PRIORITY;
    }

    public function migrationDirectory(): string {
        return $this->directory;
    }

    /**
     * @return list<Migration>
     */
    public function discover(): array {
        if (!is_dir($this->directory)) {
            return [];
        }

        return static::scanForMigrations($this->directory, self::PRIORITY);
    }

    private static function scanForMigrations(string $directory, int $priority): array {
        $files = glob("{$directory}/*.sql");
        $migrations = [];

        if ($files === false || empty($files)) {
            return [];
        }

        // Sort by version to ensure deterministic ordering within this promoter.
        sort($files);

        foreach ($files as $file) {
            try {
                $filename = basename($file);

                // Exclude dialect companion files — they are resolved only by SqlMigrationDriver,
                // never discovered as standalone migrations.
                if (preg_match('/\.(sqlite|mysql|mariadb)\.sql$/', $filename)) {
                    continue;
                }

                $migration = Migration::fromFile($file, $priority);
                if ($migration !== null) {
                    $migrations[] = $migration;
                }
            } catch (\Throwable $e) {
                // Invalid filename or unreadable file — log to STDERR and skip.
                fwrite(STDERR, "[core-migrations] Skip {$file}: " . $e->getMessage() . "\n");
            }
        }

        return $migrations;
    }
}

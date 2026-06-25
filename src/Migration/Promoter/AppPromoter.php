<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration\Promoter;

use Laswitchtech\CoreWeb\Migration\Migration;

/**
 * Discovers application-level migrations from a given directory path.
 *
 * Priority: 1 (core runs first, app runs second).
 *
 * Documentation: docs/development/architecture/Migration/Promoter/AppPromoter.md
 */
final class AppPromoter implements MigrationPromoterInterface {

    public const PRIORITY = 1;

    public function __construct(
        private readonly string $directory, // path to the application migrations directory
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
                fwrite(STDERR, "[app-migrations] Skip {$file}: " . $e->getMessage() . "\n");
            }
        }

        return $migrations;
    }
}

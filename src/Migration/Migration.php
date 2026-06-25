<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Migration;

/**
 * Immutable value object representing a single migration in the system.
 *
 * Documentation: docs/development/architecture/Migration/Migration.md
 */
final class Migration {

    /**
     * Create a new migration from a raw SQL file on disk.
     *
     * Parses .sql files to extract:
     *   - version and slug extracted from the filename pattern YYYYMMDDHHmmss_slug.sql.
     *   - checksum  via hash_file('sha256', ...) for tamper detection.
     *   - up / down section content split at the "-- Down:" marker line.
     *
     * For migrations with dialect-specific companion files (e.g. suffix ".mysql"), those
     * companions are stored separately and applied by SqlMigrationDriver during execution.
     */
    public static function fromFile(string $filePath, int $priority = 0): self {
        $filename   = basename($filePath);
        $baseName   = (string) preg_replace('/\.(?:sqlite|mysql|mariadb)\.sql$/i', '', $filename);

        // Extract version + slug; version = leading timestamp digits, rest is slug.
        if (!preg_match('/^(\d{14})_(.+)$/', $baseName, $matches)) {
            throw new \InvalidArgumentException(
                "Migration filename must match pattern YYYYMMDDHHmmss_slug.sql: {$filePath}"
            );
        }

        $version = (string) $matches[1];
        $slug    = $matches[2];

        // Validate that $version is a real calendar date (rejects dates like 20261399999959).
        $parsed = \DateTimeImmutable::createFromFormat('YmdHis', $version);
        if ($parsed === false || $parsed->format('YmdHis') !== $version) {
            throw new \InvalidArgumentException(
                "Migration version '{$version}' is not a valid timestamp: {$filePath}"
            );
        }

        $checksum = hash_file('sha256', $filePath);
        if ($checksum === false) {
            throw new \InvalidArgumentException("Cannot read file for checksum: {$filePath}");
        }

        // Read content and split at "-- Down:" marker.
        $contents = file_get_contents($filePath);
        if ($contents === false) {
            throw new \InvalidArgumentException("Cannot read migration file: {$filePath}");
        }

        [$up, $down] = self::splitSections($contents);

        return new self(
            version: $version,
            slug:    $slug,
            file:    $filePath,
            checksum: $checksum,
            content: $contents,
            up:      $up,
            down:    $down,
            priority: $priority,
        );
    }

    /**
     * Split SQL content at the "-- Down:" marker line.
     *
     * Returns [upSql, downSql] where downSql contains ONLY the SQL that follows
     * "-- Down:" (never includes up or the marker itself).
     */
    private static function splitSections(string $content): array {
        $lines = preg_split('/\r?\n/', $content);
        $markerIndex = null;

        foreach ($lines as $i => $line) {
            // Match "-- Down:" at the start of a line (possibly preceded by whitespace).
            if (preg_match('/^\s*--\s+Down\s*:/i', $line)) {
                $markerIndex = $i;
                break;
            }
        }

        if ($markerIndex === null) {
            return [$content, ''];
        }

        // Everything before the marker is up (trim trailing blank lines).
        $upContent = trim(implode("\n", array_slice($lines, 0, $markerIndex)));
        // Down is ONLY content after the marker — nothing more.
        $downContent = trim(implode("\n", array_slice($lines, $markerIndex + 1)));

        return [$upContent, $downContent];
    }

    /* ------------------------------------------------------------------ */
    /*  Immutable data                                                     */
    /* ------------------------------------------------------------------ */

    public function __construct(
        /** Migration version — sortable timestamp identifier (e.g. "20260625120000"). */
        public readonly string $version,

        /** Human-readable description derived from filename. */
        public readonly string $slug,

        /** Absolute path to the migration SQL file. */
        public readonly string $file,

        /** SHA-256 hex digest of the full file content. */
        public readonly string $checksum,

        /** Full SQL content including "-- Down:" marker for introspection. */
        public readonly string $content,

        /** Up-section SQL (everything before the "-- Down:" marker). */
        public readonly string $up,

        /** Down-section SQL (after the "-- Down:" marker) or '' if absent. */
        public readonly string $down,

        /** Discovery priority — lower number = higher priority in ordering. */
        public readonly int $priority,
    ) {}

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /** Check if this migration has a down section available for rollback. */
    public function hasDown(): bool {
        return $this->down !== '';
    }

    /** Check if this migration is applicable to a given driver. */
    public function supportsDriver(string $driver): bool {
        // Always supports generic SQL. Dialect-specific companions are handled by the driver.
        return true;
    }
}

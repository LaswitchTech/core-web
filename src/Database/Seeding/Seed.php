<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Seeding;

/**
 * Immutable value object representing a single SQL seed file in the seeding system.
 *
 * Documentation: docs/development/architecture/Database/Seeding/Seed.md
 */
final class Seed {

    /** Identifies that the seed file lives under the core framework's seeds/ directory. */
    public const SOURCE_CORE = 'core';

    /** Identifies that the seed file lives under the application's seeds/ directory. */
    public const SOURCE_APP  = 'app';

    /** Allowed source values. */
    private const ALLOWED_SOURCES = [self::SOURCE_CORE, self::SOURCE_APP];

    /* ------------------------------------------------------------------ */
    /*  Factory                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Create a new Seed from a raw SQL seed file on disk.
     *
     * @param string $filePath Absolute path to the seed file.
     * @param string $group Discovery group directory name.
     * @param string $source Source identifier: 'core' or 'app'. Defaults to core for backward compatibility.
     */
    public static function fromFile(string $filePath, string $group, string $source = self::SOURCE_CORE): self {
        $filename   = basename($filePath);

        // Extract version + name from pattern YYYYMMDDHHmmss_slug.sql
        if (!preg_match('/^(\d{14})_(.+)\.sql$/i', $filename, $matches)) {
            throw new \InvalidArgumentException(
                "Seed filename must match pattern YYYYMMDDHHmmss_slug.sql: {$filePath}"
            );
        }

        $version = (string) $matches[1];
        $name    = (string) $matches[2];

        // Validate that $version is a real calendar date (rejects invalid dates like 20261399999959).
        $parsed = \DateTimeImmutable::createFromFormat('YmdHis', $version);
        if ($parsed === false || $parsed->format('YmdHis') !== $version) {
            throw new \InvalidArgumentException(
                "Seed version '{$version}' is not a valid timestamp: {$filePath}"
            );
        }

        $checksum   = hash_file('sha256', $filePath);

        if ($checksum === false) {
            throw new \InvalidArgumentException("Cannot compute checksum of seed file: {$filePath}");
        }

        return new self(
            version:   $version,
            name:      $name,
            group:     $group,
            path:      realpath($filePath) ?: $filePath,
            checksum:  $checksum,
            source:    $source,
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Immutable data                                                     */
    /* ------------------------------------------------------------------ */

    public function __construct(
        /** Sortable version identifier derived from the seed filename timestamp prefix. */
        public readonly string $version,

        /** Human-readable name derived from the seed filename slug (lowercase, hyphen-separated). */
        public readonly string $name,

        /** Discovery group directory name (e.g. "default", "install", "demo", "testing"). */
        public readonly string $group,

        /** Absolute filesystem path to the seed SQL file. */
        public readonly string $path,

        /** SHA-256 hex digest of the full file content for tamper detection. */
        public readonly string $checksum,

        /** Source — either `Seed::SOURCE_CORE` or `Seed::SOURCE_APP`. */
        public readonly string $source,
    ) {
        if ($version === '') {
            throw new \InvalidArgumentException('Seed version must be non-empty.');
        }
        if ($name === '') {
            throw new \InvalidArgumentException('Seed name must be non-empty.');
        }
        if ($group === '') {
            throw new \InvalidArgumentException('Seed group must be non-empty.');
        }
        if ($path === '') {
            throw new \InvalidArgumentException('Seed path must be non-empty.');
        }
        if ($checksum === '') {
            throw new \InvalidArgumentException('Seed checksum must be non-empty.');
        }
        if (!in_array($source, self::ALLOWED_SOURCES, true)) {
            throw new \InvalidArgumentException(
                "Seed source must be one of: '" . self::SOURCE_CORE . "', '" . self::SOURCE_APP
                    . "'. Got: '{$source}'."
            );
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /** Shortcut test for a core-origin seed. */
    public function isFromCore(): bool {
        return $this->source === self::SOURCE_CORE;
    }

    /** Shortcut test for an app-origin seed. */
    public function isFromApp(): bool {
        return $this->source === self::SOURCE_APP;
    }

    /** Return a human-readable unique key: "group/slug". */
    public function id(): string {
        return "{$this->group}/{$this->name}";
    }

    /** Reconstruct the original seed filename (e.g. "202606250001_seed_name.sql"). */
    public function filename(): string {
        return "{$this->version}_{$this->name}.sql";
    }

    /** Group-aware override identity key: "{$group}/{$filename}". */
    public function overrideKey(): string {
        return "{$this->group}/{$this->filename()}";
    }
}

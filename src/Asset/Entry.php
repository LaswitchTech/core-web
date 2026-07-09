<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Asset;

/**
 * Immutable value object for a single asset registration.
 *
 * Documentation: docs/development/architecture/Asset/Entry.md
 */
final readonly class Entry
{
    public const TYPE_CSS = 'css';
    public const TYPE_JS  = 'js';

    public const VALID_TYPES = [self::TYPE_CSS, self::TYPE_JS];

    public const PROVIDER_APP     = 'app';
    public const PROVIDER_THEME   = 'theme';
    public const PROVIDER_PLUGIN  = 'plugin';
    public const PROVIDER_CORE    = 'core';

    public const VALID_PROVIDERS = [self::PROVIDER_APP, self::PROVIDER_THEME, self::PROVIDER_PLUGIN, self::PROVIDER_CORE];

    /** Rank used for precedence resolution. Lower rank = higher priority. */
    private const PROVIDER_RANK = [
        self::PROVIDER_APP     => 0,
        self::PROVIDER_THEME   => 1,
        self::PROVIDER_PLUGIN  => 2,
        self::PROVIDER_CORE    => 3,
    ];

    public function __construct(
        /** Asset name (normalized to lowercase in constructor). Non-empty. */
        public string $name,
        /** Absolute or relative file path of the asset. Non-empty. */
        public string $path,
        /** Either 'css' or 'js'. Validated in constructor. */
        public string $type,
        /** Source provider: app | theme | plugin | core. */
        public string $provider = self::PROVIDER_CORE,
        /** Integer priority — higher numeric wins conflicts. */
        public int    $priority = 0,
        /** Arbitrary associative metadata (no schema). */
        public array  $metadata = [],
        /** Registration order assigned by the registry at insert time. Monotonically increasing integer. */
        public int    $order = 0,
    ) {
        if (!in_array($type, self::VALID_TYPES, true)) {
            throw new \InvalidArgumentException(
                "Invalid asset type: {$type}. Must be one of: " . implode(', ', self::VALID_TYPES)
            );
        }

        if (!in_array($provider, self::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                "Invalid provider: {$provider}. Must be one of: " . implode(', ', self::VALID_PROVIDERS)
            );
        }

        // Normalize name to lowercase for case-insensitive lookups.
        $this->name = strtolower(trim($name));
    }

    /** Provider precedence rank (lower = higher priority). */
    public function providerRank(): int
    {
        return self::PROVIDER_RANK[$this->provider] ?? \PHP_INT_MAX;
    }
}

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

    public readonly string $scope;
    public readonly string $file;
    public readonly string $path;
    public readonly string $type;
    public readonly string $provider;
    public readonly int $priority;
    public readonly array $metadata;
    public readonly int $order;

    public function __construct(
        string $scope,
        string $file,
        string $path,
        string $type,
        string $provider = self::PROVIDER_CORE,
        int $priority = 0,
        array $metadata = [],
        int $order = 0,
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

        $normalizedScope = strtolower(trim($scope));
        $normalizedScope = trim($normalizedScope, '/');

        if ($normalizedScope === '') {
            throw new \InvalidArgumentException('Asset scope must not be empty.');
        }

        if (str_contains($normalizedScope, '\\')) {
            throw new \InvalidArgumentException('Asset scope must not contain backslashes.');
        }

        $isRootScope = $normalizedScope === 'kernel'
            || $normalizedScope === 'app';

        $scopeParts = explode('/', $normalizedScope);

        if (!$isRootScope && count($scopeParts) !== 2) {
            throw new \InvalidArgumentException(
                'Extension asset scope must contain exactly two segments.'
            );
        }

        if (
            !$isRootScope
            && !in_array($scopeParts[0], ['themes', 'plugins'], true)
        ) {
            throw new \InvalidArgumentException(
                'Extension asset scope must begin with "themes" or "plugins".'
            );
        }

        if (
            !$isRootScope
            && preg_match('/^[a-z0-9][a-z0-9_-]*$/', $scopeParts[1]) !== 1
        ) {
            throw new \InvalidArgumentException(
                'Extension asset scope contains an invalid extension name.'
            );
        }

        $normalizedFile = trim($file);

        if ($normalizedFile === '') {
            throw new \InvalidArgumentException('Asset filename must not be empty.');
        }

        if (str_contains($normalizedFile, "\0")) {
            throw new \InvalidArgumentException(
                'Asset filename must not contain null bytes.'
            );
        }

        if (str_contains($normalizedFile, '\\')) {
            throw new \InvalidArgumentException(
                'Asset filename must be a leaf filename.'
            );
        }

        if (str_starts_with($normalizedFile, '/')) {
            throw new \InvalidArgumentException(
                'Asset filename must be a leaf filename.'
            );
        }

        if (str_ends_with($normalizedFile, '/')) {
            throw new \InvalidArgumentException(
                'Asset filename must be a leaf filename.'
            );
        }

        foreach (explode('/', $normalizedFile) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new \InvalidArgumentException(
                    'Asset filename must be a leaf filename.'
                );
            }
        }

        if ($path === '') {
            throw new \InvalidArgumentException('Asset path must not be empty.');
        }

        $this->scope = $normalizedScope;
        $this->file  = $normalizedFile;
        $this->path     = $path;
        $this->type     = $type;
        $this->provider = $provider;
        $this->priority = $priority;
        $this->metadata = $metadata;
        $this->order    = $order;
    }

    /** Provider precedence rank (lower = higher priority). */
    public function providerRank(): int
    {
        return self::PROVIDER_RANK[$this->provider] ?? \PHP_INT_MAX;
    }
}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Renderer\Resource;

/**
 * Immutable value object for renderer resources (layout, template, view).
 *
 * Documentation: docs/development/architecture/Renderer/Resource/Entry.md
 */
final readonly class Entry
{
    public const TYPE_LAYOUT = 'layout';
    public const TYPE_TEMPLATE = 'template';
    public const TYPE_VIEW   = 'view';

    public const VALID_TYPES = [self::TYPE_LAYOUT, self::TYPE_TEMPLATE, self::TYPE_VIEW];

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
        public string $name,
        public string $type,
        public string $path,
        public string $provider = self::PROVIDER_CORE,
        public int  $priority = 0,
        public array $metadata = [],
        public int  $order = 0,
    ) {}

    /** Provider precedence rank (lower = higher priority). */
    public function providerRank(): int
    {
        return self::PROVIDER_RANK[$this->provider] ?? \PHP_INT_MAX;
    }

    /** Whether this entry's type matches $type. */
    public function isType(string $type): bool
    {
        return $this->type === $type;
    }

    /** Return a shallow copy with $name updated. */
    public function withName(string $name): self
    {
        return new self($name, $this->type, $this->path, $this->provider, $this->priority, $this->metadata, $this->order);
    }

    /** Return a shallow copy with $path updated. */
    public function withPath(string $path): self
    {
        return new self($this->name, $this->type, $path, $this->provider, $this->priority, $this->metadata, $this->order);
    }

    /** Return a shallow copy with $priority updated. */
    public function withPriority(int $priority): self
    {
        return new self($this->name, $this->type, $this->path, $this->provider, $priority, $this->metadata, $this->order);
    }
}

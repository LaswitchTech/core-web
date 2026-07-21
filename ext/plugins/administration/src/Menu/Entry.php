<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration\Menu;

final class Entry
{
    public const PROVIDER_KERNEL = 'kernel';
    public const PROVIDER_PLUGIN = 'plugin';
    public const PROVIDER_APPLICATION = 'application';

    private readonly string $id;
    private readonly string $label;
    private readonly string $url;
    private readonly ?string $icon;
    private readonly ?string $description;
    private readonly ?string $tooltip;
    private readonly ?string $color;
    private readonly string $section;
    private readonly ?string $parent;
    private readonly int $priority;
    private readonly string $provider;
    private readonly int $order;

    /** @var array<string, mixed> */
    private readonly array $metadata;

    /** @param array<string, mixed> $metadata */
    public function __construct(
        string $id,
        string $label,
        string $url,
        ?string $icon = null,
        ?string $description = null,
        ?string $tooltip = null,
        ?string $color = null,
        string $section = 'general',
        ?string $parent = null,
        int $priority = 0,
        string $provider = self::PROVIDER_PLUGIN,
        int $order = 0,
        array $metadata = [],
    ) {
        $id = trim($id);

        if ($id === '' || preg_match('/^[a-z][a-z0-9._-]*$/', $id) !== 1) {
            throw new \InvalidArgumentException(
                'Administration menu entry ID must begin with a lowercase letter and contain only lowercase letters, digits, dots, underscores, or hyphens.',
            );
        }

        $this->id = $id;
        $label = trim($label);

        if ($label === '') {
            throw new \InvalidArgumentException(
                'Administration menu entry label must not be empty.',
            );
        }

        $this->label = $label;
        $url = trim($url);

        if ($url !== '/admin' && !str_starts_with($url, '/admin/')) {
            throw new \InvalidArgumentException(
                'Administration menu entry URL must be /admin or begin with /admin/.',
            );
        }

        $this->url = $url;
        $this->icon = $icon !== null && trim($icon) !== '' ? trim($icon) : null;
        $this->description = $description !== null && trim($description) !== '' ? trim($description) : null;
        $this->tooltip = $tooltip !== null && trim($tooltip) !== '' ? trim($tooltip) : null;
        $this->color = $color !== null && trim($color) !== '' ? trim($color) : null;
        $section = trim($section);

        if ($section === '' || preg_match('/^[a-z][a-z0-9._-]*$/', $section) !== 1) {
            throw new \InvalidArgumentException(
                'Administration menu entry section must begin with a lowercase letter and contain only lowercase letters, digits, dots, underscores, or hyphens.',
            );
        }

        $this->section = $section;
        if ($parent !== null) {
            $parent = trim($parent);

            if ($parent === '' || preg_match('/^[a-z][a-z0-9._-]*$/', $parent) !== 1) {
                throw new \InvalidArgumentException(
                    'Administration menu entry parent must be null or a valid entry ID.',
                );
            }
        }

        $this->parent = $parent;
        $this->priority = $priority;
        if (!in_array(
            $provider,
            [
                self::PROVIDER_KERNEL,
                self::PROVIDER_PLUGIN,
                self::PROVIDER_APPLICATION,
            ],
            true,
        )) {
            throw new \InvalidArgumentException(
                'Administration menu entry provider must be kernel, plugin, or application.',
            );
        }

        $this->provider = $provider;
        $this->order = $order;
        $this->metadata = $metadata;
    }

    public function id(): string
    {
        return $this->id;
    }

    public function label(): string
    {
        return $this->label;
    }

    public function url(): string
    {
        return $this->url;
    }

    public function icon(): ?string
    {
        return $this->icon;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function tooltip(): ?string
    {
        return $this->tooltip;
    }

    public function color(): ?string
    {
        return $this->color;
    }

    public function section(): string
    {
        return $this->section;
    }

    public function parent(): ?string
    {
        return $this->parent;
    }

    public function priority(): int
    {
        return $this->priority;
    }

    public function provider(): string
    {
        return $this->provider;
    }

    public function order(): int
    {
        return $this->order;
    }

    /** @return array<string, mixed> */
    public function metadata(): array
    {
        return $this->metadata;
    }

    public function withOrder(int $order): self
    {
        return new self(
            id: $this->id,
            label: $this->label,
            url: $this->url,
            icon: $this->icon,
            description: $this->description,
            tooltip: $this->tooltip,
            color: $this->color,
            section: $this->section,
            parent: $this->parent,
            priority: $this->priority,
            provider: $this->provider,
            order: $order,
            metadata: $this->metadata,
        );
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration\Settings;

final class Entry
{
    public const PROVIDER_KERNEL = 'kernel';
    public const PROVIDER_PLUGIN = 'plugin';
    public const PROVIDER_APPLICATION = 'application';

    private readonly string $key;
    private readonly string $label;
    private readonly string $description;
    private readonly string $type;
    /** @var mixed */
    private readonly mixed $default;
    /** @var null|callable */
    private readonly mixed $validator;
    private readonly string $category;
    private readonly int $priority;
    private readonly int $order;
    private readonly string $provider;

    /**
     * @param mixed $default
     * @param callable|null $validator
     */
    public function __construct(
        string $key,
        string $label,
        string $description,
        string $type,
        mixed $default = null,
        ?callable $validator = null,
        string $category = 'general',
        int $priority = 0,
        int $order = 0,
        string $provider = self::PROVIDER_PLUGIN,
    ) {
        if (trim($key) === '') {
            throw new \InvalidArgumentException('Settings Entry key must not be empty.');
        }

        if (!preg_match('/^[a-z][a-z0-9._\/]*$/', $key)) {
            throw new \InvalidArgumentException(
                'Settings Entry key must begin with a lowercase letter and contain only lowercase letters, digits, dots, slashes, or underscores.',
            );
        }

        if (trim($label) === '') {
            throw new \InvalidArgumentException('Settings Entry label must not be empty.');
        }

        $categoryCandidates = [
            'general',
            'branding',
            'display',
            'security',
            'performance',
            'notifications',
        ];

        if (!in_array($category, $categoryCandidates, true)) {
            throw new \InvalidArgumentException(
                'Settings Entry category must be one of: general, branding, display, security, performance, notifications.',
            );
        }

        $typeCandidates = [
            'string',
            'integer',
            'float',
            'boolean',
            'array',
            'url',
            'email',
            'text',
        ];

        if (!in_array($type, $typeCandidates, true)) {
            throw new \InvalidArgumentException(
                'Settings Entry type must be one of: string, integer, float, boolean, array, url, email, text.',
            );
        }

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
                'Settings Entry provider must be kernel, plugin, or application.',
            );
        }

        $this->key = trim($key);
        $this->label = trim($label);
        $this->description = trim($description);
        $this->type = $type;
        $this->default = $default;
        $this->validator = $validator;
        $this->category = $category;
        $this->priority = $priority;
        $this->order = $order;
        $this->provider = $provider;
    }

    public function key(): string
    {
        return $this->key;
    }

    public function label(): string
    {
        return $this->label;
    }

    public function description(): string
    {
        return $this->description;
    }

    public function type(): string
    {
        return $this->type;
    }

    /** @return mixed */
    public function default()
    {
        return $this->default;
    }

    /** @return callable|null */
    public function validator(): ?callable
    {
        return $this->validator;
    }

    public function category(): string
    {
        return $this->category;
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

    public function withOrder(int $order): self
    {
        return new self(
            key: $this->key,
            label: $this->label,
            description: $this->description,
            type: $this->type,
            default: $this->default,
            validator: $this->validator,
            category: $this->category,
            priority: $this->priority,
            order: $order,
            provider: $this->provider,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'description' => $this->description,
            'type' => $this->type,
            'default' => $this->default,
            'category' => $this->category,
            'priority' => $this->priority,
            'provider' => $this->provider,
        ];
    }
}

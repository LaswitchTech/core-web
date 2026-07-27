<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration\Overview;

final class Entry
{
    public const PROVIDER_KERNEL = 'kernel';
    public const PROVIDER_PLUGIN = 'plugin';
    public const PROVIDER_APPLICATION = 'application';

    private readonly string $id;
    private readonly string $component;

    /** @var array<string, mixed> */
    private readonly array $config;

    private readonly int $columns;
    private readonly int $priority;
    private readonly string $provider;
    private readonly int $order;

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        string $id,
        string $component,
        array $config = [],
        int $columns = 1,
        int $priority = 0,
        string $provider = self::PROVIDER_PLUGIN,
        int $order = 0,
    ) {
        $id = trim($id);

        if (
            $id === ''
            || preg_match(
                '/^[a-z][a-z0-9._-]*$/',
                $id,
            ) !== 1
        ) {
            throw new \InvalidArgumentException(
                'Administration Overview entry ID must begin with a lowercase letter and contain only lowercase letters, digits, dots, underscores, or hyphens.',
            );
        }

        $component = trim($component);

        if (
            $component === ''
            || preg_match(
                '/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/',
                $component,
            ) !== 1
        ) {
            throw new \InvalidArgumentException(
                'Administration Overview component must be a valid Builder slug.',
            );
        }

        if ($columns < 1 || $columns > 4) {
            throw new \InvalidArgumentException(
                'Administration Overview columns must be between 1 and 4.',
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
                'Administration Overview provider must be kernel, plugin, or application.',
            );
        }

        $this->id = $id;
        $this->component = $component;
        $this->config = $config;
        $this->columns = $columns;
        $this->priority = $priority;
        $this->provider = $provider;
        $this->order = $order;
    }

    public function id(): string
    {
        return $this->id;
    }

    public function component(): string
    {
        return $this->component;
    }

    /** @return array<string, mixed> */
    public function config(): array
    {
        return $this->config;
    }

    public function columns(): int
    {
        return $this->columns;
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
            id: $this->id,
            component: $this->component,
            config: $this->config,
            columns: $this->columns,
            priority: $this->priority,
            provider: $this->provider,
            order: $order,
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'component' => $this->component,
            'config' => $this->config,
            'columns' => $this->columns,
        ];
    }
}

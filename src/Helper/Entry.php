<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

/**
 * Immutable metadata container for a registered helper.
 */
final readonly class Entry
{
    private const VALID_PROVIDERS = ['core', 'app', 'plugin'];

    public readonly string $name;

    public function __construct(
        string $name,
        public HelperInterface $helper,
        public string $provider = 'core',
        public int $priority = 0,
        public array $metadata = [],
    ) {
        if (trim($name) === '') {
            throw new \InvalidArgumentException('Helper name cannot be empty.');
        }

        if (!in_array($provider, self::VALID_PROVIDERS, true)) {
            throw new \InvalidArgumentException(
                'Invalid provider. Expected one of: core, app, plugin. Got: ' . $provider
            );
        }

        $this->name = strtolower(trim($name));
    }
}

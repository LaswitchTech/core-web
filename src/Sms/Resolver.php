<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Sms;

use Laswitchtech\CoreWeb\Message\SmsProviderInterface;

/**
 * Resolves the active SMS provider from the registry.
 *
 * Chooses between a preferred provider (if provided) or falls back to 
 * a configured default, returning null when no match is found.
 */
final readonly class Resolver
{
    public function __construct(
        /** Registry instance containing all registered SMS providers */
        private Registry $registry,
        /** Default provider name used when no preferred provider is specified */
        private string $defaultProvider,
    ) {}

    /**
     * Resolve the active SMS provider.
     *
     * @param string|null $preferred explicit provider name override (nullable)
     * @return SmsProviderInterface|null resolved provider or null if not found
     */
    public function resolve(?string $preferred = null): ?SmsProviderInterface
    {
        $name = $preferred !== null && trim($preferred) !== ''
            ? $preferred
            : $this->defaultProvider;

        return $this->registry->get($name);
    }
}

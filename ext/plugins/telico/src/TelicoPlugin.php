<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Sms\Registry;
use Laswitchtech\CoreWeb\Config;

final class TelicoPlugin
{
    /**
     * Register the Telico SMS provider with the registry.
     *
     * @param array $context Contains 'registry' and 'container'
     */
    public static function registerProvider(array $context): void
    {
        // Only register if not already registered
        $registry = $context['registry'] ?? null;
        if (!$registry instanceof Registry) {
            return;
        }

        try {
            // Load config directly from Config class as required
            $telicoConfig = Config::get('sms.providers.telico', []);
            
            // Ensure config is an array
            if (!\is_array($telicoConfig)) {
                $telicoConfig = [];
            }
            
            // Register the provider with priority 0 (default)
            $provider = new TelicoProvider($telicoConfig);
            $registry->register($provider, 'plugin', 0);
        } catch (\Throwable $e) {
            // Silently fail to register - don't break the system
            return;
        }
    }
}
<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Plugin\Administration\Settings\Entry;
use Laswitchtech\CoreWeb\Plugin\Administration\Settings\Registry;

final class SystemSettingsProvider
{
    public static function register(array $context): void
    {
        /** @var mixed */
        if (!isset($context['registry'])) {
            return;
        }

        if (!($context['registry'] instanceof Registry)) {
            return;
        }

        /** @var Registry $registry */
        $registry = $context['registry'];

        $registry->register(
            new Entry(
                'application.name',
                'Application Name',
                'The application name displayed by Core-Web.',
                'text',
                'Core-Web',
                static fn (mixed $value): bool => is_string($value) && strlen(trim($value)) > 0 && strlen(trim($value)) <= 100,
                'branding',
            ),
        );

        $registry->register(
            new Entry(
                'administration.brand',
                'Administration Brand',
                'The brand label displayed in the Administration panel.',
                'text',
                'Administration',
                static fn (mixed $value): bool => is_string($value) && strlen(trim($value)) > 0 && strlen(trim($value)) <= 100,
                'branding',
            ),
        );

        $registry->register(
            new Entry(
                'administration.logo',
                'Administration Logo',
                'The logo URL displayed in the Administration panel.',
                'url',
                '',
                static fn (mixed $value): bool => is_string($value) && (('' === ($trimmed = trim($value))) || (strlen($trimmed) <= 2048 && ('/' === $trimmed[0] || str_starts_with($trimmed, 'https://') || str_starts_with($trimmed, 'http://')))),
                'branding',
            ),
        );

        $registry->register(
            new Entry(
                'administration.footer',
                'Administration Footer',
                'The plain-text footer displayed in the Administration panel.',
                'text',
                '',
                static fn (mixed $value): bool => is_string($value) && strlen(trim($value)) <= 255,
                'branding',
            ),
        );
    }
}

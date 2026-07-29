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
                'application.logo',
                'Application Logo',
                'Upload the logo displayed by panel layouts.',
                'file',
                '',
                null,
                'branding',
            ),
        );

        $registry->register(
            new Entry(
                'application.footer',
                'Application Footer',
                'The plain-text footer displayed by panel layouts.',
                'text',
                '',
                static fn (mixed $value): bool => is_string($value) && strlen(trim($value)) <= 255,
                'branding',
            ),
        );
    }
}

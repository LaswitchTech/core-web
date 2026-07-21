<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry;
use Laswitchtech\CoreWeb\Plugin\Administration\Menu\Registry;

final class DashboardMenuProvider
{
    public static function register(array $context): void
    {
        if (!isset($context['registry'])) {
            return;
        }

        if (!$context['registry'] instanceof Registry) {
            return;
        }

        /** @var Registry $registry */
        $registry = $context['registry'];

        $registry->register(new Entry(
            id: 'dashboard',
            label: 'Dashboard',
            url: '/admin',
            icon: 'bi-speedometer2',
            description: 'Administration system status overview.',
            tooltip: 'Dashboard',
            color: 'primary',
            section: 'general',
            parent: null,
            priority: 100,
            provider: Entry::PROVIDER_PLUGIN,
        ));
    }
}

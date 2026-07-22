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
            label: 'Overview',
            url: '/admin',
            icon: <<<'SVG'
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                    <path d="M2 10h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1m9-9h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m0 9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm0-10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM2 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2zm7 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2zM0 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.354.854a.5.5 0 1 0-.708-.708L3 3.793l-.646-.647a.5.5 0 1 0-.708.708l1 1a.5.5 0 0 0 .708 0z"/>
                </svg>
                SVG,
            description: 'Administration system status overview.',
            tooltip: 'Administration system status overview.',
            color: 'primary',
            section: 'general',
            parent: null,
            priority: 100,
            provider: Entry::PROVIDER_PLUGIN,
        ));
    }
}

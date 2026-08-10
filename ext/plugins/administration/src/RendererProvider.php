<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Renderer\Registry;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

final class RendererProvider
{
    public static function registerResources(array $context): void
    {
        if (!isset($context['registry']) || !($context['registry'] instanceof Registry)) {
            return;
        }

        $registry = $context['registry'];

        $pluginRoot = dirname(__DIR__);

        $registry->add(
            'admin.template',
            Entry::TYPE_TEMPLATE,
            $pluginRoot . '/templates/admin.php',
            Entry::PROVIDER_PLUGIN,
            0,
            [],
        );

        $registry->add(
            'admin.dashboard',
            Entry::TYPE_VIEW,
            $pluginRoot . '/views/dashboard.php',
            Entry::PROVIDER_PLUGIN,
            0,
            [],
        );

        $registry->add(
            'admin.settings',
            Entry::TYPE_VIEW,
            $pluginRoot . '/views/settings.php',
            Entry::PROVIDER_PLUGIN,
            0,
            [],
        );

        $registry->add(
            'admin.logs',
            Entry::TYPE_VIEW,
            $pluginRoot . '/views/logs.php',
            Entry::PROVIDER_PLUGIN,
            0,
            [],
        );
    }
}

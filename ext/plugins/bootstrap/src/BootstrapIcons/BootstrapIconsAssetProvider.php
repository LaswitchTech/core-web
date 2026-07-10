<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\BootstrapIcons;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class BootstrapIconsAssetProvider
{
    public static function registerAssets(array $context): void
    {
        $registry = $context['registry'] ?? null;

        if (!$registry instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__, 2);
        $cssFile   = $pluginRoot . '/Assets/css/bootstrap-icons.min.css';

        if (!is_readable($cssFile)) {
            return;
        }

        $registry->css(
            'bootstrap-icons/bootstrap-icons',
            realpath($cssFile),
            Entry::PROVIDER_PLUGIN,
            400,
        );
    }
}

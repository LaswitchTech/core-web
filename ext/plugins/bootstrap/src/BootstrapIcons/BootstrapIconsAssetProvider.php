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
        $cssFile     = 'bootstrap-icons.min.css';
        $cssPath      = $pluginRoot . '/Assets/css/' . $cssFile;

        if (!is_file($cssPath) || !is_readable($cssPath)) {
            return;
        }

        $resolvedCss = realpath($cssPath);
        if ($resolvedCss === false) {
            return;
        }

        $registry->css(
            'plugins/bootstrap',
            $cssFile,
            $resolvedCss,
            Entry::PROVIDER_PLUGIN,
            400,
        );
    }
}

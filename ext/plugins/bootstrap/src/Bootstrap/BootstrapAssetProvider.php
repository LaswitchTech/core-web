<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Bootstrap;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class BootstrapAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__, 2);        $cssFile    = 'bootstrap.min.css';
        $cssPath    = $pluginRoot . '/Assets/css/' . $cssFile;

        if (!file_exists($cssPath) || !is_readable($cssPath)) {
            return;
        }

        $registry = $context['registry'];
        $registry->css(
            'bootstrap',
            realpath($cssPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        $jsPath = $pluginRoot . '/Assets/js/bootstrap.bundle.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $registry->js(
            'bootstrap',
            realpath($jsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );
    }
}

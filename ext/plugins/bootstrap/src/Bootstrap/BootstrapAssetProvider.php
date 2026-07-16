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

        $pluginRoot = dirname(__DIR__, 2);
        $registry   = $context['registry'];

        // Bootstrap CSS — the explicit default for this scope
        $cssFile     = 'bootstrap.min.css';
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
            ['default' => true],
        );

        // Bootstrap JS — the explicit JS default for this scope
        $jsFile       = 'bootstrap.bundle.min.js';
        $jsPath       = $pluginRoot . '/Assets/js/' . $jsFile;

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $resolvedJs = realpath($jsPath);
        if ($resolvedJs === false) {
            return;
        }

        $registry->js(
            'plugins/bootstrap',
            $jsFile,
            $resolvedJs,
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\ChartJs;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class ChartJsAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot     = dirname(__DIR__);
        $jsFile         = 'chart.umd.min.js';
        $jsPath         = $pluginRoot . '/Assets/js/' . $jsFile;

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $resolvedAbsolutePath = realpath($jsPath);
        if ($resolvedAbsolutePath === false) {
            return;
        }

        $registry = $context['registry'];

        $registry->js(
            'plugins/chartjs',
            $jsFile,
            $resolvedAbsolutePath,
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );
    }
}

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

        $pluginRoot = dirname(__DIR__);
        $jsPath = $pluginRoot . '/Assets/js/chart.umd.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $registry = $context['registry'];
    }
}

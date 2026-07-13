<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Jquery;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class JqueryAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__);
        $jsPath = $pluginRoot . '/Assets/js/jquery.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $registry = $context['registry'];
        $registry->js(
            'jquery',
            realpath($jsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );
    }
}

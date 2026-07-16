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
        $jsPath     = $pluginRoot . '/Assets/js/jquery.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $resolvedAbsolutePath = realpath($jsPath);
        if ($resolvedAbsolutePath === false) {
            return;
        }

        $registry = $context['registry'];
        $registry->js(
            'plugins/jquery',
            'jquery.min.js',
            $resolvedAbsolutePath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );
    }
}

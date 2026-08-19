<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\TimeagoJS;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class TimeagoJSAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__);
        $jsPath = $pluginRoot . '/Assets/js/timeago.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $realJsPath = realpath($jsPath);

        if ($realJsPath === false) {
            return;
        }

        $context['registry']->js(
            'plugins/timeagojs',
            'timeago.min.js',
            $realJsPath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );
    }
}

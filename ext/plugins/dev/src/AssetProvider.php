<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Dev;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class AssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (
            !isset($context['registry'])
            || !($context['registry'] instanceof Registry)
        ) {
            return;
        }

        $pluginRoot = dirname(__DIR__);

        $lessPath =
            $pluginRoot . '/Assets/less/preview.less';

        if (is_file($lessPath)) {
            $context['registry']->css(
                'plugins/dev',
                'preview.less',
                $lessPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }

        $jsPath =
            $pluginRoot . '/Assets/js/preview.js';

        if (is_file($jsPath)) {
            $context['registry']->js(
                'plugins/dev',
                'preview.js',
                $jsPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }
    }
}

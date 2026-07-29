<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Asset\Entry;

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

        $lessPath = $pluginRoot . '/Assets/less/overview.less';

        if (is_file($lessPath)) {
            $context['registry']->css(
                'plugins/administration',
                'overview.less',
                $lessPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }

        $jsPath = $pluginRoot . '/Assets/js/overview.js';

        if (is_file($jsPath)) {
            $context['registry']->js(
                'plugins/administration',
                'overview.js',
                $jsPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }

        $settingsLessPath = $pluginRoot . '/Assets/less/settings.less';

        if (is_file($settingsLessPath)) {
            $context['registry']->css(
                'plugins/administration',
                'settings.less',
                $settingsLessPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }

        $settingsJsPath = $pluginRoot . '/Assets/js/settings.js';

        if (is_file($settingsJsPath)) {
            $context['registry']->js(
                'plugins/administration',
                'settings.js',
                $settingsJsPath,
                Entry::PROVIDER_PLUGIN,
                400,
                [],
            );
        }
    }
}

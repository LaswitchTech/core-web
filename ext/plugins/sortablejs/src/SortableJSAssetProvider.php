<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\SortableJS;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class SortableJSAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__);
        $jsPath = $pluginRoot . '/Assets/js/sortable.min.js';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        $realJsPath = realpath($jsPath);
        if ($realJsPath === false) {
            return;
        }

        $context['registry']->js(
            'plugins/sortablejs',
            'sortable.min.js',
            $realJsPath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );
    }
}

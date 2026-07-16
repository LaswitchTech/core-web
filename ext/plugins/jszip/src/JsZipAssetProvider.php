<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\JsZip;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class JsZipAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot     = dirname(__DIR__);
        $jsFile         = 'jszip.min.js';
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
            'plugins/jszip',
            $jsFile,
            $resolvedAbsolutePath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );
    }
}

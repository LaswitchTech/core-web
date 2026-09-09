<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\PrismJS;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class PrismJSAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot =
            dirname(__DIR__);

        $registry =
            $context['registry'];

        $assets = [
            [
                'prism-config.js',
                300,
            ],
            [
                'prism-core.min.js',
                310,
            ],
            [
                'prism-markup.min.js',
                320,
            ],
            [
                'prism-css.min.js',
                330,
            ],
            [
                'prism-clike.min.js',
                340,
            ],
            [
                'prism-javascript.min.js',
                350,
            ],
            [
                'prism-php.min.js',
                360,
            ],
            [
                'prism-json.min.js',
                370,
            ],
            [
                'prism-bash.min.js',
                380,
            ],
            [
                'prism-sql.min.js',
                390,
            ],
            [
                'prism-python.min.js',
                400,
            ],
        ];

        foreach ($assets as [$file, $priority]) {
            $path =
                $pluginRoot
                . '/Assets/js/'
                . $file;

            if (
                !is_file($path)
                || !is_readable($path)
            ) {
                return;
            }

            $realPath =
                realpath($path);

            if ($realPath === false) {
                return;
            }

            $registry->js(
                'plugins/prismjs',
                $file,
                $realPath,
                Entry::PROVIDER_PLUGIN,
                $priority,
            );
        }
    }
}
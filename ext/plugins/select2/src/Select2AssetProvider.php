<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Select2;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class Select2AssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot = dirname(__DIR__);

        $jsPath = $pluginRoot . '/Assets/js/select2.min.js';
        $cssPath = $pluginRoot . '/Assets/css/select2.min.css';
        $bootstrap5CssPath = $pluginRoot . '/Assets/css/select2-bootstrap-5-theme.min.css';

        if (!is_file($jsPath) || !is_readable($jsPath)) {
            return;
        }

        if (!is_file($cssPath) || !is_readable($cssPath)) {
            return;
        }

        if (!is_file($bootstrap5CssPath) || !is_readable($bootstrap5CssPath)) {
            return;
        }

        $registry = $context['registry'];

        $realCssPath = realpath($cssPath);
        if ($realCssPath === false) {
            return;
        }

        $registry->css(
            'plugins/select2',
            'select2.min.css',
            $realCssPath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );

        $realBootstrap5CssPath = realpath($bootstrap5CssPath);
        if ($realBootstrap5CssPath === false) {
            return;
        }

        $registry->css(
            'plugins/select2',
            'select2-bootstrap-5-theme.min.css',
            $realBootstrap5CssPath,
            Entry::PROVIDER_PLUGIN,
            300,
        );

        $realJsPath = realpath($jsPath);
        if ($realJsPath === false) {
            return;
        }

        $registry->js(
            'plugins/select2',
            'select2.min.js',
            $realJsPath,
            Entry::PROVIDER_PLUGIN,
            300,
            ['default' => true],
        );
    }
}

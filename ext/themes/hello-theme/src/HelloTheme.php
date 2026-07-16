<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Theme;

/**
 * Hello Theme — minimal enabled theme that registers one LESS asset via hook.
 */
final class HelloTheme
{
    /**
     * Called by the HookRegistry on 'asset.register'.
     *
     * @param  array<string, mixed> $context  ['registry' => AssetRegistry|null]
     * @return void
     */
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof \Laswitchtech\CoreWeb\Asset\Registry) {
            return;
        }

        // Resolve the theme root from __FILE__ (same pattern as HelloWorld::getPluginDir()).
        $r   = realpath(__FILE__);
        $dir = $r !== false ? dirname(dirname($r)) : null;

        if ($dir === null) {
            return;
        }

        // Construct the absolute path to the LESS source.
        $fullPath = "{$dir}/styles/style.less";

        if (!is_file($fullPath) || !is_readable($fullPath)) {
            return;
        }

        $resolved  = realpath($fullPath);
        if ($resolved === false) {
            return;
        }

        // Explicit default: the CSS scope has exactly one principal asset.
        $context['registry']->css(
            'themes/hello-theme',
            'style.less',
            $resolved,
            \Laswitchtech\CoreWeb\Asset\Entry::PROVIDER_THEME,
            300,
            ['default' => true],
        );
    }
}

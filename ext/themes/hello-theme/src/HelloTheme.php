<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Theme;

use Laswitchtech\CoreWeb\Asset\Entry as AssetEntry;

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
        $registry = $context['registry'] ?? null;

        if (!($registry instanceof \Laswitchtech\CoreWeb\Asset\Registry)) {
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

        if (!is_readable($fullPath)) {
            return;
        }

        $assetName = "hello-theme/style.css";

        $entry = new AssetEntry(
            name:     $assetName,
            path:     $fullPath,
            type:     AssetEntry::TYPE_CSS,
            provider: AssetEntry::PROVIDER_THEME,
            priority: 300,
        );

        $registry->register($entry);
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\PdfMake;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class PdfMakeAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot    = dirname(__DIR__);
        $pdfFile      = 'pdfmake.min.js';
        $pdfPath      = $pluginRoot . '/Assets/js/' . $pdfFile;
        $vfsFile       = 'vfs_fonts.js';
        $vfsPath       = $pluginRoot . '/Assets/js/' . $vfsFile;

        if (!is_file($pdfPath) || !is_readable($pdfPath)) {
            return;
        }

        $resolvedPdf = realpath($pdfPath);
        if ($resolvedPdf === false) {
            return;
        }

        if (!is_file($vfsPath) || !is_readable($vfsPath)) {
            return;
        }

        $resolvedVfs = realpath($vfsPath);
        if ($resolvedVfs === false) {
            return;
        }

        $registry = $context['registry'];

        // pdfmake.min.js — the explicit JS default for this scope
        $registry->js(
            'plugins/pdfmake',
            $pdfFile,
            $resolvedPdf,
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );

        // vfs_fonts.js — not marked default
        $registry->js(
            'plugins/pdfmake',
            $vfsFile,
            $resolvedVfs,
            Entry::PROVIDER_PLUGIN,
            400,
        );

    }
}

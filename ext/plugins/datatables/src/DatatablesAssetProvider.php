<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Datatables;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

final class DatatablesAssetProvider
{
    public static function registerAssets(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $pluginRoot         = dirname(__DIR__);

        // Core files (used for path resolution)
        $coreJsPath         = $pluginRoot . '/Assets/js/datatables.min.js';
        $bs5JsPath          = $pluginRoot . '/Assets/js/datatables.bootstrap5.min.js';
        $bs5CssPath         = $pluginRoot . '/Assets/css/datatables.bootstrap5.min.css';
        $responsiveJsPath   = $pluginRoot . '/Assets/js/datatables.responsive.min.js';
        $responsiveBs5JsPath= $pluginRoot . '/Assets/js/responsive.bootstrap5.min.js';
        $responsiveBs5CssPath =$pluginRoot . '/Assets/css/responsive.bootstrap5.min.css';

        $selectJsPath       = $pluginRoot . '/Assets/js/datatables.select.min.js';
        $selectBs5JsPath    = $pluginRoot . '/Assets/js/select.bootstrap5.min.js';
        $selectBs5CssPath   = $pluginRoot . '/Assets/css/select.bootstrap5.min.css';

        $buttonsJsPath      = $pluginRoot . '/Assets/js/dataTables.buttons.min.js';
        $buttonsBs5JsPath   = $pluginRoot . '/Assets/js/buttons.bootstrap5.min.js';
        $buttonsBs5CssPath  = $pluginRoot . '/Assets/css/buttons.bootstrap5.min.css';
        $buttonsColVisJsPath= $pluginRoot . '/Assets/js/buttons.colVis.min.js';
        $buttonsHtml5JsPath =$pluginRoot . '/Assets/js/buttons.html5.min.js';
        $buttonsPrintJsPath = $pluginRoot . '/Assets/js/buttons.print.min.js';
        $columnControlJsPath   = $pluginRoot . '/Assets/js/dataTables.columnControl.min.js';
        $columnControlBs5JsPath = $pluginRoot . '/Assets/js/columnControl.bootstrap5.min.js';
        $columnControlBs5CssPath= $pluginRoot . '/Assets/css/columnControl.bootstrap5.min.css';

        if (!is_file($coreJsPath) || !is_readable($coreJsPath)) {
            return;
        }
        if (!is_file($bs5JsPath) || !is_readable($bs5JsPath)) {
            return;
        }
        if (!is_file($bs5CssPath) || !is_readable($bs5CssPath)) {
            return;
        }
        if (!is_file($responsiveJsPath) || !is_readable($responsiveJsPath)) {
            return;
        }
        if (!is_file($responsiveBs5JsPath) || !is_readable($responsiveBs5JsPath)) {
            return;
        }
        if (!is_file($responsiveBs5CssPath) || !is_readable($responsiveBs5CssPath)) {
            return;
        }
        if (!is_file($selectJsPath) || !is_readable($selectJsPath)) {
            return;
        }
        if (!is_file($selectBs5JsPath) || !is_readable($selectBs5JsPath)) {
            return;
        }
        if (!is_file($selectBs5CssPath) || !is_readable($selectBs5CssPath)) {
            return;
        }
        if (!is_file($buttonsJsPath) || !is_readable($buttonsJsPath)) {
            return;
        }
        if (!is_file($buttonsBs5JsPath) || !is_readable($buttonsBs5JsPath)) {
            return;
        }
        if (!is_file($buttonsBs5CssPath) || !is_readable($buttonsBs5CssPath)) {
            return;
        }
        if (!is_file($buttonsColVisJsPath) || !is_readable($buttonsColVisJsPath)) {
            return;
        }
        if (!is_file($buttonsHtml5JsPath) || !is_readable($buttonsHtml5JsPath)) {
            return;
        }
        if (!is_file($buttonsPrintJsPath) || !is_readable($buttonsPrintJsPath)) {
            return;
        }
        if (!is_file($columnControlJsPath) || !is_readable($columnControlJsPath)) {
            return;
        }
        if (!is_file($columnControlBs5JsPath) || !is_readable($columnControlBs5JsPath)) {
            return;
        }
        if (!is_file($columnControlBs5CssPath) || !is_readable($columnControlBs5CssPath)) {
            return;
        }

        $registry = $context['registry'];

        // All registrations use scope 'plugins/datatables' in the same order as before.

        // 1. CSS — datatables.bootstrap5.min.css (the explicit CSS default)
        $registry->css(
            'plugins/datatables',
            'datatables.bootstrap5.min.css',
            realpath($bs5CssPath),
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );

        // 2. JS — datatables.min.js (the explicit JS default)
        $registry->js(
            'plugins/datatables',
            'datatables.min.js',
            realpath($coreJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
            ['default' => true],
        );

        // 3. JS — datatables.bootstrap5.min.js
        $registry->js(
            'plugins/datatables',
            'datatables.bootstrap5.min.js',
            realpath($bs5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 4. JS — datatables.responsive.min.js
        $registry->js(
            'plugins/datatables',
            'datatables.responsive.min.js',
            realpath($responsiveJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 5. JS — responsive.bootstrap5.min.js
        $registry->js(
            'plugins/datatables',
            'responsive.bootstrap5.min.js',
            realpath($responsiveBs5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 6. CSS — responsive.bootstrap5.min.css
        $registry->css(
            'plugins/datatables',
            'responsive.bootstrap5.min.css',
            realpath($responsiveBs5CssPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 7. JS — datatables.select.min.js
        $registry->js(
            'plugins/datatables',
            'datatables.select.min.js',
            realpath($selectJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 8. JS — select.bootstrap5.min.js
        $registry->js(
            'plugins/datatables',
            'select.bootstrap5.min.js',
            realpath($selectBs5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 9. CSS — select.bootstrap5.min.css
        $registry->css(
            'plugins/datatables',
            'select.bootstrap5.min.css',
            realpath($selectBs5CssPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 10. ColumnControl CSS — columnControl.bootstrap5.min.css
        $registry->css(
            'plugins/datatables',
            'columnControl.bootstrap5.min.css',
            realpath($columnControlBs5CssPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        /* ---- Buttons assets (preserved in original sequence) ---- */

        // 10. Buttons JS — dat/dataTables.buttons.min.js
        $registry->js(
            'plugins/datatables',
            'dataTables.buttons.min.js',
            realpath($buttonsJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 11. Buttons BS5 JS — buttons.bootstrap5.min.js
        $registry->js(
            'plugins/datatables',
            'buttons.bootstrap5.min.js',
            realpath($buttonsBs5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 12. Buttons BS5 CSS — buttons.bootstrap5.min.css
        $registry->css(
            'plugins/datatables',
            'buttons.bootstrap5.min.css',
            realpath($buttonsBs5CssPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 13. Buttons ColVis JS — buttons.colVis.min.js
        $registry->js(
            'plugins/datatables',
            'buttons.colVis.min.js',
            realpath($buttonsColVisJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 14. Buttons HTML5 JS — buttons.html5.min.js
        $registry->js(
            'plugins/datatables',
            'buttons.html5.min.js',
            realpath($buttonsHtml5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 15. Buttons Print JS — buttons.print.min.js
        $registry->js(
            'plugins/datatables',
            'buttons.print.min.js',
            realpath($buttonsPrintJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 16. ColumnControl core JS — dataTables.columnControl.min.js
        $registry->js(
            'plugins/datatables',
            'dataTables.columnControl.min.js',
            realpath($columnControlJsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );

        // 17. ColumnControl BS5 JS — columnControl.bootstrap5.min.js
        $registry->js(
            'plugins/datatables',
            'columnControl.bootstrap5.min.js',
            realpath($columnControlBs5JsPath),
            Entry::PROVIDER_PLUGIN,
            400,
        );
    }
}

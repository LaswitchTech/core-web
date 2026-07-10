<?php declare(strict_types = 1);
/**
 * Verify bootstrap plugin: loads the framework, triggers asset.register hooks,
 * then confirms both CSS and JS entries are present in the registry.
 */

require_once dirname(__DIR__) . '/vendor/autoload.php';

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Asset\Registry as AssetRegistry;

$c = require_once dirname(__DIR__) . '/src/Bootstrap.php';

// Bootstrap will initialize itself and populate the container.
$container = $c->resolve('asset_registry');

if (!($container instanceof AssetRegistry)) {
    fwrite(STDERR, "FAIL: asset_registry not found or wrong type\n");
    exit(1);
}

$css = $container->orderedCss();
$js  = $container->orderedJs();

$hasBootstrapCss = false;
$hasBootstrapJs  = false;

foreach ($css as $entry) {
    if (str_contains($entry->name, 'bootstrap')) {
        $hasBootstrapCss = true;
        echo "CSS OK: {$entry->name} => {$entry->path}\n";
    }
}

foreach ($js as $entry) {
    if (str_contains($entry->name, 'bootstrap')) {
        $hasBootstrapJs = true;
        echo "JS  OK: {$entry->name} => {$entry->path}\n";
    }
}

if (!$hasBootstrapCss) {
    fwrite(STDERR, "FAIL: No Bootstrap CSS registered\n");
    exit(1);
}

if (!$hasBootstrapJs) {
    fwrite(STDERR, "FAIL: No Bootstrap JS registered\n");
    exit(1);
}

echo "\nAll Bootstrap assets verified successfully.\n";
exit(0);

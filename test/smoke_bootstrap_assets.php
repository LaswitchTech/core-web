<?php
declare(strict_types=1);

require_once dirname(__DIR__) . "/vendor/autoload.php";
require_once dirname(__DIR__) . "/src/Asset/Entry.php";
require_once dirname(__DIR__) . "/src/Asset/Registry.php";
require_once __DIR__ . "/../ext/plugins/bootstrap/src/BootstrapAssetProvider.php";

use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Plugin\Bootstrap\BootstrapAssetProvider;

$registry = new Registry();
$context = ['registry' => $registry];

BootstrapAssetProvider::registerAssets($context);

// Inspect internal state (Entry objects have name property)
echo "CSS entries:\n";
foreach ($registry->allCss() as $name => $entry) {
    echo "  name: {$name}, path: {$entry->path}\n";
}

echo "\nJS entries:\n";
foreach ($registry->allJs() as $name => $entry) {
    echo "  name: {$name}, path: {$entry->path}\n";
}

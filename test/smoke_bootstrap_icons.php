<?php
declare(strict_types=1);

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../src/Asset/Entry.php";
require_once __DIR__ . "/../src/Asset/Registry.php";
require_once __DIR__ . "/../ext/plugins/bootstrap/src/BootstrapIcons/BootstrapIconsAssetProvider.php";

use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Plugin\BootstrapIcons\BootstrapIconsAssetProvider;

$registry = new Registry();
$context = ['registry' => $registry];

BootstrapIconsAssetProvider::registerAssets($context);

echo "CSS entries:\n";
foreach ($registry->allCss() as $name => $entry) {
    echo "  name: {$name}, path: {$entry->path}\n";
}

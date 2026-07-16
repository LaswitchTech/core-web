<?php
/**
 * Read-only smoke test: real Core-Web bootstrap -> extension discovery
 * -> dependency sorting -> asset.register hooks -> Asset\Registry::orderedJs()
 */
declare(strict_types=1);

$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (!is_file($vendorAutoload)) {
    fwrite(STDERR, "FATAL: vendor/autoload.php not found\n");
    exit(2);
}
require_once $vendorAutoload;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Container;
use Laswitchtech\CoreWeb\Asset\Registry as AssetRegistry;
use Laswitchtech\CoreWeb\Asset\Entry;

// 1. Real bootstrap
$BOOTSTRAP = new Bootstrap("WEB");
$container = $BOOTSTRAP->container();

if (!$container instanceof Container) {
    fwrite(STDERR, "FATAL: container not a Container instance\n");
    exit(2);
}

// 2. Real Asset\Registry from container (filled by asset.register hook)
$assetRegistry = $container->resolve('asset_registry');
if (!$assetRegistry instanceof AssetRegistry) {
    fwrite(STDERR, "FATAL: asset_registry is not an Asset\\Registry\n");
    exit(2);
}

// 3. orderedJs()
$entries = $assetRegistry->orderedJs();

// 4. Target names and lookup map
$targetNames = [
    'jquery',
    'bootstrap',
    'jszip',
    'pdfmake',
    'pdfmake-fonts',
    'datatables',
    'datatables-bootstrap5',
    'datatables-responsive',
    'datatables-responsive-bootstrap5',
    'datatables-select',
    'datatables-select-bootstrap5',
    'datatables-buttons',
    'datatables-buttons-bootstrap5',
    'datatables-buttons-colvis',
    'datatables-buttons-html5',
    'datatables-buttons-print',
];

$map = [];       // lowercase name => ['order'=>int, 'entry'=>Entry]
foreach ($entries as $idx => $entry) {
    $key = strtolower($entry->name);
    $map[$key] = ['order' => $idx, 'entry' => $entry];
}

// 5. Print ALL ordered entries (short path for context)
echo "=== All orderedJs() entries (", count($entries), ") ===\n";
$base = rtrim(str_replace('\\', '/', __DIR__), '/'); // /Users/louis/Projects/core-web/test
if (str_contains(dirname($base), 'core-web')) {
    $prefixLen = strpos($base, 'test') + 4; // length of ".../test"
    $fullBase = dirname($base); // .../core-web
} else {
    $fullBase = dirname(dirname($base));
}

foreach ($entries as $idx => $entry) {
    try {
        $rel = (string)realpath($entry->path);
    } catch (\Throwable) { $rel = $entry->path; }
    $prefixLen = strlen(str_replace('\\', '/', realpath(__DIR__ . '/../../..') ?: ''));
    $shortPath = substr($rel, $prefixLen - 1);
    echo sprintf("  %2d. %-45s type=%-3s pri=%4d order=%4d provider=%-7s -> %s\n",
        $idx, $entry->name, $entry->type, $entry->priority, $idx, strtoupper($entry->provider), rtrim(str_replace('\\', '/', $shortPath ?: '/missing'), '/')
    );
}

// 6. Print requested entries
echo "\n=== Requested JS entries from orderedJs() ===\n";
foreach ($targetNames as $name) {
    if (isset($map[$name])) {
        $e = $map[$name]['entry'];
        try {
            $absPath = realpath($e->path);
            $shortPath = str_replace('\\', '/', substr((string)$absPath, $prefixLen - 1));
        } catch (\Throwable) {
            $shortPath = rtrim(str_replace('\\', '/', $e->path), '/');
        }
        echo sprintf("  %-45s priority=%4d order=%4d provider=%-7s -> %s\n",
            $e->name, $e->priority, $map[$name]['order'], strtoupper($e->provider), $shortPath);
    } else {
        echo sprintf("  %-45s [MISSING]\n", $name);
    }
}

// 7. Required relative ordering checks
echo "\n=== Required ordering ===\n";
$checks = [
    ['jquery', 'bootstrap'],
    ['jszip', 'datatables-buttons-html5'],
    ['pdfmake', 'pdfmake-fonts'],
    ['pdfmake-fonts', 'datatables-buttons-html5'],
    ['datatables', 'datatables-bootstrap5'],
    ['datatables-buttons', 'datatables-buttons-bootstrap5'],
    ['datatables-buttons-bootstrap5', 'datatables-buttons-colvis'],
    ['datatables-buttons-colvis', 'datatables-buttons-html5'],
    ['datatables-buttons-html5', 'datatables-buttons-print'],
];

$failCount = 0;
foreach ($checks as [$before, $after]) {
    if (!isset($map[$before])) {
        echo "  FAIL {$before} [---] before {$after} [---] : {$before} missing\n";
        ++$failCount; continue;
    }
    if (!isset($map[$after])) {
        echo "  FAIL {$before} [{$map[$before]['order']}] before {$after} [---] : {$after} missing\n";
        ++$failCount; continue;
    }
    if ($map[$before]['order'] < $map[$after]['order']) {
        echo "  OK   {$before} (ord={$map[$before]['order']}) before {$after} (ord={$map[$after]['order']})\n";
    } else {
        echo "  FAIL {$before} (ord={$map[$before]['order']}) NOT before {$after} (ord={$map[$after]['order']})\n";
        ++$failCount;
    }
}

// 8. Missing / duplicated check for requested names
echo "\n=== Missing entries ===\n";
foreach ($targetNames as $name) {
    if (!isset($map[$name])) {
        echo "  MISSING: {$name}\n";
        ++$failCount;
    }
}

echo "\n=== Summary ===\n";
echo "Total JS entries in registry: ", count($entries), "\n";
$found = array_reduce($targetNames, fn($c, $n) => $c + (isset($map[$n]) ? 1 : 0), 0);
echo "Requested found: {$found}/", count($targetNames), "\n";
echo "Failures: {$failCount}\n";
echo ($failCount > 0) ? "RESULT: FAILURES DETECTED\n" : "RESULT: ALL OK\n";

exit($failCount > 0 ? 1 : 0);

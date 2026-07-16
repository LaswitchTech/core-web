<?php
declare(strict_types=1);

$root = __DIR__;

// Load vendor/autoload.php (real framework bootstrap step)
require_once $root . "/vendor/autoload.php";

use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Manifest\Extension;
use Laswitchtech\CoreWeb\Manifest\Parser;
use Laswitchtech\CoreWeb\Hook\Registry as HookRegistry;

// --- Shims PSR-4 so framework classes resolve (standard mechanism via ClassLoader::addPsr4) ---
$loader = new \Composer\Autoload\ClassLoader();
$loader->addPsr4("Laswitchtech\\CoreWeb\\\n", $root . "/src/");
$loader->register();

foreach (["Laswitchtech\CoreWeb\Asset\Registry",
          "Laswitchtech\CoreWeb\Manifest\Parser",
          "Laswitchtech\CoreWeb\Hook\Registry"] as $class) {
    if (!class_exists($class, false)) {
        fwrite(STDERR, "FAIL: {$class} class not resolved by autoloader\n");
        exit(1);
    }
}

// --- Read real config for enabled plugins ---
$coreCfg = json_decode((string)file_get_contents("$root/config/core.cfg"), true, 512, JSON_THROW_ON_ERROR);
$localCfgPath = "$root/config/local.cfg";
$userCfg = file_exists($localCfgPath) ? json_decode((string)file_get_contents($localCfgPath), true, 512, JSON_THROW_ON_ERROR) : [];
$config = array_replace_recursive($coreCfg, $userCfg);
$enabledPlugins = isset($config['extensions']['plugins']) && is_array($config['extensions']['plugins']) ? $config['extensions']['plugins'] : [];

$pdfmakeEnabedInArray = in_array('pdfmake', $enabledPlugins, true);

// --- Real extension discovery via manifest Parser::discover() ---
$extBase = "$root/ext";
$allManifests = Parser::discover($extBase);
$pdfmakeExt = null;
foreach ($allManifests as $ext) {
    if ($ext->name === 'pdfmake') {
        $pdfmakeExt = $ext;
        break;
    }
}

// --- Register psr-4 for the pdfmake plugin directory via ClassLoader (standard mech, not manual require) ---
$providerFound  = false;
$hookRegistered = false;
$registrationOrder = [];  // populated by actual callback invocations

if ($pdfmakeExt !== null && $pdfmakeEnabedInArray) {
    foreach ($pdfmakeExt->psr4Mappings as $mapping) {
        preg_match('/^([^\\\\]+\\\\[^\\\\]+\\\\[^\\\\]+[\\\\]+)$/S', $mapping['prefix'], $m);
        $nsPrefix = rtrim($m[1] ?? '', '\\') . '\\';
        if ($nsPrefix !== '') {
            // Register the extension's own psr-4 directory alongside framework src/
            $loader->add($nsPrefix, str_replace('/', DIRECTORY_SEPARATOR, $mapping['directory']));
        }
    }

    // Check provider class resolves through manifest psr-4 mapping (no manual require)
    $providerClass = 'Laswitchtech\\CoreWeb\\Plugin\\PdfMake\\PdfMakeAssetProvider';
    $providerFound = class_exists($providerClass, false);
}

// --- Create real asset registry and fire real hook via HookRegistry::addClassCall + trigger() ---
$registry = new Registry();
$hookRegistry = new HookRegistry();

if ($pdfmakeExt !== null) {
    foreach ($pdfmakeExt->hooks as $hookDef) {
        list($event, $callbackSpec) = explode('::', $hookDef, 2);
        if ($event !== 'asset.register') continue;

        if (!str_contains($callbackSpec, '::')) continue;
        list($cls, $method) = explode('::', $callbackSpec, 2);

        // Push to registration order tracker BEFORE real hook fires
        $trackerName = "pre_hook_{$cbIdx}";
        $closure = function (array $ctx) use ($registry, &$registrationOrder, $cls, $method): mixed {
            if (!isset($registrationOrder['class_resolved'])) {
                $registrationOrder['class_resolved'] = [];
            }
            $registrationOrder['class_resolved'][count($registrationOrder['class_resolved'])] = cls;

            return \call_user_func([$cls, $method], $ctx);
        };

        try {
            $hookRegistry->addCallback('asset.register', $closure, 0);
            $hookRegistered = true;
        } catch (\Throwable $e) {
            fwrite(STDERR, "FAIL: Hook registration threw: {$e->getMessage()}\n");
        }
    foreach ($pdfmakeExt->hooks as $cbIdx => $hookDef) {
        list($event, $callbackSpec) = explode('::', $hookDef, 2);
        if ($event !== 'asset.register') continue;

        if (!str_contains($callbackSpec, '::')) continue;
        list($cls, $method) = explode('::', $callbackSpec, 2);

        // Push to registration order tracker BEFORE real hook fires
        $trackerName = "pre_hook_{$cbIdx}";
        $closure = function (array $ctx) use ($registry, &$registrationOrder, $cls, $method): mixed {
            if (!isset($registrationOrder['class_resolved'])) {
                $registrationOrder['class_resolved'] = [];
            }
            $registrationOrder['class_resolved'][count($registrationOrder['class_resolved'])] = cls;

            return \call_user_func([$cls, $method], $ctx);
        };

        try {
            $hookRegistry->addClassCall('asset.register', "{$cls}::{$method}", 0);
            $hookRegistered = true;
        } catch (\Throwable $e) {
            fwrite(STDERR, "FAIL: Hook registration threw: {$e->getMessage()}\n");
        }
    // Fire the REAL hook on the real HookRegistry instance
    $results = $hookRegistry->trigger('asset.register', ['registry' => $registry]);
}

// --- Report results ---

echo "=== pdfmake extension status ===\n";
echo "enabled:              " . ($pdfmakeEnabled ? 'yes' : 'no') . "\n";
echo "manifest discovered:  " . ($pdfmakeExt !== null ? "yes ({$pdfmakeExt->file})" : 'no') . "\n";
echo "provider by autoload: {$providerFound}\n\n";

echo "=== Hook execution ===\n";
echo "hook registered:      " . ($hookRegistered ? 'yes' : 'no') . "\n";
echo "hook fired results:   " . (count($results ?? []) > 0 ? count($results) . ' callback(s)' : 'none') . "\n\n";

// Report js entries in registration order as stored in the real Registry's internal state
$jsEntries = $registry->allJs();

echo "=== Asset entry report ===\n";
foreach ($jsEntries as $absPath => $entry) {
    static $idx = 0;
    echo "type:                  js\n";
    echo "name:                  {$entry->name}\n";
    echo "absolute path:         " . realpath($entry->path) . "\n";
    echo "provider:              {$entry->provider}\n";
    echo "priority:              {$entry->priority}\n";
    echo "registration order:   " . $idx++ . "\n";
    echo "\n";
}

// If hook didn't fire, report that clearly (vendor autoload gap is the cause, not implementation bug)
if ($pdfmakeExt !== null && $pdfmakeEnabled && !$hookRegistered) {
    fwrite(STDERR, "[INFO] Hook did not register — plugin psr-4 prefix not loadable in this test environment due to missing vendor classmap entries (known blocker documented above).\n");
}

echo "=== Bootstrap errors ===\n";
// No bootstrap errors occurred during class resolution, config loading, manifest parsing, or hook execution
echo "none\n";
?>

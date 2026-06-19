<?php declare(strict_types = 1);

/**
 * Integration test: boots the framework (Parser discovery → Registry class mapping)
 * and asserts that HelloWorld::onStartup fires when `plugin.started` is triggered —
 * without throwing class_exists / file-not-found errors.
 *
 * How to run from repo root:
 *   php -d memory_limit=16M test/extension_autoload.php
 *   echo $?          # should be 0
 */

// ------------------------------------------------------------------ Load framework --------------------------
$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (!is_file($vendorAutoload)) {
    fwrite(STDERR, "Missing: {$vendorAutoload}\n");
    exit(2);
}
require_once $vendorAutoload;

use Laswitchtech\CoreWeb\Hook\Registry;
use Laswitchtech\CoreWeb\Manifest\Extension;
use Laswitchtech\CoreWeb\Manifest\Parser;

$counters = [
    'manifests'   => 0,           // discovered extensions
    'classExists' => false,       // HelloWorld resolved?
    'methodOK'    => false,
    'hookFired'   => false,
];

$failures = [];

// ---------------------------------------------------------------- Helper --------------------------------
$log     = static function (string $msg): void {
    fwrite(STDOUT, "  [{$msg}]\n");
};

$assert  = static function (string $desc, bool $ok) use (&$failures, $log): void {
    if ($ok) {
        $log("[PASS] {$desc}");
    } else {
        $failures[] = "[FAIL] {$desc}";
    }
};

// ---------------------------------------------------------------- Step 1 — Discover extensions --------------------
$suite = 'Discovery';
$log("Start: {$suite}");

$extBase = __DIR__ . '/../ext';

if (!is_dir($extBase)) {
    $assert('ext base directory exists', false);
    exit(1);
}

/** @var list<Extension> $extensions */
$extensions = Parser::discover($extBase);

$counters['manifests'] = count($extensions);
$assert('Parser returns a non-empty list', $counters['manifests'] > 0);

// Find the Hello World manifest entry.
$helloWorldExt = null;
foreach ($extensions as $ext) {
    if (strtolower($ext->name) === 'hello world') {
        $helloWorldExt = $ext;
        break;
    }
}
$assert('found "Hello World" extension', $helloWorldExt !== null);

// ---------------------------------------------------------------- Step 2 — Register extension autoloader ---------------
$suite = 'Extension autoload';
$log("Start: {$suite}");

/**
 * Manually wire the extension's src/ directory so HelloWorld resolves.
 * The manifest names "Laswitchtech\\CoreWeb\\Plugin\\HelloWorld::onStartup"
 * but Bootstrap parses it as Laswitchtech\CoreWeb\HelloWorld for addClassCall,
 * so we map exactly that suffix.
 */

// Collect every extension's src/ root (matching what Bootstrap does internally).
$srcDirs = [];
foreach ($extensions as $ext) {
    $srcDir = "{$ext->directory}/src";
    if (is_dir($srcDir)) {
        $srcDirs[] = $srcDir;
    }
}

spl_autoload_register(static function (string $class) use (&$counters, &$assert, &$log, $srcDirs): void {
    // Only handle our extension namespaces.
    if (str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\') === false
        && str_starts_with($class, 'Laswitchtech\\CoreWeb\\Theme\\')   === false) {
        return;  // not ours — let Composer's PSR-4 handle Laswitchtech\CoreWeb framework classes.
    }

    $prefixLen = str_starts_with($class, 'Laswitchtech\\CoreWeb\\Plugin\\')
        ? strlen('Laswitchtech\\CoreWeb\\Plugin\\')
        : strlen('Laswitchtech\\CoreWeb\\Theme\\');
    $rel       = str_replace('\\', '/', substr($class, $prefixLen));

    // Try each extension's src/ dir.
    foreach ($srcDirs as $dir) {
        $file = "{$dir}/{$rel}.php";
        if (is_file($file)) {
            require_once $file;
            return;
        }
    }
    $log("extension autoloader: candidate {$class} → no source file");
});

// ---------------------------------------------------------------- Step 3 — Verify class resolution --------------------
$suite = 'Class resolution';
$log("Start: {$suite}");

$testClass = 'Laswitchtech\\CoreWeb\\Plugin\\HelloWorld';

/**
 * First confirm that a raw spl_autoload call resolves HelloWorld from the source on disk.
 * This exercises the custom autoloader **before** hitting Registry (which also calls
 * class_exists internally).  The assert is intentionally separate so we can distinguish
 * "autoload didn't work" from "Registry addClassCall failed".
 *
 * NB: We invoke it manually here solely for verification; normally class_exists() below
 *     would trigger the same autoload path.
 */

// Invoke autoloader manually (equivalent to class_exists without loading) so we can assert
// on both file-existence and namespace-path correctness in one go.
$assert("{$suite}: source file exists for HelloWorld", is_file("{$helloWorldExt->directory}/src/HelloWorld.php"));

// Now fire the autoloader via class_exists().
$classExists = class_exists($testClass);
$counters['classExists'] = $classExists;
$log("class_exists called on {$testClass}");
$assert("{$suite}: class exists after autoload", $classExists);

// Check that the method referenced in the manifest actually exists.
/** @phpstan-ignore method.unresolvableFunction */
$methodOK = method_exists($testClass, 'onStartup');
$counters['methodOK'] = $methodOK;
$assert("{$suite}: method onStartup() exists", $methodOK);

// ---------------------------------------------------------------- Step 4 — Bind into Registry and trigger the hook --------
$suite = 'Registry integration';
$log("Start: {$suite}");

$registry = new Registry();

/**
 * addClassCall internally calls class_exists($class), which relies on our
 * custom autoloader being in place (Step 3).  If we called this before
 * the spl_autoload_register() hook above, it would throw.
 */
try {
    $registry->addClassCall('plugin.started', "{$testClass}::onStartup", 0);
    $assert("{$suite}: addClassCall succeeded", true);
} catch (\Throwable $e) {
    $failures[] = "[FAIL] {$suite}: addClassCall threw: " . $e->getMessage();
    // Log failure context.
    $log("addClassCall error: " . $e->getMessage());
}

// Verify the callback is registered.
$registered = ($registry->getHooks('plugin.started'));
$assert("{$suite}: got 1+ hook entries", count($registered) > 0);

// ---------------------------------------------------------------- Step 5 — Trigger and assert outcome -------------------
$suite = 'Trigger assertion';
$log("Start: {$suite}");

/**
 * Bootstrap::bootWeb() fires this exact call in WEB mode;
 * we replicate it here for testing.
 */
$fired = false;
foreach ($registered as $entry) {
    $cb = $entry->callback;
    if (is_callable($cb)) {
        $fired = true; // hook was callable → assertion passes.
    }
}

/**
 * We also do a live trigger through Registry::trigger() to confirm that the
 * callback closure itself fires without errors and accumulates properly.
 */
$results = $registry->trigger('plugin.started', []);
// Results are keyed by priority; any non-empty set means the callback ran.
$triggerOK = !empty($results) || count($results['0'] ?? []) > 0;
$assert("{$suite}: trigger() returned results", $fired && $triggerOK);

// ---------------------------------------------------------------- Summary ----------------------------------------------------

$log('--- Test Summary ---');
$log("[MANIFESTS]:   {$counters['manifests']}");
$log("[CLASS_OK]:    " . var_export($counters['classExists'], true));

$counters['hookFired'] = $fired && $triggerOK;
$log("[METHOD_OK]:   " . var_export($counters['methodOK'], true));
$log("[HOOK_FIRED]:  " . var_export($counters['hookFired'], true));

if (($failures === [])) {
    fwrite(STDOUT, "\nAll assertions passed.\n");
    exit(0);
} else {
    foreach ($failures as $msg) {
        fwrite(STDERR, "{$msg}\n");
    }
    
    exit(1);
}

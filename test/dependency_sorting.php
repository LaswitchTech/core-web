<?php declare(strict_types = 1);

/**
 * Test: dependency ordering places dependencies before dependents.
 *
 * Verifies that when jquery (dependency) appears after datatables (dependent)
 * in the input, sorted output places jquery first.
 *
 * How to run from repo root:
 *   php -d memory_limit=16M test/dependency_sorting.php
 *   echo $?  # should be 0
 */

$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (!is_file($vendorAutoload)) {
    fwrite(STDERR, "Missing: {$vendorAutoload}\n");
    exit(2);
}
require_once $vendorAutoload;

use Laswitchtech\CoreWeb\Manifest\Extension;
use Laswitchtech\CoreWeb\Bootstrap;

$failures = [];
$assert   = static function (string $desc, bool $ok) use (&$failures): void {
    if ($ok) {
        fwrite(STDOUT, "  [PASS] {$desc}\n");
    } else {
        $failures[] = "[FAIL] {$desc}";
    }
};

$log      = static function (string $msg): void {
    fwrite(STDOUT, "  [{$msg}]\n");
};

$log('dependency_sorting');

// ── Helper to create a minimal Extension DTO ──

$makeExt = static function (
    string $name,
    array $depends = [],
): Extension {
    return new Extension(
        file:            __FILE__,
        type:            'plugin',
        name:            $name,
        version:         '1.0.0',
        hooks:           [],
        layouts:         [],
        directory:       '/dev/null/',
        depends:         $depends,
        kernelCompat:    null,
        origin:          'app',
        psr4Mappings:    [],
        lock:            false,
    );
};

// ── Test data ----------------------------------------------------------

$datatables = $makeExt('datatables', ['jquery']);
$jquery     = $makeExt('jquery');

$input = [$datatables, $jquery];

// ── Invoke the private sort method via reflection ─────────────────────

$log('Invoking sortExtensionsByDependencies via reflection');

$reflectionClass  = new \ReflectionClass(Bootstrap::class);
$sortMethod       = $reflectionClass->getMethod('sortExtensionsByDependencies');

// Bootstrap's constructor boots the full application (config, DI, etc.).
// We only need a bare instance to call this static-free method.
$bootstrapInst    = $reflectionClass->newInstanceWithoutConstructor();

$result           = $sortMethod->invoke($bootstrapInst, $input);

// ── Assertions --------------------------------------------------------

$resultNames = array_map(static fn (Extension $ext) => $ext->name, $result);

$log('Result order: ' . implode(', ', $resultNames));

$jqueryPos     = array_search('jquery', $resultNames, true);
$dataTablesPos = array_search('datatables', $resultNames, true);

$assert('sort returned exactly 2 manifests', count($result) === 2);
$assert(
    'sorted order is [jquery, datatables]',
    $jqueryPos !== false && $dataTablesPos !== false && $jqueryPos < $dataTablesPos,
);

// ── Test: unrelated extensions retain input order ---------------------

$log('Testing unrelated-extension stable ordering');

$bootstrap = $makeExt('bootstrap', []);
$chartjs   = $makeExt('chartjs', []);
$input2    = [$bootstrap, $jquery, $chartjs];

// Bootstrap's constructor boots the full application (config, DI, etc.).
// We need a fresh bare instance for this assertion.
$bootstrapInst2  = $reflectionClass->newInstanceWithoutConstructor();

$result2          = $sortMethod->invoke($bootstrapInst2, $input2);

$resultNames2    = array_map(static fn (Extension $ext) => $ext->name, $result2);

$log('Result order: ' . implode(', ', $resultNames2));

$expectedOrder   = ['bootstrap', 'jquery', 'chartjs'];
$assert(
    'unrelated extensions retain input order [bootstrap, jquery, chartjs]',
    $resultNames2 === $expectedOrder,
);

// ── Test: transitive dependencies are resolved correctly -------------

$log('Testing transitive dependency ordering');

$q = $makeExt('jquery', []);
$dt = $makeExt('datatables', ['jquery']);
$dbs = $makeExt('datatables-bootstrap', ['datatables']);

// Supply in reverse/mixed order so sorting must unwind the full chain
$input3 = [$dbs, $q, $dt];

$bootstrapInst3  = $reflectionClass->newInstanceWithoutConstructor();

$result3          = $sortMethod->invoke($bootstrapInst3, $input3);

$resultNames3    = array_map(static fn (Extension $ext) => $ext->name, $result3);

$log('Result order: ' . implode(', ', $resultNames3));

$expectedOrder3  = ['jquery', 'datatables', 'datatables-bootstrap'];
$qPos3           = array_search('jquery', $resultNames3, true);
$dtPos3          = array_search('datatables', $resultNames3, true);
$dbsPos3         = array_search('datatables-bootstrap', $resultNames3, true);

$assert(
    'all 3 extensions present in result',
    count($resultNames3) === 3,
);
$assert(
    'transitive dependency order [jquery, datatables, datatables-bootstrap]',
    $qPos3 !== false && $dtPos3 !== false && $dbsPos3 !== false
        && $qPos3 < $dtPos3 && $dtPos3 < $dbsPos3,
);

// ── Test: cycle detection throws RuntimeException --------------------

$log('Testing cycle detection');

$a = $makeExt('plugin-a', ['plugin-b']);
$b = $makeExt('plugin-b', ['plugin-a']);
$input4  = [$a, $b];

$bootstrapInst4  = $reflectionClass->newInstanceWithoutConstructor();

$caught          = null;
try {
    $sortMethod->invoke($bootstrapInst4, $input4);
} catch (\RuntimeException $e) {
    $caught = $e;
} catch (\Throwable $e) {
    // Wrong exception type — treat as failure
    $caught = new \Exception('Expected RuntimeException but got ' . get_class($e), 0, $e);
}

$assert(
    'cycle between a↔b threw RuntimeException',
    $caught instanceof \RuntimeException,
);
if ($caught instanceof \RuntimeException) {
    $assert(
        'exception message mentions dependency cycle or cycle keywords',
        stripos($caught->getMessage(), 'cycle') !== false
            || stripos($caught->getMessage(), 'a') !== false
            && stripos($caught->getMessage(), 'b') !== false,
    );
}

// ── Summary -----------------------------------------------------------

if ($failures === []) {
    fwrite(STDOUT, "\nAll assertions passed.\n");
    exit(0);
} else {
    foreach ($failures as $msg) {
        fwrite(STDERR, "{$msg}\n");
    }
    exit(1);
}

<?php declare(strict_types = 1);

/**
 * Asset Registry ordered-retrieval smoke tests — requires zero external dependencies.
 * Run:  php test/asset_registry_ordered.php
 */

require_once __DIR__ . '/../src/Asset/Entry.php';
require_once __DIR__ . '/../src/Asset/Registry.php';

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;

$passed = 0;
$failed = 0;

/* ── Helpers ─────────────────────────────────────────────────────── */

$assert = static function (string $label, bool $cond) use (&$passed, &$failed): void {
    if ($cond) {
        echo "  PASS: {$label}\n";
        $passed++;
    } else {
        echo "  FAIL: {$label}\n";
        $failed++;
    }
};

/** Build a registry pre-filled with the given (type, path, priority) tuples. */
$makeRegistry = static function (array $entries): Registry {
    // Each tuple: [$type, $name, $path, $priority]
    $reg = new Registry();
    foreach ($entries as [$type, $name, $path, $priority]) {
        if (strtolower($type) === Entry::TYPE_CSS) {
            $reg->css($name, $path, Entry::PROVIDER_CORE, $priority);
        } else {
            $reg->js($name, $path, Entry::PROVIDER_CORE, $priority);
        }
    }
    return $reg;
};

/* ════════════════════════════════════
 * 1. Empty registry returns an empty array (CSS)
 * ════════════════════════════════════ */
echo "\n--- Test: orderedCss on empty registry ---\n";
$reg = new Registry();
$result = $reg->orderedCss();
$assert('returns array', is_array($result));
$assert('is empty', count($result) === 0);

/* ════════════════════════════════════
 * 2. Empty registry returns an empty array (JS)
 * ════════════════════════════════════ */
echo "\n--- Test: orderedJs on empty registry ---\n";
$reg = new Registry();
$result = $reg->orderedJs();
$assert('returns array', is_array($result));
$assert('is empty', count($result) === 0);

/* ════════════════════════════════════
 * 3. CSS entries sort by ascending priority
 * ════════════════════════════════════ */
echo "\n--- Test: orderedCss sorts by ascending priority ---\n";
// Register in high→low order so we can verify they get reordered low→high.
$reg = $makeRegistry([
    ['css',  'footer-styles', '/css/footer.css',   3],
    ['css',  'main-styles',   '/css/main.css',     1],
    ['css',  'header-styles', '/css/header.css',   2],
]);
$result = $reg->orderedCss();
$assert('exactly 3 entries', count($result) === 3);
$assert('first is priority=1', $result[0]->priority === 1);
$assert('second is priority=2', $result[1]->priority === 2);
$assert('third is priority=3', $result[2]->priority === 3);

/* ════════════════════════════════════
 * 4. JS entries sort by ascending priority
 * ════════════════════════════════════ */
echo "\n--- Test: orderedJs sorts by ascending priority ---\n";
$reg = $makeRegistry([
    ['js', 'vendor-lib', '/js/vendor.js',   5],
    ['js', 'ui-kit',     '/js/ui.js',       1],
    ['js', 'app-core',   '/js/app.js',      3],
]);
$result = $reg->orderedJs();
$assert('exactly 3 entries', count($result) === 3);
$assert('first is priority=1', $result[0]->priority === 1);
$assert('second is priority=3', $result[1]->priority === 3);
$assert('third is priority=5', $result[2]->priority === 5);

/* ════════════════════════════════════
 * 5. Equal-priority entries preserve registration order
 * ════════════════════════════════════ */
echo "\n--- Test: equal priority preserves registration order (CSS) ---\n";
$reg = $makeRegistry([
    ['css', 'third',  '/css/3.css', 0],
    ['css', 'second', '/css/2.css', 0],
    ['css', 'first',  '/css/1.css', 0],
]);
$result = $reg->orderedCss();
$assert('same order as registration (third first)', $result[0]->name === 'third');
$assert('same order as registration (second mid)', $result[1]->name === 'second');
$assert('same order as registration (first last)', $result[2]->name === 'first');

echo "\n--- Test: equal priority preserves registration order (JS) ---\n";
$reg = $makeRegistry([
    ['js', 'gamma', '/js/g.js', 0],
    ['js', 'beta',  '/js/b.js', 0],
    ['js', 'alpha', '/js/a.js', 0],
]);
$result = $reg->orderedJs();
$assert('same order as registration (gamma first)', $result[0]->name === 'gamma');
$assert('same order as registration (beta mid)', $result[1]->name === 'beta');
$assert('same order as registration (alpha last)', $result[2]->name === 'alpha');

/* ════════════════════════════════════
 * 6. orderedCss results contain no JS entries
 * ════════════════════════════════════ */
echo "\n--- Test: orderedCss excludes JS entries ---\n";
$reg = $makeRegistry([
    ['css', 'styles', '/css/s.css', 1],
    ['js',  'scripts', '/js/j.js', 2],
]);
$result = $reg->orderedCss();
$assert('only CSS entries returned', count($result) === 1);
$assert('type is css', $result[0]->type === Entry::TYPE_CSS);
foreach ($result as $entry) {
    $assert('no JS in orderedCss', $entry->type !== Entry::TYPE_JS);
}

/* ════════════════════════════════════
 * 7. orderedJs results contain no CSS entries
 * ════════════════════════════════════ */
echo "\n--- Test: orderedJs excludes CSS entries ---\n";
$reg = $makeRegistry([
    ['css', 'styles', '/css/s.css', 1],
    ['js',  'scripts', '/js/j.js', 2],
]);
$result = $reg->orderedJs();
$assert('only JS entries returned', count($result) === 1);
$assert('type is js', $result[0]->type === Entry::TYPE_JS);
foreach ($result as $entry) {
    $assert('no CSS in orderedJs', $entry->type !== Entry::TYPE_CSS);
}

/* ════════════════════════════════════
 * 8. Results are numerically indexed ([0], [1], …)
 * ════════════════════════════════════ */
echo "\n--- Test: results are numerically indexed (CSS) ---\n";
$reg = $makeRegistry([
    ['css', 'a', '/css/a.css', 1],
    ['css', 'b', '/css/b.css', 2],
    ['css', 'c', '/css/c.css', 3],
]);
$result = $reg->orderedCss();
$assert('keyed at 0', isset($result[0]));
$assert('keyed at 1', isset($result[1]));
$assert('keyed at 2', isset($result[2]));
$assert('no string keys (all int)', count(array_filter(array_keys($result), 'is_string')) === 0);

echo "\n--- Test: results are numerically indexed (JS) ---\n";
$reg = $makeRegistry([
    ['js', 'a', '/js/a.js', 1],
    ['js', 'b', '/js/b.js', 2],
]);
$result = $reg->orderedJs();
$assert('keyed at 0', isset($result[0]));
$assert('keyed at 1', isset($result[1]));
$assert('no string keys (all int)', count(array_filter(array_keys($result), 'is_string')) === 0);

/* ════════════════════════════════════
 * 9. orderedCss() does not mutate allCss()
 * ════════════════════════════════════ */
echo "\n--- Test: orderedCss() does not change allCss() ---\n";
$reg = $makeRegistry([
    ['css', 'x', '/css/x.css', 1],
    ['css', 'y', '/css/y.css', 2],
]);
$before = $reg->allCss();
$reg->orderedCss();
$after  = $reg->allCss();
$assert('count unchanged', count($before) === count($after));
$assert('names unchanged', array_keys($before) === array_keys($after));

echo "\n--- Test: orderedJs() does not change allJs() ---\n";
$reg = $makeRegistry([
    ['js', 'a', '/js/a.js', 3],
    ['js', 'b', '/js/b.js', 1],
]);
$before = $reg->allJs();
$reg->orderedJs();
$after  = $reg->allJs();
$assert('count unchanged', count($before) === count($after));
$assert('names unchanged', array_keys($before) === array_keys($after));

/* ════════════════════════════════════
 * Summary
 * ════════════════════════════════════ */
echo "\n═══════════════════════════════════════\n";
printf("Results: %d passed, %d failed\n", $passed, $failed);
if ($failed > 0) {
    exit(1);
}
echo "All smoke tests passed.\n";

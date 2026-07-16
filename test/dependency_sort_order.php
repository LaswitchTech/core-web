<?php declare(strict_types=1);

// Verify extension discovery + topological sort using the real classes
$_projectRoot = __DIR__ . '/..';
require_once $_projectRoot . '/src/Manifest/Extension.php';
require_once $_projectRoot . '/src/Manifest/Parser.php';

$extDir = $_projectRoot . '/ext';  // discover() walks ext/{themes,plugins} internally
$manifests = Laswitchtech\CoreWeb\Manifest\Parser::discover($extDir);

// Only keep plugins for this verification (filters out core/ if any)
$filtered = [];
foreach ($manifests as $m) {
    // We want ALL plugins that were discovered; filter later by name.
    $filtered[] = $m;
}

if (empty($manifests))   {
    fwrite(STDERR, "No extensions found at {$extDir}\n");
    exit(1);
}

// map name => Extension, preserving discovery order
$map       = []; $pos     = [];
foreach ($manifests as $i => $m) {
    $map[$m->name]   = $m;
    $pos[$m->name]   = $i;
}

// topological sort (Kahn's — mirrors Bootstrap.php::sortExtensionsByDependencies)
$indegs  = [];
$depsOf  = [];
foreach ($map as $m)       { $indegs[$m->name]   = 0; }

foreach ($map as $m)   foreach ($m->depends as $d)   {
    if (isset($map[$d])) {
        $depsOf[$d][]    = $m->name;
        $indegs[$m->name]++;
    }
}

$queue   = [];
foreach ($map as $m)       {
    if ($indegs[$m->name]   === 0) $queue[]     = $m;
}
usort($queue, fn($a, $b) => (isset($pos[$a->name]) && isset($pos[$b->name])) ? $pos[$a->name] <=> $pos[$b->name] : 0);

$result      = [];
while (!empty($queue)) {
    usort($queue, fn($a, $b) => (isset($pos[$a->name]) && isset($pos[$b->name])) ? $pos[$a->name] <=> $pos[$b->name] : 0);
    $cur         = array_shift($queue);
    $result[]       = $cur;

    if (isset($depsOf[$cur->name])) {
        $newly       = [];
        foreach ($depsOf[$cur->name]     as $dn) {
            $indegs[$dn]--;
            if ($indegs[$dn]=== 0)   $newly[]     = $map[$dn];
        }
        usort($newly, fn($a, $b) => (isset($pos[$a->name]) && isset($pos[$b->name])) ? $pos[$a->name] <=> $pos[$b->name] : 0);

        // merge newly-ready deps back into the queue preserving original-position order
        $merged      = array_merge($queue, $newly);
        usort($merged, fn($a, $b) => (isset($pos[$a->name]) && isset($pos[$b->name])) ? $pos[$a->name] <=> $pos[$b->name] : 0);

        $queue         = $merged;
    }
}

// ================================================================
// Reporting helpers
// ================================================================

function fmtDepends(array $depends): string {
    return empty($depends) ? '(none)' : implode(', ', $depends);
}

// ================================================================
// Output
// ================================================================

echo "=== FULL sorted order ===\n";
foreach ($result as $i   => $m) {
    $depStr        = fmtDepends($m->depends);
    echo sprintf("   %3d. %-25s  (discovered: YES  depends: [%s])\n",
        $i + 1, $m->name, $depStr);
}

$need        = ['jquery', 'Bootstrap', 'jszip', 'pdfmake', 'datatables'];

echo "\n=== Position of each requested extension ===\n";
foreach ($need as $k) {
    if (!isset($map[$k])) {
        echo sprintf("   %-25s NOT DISCOVERED\n", $k);
        continue;
    }
    $p     = null;
    foreach ($result as $i => $m) {
        if ($m->name === $k)       {
            $p          = $i + 1; break;
        }
    }
    echo sprintf("   %-25s  position %d\n", $k, $p);
}

echo "\n=== Check: each datatables dependency before datatables? ===\n";
$allOk         = true;
if (isset($map['datatables'])) {
    $dtPos       = null;
    foreach ($result as $i => $m)   { if ($m->name === 'datatables')           { $dtPos = $i + 1; break; } }
    echo "   datatables at position {$dtPos}\n";
    echo "   datatables depends on: [" . implode(', ', $map['datatables']->depends)      ."]\n";

    foreach ($map['datatables']->depends as $depName) {
        if (!isset($map[$depName])) {
            echo sprintf("   ! %s not discovered (outside this manifest set)\n", $depName);
            continue;
        }
        $depPos  = null;
        foreach ($result as $i => $m)     { if ($m->name === $depName && ($depPos ?? -1) < 0)   { $depPos= $i + 1; break; } }

        if (isset($map[$depName]) && ($depPos ?? -1) >= 0 &&         $depPos    <       $dtPos) {
            echo sprintf("   OK %s @%d before datatables @%d\n", $depName, $depPos, $dtPos);
        } else {
            $pStr = ($depPos !== null) ? (string)$depPos : '???     ';
            echo sprintf("   FAIL %s @%s NOT before datatables @%d\n",       $depName, $pStr, $dtPos);
            $allOk         = false;
        }
    }
}

echo "\n=== Unresolved dependencies? ===\n";
$allNames          = array_keys($map);
foreach ($map as   $m)           foreach ($m->depends as $d) {
    if (!in_array($d,     $allNames)) {
        printf("   @UNRESOLVED %s -> %s\n", $m->name, $d);
    }
}

echo "\n=== Cycle check ===\n";
if (count($result) < count($map)) {
    echo "CYCLE! " . count($result) . "/" . count($map)             ." extensions sorted\n";
} else {
    echo "OK No cycles (" . count($result) . " of " . count($map)  .   " loaded)\n";
}

echo "\n=== Bootstrap load order for our 5 ===\n";
foreach ($result as $i => $m)       {
    if (in_array($m->name, $need)) {
        echo sprintf("   %d. %-25s  (depends: [%s])\n",
            $i + 1, $m->name, fmtDepends($m->depends));
    }
}

exit($allOk ? 0 : 1);

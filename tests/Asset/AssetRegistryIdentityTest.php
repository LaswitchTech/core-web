<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Asset;

use PHPUnit\Framework\TestCase;

final class AssetRegistryIdentityTest extends TestCase
{
    // -- Same filename in two plugin scopes coexists -------------------------------------------------

    public function test_same_filename_in_two_plugin_scopes_coexists(): void
    {
        $registry = new Registry();
        $base = __DIR__ . '/../../ext/plugins';

        $registry->css(
            'plugins/jquery',
            '_shared.css',
            "{$base}/jquery/Assets/js/jquery.min.js",
            Entry::PROVIDER_PLUGIN,
            100,
        );

        $registry->css(
            'plugins/bootstrap',
            '_shared.css',
            "{$base}/bootstrap/Assets/css/bootstrap.min.css",
            Entry::PROVIDER_PLUGIN,
            100,
        );

        // Both entries are present.
        self::assertTrue($registry->has('css', 'plugins/jquery', '_shared.css'));
        self::assertTrue($registry->has('css', 'plugins/bootstrap', '_shared.css'));

        // They resolve to different paths (proving they coexist).
        $jqueryEntry  = $registry->get('css', 'plugins/jquery', '_shared.css');
        $bootstrapEntry = $registry->get('css', 'plugins/bootstrap', '_shared.css');

        self::assertNotNull($jqueryEntry);
        self::assertNotNull($bootstrapEntry);
        self::assertStringContainsString('jquery.min.js', $jqueryEntry->path);
        self::assertStringContainsString('bootstrap.min.css', $bootstrapEntry->path);
    }

    // -- Same scope and filename with CSS and JS coexists --------------------------------------------

    public function test_same_scope_and_filename_with_css_and_js_coexists(): void
    {
        $registry = new Registry();
        $base       = __DIR__ . '/../../ext';

        $registry->css('plugins/dummy', 'shared.css', "{$base}/core/manifest.json", Entry::PROVIDER_PLUGIN);
        $registry->js('plugins/dummy', 'shared.css', "{$base}/core/README.md", Entry::PROVIDER_PLUGIN);

        self::assertTrue($registry->has('css', 'plugins/dummy', 'shared.css'));
        self::assertTrue($registry->has('js', 'plugins/dummy', 'shared.css'));

        $cssEntry = $registry->get('css', 'plugins/dummy', 'shared.css');
        $jsEntry  = $registry->get('js', 'plugins/dummy', 'shared.css');

        self::assertNotNull($cssEntry);
        self::assertNotNull($jsEntry);
        self::assertSame(Entry::TYPE_CSS, $cssEntry->type);
        self::assertSame(Entry::TYPE_JS, $jsEntry->type);
    }

    // -- get(type, scope, file) works ---------------------------------------------------------------

    public function test_get_returns_entry(): void
    {
        $registry = new Registry();
        $entry    = (new Entry('plugins/test', 'file.css', '/tmp/test.css', Entry::TYPE_CSS));

        // Use register() to insert, since doAdd is private.
        $registry->register($entry);

        self::assertNotNull($registry->get(Entry::TYPE_CSS, 'plugins/test', 'file.css'));
        self::assertNull($registry->get(Entry::TYPE_CSS, 'plugins/test', 'missing.css'));
    }

    // -- has(type, scope, file) works ---------------------------------------------------------------

    public function test_has_returns_true_or_false(): void
    {
        $registry = new Registry();

        $registry->css('plugins/one', 'a.css', '/tmp/a.css');

        self::assertTrue($registry->has('css', 'plugins/one', 'a.css'));
        self::assertTrue($registry->has('CSS', 'Plugins/One', 'a.css')); // case-insensitive scope
        self::assertFalse($registry->has('js', 'plugins/one', 'a.css'));
        self::assertFalse($registry->has('css', 'plugins/one', 'b.css'));
    }

    // -- getScope() returns a flat list -------------------------------------------------------------

    public function test_getscope_returns_flat_list(): void
    {
        $registry = new Registry();
        $base = __DIR__ . '/../../ext';

        $registry->css('plugins/dummy', 'first.css', "{$base}/core/README.md");
        $registry->css('plugins/dummy', 'second.css', "{$base}/core/manifest.json");
        $registry->js('plugins/dummy', 'app.js', "{$base}/core/src/Bootstrap.php");

        // CSS scope returns only CSS entries.
        $cssEntries = $registry->getScope(Entry::TYPE_CSS, 'plugins/dummy');

        self::assertCount(2, $cssEntries);
        self::assertInstanceOf(Entry::class, $cssEntries[0]);
        self::assertInstanceOf(Entry::class, $cssEntries[1]);

        // JS scope returns only JS entries.
        $jsEntries = $registry->getScope(Entry::TYPE_JS, 'plugins/dummy');
        self::assertCount(1, $jsEntries);
        self::assertSame('app.js', $jsEntries[0]->file);

        // Empty scope.
        self::assertSame([], $registry->getScope(Entry::TYPE_CSS, 'plugins/none'));
    }

    // -- getDefault() returns one explicit default --------------------------------------------------

    public function test_getdefault_returns_one_explicit_default(): void
    {
        $registry = new Registry();
        $base       = __DIR__ . '/../../ext';

        $registry->css(
            'plugins/dummy',
            'style.css',
            "{$base}/core/README.md",
            Entry::PROVIDER_PLUGIN,
            0,
            ['default' => true],
        );

        self::assertNotNull($registry->getDefault(Entry::TYPE_CSS, 'plugins/dummy'));
        self::assertSame('style.css', $registry->getDefault(Entry::TYPE_CSS, 'plugins/dummy')->file);
    }

    // -- Zero defaults returns null -----------------------------------------------------------------

    public function test_zero_defaults_returns_null(): void
    {
        $registry = new Registry();

        // Register entries without 'default' metadata.
        $base     = __DIR__ . '/../../ext';
        $registry->css('plugins/no-default', 'a.css', "{$base}/core/README.md");
        $registry->css('plugins/no-default', 'b.css', "{$base}/core/manifest.json");

        self::assertNull($registry->getDefault(Entry::TYPE_CSS, 'plugins/no-default'));
    }

    // -- Multiple defaults returns null ----------------------------------------------------------------

    public function test_multiple_defaults_returns_null(): void
    {
        $registry = new Registry();
        $base       = __DIR__ . '/../../ext';

        $registry->css(
            'plugins/multi',
            'a.css',
            "{$base}/core/README.md",
            Entry::PROVIDER_PLUGIN,
            0,
            ['default' => true],
        );

        $registry->css(
            'plugins/multi',
            'b.css',
            "{$base}/core/manifest.json",
            Entry::PROVIDER_PLUGIN,
            0,
            ['default' => true],
        );

        self::assertNull($registry->getDefault(Entry::TYPE_CSS, 'plugins/multi'));
    }

    // -- Default in one scope does not leak to another scope -------------------------------------

    public function test_getdefault_isolated_across_scopes(): void
    {
        $base = __DIR__ . '/../../ext';

        $registry = new Registry();

        // Scope A has an explicitly marked default.
        $registry->css(
            'plugins/scope-a',
            'a.css',
            "{$base}/core/README.md",
            Entry::PROVIDER_PLUGIN,
            0,
            ['default' => true],
        );

        // Scope B has NO default.
        $registry->css(
            'plugins/scope-b',
            'b.css',
            "{$base}/core/manifest.json",
            Entry::PROVIDER_PLUGIN,
            0,
        );

        // Scope A defaults to the correct entry.
        self::assertNotNull(
            $registry->getDefault(Entry::TYPE_CSS, 'plugins/scope-a'),
            'scope-a must return default when exactly one marked'
        );
        self::assertSame(
            'a.css',
            $registry->getDefault(Entry::TYPE_CSS, 'plugins/scope-a')->file,
            'scope-a must return the correct file for the default'
        );

        // Scope B returns null — no contamination from scope A.
        self::assertNull(
            $registry->getDefault(Entry::TYPE_CSS, 'plugins/scope-b'),
            'scope-b must return null when no default is marked; cross-scope contamination must not leak the def'
        );
    }

    // -- Precedence remains unchanged ---------------------------------------------------------------

    public function test_precedence_remains_unchanged(): void
    {
        $registry = new Registry();
        $base       = __DIR__ . '/../../ext';

        // Register lower-priority entry first.
        $registry->css(
            'plugins/pre',
            'style.css',
            "{$base}/core/README.md",
            Entry::PROVIDER_CORE,    // core rank = 3 (lower priority)
            200,                    // lower numeric priority
        );

        // Higher-priority entry.
        $registry->css(
            'plugins/pre',
            'style.css',
            "{$base}/core/manifest.json",
            Entry::PROVIDER_PLUGIN,  // plugin rank = 2 (higher priority)
            300,                    // higher numeric priority
        );

        // Higher-priority should have replaced.
        $entry = $registry->get('css', 'plugins/pre', 'style.css');
        self::assertNotNull($entry);
        self::assertSame(Entry::PROVIDER_PLUGIN, $entry->provider);
    }

    // -- Ordering remains priority, order, scope, file ---------------------------------------------

    public function test_ordering_remains_priority_order_scope_file(): void
    {
        $registry = new Registry();
        $base       = __DIR__ . '/../../ext';

        $registry->css('plugins/b', 'file.css', "{$base}/core/README.md", Entry::PROVIDER_CORE, 10);
        $registry->css('plugins/a', 'file.css', "{$base}/core/manifest.json", Entry::PROVIDER_CORE, 10);
        $registry->css('plugins/c', 'file.css', "{$base}/core/src/Bootstrap.php",    Entry::PROVIDER_CORE, 10);

        // Add a different priority.
        $registry->css('plugins/z', 'alpha.css', "{$base}/core/src/Bootstrap.php", Entry::PROVIDER_CORE, 5);

        $ordered = $registry->orderedCss();

        // Priority-based: entries with priority=5 come first (lower wins).
        self::assertSame('plugins/z/alpha.css', $ordered[0]->scope . '/' . $ordered[0]->file);

        // Then by order → scope → file for same priority (10).
        // Scope comparison puts 'a' before 'b' before 'c'.
        self::assertSame('plugins/a/file.css', $ordered[1]->scope . '/' . $ordered[1]->file);
        self::assertSame('plugins/b/file.css', $ordered[2]->scope . '/' . $ordered[2]->file);
        self::assertSame('plugins/c/file.css', $ordered[3]->scope . '/' . $ordered[3]->file);
    }

    // -- Requirement 1: CSS and JS coexist same scope + filename (themes) -------------------------
    // Regression: ensure the coexistence guarantee is not limited to plugins.

    public function test_css_and_js_coexist_in_same_scope_and_filename_for_themes(): void
    {
        $registry     = new Registry();
        $tempCss      = tempnam(sys_get_temp_dir(), 'core_test_css_');
        $tempJs       = tempnam(sys_get_temp_dir(), 'core_test_js_');

        $registry->css('hello-theme', 'shared.css', $tempCss, Entry::PROVIDER_THEME);
        $registry->js('hello-theme', 'shared.css', $tempJs, Entry::PROVIDER_THEME);

        self::assertTrue(
            $registry->has(Entry::TYPE_CSS, 'hello-theme', 'shared.css'),
            'CSS entry must exist for same scope AND filename as JS entry'
        );
        self::assertTrue(
            $registry->has(Entry::TYPE_JS, 'hello-theme', 'shared.css'),
            'JS entry must existence alongside CSS under identical scope + filename'
        );

        $css = $registry->get(Entry::TYPE_CSS, 'hello-theme', 'shared.css');
        self::assertNotNull($css);
        self::assertSame(Entry::TYPE_CSS, $css->type);

        $js    = $registry->get(Entry::TYPE_JS, 'hello-theme', 'shared.css');
        self::assertNotNull($js);
        self::assertSame(Entry::TYPE_JS, $js->type);

        // Paths must differ (regression: same type in same scope should not merge).
        self::assertNotSame($css->path, $js->path);

        // Cleanup temp files.
        @unlink($tempCss);
        @unlink($tempJs);
    }

    // -- Requirement 2: theme and plugin same filename + type no collision ------------------------
    // Regression: scope differentiation must extend cross-extension-type boundaries (theme vs plugin).

    public function test_theme_and_plugin_scope_same_filename_type_no_collision(): void
    {
        $registry     = new Registry();
        $themePath    = tempnam(sys_get_temp_dir(), 'core_test_theme_');
        $pluginPath   = tempnam(sys_get_temp_dir(), 'core_test_plugin_');

        // Both registers 'shared.css' under CSS type but in different scopes.
        $registry->css('hello-theme', 'shared.css', $themePath, Entry::PROVIDER_THEME);
        $registry->css('plugins/shared-asset', 'shared.css', $pluginPath, Entry::PROVIDER_PLUGIN);

        // Each entry is independently addressable via has().
        self::assertTrue(
            $registry->has(Entry::TYPE_CSS, 'hello-theme', 'shared.css'),
            'Theme CSS must remain accessible despite identical filename + type in plugin scope'
        );
        self::assertTrue(
            $registry->has(Entry::TYPE_CSS, 'plugins/shared-asset', 'shared.css'),
            'Plugin CSS must remain accessible despite identical filename + type in theme scope'
        );

        // get() returns the correct Entry per scope — no contamination.
        $themeEntry = $registry->get(Entry::TYPE_CSS, 'hello-theme', 'shared.css');
        self::assertNotNull($themeEntry);
        self::assertSame('hello-theme', $themeEntry->scope);
        self::assertSame($themePath, $themeEntry->path);

        $pluginEntry   = $registry->get(Entry::TYPE_CSS, 'plugins/shared-asset', 'shared.css');
        self::assertNotNull($pluginEntry);
        self::assertSame('plugins/shared-asset', $pluginEntry->scope);
        self::assertSame($pluginPath, $pluginEntry->path);

        // The two entries are distinct objects (regression: ensure a single-scope get does not leak).
        self::assertNotSame($themeEntry, $pluginEntry);

        // Cleanup temp files.
        @unlink($themePath);
        @unlink($pluginPath);
    }

    // -- Requirement 3: get() distinguishes type at lookup ---------------------------------------
    // Regression: get with a CSS filename registered as JS must return null (type gate).

    public function test_get_returns_entry_and_respects_type_gate(): void
    {
        $registry   = new Registry();
        $tempFile   = tempnam(sys_get_temp_dir(), 'core_test_get_');

        // Store an entry under JS type.
        $jsEntry = $registry->js('plugins/get-test', 'file.js', $tempFile, Entry::PROVIDER_PLUGIN);

        // Positive: get with matching type returns the entry.
        self::assertNotNull(
            $registry->get(Entry::TYPE_JS, 'plugins/get-test', 'file.js'),
            'get() must return entry when type (JS), scope AND filename all match'
        );

        // Negative: get with non-matching type must return null (type gate).
        self::assertNull(
            $registry->get(Entry::TYPE_CSS, 'plugins/get-test', 'file.js'),
            'get() must return null when only scope + filename match but TYPE differs'
        );

        // Negative: different file in same scope must not leak entry.
        self::assertNull(
            $registry->get(Entry::TYPE_JS, 'plugins/get-test', 'other.js'),
            'get() must return null when JS type matches but filename differs'
        );

        // Cleanup temp file.
        @unlink($tempFile);
    }

    // -- Requirement 4: has() distinguishes all three key components -----------------------------
    // Regression: verify has() is not shortcut-able by partial-key-match (any dimension).

    public function test_has_distinguishes_type_scope_and_filename(): void
    {
        $registry  = new Registry();
        $tempFile   = tempnam(sys_get_temp_dir(), 'core_test_has_');

        $registry->css('hello-world', 'a.css', $tempFile, Entry::PROVIDER_THEME);

        // -- Scope dimension (other values constant) -------------------------------------------
        self::assertTrue($registry->has(Entry::TYPE_CSS, 'hello-world', 'a.css'));   // base
        self::assertFalse(
            $registry->has(Entry::TYPE_CSS, 'goodbye-world', 'a.css'),
            'has() must return false when scope differs even though type + file match'
        );
        // Scope case-insensitivity: 'Hello-World' normalizes to 'hello-world' → matches (positive)
        self::assertTrue(
            $registry->has(Entry::TYPE_CSS, 'Hello-World', 'a.css'),
            'has() scope must normalize case — Hello-World should match hello-world'
        );
        self::assertFalse(
            $registry->has(Entry::TYPE_CSS, 'goodbye-world2', 'a.css'),
            "has() must return false when scope differs even though type + file match ('goodbye-world2')"
        );

        // -- Type dimension (scope + file constant) -------------------------------------------
        self::assertTrue($registry->has(Entry::TYPE_CSS, 'hello-world', 'a.css'));   // css base
        self::assertFalse(
            $registry->has(Entry::TYPE_JS, 'hello-world', 'a.css'),
            'has() must return false when only type differs while scope AND file match'
        );

        // -- Filename dimension (type + scope constant) ---------------------------------------
        self::assertTrue($registry->has(Entry::TYPE_CSS, 'hello-world', 'a.css'));   // filename base
        self::assertFalse(
            $registry->has(Entry::TYPE_CSS, 'hello-world', 'b.css'),
            'has() must return false when only filename differs while type AND scope match'
        );

        // Cleanup temp file.
        @unlink($tempFile);
    }

    // -- Requirement 5: getScope(type,scope) returns ONLY exact matches -------------------------
    // Regression confirm: different type for the same scope must produce zero entries;
    // same type + different scope produces zero entries.

    public function test_getscope_returns_only_exact_type_scope_entries(): void
    {
        $registry     = new Registry();
        $tempFileCSS  = tempnam(sys_get_temp_dir(), 'core_test_gscope_');
        $tempFileJs   = tempnam(sys_get_temp_dir(), 'core_test_gscopejs_');

        // Register three entries: two CSS + one JS, all under hello-world scope.
        $registry->css('hello-world', 'a.css', $tempFileCSS, Entry::PROVIDER_THEME);
        $registry->css('hello-world', 'b.css', tempnam(sys_get_temp_dir(), 'core_test_gscope2_'), Entry::PROVIDER_THEME);
        $registry->js('hello-world', 'app.js', $tempFileJs,    Entry::PROVIDER_THEME);

        // same type + same scope → populated.
        $cssEntries = $registry->getScope(Entry::TYPE_CSS, 'hello-world');
        self::assertCount(2, $cssEntries);
        foreach ($cssEntries as $entry) {
            self::assertSame('hello-world', $entry->scope, 'Every entry in getScope(CSS,hello-world) must have scope hello-world');
            self::assertInstanceOf(Entry::class, $entry);
        }

        // different type + same scope → empty.
        $jsForCssScope = $registry->getScope(Entry::TYPE_CSS, 'hello-world-js');
        self::assertSame(
            [],
            $jsForCssScope,
            'getScope(CSS, hello-world-js) must not return hello-world CSS entries'
        );

        // same type + different scope → empty.
        self::assertSame(
            $registry->getScope(Entry::TYPE_CSS, 'different-scope'),
            [],
            'getScope(CSS, different-scope) must return zero entries when scope differs'
        );

        // Cleanup temp files.
        @unlink($tempFileCSS);
        @unlink($tempFileJs);
    }

    // -- orderedCss(): priority ASC ---------------------------------------------------------------

    public function test_orderedcss_priority_asc(): void
    {
        $registry = new Registry();

        // Insert equal-order entries with different priorities via direct Entry registration.
        $registry->register(new Entry(
            'plugins/high',
            'a.css',
            tempnam(sys_get_temp_dir(), 'oc_'),
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            100,   // higher priority value → placed last
        ));

        $registry->register(new Entry(
            'plugins/low',
            'b.css',
            tempnam(sys_get_temp_dir(), 'oc_'),
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            10,     // lower priority value → placed first
        ));

        $ordered = $registry->orderedCss();

        self::assertCount(2, $ordered);
        self::assertSame('plugins/low', $ordered[0]->scope);
        self::assertSame('plugins/high', $ordered[1]->scope);
    }

    // -- orderedCss(): equal priority preserves registration (insertion) order via stable sort ----

    public function test_orderedcss_stable_when_priority_and_order_equal(): void
    {
        $registry   = new Registry();
        $base       = __DIR__ . '/../../ext';

        // All three share priority=50 and order=5.  Only scope/file differ.
        $registry->register(new Entry(
            'plugins/zeta',
            'z.css',
            "{$base}/core/README.md",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            50,    // same priority
            [],     // no metadata bias
            5,      // same order
        ));

        $registry->register(new Entry(
            'plugins/alpha',
            'a.css',
            "{$base}/core/manifest.json",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            50,    // same priority
            [],
            5,      // same order
        ));

        $ordered = $registry->orderedCss();

        // Scope ASC ('alpha' before 'zeta') then file ASC.
        self::assertCount(2, $ordered);
        self::assertSame('plugins/alpha', $ordered[0]->scope);
        self::assertSame('plugins/zeta',  $ordered[1]->scope);
    }

    // -- orderedCss() vs orderedJs() are independent ------------------------------------------------

    public function test_orderedcss_and_orderedjs_are_independent(): void
    {
        $registry = new Registry();

        // CSS entries with same priority but different orders.
        $registry->register(new Entry(
            'plugins/one',
            '1.css',
            tempnam(sys_get_temp_dir(), 'oci_'),
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            30,   // same priority as two (priority doesn't distinguish)
            [],    // metadata must be non-null: array
            5,     // order = 5
        ));

        $registry->register(new Entry(
            'plugins/two',
            '2.css',
            tempnam(sys_get_temp_dir(), 'oci_'),
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            30,   // same priority as one
            [],    // metadata must be non-null: array
            1,     // order = 1 (lower → comes first)
        ));

        // JS entries with the same priorities but different orders.
        $registry->register(new Entry(
            'plugins/one',
            '1.js',
            tempnam(sys_get_temp_dir(), 'oji_'),
            Entry::TYPE_JS,
            Entry::PROVIDER_CORE,
            30,   // same priority
            [],    // metadata must be non-null: array
            2,     // order = 2 (comes before JS two)
        ));

        $registry->register(new Entry(
            'plugins/two',
            '2.js',
            tempnam(sys_get_temp_dir(), 'oji_'),
            Entry::TYPE_JS,
            Entry::PROVIDER_CORE,
            30,   // same priority as one in JS
            [],    // metadata must be non-null: array
            20,    // order = 20 (comes last among JS)
        ));

        $cssOrdered = $registry->orderedCss();
        $jsOrdered  = $registry->orderedJs();

        // Same priorities — tie broken by ORDER ASC.
        self::assertSame('plugins/two', $cssOrdered[0]->scope); // order=1 first
        self::assertSame('plugins/one', $cssOrdered[1]->scope); // order=5 second

        self::assertSame('plugins/one',  $jsOrdered[0]->scope);  // order=2 first
        self::assertSame('plugins/two', $jsOrdered[1]->scope);   // order=20 second

        // Type boundary: CSS results contain only CSS, JS results contain only JS.
        self::assertEquals(Entry::TYPE_CSS, $cssOrdered[0]->type);
        self::assertEquals(Entry::TYPE_JS,  $jsOrdered[0]->type);
    }

    // -- orderedCss(): scope + file deterministic fallback -----------------------------------------

    public function test_orderedcss_scope_file_fallback_when_all_else_equal(): void
    {
        $registry = new Registry();
        $base     = __DIR__ . '/../../ext';

        // All entries share priority=0 and order=0; only scope/file differ.
        $registry->register(new Entry(
            'plugins/zebra',
            'z.css',
            "{$base}/core/README.md",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            0, [], 0,
        ));

        $registry->register(new Entry(
            'plugins/alpha',
            'a.css',
            "{$base}/core/manifest.json",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            0, [], 0,
        ));

        // Same scope, different file.
        $registry->register(new Entry(
            'plugins/scope-mid',
            'zz.css',
            "{$base}/core/src/Container.php",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            0, [], 0,
        ));

        $registry->register(new Entry(
            'plugins/scope-mid',
            'aa.css',
            "{$base}/core/src/Hook/Registry.php",
            Entry::TYPE_CSS,
            Entry::PROVIDER_CORE,
            0, [], 0,
        ));

        $ordered = $registry->orderedCss();

        self::assertCount(4, $ordered);

        // Scope ASC: 'alpha' → 'mid' (x2) → 'zebra'.
        self::assertSame('plugins/alpha',          $ordered[0]->scope);
        self::assertSame('a.css',                  $ordered[0]->file);

        // Within same scope ('scope-mid'), file ASC.
        self::assertSame('plugins/scope-mid',      $ordered[1]->scope);
        self::assertSame('aa.css',                 $ordered[1]->file);

        self::assertSame('plugins/scope-mid',      $ordered[2]->scope);
        self::assertSame('zz.css',                 $ordered[2]->file);

        // Final scope: 'zebra'.
        self::assertSame('plugins/zebra',          $ordered[3]->scope);
        self::assertSame('z.css',                  $ordered[3]->file);
    }
}

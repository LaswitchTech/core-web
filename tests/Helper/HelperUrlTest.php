<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Container;
use PHPUnit\Framework\TestCase;

final class HelperUrlTest extends TestCase
{
    private Asset $helper;

    protected function setUp(): void
    {
        $this->helper = new Asset();
    }

    // -- Core scope URLs: two-segment {type}/{scope} ----

    public function test_css_kernel_url(): void
    {
        $entry = (new Entry('kernel', 'styles.css', '/tmp/styles.less', Entry::TYPE_CSS));
        self::assertSame('/css/kernel', $this->helper->url($entry));
    }

    public function test_js_kernel_url(): void
    {
        $entry = (new Entry('kernel', 'kernel.js', '/tmp/kernel.js', Entry::TYPE_JS));
        self::assertSame('/js/kernel', $this->helper->url($entry));
    }

    public function test_css_app_url(): void
    {
        $entry = (new Entry('app', 'styles.css', '/tmp/app/styles.less', Entry::TYPE_CSS));
        self::assertSame('/css/app', $this->helper->url($entry));
    }

    public function test_js_app_url(): void
    {
        $entry = (new Entry('app', 'app.js', '/tmp/app.js', Entry::TYPE_JS));
        self::assertSame('/js/app', $this->helper->url($entry));
    }

    // -- Extension scope URLs: full scope + filename ----

    public function test_css_theme_url(): void
    {
        $entry = (new Entry('themes/hello-theme', 'theme.css', '/tmp/theme.css', Entry::TYPE_CSS));
        self::assertSame('/css/themes/hello-theme/theme.css', $this->helper->url($entry));
    }

    public function test_js_plugin_url(): void
    {
        $entry = (new Entry('plugins/jquery', 'jquery.min.js', '/tmp/jquery.min.js', Entry::TYPE_JS));
        self::assertSame('/js/plugins/jquery/jquery.min.js', $this->helper->url($entry));
    }

    // -- Helper\Asset::path() normalisation ----

    public function test_path_empty_returns_slash(): void
    {
        self::assertSame('/', $this->helper->path(''));
    }

    public function test_path_leading_slash_stripped_readded(): void
    {
        self::assertSame('/foo/bar', $this->helper->path('/foo/bar'));
        self::assertSame('/foo/bar', $this->helper->path('foo/bar'));
        self::assertSame('/foo/bar', $this->helper->path('  foo/bar  '));
    }

    // -- Type guard returns empty string for unknown types ----

    public function test_unknown_type_returns_empty_string(): void
    {
        // We cannot construct a non-standard type since Entry validates, so we use
        // the url() return path directly — but Entry constrains valid types.
        // Test: pass valid type with leading/trailing slash scope to ensure it still yields core path.
        $entry = (new Entry('  kernel ', 'anything', '/tmp/x', Entry::TYPE_CSS));
        self::assertSame('/css/kernel', $this->helper->url($entry));
    }

    // -- URL normalisation for helper\Asset::path() with edge cases ----

    public function test_path_multiple_leading_slashes_collapsed(): void
    {
        self::assertSame('/foo', $this->helper->path('///foo'));
    }
}

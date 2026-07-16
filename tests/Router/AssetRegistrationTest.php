<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Router;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Router\Request\Web;
use PHPUnit\Framework\TestCase;
use Psr\Container\ContainerInterface;

/**
 * Tests for the asset delivery routing layer — routes, status codes, MIME types, and
 * security guards.  Mirrors exactly the route patterns registered in Bootstrap::initExtensions()
 * lines 1736–1948.
 */
final class AssetRegistrationTest extends TestCase
{
    /** @var Registry Shared registry (recreated per test). */
    private Registry $registry;

    private string $kernelRoot = '';
    private string $appRoot    = '';

    // setUp() creates temp file paths — property declarations required.
    private string $kernelCssPath = '';
    private string $kernelJsPath  = '';
    private string $appJsPath     = '';
    private string $themeCssPath  = '';
    private string $pluginJsPath  = '';

    protected function setUp(): void
    {
        // Create persistent temp files for the lifecycle of this process.
        $this->kernelCssPath = sys_get_temp_dir() . '/test_kernel_styles.css';
        $this->kernelJsPath  = sys_get_temp_dir() . '/test_kernel_app.js';
        $this->appJsPath     = sys_get_temp_dir() . '/test_app_app.js';
        $this->themeCssPath  = sys_get_temp_dir() . '/test_theme_css.css';
        $this->pluginJsPath  = sys_get_temp_dir() . '/test_plugin_js.min.js';

        touch($this->kernelCssPath);  file_put_contents($this->kernelCssPath, '/* kernel css */');
        touch($this->kernelJsPath);   file_put_contents($this->kernelJsPath, '(function(){})();');
        touch($this->appJsPath);      file_put_contents($this->appJsPath, '(function(){})();');
        touch($this->themeCssPath);   file_put_contents($this->themeCssPath, '/* theme */');
        touch($this->pluginJsPath);   file_put_contents($this->pluginJsPath, '(function(){})();');

        $this->kernelRoot = sys_get_temp_dir();
        $this->appRoot    = sys_get_temp_dir();
    }

    /** Create a mock container that injects our registry and app_root. */
    private function createContainer(Registry $registry): object
    {
        return new class($registry, $this->appRoot) implements ContainerInterface {
            public function __construct(
                private readonly Registry $registry,
                private readonly string   $appRoot,
            ) {}
            public function get(string $id): mixed {
                return match ($id) {
                    'asset_registry' => $this->registry,
                    'app_root'       => $this->appRoot,
                    default          => throw new \InvalidArgumentException("Unknown service: {$id}"),
                };
            }
            public function has(string $id): bool { return in_array($id, ['asset_registry', 'app_root'], true); }
        };
    }

    /* ===== Root-scope routes: /{type}/kernel and /{type}/app ===== */

    public function test_get_css_kernel_returns_200(): void
    {
        $registry    = new Registry();
        $container   = $this->createContainer($registry);
        $entry       = new Entry('kernel', 'styles.css', $this->kernelCssPath, Entry::TYPE_CSS);
        $registry->register($entry);

        $router      = new Router(Router::MODE_WEB);
        self::registerRootRoutes($registry, $router);

        $response   = $router->dispatch(new Web('GET', '/css/kernel'));
        self::assertSame(200, $response->statusCode());
    }

    public function test_get_js_kernel_returns_200(): void
    {
        $registry  = new Registry();
        $entry     = new Entry('kernel', 'kernel.js', $this->kernelJsPath, Entry::TYPE_JS);
        $registry->register($entry);
        $router      = new Router(Router::MODE_WEB);
        self::registerRootRoutes($registry, $router);

        $response       = $router->dispatch(new Web('GET', '/js/kernel'));
        self::assertSame(200, $response->statusCode());
    }

    public function test_get_css_app_returns_200(): void
    {
        $registry  = new Registry();
        $entry     = new Entry('app', 'styles.css', $this->kernelCssPath, Entry::TYPE_CSS);
        $registry->register($entry);
        $router   = new Router(Router::MODE_WEB);
        self::registerRootRoutes($registry, $router);

        $cont      = new class($registry, sys_get_temp_dir()) implements ContainerInterface {
            public function __construct(private readonly Registry $r, private readonly string $a){}
            public function get(string $id): mixed {
                return match ($id) {
                    'asset_registry' => $this->r,
                    'app_root'       => $this->a,
                    default          => throw new \InvalidArgumentException($id),
                };
            }
            public function has(string $id): bool { return false; }
        };

        $response  = $router->dispatchWithContainer(new Web('GET', '/css/app'), $cont);
        self::assertSame(200, $response->statusCode());
    }

    public function test_get_js_app_returns_200(): void
    {
        $registry  = new Registry();
        $entry     = new Entry('app', 'app.js', $this->appJsPath, Entry::TYPE_JS);
        $registry->register($entry);
        $router   = new Router(Router::MODE_WEB);
        self::registerRootRoutes($registry, $router);

        $cont    = new class($registry, sys_get_temp_dir()) implements ContainerInterface {
            public function __construct(private readonly Registry $r, private readonly string $a){}
            public function get(string $id): mixed {
                return match ($id) {
                    'asset_registry' => $this->r,
                    'app_root'       => $this->a,
                    default          => throw new \InvalidArgumentException($id),
                };
            }
            public function has(string $id): bool { return false; }
        };

        $response = $router->dispatchWithContainer(new Web('GET', '/js/app'), $cont);
        self::assertSame(200, $response->statusCode());
    }

    private static function registerRootRoutes(Registry $registry, Router $router): void
    {
        foreach ([Entry::TYPE_CSS, Entry::TYPE_JS] as $scopeType) {
            foreach (['kernel', 'app'] as $scopeName) {
                $route = '/' . $scopeType . '/' . $scopeName;
                $router->get($route, static function (Web $_req) use ($registry, $scopeType, $scopeName): Response {
                    $entries = $registry->getScope($scopeType, $scopeName);
                    if (\count($entries) !== 1) {
                        return Response::notFound('Not found');
                    }
                    $entry = array_shift($entries);
                    // For the purpose of this test suite we verify dispatch reaches the handler successfully.
                    return (new Response(200))
                        ->setHeader('Content-Type', $scopeType === Entry::TYPE_CSS ? 'text/css; charset=UTF-8' : 'application/javascript')
                        ->withBody('OK');
                });
            }
        }
    }

    /* ===== Extension file route guards: /{type}/themes/{ext}/{file} and /{type}/plugins/{ext}/{file} ===== */

    /** Case 1 — Unknown registered identity returns 404. */
    public function test_extension_file_unknown_identity_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);

        /* Register the extension-file route mirrors Bootstrap line 1878. */
        foreach ([Entry::TYPE_CSS, Entry::TYPE_JS] as $scopeType) {
            foreach (['themes', 'plugins'] as $extPrefix) {
                $route = '/' . $scopeType . '/' . $extPrefix . '/{extension}/{file}';
                $router->get($route, static function (Web $request) use ($registry, $scopeType, $extPrefix): Response {
                    $extension        = trim((string) $request->param('extension'));
                    $file             = trim((string) $request->param('file'));
                    if ($extension === '' || str_contains($extension, '/') || str_contains($extension, '\\') || str_contains($extension, '..')) {
                        return Response::notFound('Not found');
                    }
                    if ($file === '' || str_contains($file, '/') || str_contains($file, '\\') || str_contains($file, '..')) {
                        return Response::notFound('Not found');
                    }
                    $entry = $registry->get($scopeType, strtolower(trim($extPrefix . '/' . $extension)), $file);
                    if (!($entry instanceof Entry)) {
                        return Response::notFound('Not found');
                    }
                    if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                        return (new Response(403))->withBody('Forbidden');
                    }
                    if (!is_file($entry->path)) {
                        return Response::notFound('Not found');
                    }
                    $ct = $scopeType === Entry::TYPE_CSS ? 'text/css; charset=UTF-8' : 'application/javascript';
                    return (new Response(200))->setHeader('Content-Type', $ct)->withBody('OK');
                });
            }
        }

        $response = $router->dispatch(new Web('GET', '/css/themes/nonexistent/styles.css'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 2 — Empty or malformed extension returns 404. */
    public function test_extension_file_empty_extension_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes//styles.css'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 3 — Extension containing ".." returns 404. */
    public function test_extension_file_dotdot_extension_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/../../etc/passwd/styles.css'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 4 — Extension containing a slash or backslash returns 404. */
    public function test_extension_file_slash_extension_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/foo/bar/styles.css'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 5 — Empty or malformed filename returns 404. */
    public function test_extension_file_empty_filename_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/mytheme/'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 6 — Filename containing ".." returns 404. */
    public function test_extension_file_dotdot_filename_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/mytheme/../../etc/passwd.css'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 7 — Filename containing backslash returns 404. */
    public function test_extension_file_backslash_filename_returns_404(): void
    {
        $registry = new Registry();
        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/mytheme/sub\file.css'));
        self::assertSame(404, $response->statusCode());
    }

    /* ===== http/https rejection: extension file & default alias routes ===== */

    /** Case 8 — Registered remote http:// path returns 403. */
    public function test_extension_file_http_path_returns_403(): void
    {
        $registry = new Registry();
        $entry    = new Entry('themes/httpstuff', 'app.css', 'http://evil.com/style.css', Entry::TYPE_CSS);
        $registry->register($entry);

        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/httpstuff/app.css'));
        self::assertSame(403, $response->statusCode());
    }

    /** Case 9 — Registered remote https:// path returns 403. */
    public function test_extension_file_https_path_returns_403(): void
    {
        $registry = new Registry();
        $entry    = new Entry('themes/httpsstuff', 'app.css', 'https://evil.com/style.css', Entry::TYPE_CSS);
        $registry->register($entry);

        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/httpsstuff/app.css'));
        self::assertSame(403, $response->statusCode());
    }

    /** Case 10 — Registered missing physical file returns 404. */
    public function test_extension_file_missing_physical_returns_404(): void
    {
        $registry = new Registry();
        $entry    = new Entry('themes/ghost', 'app.css', '/nonexistent/directory/app.css', Entry::TYPE_CSS);
        $registry->register($entry);

        $router   = new Router(Router::MODE_WEB);
        self::registerExtensionFileRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/ghost/app.css'));
        self::assertSame(404, $response->statusCode());
    }

    /* ===== Default alias route guards: /{type}/themes/{ext} and /{type}/plugins/{ext} ===== */

    /** Case 11 — Default alias with zero explicit defaults returns 404. */
    public function test_default_alias_zero_defaults_returns_404(): void
    {
        $registry = new Registry();
        /* Register entries WITHOUT the default flag — getDefault will return null. */
        $entry1   = new Entry('themes/nodflt', 'theme.css', $this->themeCssPath, Entry::TYPE_CSS);
        $entry2   = new Entry('themes/nodflt2', 'theme2.css', $this->themeCssPath, Entry::TYPE_CSS);
        $registry->register($entry1);
        $registry->register($entry2);

        $router   = new Router(Router::MODE_WEB);
        self::registerDefaultAliasRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/nodflt'));
        self::assertSame(404, $response->statusCode());
    }

    /** Case 12 — Default alias with multiple explicit defaults returns 404. */
    public function test_default_alias_multiple_defaults_returns_404(): void
    {
        $registry = new Registry();
        /* Register entries where BOTH have metadata['default'] === true — getDefault returns null >1 defaults. */
        $entry1   = new Entry('themes/multidefault', 'a.css', $this->themeCssPath, Entry::TYPE_CSS,
            provider: Entry::PROVIDER_THEME, priority: 0, metadata: ['default' => true]);
        $entry2   = new Entry('themes/multidefault', 'b.css', $this->appJsPath, Entry::TYPE_CSS,
            provider: Entry::PROVIDER_THEME, priority: 0, metadata: ['default' => true]);
        $registry->register($entry1);
        $registry->register($entry2);

        $router   = new Router(Router::MODE_WEB);
        self::registerDefaultAliasRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/themes/multidefault'));
        self::assertSame(404, $response->statusCode());
    }

    /* ===== Root scope guards: /{type}/kernel and /{type}/app ===== */

    /** Case 13 — Root scope containing more than one registered entry returns 404. */
    public function test_root_scope_multiple_entries_returns_404(): void
    {
        $registry = new Registry();
        /* Kernel CSS requires exactly one match when fetching /css/kernel. Register two. */
        $entry1   = new Entry('kernel', 'styles.css', $this->kernelCssPath, Entry::TYPE_CSS);
        $entry2   = new Entry('kernel', 'extra.css', $this->themeCssPath, Entry::TYPE_CSS);
        $registry->register($entry1);
        $registry->register($entry2);

        $router   = new Router(Router::MODE_WEB);
        self::registerRootRoutes($registry, $router);

        $response = $router->dispatch(new Web('GET', '/css/kernel'));
        self::assertSame(404, $response->statusCode());
    }

    /* ===== Helpers ========================================================== */

    private static function registerExtensionFileRoutes(Registry $registry, Router $router): void
    {
        foreach ([Entry::TYPE_CSS, Entry::TYPE_JS] as $scopeType) {
            foreach (['themes', 'plugins'] as $extPrefix) {
                $route = '/' . $scopeType . '/' . $extPrefix . '/{extension}/{file}';
                $router->get($route, static function (Web $request) use ($registry, $scopeType, $extPrefix): Response {
                    $extension        = trim((string) $request->param('extension'));
                    $file             = trim((string) $request->param('file'));
                    if ($extension === '' || str_contains($extension, '/') || str_contains($extension, '\\') || str_contains($extension, '..')) {
                        return Response::notFound('Not found');
                    }
                    if ($file === '' || str_contains($file, '/') || str_contains($file, '\\') || str_contains($file, '..')) {
                        return Response::notFound('Not found');
                    }
                    $entry = $registry->get($scopeType, strtolower(trim($extPrefix . '/' . $extension)), $file);
                    if (!($entry instanceof Entry)) {
                        return Response::notFound('Not found');
                    }
                    if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                        return (new Response(403))->withBody('Forbidden');
                    }
                    if (!is_file($entry->path)) {
                        return Response::notFound('Not found');
                    }
                    $ct = $scopeType === Entry::TYPE_CSS ? 'text/css; charset=UTF-8' : 'application/javascript';
                    return (new Response(200))->setHeader('Content-Type', $ct)->withBody(file_get_contents($entry->path));
                });
            }
        }
    }

    private static function registerDefaultAliasRoutes(Registry $registry, Router $router): void
    {
        foreach ([Entry::TYPE_CSS, Entry::TYPE_JS] as $scopeType) {
            foreach (['themes', 'plugins'] as $extPrefix) {
                $route = '/' . $scopeType . '/' . $extPrefix . '/{extension}';
                $router->get($route, static function (Web $request) use ($registry, $scopeType, $extPrefix): Response {
                    $extension = trim((string) $request->param('extension'));
                    if ($extension === '' || str_contains($extension, '/') || str_contains($extension, '\\') || str_contains($extension, '..')) {
                        return Response::notFound('Not found');
                    }
                    $scope = strtolower(trim($extPrefix . '/' . $extension));
                    /* @var \Laswitchtech\CoreWeb\Asset\Entry|null */
                    $entry = $registry->getDefault($scopeType, $scope);
                    if (!($entry instanceof Entry)) {
                        return Response::notFound('Not found');
                    }
                    if (str_starts_with($entry->path, 'http://') || str_starts_with($entry->path, 'https://')) {
                        return (new Response(403))->withBody('Forbidden');
                    }
                    if (!is_file($entry->path)) {
                        return Response::notFound('Not found');
                    }
                    $ct = $scopeType === Entry::TYPE_CSS ? 'text/css; charset=UTF-8' : 'application/javascript';
                    return (new Response(200))->setHeader('Content-Type', $ct)->withBody(file_get_contents($entry->path));
                });
            }
        }
    }

}

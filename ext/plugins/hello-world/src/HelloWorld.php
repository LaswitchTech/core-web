<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Renderer\Registry;
use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;

final class HelloWorld
{
    /** Full path to this plugin's manifest directory. */
    private static ?string $pluginDir = null;

    /** Register routes: /hello (web) + hello.world (cli). */
    public static function registerRoutes(array $context): void
    {
        if (!isset($context['router']) || !$context['router'] instanceof Router) {
            // Router not ready — skip.
            return;
        }

        /** @var Router $router */
        $router = $context['router'];

        /* ------------------------------------------------------------------ --/
         /  Renderer-dependent routes                                           */
        /* ------------------------------------------------------------------ */

        // Resolve the renderer from the container established during bootstrap.
        /** @var \Laswitchtech\CoreWeb\Renderer\Renderer|null $renderer */
        $renderer = null;
        try {
            $c = Bootstrap::container();
            if ($c->has('renderer')) {
                $renderer = $c->resolve('renderer');
            }
        } catch (\Throwable $_e) {
            // Container not ready — skip renderer routes (registry still usable).
        }

        if ($renderer instanceof \Laswitchtech\CoreWeb\Renderer\Renderer) {
            /** @var Renderer $renderer */
            $layout = 'hello.layout';
            $tmpl   = 'hello.template';
            $view   = 'hello.view';
            $data   = ['name' => 'World'];

            // Web route: /hello-render using the full layout -> template -> view pipeline.
            $router->get('/hello-render', function (Web $_req) use ($renderer, $layout, $tmpl, $view, $data): Response {
                return Response::html(
                    $renderer->render($layout, $tmpl, $view, $data),
                );
            });

            // CLI route: hello.render also exercises the pipeline.
            $router->command('hello.render', function (Cli $_req) use ($renderer, $layout, $tmpl, $view, $data): Response {
                return Response::text(
                    $renderer->render($layout, $tmpl, $view, $data) . PHP_EOL,
                );
            });

            // Latte smoke test: /hello-latte renders via layout -> template -> .latte view.
            $latteData  = ['name' => 'World'];
            $router->get('/hello-latte', function (Web $_req) use ($renderer, $latteData): Response {
                return Response::html(
                    $renderer->render('hello.layout', 'hello.template', 'hello.latte.view', $latteData),
                );
            });

            // CLI route: hello.latte also exercises the pipeline.
            $router->command('hello.latte', function (Cli $_req) use ($renderer, $latteData): Response {
                return Response::text(
                    $renderer->render('hello.layout', 'hello.template', 'hello.latte.view', $latteData) . PHP_EOL,
                );
            });

            // Legacy /hello route (no renderer).
            $router->get('/hello', fn (Web $_req) => Response::html('<h1>Hello World!</h1>'));
        } else {
            // Fallback when renderer is not available.
            $router->get('/hello', fn (Web $_req) => Response::html('<h1>Hello World!</h1>'));
        }

        // Legacy CLI route.
        $router->command('hello.world', function (Cli $req): Response {
            return Response::text('Hello ' . $req->arg(0, 'World') . "!\n");
        });

        /* ------------------------------------------------------------------ --/
         /  Temporary DB smoke-validation command                               */
        /* ------------------------------------------------------------------ */

        /** @var \Laswitchtech\CoreWeb\Bootstrap */
        if ($c = Bootstrap::container()) {
            $router->command('hello.db', function (Cli $_req) use ($c): Response {
                try {
                    /** @var \Laswitchtech\CoreWeb\Database\Connection */
                    $conn = $c->resolve('db_connection');
                    $stmt = $conn->query('SELECT sqlite_version() AS version');
                    $row  = $stmt !== false ? $stmt->fetch() : null;
                    return Response::text("SQLite OK: {$row['version']}\n");
                } catch (\Throwable $_e) {
                    return Response::text("SQLite FAILED: {$_e->getMessage()}\n", 500);
                }
            });
        }
    }

    /** Register renderer resources into the registry during discovery. */
    public static function registerRenderer(array $context): void
    {
        if (!isset($context['registry']) || !$context['registry'] instanceof Registry) {
            return;
        }

        /** @var Registry $registry */
        $registry = $context['registry'];
        $dir      = self::getPluginDir();

        // If the plugin directory is not yet known we cannot register resources.
        if ($dir === null) {
            return;
        }

        $registry->add('hello.layout',     'layout',   "{$dir}/layouts/hello-view.php",  'plugin');
        $registry->add('hello.template',    'template', "{$dir}/templates/hello-view.php", 'plugin');
        $registry->add('hello.view',        'view',     "{$dir}/views/hello-view.php",    'plugin');
        $registry->add('hello.latte.view',  'view',     "{$dir}/views/hello-view.latte",  \Laswitchtech\CoreWeb\Renderer\Resource\Entry::PROVIDER_PLUGIN, 0, ['engine' => 'latte']);
    }

    /** Return the plugin directory (lazily resolved). */
    private static function getPluginDir(): ?string
    {
        if (self::$pluginDir === null) {
            $m = __FILE__;                       // src/HelloWorld.php
            $r = realpath($m);
            self::$pluginDir = $r !== false
                ? dirname(dirname($r))        // ...->hello-world
                : null;
        }

        return self::$pluginDir;
    }
}

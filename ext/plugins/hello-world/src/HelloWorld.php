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

        $registry->add('hello.layout', 'layout', "{$dir}/layouts/hello-view.php", 'plugin');
        $registry->add('hello.template', 'template', "{$dir}/templates/hello-view.php", 'plugin');
        $registry->add('hello.view', 'view',   "{$dir}/views/hello-view.php",     'plugin');
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

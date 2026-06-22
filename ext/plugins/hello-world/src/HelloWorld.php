<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Request\Cli;

final class HelloWorld
{
    /** Register routes: /hello (web) + hello.world (cli). */
    public static function registerRoutes(array $context): void
    {
        if (!isset($context['router']) || !$context['router'] instanceof Router) {
            // Router not ready — skip.
            return;
        }

        /** @var Router $router */
        $router = $context['router'];
        $router->get('/hello', fn (Web $request) => Response::html('<h1>Hello World!</h1>'));

        $router->command('hello.world', function (Cli $request): Response {
            return Response::text('Hello ' . $request->arg(0, 'World') . "!\n");
        });
    }
}

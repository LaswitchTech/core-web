<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Renderer\Renderer;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;

final class Administration
{
    public static function registerRoutes(array $context): void
    {
        if (!isset($context['router']) || !($context['router'] instanceof Router)) {
            return;
        }

        $router = $context['router'];

        if (!Bootstrap::container()->has('renderer')) {
            return;
        }

        $resolved = Bootstrap::container()->resolve('renderer');
        if (!($resolved instanceof Renderer)) {
            return;
        }

        $renderer = $resolved;

        $router->get('/admin', function (Web $_request) use ($renderer): Response {
            $output = $renderer->render(
                'admin.layout',
                'admin.template',
                'admin.dashboard',
                [
                    'menu' => Bootstrap::container()->resolve('admin.menu'),
                ],
            );
            return Response::html($output);
        });
    }
}
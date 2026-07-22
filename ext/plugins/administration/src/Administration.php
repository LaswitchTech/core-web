<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Renderer\Renderer;
use Laswitchtech\CoreWeb\Plugin\Administration\BreadcrumbRenderer;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;
use Laswitchtech\CoreWeb\Plugin\Administration\SidebarRenderer;

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
            $helpers = Bootstrap::container()->resolve('helpers');
            $assetHelper = $helpers->resolve('asset');
            $cssOutput = $assetHelper->css(Bootstrap::container());
            $jsOutput = $assetHelper->js(Bootstrap::container());

            $menu = Bootstrap::container()->resolve('admin.menu');

            $currentEntry = $menu->resolve('dashboard');

            $output = $renderer->render(
                'panel.layout',
                'admin.template',
                'admin.dashboard',
                [
                    'pageTitle'         => 'Overview',
                    'pageDescription'   => 'Administration system status overview.',
                    'menu'              => $menu,
                    'cssOutput'         => $cssOutput,
                    'jsOutput'          => $jsOutput,
                    'appName'           => 'Core-Web',
                    'appLogo'           => '',
                    'sidebarMenu'       => SidebarRenderer::render($menu, '/admin'),
                    'userMenu'          => '',
                    'historyBreadcrumbs'=> '',
                    'routeBreadcrumbs'  => BreadcrumbRenderer::renderRoute($menu, '/admin'),
                    'currentRouteUrl'   => '/admin',
                    'currentRouteLabel' => 'Overview',
                    'currentRouteDescription' => 'Administration system status overview.',
                    'currentRouteIcon'  => $currentEntry?->icon() ?? '',
                    'year'              => date('Y'),
                    'appFooter'         => '',
                ],
            );
            return Response::html($output);
        });
    }
}
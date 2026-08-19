<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Dev;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Helper\Application;
use Laswitchtech\CoreWeb\Plugin\Administration\BreadcrumbRenderer;
use Laswitchtech\CoreWeb\Plugin\Administration\SidebarRenderer;
use Laswitchtech\CoreWeb\Renderer\Renderer;
use Laswitchtech\CoreWeb\Router\Request\Web;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;

final class Dev
{
    public static function registerRoutes(array $context): void
    {
        if (
            !isset($context['router'])
            || !($context['router'] instanceof Router)
        ) {
            return;
        }

        if (!Bootstrap::container()->has('renderer')) {
            return;
        }

        if (!Bootstrap::container()->has('admin.menu')) {
            return;
        }

        $resolved =
            Bootstrap::container()->resolve(
                'renderer'
            );

        if (!($resolved instanceof Renderer)) {
            return;
        }

        $renderer = $resolved;
        $router = $context['router'];

        $router->get(
            '/admin/dev/preview',
            function (Web $_request) use ($renderer): Response {
                $container =
                    Bootstrap::container();

                $helpers =
                    $container->resolve(
                        'helpers'
                    );

                $application =
                    $helpers->resolve(
                        'application'
                    );

                if (!($application instanceof Application)) {
                    throw new \RuntimeException(
                        'Developer Tools application helper is invalid.'
                    );
                }

                $assetHelper =
                    $helpers->resolve(
                        'asset'
                    );

                $menu =
                    $container->resolve(
                        'admin.menu'
                    );

                $currentEntry =
                    $menu->resolve(
                        'dev-preview'
                    );

                $appName =
                    $application->applicationName();

                $appLogo =
                    $application->logo();

                $appFooter =
                    $application->footer();

                $output =
                    $renderer->render(
                        'panel.layout',
                        'admin.template',
                        'dev.preview',
                        [
                            'pageTitle' =>
                                'Theme Preview',
                            'pageDescription' =>
                                'Preview Core-Web Builder components and theme styling.',
                            'menu' =>
                                $menu,
                            'cssOutput' =>
                                $assetHelper->css(
                                    $container
                                ),
                            'jsOutput' =>
                                $assetHelper->js(
                                    $container
                                ),
                            'appName' =>
                                $appName,
                            'appLogo' =>
                                $appLogo,
                            'sidebarMenu' =>
                                SidebarRenderer::render(
                                    $menu,
                                    '/admin/dev/preview'
                                ),
                            'userMenu' =>
                                '',
                            'historyBreadcrumbs' =>
                                '',
                            'routeBreadcrumbs' =>
                                BreadcrumbRenderer::renderRoute(
                                    $menu,
                                    '/admin/dev/preview'
                                ),
                            'currentRouteUrl' =>
                                '/admin/dev/preview',
                            'currentRouteLabel' =>
                                'Theme Preview',
                            'currentRouteDescription' =>
                                'Preview Core-Web Builder components and theme styling.',
                            'currentRouteIcon' =>
                                $currentEntry?->icon()
                                ?? '',
                            'year' =>
                                date('Y'),
                            'appFooter' =>
                                $appFooter,
                        ],
                    );

                return Response::html(
                    $output
                );
            }
        );
    }
}

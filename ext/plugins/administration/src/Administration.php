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

            $container = Bootstrap::container();

            $enabledExtensions = get_object_vars(
                $container->resolve('extension_index'),
            );

            $disabledExtensions = get_object_vars(
                $container->resolve('extension_index_disabled'),
            );

            $countExtensions = static function (
                array $extensions,
                string $type,
            ): int {
                return count(array_filter(
                    $extensions,
                    static function (mixed $extension) use ($type): bool {
                        return is_array($extension)
                            && ($extension['type'] ?? null) === $type;
                    },
                ));
            };

            $databaseDriver = $container->resolve('db_driver');

            $overviewWidgets = [
                [
                    'title' => 'Core-Web',
                    'value' => \Laswitchtech\CoreWeb\Manifest\Parser::KERNEL_VERSION,
                    'footer' => 'Framework version',
                ],
                [
                    'title' => 'PHP',
                    'value' => PHP_VERSION,
                    'footer' => 'Runtime version',
                ],
                [
                    'title' => 'Mode',
                    'value' => (string) $container->resolve('mode'),
                    'footer' => 'Bootstrap mode',
                ],
                [
                    'title' => 'Database',
                    'value' => basename(str_replace('\\', '/', get_class($databaseDriver))),
                    'footer' => 'Configured driver',
                ],
                [
                    'title' => 'Plugins',
                    'value' => (string) $countExtensions($enabledExtensions, 'plugin'),
                    'footer' => (string) $countExtensions($disabledExtensions, 'plugin') . ' disabled',
                ],
                [
                    'title' => 'Themes',
                    'value' => (string) $countExtensions($enabledExtensions, 'theme'),
                    'footer' => (string) $countExtensions($disabledExtensions, 'theme') . ' disabled',
                ],
            ];

            $output = $renderer->render(
                'panel.layout',
                'admin.template',
                'admin.dashboard',
                [
                    'pageTitle'         => 'Overview',
                    'pageDescription'   => 'Administration system status overview.',
                    'overviewWidgets'   => $overviewWidgets,
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
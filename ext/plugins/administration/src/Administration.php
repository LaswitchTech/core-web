<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\ConfigManager;
use Laswitchtech\CoreWeb\Hook\Registry as HookRegistry;
use Laswitchtech\CoreWeb\Plugin\Administration\Overview\Registry as OverviewRegistry;
use Laswitchtech\CoreWeb\Plugin\Administration\Settings\Registry as SettingsRegistry;
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

            $overview = new OverviewRegistry();
            $hooks = $container->resolve('hook_registry');
            if (!($hooks instanceof HookRegistry)) {
                throw new \RuntimeException(
                    'Administration Overview hook registry is invalid.',
                );
            }

            $hooks->trigger('admin.overview.register', [
                'registry' => $overview,
                'container' => $container,
                'mode' => 'web',
            ]);

            $overviewEntries = $overview->export();

            $output = $renderer->render(
                'panel.layout',
                'admin.template',
                'admin.dashboard',
                [
                    'pageTitle'         => 'Overview',
                    'pageDescription'   => 'Administration system status overview.',
                    'overviewEntries'   => $overviewEntries,
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

        // Settings page — placeholder only.
        $router->get('/admin/settings', function (Web $_request) use ($renderer): Response {
            $helpers = Bootstrap::container()->resolve('helpers');
            $assetHelper = $helpers->resolve('asset');
            $cssOutput = $assetHelper->css(Bootstrap::container());
            $jsOutput = $assetHelper->js(Bootstrap::container());

            $menu = Bootstrap::container()->resolve('admin.menu');

            $currentEntry = $menu->resolve('settings');

            $container = Bootstrap::container();

            $configManager = $container->resolve('config_manager');

            if (!($configManager instanceof ConfigManager)) {
                throw new \RuntimeException(
                    'Administration Settings configuration manager is invalid.',
                );
            }

            $settings = new SettingsRegistry();

            $hooks = $container->resolve('hook_registry');
            if (!($hooks instanceof HookRegistry)) {
                throw new \RuntimeException(
                    'Administration Settings hook registry is invalid.',
                );
            }

            $hooks->trigger('admin.settings.register', [
                'registry' => $settings,
                'container' => $container,
                'mode' => 'web',
            ]);

            $settingsEntries = array_map(
                static function (array $entry) use ($configManager): array {
                    $key = $entry['key'];

                    $entry['value'] = $configManager->get(
                        $key,
                        $entry['default'] ?? null,
                    );

                    $entry['overridden'] =
                        $configManager->hasLocal($key);

                    $entry['localValue'] = $entry['overridden']
                        ? $configManager->getLocal($key)
                        : null;

                    return $entry;
                },
                $settings->export(),
            );

            $output = $renderer->render(
                'panel.layout',
                'admin.template',
                'admin.settings',
                [
                    'pageTitle'         => 'System Settings',
                    'pageDescription'   => 'Administration system settings.',
                    'settingsEntries'   => $settingsEntries,
                    'menu'              => $menu,
                    'cssOutput'         => $cssOutput,
                    'jsOutput'          => $jsOutput,
                    'appName'           => 'Core-Web',
                    'appLogo'           => '',
                    'sidebarMenu'       => SidebarRenderer::render($menu, '/admin/settings'),
                    'userMenu'          => '',
                    'historyBreadcrumbs'=> '',
                    'routeBreadcrumbs'  => BreadcrumbRenderer::renderRoute($menu, '/admin/settings'),
                    'currentRouteUrl'   => '/admin/settings',
                    'currentRouteLabel' => 'System Settings',
                    'currentRouteDescription' => 'Administration system settings.',
                    'currentRouteIcon'  => $currentEntry?->icon() ?? '',
                    'year'              => date('Y'),
                    'appFooter'         => '',
                ],
            );
            return Response::html($output);
        });

        $router->post(
            '/admin/settings',
            function (Web $_request): Response {
                $container = Bootstrap::container();

                $configManager = $container->resolve('config_manager');

                if (!($configManager instanceof ConfigManager)) {
                    throw new \RuntimeException(
                        'Administration Settings configuration manager is invalid.',
                    );
                }

                $settings = new SettingsRegistry();

                $hooks = $container->resolve('hook_registry');

                if (!($hooks instanceof HookRegistry)) {
                    throw new \RuntimeException(
                        'Administration Settings hook registry is invalid.',
                    );
                }

                $hooks->trigger('admin.settings.register', [
                    'registry' => $settings,
                    'container' => $container,
                    'mode' => 'web',
                ]);

                return Response::redirect('/admin/settings');
            },
        );
    }
}

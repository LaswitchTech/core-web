<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Plugin\Administration\Menu\Registry;
use Laswitchtech\CoreWeb\Hook\Registry as HookRegistry;
use Laswitchtech\CoreWeb\Router\Router;

final class MenuProvider
{
    public static function initialize(array $context): void
    {
        if (!isset($context['router'])) {
            return;
        }

        if (!$context['router'] instanceof Router) {
            return;
        }

        /** @var Router $router */
        $router = $context['router'];

        $container = Bootstrap::container();

        if ($container->has('admin.menu')) {
            return;
        }

        $registry = new Registry();
        $container->set('admin.menu', $registry);

        if (!$container->has('hook_registry')) {
            return;
        }

        $hooks = $container->resolve('hook_registry');

        if (!($hooks instanceof HookRegistry)) {
            return;
        }

        $hooks->trigger('admin.menu.register', [
            'registry' => $registry,
            'container' => $container,
            'mode' => 'web',
        ]);
    }
}

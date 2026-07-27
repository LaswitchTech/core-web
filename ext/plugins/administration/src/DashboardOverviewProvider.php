<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\Plugin\Administration\Overview\Entry;
use Laswitchtech\CoreWeb\Plugin\Administration\Overview\Registry;

final class DashboardOverviewProvider
{
    public static function register(array $context): void
    {
        if (
            !isset($context['registry'])
            || !($context['registry'] instanceof Registry)
        ) {
            return;
        }

        $registry = $context['registry'];

        $container = Bootstrap::container();
        $enabledExtensions = get_object_vars(
            $container->resolve('extension_index'),
        );
        $disabledExtensions = get_object_vars(
            $container->resolve('extension_index_disabled'),
        );
        $databaseDriver = $container->resolve('db_driver');

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

        $registry->register(
            new Entry(
                'coreweb_version',
                'badge',
                [
                    'label' => 'Core-Web',
                    'tooltip' => 'Framework version',
                    'value' => \Laswitchtech\CoreWeb\Manifest\Parser::KERNEL_VERSION,
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );

        $registry->register(
            new Entry(
                'php_version',
                'badge',
                [
                    'label' => 'PHP Version',
                    'tooltip' => 'Runtime PHP version',
                    'value' => phpversion(),
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M6.854 4.646a.5.5 0 0 1 0 .708L4.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0m2.292 0a.5.5 0 0 0 0 .708L11.793 8l-2.647 2.646a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708 0"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );

        $registry->register(
            new Entry(
                'app_mode',
                'badge',
                [
                    'label' => 'Mode',
                    'tooltip' => 'Application bootstrap mode',
                    'value' => (string) $container->resolve('mode'),
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M9.465 10H12a2 2 0 1 1 0 4H9.465c.34-.588.535-1.271.535-2s-.195-1.412-.535-2"/>
                            <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6m0 1a4 4 0 1 1 0-8 4 4 0 0 1 0 8m.535-10a4 4 0 0 1-.409-1H4a1 1 0 0 1 0-2h2.126q.138-.534.41-1H4a2 2 0 1 0 0 4z"/>
                            <path d="M14 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );

        $registry->register(
            new Entry(
                'db_driver',
                'badge',
                [
                    'label' => 'Database',
                    'tooltip' => 'Configured database driver',
                    'value' => basename(str_replace('\\', '/', get_class($databaseDriver))),
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M4.318 2.687C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4c0-.374.356-.875 1.318-1.313M13 5.698V7c0 .374-.356.875-1.318 1.313C10.766 8.729 9.464 9 8 9s-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777A5 5 0 0 0 13 5.698M14 4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13zm-1 4.698V10c0 .374-.356.875-1.318 1.313C10.766 11.729 9.464 12 8 12s-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777A5 5 0 0 0 13 8.698m0 3V13c0 .374-.356.875-1.318 1.313C10.766 14.729 9.464 15 8 15s-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13s3.022-.289 4.096-.777c.324-.147.633-.323.904-.525"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );

        $registry->register(
            new Entry(
                'plugin_count',
                'badge',
                [
                    'label' => 'Plugins',
                    'tooltip' => (string) $countExtensions($disabledExtensions, 'plugin') . ' disabled',
                    'value' => (string) $countExtensions(
                        $enabledExtensions,
                        'plugin',
                    ),
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M6 0a.5.5 0 0 1 .5.5V3h3V.5a.5.5 0 0 1 1 0V3h1a.5.5 0 0 1 .5.5v3A3.5 3.5 0 0 1 8.5 10c-.002.434-.01.845-.04 1.22-.041.514-.126 1.003-.317 1.424a2.08 2.08 0 0 1-.97 1.028C6.725 13.9 6.169 14 5.5 14c-.998 0-1.61.33-1.974.718A1.92 1.92 0 0 0 3 16H2c0-.616.232-1.367.797-1.968C3.374 13.42 4.261 13 5.5 13c.581 0 .962-.088 1.218-.219.241-.123.4-.3.514-.55.121-.266.193-.621.23-1.09.027-.34.035-.718.037-1.141A3.5 3.5 0 0 1 4 6.5v-3a.5.5 0 0 1 .5-.5h1V.5A.5.5 0 0 1 6 0M5 4v2.5A2.5 2.5 0 0 0 7.5 9h1A2.5 2.5 0 0 0 11 6.5V4z"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );

        $registry->register(
            new Entry(
                'theme_count',
                'badge',
                [
                    'label' => 'Themes',
                    'tooltip' => (string) $countExtensions($disabledExtensions, 'theme') . ' disabled',
                    'value' => (string) $countExtensions(
                        $enabledExtensions,
                        'theme',
                    ),
                    'icon' => <<<'SVG'
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16">
                            <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                            <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8m-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7"/>
                        </svg>
                        SVG,
                    'href' => '',
                ],
            ),
        );
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

use Laswitchtech\CoreWeb\Bootstrap;
use Laswitchtech\CoreWeb\ConfigManager;
use Laswitchtech\CoreWeb\Helper\Application;
use Laswitchtech\CoreWeb\File\ImageUploader;
use Laswitchtech\CoreWeb\Hook\Registry as HookRegistry;
use Laswitchtech\CoreWeb\Logger\Reader as LoggerReader;
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

            $application = $helpers->resolve(
                'application',
            );

            if (!($application instanceof Application)) {
                throw new \RuntimeException(
                    'Administration application helper is invalid.',
                );
            }

            $assetHelper = $helpers->resolve('asset');
            $cssOutput = $assetHelper->css(Bootstrap::container());
            $jsOutput = $assetHelper->js(Bootstrap::container());

            $menu = Bootstrap::container()->resolve('admin.menu');

            $currentEntry = $menu->resolve('dashboard');

            $container = Bootstrap::container();

            $appName = $application->applicationName();
            $appLogo = $application->logo();
            $appFooter = $application->footer();

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
                    'appName'           => $appName,
                    'appLogo'           => $appLogo,
                    'sidebarMenu'       => SidebarRenderer::render($menu, '/admin'),
                    'userMenu'          => '',
                    'historyBreadcrumbs'=> '',
                    'routeBreadcrumbs'  => BreadcrumbRenderer::renderRoute($menu, '/admin'),
                    'currentRouteUrl'   => '/admin',
                    'currentRouteLabel' => 'Overview',
                    'currentRouteDescription' => 'Administration system status overview.',
                    'currentRouteIcon'  => $currentEntry?->icon() ?? '',
                    'year'              => date('Y'),
                    'appFooter'         => $appFooter,
                ],
            );
            return Response::html($output);
        });

        // Settings page — placeholder only.
        $router->get('/admin/settings', function (Web $_request) use ($renderer): Response {
            $helpers = Bootstrap::container()->resolve('helpers');

            $application = $helpers->resolve(
                'application',
            );

            if (!($application instanceof Application)) {
                throw new \RuntimeException(
                    'Administration application helper is invalid.',
                );
            }

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

            $appName = $application->applicationName();
            $appLogo = $application->logo();
            $appFooter = $application->footer();

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
                    'appName'           => $appName,
                    'appLogo'           => $appLogo,
                    'sidebarMenu'       => SidebarRenderer::render($menu, '/admin/settings'),
                    'userMenu'          => '',
                    'historyBreadcrumbs'=> '',
                    'routeBreadcrumbs'  => BreadcrumbRenderer::renderRoute($menu, '/admin/settings'),
                    'currentRouteUrl'   => '/admin/settings',
                    'currentRouteLabel' => 'System Settings',
                    'currentRouteDescription' => 'Administration system settings.',
                    'currentRouteIcon'  => $currentEntry?->icon() ?? '',
                    'year'              => date('Y'),
                    'appFooter'         => $appFooter,
                ],
            );
            return Response::html($output);
        });

        $router->get('/admin/logs', function (Web $_request) use ($renderer): Response {
            $helpers = Bootstrap::container()->resolve('helpers');

            $application = $helpers->resolve(
                'application',
            );

            if (!($application instanceof Application)) {
                throw new \RuntimeException(
                    'Administration application helper is invalid.',
                );
            }

            $assetHelper = $helpers->resolve('asset');
            $cssOutput = $assetHelper->css(Bootstrap::container());
            $jsOutput = $assetHelper->js(Bootstrap::container());

            $container = Bootstrap::container();
            $menu = $container->resolve('admin.menu');
            $currentEntry = $menu->resolve('logs');

            $loggerReader = $container->resolve(
                'logger_reader',
            );

            if (!($loggerReader instanceof LoggerReader)) {
                throw new \RuntimeException(
                    'Administration Log Viewer reader is invalid.',
                );
            }

            $appName = $application->applicationName();
            $appLogo = $application->logo();
            $appFooter = $application->footer();

            $output = $renderer->render(
                'panel.layout',
                'admin.template',
                'admin.logs',
                [
                    'pageTitle' => 'Log Viewer',
                    'pageDescription' => 'Inspect application log entries.',
                    'logChannels' => $loggerReader->channels(),
                    'logLevels' => $loggerReader->levels(),
                    'menu' => $menu,
                    'cssOutput' => $cssOutput,
                    'jsOutput' => $jsOutput,
                    'appName' => $appName,
                    'appLogo' => $appLogo,
                    'sidebarMenu' => SidebarRenderer::render(
                        $menu,
                        '/admin/logs',
                    ),
                    'userMenu' => '',
                    'historyBreadcrumbs' => '',
                    'routeBreadcrumbs' => BreadcrumbRenderer::renderRoute(
                        $menu,
                        '/admin/logs',
                    ),
                    'currentRouteUrl' => '/admin/logs',
                    'currentRouteLabel' => 'Log Viewer',
                    'currentRouteDescription' => 'Inspect application log entries.',
                    'currentRouteIcon' => $currentEntry?->icon() ?? '',
                    'year' => date('Y'),
                    'appFooter' => $appFooter,
                ],
            );

            return Response::html($output);
        });

        $router->get(
            '/admin/logs/data',
            function (Web $request): Response {
                $container = Bootstrap::container();

                $loggerReader = $container->resolve(
                    'logger_reader',
                );

                if (!($loggerReader instanceof LoggerReader)) {
                    throw new \RuntimeException(
                        'Administration Log Viewer reader is invalid.',
                    );
                }

                $channel = $request->queryParam(
                    'channel',
                    '',
                );

                if (!is_string($channel)) {
                    $channel = '';
                }

                $channel = strtolower(
                    trim($channel),
                );

                $channels = $loggerReader->channels();

                if (
                    $channel === ''
                    && $channels !== []
                ) {
                    $channel = $channels[0];
                }

                if (
                    $channel === ''
                    || !$loggerReader->hasChannel(
                        $channel,
                    )
                ) {
                    return Response::json([
                        'success' => false,
                        'message' =>
                            'The requested log channel is unavailable.',
                        'channels' => $channels,
                    ], Response::STATUS_UNPROCESSABLE_ENTITY);
                }

                $pageValue = $request->queryParam(
                    'page',
                    '1',
                );

                $page = is_string($pageValue)
                    && ctype_digit($pageValue)
                        ? (int) $pageValue
                        : 1;

                if ($page < 1) {
                    $page = 1;
                }

                $pageSizeValue = $request->queryParam(
                    'pageSize',
                    '25',
                );

                $pageSize = is_string($pageSizeValue)
                    && ctype_digit($pageSizeValue)
                        ? (int) $pageSizeValue
                        : 25;

                $pageSize = max(
                    1,
                    min(
                        100,
                        $pageSize,
                    ),
                );

                $levelsValue = $request->queryParam(
                    'levels',
                    null,
                );

                $selectedLevels = null;

                if (
                    is_string($levelsValue)
                    && trim($levelsValue) !== ''
                ) {
                    $selectedLevels = array_values(
                        array_filter(
                            array_map(
                                static fn (string $level): string =>
                                    strtoupper(
                                        trim($level),
                                    ),
                                explode(
                                    ',',
                                    $levelsValue,
                                ),
                            ),
                            static fn (string $level): bool =>
                                $level !== '',
                        ),
                    );
                }

                if ($selectedLevels !== null) {
                    $supportedLevels =
                        $loggerReader->levels();

                    foreach ($selectedLevels as $selectedLevel) {
                        if (
                            !in_array(
                                $selectedLevel,
                                $supportedLevels,
                                true,
                            )
                        ) {
                            return Response::json([
                                'success' => false,
                                'message' =>
                                    'One or more requested log levels are invalid.',
                                'levels' => $supportedLevels,
                            ], Response::STATUS_UNPROCESSABLE_ENTITY);
                        }
                    }

                    $selectedLevels = array_values(
                        array_unique(
                            $selectedLevels,
                        ),
                    );
                }

                $search = $request->queryParam(
                    'search',
                    null,
                );

                if (!is_string($search)) {
                    $search = null;
                }

                if ($search !== null) {
                    $search = trim(
                        $search,
                    );

                    if ($search === '') {
                        $search = null;
                    }
                }

                $sinceValue = $request->queryParam(
                    'since',
                    null,
                );

                $since = null;

                if (
                    is_string($sinceValue)
                    && trim($sinceValue) !== ''
                ) {
                    try {
                        $since = new \DateTimeImmutable(
                            trim($sinceValue),
                        );
                    } catch (\Throwable) {
                        return Response::json([
                            'success' => false,
                            'message' =>
                                'The requested start date is invalid.',
                        ], Response::STATUS_UNPROCESSABLE_ENTITY);
                    }
                }

                $untilValue = $request->queryParam(
                    'until',
                    null,
                );

                $until = null;

                if (
                    is_string($untilValue)
                    && trim($untilValue) !== ''
                ) {
                    try {
                        $until = new \DateTimeImmutable(
                            trim($untilValue),
                        );
                    } catch (\Throwable) {
                        return Response::json([
                            'success' => false,
                            'message' =>
                                'The requested end date is invalid.',
                        ], Response::STATUS_UNPROCESSABLE_ENTITY);
                    }
                }

                if (
                    $since !== null
                    && $until !== null
                    && $since > $until
                ) {
                    return Response::json([
                        'success' => false,
                        'message' =>
                            'The requested start date must not be after the end date.',
                    ], Response::STATUS_UNPROCESSABLE_ENTITY);
                }



                $result = $loggerReader->page(
                    channel: $channel,
                    page: $page,
                    pageSize: $pageSize,
                    descending: true,
                    levels: $selectedLevels,
                    since: $since,
                    until: $until,
                    search: $search,
                );

                return Response::json([
                    'success' => true,
                    'channel' => $channel,
                    'channels' => $channels,
                    'levels' => $loggerReader->levels(),
                    'selectedLevels' => $selectedLevels,
                    'since' =>
                        $since?->format(
                            \DateTimeInterface::ATOM,
                        ),
                    'until' =>
                        $until?->format(
                            \DateTimeInterface::ATOM,
                        ),
                    'search' => $search,
                    'entries' => $result['entries'],
                    'pagination' => $result['pagination'],
                ], Response::STATUS_OK);
            },
        );

        $router->post(
            '/admin/settings',
            function (Web $request): Response {
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

                $submittedSettings = $request->postParam(
                    'settings',
                    [],
                );

                $errors = [];

                if (!is_array($submittedSettings)) {
                    return Response::json([
                        'success' => false,
                        'message' =>
                            'The submitted settings could not be saved.',
                        'errors' => [
                            'settings' =>
                                'The submitted settings payload is invalid.',
                        ],
                    ], Response::STATUS_UNPROCESSABLE_ENTITY);
                }

                $resolvedSettings = $settings->resolved();

                // Build allowed-key map from registered settings for reset
                // guarding — prevents arbitrary configuration keys.
                $allowedKeysMap = [];

                foreach ($resolvedSettings as $_entry) {
                    $allowedKeysMap[$_entry->key()] = $_entry;
                }

                // Collect valid reset keys before validation so they are skipped
                // during text-value validation (reset overrides any submitted
                // value for the same key).
                $resetActionData  = $request->postParam('actions', []);
                $validResetKeys   = [];

                if (is_array($resetActionData)) {
                    $resetSubset = $resetActionData['reset'] ?? [];

                    if (is_array($resetSubset)) {
                        foreach ($resetSubset as $_key => $_flag) {
                            if (isset($allowedKeysMap[$_key]) && $_flag === '1') {
                                $validResetKeys[] = (string) $_key;
                            }
                        }
                    }
                }

                $validatedSettings = [];

                $validationFailed = false;

                $submittedLogo = $request->file(
                    'uploads',
                    'application_logo',
                );

                if (
                    $submittedLogo !== null
                    && !in_array(
                        $submittedLogo['error'],
                        [
                            UPLOAD_ERR_OK,
                            UPLOAD_ERR_NO_FILE,
                        ],
                        true,
                    )
                ) {
                    $validationFailed = true;
                    $errors[
                        'application.logo'
                    ] =
                        'The uploaded logo could not be processed.';
                }

                foreach ($resolvedSettings as $entry) {
                    $key = $entry->key();

                    if ($entry->type() === 'file') {
                        continue;
                    }

                    if (!array_key_exists($key, $submittedSettings)) {
                        continue;
                    }

                    // Reset actions take precedence — skip text validation
                    // and persistence for keys being reset in this request.
                    if (in_array($key, $validResetKeys, true)) {
                        continue;
                    }

                    $value = $submittedSettings[$key];

                    if (!is_string($value)) {
                        $validationFailed = true;
                        $errors[$key] =
                            $entry->label() . ' is invalid.';
                        break;
                    }

                    $validator = $entry->validator();

                    if (
                        $validator !== null
                        && !$validator($value)
                    ) {
                        $validationFailed = true;
                        $errors[$key] =
                            $entry->label() . ' is invalid.';
                        break;
                    }

                    $validatedSettings[$key] = $value;
                }

                if ($validationFailed) {
                    return Response::json([
                        'success' => false,
                        'message' =>
                            'The submitted settings could not be saved.',
                        'errors' => $errors,
                    ], Response::STATUS_UNPROCESSABLE_ENTITY);
                }

                $logoUploader = $container->resolve(
                    'application_logo_uploader',
                );

                if (!($logoUploader instanceof ImageUploader)) {
                    throw new \RuntimeException(
                        'Administration application logo uploader is invalid.',
                    );
                }

                if (
                    $submittedLogo !== null
                    && $submittedLogo['error'] === UPLOAD_ERR_OK
                ) {

                    try {
                        $uploadedLogo = $logoUploader->store(
                            $submittedLogo,
                            'logo',
                        );
                    } catch (
                        \InvalidArgumentException
                        | \RuntimeException
                        $exception
                    ) {
                        $errorMessage = $exception->getMessage();

                        if (
                            preg_match(
                                '/^\/([a-zA-Z0-9_\.\/\-\s]+)$/',
                                $errorMessage,
                            )
                        ) {
                            $errors[
                                'application.logo'
                            ] =
                                'The uploaded logo could not be processed.';

                            return Response::json([
                                'success' => false,
                                'message' =>
                                    'The submitted settings could not be saved.',
                                'errors' => $errors,
                            ], Response::STATUS_UNPROCESSABLE_ENTITY);
                        }

                        $errors[
                            'application.logo'
                        ] = $errorMessage;

                        return Response::json([
                            'success' => false,
                            'message' =>
                                'The submitted settings could not be saved.',
                            'errors' => $errors,
                        ], Response::STATUS_UNPROCESSABLE_ENTITY);
                    }

                    $validatedSettings[
                        'application.logo'
                    ] = $uploadedLogo->path();
                }

                // Track that we're in a change context for later save
                $configurationChanged = false;

                // Handle application logo removal — only when no new logo
                // was uploaded and the frontend explicitly requests removal.
                // Also handles resetting any registered setting via
                // $validResetKeys collected above.
                if (is_array($resetActionData)) {
                    foreach ($validResetKeys as $resetKey) {
                        if ($resetKey === 'application.logo') {
                            $logoLocalPath = $configManager->getLocal(
                                $resetKey,
                            );

                            if (is_string($logoLocalPath) && $logoLocalPath !== '') {
                                try {
                                    $logoUploader->remove($logoLocalPath);
                                } catch (
                                    \InvalidArgumentException
                                    | \RuntimeException
                                    $exception
                                ) {
                                    $errors[
                                        'application.logo'
                                    ] = $exception->getMessage();

                                    return Response::json([
                                        'success' => false,
                                        'message' =>
                                            'The submitted settings could not be saved.',
                                        'errors' => $errors,
                                    ], Response::STATUS_UNPROCESSABLE_ENTITY);
                                }
                            }
                        }

                        $hadLocal = $configManager->hasLocal($resetKey);
                        $configManager->unsetKey($resetKey);

                        if ($hadLocal) {
                            $configurationChanged = true;
                        }
                    }

                    // Legacy support: keep the original
                    // remove_application_logo flag working alongside
                    // actions[reset].
                    if (
                        isset($resetActionData['remove_application_logo'])
                        && $resetActionData['remove_application_logo'] === '1'
                        && !in_array('application.logo', $validResetKeys, true)
                        && (
                            $submittedLogo === null
                            || $submittedLogo['error'] !== UPLOAD_ERR_OK
                        )
                    ) {
                        $logoLocalPath = $configManager->getLocal(
                            'application.logo',
                        );

                        if (is_string($logoLocalPath) && $logoLocalPath !== '') {
                            try {
                                $logoUploader->remove($logoLocalPath);
                            } catch (
                                \InvalidArgumentException
                                | \RuntimeException
                                $exception
                            ) {
                                $errors[
                                    'application.logo'
                                ] = $exception->getMessage();

                                return Response::json([
                                    'success' => false,
                                    'message' =>
                                        'The submitted settings could not be saved.',
                                    'errors' => $errors,
                                ], Response::STATUS_UNPROCESSABLE_ENTITY);
                            }
                        }

                        $hadLocal = $configManager->hasLocal('application.logo');
                        $configManager->unsetKey('application.logo');

                        if ($hadLocal) {
                            $configurationChanged = true;
                        }
                    }
                }

                foreach ($validatedSettings as $key => $value) {
                    if ($configManager->get($key) === $value) {
                        continue;
                    }

                    $configManager->set(
                        $key,
                        $value,
                    );

                    $configurationChanged = true;
                }

                if ($configurationChanged) {
                    $configManager->saveLocal();
                }

                return Response::json([
                    'success' => true,
                    'message' => 'Settings saved successfully.',
                    'changed' => $configurationChanged,
                    'settings' => [
                        'application.name' =>
                            $configManager->get(
                                'application.name',
                                'Core-Web',
                            ),
                        'administration.brand' =>
                            $configManager->get(
                                'administration.brand',
                                'Administration',
                            ),
                        'application.logo' =>
                            $configManager->get(
                                'application.logo',
                                '',
                            ),
                        'application.footer' =>
                            $configManager->get(
                                'application.footer',
                                '',
                            ),
                    ],
                    'branding' => [
                        'name' =>
                            $configManager->get(
                                'application.name',
                                'Core-Web',
                            ),
                        'logo' =>
                            $configManager->get(
                                'application.logo',
                                '',
                            ),
                        'footer' =>
                            $configManager->get(
                                'application.footer',
                                '',
                            ),
                    ],
                ], Response::STATUS_OK);
            },
        );
    }
}

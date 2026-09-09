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

        $router->get(
            '/admin/dev/source',
            function (Web $request): Response {
                $file =
                    $request->queryParam(
                        'file',
                        ''
                    );

                if (
                    !is_string($file)
                    || trim($file) === ''
                ) {
                    return Response::json(
                        [
                            'success' =>
                                false,
                            'message' =>
                                'Developer source file is required.',
                        ],
                        Response::STATUS_UNPROCESSABLE_ENTITY
                    );
                }

                $file =
                    trim($file);

                $pluginRoot =
                    dirname(__DIR__);

                $kernelRoot =
                    dirname(
                        $pluginRoot,
                        3
                    );

                $root =
                    null;

                $relativePath =
                    '';

                if (
                    str_starts_with(
                        $file,
                        'dev:'
                    )
                ) {
                    $root =
                        $pluginRoot;

                    $relativePath =
                        substr(
                            $file,
                            4
                        );
                } elseif (
                    str_starts_with(
                        $file,
                        'kernel:'
                    )
                ) {
                    $root =
                        $kernelRoot;

                    $relativePath =
                        substr(
                            $file,
                            7
                        );
                }

                if (
                    $root === null
                    || $relativePath === ''
                    || str_contains(
                        $relativePath,
                        "\0"
                    )
                ) {
                    return Response::json(
                        [
                            'success' =>
                                false,
                            'message' =>
                                'Developer source file reference is invalid.',
                        ],
                        Response::STATUS_UNPROCESSABLE_ENTITY
                    );
                }

                $resolvedRoot =
                    realpath(
                        $root
                    );

                $resolvedFile =
                    realpath(
                        $root
                        . DIRECTORY_SEPARATOR
                        . ltrim(
                            $relativePath,
                            '/\\'
                        )
                    );

                if (
                    $resolvedRoot === false
                    || $resolvedFile === false
                    || !str_starts_with(
                        $resolvedFile,
                        $resolvedRoot
                        . DIRECTORY_SEPARATOR
                    )
                    || !is_file(
                        $resolvedFile
                    )
                    || !is_readable(
                        $resolvedFile
                    )
                ) {
                    return Response::json(
                        [
                            'success' =>
                                false,
                            'message' =>
                                'Developer source file is unavailable.',
                        ],
                        Response::STATUS_UNPROCESSABLE_ENTITY
                    );
                }

                $source =
                    file_get_contents(
                        $resolvedFile
                    );

                if ($source === false) {
                    throw new \RuntimeException(
                        'Developer source file could not be read.'
                    );
                }

                $startLineValue =
                    $request->queryParam(
                        'startLine',
                        ''
                    );

                $endLineValue =
                    $request->queryParam(
                        'endLine',
                        ''
                    );

                $startLine =
                    is_string($startLineValue)
                    && ctype_digit($startLineValue)
                        ? (int) $startLineValue
                        : null;

                $endLine =
                    is_string($endLineValue)
                    && ctype_digit($endLineValue)
                        ? (int) $endLineValue
                        : null;

                if (
                    ($startLine === null)
                    !== ($endLine === null)
                    || (
                        $startLine !== null
                        && (
                            $startLine < 1
                            || $endLine < $startLine
                        )
                    )
                ) {
                    return Response::json(
                        [
                            'success' =>
                                false,
                            'message' =>
                                'Developer source line range is invalid.',
                        ],
                        Response::STATUS_UNPROCESSABLE_ENTITY
                    );
                }

                $startMarker =
                    $request->queryParam(
                        'startMarker',
                        ''
                    );

                $endMarker =
                    $request->queryParam(
                        'endMarker',
                        ''
                    );

                if (!is_string($startMarker)) {
                    $startMarker =
                        '';
                }

                if (!is_string($endMarker)) {
                    $endMarker =
                        '';
                }

                $startMarker =
                    trim(
                        $startMarker
                    );

                $endMarker =
                    trim(
                        $endMarker
                    );

                if (
                    ($startMarker === '')
                    !== ($endMarker === '')
                ) {
                    return Response::json(
                        [
                            'success' =>
                                false,
                            'message' =>
                                'Developer source markers must be provided together.',
                        ],
                        Response::STATUS_UNPROCESSABLE_ENTITY
                    );
                }

                if (
                    $startLine !== null
                    && $endLine !== null
                ) {
                    $lines =
                        preg_split(
                            '/\R/',
                            $source
                        );

                    if ($lines === false) {
                        throw new \RuntimeException(
                            'Developer source lines could not be parsed.'
                        );
                    }

                    $source =
                        implode(
                            "\n",
                            array_slice(
                                $lines,
                                $startLine - 1,
                                $endLine
                                - $startLine
                                + 1
                            )
                        );
                }

                if (
                    $startMarker !== ''
                    && $endMarker !== ''
                ) {
                    $startPosition =
                        strpos(
                            $source,
                            $startMarker
                        );

                    if ($startPosition === false) {
                        return Response::json(
                            [
                                'success' =>
                                    false,
                                'message' =>
                                    'Developer source start marker was not found.',
                            ],
                            Response::STATUS_UNPROCESSABLE_ENTITY
                        );
                    }

                    $contentStart =
                        $startPosition
                        + strlen(
                            $startMarker
                        );

                    $endPosition =
                        strpos(
                            $source,
                            $endMarker,
                            $contentStart
                        );

                    if ($endPosition === false) {
                        return Response::json(
                            [
                                'success' =>
                                    false,
                                'message' =>
                                    'Developer source end marker was not found.',
                            ],
                            Response::STATUS_UNPROCESSABLE_ENTITY
                        );
                    }

                    $source =
                        trim(
                            substr(
                                $source,
                                $contentStart,
                                $endPosition
                                - $contentStart
                            ),
                            "\r\n"
                        );
                }

                return Response::json(
                    [
                        'success' =>
                            true,
                        'file' =>
                            $file,
                        'source' =>
                            $source,
                    ],
                    Response::STATUS_OK
                );
            }
        );
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\BootstrapIcons;

use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;

final class BootstrapIconsFontProvider
{
    public static function registerRoutes(array $context): void
    {
        if (!($context['router'] ?? null) instanceof Router) {
            return;
        }

        $root = __DIR__ . '/../../';
        $woff2File = $root . 'Assets/fonts/bootstrap-icons.woff2';
        $woffFile  = $root . 'Assets/fonts/bootstrap-icons.woff';

        $context['router']->get('/fonts/bootstrap-icons.woff2', static function () use ($woff2File): Response {
            if (!is_file($woff2File) || !is_readable($woff2File)) {
                return Response::notFound();
            }
            $content = file_get_contents($woff2File);
            if ($content === false) {
                return Response::notFound();
            }
            $response = new Response(Response::STATUS_OK);
            $response->setHeader('Content-Type', 'font/woff2');
            $response->withBody($content);
            return $response;
        });

        $context['router']->get('/fonts/bootstrap-icons.woff', static function () use ($woffFile): Response {
            if (!is_file($woffFile) || !is_readable($woffFile)) {
                return Response::notFound();
            }
            $content = file_get_contents($woffFile);
            if ($content === false) {
                return Response::notFound();
            }
            $response = new Response(Response::STATUS_OK);
            $response->setHeader('Content-Type', 'font/woff');
            $response->withBody($content);
            return $response;
        });
    }
}

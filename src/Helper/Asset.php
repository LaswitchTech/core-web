<?php

declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

use Laswitchtech\CoreWeb\Asset\Entry;
use Laswitchtech\CoreWeb\Asset\Registry;
use Laswitchtech\CoreWeb\Container;
use Laswitchtech\CoreWeb\Helper\HelperInterface;

final class Asset implements HelperInterface
{
    public function name(): string
    {
        return 'asset';
    }

    public function path(string $path): string
    {
        if ($path === '') {
            return '/';
        }

        // Normalize leading slash: ensure exactly one leading slash
        return '/' . ltrim($path, '/');
    }

    /**
     * Build the canonical URL path for an asset entry.
     *
     * Core/app scopes are flattened to a two-segment path (`/{type}/{scope}`).
     * Extension scopes retain their full scope as part of the URL plus the filename.
     */
    public function url(Entry $entry): string
    {
        // Only allow the two asset types that the route serves.
        if ($entry->type !== Entry::TYPE_CSS && $entry->type !== Entry::TYPE_JS) {
            return '';
        }

        $scope = $entry->scope;

        // Kernel and application scopes: no physical filename in the URL.
        if ($scope === 'kernel' || $scope === 'app') {
            return '/' . $entry->type . '/' . $scope;
        }

        // Extension scopes: preserve full scope + filename.
        $file = trim($entry->file);
        if ($file === '') {
            return '';
        }

        return '/' . $entry->type . '/' . $scope . '/' . $file;
    }

    /**
     * Render all registered CSS assets as <link> tags in deterministic order.
     *
     * When at least one LESS entry exists, a single compiled /css link is
     * emitted first and individual links for LESS entries are suppressed.
     */
    public function css(Container $container): string
    {
        $registry = $container->resolve('asset_registry');

        if (!($registry instanceof Registry)) {
            return '';
        }

        $hasLess   = false;
        $regularCss = [];

        foreach ($registry->orderedCss() as $entry) {
            $path = rtrim(strtolower($entry->path), '/\\');
            $isLess = str_ends_with($path, '.less');

            if ($isLess) {
                $hasLess = true;
                continue;
            }

            $url = $this->url($entry);

            if ($url === '') {
                continue;
            }

            $regularCss[] = "<link rel=\"stylesheet\" href=\"{$url}\">";
        }

        $css = [];

        if ($hasLess) {
            $css[] = '<link rel="stylesheet" href="/css">';
        }

        $css = [...$css, ...$regularCss];

        return implode("\n", $css);
    }

    /**
     * Render all registered JS assets as <script> tags in deterministic order.
     */
    public function js(Container $container): string
    {
        $registry = $container->resolve('asset_registry');

        if (!($registry instanceof Registry)) {
            return '';
        }

        $js = [];

        foreach ($registry->orderedJs() as $entry) {
            $url = $this->url($entry);

            if ($url === '') {
                continue;
            }

            $js[] = "<script src=\"{$url}\"></script>";
        }

        return implode("\n", $js);
    }
}

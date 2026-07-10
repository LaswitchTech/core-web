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

    public function url(string $type, string $name): string
    {
        $t  = strtolower(trim($type));
        $n  = trim($name);

        if ($t === '' || $n === '') {
            return '';
        }

        // Only allow the two asset types that the route serves.
        if ($t !== Entry::TYPE_CSS && $t !== Entry::TYPE_JS) {
            return '';
        }

        return '/' . $t . '/' . $n;
    }

    /**
     * Render all registered CSS assets as <link> tags in deterministic order.
     */
    public function css(Container $container): string
    {
        $registry = $container->resolve('asset_registry');

        if (!($registry instanceof Registry)) {
            return '';
        }

        $css = [];

        foreach ($registry->orderedCss() as $entry) {
            $url = $this->url($entry->type, $entry->name);

            if ($url === '') {
                continue;
            }

            $css[] = "<link rel=\"stylesheet\" href=\"{$url}\">";
        }

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
            $url = $this->url($entry->type, $entry->name);

            if ($url === '') {
                continue;
            }

            $js[] = "<script src=\"{$url}\"></script>";
        }

        return implode("\n", $js);
    }
}

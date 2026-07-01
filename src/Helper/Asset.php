<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

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
}

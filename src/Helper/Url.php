<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

final class Url implements HelperInterface
{
    public function name(): string
    {
        return 'url';
    }

    public function to(string $path = ''): string
    {
        if ($path === '') {
            return '/';
        }

        // Normalize leading slash: ensure exactly one leading slash
        return '/' . ltrim($path, '/');
    }
}

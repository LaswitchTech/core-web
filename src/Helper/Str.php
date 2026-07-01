<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

final class Str implements HelperInterface
{
    public function name(): string
    {
        return 'str';
    }

    public function lower(string $value): string
    {
        return mb_strtolower($value, 'UTF-8');
    }

    public function upper(string $value): string
    {
        return mb_strtoupper($value, 'UTF-8');
    }

    public function slug(string $value): string
    {
        // Lowercase UTF-8 input
        $slug = mb_strtolower($value, 'UTF-8');
        // Replace any sequence of non-alphanumeric characters with one hyphen
        $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', $slug);
        // Trim leading/trailing hyphens
        $slug = trim($slug, '-');

        return $slug !== ''
            ? $slug
            : '';
    }

    public function limit(string $value, int $limit, string $suffix = '...'): string
    {
        if ($limit <= 0) {
            return '';
        }

        if (mb_strlen($value, 'UTF-8') <= $limit) {
            return $value;
        }

        return mb_substr($value, 0, $limit, 'UTF-8') . $suffix;
    }
}

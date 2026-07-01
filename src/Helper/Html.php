<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

final class Html implements HelperInterface
{
    public function name(): string
    {
        return 'html';
    }

    public function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public function e(string $value): string
    {
        return $this->escape($value);
    }

    public function attrs(array $attributes): string
    {
        if ($attributes === []) {
            return '';
        }

        $parts = [];
        foreach ($attributes as $key => $value) {
            if ($value === false || $value === null) {
                // Skip false/null values per common HTML convention (boolean attr omission)
                continue;
            }
            // Convert boolean true to "1" for visibility
            if ($value === true) {
                $parts[] = htmlspecialchars((string) $key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                continue;
            }
            $k = htmlspecialchars((string) $key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $v = htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $parts[] = "{$k}=\"{$v}\"";
        }

        return $parts !== [] ? (' ' . implode(' ', $parts)) : '';
    }
}

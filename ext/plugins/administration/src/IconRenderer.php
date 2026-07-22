<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

final class IconRenderer
{
    public static function render(?string $icon): string
    {
        if ($icon === null) {
            return '';
        }

        $trimmed = trim($icon);

        if ($trimmed === '') {
            return '';
        }

        if (str_starts_with($trimmed, '<svg') && str_ends_with($trimmed, '</svg>')) {
            return $trimmed;
        }

        $escapedClass = htmlspecialchars(
            $trimmed,
            ENT_QUOTES | ENT_SUBSTITUTE,
            'UTF-8',
        );

        return '<i class="' . $escapedClass . '" aria-hidden="true"></i>';
    }
}

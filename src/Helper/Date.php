<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

final class Date implements HelperInterface
{
    public function name(): string
    {
        return 'date';
    }

    public function format(\DateTimeInterface|string|int $value, string $format = 'Y-m-d H:i:s'): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format($format);
        }

        if (is_string($value)) {
            $dt = new \DateTime($value);
            return $dt->format($format);
        }

        // int timestamp
        $dt   = (new \DateTime())->setTimestamp($value);
        return $dt->format($format);
    }
}

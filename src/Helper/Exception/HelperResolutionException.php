<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper\Exception;

final class HelperResolutionException extends \RuntimeException
{
    public static function notRegistered(string $name): self
    {
        return new self(sprintf('Helper "%s" is not registered.', $name));
    }
}

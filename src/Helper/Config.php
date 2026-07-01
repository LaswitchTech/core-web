<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

/**
 * Wraps \Laswitchtech\CoreWeb\Config for use inside the helper pipeline.
 */
final class Config implements HelperInterface
{
    public function name(): string
    {
        return 'config';
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return \Laswitchtech\CoreWeb\Config::get($key, $default);
    }

    /** Return the entire merged configuration payload (read-only). */
    public function all(): ?array
    {
        return \Laswitchtech\CoreWeb\Config::all();
    }
}

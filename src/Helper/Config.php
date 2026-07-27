<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

use Laswitchtech\CoreWeb\Container;

/**
 * Wraps the writable config manager (via Container) for use inside the helper pipeline.
 * Falls back to the static Config class when no container service is available (bootstrap-time).
 */
final class Config implements HelperInterface
{
    public function name(): string
    {
        return 'config';
    }

    /** Retrieve a nested value by dot-notation key; returns `$default` when absent.          */
    public function get(string $key, mixed $default = null): mixed
    {
        if (($manager = $this->resolveManager()) !== null) {
            return $manager->get($key, $default);
        }
        return \Laswitchtech\CoreWeb\Config::get($key, $default);
    }

    /** Return the entire merged configuration payload (read-only). */
    public function all(): ?array
    {
        if (($manager = $this->resolveManager()) !== null) {
            return $manager->all();
        }
        return \Laswitchtech\CoreWeb\Config::all();
    }

    /** Whether a dot-notation key exists in the current payload.                              */
    public function has(string $key): bool
    {
        if (($manager = $this->resolveManager()) !== null) {
            return $manager->has($key);
        }
        // Static Config has no `has` — treat existence as truthy read.
        return (\Laswitchtech\CoreWeb\Config::get($key) ?? null) !== null;
    }

    /** Resolve the writable config manager from Bootstrap's container when available, else return null. */
    private function resolveManager(): ?object
    {
        // Helpers can be called before bootstrap completes — catch the exception and fall back.
        try {
            $c = \Laswitchtech\CoreWeb\Bootstrap::container();
            if ($c->has('config_manager')) {
                return $c->resolve('config_manager');
            }
        } catch (\RuntimeException) {
            // Bootstrap not yet initialized; we'll use the static Config class instead.
        }

        return null;
    }
}

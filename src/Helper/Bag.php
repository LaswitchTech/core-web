<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

use Laswitchtech\CoreWeb\Helper\Exception\HelperResolutionException;
use RuntimeException;

/**
 * Shortcuts around Registry for renderer / controller convenience.
 */
final class Bag
{
    private Registry $registry;

    public function __construct(Registry $registry)
    {
        $this->registry = $registry;
    }

    /**
     * Resolve a helper by name, or throw when not found.
     */
    public function resolve(string $name): HelperInterface
    {
        $helper = $this->registry->get($name);

        if ($helper === null) {
            throw HelperResolutionException::notRegistered($name);
        }

        return $helper;
    }

    /**
     * Check whether a helper is registered under the given name.
     */
    public function has(string $name): bool
    {
        return $this->registry->has($name);
    }

    /**
     * Return all helpers keyed by their canonical (lowercase) name.
     *
     * @return array<string, HelperInterface>
     */
    public function all(): array
    {
        return $this->registry->all();
    }

    /**
     * Property-style accessor: resolves and returns the helper.
     */
    public function __get(string $name): HelperInterface
    {
        return $this->resolve($name);
    }

    /**
     * Magic method — limited for safety.
     *
     * When called with zero arguments, returns the helper object itself.
     * With arguments it does not delegate (avoids unsafe implicit calls).
     */
    public function __call(string $name, array $arguments): mixed
    {
        if ($arguments !== []) {
            throw new RuntimeException(sprintf('Calling "%s()" on a helper requires direct method invocation; use resolve().', $name));
        }

        return $this->resolve($name);
    }
}
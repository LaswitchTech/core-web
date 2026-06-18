<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Hook;

/**
 * Immutable value object representing a single registered hook entry.
 * Documentation: docs/development/architecture/Hook/Plugin.md
 */
final readonly class Plugin
{
    public function __construct(
        /** @var string  dotted hook namespace (e.g., `layout.header`) */
        public string $hook,
        /** @var Closure|array|string The resolved callback */
        public Closure|array|string $callback,
        /** @var int Hook priority — higher fires first */
        public int $priority = 0,
    ) {}

    /**
     * Construct from raw (unresolved) class::method callback string.
     * The resolve Callable is deferred to the Hook\Registry which has
     * access to autoloader and namespace context at boot time.
     */
    public static function fromRaw(string $hook, callable|string $callback, int $priority = 0): self
    {
        return new self($hook, $callback, $priority);
    }
}

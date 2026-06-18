<?php
declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

/**
 * Minimal dependency-injection container supporting:
 *   • register(string $key, callable $fn): void  (factory closure)
 *   • resolve(string $key): mixed                (call factory or return value)
 *   • singleton(string $key): mixed              (resolve once, cache result)
 *   • set(object|string $key, object|callable $value): void (direct binding)
 * Documentation: docs/development/architecture/Container.md
 */
final class Container {

    /** @var array<string,mixed>  bound factories / closures */
    private array $factories = [];

    /** @var array<string,true>  marked singletons */
    private array $singletons = [];

    /** @var array<string,mixed>  resolved / cached singleton instances       */
    private array $instances = [];

    /* ─── registration ────────────────────────────────────────────── */

    /** Bind a factory (callable) to `$key`.      */
    public function register(string $key, callable $fn): void {
        $this->factories[$key] = $fn;
    }

    /** Register `$value` directly as a bound instance / object. */
    public function set(string $key, mixed $value): void {
        $this->factories[$key] = static fn () => $value;
    }

    /* ─── resolution ──────────────────────────────────────────────── */

    /** Resolve a service by `$key` from its factory.          */
    public function resolve(string $key): mixed {
        if (!\array_key_exists($key, $this->factories)) {
            throw new \InvalidArgumentException("No bound service for {$key}");
        }

        return ($this->factories[$key])($this);
    }

    /** Resolve as a singleton (first call; caches forever).     */
    public function singleton(string $key): mixed {
        if (\array_key_exists($key, $this->instances)) {
            return $this->instances[$key];
        }

        $instance = $this->resolve($key);
        $this->instances[$key]  = $instance;
        $this->singletons[$key] = true;

        return $instance;
    }

    /** Check whether a given key is registered as a singleton. */
    public function isSingleton(string $key): bool {
        return \array_key_exists($key, $this->singletons);
    }

    /* ─── introspection ──────────────────────────────────────────── */

    /** Whether the container knows about `$key`.                     */
    public function has(string $key): bool {
        return \array_key_exists($key, $this->factories)
            || \array_key_exists($key, $this->instances);
    }

}

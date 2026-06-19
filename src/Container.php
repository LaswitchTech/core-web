<?php
declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

/**
 * Minimal dependency-injection container supporting three binding strategies:
 *   • factory (fresh instance per resolution via ``register()``)
 *   • singleton (cached once via ``singleton()`` or ``registerSingleton()``)
 *   • direct value (stored as-is via ``set()``)
 *
 * Documentation: docs/development/architecture/Container.md
 */
final class Container {

    /** @var array<string,mixed>  bound factories / closures                    */
    private array $factories = [];

    /** @var array<string,true>   marked singleton keys (singleton() or registerSingleton()) */
    private array $singletons = [];

    /** @var array<string,mixed>  resolved instances (only populated for singletons)          */
    private array $instances = [];

    /* ─── registration ────────────────────────────────────────────── */

    /** Bind a factory (callable) to `$key`. Invalidates any prior singleton cache for this key. */
    public function register(string $key, callable $fn): void {
        $this->factories[$key] = $fn;
        unset($this->singletons[$key], $this->instances[$key]);
    }

    /** Mark an existing registration as singleton (cached after first resolution). Resolves and returns the result. */
    public function singleton(string $key): mixed {
        $this->singletons[$key] = true;
        return $this->resolve($key);
    }

    /** Register a new factory and mark it as singleton in one call. Invalidates prior cached instance for this key.                  */
    public function registerSingleton(string $key, callable $fn): void {
        $this->factories[$key]  = $fn;
        $this->singletons[$key] = true;
        unset($this->instances[$key]);
    }

    /** Store a value directly — stored as a factory that always returns the same data. Invalidates singleton cache for this key.     */
    public function set(string $key, mixed $value): void {
        $this->factories[$key] = static fn () => $value;
        unset($this->singletons[$key], $this->instances[$key]);
    }

    /* ─── resolution ──────────────────────────────────────────────── */

    /**
     * Resolve a service by `$key`.
     *
     * If the key is marked singleton, resolves once and caches the result;
     * all subsequent calls return the cached instance without re-invoking the factory.
     */
    public function resolve(string $key): mixed {
        if (!\array_key_exists($key, $this->factories)) {
            throw new \InvalidArgumentException("No bound service for {$key}");
        }

        // Singleton: first call resolves and caches; subsequent calls return cache.
        if (isset($this->singletons[$key])) {
            if (\array_key_exists($key, $this->instances)) {
                return $this->instances[$key];
            }
            return $this->instances[$key] = ($this->factories[$key])($this);
        }

        // Factory: always invoke fresh.
        return ($this->factories[$key])($this);
    }

    /* ─── introspection ──────────────────────────────────────────── */

    /** Whether the container knows about `$key` (factory, singleton, or cached instance). */
    public function has(string $key): bool {
        return \array_key_exists($key, $this->factories)
            || \array_key_exists($key, $this->instances);
    }

    /** Check whether a key is marked as a singleton (singleton or registerSingleton).     */
    public function isSingleton(string $key): bool {
        return \array_key_exists($key, $this->singletons);
    }

}

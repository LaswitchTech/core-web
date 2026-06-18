<?php

namespace Laswitchtech\CoreWeb\Hook;

/**
 * Lightweight hook registry for plugin/theme callbacks.
 * Documentation: docs/development/architecture/Hook/Registry.md
 *
 * Hook names are dotted namespaces (e.g., `layout.header`).
 * Multiple callbacks can register to the same hook — they fire in priority-descending order.
 */
final class Registry
{
    /** @var array<string,array<int,list<Plugin>>>  hook => [priority => [Plugin, ...]] */
    private array $hooks = [];

    /**
     * Register a callback under `$hook` at the given `$priority`.
     */
    public function addCallback(string $hook, callable $callback, int $priority = 0): void
    {
        $this->hooks[$hook][$priority][] = \Laswitchtech\CoreWeb\Hook\Plugin::fromRaw($hook, $callback, $priority);
    }

    /**
     * Register a class::method callback under `$hook` at the given `$priority`.
     * Fails fast during bootstrap — throws if the class or method does not exist.
     */
    public function addClassCall(string $hook, string $callback, int $priority = 0): void
    {
        if (!str_contains($callback, '::')) {
            throw new \InvalidArgumentException(
                "Callback must be in ClassName::methodName format. Got: {$callback}"
            );
        }

        [$class, $method] = explode('::', $callback, 2);

        // Fail fast at registration/boot time
        if (!class_exists($class)) {
            throw new \RuntimeException(
                "Cannot register hook '{$hook}': class '{$class}' does not exist."
            );
        }

        if (!method_exists($class, $method)) {
            throw new \BadMethodCallException(
                "Cannot register hook '{$hook}': method '{$class}::{$method}' does not exist."
            );
        }

        // Resolve to invokable closure: attempt call_user_func for static or instance.
        $this->addCallback($hook, static fn (...$args) => $callback(...$args), $priority);
    }

    /**
     * Fire all registered callbacks for `$hook`, passing `$context` to each.
     * Higher priority callbacks fire first on the same hook.
     *
     * @param  mixed[] $context  shared context array passed to every callback
     * @return array<list<mixed>>  accumulated return values keyed by priority then index
     */
    public function trigger(string $hook, array $context = []): array
    {
        if (!isset($this->hooks[$hook]) || empty($this->hooks[$hook])) {
            return [];
        }

        // Sort priorities descending (highest first).
        krsort($this->hooks[$hook], SORT_REGULAR);

        $results = [];
        foreach ($this->hooks[$hook] as $priority => $callbacks) {
            foreach ($callbacks as $i => $hookEntry) {
                try {
                    $results[$priority][$i] = [$hookEntry->callback(...$context)];
                } catch (\Throwable $e) {
                    // Fail individual callbacks without halting bootstrap.
                    $results[$priority][$i] = ['__error' => $e->getMessage()];
                }
            }
        }

        return $results;
    }

    /**
     * Return all registered PluginHook entries for `$hook`.
     */
    public function getHooks(string $hook): array
    {
        if (!isset($this->hooks[$hook])) {
            return [];
        }

        krsort($this->hooks[$hook], SORT_REGULAR);

        $entries = [];
        foreach ($this->hooks[$hook] as $priority => $callbacks) {
            $entries = [...$entries, ...$callbacks];
        }

        return $entries;
    }

    /** Resolve a class::method pair into an invokable closure. */
    private function resolvingCallable(string $callback): callable
    {
        if (!str_contains($callback, '::')) {
            throw new \InvalidArgumentException(
                "Callback must be in ClassName::methodName format. Got: {$callback}"
            );
        }

        [$class, $method] = explode('::', $callback, 2);

        return static function (...$args) use ($class, $method): mixed {
            if (!method_exists($class, $method)) {
                throw new \BadMethodCallException(
                    "Method {$class}::{$method} does not exist."
                );
            }
            return $class::$method(...$args);
        };
    }
}

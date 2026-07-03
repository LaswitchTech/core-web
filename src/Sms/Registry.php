<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Sms;

use Laswitchtech\CoreWeb\Message\SmsProviderInterface;

/**
 * Registry for SMS providers with precedence-based resolution.
 *
 * Stores providers keyed by their lowercase name and applies first-match-wins
 * or higher-priority overrides based on registration source (app > plugin > core).
 */
final class Registry
{
    private const PRECEDENCE = [
        'app' => 3,
        'plugin' => 2,
        'core' => 1,
    ];

    /** @var array<string, SmsProviderInterface> Providers keyed by lowercase name */
    private array $providers = [];

    /** @var array<string, string> Registration origins keyed by lowercase name */
    private array $origins = [];

    /** @var array<string, int> Precedence values keyed by lowercase name */
    private array $precedences = [];

    /** @var array<string, int> Priority values keyed by lowercase name */
    private array $priorities = [];

    /** @var array<string, int> Registration order (monotonic counter) keyed by lowercase name */
    private array $orders = [];

    /** @var int Monotonically increasing counter for registration order tracking */
    private int $order = 0;

    /**
     * Register or replace an SMS provider.
     *
     * A new registration only replaces an existing provider if:
     * - It has a higher precedence (app > plugin > core)
     * - Precedence is equal and the new priority is higher
     * - Both precedence and priority are equal — first registration wins
     */
    public function register(SmsProviderInterface $provider, string $origin = 'plugin', int $priority = 0): void
    {
        $name = strtolower(trim($provider->name()));
        $newPrec = self::PRECEDENCE[$origin] ?? 1;

        if (isset($this->precedences[$name])) {
            $existingPrec = $this->precedences[$name];
            $existingPri  = $this->priorities[$name];
            $existingOrd  = $this->orders[$name];

            // Precedence wins: higher value takes priority
            if ($newPrec < $existingPrec) {
                return;
            }

            // Equal precedence: higher priority wins
            if ($newPrec === $existingPrec && $priority < $existingPri) {
                return;
            }

            // Equal precedence and priority: first registration wins
            if ($newPrec === $existingPrec && $priority === $existingPri) {
                return;
            }
        }

        // Store provider and its metadata
        $this->providers[$name] = $provider;
        $this->origins[$name]   = $origin;
        $this->precedences[$name] = $newPrec;
        $this->priorities[$name]  = $priority;
        $this->orders[$name]     = ++$this->order;
    }

    /** Check if a provider by name exists. */
    public function has(string $name): bool
    {
        return isset($this->providers[strtolower(trim($name))]);
    }

    /** Get a provider by name, or null if not found. */
    public function get(string $name): ?SmsProviderInterface
    {
        return $this->providers[strtolower(trim($name))] ?? null;
    }

    /** Return all registered providers keyed by lowercase name. */
    public function all(): array
    {
        return $this->providers;
    }
}

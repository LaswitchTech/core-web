<?php
declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

/**
 * Minimal configuration loader.
 * Documentation: docs/development/architecture/Config.md
 *
 * Loads ordered `.cfg` JSON files, deep-merges them (later overrides earlier),
 * and provides dot-notation keyed access.  Only the static API is used by
 * the bootstrap; a richer Config class with typed getters and persistence will
 * follow when the Configuration Manager task begins.
 */
final class Config {

    /** @var array<string,mixed>|null  merged configuration payload */
    private static ?array $config = null;

    /* ─── public API ────────────────────────────────────────────── */

    /** Load & merge zero or more JSON `.cfg` files left-to-right.      */
    public static function load(array $paths): void {
        $result = [];

        foreach ($paths as $path) {
            if ($path === null || !is_file($path)) continue;

            $json = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \JsonException(
                    "Failed to parse configuration file \"{$path}\": " . json_last_error_msg(),
                    json_last_error()
                );
            }

            $result = self::deepMerge($result, $json ?? []);
        }

        self::$config = $result;
    }

    /** Retrieve a value by dot-notation key path; falls back to `$default`. */
    public static function get(string $key, mixed $default = null): mixed {
        if (self::$config === null) return $default;

        $tokens = explode('.', $key);
        $value  = self::$config;

        foreach ($tokens as $token) {
            if (!\is_array($value) || !\array_key_exists($token, $value)) {
                return $default;
            }
            $value = $value[$token];
        }

        return $value;
    }

    /** Return the entire configuration payload (read-only). */
    public static function all(): ?array {
        return self::$config;
    }

    /* ─── helpers ─────────────────────────────────────────────────── */

    private static function deepMerge(array $base, array $override): array {
        foreach ($override as $key => $value) {
            if (\is_array($value) && \array_key_exists($key, $base) && \is_array($base[$key])) {
                $base[$key] = self::deepMerge($base[$key], $value);  // recurse when both sides are arrays
            } elseif ($value === null) {
                unset($base[$key]);  // null in override deletes the key
            } else {
                $base[$key] = $value;  // override wins for scalars / collections
            }
        }
        return $base;
    }
}

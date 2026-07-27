<?php
declare(strict_types=1);

namespace Laswitchtech\CoreWeb;

/**
 * Writable configuration manager.
 *
 * Loads ordered `.cfg` JSON files at construction (deep-merge), provides
 * runtime getters / setters for nested dot-key paths, and persists only
 * `local.cfg`.  CoreCfg is never modified after boot.
 */
final class ConfigManager {

    /** @var array<string,mixed> current merged configuration payload */
    private array $config;

    /** @var list<non-empty-string>|null ordered file paths (resolves lazily) */
    private ?array $configPaths = null;

    /** @var array<string,mixed>|null parsed local override payload (or null when unavailable) */
    private ?array $localData = null;

    /* ── construction ─────────────────────────────────────────── */

    public function __construct() {
        $this->config = [];
    }

    /** Create a manager pre-loaded from the given ordered file list (later overrides earlier, deep-merged). */
    public static function loadPaths(array $paths): self {
        $manager = new self();
        $result  = [];

        foreach ($paths as $path) {
            if ($path === null || !is_file($path)) continue;

            if (basename((string)$path) === 'local.cfg') {
                $json = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \JsonException(
                        "Failed to parse local configuration file \"{$path}\": " . json_last_error_msg(),
                        json_last_error()
                    );
                }

                $manager->localData = $json ?? [];
            } else {
                $json = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \JsonException(
                        "Failed to parse configuration file \"{$path}\": " . json_last_error_msg(),
                        json_last_error()
                    );
                }

                $result = self::deepMerge($result, $json ?? []);
            }
        }

        $manager->config   = $result;
        $manager->configPaths = $paths;
        return $manager;
    }

    /* ── path helpers ─────────────────────────────────────────── */

    /** Return the current file list (null if none set). */
    public function configPaths(): ?array {
        return $this->configPaths;
    }

    /** Set the ordered file list. Does not reload — use loadPaths() to re-read. */
    public function setConfigPaths(array $paths): self {
        $this->configPaths = $paths;
        return $this;
    }

    /* ── immutable read (no side effects) ─────────────────────── */

    /** Retrieve a nested value via dot-notation; returns `$default` when absent.   */
    public function get(string $key, mixed $default = null): mixed {
        $tokens = explode('.', $key);
        $value  = $this->config;

        foreach ($tokens as $token) {
            if (!\is_array($value) || !\array_key_exists($token, $value)) {
                return $default;
            }
            $value = $value[$token];
        }

        return $value;
    }

    /** Return the entire configuration payload (read-only). */
    public function all(): array {
        return $this->config;
    }

    /** Whether a dot-notation key exists in the current payload.          */
    public function has(string $key): bool {
        $tokens = explode('.', $key);
        $value  = $this->config;

        foreach ($tokens as $token) {
            if (!\is_array($value) || !\array_key_exists($token, $value)) {
                return false;
            }
            $value = $value[$token];
        }

        return true;
    }

    /** Whether a dot-notation key exists in the local override payload only. */
    public function hasLocal(string $key): bool {
        if ($this->localData === null) {
            return false;
        }

        $tokens = explode('.', $key);
        $value  = $this->localData;

        foreach ($tokens as $token) {
            if (!\is_array($value) || !\array_key_exists($token, $value)) {
                return false;
            }
            $value = $value[$token];
        }

        return true;
    }

    /** Retrieve a nested value from the local override payload via dot-notation; returns `$default` when absent. */
    public function getLocal(
        string $key,
        mixed $default = null,
    ): mixed {
        if ($this->localData === null) {
            return $default;
        }

        $tokens = explode('.', $key);
        $value  = $this->localData;

        foreach ($tokens as $token) {
            if (!\is_array($value) || !\array_key_exists($token, $value)) {
                return $default;
            }
            $value = $value[$token];
        }

        return $value;
    }

    /* ── mutation ───────────────────────────────────────────────── */

    /** Set a nested value using dot-notation path. Creates intermediate arrays as needed. */
    public function set(string $key, mixed $value): self {
        $tokens = explode('.', $key);
        // Navigate/create to the penultimate level in-place.
        $current = &$this->config;

        $max = count($tokens) - 1;
        for ($i = 0; $i < $max; $i++) {
            $t = $tokens[$i];

            if (!\is_array($current)) {
                $current = [];
            }

            if (!\array_key_exists($t, $current) || !\is_array($current[$t])) {
                $current[$t] = [];
            }

            $current = &$current[$t];
        }

        // Last token: write the actual value.
        $lastToken = end($tokens);
        $current[$lastToken] = $value;

        return $this;
    }

    /** Unset (delete) a nested key.  No error when absent; silently ignored.   */
    public function unsetKey(string $key): self {
        if (!$this->has($key)) return $this;   // idempotent

        $tokens = explode('.', $key);
        $current = &$this->config;

        $max = count($tokens) - 1;
        for ($i = 0; $i < $max; $i++) {
            if (!\is_array($current) || !\array_key_exists($tokens[$i], $current)) {
                return $this;   // path already missing — defensive exit
            }
            $current = &$current[$tokens[$i]];
        }

        unset($current[end($tokens)]);
        return $this;
    }

    /* ── persistence (local.cfg only) ──────────────────────────── */

    /** Persist in-memory config to `config/local.cfg`.  Creates the directory if needed.

     * Uses LOCK_EX for safe concurrency.  Writes a defensive copy so
     * on-disk data can never alter the live payload without re-boot or reload.

     * @throws \RuntimeException when directory creation or file write fails.
     */
    public function saveLocal(): void {
        // Resolve path: relative to current working directory (per bootstrap convention).
        if ($this->configPaths !== null) {
            foreach ($this->configPaths as $path) {
                if (\is_file($path) && basename((string)$path) === 'local.cfg') {
                    $this->persistToFile($path);
                    return;
                }
            }
        }

        // Fallback: resolve relative to cwd.
        $localConfigPath = './config/local.cfg';

        $dir = dirname($localConfigPath);
        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0755, true)) {
                throw new \RuntimeException("Cannot create directory for local config: {$dir}");
            }
        }

        $this->persistToFile($localConfigPath);
    }


    /** Persist payload to an absolute path with LOCK_EX. */
    private function persistToFile(string $path): void {
        $dir = dirname($path);

        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0755, true)) {
                throw new \RuntimeException("Cannot create directory for local config: {$dir}");
            }
        }

        // Write a defensive copy (json_encode produces an independent serialisation).
        $output = json_encode($this->config, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);

        if (file_put_contents($path, "\n" . $output . "\n", LOCK_EX) === false) {
            throw new \RuntimeException("Cannot write local config to {$path}");
        }
    }

    /* ── helpers ─────────────────────────────────────────────── */

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

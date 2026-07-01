<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Manifest;

use JsonException;
use Laswitchtech\CoreWeb\Manifest\Extension;

/**
 * Parse and validate extension manifests (.json files) from ext/ directories.
 * Documentation: docs/development/architecture/Manifest/Parser.md
 *
 * Schema required keys: type (theme|plugin), name (string), version (X.Y.Z).
 * Optional keys       : hooks ([]), layouts ([]), depends ([] of name-slugs).
 *
 * discover() is tolerant by design: individual malformed manifests are logged to STDERR
 * and skipped so one broken extension does not block discovery of valid extensions.
 * Bootstrap still fails fast on unresolved dependencies between successfully parsed manifests.
 */
final class Parser
{

    /**
     * Canonical manifest filenames that the walker will look for.
     */
    const VALID_MANIFEST_NAMES = ['manifest.json', 'extension.json'];

    // ---- discovery --------------------------------------------------

    /**
     * Find all extension directories in ext/themes/* and ext/plugins/*.
     * and parse each manifest into an Extension.
     *
     * @param  string $baseDir  Root directory (usually __DIR__ . '/../../ext').
     * @return list<Extension>
     */
    public static function discover(string $baseDir, string $origin = 'framework'): array
    {
        if (!is_dir($baseDir)) {
            return [];
        }

        $manifests = [];
        foreach (['themes', 'plugins'] as $typeDir) {
            $typePath = "{$baseDir}/{$typeDir}";
            if (!is_dir($typePath)) {
                continue;
            }

            foreach (\scandir($typePath) as $entry) {
                // Skip . and .. entries.
                if ($entry[0] === '.') {
                    continue;
                }

                $extDir  = "{$typePath}/{$entry}";
                if (!is_dir($extDir)) {
                    continue;
                }

                // Look for any valid manifest filename.
                $manifestFile = null;
                foreach (self::VALID_MANIFEST_NAMES as $name) {
                    $candidate = "{$extDir}/{$name}";
                    if (is_file($candidate)) {
                        $manifestFile = $candidate;
                        break;  // take the first match.
                    }
                }

                if ($manifestFile === null) {
                    continue;  // no valid manifest in this directory.
                }

                try {
                    $manifests[] = self::parse($manifestFile, $origin);
                } catch (\Throwable $e) {
                    // Log but continue — one bad manifest does not block others.
                    fwrite(STDERR, "Manifest parse error for {$extDir}: {$e->getMessage()}\n");
                }
            }
        }

        return $manifests;
    }

    // ---- singular parse --------------------------------------------

    /**
     * Parse and validate a single manifest.json file path.
     *
     * @throws JsonException          When JSON is invalid or required keys missing.
     * @throws \InvalidArgumentException When values fail schema validation.
     */
    public static function parse(string $filePath, string $origin = 'framework'): Extension
    {
        if (!is_file($filePath)) {
            throw new \InvalidArgumentException("Manifest file not found: {$filePath}");
        }

        $json = json_decode(
            (string)file_get_contents($filePath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        return self::validate($json, $filePath, $origin);
    }

    /**
     * Validate and normalize a decoded manifest array into an Extension.
     */
    public static function validate(array $data, string $filePath = '', string $origin = 'framework'): Extension
    {
        // -- required fields -------------------------------------------
        foreach (['type', 'name', 'version'] as $field) {
            if (!isset($data[$field]) || !is_string($data[$field]) || $data[$field] === '') {
                throw new \InvalidArgumentException(
                    "Manifest must contain non-empty string field '{$field}'. "
                    . ($filePath !== '' ? "File: {$filePath}. " : '')
                    . 'Got: ' . var_export($data[$field] ?? null, true)
                );
            }
        }

        // -- type enforcement ------------------------------------------
        $type = strtolower((string)$data['type']);
        if ($type !== 'theme' && $type !== 'plugin') {
            throw new \InvalidArgumentException(
                "Manifest 'type' must be 'theme' or 'plugin'. Got: {$data['type']}"
            );
        }

        // -- name & version --------------------------------------------
        $name    = trim((string)$data['name']);
        $version = (string)$data['version'];

        // Normalize version to X.Y.Z
        $normalizedVersion = self::normalizeVersion($version);

        // -- optional fields (with defaults) ---------------------------
        $hooks   = is_array($data['hooks'] ?? null) ? self::validateHooks((array)$data['hooks']) : [];
        $layouts = is_array($data['layouts'] ?? null) ? array_values($data['layouts']) : ([]);
        $depends = is_array($data['depends'] ?? null) ? array_values($data['depends']) : ([]);

        foreach ($depends as $dep) {
            if (!is_string($dep) || $dep === '') {
                throw new \InvalidArgumentException(
                    "Manifest 'depends' entries must be non-empty strings. Got: " . var_export($dep, true)
                );
            }
        }

        // -- kernel-compat (optional, stored as-is) --------------------
        $kernelCompat = null;
        if (isset($data['kernel-compat']) && is_string($data['kernel-compat']) && $data['kernel-compat'] !== '') {
            $kernelCompat = $data['kernel-compat'];
        }

        return new Extension(
            file:      $filePath,
            type:      $type,
            name:      $name,
            version:   $normalizedVersion,
            hooks:     $hooks,
            layouts:   $layouts,
            depends:   $depends,
            directory: dirname($filePath),
            kernelCompat: $kernelCompat,
            origin:    $origin,
        );
    }

    // ---- helpers ----------------------------------------------------

    /** Ensure version matches SemVer-like pattern (X.Y.Z). */
    private static function normalizeVersion(string $version): string
    {
        // Strip common prefixes (v, V, =) and whitespace.
        $trimmed = ltrim(trim($version), 'vV= ');

        if (!preg_match('/^\d+\.\d+\.\d+$/', $trimmed)) {
            throw new \InvalidArgumentException(
                "Manifest 'version' must be X.Y.Z format. Got: {$version}"
            );
        }

        return $trimmed;
    }

    /** Validate hooks array entries — each must be a string. */
    private static function validateHooks(array $hooks): array
    {
        foreach ($hooks as $hook) {
            if (!is_string($hook) || $hook === '') {
                throw new \InvalidArgumentException(
                    "Manifest 'hooks' entries must be non-empty strings. Got: " . var_export($hook, true)
                );
            }

            // Allow dotted namespaces, class::method pairs, and fully-qualified
            // class paths with backslash separators — e.g.:
            //   layout.header
            //   plugin.started::Class::method
            //   plugin.started::Laswitchtech\CoreWeb\Plugin\Class::onStart
            // Use literal backslash via regex `\\` inside character classes — \x5c is unreliable in [..].
            if (!preg_match('/^[a-zA-Z0-9_]+(?:[:.\\\\][a-zA-Z0-9_.\\\\:]*[a-zA-Z0-9_])?$/', $hook)) {
                throw new \InvalidArgumentException(
                    "Manifest 'hooks' entry is invalid: {$hook}"
                );
            }
        }
        return array_values($hooks);
    }
}

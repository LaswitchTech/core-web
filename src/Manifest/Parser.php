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

    /**
     * AUTO-UPDATE: bump on framework release.
     */
    public const KERNEL_VERSION = '1.0.0';

    // ---- discovery --------------------------------------------------

    /**
     * Find all extension directories in ext/themes/* and ext/plugins/*.
     * and parse each manifest into an Extension.
     *
     * @param  string $baseDir  Root directory (usually __DIR__ . '/../../ext').
     * @return list<Extension>
     */
    public static function discover(string $baseDir, string $origin = 'kernel'): array
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
    public static function parse(string $filePath, string $origin = 'kernel'): Extension
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
    public static function validate(array $data, string $filePath = '', string $origin = 'kernel'): Extension
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

        // -- lock (optional, not required; defaults resolved at runtime via Extension::isLocked()) --
        $setLock = null;  // `null` means "not declared in manifest → use origin-aware default"
        if (isset($data['locked'])) {
            $setLock = filter_var($data['locked'], FILTER_VALIDATE_BOOLEAN);
        }

        // -- kernel-compat (optional, stored as-is) --------------------
        $kernelCompat = null;
        if (isset($data['kernel-compat']) && is_string($data['kernel-compat']) && $data['kernel-compat'] !== '') {
            $kernelCompat = $data['kernel-compat'];
        }

        // -- autoload.psr-4 (optional, additive) -----------------------
        $psr4Mappings = [];
        if (
            isset($data['autoload']) && is_array($data['autoload'])
            && isset($data['autoload']['psr-4']) && is_array($data['autoload']['psr-4'])
        ) {
            foreach ($data['autoload']['psr-4'] as $rawPrefix => $relativeDir) {
                // prefix: non-empty string ending with backslash.
                if (
                    !is_string($rawPrefix) || $rawPrefix === ''
                    || substr($rawPrefix, -1) !== '\\'
                ) {
                    fwrite(STDERR, "Manifest autoload.psr-4: invalid namespace prefix for key '{$rawPrefix}' in {$filePath}\n");
                    continue;
                }

                // directory: non-empty string.
                if (!is_string($relativeDir) || $relativeDir === '') {
                    fwrite(STDERR, "Manifest autoload.psr-4: empty directory for namespace '{$rawPrefix}' in {$filePath}\n");
                    continue;
                }

                // Strip leading/trailing forward-slashes and backslashes from path.
                $normalizedDir = trim($relativeDir, '/\\');
                if ($normalizedDir === '') {
                    fwrite(STDERR, "Manifest autoload.psr-4: empty normalized directory for namespace '{$rawPrefix}' in {$filePath}\n");
                    continue;
                }

                $psr4Mappings[] = [
                    'prefix'   => $rawPrefix,  // trailing backslash preserved as declared.
                    'directory'=> str_replace('\\', '/', $normalizedDir),
                ];
            }
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
            psr4Mappings: $psr4Mappings,
            lock:       isset($setLock) ? $setLock : null,
        );
    }

    // ---- compatibility checker --------------------------------------

    /**
     * Check whether a kernel-compat constraint matches a given kernel version.
     *
     * Supported operators:
     *   "^X.Y.Z" → same major version as kernel.
     *   "~X.Y.Z" → same major and minor as kernel, kernel patch >= constraint patch.
     *   "1.0.0"  → exact version match (uses PHP's version_compare with '==').
     * Unrecognized or empty constraints always return true by default
     * so that unknown patterns don't block valid extensions.
     */
    public static function checkCompat(string $constraint, string $kernel): bool
    {
        $constraint = trim($constraint);
        if ($constraint === '') {
            return true;
        }

        // -- caret: ^X.Y.Z (or ^A.B variants) -------------------------
        if ($constraint[0] === '^') {
            [$cmaj, $cmin, $cpatch] = self::tokenVersion(substr($constraint, 1));
            [$kmaj, $kmin, $kpatch] = self::tokenVersion($kernel);
            return $cmaj !== null && $cmaj === $kmaj;
        }

        // -- tilde: ~X.Y.Z (or ~A.B variants) -------------------------
        if ($constraint[0] === '~') {
            [$cmaj, $cmin, $cpatch] = self::tokenVersion(substr($constraint, 1));
            [$kmaj, $kmin, $kpatch] = self::tokenVersion($kernel);
            // Major and minor must match exactly; patch of kernel >= constraint patch.
            return ($cmaj !== null && $cmaj === $kmaj && $cmin === $kmin)
                ? ($cpatch === null || $kpatch >= $cpatch)
                : false;
        }

        // -- exact numeric (e.g. "1.0.0") ------------------------------
        if (\preg_match('/^\d+\.\d+\.\d+$/', $constraint)) {
            return version_compare($kernel, $constraint, '==');
        }

        // -- unrecognized → permissive ---------------------------------
        return true;
    }

    /**
     * Tokenize a version string into [major, minor, patch].
     * Returns [null|null|null] when the string does not start with digits.
     */
    private static function tokenVersion(string $v): array
    {
        // Trim whitespace, then strip only leading non-digit characters (^, ~, =, etc.)
        // without removing the leading digits themselves.
        $v   = \trim($v);
        $stripped = \preg_replace('/^[\D]+/', '', $v) ?? $v;

        $parts = \explode('.', $stripped);
        if (\count($parts) < 1 || !\is_numeric($parts[0])) {
            return [null, null, null];
        }

        $major = (int) $parts[0];
        $minor = isset($parts[1]) && \is_numeric($parts[1]) ? (int) $parts[1] : 0;
        $patch = isset($parts[2]) && \is_numeric($parts[2]) ? (int) $parts[2] : 0;

        return [$major, $minor, $patch];
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

<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Manifest;

/**
 * Immutable value object representing a parsed extension manifest.
 * Documentation: docs/development/architecture/Manifest/Extension.md
 */
final readonly class Extension
{
    public function __construct(
        /** @var string Manifest file path that was parsed */
        public string $file,

        /** @var string One of 'theme' or 'plugin' */
        public string $type,

        /** @var string Display name/slug for this extension */
        public string $name,

        /** @var string Semantic version (X.Y.Z) */
        public string $version,

        /** @var list<string> Hook callback definitions registered by this extension. */
        public array $hooks,

        /** @var list<string> Layout names provided (themes only). */
        public array $layouts,

        /** @var string Absolute directory containing the manifest */
        public string $directory,

        /** @var list<string> Extension name-slug dependencies that must be loaded first. */
        public array $depends = [],

        /** @var ?string Kernel compatibility constraint (e.g. "^1.0"), or null if not declared. */
        public ?string $kernelCompat = null,

        /** @var string Discovery origin: 'app' or 'kernel'. Defaults to 'kernel'. */
        public string $origin = 'kernel',

        /** @var list<array{prefix: string, directory: string}> PSR-4 namespace mappings declared by the extension manifest. */
        public array $psr4Mappings = [],

        /** @var null|bool Explicit lock setting declared in the manifest; `null` means not declared (resolved default applied via `isLocked()`). */
        public ?bool $lock = null
    ) {
        if ($origin !== 'app' && $origin !== 'kernel') {
            throw new \InvalidArgumentException(sprintf(
                'Extension origin must be "app" or "kernel"; got "%s".',
                $origin,
            ));
        }
    }

    /** Resolved lock state derived from manifest declaration and discovery origin.
     *
     *  - Explicit `"locked": true`   → `true`
     *  - Explicit `"locked": false`  → `false`
     *  - Not declared + origin='kernel' → `true` (kernel extensions are locked by default)
     *  - Not declared + origin='app'    → `false` (app extensions are unlocked by default)
     */
    public function isLocked(): bool {
        if ($this->lock !== null) {
            return $this->lock;
        }
        return $this->origin === 'kernel';
    }

} // class Extension

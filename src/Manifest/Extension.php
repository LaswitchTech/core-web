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

        /** @var string Discovery origin: 'app' or 'framework'. Defaults to 'framework'. */
        public string $origin = 'framework',
    ) {
        if ($origin !== 'app' && $origin !== 'framework') {
            throw new \InvalidArgumentException(sprintf(
                'Extension origin must be "app" or "framework"; got "%s".',
                $origin,
            ));
        }

        // type is enforced by the parser; kept as a runtime contract reminder.
    }
}

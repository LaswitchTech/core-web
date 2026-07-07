<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

/**
 * Immutable value object representing a registered template entry in the registry.
 */
final readonly class TemplateEntry
{
    public function __construct(
        /** @var string Template namespace (e.g., 'mail', 'sms') */
        public string $namespace,

        /** @var string Template name */
        public string $template,

        /** @var string Absolute path to the template file */
        public string $path,

        /** @var int Registration priority (higher overrides lower) */
        public int $priority,

        /** @var string Source origin of this template */
        public string $origin,

        /** @var string|null Extension name if from an extension, null for core */
        public ?string $extension = null,
    ) {}
}

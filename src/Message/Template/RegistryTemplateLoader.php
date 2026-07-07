<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

use RuntimeException;

/**
 * Template loader that resolves templates through a registry.
 */
final class RegistryTemplateLoader implements TemplateLoaderInterface
{
    private TemplateRegistryInterface $registry;

    public function __construct(TemplateRegistryInterface $registry)
    {
        $this->registry = $registry;
    }

    /** @throws RuntimeException when the template is not found */
    public function has(string $name, string $namespace = 'mail'): bool
    {
        return $this->registry->find($name, $namespace) !== null;
    }

    /** @throws RuntimeException when the file is missing or JSON is invalid */
    public function load(string $name, string $namespace = 'mail'): Template
    {
        $entry = $this->registry->find($name, $namespace);

        if ($entry === null) {
            throw new RuntimeException(
                "Template not found: '{$name}' in namespace '{$namespace}'"
            );
        }

        $path = $entry->getPath();

        if (!is_file($path)) {
            throw new RuntimeException(
                "Template file missing: {$path}"
            );
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException("Cannot read template file: {$path}");
        }

        $data = json_decode($contents, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException(
                "Invalid JSON in template file '{$path}': " . json_last_error_msg()
            );
        }

        // Extract known fields only — rest are silently ignored
        $subject   = is_string($data['subject'] ?? null) ? $data['subject'] : null;
        $plainBody = is_string($data['plainBody'] ?? null) ? (string) $data['plainBody'] : null;
        $htmlBody  = is_string($data['htmlBody'] ?? null) ? (string) $data['htmlBody'] : null;
        $body      = is_string($data['body'] ?? null) ? (string) $data['body'] : null;

        $availableVariables = $this->resolveAvailableVariables(
            $data['availableVariables'] ?? [],
        );

        // If template JSON has plainBody/htmlBody (mail), prefer them over generic body
        if ($plainBody !== null || $htmlBody !== null) {
            $bodyForMail = $plainBody ?? $htmlBody; // use first available body part
        } else {
            $bodyForMail = $body;
        }

        // Resolve template name from JSON data when present and valid
        $resolvedName = is_string($data['name'] ?? null)
            ? (string) $data['name']
            : $name;

        return new Template(
            name:              $resolvedName,
            subject:           $subject,
            plainBody:         $plainBody,
            htmlBody:          $htmlBody,
            body:              $bodyForMail,
            availableVariables: $availableVariables,
        );
    }

    /** @param mixed[] $variables */
    private function resolveAvailableVariables(array $variables): ?array
    {
        if ($variables === []) {
            return null;
        }

        asort($variables);

        return array_values(array_map(
            static fn (mixed $v): string => is_string($v) ? $v : ((string) $v),
            $variables,
        ));
    }
}

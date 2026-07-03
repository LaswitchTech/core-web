<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

use RuntimeException;

final class FileTemplateLoader implements TemplateLoaderInterface
{
    /** @var string */
    private readonly string $appRoot;

    /** @var string */
    private readonly string $coreRoot;

    /** @var list<string> */
    private readonly array $pluginRoots;

    public function __construct(
        string $appRoot,
        string $coreRoot,
        array $pluginRoots = [],
    ) {
        $this->appRoot       = rtrim($appRoot, '/\\');
        $this->coreRoot      = rtrim($coreRoot, '/\\');
        $this->pluginRoots   = array_map(
            static fn (string $root): string => rtrim($root, '/\\'),
            $pluginRoots,
        );
    }

    /** @return non-empty-list<string> Ordered paths: app → plugins → core */
    private function resolvePaths(string $name, string $namespace): array
    {
        $paths = [];

        // Application templates (highest precedence)
        $appPath = "{$this->appRoot}/templates/{$namespace}/{$name}.json";
        if (is_file($appPath)) {
            return [$appPath];
        }

        // Plugin templates (in registration order)
        foreach ($this->pluginRoots as $pluginRoot) {
            $path = "{$pluginRoot}/templates/{$namespace}/{$name}.json";
            if (is_file($path)) {
                $paths[] = $path;
            }
        }

        // Core templates (lowest precedence) — always appended last
        $corePath = "{$this->coreRoot}/templates/{$namespace}/{$name}.json";
        if (is_file($corePath)) {
            return [...$paths, $corePath];
        }

        return $paths;
    }

    /** @throws RuntimeException when no template is found */
    public function has(string $name, string $namespace = 'mail'): bool
    {
        foreach ($this->resolvePaths($name, $namespace) as $path) {
            if (is_file($path)) {
                return true;
            }
        }

        return false;
    }

    /** @throws RuntimeException when the file is missing or JSON is invalid */
    public function load(string $name, string $namespace = 'mail'): Template
    {
        $paths = $this->resolvePaths($name, $namespace);

        foreach ($paths as $path) {
            if (!is_file($path)) {
                continue; // already filtered by resolvePaths — this is safe but defensive
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

        throw new RuntimeException(
            "Template not found: '{$name}' in namespace '{$namespace}'"
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

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

/**
 * Registry for managing template locations with priority ordering.
 */
final class TemplateRegistry implements TemplateRegistryInterface
{
    /**
     * Templates indexed by namespace → name → entry data keyed by highest priority seen so far.
     *
     * @var array<string, array<string, array{template: string, path: string, priority: int, origin: string, extensionName?: string}>>
     */
    private array $templates = [];

    /**
     * {@inheritDoc}
     */
    public function register(
        string $namespace,
        string $template,
        string $path,
        int $priority,
        string $origin,
        ?string $extension = null
    ): void {
        if (!isset($this->templates[$namespace][$template])) {
            $this->templates[$namespace][$template] = [
                'template' => $template,
                'path'     => $path,
                'priority' => $priority,
                'origin'   => $origin,
                'extensionName' => $extension,
            ];

            return;
        }

        // Higher priority overwrites earlier (lower-priority) entries.
        if ($priority > $this->templates[$namespace][$template]['priority']) {
            $this->templates[$namespace][$template] = [
                'template' => $template,
                'path'     => $path,
                'priority' => $priority,
                'origin'   => $origin,
                'extensionName' => $extension,
            ];
        }
    }

    /**
     * {@inheritDoc}
     */
    public function find(string $namespace, string $template): ?TemplateEntry
    {
        $entry = $this->templates[$namespace][$template] ?? null;

        if ($entry === null) {
            return null;
        }

        return new TemplateEntry(
            namespace: $namespace,
            template:  $entry['template'],
            path:      $entry['path'],
            priority:  $entry['priority'],
            origin:    $entry['origin'],
            extension: $entry['extensionName'] ?? null,
        );
    }
}

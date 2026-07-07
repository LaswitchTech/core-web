 <?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

/**
 * Registry for managing template locations with priority ordering.
 */
interface TemplateRegistryInterface
{
    /**
     * Register a template in the registry.
     *
     * Later registrations with higher priority override earlier ones.
     * Lower or equal priorities are silently ignored.
     *
     * @param string $namespace template namespace (e.g. 'mail', 'sms')
     * @param string $template  template name (e.g. 'test')
     * @param string $path      absolute path to the template file
     * @param int    $priority  registration priority (higher wins)
     * @param string $origin    source of the template (core kernel-plugin kernel-theme app app-plugin app-theme)
     * @param string|null $extension extension name if from an extension
     */
    public function register(
        string $namespace,
        string $template,
        string $path,
        int $priority,
        string $origin,
        ?string $extension = null
    ): void;

    /**
     * Find a template by namespace and name.
     *
     * @param string $namespace template namespace (e.g. 'mail', 'sms')
     * @param string $template  template name (e.g. 'test')
     * @return TemplateEntry|null the found entry, or null if not registered
     */
    public function find(string $namespace, string $template): ?TemplateEntry;
}

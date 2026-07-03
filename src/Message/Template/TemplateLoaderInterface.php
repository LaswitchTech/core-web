<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

/**
 * Interface for loading templates from disk or other sources.
 *
 * Implementations resolve templates by name within a given namespace,
 * applying the standard precedence chain (app → plugin → core).
 */
interface TemplateLoaderInterface
{
    /**
     * Load a template by name within the given namespace.
     *
     * @param string $name      identifier for the template (e.g., "welcome_email")
     * @param string $namespace namespace to search in ('mail', 'sms', etc.)
     * @return Template         the loaded template instance
     */
    public function load(string $name, string $namespace = 'mail'): Template;

    /**
     * Check whether a template exists within the given namespace.
     *
     * @param string $name      identifier for the template
     * @param string $namespace namespace to search in
     */
    public function has(string $name, string $namespace = 'mail'): bool;
}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message\Template;

/**
 * Immutable representation of a mail/SMS template ready for rendering.
 */
final readonly class Template
{
    public function __construct(
        /** Unique template identifier within its namespace */
        public string $name,
        /** Optional subject line (template may omit this for SMS) */
        public ?string $subject = null,
        /** Plain-text body content */
        public ?string $plainBody = null,
        /** HTML body content */
        public ?string $htmlBody = null,
        /** Fallback single-part body subject to plainBody/htmlBody when the template has no distinction */
        public ?string $body = null,
        /** Pre-declared variables this template expects (for documentation / validation) */
        public ?array $availableVariables = null,
    ) {}

    /**
     * Return a new Template with all text fields substituted by $vars.
     *
     * Supported syntaxes in templates:
     *   {name}           — replaced with $vars['name'] when present, otherwise left unchanged
     *   {name}::fallback — replaced with $vars['name'] when present, or the literal "fallback"
     */
    public function resolve(array $vars): self
    {
        /** @param array<0|1, string> $match [0] = full token, [1] = variable key, [2] = optional fallback */
        $resolver = static function (array $match) use ($vars): string {
            $full = $match[0];
            $key  = $match[1];
            $fallback = $match[2] ?? null;

            // Fallback syntax: {name}::default (only when index 2 was captured)
            if ($fallback !== null) {
                return array_key_exists($key, $vars) ? (string) $vars[$key] : $fallback;
            }

            // Simple variable: {name}
            return array_key_exists($key, $vars) ? (string) $vars[$key] : $full;
        };

        /** Captures the variable key inside braces and an optional fallback after :: */
        $pattern = '/\{([A-Za-z0-9_.-]+)\}(?:::(.*?))?(?=\s|$|[<.,;:!?\\)\\]\\}])/';

        return new self(
            name:           $this->name,  // template identifiers are not substituted
            subject:        is_string($this->subject) ? preg_replace_callback($pattern, $resolver, $this->subject) : $this->subject,
            plainBody:      is_string($this->plainBody) ? preg_replace_callback($pattern, $resolver, $this->plainBody) : $this->plainBody,
            htmlBody:       is_string($this->htmlBody)  ? preg_replace_callback($pattern, $resolver, $this->htmlBody)  : $this->htmlBody,
            body:           is_string($this->body)      ? preg_replace_callback($pattern, $resolver, $this->body)      : $this->body,
            availableVariables: $this->availableVariables,
        );
    }
}

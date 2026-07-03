<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Sms;

use Laswitchtech\CoreWeb\Message\SmsProviderInterface;
use Laswitchtech\CoreWeb\Message\SmsResult;
use Laswitchtech\CoreWeb\Message\Template\TemplateLoaderInterface;

/**
 * Convenience service for sending SMS messages.
 *
 * Provides two entry points:
 *  - send()              — direct plain-text delivery
 *  - sendTemplate()      — resolve a Template, interpolate variables, deliver
 *
 * Both methods delegate provider resolution and message transport to the
 * internal {@see Resolver} / {@see SmsProviderInterface} pipeline.
 */
final readonly class SmsService
{
    /** @var string namespace used for SMS template lookups (e.g., 'sms') */
    private string $templateNamespace;

    public function __construct(
        /** All registered SMS providers and their ordering/priority */
        private Resolver $resolver,
        /** Template resolution chain (app → plugin → core) */
        private TemplateLoaderInterface $templates,
        string $templateNamespace = 'sms',
    ) {
        $this->templateNamespace = trim($templateNamespace) !== ''
            ? $templateNamespace
            : 'sms';
    }

    // ----------------------------------------------------------- 
    // Public API

    /**
     * Send a plain-text SMS message through the resolved provider.
     *
     * @param string              $to      recipient phone number in E.164 format
     * @param string              $body    plain-text body
     * @param array<string, mixed> $options caller options (provider override, etc.)
     */
    public function send(string $to, string $body, array $options = []): SmsResult
    {
        if (trim($body) === '') {
            return SmsResult::fail('SMS body is empty.');
        }

        // Resolve provider: explicit > null fallback
        $providerName = $options['provider'] ?? null;

        $resolvedProvider = trim((string) $providerName) !== ''
            ? $this->resolver->resolve($providerName)
            : $this->resolver->resolve(null);

        if ($resolvedProvider === null) {
            return SmsResult::fail('No SMS provider available.');
        }

        try {
            return $resolvedProvider->send(trim($to), trim($body), $options);
        } catch (SmsException $e) {
            return SmsResult::fail($e->getMessage());
        }
    }

    /**
     * Load a template, resolve variables via {@see Template::resolve()}, then deliver.
     *
     * @param string               $to      recipient E.164 phone number
     * @param string               $templateName logical template identifier 
     * @param array<string, mixed> $vars       variables for interpolation
     * @param array<string, mixed> $options    caller options (provider override, etc.)
     */
    public function sendTemplate(string $to, string $templateName, array $vars = [], array $options = []): SmsResult
    {
        if (trim($templateName) === '') {
            return SmsResult::fail('Template name is required.');
        }

        // Resolve provider: explicit > null fallback
        $providerName = $options['provider'] ?? null;

        $resolvedProvider = trim((string) $providerName) !== ''
            ? $this->resolver->resolve($providerName)
            : $this->resolver->resolve(null);

        if ($resolvedProvider === null) {
            return SmsResult::fail('No SMS provider available.');
        }

        try {
            $template = $this->templates->load($templateName, $this->templateNamespace);
        } catch (\Throwable $e) {
            return SmsResult::fail("Template load failed: " . $e->getMessage());
        }

        if ($template === null || trim($template->body ?? '') === '') {
            return SmsResult::fail("Template '{$templateName}' has no body content.");
        }

        $resolvedBody = $template->resolve($vars)->body ?? '';

        if (trim($resolvedBody) === '') {
            return SmsResult::fail("Template '{$templateName}' resolved to an empty message.");
        }

        try {
            return $resolvedProvider->send(trim($to), trim($resolvedBody), $options);
        } catch (\Throwable $e) {
            return SmsResult::fail('SMS delivery failed: ' . $e->getMessage());
        }
    }
}

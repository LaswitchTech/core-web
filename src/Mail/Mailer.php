<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Mail;

use Laswitchtech\CoreWeb\Mail\Attachment\ByteArrayAttachment;
use Laswitchtech\CoreWeb\Mail\Attachment\FileAttachment;
use Laswitchtech\CoreWeb\Message\EmailAddress;
use Laswitchtech\CoreWeb\Message\MessageEnvelope;
use Laswitchtech\CoreWeb\Message\MessageProviderInterface;
use Laswitchtech\CoreWeb\Message\Template\TemplateLoaderInterface;

/**
 * Convenience service that bridges envelopes, templates, and providers.
 *
 * Consumers use this class instead of wiring provider/template/config
 * together manually — it handles precedence logic (option fields → defaults)
 * for from-address, recipient lists, body content, etc.
 */
final readonly class Mailer
{
    public function __construct(
        /** SMTP mail provider that writes the envelope to wire */
        private MessageProviderInterface $provider,
        /** Template resolution chain (app → plugin → core) */
        private TemplateLoaderInterface $templates,
        /** SMTP configuration DTO injected by Bootstrap / container */
        private SmtpConfig $config,
    ) {}

    // ────────────────────────────────────────────────────────────
    // Public API

    /**
     * Send a pre-assembled message envelope through the configured provider.
     *
     * @param MessageEnvelope $envelope populated envelope ready for delivery
     */
    public function send(MessageEnvelope $envelope): void
    {
        $this->provider->send($envelope);
    }

    /**
     * Load a template, resolve variables, build an envelope, then deliver.
     *
     * Resolution precedence (lower index wins):
     *   0 — explicit option value              (e.g., $options['from'])
     *   1 — SmtpConfig default                ($this->config->fromAddress)
     *
     * The envelope always gets a valid `from`; unresolved recipients,
     * plainBody, htmlBody and subject fall back to empty-variants.
     *
     * @param string                    $templateName template identifier   (e.g. "welcome_email")
     * @param array<string, mixed>      $vars         variables for interpolation
     * @param array{from?: EmailAddress, to?: list<EmailAddress>, cc?: list<EmailAddress>, bcc?: list<EmailAddress>, replyTo?: EmailAddress, attachments?: list<FileAttachment|ByteArrayAttachment>} $options overrides
     */
    public function sendTemplate(string $templateName, array $vars, array $options = []): void
    {
        if (trim($templateName) === '') {
            throw new \InvalidArgumentException('Template name must not be empty.');
        }

        try {
            // 1. Load template from the config's template namespace
            $loaded = $this->templates->load($templateName, $this->config->templateNamespace);
        } catch (\Throwable $e) {
            throw new SmtpException(sprintf('Failed to load template "%s": %s', $templateName, $e->getMessage()), 0, $e);
        }

        // 2. Solve variables => returns a new resolved Template (immutability preserved)
        $resolved = $loaded->resolve($vars);

        // 3. Build from address: option > config default
        $fromAddress = $options['from'] instanceof EmailAddress
            ? $options['from']
            : new EmailAddress(
                $this->config->fromAddress,
                $this->config->fromName !== '' ? $this->config->fromName : '',
            );

        // 4. Build MessageEnvelope with resolved fields + option overrides (precedence: options → resolved)
        $envelope = new MessageEnvelope(
            from:       $fromAddress,
            to:         $options['to'] ?? [],
            cc:         $options['cc'] ?? [],
            bcc:        $options['bcc'] ?? [],
            replyTo:    $options['replyTo'] ?? null,
            subject:    $resolved->subject !== null ? (string) $resolved->subject : '',
            attachments:$options['attachments'] ?? [],
            plainBody:  $resolved->plainBody !== null ? (string) $resolved->plainBody : ($resolved->body !== null ? (string) $resolved->body : ''),
            htmlBody:   $resolved->htmlBody,
        );

        // 5. Deliver
        $this->provider->send($envelope);
    }
}
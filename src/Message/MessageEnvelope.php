<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message;

use Laswitchtech\CoreWeb\Mail\Attachment\FileAttachment;
use Laswitchtech\CoreWeb\Mail\Attachment\ByteArrayAttachment;

/**
 * Immutable value object representing an email message envelope ready for delivery.
 */
final readonly class MessageEnvelope
{
    public function __construct(
        /** The sender address */
        public EmailAddress $from,
        /** @var list<EmailAddress> */
        public array $to = [],
        /** @var list<EmailAddress> */
        public array $cc = [],
        /** @var list<EmailAddress> */
        public array $bcc = [],
        /** Reply-To address override */
        public ?EmailAddress $replyTo = null,
        /** Email subject line */
        public string $subject = '',
        /** @var list<FileAttachment|ByteArrayAttachment> */
        public array $attachments = [],
        /** Plain-text body content */
        public string $plainBody = '',
        /** Optional HTML body content */
        public ?string $htmlBody = null,
    ) {}

    /**
     * Returns all recipients (to + cc + bcc) for iteration / validation purposes.
     *
     * @return list<EmailAddress>
     */
    public function allRecipients(): array
    {
        return [...$this->to, ...$this->cc, ...$this->bcc];
    }

    /**
     * Returns the effective subject (falls back to an empty string).
     */
    public function getSubject(): string
    {
        return $this->subject;
    }
}

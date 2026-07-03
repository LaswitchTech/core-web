<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Mail\Attachment;

/**
 * Represents an in-memory byte-string attachment for an email message.
 */
final readonly class ByteArrayAttachment
{
    public function __construct(
        /** @var string raw binary data of the attachment */
        public string $data,
        /** @var string filename to present in the email (Content-Disposition header) */
        public string $filename,
        /** @var string|null optional MIME type; if null use a sensible default based on extension */
        public ?string $mime = null,
    ) {}
}

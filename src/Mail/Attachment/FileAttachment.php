<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Mail\Attachment;

/**
 * Represents a file system attachment for an email message.
 */
final readonly class FileAttachment
{
    public function __construct(
        /** @var string absolute path to the attachment file on disk */
        public string $path,
        /** @var string filename to present in the email (Content-Disposition header) */
        public string $filename,
        /** @var string|null optional MIME type; if null the sender must guess from extension */
        public ?string $mime = null,
    ) {}
}

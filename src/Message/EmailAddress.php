<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message;

/**
 * Immutable value object representing an email address with optional display name.
 */
final readonly class EmailAddress
{
    public function __construct(
        /** @var string the actual email address (e.g., user@example.com) */
        public string $address,
        /** @var string optional display name (e.g., "John Doe") */
        public string $name = '',
    ) {}

    /**
     * Format this address for inclusion in an RFC-compliant SMTP header.
     *
     *   • when name is non-empty:  "Display Name <address@example.com>"
     *   • when name is empty:      "address@example.com"
     */
    public function forHeader(): string
    {
        return $this->name !== ''
            ? sprintf('%s <%s>', addcslashes($this->name, '<>'), $this->address)
            : $this->address;
    }
}

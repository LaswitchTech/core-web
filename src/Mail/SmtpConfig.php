<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Mail;

/**
 * Immutable configuration DTO for SMTP mail providers.
 *
 * Keys map directly to `config/smtp.cfg` entries.
 */
final readonly class SmtpConfig
{
    public function __construct(
        /** Whether SMTP sending is enabled */
        public bool $enabled,
        /** SMTP server hostname (e.g., smtp.example.com) */
        public string $host,
        /** SMTP server port (587 for STARTTLS, 465 for SSL/TLS) */
        public int $port,
        /** Encryption method: '', 'ssl', 'tls' or 'starttls' */
        public string $encryption,
        /** SMTP AUTH username */
        public string $username,
        /** SMTP AUTH password (or app password) */
        public string $password,
        /** Sender address used when none is provided in the envelope */
        public string $fromAddress,
        /** Sender display name */
        public string $fromName,
        /** Whether to output server transaction logs */
        public bool $debug,
        /** Connection timeout in seconds */
        public int $timeout,
        /** Number of connection attempts before failing */
        public int $connectionAttempts,
        /** Namespace used for template lookups (e.g., 'mail') */
        public string $templateNamespace = 'mail',
    ) {}

    /**
     * Create a disabled/config-failure configuration.
     */
    public static function disabled(): self
    {
        return new self(
            enabled: false,
            host: '',
            port: 0,
            encryption: '',
            username: '',
            password: '',
            fromAddress: '',
            fromName: '',
            debug: false,
            timeout: 30,
            connectionAttempts: 1,
            templateNamespace: 'mail',
        );
    }
}

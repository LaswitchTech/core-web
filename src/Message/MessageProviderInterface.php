<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message;

/**
 * Interface that all email (SMTP) providers must implement.
 *
 * A provider is any class capable of delivering a {@see MessageEnvelope} to a
 * downstream SMTP server or relay. Configuration is injected by the consumer —
 * providers never read global / stateful stores.
 */
interface MessageProviderInterface
{
    /**
     * Send an email message envelope.
     */
    public function send(MessageEnvelope $envelope): void;

    /**
     * Human-readable identifier for this provider.
     *
     * Used by the registry to disambiguate providers (e.g., "smtp", "postmark").
     */
    public function name(): string;
}

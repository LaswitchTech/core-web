<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message;

/**
 * Interface that all SMS providers must implement.
 *
 * A provider is any class capable of delivering an SMS body string to a
 * carrier via a downstream API (Twilio, Telico, etc.). Configuration is
 * injected by the consumer — providers never read global / stateful stores.
 */
interface SmsProviderInterface
{
    /**
     * Send an SMS message.
     *
     * @param string $to      recipient phone number in E.164 format
     * @param string $body    plain-text body of the SMS
     * @param array  $options provider-specific extras (e.g., from, mediaUrl)
     * @return SmsResult      success/failure indicator with optional message ID
     */
    public function send(string $to, string $body, array $options = []): SmsResult;

    /**
     * Human-readable identifier for this provider.
     *
     * Used by the registry to disambiguate providers (e.g., "twilio", "telico").
     */
    public function name(): string;
}

<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Message;

/**
 * Immutable value object representing the result of an SMS delivery attempt.
 */
final readonly class SmsResult
{
    public function __construct(
        /** Whether the SMS was successfully delivered */
        public bool $success,
        /** Provider-specific message ID (e.g., Twilio MessageSid), null on failure */
        public ?string $messageId = null,
        /** Error message when delivery failed, null on success */
        public ?string $error = null,
        /** Raw decoded API response for debugging purposes */
        public array $rawResponse = [],
    ) {}

    /** Create a successful SmsResult. */
    public static function ok(?string $messageId = null, array $rawResponse = []): self
    {
        return new self(success: true, messageId: $messageId, error: null, rawResponse: $rawResponse);
    }

    /** Create a failed SmsResult. */
    public static function fail(string $error, array $rawResponse = []): self
    {
        return new self(success: false, messageId: null, error: $error, rawResponse: $rawResponse);
    }
}

# Telico SMS Plugin

Telico SMS provider for the Core-Web framework. Registers a
`SmsProviderInterface` implementation that sends messages via the
Telico Cloud SMS API.

## What It Provides

- `TelicoProvider` class implementing `SmsProviderInterface`
- `TelicoSmsSanitizer` for normalizing message text before sending
- Automatic provider registration via the `sms.provider.register` hook

## Configuration

Add your Telico credentials to `config/local.cfg`:

```json
{
    "sms": {
        "providers": {
            "telico": {
                "username": "your-api-username",
                "sms_pass": "your-api-password",
                "callerid": "YourBrand"
            }
        }
    }
}
```

| Key | Required | Description |
|-----|----------|-------------|
| `username` | Yes | Telico API username |
| `sms_pass` | Yes | Telico API password |
| `callerid` | Yes | Sender ID displayed to recipients |

## Usage

### From PHP

```php
$sms = \Laswitchtech\CoreWeb\Messaging\Sms::instance();

$result = $sms->send('+15551234567', 'Your code is 123456', [
    'provider' => 'telico'
]);

if ($result->success) {
    // Message sent
} else {
    // $result->error contains the failure reason
}
```

If Telico is the only configured provider, the `provider` option is
optional:

```php
$result = $sms->send('+15551234567', 'Your code is 123456');
```

### From CLI

```sh
php cli core.sms send "+15551234567" "Hello from Core-Web"
```

This uses the first available provider (Telico if configured).

## Message Sanitization

Before sending, `TelicoSmsSanitizer` normalizes the message body:

- Converts Unicode punctuation to ASCII equivalents
  (e.g., `“` → `"`, `—` → `-`, `…` → `...`)
- Normalizes line endings to `\n`
- Strips non-ASCII characters that the Telico API cannot handle

This ensures messages are delivered correctly regardless of the source
encoding.

## API Endpoint

Messages are sent via `GET` (query parameters) to:

```
https://sms.telico.cloud/api/send_sms
```

The request uses HTTP Basic Authentication with the configured
`username` and `sms_pass`.

## Dependencies

None. Can be used alongside other SMS providers (e.g., Twilio) — the
framework selects the provider by the `provider` option or falls back
to the first registered provider.

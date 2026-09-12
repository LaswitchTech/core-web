# Twilio SMS Plugin

Twilio SMS provider for the Core-Web framework. Registers a
`SmsProviderInterface` implementation that sends messages via the
Twilio Messages API.

## What It Provides

- `TwilioProvider` class implementing `SmsProviderInterface`
- Automatic provider registration via the `sms.provider.register` hook

## Configuration

Add your Twilio credentials to `config/local.cfg`:

```json
{
    "sms": {
        "providers": {
            "twilio": {
                "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "auth_token": "your_auth_token",
                "from": "+15551234567"
            }
        }
    }
}
```

| Key | Required | Description |
|-----|----------|-------------|
| `account_sid` | Yes | Twilio Account SID |
| `auth_token` | Yes | Twilio Auth Token |
| `from` | Yes | Sender phone number (E.164 format) |

## Usage

### From PHP

```php
$sms = \Laswitchtech\CoreWeb\Messaging\Sms::instance();

$result = $sms->send('+15559876543', 'Your code is 123456', [
    'provider' => 'twilio'
]);

if ($result->success) {
    // Message sent
    echo "SID: " . $result->messageSid;
} else {
    // $result->error contains the failure reason
}
```

If Twilio is the only configured provider, the `provider` option is
optional:

```php
$result = $sms->send('+15559876543', 'Your code is 123456');
```

### From CLI

```sh
php cli core.sms send "+15559876543" "Hello from Core-Web"
```

This uses the first available provider (Twilio if configured).

## API Endpoint

Messages are sent via `POST` to:

```
https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
```

The request uses HTTP Basic Authentication with the `account_sid` as
username and `auth_token` as password. The body includes `To`, `From`,
and `Body` parameters.

## Provider Selection

When multiple SMS providers are configured (e.g., both Telico and
Twilio), specify which one to use:

```php
// Explicitly use Twilio
$sms->send($to, $body, ['provider' => 'twilio']);

// Explicitly use Telico
$sms->send($to, $body, ['provider' => 'telico']);

// Use the first registered provider
$sms->send($to, $body);
```

## Dependencies

None. Can be used alongside other SMS providers (e.g., Telico).

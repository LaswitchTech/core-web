# Twilio SMS Provider Plugin

Twilio plugin for Core-Web framework that provides SMS delivery capabilities via the Twilio API.

## Installation

This plugin is automatically loaded by the Core-Web framework when enabled.

## Configuration

The plugin registers its own configuration keys under `sms.providers.twilio`:

```json
{
    "sms": {
        "providers": {
            "twilio": {
                "account_sid": "your_twilio_account_sid",
                "auth_token": "your_twilio_auth_token", 
                "from": "your_twilio_phone_number"
            }
        }
    }
}
```

## Usage

### CLI Usage

```bash
# Send an SMS via Twilio provider
php cli core.sms send "+1234567890" "Hello from Core-Web!"
```

### PHP Usage

```php
use Laswitchtech\CoreWeb\Sms\SmsService;

// The Twilio provider will be used by default if configured
$sms = $container->resolve('sms_service');
$result = $sms->send("+1234567890", "Hello World!");

// Or explicitly use the Twilio provider
$result = $sms->send("+1234567890", "Hello World!", ['provider' => 'twilio']);
```

## Features

- Supports sending SMS via Twilio API
- Configurable account SID, auth token, and from number
- Proper error handling and result reporting
- Integration with Core-Web's template system

## Dependencies

- PHP curl extension
- Core-Web framework (v1.0+)

## License

MIT
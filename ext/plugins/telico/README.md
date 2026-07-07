# Telico SMS Provider Plugin

Telico plugin for Core-Web framework that provides SMS delivery capabilities via the Telico API.

## Installation

This plugin is automatically loaded by the Core-Web framework when enabled.

## Configuration

The plugin registers its own configuration keys under `sms.providers.telico`:

```json
{
    "sms": {
        "providers": {
            "telico": {
                "username": "your_telico_username",
                "sms_pass": "your_sms_password", 
                "callerid": "your_caller_id",
                "voip_pass": "your_voip_password"
            }
        }
    }
}
```

## Usage

### CLI Usage

```bash
# Send an SMS via Telico provider
php cli core.sms send "+1234567890" "Hello from Core-Web!"
```

### PHP Usage

```php
use Laswitchtech\CoreWeb\Sms\SmsService;

// The Telico provider will be used by default if configured
$sms = $container->resolve('sms_service');
$result = $sms->send("+1234567890", "Hello World!");

// Or explicitly use the Telico provider
$result = $sms->send("+1234567890", "Hello World!", ['provider' => 'telico']);
```

## Features

- Supports sending SMS via Telico API
- Configurable username, password, and caller ID
- Proper error handling and result reporting
- Integration with Core-Web's template system

## Dependencies

- PHP curl extension
- Core-Web framework (v1.0+)

## License

MIT
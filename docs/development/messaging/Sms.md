# Core-Web SMS Messaging System

The Core-Web framework provides a robust SMS messaging system that allows applications to send text messages through various providers. The system supports multiple SMS providers, template-based messages, and flexible configuration options.

## Configuration Overview

### `config/sms.cfg`

The SMS configuration file located at `config/sms.cfg` controls the SMS messaging system's core behavior:

```json
{
  "default": "",
  "template_namespace": "sms"
}
```

- **default**: Configures the default SMS provider to use when no explicit provider is specified. The value should match a registered SMS provider name.
- **template_namespace**: Defines the namespace used for SMS template lookups when sending templated messages.

### Default Provider Selection Mechanism

The default provider selection is handled by the framework, which:
1. Uses the configured `default` key in `config/sms.cfg`
2. Resolves providers via the DI container
3. Returns null if no matching provider exists

Providers are registered in order of precedence: **app > plugin > core**, with higher priority values taking precedence within the same origin type.

### template_namespace Configuration

The `template_namespace` setting in `config/sms.cfg` determines where SMS templates are looked up. The framework resolves templates through a centralized registry that follows a multi-source approach for template resolution:

1. **Core templates** (from vendor packages)
2. **Extension templates** (enabled plugins)
3. **Application templates** (app/templates/sms/)

Templates from extensions can override core templates based on priority order.

## Templates System

### Template Location and Structure

SMS templates are located within plugin or application template directories following the pattern: `{namespace}/{template_name}.json`.

### Template JSON Schema

```json
{
  "name": "test",
  "body": "{app_name}::Core-Web — {subject}\nSent at: {sent_at}\n\nThis is a test SMS from Core-Web.",
  "availableVariables": ["subject", "app_name", "sent_at"]
}
```

#### Expected JSON schema:
- **name** (required): Unique template identifier within the namespace
- **body** (required): Plain-text SMS body with optional variable interpolation  
- **availableVariables** (optional): Array of variable names that can be used in the template for documentation/validation

Variables use the syntax `{variable_name}` or `{variable_name}::fallback` where `fallback` is the text to use when the variable isn't provided.

## Provider Plugins

### SMS Provider Plugin Conventions

SMS providers must implement the `SmsProviderInterface`. The framework includes two example providers: `TwilioProvider` and `TelicoProvider`.

#### Provider Requirements:
1. Implement both `send()` and `name()` methods
2. Constructor accepts configuration as an array
3. Return proper `SmsResult` objects with success/failure states

Providers are registered in the system via plugins using the extension manifest system, where providers are added to the DI container during bootstrap.

#### Example provider structure:
```php
class TwilioProvider implements SmsProviderInterface
{
    public function __construct(array $config)
    {
        // Initialize provider with configuration
    }

    public function send(string $to, string $body, array $options = []): SmsResult
    {
        // Implementation to send SMS via Twilio API
        return SmsResult::ok($messageId); // On success
        return SmsResult::fail('Error message'); // On failure
    }

    public function name(): string
    {
        return 'twilio'; // Must match the provider's identifier for lookup
    }
}
```

#### Plugin Registration:
Providers are typically registered in plugin manifests and automatically loaded by the system.

### Provider Credentials Storage

Credentials for SMS providers should be stored securely:

1. **In `config/local.cfg`**: Primary location for user-specific configuration  
2. **Plugin-specific config files**: Not implemented in this version
3. **Application-level configuration management**: Credentials are injected at runtime into provider constructors

Important notes:
- Do not store credentials in source code or version control
- Credentials for existing providers must be provided via the plugin registration system

Providers currently read configuration via `Config::get('sms.providers.telico')` and `Config::get('sms.providers.twilio')`.

## CLI Usage

### `core.sms send` command

The SMS messaging system includes a command-line interface accessible via:

```
php cli core.sms send <PHONE> <SUBJECT>
```

#### Examples:
```bash
# Send an SMS message
php cli core.sms send "+1234567890" "Test Subject"
```

#### Command Behavior:
- Validates that phone is not empty
- Validates that subject is not empty
- Resolves `sms_service` from DI container
- Loads template named `test` from configured `template_namespace` through the template registry
- Sends the SMS using the configured provider service
- Returns clear success/failure text

## Error Handling

All SMS providers return `SmsResult` objects that include:

- **success**: Boolean indicating whether the operation succeeded
- **messageId** (optional): Provider-specific message identifier when successful
- **error** (optional): Error message when operation fails

The system handles various error conditions:
- HTTP connection failures
- API authentication errors  
- Invalid template structures
- Provider-specific errors (e.g., invalid phone numbers)

## Integration Patterns

### Basic Usage in Code:

```php
use Laswitchtech\CoreWeb\Sms\SmsService;

// The default provider from config/sms.cfg will be used
$sms = $container->resolve('sms_service');
$result = $sms->send("+1234567890", "Hello World!");

// Explicit provider usage
$result = $sms->send("+1234567890", "Hello World!", ['provider' => 'twilio']);
```

### Template-Based Messaging:

```php
use Laswitchtech\CoreWeb\Sms\SmsService;

$result = $sms->sendTemplate(
    "+1234567890", 
    "test",
    ["subject" => "Test Subject", "app_name" => "Core-web App"]
);
```
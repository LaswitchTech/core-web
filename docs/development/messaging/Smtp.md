# Core-Web SMTP Messaging System

The Core-Web framework provides a robust SMTP messaging system for sending email communications. The system supports multiple configuration options, template-based messages, and flexible delivery mechanisms.

## Configuration Overview

### `config/smtp.cfg`

The SMTP configuration file located at `config/smtp.cfg` controls the SMTP messaging system's behavior:

```json
{
  "enabled": true,
  "host": "localhost",
  "port": 587,
  "encryption": "tls",
  "username": "",
  "password": "",
  "from_address": "",
  "from_name": "Core-Web App",
  "debug": false,
  "timeout": 30,
  "connection_attempts": 1,
  "template_namespace": "mail"
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | bool | `true` | Whether SMTP sending is enabled |
| `host` | string | `"localhost"` | SMTP server hostname (e.g., smtp.example.com) |
| `port` | int | `587` | SMTP server port (587 for STARTTLS, 465 for SSL/TLS) |
| `encryption` | string | `"tls"` | Encryption method: '', 'ssl', 'tls' or 'starttls' |
| `username` | string | `""` | SMTP AUTH username |
| `password` | string | `""` | SMTP AUTH password (or app password) |
| `from_address` | string | `""` | Default sender email address when none is provided in envelope |
| `from_name` | string | `"Core-Web App"` | Default sender display name |
| `debug` | bool | `false` | Whether to output server transaction logs |
| `timeout` | int | `30` | Connection timeout in seconds |
| `connection_attempts` | int | `1` | Number of connection attempts before failing |
| `template_namespace` | string | `"mail"` | Namespace used for template lookups |

### Default Configuration

The default configuration file (`config/smtp.cfg`) provides sensible defaults that work with most development environments and testing setups. The values can be overridden in `config/local.cfg` to provide environment-specific settings.

## Templates System

### Template Registry

Email templates are resolved through a centralized template registry populated during application bootstrap. The system first checks for core templates (from vendor packages), then enabled extension templates, and finally application-specific templates in the configured namespace. Templates from extensions can override core templates based on priority order.

### Template JSON Schema

```json
{
  "name": "Default",
  "subject": "{AppName} — {Subject}",
  "plainBody": "Subject: {Subject}\nApplication: {AppName}\nSent at: {CurrentYear}\n\n{Body}",
  "htmlBody": "<h1>{AppName}</h1><p>Subject: {Subject}</p><p>Sent at: {CurrentYear}</p><p>{Body}</p>",
  "availableVariables": ["AppName", "Subject", "RecipientName", "Body", "Greetings", "AppUrl", "CurrentYear", "Preheader", "ActionUrl", "ActionLabel", "TermsUrl", "PrivacyUrl", "SupportUrl", "Copyright", "AppLogo"]
}
```

#### Template Fields

- **name** (required): Unique template identifier within the namespace
- **subject** (required): Email subject line with optional variable interpolation  
- **plainBody** (optional): Plain-text email body content
- **htmlBody** (optional): HTML email body content
- **availableVariables** (optional): Array of variable names that can be used in templates for documentation/validation

Variables use the syntax `{variable_name}` or `{variable_name}::fallback` where `fallback` is the text to use when the variable isn't provided.

## Message Options

### Recipient Fields

The framework supports multiple types of recipients in email messages:

- **From**: The sender address (set via configuration or envelope)
- **To**: Primary recipient addresses 
- **Cc**: Carbon-copy recipients
- **Bcc**: Blind carbon-copy recipients (not visible to other recipients)
- **Reply-To**: Override reply address for the message

### Message Envelope Structure

All messages are constructed using a `MessageEnvelope` object which contains:

```php
final readonly class MessageEnvelope
{
    public EmailAddress $from,
    public array $to = [],
    public array $cc = [],
    public array $bcc = [],
    public ?EmailAddress $replyTo = null,
    public string $subject = '',
    public array $attachments = [],
    public string $plainBody = '',
    public ?string $htmlBody = null,
}
```

## Attachments

### Attachment Support

The SMTP system supports both file and byte-array attachments:

1. **FileAttachment**: Attaches files from the filesystem
2. **ByteArrayAttachment**: Attaches data from memory

Attachments are handled through MIME multipart serialization which preserves the message's structure while incorporating the attached content.

Attachments can be included in templates or added programmatically to email envelopes before sending.

## CLI Usage

### `core.smtp send` command

The SMTP messaging system includes a command-line interface accessible via:

```
php cli core.smtp send <to> <subject>
```

#### Examples:
```bash
# Send a simple test email
php cli core.smtp send "user@example.com" "Test Subject"

# This command validates the recipient address contains @ symbol and subject is not empty
# It then attempts to send using configured SMTP settings with templates from the mail namespace
```

#### Command Behavior:
- Validates that recipient email address contains `@` symbol
- Validates that subject is not empty  
- Resolves `'mailer'` service from DI container
- Loads template named `Default` from configured `template_namespace` through the template registry
- Sends the email using the SMTP provider
- Returns clear success/failure text

## Integration Patterns

### Basic Usage in Code:

```php
use Laswitchtech\CoreWeb\Mail\Mailer;
use Laswitchtech\CoreWeb\Message\EmailAddress;

$mailer = $container->resolve('mailer');
$from = new EmailAddress('sender@example.com', 'Sender Name');
$to = [new EmailAddress('recipient@example.com')];

$mailer->send([
    'from' => $from,
    'to' => $to,
    'subject' => 'Test Message',
    'plainBody' => 'Hello World!',
]);
```

### Template-Based Messaging:

```php
use Laswitchtech\CoreWeb\Mail\Mailer;

$mailer = $container->resolve('mailer');
$result = $mailer->sendTemplate(
    'welcome_notification',
    [
        'name' => 'John Doe',
        'email' => 'john@example.com'
    ],
    [
        'to' => [new EmailAddress('user@example.com')],
        'subject' => 'Welcome!'
    ]
);
```

## Error Handling

The SMTP system handles various error conditions:
- Connection failures and timeouts
- Authentication errors  
- Invalid email addresses in recipients
- Template loading issues
- File attachment read failures

All operations return descriptive error messages that aid in debugging.

## Security Considerations

- SMTP credentials should be stored securely and never in version control
- The system sanitizes header values to prevent CRLF injection attacks
- All email addresses are validated for proper format before processing
- Templates can include variable substitution to avoid code injection issues
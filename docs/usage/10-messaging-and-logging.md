# Messaging & Logging

Two outbound subsystems: **mail/SMS** (template-based messaging) and
**logging** (channel-based file logging). Both are config-gated and
template/level-driven.

## Logging

### Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `logging.enabled` | `true` | Master switch. When off, loggers are no-ops. |
| `logging.level` | `debug` | Minimum level written: `debug` \| `info` \| `warning` \| `error` \| `critical`. |
| `logging.path` | `log` | Directory (relative to app root) for log files. |

### Using the Logger

Loggers are **channel-scoped** — each channel writes to its own file.

```php
$c = \Laswitchtech\CoreWeb\Bootstrap::container();

// A channel logger, e.g. "auth" → {logging.path}/auth.log
$logger = $c->resolve('logger_factory')('auth');

$logger->info('User logged in', ['user_id' => 42]);
$logger->warning('Rate limit near threshold', ['ip' => $req->ip()]);
$logger->error('Payment failed', ['order' => $orderId, 'code' => 402]);
$logger->debug('Cache miss');       // only if level allows
$logger->critical('Queue dead');
```

| Level | Use for |
|-------|---------|
| `debug` | Verbose diagnostics; enable only in development. |
| `info` | Normal operational events. |
| `warning` | Unexpected but handled conditions. |
| `error` | Failures that affect a request/entity. |
| `critical` | System-level failures needing attention. |

Context arrays are rendered alongside the message. Messages below
`logging.level` are dropped.

Convenience bindings are pre-registered for common channels — resolve them
directly instead of calling the factory:

```php
$c->resolve('logger');            // "app" channel (default)
$c->resolve('logger.error');      // "error"
$c->resolve('logger.database');   // "database"
$c->resolve('logger.auth');       // "auth"
$c->resolve('logger.migration');  // "migration"
$c->resolve('logger.debug');      // "debug"
```

## Messaging

Both mail and SMS use **JSON templates** with `{Placeholder}` variables,
resolved app → extension → core. Templates live in:

- `{appRoot}/Templates/{namespace}/*.json` — your app (highest priority).
- Extension templates (registered per extension).
- Core framework templates (lowest priority).

A template is a `.json` file with at least:

```json
{
    "name": "Default",
    "subject": "{AppName} — {Subject}",
    "plainBody": "Hello {RecipientName},\n\n{Body}",
    "htmlBody": "<p>Hello {RecipientName}</p>",
    "availableVariables": ["AppName", "Subject", "RecipientName", "Body"]
}
```

The namespace directory determines the channel (`mail` or `sms`).

### Mail

Enable SMTP in `config/smtp.cfg` (or `smtp.cfg`):

```json
{
    "enabled": true,
    "host": "localhost",
    "port": 587,
    "encryption": "tls",
    "username": "",
    "password": "",
    "from_address": "no-reply@example.com",
    "from_name": "Core-Web App",
    "debug": false,
    "timeout": 30,
    "connection_attempts": 1,
    "template_namespace": "mail"
}
```

The `mailer` container binding is **null until SMTP is enabled**.

```php
$c = \Laswitchtech\CoreWeb\Bootstrap::container();
$mailer = $c->resolve('mailer');

if ($mailer === null) {
    // SMTP not enabled.
    return;
}

// Send a message from a template, with per-call overrides:
$mailer->sendTemplate(
    'Default',                    // template name (filename without .json)
    [
        'RecipientName' => 'Ada',
        'Subject'       => 'Welcome',
        'Body'          => 'Thanks for signing up.',
        // ...other placeholders from the template
    ],
    [
        'to'    => [new \Laswitchtech\CoreWeb\Message\EmailAddress('ada@example.com', 'Ada')],
        'cc'    => [],
        'replyTo' => new \Laswitchtech\CoreWeb\Message\EmailAddress('support@example.com', 'Support'),
    ],
);

// Or send a fully pre-assembled envelope:
// $mailer->send(new MessageEnvelope(...));
```

Option overrides take precedence over template/`SmtpConfig` defaults for
`from`, `to`, `cc`, `bcc`, `replyTo`, and `attachments`.

Test a send from the CLI:

```sh
cli core.smtp send ada@example.com "Test subject"
```

### SMS

SMS is gated by config and a default provider. The `sms_service` binding is
**null until SMS is enabled**.

```php
$c = \Laswitchtech\CoreWeb\Bootstrap::container();
$sms = $c->resolve('sms_service');

if ($sms === null) {
    // SMS not enabled.
    return;
}

// Plain send:
$result = $sms->send('+15551234567', 'Your code is 482913.');

// Template send:
$result = $sms->sendTemplate(
    '+15551234567',
    'Default',             // template in Templates/sms/
    ['Code' => '482913'],
    [],
);

$result->success;   // bool
```

Test from the CLI:

```sh
cli core.sms send +15551234567 "Test"
```

> SMS provider configuration and provider registration are extension- or
> config-driven; see `config/sms.cfg` and the SMS provider docs under
> `docs/development/architecture/`.

## Resolving Services Summary

| Binding | Null when | Purpose |
|---------|-----------|---------|
| `mailer` | SMTP disabled | Send mail. |
| `sms_service` | SMS disabled | Send SMS. |
| `logger` | never | The `app` channel logger. |
| `logger_factory` | never | Build a channel-scoped logger. |

Always null-check the messaging bindings before use, since they are
conditional singletons.

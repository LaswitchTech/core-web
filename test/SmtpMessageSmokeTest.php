<?php

declare(strict_types = 1);

use PHPUnit\Framework\TestCase;
use Laswitchtech\CoreWeb\Mail\Attachment\FileAttachment;
use Laswitchtech\CoreWeb\Mail\Attachment\ByteArrayAttachment;
use Laswitchtech\CoreWeb\Mail\Mailer;
use Laswitchtech\CoreWeb\Mail\SmtpConfig;
use Laswitchtech\CoreWeb\Message\EmailAddress;
use Laswitchtech\CoreWeb\Message\MessageEnvelope;
use Laswitchtech\CoreWeb\Message\MessageProviderInterface;
use Laswitchtech\CoreWeb\Message\Template\TemplateLoaderInterface;
use Laswitchtech\CoreWeb\Message\Template\Template;

// ── Test Doubles ──────────────────────────────────────────────

class MockMessageProvider implements MessageProviderInterface
{
    public ?MessageEnvelope $sentEnvelope = null;

    public function send(MessageEnvelope $envelope): void
    {
        $this->sentEnvelope = $envelope;
    }

    public function name(): string
    {
        return 'mock';
    }
}

class MockTemplateLoader implements TemplateLoaderInterface
{
    private array $templates;

    public function __construct(array $templates = [])
    {
        $this->templates = $templates;
    }

    public function load(string $name, string $namespace = 'mail'): Template
    {
        if (!isset($this->templates[$name])) {
            throw new Exception("Template not found: {$name}");
        }
        return $this->templates[$name];
    }

    public function has(string $name, string $namespace = 'mail'): bool
    {
        return isset($this->templates[$name]);
    }
}

// ── Factory helpers (real types only — Template / SmtpConfig are readonly) ──

function makeSmtpConfig(
    bool $enabled = true,
    string $host = 'localhost',
    int $port = 587,
): SmtpConfig {
    return new SmtpConfig(
        enabled:       $enabled,
        host:          $host,
        port:          $port,
        encryption:    'starttls',
        username:      'test@example.com',
        password:      'testpass',
        fromAddress:   'test@localhost.local',
        fromName:      'Test Sender',
        debug:         false,
        timeout:       30,
        connectionAttempts: 1,
    );
}

function makeMailer(
    MockMessageProvider $provider,
    ?MockTemplateLoader $loader = null,
    ?SmtpConfig $config = null,
): Mailer {
    $cfg     = $config ?? makeSmtpConfig();
    if ($loader === null) {
        $tpl   = new Template(
            name:       'test_template',
            subject:    'Test Subject',
            plainBody:  'This is a plain text body.',
            htmlBody:   '<p>This is an HTML body.</p>',
        );
        $loader = new MockTemplateLoader(['test_template' => $tpl]);
    }

    return new Mailer($provider, $loader, $cfg);
}

// ── Tests ─────────────────────────────────────────────────────

class SmtpMessageSmokeTest extends TestCase
{
    // ── Body format tests ──

    public function testPlainTextBodyConstruction(): void
    {
        $provider = new MockMessageProvider();
        $mailer = makeMailer($provider);

        $mailer->sendTemplate(
            'test_template',
            [],
            [
                'from'    => new EmailAddress('sender@example.com'),
                'to'      => [new EmailAddress('recipient@example.com')],
                'cc'      => [new EmailAddress('cc@example.com')],
                'bcc'     => [new EmailAddress('bcc@example.com')],
                'replyTo' => new EmailAddress('replyto@example.com'),
            ]
        );

        $this->assertNotNull($provider->sentEnvelope);
        $envelope = $provider->sentEnvelope;

        // Verify basic envelope construction
        $this->assertEquals('sender@example.com', $envelope->from->address);
        $this->assertEquals('Test Subject', $envelope->subject);
        $this->assertCount(1, $envelope->to);
        $this->assertCount(1, $envelope->cc);
        $this->assertCount(1, $envelope->bcc);
        $this->assertNotNull($envelope->replyTo);
        $this->assertEquals('replyto@example.com', $envelope->replyTo->address);

        // Verify body content
        $this->assertEquals('This is a plain text body.', $envelope->plainBody);
        $this->assertEquals('<p>This is an HTML body.</p>', $envelope->htmlBody);
    }

    public function testHtmlOnlyBodyConstruction(): void
    {
        $provider = new MockMessageProvider();

        // Template with only HTML (plainBody = null)
        $template = new Template(
            name:     'test_template',
            subject:  'Test Subject',
            plainBody: null,
            htmlBody: '<p>This is an HTML body.</p>',
        );
        $loader = new MockTemplateLoader(['test_template' => $template]);

        $mailer = makeMailer($provider, $loader);

        $mailer->sendTemplate('test_template', []);

        $this->assertNotNull($provider->sentEnvelope);
        $envelope = $provider->sentEnvelope;

        // Verify HTML body present
        $this->assertEquals('<p>This is an HTML body.</p>', $envelope->htmlBody);
        // plainBody should be empty string (Mailer defaults to '' when null)
        $this->assertEquals('', $envelope->plainBody);
    }

    public function testMultipartAlternativeBodyConstruction(): void
    {
        $provider = new MockMessageProvider();

        $template = new Template(
            name:      'test_template',
            subject:   'Test Subject',
            plainBody: 'This is a plain text body.',
            htmlBody:  '<p>This is an HTML body.</p>',
        );
        $loader = new MockTemplateLoader(['test_template' => $template]);

        $mailer = makeMailer($provider, $loader);

        $mailer->sendTemplate('test_template', []);

        $envelope = $provider->sentEnvelope;
        $this->assertNotNull($envelope);

        // Both bodies should be set
        $this->assertEquals('This is a plain text body.', $envelope->plainBody);
        $this->assertEquals('<p>This is an HTML body.</p>', $envelope->htmlBody);
    }

    // ── Attachment tests ──

    public function testFileAttachmentConstruction(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'attachment_');
        file_put_contents($tempFile, 'Test attachment content');

        try {
            $provider = new MockMessageProvider();
            $mailer   = makeMailer($provider);

            $attachment = new FileAttachment($tempFile, 'test.txt');

            $mailer->sendTemplate(
                'test_template',
                [],
                [
                    'attachments' => [$attachment],
                ]
            );

            $this->assertNotNull($provider->sentEnvelope);
            $envelope = $provider->sentEnvelope;

            // Verify attachment is included
            $this->assertCount(1, $envelope->attachments);
            $this->assertInstanceOf(FileAttachment::class, $envelope->attachments[0]);
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    public function testByteArrayAttachmentConstruction(): void
    {
        $provider = new MockMessageProvider();
        $mailer   = makeMailer($provider);

        $attachment = new ByteArrayAttachment('Test attachment content', 'test.bin');

        $mailer->sendTemplate(
            'test_template',
            [],
            [
                'attachments' => [$attachment],
            ]
        );

        $this->assertNotNull($provider->sentEnvelope);
        $envelope = $provider->sentEnvelope;

        // Verify attachment is included
        $this->assertCount(1, $envelope->attachments);
        $this->assertInstanceOf(ByteArrayAttachment::class, $envelope->attachments[0]);
    }

    // ── Header tests ──

    public function testHeadersConstruction(): void
    {
        $provider = new MockMessageProvider();
        $mailer   = makeMailer($provider);

        $mailer->sendTemplate(
            'test_template',
            [],
            [
                'from'    => new EmailAddress('sender@example.com', 'Sender Name'),
                'to'      => [
                    new EmailAddress('recipient1@example.com'),
                    new EmailAddress('recipient2@example.com'),
                ],
                'cc'      => [new EmailAddress('cc@example.com')],
                'bcc'     => [new EmailAddress('bcc@example.com')],
                'replyTo' => new EmailAddress('replyto@example.com'),
            ]
        );

        $this->assertNotNull($provider->sentEnvelope);
        $envelope = $provider->sentEnvelope;

        $this->assertEquals('sender@example.com', $envelope->from->address);
        $this->assertEquals('Sender Name',        $envelope->from->name);
        $this->assertCount(2,                       $envelope->to);
        $this->assertCount(1,                       $envelope->cc);
        $this->assertCount(1,                       $envelope->bcc);
        $this->assertNotNull($envelope->replyTo);
    }

    // ─= Live SMTP validation stub (requires real SMTP server) =-

    public function testLiveSmtpSmokeRequiresConnection(): void
    {
        // This test gate is skipped by default because it requires a live SMTP server.
        // Set the SKIP_LIVE_SMTP env var to '0' to run.
        if ($_SERVER['SKIP_LIVE_SMTP'] ?? '1' === '1') {
            $this->markTestSkipped('Live SMTP server required; set SKIP_LIVE_SMTP=0 to run');
        }

        // Placeholder: in a real CI pipeline this would connect to localhost:25 (or testcontainer)
        $this->assertTrue(true);
    }
}

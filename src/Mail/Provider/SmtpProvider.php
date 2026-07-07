<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Mail\Provider;

use Laswitchtech\CoreWeb\Mail\Attachment\ByteArrayAttachment;
use Laswitchtech\CoreWeb\Mail\Attachment\FileAttachment;
use Laswitchtech\CoreWeb\Mail\SmtpConfig;
use Laswitchtech\CoreWeb\Mail\SmtpException;
use Laswitchtech\CoreWeb\Message\EmailAddress;
use Laswitchtech\CoreWeb\Message\MessageEnvelope;
use Laswitchtech\CoreWeb\Message\MessageProviderInterface;

/**
 * SMTP mail provider skeleton.
 *
 * Implements {@see MessageProviderInterface} but defers all socket/protocol
 * logic to a future implementation phase. Currently throws {@see SmtpException}
 * whenever send is invoked (disabled check or transport-not-yet-implemented).
 */
final class SmtpProvider implements MessageProviderInterface
{
    public function __construct(
        /** SMTP configuration supplied by the container during bootstrap */
        private readonly SmtpConfig $config,
    ) {}

    /** {@inheritDoc} */
    public function name(): string
    {
        return 'smtp';
    }

    /** {@inheritDoc} */
    public function send(MessageEnvelope $envelope): void
    {
        // --- Configuration validation ---------------------------------------------

        if (! $this->config->enabled) {
            throw new SmtpException('SMTP transport is disabled in configuration.');
        }

        $host = $this->config->host;
        $port = $this->config->port;

        // --- Pre-flight config validation -----------------------------------------
        // Detect common misconfiguration early so the user gets an actionable message
        // instead of a raw connection failure.

        if ($host === '') {
            throw new SmtpException('SMTP host is not configured in config/smtp.cfg. Set "host" to a non-empty value (e.g., smtp.example.com).');
        }

        if ($port <= 0) {
            throw new SmtpException('SMTP port must be a positive integer in config/smtp.cfg (current: ' . var_export($port, true) . ').');
        }

        // Collect recipients from to / cc / bcc.

        $toAddresses   = [...$envelope->to];
        $ccAddresses   = empty($envelope->cc) ? [] : [...$envelope->cc];
        $bccAddresses  = empty($envelope->bcc) ? [] : [...$envelope->bcc];
        $allRecipients = [...$toAddresses, ...$ccAddresses, ...$bccAddresses];

        if ($allRecipients === []) {
            throw new SmtpException('At least one recipient is required.');
        }

        foreach ($allRecipients as $addr) {
            if (str_contains($addr->address, '@') === false) {
                throw new SmtpException('Invalid recipient email address: ' . $addr->address);
            }
        }

        // --- Connect and greet ----------------------------------------------------

        $socket = $this->connect();

        if ($socket === false || ! is_resource($socket)) {
            throw new SmtpException('Failed to establish SMTP connection.');
        }

        $this->expect($socket, 220); // server greeting
        $this->writeLine($socket, 'EHLO localhost');
        $this->expect($socket, 250);

        // --- STARTTLS (tls or starttls) -------------------------------------------

        if ($this->config->encryption === 'tls' || $this->config->encryption === 'starttls') {
            $this->writeLine($socket, 'STARTTLS');
            $this->expect($socket, 220);

            if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) === false) {
                fclose($socket);
                throw new SmtpException('Failed to upgrade SMTP connection to TLS.');
            }

            // Re-send EHLO after TLS is established.

            $this->writeLine($socket, 'EHLO localhost');
            $this->expect($socket, 250);
        }

        // --- Authentication (AUTH LOGIN) ------------------------------------------

        if ($this->config->username !== '') {
            $this->writeLine($socket, 'AUTH LOGIN');
            $this->expect($socket, 334);

            $this->writeLine($socket, base64_encode($this->config->username));
            $this->expect($socket, 334);

            $this->writeLine($socket, base64_encode($this->config->password));
            $this->expect($socket, 235); // authenticated
        }

        // --- Mail transaction -----------------------------------------------------

        // MAIL FROM uses envelope from address.

        $from = $envelope->from ?? new EmailAddress('postmaster@localhost');
        $this->writeLine($socket, 'MAIL FROM:<' . $from->address . '>');
        $this->expect($socket, [250, 251]);

        // RCPT TO for each recipient.

        foreach ($envelope->to as $addr) {
            $this->writeLine($socket, 'RCPT TO:<' . $addr->address . '>');
            $this->expect($socket, [250, 251]);
        }

        foreach ($ccAddresses as $addr) {
            $this->writeLine($socket, 'RCPT TO:<' . $addr->address . '>');
            $this->expect($socket, [250, 251]);
        }

        foreach ($bccAddresses as $addr) {
            $this->writeLine($socket, 'RCPT TO:<' . $addr->address . '>');
            $this->expect($socket, [250, 251]);
        }

        // --- Data (headers + body) ------------------------------------------------
        // Build headers, blank-line separator and body into `$payload`, then normalize + dot-stuff in one pass.

        $boundary  = $this->generateBoundary();
        $_payload  = $this->buildHeaders($envelope, $boundary);
        array_push($_payload, '', $this->buildBody($envelope, $boundary));

        // Normalize CRLF and emit payload to the socket — lines starting with "." are dot-stuffed.

        $this->writeLine($socket, 'DATA');
        $this->expect($socket, 354); // "go ahead" response
        $this->writePayload($socket, $_payload);
        $this->writeLine($socket, '.');
        $this->expect($socket, 250); // delivery acknowledged

        // --- Quiescence -----------------------------------------------------------

        $this->writeLine($socket, 'QUIT');
        fclose($socket);
    }

    // -------------------------------------------------------------- 
    // SMTP socket helpers (for future transport-layer implementation)

    /**
     * Open a TCP stream to the configured SMTP server.
     *
     * Uses `ssl://host:port` when `$config->encryption === 'ssl'`; otherwise
     * connects plaintext (STARTTLS negotiation happens after greeting).
     *
     * On failure: captures `$errno` and `$errstr`, closes any partially opened
     * resource, and throws an informative {@see SmtpException}.
     */
    private function connect(): mixed
    {
        $host = $this->config->host;
        $port = $this->config->port;

        if ($host === '' || $port <= 0) {
            throw new SmtpException('SMTP host and port must be configured.');
        }

        $url = $this->config->encryption === 'ssl'
            ? sprintf('ssl://%s:%d', $host, $port)
            : sprintf('%s:%d', $host, $port);

        $timeout = max(1.0, (float) $this->config->timeout);

        // stream_socket_client passes these by reference — capture errno/errstr explicitly.

        $errno  = 0;
        $errstr = '';

        $socket = @stream_socket_client(
            $url,
            $errno,
            $errstr,
            $timeout,
            STREAM_CLIENT_CONNECT,
        );

        // If connection failed, throw with diagnostics.

        if ($socket === false) {
            throw new SmtpException("SMTP connect failed: {$errstr} ({$errno})");
        }

        return $socket;
    }

    /**
     * Write a single CRLF-terminated line to an SMTP socket.
     */
    private function writeLine(mixed $socket, string $line): void
    {
        $bytes = strlen($line) + 2; // \r\n
        $written = fwrite($socket, $line . "\r\n");

        if ($written === false || $written < $bytes) {
            throw new SmtpException('Failed to write line to SMTP socket.');
        }
    }

    /**
     * Read a full SMTP response, returning status code and message together.
     *
     * First line must match /^(\d{3})([ -])(.*)$/ to capture the mandatory
     * 3-digit code + separator character (+ optional text).  Continuation/final
     * lines use the same pattern; if the code matches and the separator is "-"
     * (continuation) we keep reading.  When the code matches with a space
     * separator the response is complete.  Throws {@see SmtpException} on
     * malformed input or unexpected EOF.
     */
    private function readResponse(mixed $socket): array
    {
        if (! is_resource($socket)) {
            throw new SmtpException('Expected a valid socket resource.');
        }

        $code     = '';    // 3-digit SMTP status code (set on first line)
        $message  = '';    // concatenated text payload
        $matched  = false;  // whether we have successfully parsed the first line

        while (! feof($socket)) {
            $line = fgets($socket, 512);

            if ($line === false || $line === '') {
                throw new SmtpException('SMTP server closed connection unexpectedly.');
            }

            // RFC 5321 §4.2: each line MUST begin with a 3-digit code followed by
            // "-" (continuation) or " " (final response).

            if (preg_match('/^(\d{3})([ -])(.*)$/', $line, $m) !== 1) {
                throw new SmtpException('Malformed SMTP response: ' . trim($line));
            }

            [$fullMatch, $lineCode, $separator, $lineMessage] = $m;

            // --- First line ---------------------------------------------------------
            if ($matched === false) {
                $code     = $lineCode;       // 3-digit code string (e.g. "250")
                $message  = trim($lineMessage);   // first segment of the message
                $matched  = true;             // mark that we've seen the first line

                if ($separator === '-') {
                    continue;              // keep reading continuation lines
                }

                break;                   // separator was " " → final response
            }

            // --- Continuation vs. final -------------------------------------------------
            if ((string) $lineCode !== $code) {
                // Different code mid-response — protocol violation.

                throw new SmtpException('Malformed SMTP response: unexpected code ' . $lineCode);
            }

            // Same code, still in the sequence.

            if ($separator === '-') {
                // Continuation: append with space separator (standard behaviour).

                $message .= ' ' . trim($lineMessage);
                continue;
            }

            // Separator is " ": final response line — done.

            $message .= ' ' . trim($lineMessage);
            break;
        }

        if ($matched === false) {
            throw new SmtpException('SMTP server closed connection unexpectedly.');
        }

        return [(int) $code, trim($message)];
    }

    /**
     * Read response and assert that the status code is in an allowed list.
     */
    private function expect(mixed $socket, int|array $codes): string
    {
        if (! is_array($codes)) {
            $codes = [$codes];
        }

        foreach ($codes as $code) {
            if ($code < 0 || $code > 999) {
                throw new SmtpException(sprintf(
                    'Invalid expected code %d — must be between 100 and 599.',
                    $code,
                ));
            }
        }

        [$status, $message] = $this->readResponse($socket);

        if (! in_array((int) $status, $codes, true)) {
            throw new SmtpException(sprintf(
                'Expected SMTP code(s) %s but received %d — %s',
                implode(', ', $codes),
                $status,
                $message,
            ));
        }

        return $message;
    }

    /**
     * Write a DATA segment line-by-line to the SMTP socket.
     *
     * 1. Joins all chunks with "\\n".
     * 2. Normalizes every line ending in the combined string to "\\n".
     * 3. Splits into individual lines (preserving blank lines).
     * 4. Dot-stuffs every line that begins with "." (prefixing "..").
     * 5. Writes each line terminated by "\\r\\n".
     *
     * Throws {@see SmtpException} if any fwrite fails.
     */
    private function writePayload(mixed $socket, array $lines): void
    {
        // --- Step 1: join all chunks into one string ---------------------------------
        // Using implode instead of join preserves the explicit contract that this
        // array is a list of textual segments to be concatenated with "\\n".

        $joined = implode("\n", $lines);

        // --- Step 2: normalize all line endings to "\\n" ------------------------------
        // RFC 5321 §3.5 requires every transmitted line to end with CRLF (0x0d 0x0a).
        // Here we first collapse \\r\\n and lone \\r into bare "\\n", then the final
        // foreach writes each piece back with the correct "\\r\\n" suffix.

        $normalized = str_replace(["\r\n", "\r"], ["\n", "\n"], $joined);

        // --- Step 3: split into individual lines (preserving blanks) -------------------
        // preg_split is preferred over explode because it preserves the empty-string
        // entry that sits between two consecutive delimiters, which represents blank
        // lines inside multipart bodies / headers.

        $parts = preg_split('/\n/', $normalized);

        if ($parts === false || $parts === []) {
            return;
        }

        // --- Step 4 & 5: dot-stuff and write each line ----------------------------------
        // RFC 5321 §4.5.2: a bare "." on an SMTP-data-line is the DATA-TERM marker.
        // To send a line that literally starts with ".", it MUST be escaped as "..".

        foreach ($parts as $part) {
            $dotStuffed = str_starts_with($part, '.') ? '.' . $part : $part;
            $written    = fwrite($socket, $dotStuffed . "\r\n");

            if ($written === false || strlen($dotStuffed . "\r\n") !== $written) {
                throw new SmtpException('Failed to write DATA segment line to SMTP socket.');
            }
        }
    }

    /**
     * Strip CR and LF characters from a header value to prevent CRLF injection.
     *
     * @param string $value the raw header value (may contain user input)
     * @return string sanitized value with all CR/LF removed
     */
    private function sanitizeHeader(string $value): string
    {
        return str_replace(["\r", "\n"], '', $value);
    }

    // -------------------------------------------------------------- 
    // Private helpers (for future transport-layer implementation)

    /**
     * Format a list of EmailAddress objects into a comma-separated header string.
     *
     * @param  list<EmailAddress> $addresses
     * @return string             formatted address list, empty when no valid entries
     */
    private function formatAddressList(array $addresses): string
    {
        $valid = array_filter($addresses, static fn($a): bool => $a instanceof EmailAddress);

        if ($valid === []) {
            return '';
        }

        return implode(', ', array_map(
            static fn(EmailAddress $a): string => $a->forHeader(),
            $valid,
        ));
    }

    /**
     * Format a single mailbox address for SMTP use.
     */
    private function formatMailbox(string $address): string
    {
        return '<' . $address . '>';
    }

    /**
     * Generate a unique MIME boundary string.
     */
    private function generateBoundary(): string
    {
        return sprintf(
            '%08x-%04x-%04x-%04x-%012x',
            mt_rand(),
            getmypid(),
            mt_rand(),
            time(),
            random_int(0, 9995),
        );
    }

    /**
     * Build an array of complete SMTP header lines from an envelope.
     *
     * Returns header strings suitable for piping into the DATA section of
     * an SMTP transaction — never Bcc, always MIME-Version, Content-Type
     * varies with attachments and HTML body presence.
     *
     * @param MessageEnvelope $envelope  the message to serialize headers for
     * @param string          $boundary MIME boundary (used by both mixed and alternative types)
     * @return list<string> complete "Name: Value" header lines
     */
    private function buildHeaders(MessageEnvelope $envelope, string $boundary): array
    {
        $headers = [];

        // ------------------------------------------------------------------ 
        // From — always present (the envelope sender is the from address).
        // Sanitize to prevent header injection from malicious address data.

        $from = $this->sanitizeHeader($envelope->from->forHeader());
        $headers[] = 'From: ' . $from;

        // To — when non-empty

        if ($envelope->to !== []) {
            $addresses = array_map(
                fn(EmailAddress $a): string => $this->sanitizeHeader($a->forHeader()),
                $envelope->to,
            );
            $headers[] = 'To: ' . implode(', ', $addresses);
        }

        // Cc — when non-empty

        if ($envelope->cc !== []) {
            $addresses = array_map(
                fn(EmailAddress $a): string => $this->sanitizeHeader($a->forHeader()),
                $envelope->cc,
            );
            $headers[] = 'Cc: ' . implode(', ', $addresses);
        }

        // Reply-To — when not null

        if ($envelope->replyTo !== null) {
            $headers[] = 'Reply-To: ' . $this->sanitizeHeader($envelope->replyTo->forHeader());
        }

        // Subject — always present (may be empty for edge cases)

        $headers[] = 'Subject: ' . $this->sanitizeHeader($envelope->subject);

        // MIME-Version — always present

        $headers[] = 'MIME-Version: 1.0';

        // Content-Type — varies by attachments / HTML presence

        if ($envelope->attachments !== []) {
            $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';

        } elseif ($envelope->htmlBody !== null) {
            $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';

        } else {
            $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        }

        return $headers;
    }

    /**
     * Build an email body string from a message envelope.
     *
     * Handles three modes:
     * - Plain text, no attachments → plainBody directly
     * - HTML body, no attachments → multipart/alternative wrapping plain + html
     * - Attachments present → multipart/mixed wrapping the message body + each attachment
     *
     * @param MessageEnvelope $envelope  the message to build a body for
     * @param string          $boundary MIME boundary (only used for multipart modes)
     * @return string encoded body content ready for SMTP DATA
     */
    private function buildBody(MessageEnvelope $envelope, string $boundary): string
    {
        // Attachments always win — multipart/mixed mode

        if ($envelope->attachments !== []) {
            $body = [];

            // Always add text/plain part first in attachment mode

            $body[] = '--' . $boundary;
            $body[] = 'Content-Type: text/plain; charset=UTF-8';
            $body[] = '';
            $body[] = $envelope->plainBody ?? '';

            // Conditionally add HTML part before attachments

            if ($envelope->htmlBody !== null) {
                $body[] = '--' . $boundary;
                $body[] = 'Content-Type: text/html; charset=UTF-8';
                $body[] = '';
                $body[] = $envelope->htmlBody;
            }

            // File system attachments

            foreach ($envelope->attachments as $attachment) {
                if ($attachment instanceof FileAttachment) {
                    $path = $attachment->path;

                    if (! is_file($path) || ! is_readable($path)) {
                        throw new SmtpException('FileAttachment path is unreadable: ' . $path);
                    }

                    $filename = $this->sanitizeHeader($attachment->filename);
                    $mime     = $attachment->mime ?? '';

                    $body[] = '--' . $boundary;
                    $body[] = 'Content-Type: ' . ($mime ?: 'application/octet-stream');
                    $body[] = 'Content-Transfer-Encoding: base64';
                    $body[] = 'Content-Disposition: attachment; filename="' . $filename . '"';
                    $body[] = '';

                    $content = file_get_contents($path);

                    if ($content === false) {
                        throw new SmtpException('FileAttachment path is unreadable: ' . $path);
                    }

                    $chunkEncoded = chunk_split(base64_encode($content));

                    $body[] = $chunkEncoded;

                } elseif ($attachment instanceof ByteArrayAttachment) {
                    $data     = $attachment->data;
                    $filename = $this->sanitizeHeader($attachment->filename);
                    $mime     = $attachment->mime ?? '';

                    $body[] = '--' . $boundary;
                    $body[] = 'Content-Type: ' . ($mime ?: 'application/octet-stream');
                    $body[] = 'Content-Transfer-Encoding: base64';
                    $body[] = 'Content-Disposition: attachment; filename="' . $filename . '"';
                    $body[] = '';

                    $chunkEncoded = chunk_split(base64_encode($data));

                    $body[] = $chunkEncoded;
                }
            }

            // Close the final boundary marker for mixed content

            $body[] = '--' . $boundary . '--';

            return implode("\r\n", $body);
        }

        // HTML body present → multipart/alternative (plain + html wrapped)

        if ($envelope->htmlBody !== null) {
            $parts = [];

            $parts[] = '--' . $boundary;
            $parts[] = 'Content-Type: text/plain; charset=UTF-8';
            $parts[] = '';
            $parts[] = $envelope->plainBody ?? '';

            $parts[] = '--' . $boundary;
            $parts[] = 'Content-Type: text/html; charset=UTF-8';
            $parts[] = '';
            $parts[] = $envelope->htmlBody;

            $parts[] = '--' . $boundary . '--';

            return implode("\r\n", $parts);
        }

        // Plain text, no attachments → simple body

        return $envelope->plainBody ?? '';
    }
}

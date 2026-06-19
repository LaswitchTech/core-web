<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router;

/**
 * HTTP response representation.
 * Documentation: docs/development/architecture/Router/Response.md
 */
final class Response
{
    /* ─── Status codes ──────────────────────────────────────────────── */
    public const STATUS_CONTINUE             = 100;
    public const STATUS_OK                   = 200;
    public const STATUS_CREATED              = 201;
    public const STATUS_ACCEPTED             = 202;
    public const STATUS_NOT_FOUND            = 404;
    public const STATUS_METHOD_NOT_ALLOWED   = 405;
    public const STATUS_INTERNAL_ERROR       = 500;

    /** @var array<string,string> */
    private array $headers = [];
    private string $body   = '';
    private bool   $sent   = false;

    /** @var array<int,string> */
    private static array $statusMessages = [];

    public static function initStatusMessages(): void {
        if (self::$statusMessages !== []) { return; }
        self::$statusMessages = [
            100 => 'Continue',
            200 => 'OK',
            201 => 'Created',
            202 => 'Accepted',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            500 => 'Internal Server Error',
            301 => 'Moved Permanently',
            302 => 'Found',
            304 => 'Not Modified',
            307 => 'Temporary Redirect',
        ];
    }

    public static function getStatusMessage(int $code): ?string {
        self::initStatusMessages();
        return self::$statusMessages[$code] ?? null;
    }

    public function __construct(
        private int $statusCode = self::STATUS_OK,
    ) {}

    /* ─── Getters ──────────────────────────────────────────────────── */

    public function statusCode(): int { return $this->statusCode; }

    public function statusMessage(): string {
        return self::$statusMessages[$this->statusCode] ?? 'Unknown';
    }

    public function body(): string         { return $this->body; }

    /** @return array<string,string> */
    public function headers(): array       { return $this->headers; }

    public function getHeader(string $name): ?string {
        foreach ($this->headers as $key => $value) {
            if (strtolower($key) === strtolower($name)) {
                return $value;
            }
        }
        return null;
    }

    public function hasHeader(string $name): bool {
        foreach ($this->headers as $key => $_v) {
            if (strtolower($key) === strtolower($name)) {
                return true;
            }
        }
        return false;
    }

    public function isSent(): bool         { return $this->sent; }

    /* ─── Mutators (idiomatic chainable setters) ───────────────────── */

    public function withStatus(int $code): self {
        $this->statusCode = $code;
        return $this;
    }

    public function withBody(string $content): self {
        $this->body = $content;
        return $this;
    }

    /** @param array<string,string> $headers */
    public function withHeaders(array $headers): self {
        $this->headers = $headers;
        return $this;
    }

    public function setHeader(string $name, string $value): self {
        $this->headers[$name] = $value;
        return $this;
    }

    /* ─── Static factory helpers ───────────────────────────────────── */

    public static function json(mixed $data, int $code = self::STATUS_OK): self {
        $response = new self($code);
        $response->headers['Content-Type'] = 'application/json; charset=UTF-8';
        $response->body  = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        return $response;
    }

    public static function html(string $body, int $code = self::STATUS_OK): self {
        $response = new self($code);
        $response->headers['Content-Type'] = 'text/html; charset=UTF-8';
        $response->body = $body;
        return $response;
    }

    public static function notFound(string $body = '<h1>404 Not Found</h1>'): self {
        return self::html($body, self::STATUS_NOT_FOUND);
    }

    public static function methodNotAllowed(): self {
        return self::html('<h1>405 Method Not Allowed</h1>', self::STATUS_METHOD_NOT_ALLOWED);
    }

    public static function internalError(string $message = 'Internal Server Error'): self {
        return self::html('<h1>' . $message . '</h1>', self::STATUS_INTERNAL_ERROR);
    }

    public static function redirect(string $url, int $code = 302): self {
        $response = new self($code);
        $response->headers['Location'] = $url;
        return $response;
    }

    /* ─── Send to output stream ────────────────────────────────────── */

    public function send(): void {
        if ($this->sent) { return; }

        header(
            sprintf('HTTP/%s %d %s', '1.1', $this->statusCode, $this->statusMessage()),
            true,
            $this->statusCode,
        );

        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}", false);
        }

        echo $this->body;
        $this->sent = true;
    }
}


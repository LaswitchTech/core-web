<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Logger;

use InvalidArgumentException;
use RuntimeException;

final class Logger
{
    private const CHANNEL_PATTERN = '/^[a-z][a-z0-9_-]*$/i';

    private readonly string $channel;

    public function __construct(
        string $channel,
        private readonly string   $basePath,
        private readonly string   $relativePath = 'log',
        private readonly bool     $enabled = true,
        private readonly Level    $minimumLevel = Level::DEBUG,
    ) {
        if (preg_match(self::CHANNEL_PATTERN, $channel) !== 1) {
            throw new InvalidArgumentException(sprintf(
                'Invalid channel name "%s". Must match: %s',
                $channel,
                self::CHANNEL_PATTERN,
            ));
        }

        $this->channel = strtolower($channel);
    }

    public function log(Level $level, string $message, array $context = []): self
    {
        if (!$this->accepts($level)) {
            return $this;
        }

        $line = $this->format($level, $message, $context);

        try {
            $dir  = $this->basePath . '/' . trim($this->relativePath, '/\\');
            $file = $dir . '/' . $this->channel . '.log';

            if (!is_dir($dir)) {
                $created = @mkdir($dir, 0755, true);
                if ($created === false && !is_dir($dir)) {
                    throw new RuntimeException(sprintf('Failed to create log directory: %s', $dir));
                }
            }

            $result = @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
            if ($result === false) {
                throw new RuntimeException(sprintf('Failed to write log file: %s', $file));
            }
        } catch (\Throwable) {
            @fwrite(STDERR, sprintf("[%s] [%s:%s] %s", date('c'), $this->channel, strtoupper($level->name), $message) . PHP_EOL);
        }

        return $this;
    }

    private function format(
        Level $level,
        string  $message,
        array   $context,
    ): string {
        $timestamp = (new \DateTimeImmutable())->format('Y-m-d\TH:i:s.uP');
        $channel   = $this->channel;
        $levelName = strtoupper($level->name);

        if ($context === []) {
            $contextStr = '-';
        } else {
            $encoded = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $contextStr = $encoded !== false ? $encoded : '{"_error":"context_json_encode_failed"}';
        }

        return sprintf("[%s]\t[%s:%s]\t%s\t%s%s", $timestamp, $channel, $levelName, $message, $contextStr, PHP_EOL);
    }

    private function accepts(Level $level): bool
    {
        if (!$this->enabled) {
            return false;
        }

        return $level->value >= $this->minimumLevel->value;
    }

    public function debug(string $message, array $context = []): self
    {
        return $this->log(Level::DEBUG, $message, $context);
    }

    public function info(string $message, array $context = []): self
    {
        return $this->log(Level::INFO, $message, $context);
    }

    public function warning(string $message, array $context = []): self
    {
        return $this->log(Level::WARNING, $message, $context);
    }

    public function error(string $message, array $context = []): self
    {
        return $this->log(Level::ERROR, $message, $context);
    }

    public function critical(string $message, array $context = []): self
    {
        return $this->log(Level::CRITICAL, $message, $context);
    }
}

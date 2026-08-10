<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Logger;

final class Reader
{
    private const CHANNEL_PATTERN =
        '/^[a-z][a-z0-9_-]*$/i';

    private const LEVEL_NAMES = [
        'DEBUG',
        'INFO',
        'WARNING',
        'ERROR',
        'CRITICAL',
    ];

    private const LINE_PATTERN =
        '/^\[([^\]]+)\]\t\[([a-z][a-z0-9_-]*):([A-Z]+)\]\t(.*)\t(.*)$/';

    private const MASKED_VALUE = '[REDACTED]';

    private const MAX_PAGE_SIZE = 100;

    private const SENSITIVE_KEY_FRAGMENTS = [
        'password',
        'passwd',
        'secret',
        'token',
        'authorization',
        'cookie',
        'api_key',
        'apikey',
        'access_key',
        'private_key',
        'credential',
    ];

    public function __construct(
        private readonly string $basePath,
        private readonly string $relativePath = 'log',
    ) {
        if (trim($this->basePath) === '') {
            throw new \InvalidArgumentException(
                'Logger Reader base path must not be empty.',
            );
        }

        if (trim($this->relativePath) === '') {
            throw new \InvalidArgumentException(
                'Logger Reader relative path must not be empty.',
            );
        }

        if (
            str_starts_with(
                $this->relativePath,
                '/',
            )
            || preg_match(
                '/^[a-zA-Z]:[\\\\\/]/',
                $this->relativePath,
            ) === 1
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader relative path must not be absolute.',
            );
        }

        $relativeSegments = preg_split(
            '/[\\\\\/]+/',
            $this->relativePath,
        );

        if (
            $relativeSegments === false
            || in_array(
                '..',
                $relativeSegments,
                true,
            )
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader relative path must not contain traversal segments.',
            );
        }
    }

    public function directory(): string
    {
        return rtrim(
            $this->basePath,
            '/\\',
        )
            . DIRECTORY_SEPARATOR
            . trim(
                $this->relativePath,
                '/\\',
            );
    }

    public function directoryExists(): bool
    {
        return is_dir(
            $this->directory(),
        );
    }

    public function directoryReadable(): bool
    {
        $directory = $this->directory();

        return is_dir($directory)
            && is_readable($directory);
    }

    public function levels(): array
    {
        return self::LEVEL_NAMES;
    }

    public function isValidChannel(
        string $channel,
    ): bool {
        return preg_match(
            self::CHANNEL_PATTERN,
            $channel,
        ) === 1;
    }

    public function channelPath(
        string $channel,
    ): string {
        if (!$this->isValidChannel($channel)) {
            throw new \InvalidArgumentException(
                'Logger Reader channel is invalid.',
            );
        }

        return $this->directory()
            . DIRECTORY_SEPARATOR
            . strtolower($channel)
            . '.log';
    }

    public function channels(): array
    {
        if (!$this->directoryReadable()) {
            return [];
        }

        $files = scandir(
            $this->directory(),
        );

        if ($files === false) {
            return [];
        }

        $channels = [];

        foreach ($files as $filename) {
            if (
                !is_string($filename)
                || !str_ends_with(
                    strtolower($filename),
                    '.log',
                )
            ) {
                continue;
            }

            $channel = substr(
                $filename,
                0,
                -4,
            );

            if (
                !$this->isValidChannel($channel)
            ) {
                continue;
            }

            $path = $this->channelPath(
                $channel,
            );

            if (
                !is_file($path)
                || !is_readable($path)
            ) {
                continue;
            }

            $channels[] = strtolower(
                $channel,
            );
        }

        $channels = array_values(
            array_unique(
                $channels,
            ),
        );

        sort(
            $channels,
            SORT_STRING,
        );

        return $channels;
    }

    public function hasChannel(
        string $channel,
    ): bool {
        if (!$this->isValidChannel($channel)) {
            return false;
        }

        $path = $this->channelPath(
            $channel,
        );

        return is_file($path)
            && is_readable($path);
    }

    public function read(
        string $channel,
        bool $descending = false,
        ?int $limit = null,
        ?array $levels = null,
        ?\DateTimeInterface $since = null,
        ?\DateTimeInterface $until = null,
        ?string $search = null,
        int $offset = 0,
    ): array {
        if (!$this->isValidChannel($channel)) {
            throw new \InvalidArgumentException(
                'Logger Reader channel is invalid.',
            );
        }

        if (
            $limit !== null
            && $limit < 1
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader limit must be greater than zero.',
            );
        }

        if ($offset < 0) {
            throw new \InvalidArgumentException(
                'Logger Reader offset must not be negative.',
            );
        }

        $levels = $this->normalizeLevels(
            $levels,
        );

        if (
            $since !== null
            && $until !== null
            && $since > $until
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader since date must not be after until date.',
            );
        }

        if ($search !== null) {
            $search = trim(
                $search,
            );

            if ($search === '') {
                $search = null;
            }
        }

        $path = $this->channelPath($channel);

        if (
            !is_file($path)
            || !is_readable($path)
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader channel does not exist.',
            );
        }

        if ($descending) {
            return $this->readDescending(
                $path,
                $limit,
                $levels,
                $since,
                $until,
                $search,
                $offset,
            );
        }

        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [];
        }

        try {
            $entries = [];
            $matchedEntries = 0;

            while (($line = fgets($handle)) !== false) {
                $parsed = $this->parseLine($line);

                if (
                    $parsed !== null
                    && $this->matchesLevels(
                        $parsed,
                        $levels,
                    )
                    && $this->matchesDates(
                        $parsed,
                        $since,
                        $until,
                    )
                    && $this->matchesSearch(
                        $parsed,
                        $search,
                    )
                ) {
                    if ($matchedEntries < $offset) {
                        $matchedEntries++;

                        continue;
                    }

                    $entries[] = $parsed;

                    if (
                        $limit !== null
                        && count($entries) >= $limit
                    ) {
                        break;
                    }
                }
            }

            return $entries;
        } finally {
            fclose($handle);
        }
    }

    public function page(
        string $channel,
        int $page = 1,
        int $pageSize = 25,
        bool $descending = true,
        ?array $levels = null,
        ?\DateTimeInterface $since = null,
        ?\DateTimeInterface $until = null,
        ?string $search = null,
    ): array {
        if ($page < 1) {
            throw new \InvalidArgumentException(
                'Logger Reader page must be greater than zero.',
            );
        }

        if (
            $pageSize < 1
            || $pageSize > self::MAX_PAGE_SIZE
        ) {
            throw new \InvalidArgumentException(
                'Logger Reader page size must be between 1 and 100.',
            );
        }

        $offset = ($page - 1)
            * $pageSize;

        $entries = $this->read(
            $channel,
            $descending,
            $pageSize + 1,
            $levels,
            $since,
            $until,
            $search,
            $offset,
        );

        $hasMore =
            count($entries) > $pageSize;

        if ($hasMore) {
            array_pop($entries);
        }

        return [
            'entries' => $entries,
            'pagination' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'count' => count($entries),
                'hasPrevious' => $page > 1,
                'hasMore' => $hasMore,
            ],
        ];
    }

    private function normalizeLevels(
        ?array $levels,
    ): ?array {
        if ($levels === null) {
            return null;
        }

        if ($levels === []) {
            throw new \InvalidArgumentException(
                'Logger Reader levels must not be empty.',
            );
        }

        $normalized = [];

        foreach ($levels as $level) {
            if (!is_string($level)) {
                throw new \InvalidArgumentException(
                    'Logger Reader level must be a string.',
                );
            }

            $level = strtoupper(
                trim($level),
            );

            if (
                !in_array(
                    $level,
                    self::LEVEL_NAMES,
                    true,
                )
            ) {
                throw new \InvalidArgumentException(
                    'Logger Reader level is invalid.',
                );
            }

            $normalized[] = $level;
        }

        return array_values(
            array_unique(
                $normalized,
            ),
        );
    }

    private function matchesLevels(
        array $entry,
        ?array $levels,
    ): bool {
        if ($levels === null) {
            return true;
        }

        return isset($entry['level'])
            && is_string($entry['level'])
            && in_array(
                $entry['level'],
                $levels,
                true,
            );
    }

    private function matchesDates(
        array $entry,
        ?\DateTimeInterface $since,
        ?\DateTimeInterface $until,
    ): bool {
        if (
            !isset($entry['timestamp'])
            || !is_string($entry['timestamp'])
        ) {
            return false;
        }

        try {
            $timestamp = new \DateTimeImmutable(
                $entry['timestamp'],
            );
        } catch (\Throwable) {
            return false;
        }

        if (
            $since !== null
            && $timestamp < $since
        ) {
            return false;
        }

        if (
            $until !== null
            && $timestamp > $until
        ) {
            return false;
        }

        return true;
    }

    private function matchesSearch(
        array $entry,
        ?string $search,
    ): bool {
        if ($search === null) {
            return true;
        }

        if (
            isset($entry['message'])
            && is_string($entry['message'])
            && stripos(
                $entry['message'],
                $search,
            ) !== false
        ) {
            return true;
        }

        if (
            !isset($entry['context'])
            || !is_array($entry['context'])
        ) {
            return false;
        }

        try {
            $context = json_encode(
                $entry['context'],
                JSON_THROW_ON_ERROR
                | JSON_UNESCAPED_SLASHES
                | JSON_UNESCAPED_UNICODE,
            );
        } catch (\JsonException) {
            return false;
        }

        return stripos(
            $context,
            $search,
        ) !== false;
    }

    private function readDescending(
        string $path,
        ?int $limit,
        ?array $levels,
        ?\DateTimeInterface $since,
        ?\DateTimeInterface $until,
        ?string $search,
        int $offset,
    ): array {
        $handle = fopen(
            $path,
            'rb',
        );

        if ($handle === false) {
            return [];
        }

        try {
            if (
                fseek(
                    $handle,
                    0,
                    SEEK_END,
                ) !== 0
            ) {
                return [];
            }

            $position = ftell($handle);

            if ($position === false) {
                return [];
            }

            $entries = [];
            $matchedEntries = 0;

            while (
                (
                    $line = $this->readPreviousLine(
                        $handle,
                        $position,
                    )
                ) !== null
            ) {
                $parsed = $this->parseLine(
                    $line,
                );

                if (
                    $parsed !== null
                    && $this->matchesLevels(
                        $parsed,
                        $levels,
                    )
                    && $this->matchesDates(
                        $parsed,
                        $since,
                        $until,
                    )
                    && $this->matchesSearch(
                        $parsed,
                        $search,
                    )
                ) {
                    if ($matchedEntries < $offset) {
                        $matchedEntries++;

                        continue;
                    }

                    $entries[] = $parsed;

                    if (
                        $limit !== null
                        && count($entries) >= $limit
                    ) {
                        break;
                    }
                }
            }

            return $entries;
        } finally {
            fclose($handle);
        }
    }

    private function readPreviousLine(
        $handle,
        int &$position,
    ): ?string {
        if ($position <= 0) {
            return null;
        }

        $line = '';

        while ($position > 0) {
            $position--;

            if (
                fseek(
                    $handle,
                    $position,
                ) !== 0
            ) {
                return null;
            }

            $character = fgetc($handle);

            if ($character === false) {
                return null;
            }

            if ($character === "\n") {
                if ($line === '') {
                    continue;
                }

                break;
            }

            $line = $character . $line;
        }

        return rtrim(
            $line,
            "\r\n",
        );
    }

    public function parseLine(
        string $line,
    ): ?array {
        $line = rtrim(
            $line,
            "\r\n",
        );
        if ($line === '') {
            return null;
        }
        $matched = preg_match(
            self::LINE_PATTERN,
            $line,
            $matches,
        );

        if (
            $matched !== 1
            || count($matches) !== 6
        ) {
            return null;
        }
        $timestamp = $matches[1];
        $channel = strtolower(
            $matches[2],
        );
        $level = strtoupper(
            $matches[3],
        );
        $message = $matches[4];
        $contextRaw = $matches[5];

        if (
            !$this->isValidChannel($channel)
            || !in_array(
                $level,
                self::LEVEL_NAMES,
                true,
            )
        ) {
            return null;
        }

        try {
            $date = new \DateTimeImmutable(
                $timestamp,
            );
        } catch (\Throwable) {
            return null;
        }

        $timestamp =
            $date->format(
                'Y-m-d\TH:i:s.uP',
            );

        if ($contextRaw === '-') {
            $context = [];
        } else {
            try {
                $decoded = json_decode(
                    $contextRaw,
                    true,
                    512,
                    JSON_THROW_ON_ERROR,
                );
            } catch (\JsonException) {
                return null;
            }

            if (!is_array($decoded)) {
                return null;
            }

            $context = $this->maskContext(
                $decoded,
            );
        }

        return [
            'timestamp' => $timestamp,
            'channel' => $channel,
            'level' => $level,
            'message' => $message,
            'context' => $context,
        ];
    }

    private function isSensitiveKey(
        string $key,
    ): bool {
        $normalized = strtolower(
            $key,
        );

        foreach (
            self::SENSITIVE_KEY_FRAGMENTS
            as $fragment
        ) {
            if (
                str_contains(
                    $normalized,
                    $fragment,
                )
            ) {
                return true;
            }
        }

        return false;
    }

    private function maskString(
        string $value,
    ): string {
        return preg_replace(
            '/\bBearer\s+[A-Za-z0-9._~+\/=-]+/i',
            'Bearer ' . self::MASKED_VALUE,
            $value,
        ) ?? $value;
    }

    private function maskContext(
        array $context,
    ): array {
        $masked = [];

        foreach ($context as $key => $value) {
            if (
                is_string($key)
                && $this->isSensitiveKey($key)
            ) {
                $masked[$key] =
                    self::MASKED_VALUE;

                continue;
            }

            if (is_array($value)) {
                $masked[$key] =
                    $this->maskContext($value);

                continue;
            }

            $masked[$key] = is_string($value)
                ? $this->maskString($value)
                : $value;
        }

        return $masked;
    }
}

<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Helper;

use Laswitchtech\CoreWeb\ConfigManager;

final class Application implements HelperInterface
{
    public function __construct(
        private readonly ConfigManager $config,
        private readonly string $appRoot,
    ) {
        if (trim($this->appRoot) === '') {
            throw new \InvalidArgumentException(
                'Application helper root must not be empty.',
            );
        }
    }

    public function name(): string
    {
        return 'application';
    }

    public function applicationName(): string
    {
        $value = $this->config->get(
            'application.name',
            'Core-Web',
        );

        return is_string($value) && trim($value) !== ''
            ? $value
            : 'Core-Web';
    }

    public function footer(): string
    {
        $value = $this->config->get(
            'application.footer',
            '',
        );

        return is_string($value)
            ? $value
            : '';
    }

    public function logoPath(): string
    {
        $value = $this->config->get(
            'application.logo',
            '',
        );

        return is_string($value)
            ? trim($value)
            : '';
    }

    public function logo(
        bool $base64 = false,
    ): string {
        $logoPath = $this->logoPath();

        if (!$base64) {
            return $logoPath;
        }

        return $this->encodeLogo(
            $logoPath,
        );
    }

    private function encodeLogo(
        string $logoPath,
    ): string {
        $file = $this->resolveLogoFile(
            $logoPath,
        );

        if ($file === null) {
            return '';
        }

        $finfo = new \finfo(
            FILEINFO_MIME_TYPE,
        );

        $mimeType = $finfo->file(
            $file,
        );

        if (
            !is_string($mimeType)
            || !in_array(
                $mimeType,
                [
                    'image/png',
                    'image/jpeg',
                    'image/webp',
                ],
                true,
            )
        ) {
            return '';
        }

        $contents = file_get_contents(
            $file,
        );

        if ($contents === false) {
            return '';
        }

        return sprintf(
            'data:%s;base64,%s',
            $mimeType,
            base64_encode(
                $contents,
            ),
        );
    }

    private function resolveLogoFile(
        string $logoPath,
    ): ?string {
        if (
            $logoPath === ''
            || !str_starts_with(
                $logoPath,
                '/',
            )
            || str_contains(
                $logoPath,
                "\0",
            )
        ) {
            return null;
        }

        $relativePath = ltrim(
            $logoPath,
            '/',
        );

        foreach (
            explode(
                '/',
                str_replace(
                    '\\',
                    '/',
                    $relativePath,
                ),
            ) as $segment
        ) {
            if (
                $segment === ''
                || $segment === '.'
                || $segment === '..'
            ) {
                return null;
            }
        }

        $root = realpath(
            $this->appRoot,
        );

        if ($root === false) {
            return null;
        }

        $candidate = realpath(
            $root
            . DIRECTORY_SEPARATOR
            . str_replace(
                '/',
                DIRECTORY_SEPARATOR,
                $relativePath,
            ),
        );

        if (
            $candidate === false
            || !is_file($candidate)
            || !is_readable($candidate)
        ) {
            return null;
        }

        $normalizedRoot = rtrim(
            str_replace(
                '\\',
                '/',
                $root,
            ),
            '/',
        );

        $normalizedCandidate = str_replace(
            '\\',
            '/',
            $candidate,
        );

        if (
            !str_starts_with(
                $normalizedCandidate,
                $normalizedRoot . '/',
            )
        ) {
            return null;
        }

        return $candidate;
    }
}

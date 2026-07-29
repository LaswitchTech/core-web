<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\File;

final readonly class UploadedImage
{
    public function __construct(
        private string $path,
        private string $mimeType,
        private int $size,
    ) {
    }

    public function path(): string
    {
        return $this->path;
    }

    public function mimeType(): string
    {
        return $this->mimeType;
    }

    public function size(): int
    {
        return $this->size;
    }
}

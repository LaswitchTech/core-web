<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\File;

use finfo;

final class ImageUploader
{
    private const MAX_FILE_SIZE = 5242880;

    /** @var array<string,string> */
    private const MIME_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private readonly string $storageRoot,
        private readonly string $publicPrefix,
    ) {
        if (trim($this->storageRoot) === '') {
            throw new \InvalidArgumentException(
                'Image upload storage root must not be empty.',
            );
        }

        if (
            trim($this->publicPrefix) === ''
            || $this->publicPrefix[0] !== '/'
        ) {
            throw new \InvalidArgumentException(
                'Image upload public prefix must begin with a slash.',
            );
        }
    }

    /**
     * @param array{
     *     name:string,
     *     type:string,
     *     tmp_name:string,
     *     error:int,
     *     size:int
     * } $file
     */
    public function store(
        array $file,
        string $name,
    ): UploadedImage {

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \RuntimeException(
                'Uploaded image did not complete successfully.',
            );
        }

        if (
            $file['size'] <= 0
            || $file['size'] > self::MAX_FILE_SIZE
        ) {
            throw new \RuntimeException(
                'Uploaded image exceeds the allowed size.',
            );
        }

        if (!is_uploaded_file($file['tmp_name'])) {
            throw new \RuntimeException(
                'Uploaded image temporary file is invalid.',
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file(
            $file['tmp_name'],
        );

        if (
            !is_string($mimeType)
            || !array_key_exists(
                $mimeType,
                self::MIME_EXTENSIONS,
            )
        ) {
            throw new \RuntimeException(
                'Uploaded image type is not allowed.',
            );
        }

        $extension = self::MIME_EXTENSIONS[$mimeType];

        $safeName = preg_replace(
            '/[^a-z0-9-]+/',
            '-',
            strtolower($name),
        );

        $safeName = trim(
            (string) $safeName,
            '-',
        );

        if ($safeName === '') {
            throw new \InvalidArgumentException(
                'Uploaded image name must contain letters or digits.',
            );
        }

        return $this->move(
            $file,
            $safeName,
            $extension,
            $mimeType,
        );
    }

    /**
     * Delete a previously stored image by its public path.
     */
    public function remove(string $publicPath): bool
    {
        $publicPath = trim($publicPath);

        if ($publicPath === '') {
            return false;
        }

        $normalizedPrefix = rtrim(
            $this->publicPrefix,
            '/',
        );

        if (
            $publicPath !== $normalizedPrefix
            && !str_starts_with(
                $publicPath,
                $normalizedPrefix . '/',
            )
        ) {
            throw new \InvalidArgumentException(
                'Image path does not belong to this uploader.',
            );
        }

        $relativePath = ltrim(
            substr(
                $publicPath,
                strlen($normalizedPrefix),
            ),
            '/',
        );

        if (
            $relativePath === ''
            || str_contains($relativePath, "\0")
            || str_contains($relativePath, '..')
            || str_contains($relativePath, '\\')
            || str_contains($relativePath, '/')
        ) {
            throw new \InvalidArgumentException(
                'Image path is invalid.',
            );
        }

        $storageRoot = realpath(
            $this->storageRoot,
        );

        if ($storageRoot === false) {
            return false;
        }

        $filePath =
            $storageRoot
            . DIRECTORY_SEPARATOR
            . $relativePath;

        if (!is_file($filePath)) {
            return false;
        }

        $resolvedFilePath = realpath($filePath);

        if (
            $resolvedFilePath === false
            || dirname($resolvedFilePath) !== $storageRoot
        ) {
            throw new \RuntimeException(
                'Image path resolves outside the upload storage root.',
            );
        }

        if (!unlink($resolvedFilePath)) {
            throw new \RuntimeException(
                'Uploaded image could not be removed.',
            );
        }

        return true;
    }

    /**
     * @param array{
     *     name:string,
     *     type:string,
     *     tmp_name:string,
     *     error:int,
     *     size:int
     * } $file
     */
    private function move(
        array $file,
        string $name,
        string $extension,
        string $mimeType,
    ): UploadedImage {
        if (
            !is_dir($this->storageRoot)
            && !mkdir(
                $this->storageRoot,
                0755,
                true,
            )
            && !is_dir($this->storageRoot)
        ) {
            throw new \RuntimeException(
                'Cannot create image upload directory.',
            );
        }

        $filename = $name . '.' . $extension;

        foreach (
            array_unique(
                array_values(
                    self::MIME_EXTENSIONS,
                ),
            ) as $existingExtension
        ) {
            if ($existingExtension === $extension) {
                continue;
            }

            $existingPath = rtrim(
                $this->storageRoot,
                DIRECTORY_SEPARATOR,
            ) . DIRECTORY_SEPARATOR
                . $name
                . '.'
                . $existingExtension;

            if (
                is_file($existingPath)
                && !unlink($existingPath)
            ) {
                throw new \RuntimeException(
                    'Cannot replace the previous uploaded image.',
                );
            }
        }

        $destination = rtrim(
            $this->storageRoot,
            DIRECTORY_SEPARATOR,
        ) . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file(
            $file['tmp_name'],
            $destination,
        )) {
            throw new \RuntimeException(
                'Cannot store uploaded image.',
            );
        }

        $publicPath = rtrim(
            $this->publicPrefix,
            '/',
        ) . '/' . $filename;

        return new UploadedImage(
            $publicPath,
            $mimeType,
            $file['size'],
        );
    }
}

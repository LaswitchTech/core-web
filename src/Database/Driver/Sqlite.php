<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Database\Driver;

use Laswitchtech\CoreWeb\Database\Connection;
use Laswitchtech\CoreWeb\Database\Error\DatabaseException;
use PDO;
use PDOException;

/**
 * SQLite driver — resolves database path, ensures target directory exists, and creates a PDO connection.
 *
 * Documentation: docs/development/architecture/Database/Driver/Sqlite.md
 */
final class Sqlite implements DriverInterface {

    /* ------------------------------------------------------------------ */
    /*  Connection factory                                                 */
    /* ------------------------------------------------------------------ */

    /**
     * Create a PDO-backed Connection for SQLite.
     *
     * Requires $config['path'] and $config['basePath']. Default 'path' is "data/app.db";
     * default 'basePath' falls back to getcwd() when the value is null or missing.
     */
    public function connect(array $config): Connection {

        /* --- validation ------------------------------------------------------------------ */

        if (!\extension_loaded('pdo_sqlite')) {
            throw new DatabaseException('The PDO SQLite extension (pdo_sqlite) is not loaded.');
        }

        // Resolve path — reject empty string early.
        $path = $config['path'] ?? 'data/app.db';
        if ($path === '') {
            throw new DatabaseException('Database path must not be empty.');
        }

        // Resolve basePath for relative-path resolution.
        $basePath = $config['basePath'] ?? getcwd();
        if ($basePath === false) {
            $basePath = '';
        }

        /* --- path resolution --------------------------------------------------------------- */

        if (self::isAbsPath($path)) {
            $resolvedPath = $path;
        } else {
            // Relative — resolve against basePath.
            $basePath   = \rtrim((string) $basePath, '/');
            $path       = \ltrim($path, '/');
            $resolvedPath = "{$basePath}/{$path}";
        }

        /* --- directory creation ------------------------------------------------------------ */

        $parentDir = \dirname($resolvedPath);
        if (!\is_dir($parentDir) && !\mkdir($parentDir, 0755, true) && !\is_dir($parentDir)) {
            throw new DatabaseException(
                "Unable to create database parent directory: {$parentDir}"
            );
        }

        /* --- PDO construction -------------------------------------------------------------- */

        try {
            $pdo = new PDO(
                "sqlite:{$resolvedPath}",
                null,
                null,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_PERSISTENT         => false,
                ]
            );
        } catch (PDOException $e) {
            throw new DatabaseException(
                "PDO SQLite connection failed: {$e->getMessage()}",
                0,
                $e
            );
        }

        /* --- pragmas ----------------------------------------------------------------------- */

        // journal_mode=WAL: allows concurrent readers while one writer proceeds.
        try {
            $pdo->exec('PRAGMA journal_mode=WAL');
        } catch (PDOException) {
            // Best-effort — WAL may be unsupported on older SQLite builds.
        }

        // foreign_keys=ON: enforce referential integrity at the engine level.
        try {
            $pdo->exec('PRAGMA foreign_keys=ON');
        } catch (PDOException) {
            // Best-effort — same reasoning as journal_mode above.
        }

        return new Connection($pdo);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                             */
    /* ------------------------------------------------------------------ */

    /** Check whether a string represents an absolute path. */
    private static function isAbsPath(string $path): bool {
        if ($path === '') {
            return false;
        }
        // Unix-style absolute: starts with '/'.
        if (\str_starts_with($path, '/')) {
            return true;
        }
        // Windows absolute: starts with 'X:\' or '\\?\''.
        if (\preg_match('#^[A-Za-z]:[/\\\\]|^\\\\[|\\\\\\\\[?\?\\\\]#', $path)) {
            return true;
        }
        return false;
    }
}

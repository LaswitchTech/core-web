<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Asset;

use Less_Parser;

/**
 * Compile and cache .less assets from the Asset Registry.
 *
 * Sorting uses priority ↑ → order ↑ → scope ↑ → file ↑ (provider rank is NOT used for compilation order).
 *
 * Documentation: docs/development/architecture/Asset/LessCompiler.md
 */
final class LessCompiler
{
    private string $appRoot;
    private string $cacheDir;

    public function __construct(string $appRoot, string $cacheDir)
    {
        $this->appRoot = rtrim($appRoot, '/\\');
        $this->cacheDir  = rtrim($cacheDir, '/\\') ?: sys_get_temp_dir();
    }

    /**
     * Collect .less entries from the registry and compile them into a single CSS string.
     *
     * When $debug is true compilation always runs fresh. Otherwise a cache key derived from
     * paths + mtimes + file sizes + src-hashes is used to serve previous output. Cache writes
     * are atomic (temp file + rename).
     */
    public function compile(Registry $registry, bool $debug = false): string
    {
        $allCss   = $registry->allCss();
        $lessFiles = [];

        foreach ($allCss as $entry) {
            // Only consider .less files that exist and are readable.
            if (strlen($entry->path) < 5 || strtolower(substr($entry->path, -5)) !== '.less') {
                continue;
            }

            if (!is_readable($entry->path)) {
                continue;
            }

            $src = file_get_contents($entry->path);
            if ($src === false) {
                continue;
            }

            $lessFiles[] = [
                'priority' => $entry->priority,
                'order'    => $entry->order,
                'scope'    => $entry->scope,
                'file'     => $entry->file,
                'path'     => $entry->path,
                'mtime'    => filemtime($entry->path),
                'size'     => filesize($entry->path),
                'contents' => $src,
            ];
        }

        // No LESS entries at all — nothing to compile.
        if ($lessFiles === []) {
            return '';
        }

        // Sort: priority ↑ → order ↑ → scope ↑ → file ↑.
        usort($lessFiles, static function (array $a, array $b): int {
            if ($a['priority'] !== $b['priority']) {
                return $a['priority'] <=> $b['priority'];
            }
            if ($a['order'] !== $b['order']) {
                return $a['order'] <=> $b['order'];
            }
            if ($a['scope'] !== $b['scope']) {
                return $a['scope'] <=> $b['scope'];
            }

            return $a['file'] <=> $b['file'];
        });

        // Cache key: path + mtime + size + sha256 of file contents.
        if (!$debug) {
            try {
                $payload = json_encode(
                    array_map(static function (array $e): array {
                        return ['path' => $e['path'], 'mtime' => $e['mtime'], 'size' => $e['size'], 'hash' => hash('sha256', $e['contents'])];
                    }, $lessFiles),
                    JSON_THROW_ON_ERROR
                );
                $cacheKey = 'json:' . hash('sha256', $payload);
            } catch (\JsonException) {
                // Fallback: hash a deterministic string payload.
                $fallback = implode(';', array_map(static function (array $e): string {
                    return "{$e['path']}:{$e['mtime']}:{$e['size']}:" . hash('sha256', $e['contents']);
                }, $lessFiles));
                $cacheKey  = 'fallback:' . hash('sha256', $fallback);
            }

            $cachePath = "{$this->cacheDir}/{$cacheKey}.css";

            if (is_file($cachePath) && is_readable($cachePath)) {
                $cached = file_get_contents($cachePath);
                if ($cached !== false) {
                    return $cached;
                }
            }
        }

        // Compile via Less_Parser.
        $parser    = new Less_Parser();
        $baseDir   = "{$this->appRoot}/";

        foreach ($lessFiles as $entry) {
            $parser->parseFile($entry['path'], $baseDir);
        }

        $css = $parser->getCSS();

        if (!$debug) {
            $this->writeCache($cachePath, $css);
        }

        return $css;
    }

    /**
     * Write cache file atomically: tmpfile → rename.
     *
     * Best-effort only — never throws or breaks CSS output.
     */
    private function writeCache(string $path, string $content): void
    {
        // Ensure directory exists; if we can't create it, bail out silently.
        $dir = dirname($path);

        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
                return;
            }
        }

        // Guard: if $dir is still not a directory (race or type mismatch), bail out.
        if (!is_dir($dir)) {
            return;
        }

        // Deterministic temp path using PID + random bytes.
        $tmpPath = "{$dir}/" . basename($path) . ".tmp." . getmypid() . '.' . bin2hex(random_bytes(8));

        if (@file_put_contents($tmpPath, $content) === false) {
            @unlink($tmpPath);
            return;
        }

        if (!@rename($tmpPath, $path)) {
            @unlink($tmpPath);
            return;
        }
    }
}

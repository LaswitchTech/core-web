<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router\Config\Http;

/**
 * Nginx nginx.conf snippet generator for Core-Web routing.
 *
 * Emits a `try_files` location block and optional fastcgi configuration
 * that routes all requests to the application's entry point (index.php).
 *
 * The generated snippet is intended to be included **inside** the `server {}`
 * context.  It replaces the typical `try_files $uri $uri/ /index.php$is_args$args;`
 * line with a version that correctly handles subdirectory deployments.
 *
 * @see https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#try_files
 * Documentation: docs/development/architecture/Router/Config/Http/Nginx.md
 */
final class Nginx
{
    /**
     * Generate a server-block snippet for Nginx.
     *
     * @param string $subdir  Subdirectory path relative to the root
     *                        e.g. `app` for https://example.com/app/
     * @return string A complete location block plus fastcgi configuration
     */
    public static function generate(string $subdir = ''): string
    {
        // Normalise subdir (strip trailing slashes).
        $trimmed = trim($subdir, '/');

        if ($trimmed === '') {
            // ================================================================
            // ROOT deployment — try_files at the server root level.
            // Falls back to /index.php when no real file/dir is found.
            // ================================================================
            return <<<NGINX
    location / {
        # Serve static files, then fall through to index.php.
        try_files \$uri \$uri/ =404;

        # Pass everything else to the PHP-FPM backend.
        include fastcgi_params;
        fastcgi_pass   unix:/run/php-fpm/www.sock;
        fastcgi_param  SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
    }
NGINX;
        }

        // ================================================================
        // SUBDIRECTORY deployment (e.g. https://example.com/app/).
        // Requires an `alias` block and rewritten URI handling.
        // ================================================================
        return <<<NGINX
    location /{$trimmed}/ {
        # Serve static files at /{subdir}/path/to/file, then fall through.
        try_files \$uri \$uri/ @app;

        # Pass everything else to the PHP-FPM backend.
        include fastcgi_params;
        fastcgi_pass   unix:/run/php-fpm/www.sock;
        fastcgi_param  SCRIPT_FILENAME \$document_root{$trimmed}/index.php;
        fastcgi_param  PATH_INFO          \$fastcgi_path_info;
    }

    # Internal catch-all for the application root.
    location @app {
        rewrite ^/{$trimmed}/(.*)\$ /{$trimmed}/index.php last;
    }

    # Root-level fallback (required when deploying to a sub-directory).
    location = {$trimmed} {
        return 301 /{$trimmed}/;
    }

NGINX;
    }

    /**
     * Write the generated snippet to a file on disk.
     *
     * Overwrites atomically (temp + rename).
     * Returns the output path or null on failure.
     */
    public static function writeToFile(string $path, string $subdir = ''): ?string
    {
        // Escape any forward-slash delimiters in the subdir for use as a regex anchor.
        $regexSubdir = '/' . preg_quote(trim($subdir, '/'), '/') . '/';

        $content   = self::generate($subdir);
        $tmpDir    = dirname($path);

        if (!is_dir($tmpDir)) {
            return null;
        }

        // Write the content to a temporary file.
        $tmpFile = tempnam($tmpDir, 'nginx_');

        if ($tmpFile === false || file_put_contents($tmpFile, $content) === false) {
            @unlink($tmpFile);
            return null;
        }

        // Atomic rename to overwrite the existing file.
        if (!rename($tmpFile, $path)) {
            @unlink($tmpFile);
            return null;
        }

        return $path;
    }
}

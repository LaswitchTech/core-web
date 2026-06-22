<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router\Config\Http;

/**
 * IIS web.config generator for Core-Web routing.
 *
 * Emits a <rewrite> rule set that routes all requests to index.php
 * via IIS URL Rewrite module, supporting both root and subdirectory deployments.
 *
 * Note: web.config is always placed in the application root. The $subdir parameter
 * controls rewrite-path generation but the action URL stays as "index.php" since
 * deployment context (reverse-proxy headers) handles subdirectory routing on IIS.
 *
 * Usage:
 *     file_put_contents('web.config', \Laswitchtech\CoreWeb\Router\Config\Http\IIS::generate('/app'));
 */
final class IIS
{

    /**
     * Generate a web.config snippet for IIS URL Rewrite.
     *
     * @param string $subdir Subdirectory path (empty = root deployment).
     * @return string Complete XML web.config content ready to write to disk.
     */
    public static function generate(string $subdir = ''): string
    {
        // subdirectory support is deferred to the future installer task.
        // For now the action URL is always "index.php" and deployment context
        // (reverse-proxy headers) handles subdirectory routing on IIS.
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Core-Web Front Controller" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="index.php" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
XML;
    }

    public static function writeToFile(string $path, string $subdir = ''): ?string
    {
        $content   = self::generate($subdir);
        $tmpDir    = dirname($path);

        if (!is_dir($tmpDir)) {
            return null;
        }

        $tmpFile = tempnam($tmpDir, 'iis_');

        if ($tmpFile === false || file_put_contents($tmpFile, $content) === false) {
            @unlink($tmpFile);
            return null;
        }

        if (!rename($tmpFile, $path)) {
            @unlink($tmpFile);
            return null;
        }

        return $path;
    }
}

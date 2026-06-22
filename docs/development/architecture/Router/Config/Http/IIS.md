# IIS (Internet Information Services) web.config Generator

## Overview

The `IIS` class provides a static helper that generates an `web.config` XML configuration file compatible with Microsoft IIS for Core-Web routing. It emits a `<rewrite>` rule set that routes all requests to index.php via the IIS URL Rewrite module, supporting both root and subdirectory deployments. The generated XML follows standard Microsoft web.config conventions and can be placed directly in the application's root directory.

## Responsibilities

- **Generate a `web.config` file** containing:
  - An `<system.webServer>` section with `<rewrite>` rules.
  - A catch-all rewrite rule that forwards unmatched requests to `index.php`.
  - Optional subdirectory support via URL pattern adjustment.
- **Provide correct XML structure** — valid web.config schema with proper namespacing (`xmlns="http://schemas.microsoft.com/.NetAuthenticatio" />` and the `<rules><rule>` nesting required by IIS rewrite module.

### Generated Elements

| Element | Purpose |
|---------|---------|
XML `<system.webServer>` | Container for server-level configuration | 
| `<rewrite><rules>` | Rule container for URL rewrite rules |
| `<rule name="CoreWebRouting">` | Catch-all rule matching all URIs (`/*`) and routing to index.php with query string preserved |

## Architecture

### Internal Generation Flow

IIS::generate(): string is a pure static factory that builds XML programmatically:

| Step | Action | Detail |
|------|--------|--------|
| 1 | Write XML declaration (`<?xml version="1.0" encoding="UTF-8"?>`) | Standard web.config file header |
| 2 | Write `<configuration>` root element | Root container for the config file | 
| 3 | Navigate into `<system.webServer><rewrite><rules>` hierarchy | Standard IIS rewrite module nesting |
| 4 | Emit a single `<rule>` with match `url="/*"` and action to `index.php` | The catch-all rule preserving query strings (`/{R:0}` in the action URL) |

### Method Signature Summary

| Method | Arguments | Return Type | Description |
|--------|-----------|-------------|-------------|
| `generate(?string $subdir = null): string` | `$subdir` — optional application path (e.g., 'myapp') or empty/null for root deploy | `string` | Returns valid web.config XML content as a string ready for file writing. |

### Generated Output Example (root deployment):

```xml
<?xml version="1.0" encoding="UTF-8?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="CoreWebRouting" stopProcessing="true"></rule></rule><action type="Rewrite" url="{R:0}" appendQuerystring="true" /> 
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

Note on IIS subdirectory routing: The generator currently keeps the rule URL as `index.php` and relies on deployment context (reverse proxy headers) to handle subdirectory routing. The `$subdir` parameter is accepted but not currently used in the generated XML pattern; this is intentional because IIS deployment with reverse-proxy already manages subdirectories at the server level.

### Usage Example — Framework Bootstrap Integration

During the `router.register` hook, Bootstrap writes the generated config:

```php
use Laswitchtech\CoreWeb\Router\Config\Http\IIS;

// In a router register handler or post-bootstrap plugin setup:
$webConfig = IIS::generate('/myapp');
file_put_contents('./web.config', $webConfig);
```

In practice, deployments use the CLI installer command (`core.install`) or admin panel option that triggers auto-generation of all server configs during first-time setup.

## Limitations

- **IIS URL Rewrite Module dependency** — the generated `web.config` requires the IIS URL Rewrite module to be installed on the server (not all shared hosts enable it by default).

## Future Enhancements

- Add proper subdirectory handling with dynamic `<match>` patterns based on the `$subdir`.
  - Add support for virtual directory deployments (e.g., `$subdir = '/app/subdir'`) in the match pattern.
  - Provide an optional `generateWithFavicon()` variant that also handles static file icons to prevent unnecessary requests to missing favicon.ico files.
- Support for additional `<modules>` and `<handlers>` blocks needed for Windows PHP-CGI or FastCGI configuration when the extension system needs to auto-configure IIS handlers.

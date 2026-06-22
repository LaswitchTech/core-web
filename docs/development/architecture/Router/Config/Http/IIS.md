# IIS Configuration

## Purpose

The IIS Configuration generator produces a web.config XML file with URL Rewrite rules for Core-Web deployments on Microsoft IIS servers.

## Responsibilities

_(none)_

## Public API

_(none)_

## Generated Output Examples

### Root deployment (generate(''))

**Note**: Currently `subdir` is always ignored — subdirectory support is marked "deferred to the future installer task." The `$subdir` parameter receives `''` but is not used in the template:

```xml
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
```

The output contains:

- `<match url=".*" />` — matches all request URLs.
- Two conditions on `{REQUEST_FILENAME}` negating both `IsFile` and `IsDirectory`.
- Single <rewri te type="Rewrite" action with URL set to `index.php`.

## Dependencies

---

## Lifecycle

---

## Future Enhancements

---

# Manifest\Parser

## Purpose

`Manifest\Parser` discovers, parses, and validates extension manifests (`.json` files) under the `ext/` directory tree. It produces immutable `Extension` value objects that are consumed by `Bootstrap::registerExtensions()`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Manifest;

final class Parser {
    public const array VALID_MANIFEST_NAMES = ['manifest.json', 'extension.json'];

    public static function discover(string $baseDir): array { ... }
    public static function parse(string $filePath): Extension { ... }
    public static function validate(array $data, string $filePath = ''): Extension { ... }
}
```

- **`final class`** — no subclassing expected; all methods are static helpers.
- Not an instance-based class; stateless by design.

## Schema

### Required keys (validated during parse/validate)

| Key      | Type   | Constraints                              |
|----------|--------|------------------------------------------|
| `type`   | string | Must be `'theme'` or `'plugin'` (case-insensitive). |
| `name`   | string | Non-empty stripped string.              |
| `version`| string | X.Y.Z format (prefixes v/V/= stripped). |

### Optional keys (defaults applied during validate)

| Key      | Type         | Default            | Notes                              |
|----------|--------------|--------------------|-------------------------------------|
| `hooks`  | list<string> | `[]`               | Each entry: dotted namespace or `Class::method`. |
| `layouts`| list<string> | `[]`               | Layout identifiers (themes only).   |
| `depends`| list<string> | `[]`               | Extension name-slug dependencies; must be non-empty strings. |

## Public API

### `VALID_MANIFEST_NAMES`

```php
public const array = ['manifest.json', 'extension.json'];
```

Defines the two accepted manifest filenames.

> **Note**: Despite this constant, `discover()` currently hardcodes a check for only `manifest.json` (line 51 of Parser.php). The `'extension.json'` option in the constant is never exercised by discovery — manifests named `extension.json` are silently ignored during directory walks. This appears to be incomplete scaffolding.

### `discover(string $baseDir): list<Extension>`

Finds all extension directories in `$baseDir/themes/*` and `$baseDir/plugins/*`, parses each manifest, and returns a list of `Extension` objects.

**Walk rules:**

1. Walks exactly two subdirectories: `themes/` and `plugins/`.
2. For each top-level entry within them, checks the entry is a directory **and** contains a file named `manifest.json`.
3. Calls `self::parse()` for each candidate — invalid manifests produce a `STDERR` warning but do **not** block others.

```php
// Inside: foreach (['themes', 'plugins'] as $typeDir) { ... }
$extDir = "{$typePath}/{$entry}";
if (!is_dir($extDir) || !is_file("{$extDir}/manifest.json")) {
    continue; // silently skip non-manifest directories
}

try {
    $manifests[] = self::parse("{$extDir}/manifest.json");
} catch (\Throwable $e) {
    fwrite(STDERR, "Manifest parse error for {$extDir}: {$e->getMessage()}\n");
}
```

**Return**: `list<Extension>` — empty list if `$baseDir` does not exist or contains no valid manifests.

### `parse(string $filePath): Extension`

Parses and validates a single manifest file.

- Throws `\InvalidArgumentException` if the file doesn't exist.
- Throws `\JsonException` (via `json_decode → JSON_THROW_ON_ERROR`) if the content is invalid JSON.
- Delegates required-field validation to `validate()`.

### `validate(array $data, string $filePath = ''): Extension`

Validates a decoded manifest array and produces an `Extension` value object. Called by both `parse()` (with file path) and external callers (without).

**Validation flow:**

1. **Required fields**: `type`, `name`, `version` must be present, non-empty strings.
2. **Type enforcement**: Lowercased to `'theme'` or `'plugin'`. Anything else throws `\InvalidArgumentException`.
3. **Name stripping**: Trimmed (leading/trailing whitespace).
4. **Version normalization**: Strips leading `v/V=/ ` then validates `/^\d+\.\d+\.\d+/`. Stored as the trimmed string even if it exceeds X.Y.Z format thereafter.
5. **Optional fields**: `hooks` (validated entries), `layouts`, `depends` — all default to `[]`.
6. **Dependencies validation**: Each entry must be a non-empty string.

**Version normalization:**

```php
// 'v1.2.3' → '1.2.3'
// '= 2.0.1' → '2.0.1'
// strips leading v/V=/ and spaces
```

## Private Helpers

### `normalizeVersion(string $version): string`

Strips common SemVer prefixes (`v`, `V`, `=`, whitespace) and validates the remaining portion starts with `\d+\.\d+\.\d+`. Returns the trimmed string (no further validation beyond prefix stripping + leading format check).

### `validateHooks(array $hooks): array`

Validates each entry is a non-empty string matching:

```regex
/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|::[a-zA-Z_][a-zA-Z0-9_]*)*$/
```

This supports both:
- **Dotted namespaces**: e.g. `layout.header`, `page.before_render`
- **Class::method notation**: e.g. `App\HeaderPlugin::render`

Returns deduplicated (`array_values()`) list or throws `\InvalidArgumentException` on invalid entries.

## Lifecycle Example

```php
// Step 1: discover extensions in vendor path
$manifests = Parser::discover(__DIR__ . '/../../ext');
// [Extension@theme/default, Extension@plugin/cache]

// Step 2: parse a specific manifest directly
$ext = Parser::parse('/path/to/ext/themes/default/manifest.json');

// Step 3: validate an already-decoded array
$decoded = json_decode(file_get_contents('manifest.json'), true);
$ext2 = Parser::validate($decoded, 'test-manifest.json');
```

## Design Decisions

### Silent Failure in `discover()`

Individual manifest failures are logged to STDERR but do not halt discovery. This is intentional: a single corrupted extension should not prevent the rest of the system from starting. The error message on STDERR during bootstrap will surface via Bootstrap's error handler (die() or fwrite).

### Hardcoded Manifest Filename Check

`discover()` checks `$extDir . '/manifest.json'` directly rather than iterating `VALID_MANIFEST_NAMES`. The constant exists in the class but discovery does not reference it — effectively only `manifest.json` is supported during walks. This may be intentional (standardizing on one filename) or incomplete scaffolding (the `'extension.json'` entry should likely drive discovery iterations).

### Schema Leniency on Optionals

Optional fields default to empty arrays without requiring the keys to exist in JSON. A manifest with only `{ "type": "plugin", "name": "foo", "version": "1.0.0" }` is fully valid — `hooks`, `layouts`, and `depends` are all inferred as `[]`.

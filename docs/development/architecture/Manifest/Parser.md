# Manifest\Parser

## Purpose

`Manifest\Parser` discovers, parses, and validates extension manifests (`.json` files) under the `ext/` directory tree. It produces immutable `Extension` value objects that are consumed by `Bootstrap::registerExtensions()`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Manifest;

final class Parser {
    public const string KERNEL_VERSION = '1.0.0';
    public const array VALID_MANIFEST_NAMES = ['manifest.json', 'extension.json'];

    public static function checkCompat(string $constraint, string $kernel): bool { ... }
    public static function discover(string $baseDir, string $origin = 'framework'): list<Extension> { ... }
    public static function parse(string $filePath, string $origin = 'framework'): Extension { ... }
    public static function validate(array $data, string $filePath = '', string $origin = 'framework'): Extension { ... }
}
```

- **`final class`** — no subclassing expected; all methods are static helpers.
- Not an instance-based class; stateless by design.

## Schema

### Required keys (validated during parse/validate)

| Key       | Type   | Constraints                              |
|-----------|--------|------------------------------------------|
| `type`    | string | Must be `'theme'` or `'plugin'` (case-insensitive). |
| `name`    | string | Non-empty stripped string.              |
| `version` | string | X.Y.Z format exactly (prefixes v/V/= stripped, no trailing content). |

### Optional keys (defaults applied during validate)

| Key            | Type         | Default  | Notes                                        |
|----------------|--------------|----------|----------------------------------------------|
| `hooks`        | list<string> | `[]`     | Each entry: dotted namespace or `Class::method`. |
| `layouts`      | list<string> | `[]`     | Layout identifiers (themes only).            |
| `depends`      | list<string> | `[]`     | Extension name-slug dependencies; must be non-empty strings. |
| `kernel-compat`| string       | `null`   | Kernel compatibility constraint; validated during discovery, stored as-is. Tolerant enforcement — incompatible extensions warn but are not rejected. |
| `autoload.psr-4`| object      | `{}`     | Composer-style PSR-4 namespace mappings; see "PSR-4 Autoload Mappings" below. Stored on `Extension::psr4Mappings` as `list<array{prefix: string, directory: string}>`. |

## Public API

### `VALID_MANIFEST_NAMES`

```php
public const array = ['manifest.json', 'extension.json'];
```

Defines the two accepted manifest filenames. `discover()` iterates this constant, checking each candidate in order and taking the first file that exists on disk. If an extension directory contains both filenames, `manifest.json` is preferred.

### `discover(string $baseDir, string $origin = 'framework'): list<Extension>`

Finds all extension directories in `$baseDir/themes/*` and `$baseDir/plugins/*`, parses each manifest, and returns a list of `Extension` objects.

**The `$origin` parameter** labels every returned `Extension` value object with its discovery source. It is diagnostic-only; the parser does not use it to enforce behavior. By convention Bootstrap calls this method once per extension base, passing `'framework'` first (the package's built-in extensions) and `'app'` second (the user's application directory).

**Walk rules:**

1. Walks exactly two subdirectories: `themes/` and `plugins/`.
2. For each top-level entry within them, checks the entry is a directory **and** contains **any** filename matching `VALID_MANIFEST_NAMES` (currently `manifest.json` or `extension.json`).
3. Iterates `VALID_MANIFEST_NAMES` in order; takes the first file found on disk.
4. Calls `self::parse()` for each candidate — invalid manifests produce a `STDERR` warning but do **not** block others.

```php
foreach (['themes', 'plugins'] as $typeDir) {
    $typePath = "{$baseDir}/{$typeDir}";
    if (!$is_dir($typePath)) continue;

    foreach (\scandir($typePath) as $entry) {
        if ($entry[0] === '.') continue;           // skip . and ..
        $extDir = "{$typePath}/{$entry}";
        if (!is_dir($extDir)) continue;

        // Check each valid manifest name in order.
        $manifestFile = null;
        foreach (self::VALID_MANIFEST_NAMES as $name) {
            $candidate = "{$extDir}/{$name}";
            if (is_file($candidate)) {
                $manifestFile = $candidate;
                break;  // take the first match.
            }
        }
        if ($manifestFile === null) continue;

        try {
            $manifests[] = self::parse($manifestFile);
        } catch (\Throwable $e) {
            fwrite(STDERR, "Manifest parse error for {$extDir}: {$e->getMessage()}\n");
        }
    }
}
```

**Return**: `list<Extension>` — empty list if `$baseDir` does not exist or contains no valid manifests.

### `parse(string $filePath, string $origin = 'framework'): Extension`

Parses and validates a single manifest file.

- Throws `\InvalidArgumentException` if the file doesn't exist.
- Throws `\JsonException` (via `json_decode → JSON_THROW_ON_ERROR`) if the content is invalid JSON.
- Delegates required-field validation to `validate()`.

### `validate(array $data, string $filePath = '', string $origin = 'framework'): Extension`

Validates a decoded manifest array and produces an `Extension` value object. Called by both `parse()` (with file path) and external callers (without).

**Validation flow:**

1. **Required fields**: `type`, `name`, `version` must be present, non-empty strings. Throws `\InvalidArgumentException` if missing or empty.
2. **Type enforcement**: Lowercased to `'theme'` or `'plugin'`. Anything else throws `\InvalidArgumentException`.
3. **Name stripping**: Trimmed (leading/trailing whitespace).
4. **Version normalization**: Strips leading `v/V=/ ` (via `ltrim(trim($version), 'vV= ')`) then validates `/^\d+\.\d+\.\d+$/` — the entire trimmed string must match exactly with no trailing content (e.g., `"1.2.3-extra"` is invalid).
5. **Optional fields**: Default to `[]` if not present in JSON. Hooks entries are validated individually; layouts and depends are value-normalized via `array_values()`.
6. **Dependencies validation**: Each entry must be a non-empty string. Throws `\InvalidArgumentException` otherwise.
7. **kernel-compat** (optional): If `"kernel-compat"` is present and is a non-empty string, it is stored verbatim on the `Extension` value object (`$kernelCompat`). Validation of this constraint happens during discovery in `Bootstrap::registerExtensions()` via `checkCompat()`.

**Version normalization:**

```php
// 'v1.2.3'     → '1.2.3'  ✓
// '= 2.0.1'    → '2.0.1'  ✓
// 'V1.0.0-beta' → error (trailing '-beta' fails /^\d+\.\d+\.\d+$/)
```

## CONSTANTS

### `KERNEL_VERSION`

```php
public const string = '1.0.0';
```

The framework kernel version string used as the reference for **compatibility resolution**. Extension constraints are validated against this value by `checkCompat()`.

## PUBLIC API

### `checkCompat(string $constraint, string $kernel): bool`

Determines whether an extension's declared `kernel-compat` constraint is compatible with a given `$kernel` version. This method powers the tolerant compatibility checks performed during discovery.

**Supported V1 formats** (three-operator approach):

| Format | Meaning | Example matching `KERNEL_VERSION = '1.0.0'` |
|--------|---------|---------------------------------------------|
| `^X.Y.Z` | Major must match; minor must be ≥ constraint minor; patch must be ≥ constraint patch | `"^0.9"` → compatible (major 1 matches, minor 0 ≥ 9? No — only if constraint is `"^1.0"`) |
| `~X.Y.Z` | Major and minor must both match; patch must be ≥ constraint patch | `"~1.0"` → compatible |
| *(none)* | Exact match: every segment must be identical | `"1.0.0"` → compatible |

**Return**: `true` if the constraint is unconstrained, recognized and matching, or unrecognized (permissive default). `false` only when a recognized constraint explicitly fails.

**Behavior in V1**:

- Unrecognized constraint patterns (e.g., `"!= 1.0"`, `"*"`) are treated as **compatible** (`true`). This is intentional tolerance — V1 errs on the side of letting extensions load.
- The method does not parse, validate, or store — it returns a boolean only. Status persistence (`unconstrained` / `compatible` / `incompatible`) is handled by Bootstrap during discovery.

#### Examples

```php
Parser::checkCompat('^1.0', '1.0.0');   // true  (equal major, minor 0 ≥ 0)
Parser::checkCompat('~1.0', '1.0.5');    // true  (major and minor match; patch 5 ≥ 0)
Parser::checkCompat('1.0.0', '1.0.0');   // true  (exact match)
Parser::checkCompat('^2.0', '1.0.0');    // false (major mismatch)
Parser::checkCompat('*', '1.0.0');        // true  (unrecognized — permissive)
```

### `validateHooks(array $hooks): array`

Validates each entry is a non-empty string matching:

```regex
/^[a-zA-Z0-9_]+(?:[:.\\\\][a-zA-Z0-9_.\\\\:]*[a-zA-Z0-9_])?$/
```

This supports:
- **Dotted namespaces**: `layout.header`, `page.before_render`
- **Class::method notation**: `App\HeaderPlugin::render`
- **Fully-qualified class paths with backslashes**: `Laswitchtech\CoreWeb\Plugin\Class::onStart`

Allowed separators between segments: `.`, `:`, or `\`. Each segment must start and end with an alphanumeric or underscore character.

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

### PSR-4 Autoload Mappings

When a manifest declares `"autoload.psr-4"`, the parser treats it as an **optional, additive** Composer-style mapping block. It is merged into `Extension::psr4Mappings` as a list of `{ prefix, directory }` pairs that Bootstrap later injects into `spl_autoload_register()` alongside the legacy `src/` directory fallback.

**Accepted JSON shape:**

```json
{
    "autoload": {
        "psr-4": {
            "Vendor\\Plugin\\": "src/"
        }
    }
}
```

**Validation rules per mapping entry:**

| Field      | Constraint                                    | Behavior on failure                    |
|------------|-----------------------------------------------|----------------------------------------|
| `prefix`   | Must be a non-empty string ending with `\`.  | Skipped; STDERR warning printed.       |
| `directory`| Non-empty relative path (string).             | Skipped; STDERR warning printed.       |

**Directory normalization:** Leading/trailing `/` and `\` are stripped from the directory value. If the result is empty after stripping, the mapping is skipped with an STDERR warning. The directory is then converted to forward-slash separators (`str_replace('\\', '/', ...)`).

**Prefix enforcement:** The prefix must end with a trailing backslash (\); prefixes without one are invalid and skipped during parsing. The trailing backslash is preserved **as declared** in the manifest and not further normalized.

**Skipped vs blocked:** Invalid mappings are skipped individually — they produce a STDERR warning but do not prevent valid mappings from being stored or the extension from loading. This keeps autoloading tolerant in V1.0: a malformed PSR-4 entry should not break extension discovery.

**Output format on `Extension::psr4Mappings`:**

```php
// Given manifest:
// { "autoload": { "psr-4": { "MyCorp\\Plugin\\": "/lib/" } } }

$extension->psr4Mappings === [
    [ 'prefix' => 'MyCorp\\Plugin\\', 'directory' => 'lib' ]
];
```

#### Example manifests

```json
// Single mapping — plugin autoloading:
{
    "type": "plugin",
    "name": "Example",
    "version": "1.0.0",
    "autoload": {
        "psr-4": {
            "ExamplePlugin\\": "src/"
        }
    }
}

// Multiple mappings in one manifest:
{
    "type": "plugin",
    "name": "MultiLoad",
    "version": "1.0.0",
    "autoload": {
        "psr-4": {
            "MultiLoad\\Classes\\": "classes/",
            "MultiLoad\\Tests\\": "tests/"
        }
    }
}

// Invalid — prefix missing trailing backslash (will be skipped silently):
{
    "type": "plugin",
    "name": "BadPrefix",
    "version": "1.0.0",
    "autoload": {
        "psr-4": {
            "BadPrefix\\Service": "src/"  // ❌ no trailing backslash
        }
    }
}
```

## Design Decisions

### Silent Failure in `discover()`

Individual manifest failures are logged to STDERR but do not halt discovery. This is intentional: a single corrupted extension should not prevent the rest of the system from starting. The error message on STDERR during bootstrap will surface via Bootstrap's error handler (die() or fwrite).

### Tolerant Manifest Filename Discovery

`discover()` iterates `VALID_MANIFEST_NAMES` rather than hardcoding a single filename — both `manifest.json` and `extension.json` are treated equally. If both filenames exist in an extension directory, `manifest.json` wins by virtue of appearing first in the constant array.

### Schema Leniency on Optionals

Optional fields default to empty arrays without requiring the keys to exist in JSON. A manifest with only `{ "type": "plugin", "name": "foo", "version": "1.0.0" }` is fully valid — `hooks`, `layouts`, and `depends` are all inferred as `[]`.

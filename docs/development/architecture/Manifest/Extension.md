# Manifest\Extension

## Purpose

`Manifest\Extension` is an immutable value object representing a single parsed extension manifest. It carries all metadata extracted from the source `manifest.json`, including type, name, version, hooks, layouts, dependencies, and directory path. Created exclusively by `Manifest\Parser::validate()`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Manifest;

final readonly class Extension {
    public string   $file;       // absolute path to manifest.json
    public string   $type;       // 'theme' or 'plugin' (lowercased by parser)
    public string   $name;       // display name/slug (trimmed whitespace)
    public string   $version;    // semver X.Y.Z (stripped of v/V=/ prefixes by parser)
    public array    $hooks;      // list<string> hook definitions from manifest
    public array    $layouts;    // list<string> layout identifiers (themes only)
    public string   $directory;  // absolute directory containing the manifest
    public array    $depends;    // list<string> extension dependencies (default: [])
}
```

- **`final readonly class`** in PHP 8.2+ semantics — all properties are implicitly `readonly`, so nothing is writable after construction. This is a pure value object with no mutator methods.
- The constructor body is empty; type constraints flow from PHP's parameter-typed properties (PTPs) and the parser's pre-validation.

## Constructor Parameter Order

Parameters are ordered to satisfy PHP 8.4+ rules: **all required parameters must precede optional ones**. Currently only `$depends` has a default (`[]`).

```php
public function __construct(
    string $file,       // required — never null
    string $type,       // required — validated by parser
    string $name,       // required — trimmed by parser
    string $version,    // required — normalized by parser
    array  $hooks,      // required — defaults to [] inside parser, but passed explicitly here
    array  $layouts,    // required — same
    string $directory,  // required — dirname of the manifest file
    array  $depends = [], // only optional parameter (rightmost)
)
```

All parameters are public properties declared inline (`phpdoc` + type). No `$this->` assignment body exists.

## Properties

| Property      | Type           | Source / Notes                                          |
|---------------|----------------|----------------------------------------------------------|
| `$file`       | `string`       | Absolute path to the parsed `manifest.json`.             |
| `$type`       | `string`       | Lowercased `'theme'` or `'plugin'`, enforced by parser. |
| `$name`       | `string`       | Trimmed display name from JSON.                          |
| `$version`    | `string`       | Stripped SemVer (e.g. `1.2.3`). Normalized by parser.   |
| `$hooks`      | `list<string>` | Dotted namespaces and/or `Class::method` strings.        |
| `$layouts`    | `list<string>` | Layout identifiers provided by this extension.           |
| `$directory`  | `string`       | Absolute directory of the manifest file (realpath'd).   |
| `$depends`    | `list<string>` | Name-slugs of required extensions. Defaults to `[]`.     |

## Factory Method

There is no factory method on this class — it is always created by:

```php
// Inside Manifest\Parser::validate() at the end:
return new Extension(
    file:      $filePath,           // validated real path string
    type:      $type,               // 'theme' | 'plugin'
    name:      $name,               // trimmed
    version:   $normalizedVersion,  // X.Y.Z format
    hooks:     $hooks,              // parsed + regex-validated
    layouts:   $layouts,            // array_values() deduped
    depends:   $depends,            // non-empty-string entries only
    directory: dirname($filePath),  // absolute path to extension base dir
);
```

All values are pre-validated by `Parser::validate()`, so the Extension constructor never performs its own validation — it's a pure carrier of validated state.

## Usage Patterns

### Accessing from Container

```php
 $index = Bootstrap::container()->resolve('extension_index'); // stdClass with name keys
// or typed access via direct property lookup since values are stored as (object) $extIndex
```

The value flows at: Bootstrap.php:176-254 registers hooks into Hook\Registry and indexes Extension metadata.

### Property Inspection

Because all properties are public readonly, consumers can inspect any field directly without getters/setters:

```php
foreach ($manifests as $manifest) {
    echo sprintf(
        "%s v%s (%s) — %d hooks, %d dependencies\n",
        $manifest->name,
        $manifest->version,
        strtoupper($manifest->type),
        count($manifest->hooks),
        count($manifest->depends),
    );
}

// Check a specific extension's directory:
$themeDir = $manifest->directory; // safe, always absolute path string
```

### Pattern Matching / Destructuring (PHP 8.0+)

Since properties are all declared, named destructuring works cleanly:

```php
foreach ($manifests as ['name' => $n, 'type' => $t]) {
    // safe — typed properties always present on constructed Extension objects
}
```

## Design Decisions

### Pure Value Object (No Mutators)

The class has no setter methods and is declared `readonly`. This means:
- It can be safely passed across modules without fear of mutation.
- It cannot implement ArrayAccess or implement any mutable interfaces.
- All mutations must happen through the parser's construction — consumers that need to modify an extension's data should create a new Extension instead (e.g., with modified `depends`).

### Public Properties Over Getters

All eight fields are declared inline as public properties in the constructor parameter list (`public string $file`, etc.). This is a PHP 8.4 feature (named constructor arguments / PTPs) that eliminates boilerplate:
- No need for separate `$this->file = $file;` assignments in the constructor body.
- Property access is as cheap as direct field reads.
- Serialization/unserialization behavior matches standard public property layouts via `__serialize()`.

### `$depends` Is the Only Optional Parameter

All seven other properties are required parameters (no defaults). `$depends` alone has a default of `[]` to maintain backward-compatibility with any existing callsites that may pass fewer than the full parameter set. This is the only way to keep the PHP 8.4 invariant of "required params before optional params" while still allowing callers who know they don't have deps to omit it:

```php
// Both work because $depends = [] is rightmost:
new Extension($file, ...);                          // 7 args
new Extension($file, ..., [], 'hook.layout.footer'); // 8 args with explicit empty depends
```

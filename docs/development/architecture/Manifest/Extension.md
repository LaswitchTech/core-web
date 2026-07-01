# Manifest\Extension

## Purpose

`Manifest\Extension` is an immutable value object representing a single parsed extension manifest. It carries all metadata extracted from the source `manifest.json`, including type, name, version, hooks, layouts, dependencies, directory path, kernel compatibility constraint, and discovery origin label. Created exclusively by `Manifest\Parser::validate()`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Manifest;

final readonly class Extension {
    // PHP 8.2+: readonly class — all properties implicitly immutable after construction
    public function __construct(
        string $file,       // required
        string $type,       // required — validated by parser
        string $name,       // required — trimmed by parser
        int|string $version,   // required — normalized by parser
        array  $hooks,      // required — defaults to [] inside parser, but passed explicitly here
        array  $layouts,    // required — same
        string $directory,  // required — dirname of the manifest file
        array  $depends = [],            // optional
        ?string $kernelCompat = null,   // optional — kernel compatibility constraint
        string $origin = 'framework',   // optional — discovery origin label
    ) {
}
```

- **`final readonly class`** in PHP 8.2+ semantics — all properties are implicitly `readonly`, so nothing is writable after construction. This is a pure value object with no mutator methods.
- The constructor body is empty; type constraints flow from PHP's parameter-typed properties (PTPs) and the parser's pre-validation.

## Constructor Parameter Order

Parameters are ordered to satisfy PHP 8.0+ rules: **all required parameters must precede optional ones**. Three parameters have defaults: `$depends` (`[]`), `$kernelCompat` (`null`), and `$origin` (`'framework'`).

```php
public function __construct(
    string $file,           // required — never null
    string $type,           // required — validated by parser
    string $name,           // required — trimmed by parser
    string $version,        // required — normalized by parser
    array  $hooks,          // required — defaults to [] inside parser, but passed explicitly here
    array  $layouts,        // required — same
    string $directory,      // required — dirname of the manifest file
    array  $depends = [],   // optional — extension name-slug dependencies
    ?string $kernelCompat = null,  // optional — kernel compatibility constraint
    string $origin = 'framework', // optional — discovery origin label ('app' | 'framework')
)
```

All parameters are public properties declared inline (`phpdoc` + type). No `$this->` assignment body exists.

## Properties

| Property        | Type           | Source / Notes                                          |
|---------------|----------------|----------------------------------------------------------|
| `$file`       | `string`       | Absolute path to the parsed `manifest.json`.             |
| `$type`       | `string`       | Lowercased `'theme'` or `'plugin'`, enforced by parser. |
| `$name`       | `string`       | Trimmed display name from JSON.                          |
| `$version`    | `string`       | Stripped SemVer (e.g. `1.2.3`). Normalized by parser.   |
| `$hooks`      | `list<string>` | Dotted namespaces and/or `Class::method` strings.        |
| `$layouts`    | `list<string>` | Layout identifiers provided by this extension.           |
| `$directory`  | `string`       | Absolute directory of the manifest file (realpath'd).   |
| `$depends`    | `list<string>` | Name-slugs of required extensions. Defaults to `[]`.     |
| `$kernelCompat` | `?string`    | Kernel compatibility constraint from manifest (`null` if absent). Stored as-is; not enforced in V1.0. |
| `$origin`     | `string`       | Discovery origin label — `'app'` or `'framework'`. Defaults to `'framework'`.  |
| `$psr4Mappings` | `list<array{prefix: string, directory: string}>` | PSR-4 namespace mappings declared by manifest `autoload.psr-4`. Defaults to `[]`. |

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
    kernelCompat: $kernelCompat,    // manifest field or null
    origin:    $origin,             // 'app' | 'framework'
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

All eight fields are declared inline as public properties in the constructor parameter list (`public string $file`, etc.). This is a PHP 8.0 feature (named constructor arguments / PTPs) that eliminates boilerplate:
- No need for separate `$this->file = $file;` assignments in the constructor body.
- Property access is as cheap as direct field reads.
- Serialization/unserialization behavior matches standard public property layouts via `__serialize()`.

### Optional Parameters

Three parameters have defaults, all positioned rightmost to satisfy PHP's "required before optional" rule:

| Parameter | Default | Notes |
|---|---|---|
| `$depends` | `[]` | Extension name-slug dependencies |
| `$kernelCompat` | `null` | Kernel compatibility constraint (optional manifest field) |
| `$origin` | `'framework'` | Discovery origin label — `'app'` or `'framework'` |

All eight remaining properties are required parameters (no defaults). The three optional parameters can be omitted in any combination because they sit at the end of the parameter list:

```php
// Minimal — only required params:
new Extension($file, $type, $name, $version, $hooks, $layouts, $directory);

// Include depends only:
new Extension($file, $type, $name, $version, $hooks, $layouts, $directory, [], ...);

// Include all optional:
new Extension($file, $type, $name, $version, $hooks, $layouts, $directory, ['dep'], '^1.0', 'app');
```

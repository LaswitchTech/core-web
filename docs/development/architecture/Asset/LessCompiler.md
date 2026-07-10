# Asset\LessCompiler

## Purpose

Compile `.less` entries from the Asset Registry into a single, prioritized CSS string using `Less_Parser`. Supports file-content-based cache keys with best-effort atomic writes and full bypass on debug mode. Sorting is deterministic: priority → order → name (provider rank is **not** used for compilation order).

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final class LessCompiler { ... }
```

- **`final`** — no subclassing expected.
- LessCompiler does **not** read Config. Bootstrap resolves `renderer.less.cache_dir` and passes the result to `LessCompiler::__construct()` as `$cacheDir`. The constructor itself falls back to `sys_get_temp_dir()` when the supplied cacheDir is empty or whitespace-only; no other default or fallback logic lives in this class.

## Constructor

```php
public function __construct(string $appRoot, string $cacheDir)
```

| Parameter | Behavior |
|-----------|----------|
| `$appRoot` | Trimmed trailing slashes. Used to prepend base directory to `Less_Parser::parseFile()` calls for relative asset resolution within the Less compiler engine. |
| `$cacheDir` | Base cache directory path. If empty after trim, falls back to `sys_get_temp_dir()`. Created on demand (best-effort, does not throw) during cache writes. |

## Public API

### `compile(Registry $registry, bool $debug = false): string`

Collect `.less` entries from the registry, sort them deterministically by `(priority ↑, order ↑, name ↑)`, and compile into a single CSS output string.

Compilation pipeline:

1. **Filter** — call `$registry->allCss()`. For each entry:
   - Path must not be shorter than 5 characters (`strlen < 5` → skip: `.less` is 5 chars).
   - Path must end with `.less` (case-insensitive: `strtolower(substr($entry->path, -5)) !== '.less'`).
   - File must **exist** and be **readable** (`is_readable()` check; silently skipped on failure).
   - `file_get_contents()` on the path must succeed. If it returns `false`, skip.

2. **Build sort array** — collect matching entries into a flat list:

```php
$lessFiles[] = [
    'priority' => $entry->priority,
    'order'    => $entry->order,
    'name'     => $entry->name,
    'path'     => $entry->path,
    'mtime'    => filemtime($entry->path),
    'size'     => filesize($entry->path),
    'contents' => $src,       // Actual source content loaded into memory.
];
```

3. **Sort** — ascending by priority, then order, then name (alphabetical string comparison):

```php
usort($lessFiles, static fn(array $a, array $b) => ($a['priority'] !== $b['priority']) ? $a['priority'] <=> $b['priority'] : ($a['order'] !== $b['order']) ? $a['order'] <=> $b['order'] : $a['name'] <=> $b['name']);
```

**Important**: Provider rank is **never used in this sort**. Provider rank only affects conflict resolution at registration time (which entry wins when two providers claim the same `(type, name)` slot). Once an entry survives into the registry, it compiles by priority → order → name regardless of its provider.

4. **Early return** — if `$lessFiles` is empty after filtering, return `''` immediately (no parsing overhead).

5. **Cache key** — in non-debug mode, build a deterministic hash from each file's path + mtime + size + SHA-256 of contents:

```php
$payload = json_encode(array_map(function($e) {
    return ['path' => $e['path'], 'mtime' => $e['mtime'], 'size' => $e['size'], 'hash' => hash('sha256', $e['contents'])];
}, $lessFiles), JSON_THROW_ON_ERROR);
$cacheKey = 'json:' . hash('sha256', $payload);
```

JSON fallback: if `json_encode` throws `\JsonException`, a deterministic string payload of `"path:mtime:size:hash"` per file is used instead.

6. **Cache hit** — if `{cacheDir}/{cacheKey}.css` exists and is readable, return its contents immediately (no Less compilation).

7. **Compile via Less_Parser** — instantiate `Less_Parser()`, set base directory to `"$appRoot/"`, call `$parser->parseFile($entry['path'], $baseDir)` for each sorted entry (the order defined above), then retrieve compiled CSS with `$parser->getCSS()`.

8. **Cache write** — if `$debug` is `false`, write the compiled CSS through `writeCache()` (best-effort, no throw). Return the CSS string regardless of cache write success/failure. If `$debug` is `true`, skip cache writing entirely.

9. **Debug mode** — when `$debug` is `true`, skip steps 5 and 6 entirely (never read cache), always recompile, do not calculate a cache path for writing, and do not call `writeCache()`. Effectively: every `/css` request recompiles the full pipeline from source with no intermediate cache file.

### Cache Key Details

The cache key is derived from **paths + modification times + file sizes + content hash** for each LESS entry. This means:
- Changing any entry's **source content** → new hash → miss (recompile).
- Touching an entry's `mtime` only → new mtime changes the input to the top-level SHA-256 → miss (recompile).
- Adding a new entry or removing one → different set of files in the JSON payload → miss.

### Cache Write Behavior (`writeCache()`)

Cache writes use **best-effort temp file + atomic rename**:

1. Ensure `$cacheDir` exists via `@mkdir($dir, 0755, true)`. If it fails and still isn't a directory, bail silently.
2. Build a collision-resistant temporary path: `{cacheDir}/{basename}.tmp.{pid}.{random_hex}` where random bytes come from `bin2hex(random_bytes(8))` (16 hex chars).
3. Write content to the temp file via `@file_put_contents($tmpPath, $content)`. On failure, `@unlink($tmpPath)` and return.
4. Atomically rename: `@rename($tmpPath, $path)`. On failure, `@unlink($tmpPath)` and return.
5. **No exceptions** — any failure at any step silently skips the cache write. CSS output is never blocked by a failed cache write.

## Compile Order (Default Source Tier Sequence)

When default priorities are used (`kernel=100`, `app=200`, theme recommended `300`, plugin recommended `400`), compilation order follows priority ascending:

```
┌─────────┐ 100  ┌──────────┐ 200  ┌────────┐ 300  ┌──────────┐ 400
│ kernel │─────▶│ app     │─────▶│ theme  │─────▶│ plugin   │
│styles.less│    │styles.less │    │.less    │    │ .less     │
└─────────┘      └──────────┘       └────────┘        └──────────┘
    Compiles       Compiles       Compiles         Compiles
    first          second         third            fourth (CSS wins)
```

The lowest-priority source compiles first. Higher-priority CSS rules cascade later, effectively overriding earlier rule selectors via normal CSS specificity and declaration order semantics. The framework does **not** merge or deduplicate identical selectors across files; it relies on standard CSS cascade for conflict resolution at the browser level.

## Design Decisions

### 1. Content-Based Caching Over Magic Comments

The cache key is derived from actual source content (SHA-256 hash), not just path + mtime. This ensures that if someone modifies a less file in place without changing mtime (e.g., via `touch` to set mtime but no content change, or through tools that preserve both), the output would be consistent with the source content regardless of how it got there. The hash is part of the cache key payload — any content change invalidates cached CSS.

### 2. Provider Rank Is Deliberately Omitted from Compile Sort

Provider rank (`app=0, theme=1, plugin=2, core=3`) was considered for use as a secondary sort key but was excluded because:
- **Priority already defines precedence tiers.** Kernel (100), app (200), theme (300), plugin (400) create the desired compilation order explicitly. Provider rank would add an invisible, opaque layer that could surprise developers debugging source ordering.
- **Determinism requirement.** Using `$order` (monotonic counter) as the tiebreaker between same-priority entries guarantees strict total ordering without requiring cross-entry provider comparisons.
- **Documentation clarity.** When a developer sees priority 300 for theme and 400 for plugin, they can see directly in their code what order things will compile — no lookup needed to understand the precedence chain.

### 3. `parseFile()` Exceptions Propagate

`Less_Parser::parseFile()` is **not** wrapped in try/catch inside `compile()`. If a file fails to parse (syntax error, missing import, invalid Less), the exception propagates unhandled and stops compilation for that request. Parse errors are **not** silently skipped or recovered.

### 4. Cache Write Is Non-Critical

Cache writes never throw and never interrupt normal output. Failed cache writes result in the next request recompiling from source without any awareness from the caller. This is intentional: the caching layer is an optimization, not a requirement for correct operation.

## Current Behavior Notes / Limitations

### 1. Only `.less` Files Are Compiled

Files registered as CSS entries but with non-`.less` suffixes (e.g., `.css`, `.scss`) are silently skipped by the path suffx check. There is no Sass compilation or raw CSS injection support in the current pipeline — only Less files pass through `Less_Parser::parseFile()`.

### 2. Base Directory Scope Is Limited

The `$baseDir = "{$this->appRoot}/"` passed to `Less_Parser::parseFile()` controls how Less resolves relative imports (via `@import` directives within .less files). Asset paths are absolute, but any relative `@import` inside a Less file will resolve against the app root base directory. Assets outside the app root that use relative imports may fail to resolve if their `@import` references point outside the baseDir scope.

### 3. File Contents Held in Memory

The entire contents of every matching `.less` entry are loaded into memory for both hashing and compilation. For large projects with many tens of megabytes of Less source, this can increase per-request RSS significantly. This behavior was explicitly chosen in `compile()` to support content-based cache keys (the hash is computed from the actual file bytes).

### 4. Cache Directory May Not Be Created

`LessCompiler::writeCache()` creates the cache directory via best-effort `@mkdir(...)` — if the directory cannot be created (permissions, race conditions, filesystem limits), the write silently falls through without writing to disk. On the next request it will try again. There is no mechanism to detect and report that caching is unavailable.

# Asset\LessCompiler

## Purpose

`LessCompiler` collects all registered readable `.less` CSS entries from the `AssetRegistry`, compiles them in deterministic priority order through `Less_Parser`, and produces one aggregated CSS string. The compiled output is served to the browser as a single stylesheet via:

```
/css
```

The class does **not** compile normal `.css` entries; it only processes source files ending in `.less`.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Asset;

final class LessCompiler { ... }
```

- **`final`** — no subclassing expected.
- `LessCompiler` does **not** read Config internally. Bootstrap resolves `renderer.less.cache_dir` and passes the result to `LessCompiler::__construct()` as `$cacheDir`. The constructor falls back to `sys_get_temp_dir()` when the supplied `$cacheDir` is empty or whitespace-only.

## Constructor

```php
public function __construct(string $appRoot, string $cacheDir)
```

| Parameter | Behavior |
|-----------|----------|
| `$appRoot` | Trailing slashes are stripped (`rtrim`). Used to set the Less engine's base directory so relative `@import` paths inside `.less` files resolve correctly. Always suffixed with `/` when passed to `Less_Parser::setBaseDir()`. |
| `$cacheDir` | Trailing slashes are stripped. If empty/whitespace-only, falls back to `sys_get_temp_dir()`. The directory itself is created lazily on demand (best-effort) during cache writes and never throws on creation failure. |

## Input Filtering

The compiler's first stage reads all registered CSS entries from `Registry::allCss()`, producing a filtered list of compilable `.less` sources:

1. **Read entry set** — `$registry->allCss()` returns every registered CSS AssetEntry regardless of provider.
2. **Accept only `.less` paths (case-insensitive)** — each entry's physical path must end with `.less`:
   ```php
   strtolower(substr($entry->path, -5)) === '.less'
   ```
   Entries ending in `.css`, `.scss`, or any other extension are silently ignored. The length check (`strlen($entry->path) < 5`) is an internal guard that cannot reach a true `.less` file (five characters minimum).
3. **Verify the file exists** — `is_readable($entry->path)` must be `true`. Existing but non-readable files are skipped.
4. **Verify contents can be read** — `file_get_contents($entry->path)` must return a non-false value. Files whose contents cannot be read are silently dropped (e.g., permission denied mid-read).

Entries that fail any of these checks are excluded; they do not appear in the compilation pool and produce no error or warning.

## Compilation Order

Compilation uses the following deterministic ascending sort on every registered `.less` entry:

```
priority → order → scope → file
```

- **`priority` (ascending)** — lower numeric priority is compiled first. CSS output from earlier-priority files appears first in the combined result and can be overridden by later priorities via standard CSS cascade rules. Provider rank (core / app / theme / plugin) is deliberatly **not** used for compile ordering.
- **`order` (ascending)** — equal priorities are broken by `Entry::$order`, which reflects registration order across calls to `$registry->css(...)` or `$registry->js(...)`. This preserves stable within-priority sequencing.
- **`scope` (alphabetical, ascending)** — when both priority and order match, the entry's scope string is compared (`'app' < 'kernel' < 'plugins/evenement' < 'themes/mintyfresh'`).
- **`file` (alphabetical, ascending)** — when priority, order, and scope all match, the filename leaf provides the final tie-breaker.

### Example Sort Trace

| Priority | Order | Scope            | File     | Compiled Before |
|----------|-------|------------------|----------|----------------|
| 100      | 42    | `kernel`         | `style.less` | kernel (first)     |
| 100      | 42    | `app`            | `style.less` | app                |
| 200      | 7     | `app`            | `override.less` | app (second)    |
| 300      | 1     | `themes/minty`   | `skin.less`   | theme           |

In the example above, kernel and app both have priority 100; their `order` values differ, so `order` breaks the tie before any scope comparison is needed. Only when all four fields match does alphabetical `scope` then `file` apply.

## Aggregation

LESS source files from **any combination of these scopes** may be compiled together into a single stylesheet:

```
kernel
app
themes/{extension}
plugins/{extension}
```

The compile pipeline always produces **one aggregated CSS response** per `/css` request — it does not emit separate responses. All matching `.less` entries are merged by `Less_Parser::parseFile()` in order, and the final output is `$parser->getCSS()`.

## HTML Rendering Behavior

The Asset helper (`Assets` view helper used inside layouts/views) handles `<link>` tag emission for both `.less` and `.css` entries:

1. **Detects LESS vs CSS from physical path** — each `AssetEntry->path` is checked with `strtolower(..., -5) === '.less'`. No class property distinguishes the type; the extension is the sole signal.
2. **Suppresses individual LESS `<link>` tags** — an entry ending in `.less` never gets its own `<link rel="stylesheet" ...>` rendered.
3. **Emits exactly one global stylesheet link**:
   ```html
   <link rel="stylesheet" href="/css">
   ```
   This single URL triggers the framework's `/css` route handler which compiles all registered `.less` entries at request time.
4. **Continues emitting normal `.css` entries** — each standard CSS asset gets its own rendered `<link>` tag, typically served through scoped canonical URLs (e.g., `/css/app`, `/js/plugin-name`).
5. **The `/css` link is emitted before regular CSS links** so that any remaining uncompiled or non-LESS CSS cascades after the full compilation output.

## Cache Behavior

### Cache Key Composition

In non-debug mode, the cache key per file includes exactly:

```text
path
mtime
size
SHA-256 content hash
```

All four attributes appear inside a JSON-encoded array per entry:

```json
{"path":"...","mtime":1721084800,"size":2048,"hash":"e3b0c44..."}
```

The top-level cache key is `json:` concatenated with the SHA-256 of that JSON payload. If JSON encoding throws `\JsonException`, a fallback key format of `"fallback:path:mtime:size:hash"` (semicolon-delimited) is used instead.

### Cache Semantics

| Mode | Behavior |
|------|----------|
| **Debug** (`$debug = true`) | Full compilation runs on every request. No cache read, no hash computation beyond what `Less_Parser` needs internally. Write path is never constructed. |
| **Non-debug** (`$debug = false`) | Cache key is computed for the full set of `.less` files. If `{cacheDir}/{cacheKey}.css` exists and is readable, its contents are returned immediately — no compilation or `Less_Parser` instantiation. |

### Cache Writes

- Written via temporary file + rename:
  ```
  {cacheDir}/{basename}.tmp.{pid}.{random_hex} → {cacheDir}/{cacheKey}.css
  ```
  Random bytes come from `bin2hex(random_bytes(8))` (16 hex characters). The directory itself is created on-demand via `@mkdir($dir, 0755, true)`.
- On write or rename failure: the `.tmp` file is unlinked and `writeCache()` returns silently. **No exception is thrown.**
- Cache-write failures do not prevent returning compiled CSS to the caller — the CSS string is always returned regardless of cache write success or failure.

## Empty Result

When zero readable registered LESS files exist after filtering, the pipeline short-circuits at step 4:

```php
if ($lessFiles === []) { return ''; }
```

The method returns an empty string (`''`) immediately — no `Less_Parser` is instantiated, no cache is consulted, and the `/css` response body will be blank.

---

## Design Decisions

### Provider Rank Is Not Used for Compile Sort (`LessCompiler`)

Provider rank (`core > app > plugin > theme`) affects **which entry wins during registration** when two providers register the same scope+file identity (i.e., which entry survives into the registry), but it plays no role in compile ordering. Once an entry is in the registry, compilation order is determined entirely by `(priority, order, scope, file)` regardless of provider.

This avoids confusing behavior where a low-priority core asset could sort ahead of a high-priority theme asset simply because providers have different rank values. The priority tier (100/200/300/400) and the monotonically increasing `order` counter together define clear, predictable precedence that developers can reason about at registration time.

### Only `.less` Files Are Compiled by This Class

`LessCompiler` does not emit normal CSS entries — those are emitted directly by the Assets helper via individual `<link>` tags scoped to the physical file's canonical URL (e.g., `/css/app`, `/js/plugin-name`). The compiler processes zero entries when all registered CSS files end in `.css`.

### Cache Directory May Not Be Created

`writeCache()` uses best-effort `@mkdir(...)` on first write attempt. If it fails (permissions, filesystem exhaustion, race conditions), the method silently returns without writing any cache file. The next request attempts the same path again. There is no mechanism to detect or report that caching is unavailable.

---
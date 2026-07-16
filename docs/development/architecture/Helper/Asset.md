# Asset\Helper — url() canonical paths & tag emission

## Purpose

The `Asset` helper bridges a `Registry` store and the HTTP browser. It normalises raw filesystem paths into clean URL routes (`path()`), derives **canonical URLs** from an `Entry`'s `(type, scope, file)` identity (`url()`), and emits HTML tags (`css()`, `js()`) in deterministic order.

## Class Definition

```php
namespace Laswitchtech\CoreWeb\Helper;

final class Asset implements HelperInterface { }
```

- **`final`** — helper is stateless; no subclassing expected.
- **Stateless** — each public method accepts a Container or Entry as a parameter and returns immediately. No instance variables are mutated.
- **Container key** — resolved via `$container->resolve('asset_registry')` inside `css()` / `js()`.

## URL Generation (public `url(Entry): string`)

Given an `Entry $entry`, returns a normalised, publicly-servable URL. Invalid types or empty filenames produce `''`.

### Canonical URL Table

| Entry identity                                | Canonical URL                              |
| --------------------------------------------- | ------------------------------------------ |
| `css + kernel + styles.less`                  | `/css/kernel`                              |
| `js + kernel + kernel.js`                     | `/js/kernel`                               |
| `css + app + styles.css`                      | `/css/app`                                 |
| `js + app + app.js`                           | `/js/app`                                  |
| `css + themes/hello-theme + theme.css`        | `/css/themes/hello-theme/theme.css`        |
| `js + plugins/datatables + datatables.min.js` | `/js/plugins/datatables/datatables.min.js` |

**Root scopes** (`kernel`, `app`) produce two-segment URLs: `/{type}/{scope}` (filename is stripped). All other scopes produce three-segment paths: `/{type}/{scope}/{file}`.

### Extension Default Aliases

Extension scopes (`themes/{extension}`, `plugins/{extension}`) may be registered with an **explicit default alias**:

```text
/{type}/themes/{extension}
/{type}/plugins/{extension}
```

An entry marks itself as a default by including:

```php
['default' => true]
```

Aliases resolve only when **exactly one** entry in that type + scope has `['default' => true]`. Three possible outcomes:

| Outcomes | Result |
|----------|--------|
| Exactly one explicit default | Alias URL resolves (e.g., `/css/themes/hello-theme`) |
| Zero explicit defaults | Alias returns 404 — the caller must fall back to `/{type}/{scope}/{file}` for every entry |
| Multiple explicit defaults | Alias returns 404 — the caller must fall back to `/{type}/{scope}/{file}` for every entry |

The marker lives in each `Entry`'s `$metadata['default']`. The helper does **not** decide which entry is a default itself; it calls `$registry->getDefault()`, and if that returns `null` (zero or multiple defaults), the caller uses the standard canonical path per entry.

### Guard rails in `url()`

- Only `Entry::TYPE_CSS` (`'css'`) and `Entry::TYPE_JS` (`'js') are accepted; any other type yields `''`.
- `$scope === 'kernel' || $scope === 'app'` → two-segment canonical: `/type/scope`.
- Empty `$entry->file` (after trim) → `''` (the route has nothing to serve).

## CSS Rendering — `<link>` tags (`css(Container): string`)

### 5a. LESS rendering — individual links suppressed, single `/css` link emitted

Code (lines 64-102):

```php
$registry = $container->resolve('asset_registry');

foreach ($registry->orderedCss() as $entry) {
    $isLess = str_ends_with(rtrim(strtolower($entry->path), '/\\'), '.less');
    if ($isLess) {
        $hasLess = true;   // mark that at least one LESS source exists
        continue;           // **suppress** this <link> entirely
    }
    $url = $this->url($entry);  // canonical <link> for the remaining entry
    if ($url !== '') {
        $regularCss[] = "<link rel=\"stylesheet\" href=\"{$url}\">";
    }
}

if ($hasLess) {
    return '<link rel="stylesheet" href="/css">' . "\n" . implode("\n", $regularCss);
}
```

Behaviour:

| Condition | <link> emitted |
|-----------|--------------|
| at least one LESS entry exists in `orderedCss()` | one `<link … href="/css">` **plus** `<link>` tags for each non-LESS CSS asset |
| every CSS entry is LESS | only the single `/css` link (no additional tags) |
| no LESS entries found | regular canonical `<link>` tags per registered file |

The compiled-less link (/css) appears **before** any regular <link> tags. Individual LESS source links are **not emitted** at all — their content is folded into the single compilation endpoint.

### 5b. Regular (non-LESS) files retain canonical URLs

Every CSS entry whose path does **not** end in `.less` receives its normal canonical URL (`{type}/{scope}[/{file}]`) as a standalone `<link>` tag. These are simply appended after the compiled /css link (when applicable).

## JavaScript Rendering — `<script>` tags (`js(Container): string`)

### 6. Tags preserve registry order

Code (lines 107-128):

```php
$registry = $container->resolve('asset_registry');
foreach ($registry->orderedJs() as $entry) {
    $url = $this->url($entry);
    if ($url !== '') {
        $js[] = '<script src="' . $url . '"></script>';
    }
}
return implode("\n", $js);
```

- Iterates `$registry->orderedJs()` (sorted by the registry's `priority ↑ → order ↑ → scope ↑ → file ↑` rules).
- Each JS entry produces a `<script src="…">` tag whose href depends on the entry's scope: two-segment (`/{type}/{scope}`) for kernel/app, three-segment (`/{type}/themes/…` or `/{type}/plugins/…`) for extensions.
- **No suppression**: unlike CSS/LESS handling, all JS entries produce tags — there is no "compile-all-first" shortcut in the helper. The browser loads scripts in the order they appear in the output, matching the deterministic registry sort.

## Method Summary

| Method | Signature | Returns |
|--------|-----------|---------|
| `name()` | `(): string` | `'asset'` |
| `path()` | `(string $path): string` | Normalised path with exactly one leading `/`. Empty input → `'/'`. |
| `url()` | `(Entry $entry): string` | Canonical URL per the rules in sections 1–4. `''` on invalid type or empty file. |
| `css()` | `(Container $container): string` | Comma-delimited CSS `<link>` tags, with LESS suppression + `/css` single-link where applicable. |
| `js()` | `(Container $container): string` | Newlined `<script src="…">` tags in deterministic registry order. |

## Legacy flat URLs

The legacy two-segment URL form (`/{type}/$name` where `$name` is a freeform asset name) **does not exist** in the current codebase. All public URLs use the three-part tuple model:

- Root scopes: `/{type}/{scope}` (kernel / app — no filename).
- Extension scopes: `/{type}/{scope}/{file}` (three-segment canonical paths with full scope + leaf filename).

No documentation, URL rule, or helper method references a flat-name segment anywhere. The old `/foo/styles` form is obsolete and absent from every method in `src/Helper/Asset.php`.

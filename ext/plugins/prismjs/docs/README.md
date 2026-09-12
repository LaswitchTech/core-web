# PrismJS Plugin

First-party PrismJS 1.30 syntax-highlighting runtime and common language
grammars.

## What It Provides

Registers the Prism core, its default theme CSS, and grammar files for
common languages. No assets are marked default — you include only what
you need.

## Assets

| File | Type | Priority | Purpose |
|------|------|----------|---------|
| `prism.css` | CSS | 300 | Default Prism theme (okaidia) |
| `prism.js` | JavaScript | 310 | Prism core runtime |
| `prism-markup.min.js` | JavaScript | 320 | HTML/XML grammar |
| `prism-css.min.js` | JavaScript | 330 | CSS grammar |
| `prism-clike.min.js` | JavaScript | 340 | C-like base grammar |
| `prism-javascript.min.js` | JavaScript | 350 | JavaScript grammar |
| `prism-php.min.js` | JavaScript | 360 | PHP grammar |
| `prism-json.min.js` | JavaScript | 370 | JSON grammar |
| `prism-bash.min.js` | JavaScript | 380 | Bash/Shell grammar |
| `prism-sql.min.js` | JavaScript | 390 | SQL grammar |
| `prism-python.min.js` | JavaScript | 400 | Python grammar |

All assets use scope `plugins/prismjs`. The ascending priorities ensure
the core loads before its grammars.

## Usage

Include the assets you need:

```php
$assets->include('plugins/prismjs/prism.css');
$assets->include('plugins/prismjs/prism.js');
$assets->include('plugins/prismjs/prism-markup.min.js');
$assets->include('plugins/prismjs/prism-php.min.js');
```

Wrap code in `<pre><code>` blocks with the appropriate language class:

```html
<pre><code class="language-php">
echo "Hello, World!";
</code></pre>

<pre><code class="language-javascript">
console.log("Hello");
</code></pre>

<pre><code class="language-sql">
SELECT * FROM users WHERE active = 1;
</code></pre>
```

Prism auto-highlights on page load. For dynamic content, call:

```js
Prism.highlightAllUnder(document.getElementById('container'));
```

### Language Class Reference

| Language | Class |
|----------|-------|
| HTML/XML | `language-markup` |
| CSS | `language-css` |
| JavaScript | `language-javascript` |
| PHP | `language-php` |
| JSON | `language-json` |
| Bash | `language-bash` |
| SQL | `language-sql` |
| Python | `language-python` |

## Dependencies

None.

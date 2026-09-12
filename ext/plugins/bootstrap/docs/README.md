# Bootstrap Plugin

First-party Bootstrap 5.3.3 CSS framework and Bootstrap Icons assets.

## What It Provides

Registers Bootstrap CSS, the Bootstrap JS bundle (Popper included), and
the Bootstrap Icons CSS as default assets. Also registers routes for
serving the icon font files.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `bootstrap.min.css` | CSS | `plugins/bootstrap` | Yes |
| `bootstrap.bundle.min.js` | JavaScript | `plugins/bootstrap` | Yes |
| `bootstrap-icons.min.css` | CSS | `plugins/bootstrap` | No |

## Font Routes

The icon font files are served via dedicated routes (not registered as
assets in the registry):

| Route | Content-Type |
|-------|-------------|
| `/fonts/bootstrap-icons.woff2` | `font/woff2` |
| `/fonts/bootstrap-icons.woff` | `font/woff` |

## Usage

Bootstrap CSS and the JS bundle are included automatically on every page.
Use Bootstrap classes directly in your views:

```html
<div class="container">
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Hello</h5>
        </div>
    </div>
</div>
```

To use Bootstrap Icons, include the icon CSS explicitly:

```php
$assets->include('plugins/bootstrap/bootstrap-icons.min.css');
```

Then use icon classes in your markup:

```html
<i class="bi bi-gear"></i>
<i class="bi bi-envelope-fill"></i>
```

The icon fonts are served at `/fonts/bootstrap-icons.woff2` and
`/fonts/bootstrap-icons.woff`.

## JavaScript Components

The bundle includes Popper.js. Bootstrap JS components (modals,
dropdowns, tooltips) are available via `bootstrap` on the window:

```js
const modal = new bootstrap.Modal(document.getElementById('myModal'));
modal.show();
```

## Dependencies

- `jquery` (listed in manifest, though Bootstrap 5 itself does not require jQuery)

# jQuery Plugin

First-party jQuery 3.x assets for Core-Web.

## What It Provides

Registers the minified jQuery 3.x runtime as a default asset so it is
automatically included in every rendered page.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `jquery.min.js` | JavaScript | `plugins/jquery` | Yes |

## Usage

Because the asset is marked `default`, it is included in every page
automatically. In your views and JavaScript you can use `$` directly:

```html
<script>
$(function() {
    $('.my-element').on('click', function() {
        // ...
    });
});
</script>
```

If you need to explicitly reference the asset in a layout or template:

```php
$assets->include('plugins/jquery/jquery.min.js');
```

## Dependencies

None. This is a base dependency for several other plugins (Bootstrap,
DataTables, Select2, TimeagoJS, Chart.js).

# Select2 Plugin

First-party Select2 4.x assets with Bootstrap 5 theme integration.

## What It Provides

Registers Select2 core CSS/JS and the Bootstrap 5 theme CSS.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `select2.min.css` | CSS | `plugins/select2` | Yes |
| `select2.min.js` | JavaScript | `plugins/select2` | Yes |
| `select2-bootstrap-5-theme.min.css` | CSS | `plugins/select2` | No |

## Usage

The core CSS and JS are included automatically. To get proper Bootstrap 5
styling, also include the theme:

```php
$assets->include('plugins/select2/select2-bootstrap-5-theme.min.css');
```

Initialize on a `<select>` element:

```html
<select id="mySelect" class="form-select">
    <option value="1">Option One</option>
    <option value="2">Option Two</option>
    <option value="3">Option Three</option>
</select>

<script>
$(function() {
    $('#mySelect').select2({
        theme: 'bootstrap-5',
        placeholder: 'Select an option...',
        allowClear: true
    });
});
</script>
```

### AJAX Data Source

```js
$('#mySelect').select2({
    theme: 'bootstrap-5',
    ajax: {
        url: '/api/options',
        dataType: 'json',
        delay: 250,
        data: function (params) {
            return { q: params.term };
        },
        processResults: function (data) {
            return { results: data };
        }
    }
});
```

### Multiple Selection

```html
<select id="multiSelect" class="form-select" multiple>
    <option value="1">Red</option>
    <option value="2">Green</option>
    <option value="3">Blue</option>
</select>

<script>
$(function() {
    $('#multiSelect').select2({ theme: 'bootstrap-5' });
});
</script>
```

## Dependencies

- `jquery`
- `bootstrap`

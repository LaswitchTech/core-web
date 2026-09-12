# TimeagoJS Plugin

First-party jQuery Timeago 1.x relative-time formatting assets.

## What It Provides

Registers the jQuery Timeago plugin as a default asset.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `timeago.min.js` | JavaScript | `plugins/timeagojs` | Yes |

## Usage

jQuery Timeago is included automatically. Apply it to any element
containing a date (in any format jQuery/PHP can produce):

```html
<time datetime="2025-01-15T10:30:00Z">2025-01-15 10:30:00</time>

<script>
$(function() {
    $('time').timeago();
});
</script>
```

The element text is replaced with a relative string like
"2 months ago" and updates automatically every minute.

### In Core-Web Views

The typical pattern is to output an ISO 8601 timestamp from PHP and
let TimeagoJS format it client-side:

```php
// In your view
echo '<time datetime="' . e($post->created_at) . '">' . e($post->created_at) . '</time>';
```

```js
// In your layout or page script
$(function() {
    $('time[datetime]').timeago();
});
```

### Custom Format

```js
$('time').timeago({
    prefix: 'Posted ',
    suffix: ' ago'
});
```

### Refresh Interval

By default, TimeagoJS refreshes every minute. To change:

```js
$.timeago.settings.refreshInterval = 30; // seconds
```

## Dependencies

- `jquery`

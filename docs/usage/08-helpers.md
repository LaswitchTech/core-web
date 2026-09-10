# Helpers

Helpers are small, named utility services. They are available:

- **In views/templates/layouts** — as the `$helpers` variable (always
  injected by the renderer, no registration needed).
- **In PHP** — from the container under the key `helpers`.

## Accessing Helpers

```php
// In a view/template/layout:
<?= $helpers->html->e($name) ?>

// Property access and resolve() are equivalent:
$slug  = $helpers->str->slug('Hello World');
$asset = $helpers->resolve('asset');

// In plain PHP (route handlers, commands, etc.):
$helpers = $container->resolve('helpers');
$url = $helpers->url->to('/users');
```

The bag exposes:

| Method | Purpose |
|--------|---------|
| `$helpers->name` | Property access — resolves the helper (throws if missing). |
| `$helpers->resolve('name')` | Explicit resolution. |
| `$helpers->has('name')` | Check registration. |
| `$helpers->all()` | All helpers keyed by canonical name. |

Helper names are case-insensitive; the canonical form is lowercase.

## Core Helpers

### `url`

| Method | Description |
|--------|-------------|
| `to(string $path = '')` | Build an application URL from a path. |

```php
$helpers->url->to('/users');
```

### `html`

| Method | Description |
|--------|-------------|
| `e(string $value)` | Escape a value for HTML output (alias of `escape`). |
| `escape(string $value)` | HTML-escape. |
| `attrs(array $attributes)` | Render an HTML attribute string from an associative array. |

```php
echo $helpers->html->e($userInput);
echo '<div ' . $helpers->html->attrs(['class' => 'box', 'data-id' => 7]) . '></div>';
```

### `str`

| Method | Description |
|--------|-------------|
| `lower(string $value)` | Lowercase. |
| `upper(string $value)` | Uppercase. |
| `slug(string $value)` | URL-safe slug (`"Hello World"` → `"hello-world"`). |
| `limit(string $value, int $limit, string $suffix = '...')` | Truncate. |

```php
$helpers->str->slug('My First Post');   // "my-first-post"
$helpers->str->limit($excerpt, 80);
```

### `date`

| Method | Description |
|--------|-------------|
| `format(DateTimeInterface\|string\|int $value, string $format = 'Y-m-d H:i:s')` | Format any date-like value. |

```php
$helpers->date->format($post->published_at, 'M j, Y');
```

### `asset`

| Method | Description |
|--------|-------------|
| `css(Container $c)` | All `<link>` tags for registered CSS, in emit order. |
| `js(Container $c)` | All `<script>` tags for registered JS. |
| `url(Entry $entry)` | Canonical URL for a single registered asset. |
| `path(string $path)` | Normalize an asset path to a leading-slash route. |

See [Assets](07-assets.md) for details.

### `config`

| Method | Description |
|--------|-------------|
| `get(string $key, mixed $default = null)` | Dot-notation config read. |
| `has(string $key)` | Check key existence. |
| `all()` | Full merged config array. |

```php
$helpers->config->get('app.name');
```

### `application`

| Method | Description |
|--------|-------------|
| `applicationName()` | Resolved application name. |
| `footer()` | Footer string. |
| `logoPath()` | Path to the application logo. |
| `logo(...)` | Rendered logo markup. |

## Writing a Custom Helper

A helper is any class implementing `HelperInterface`:

```php
<?php declare(strict_types=1);

namespace App\Plugin\Greeting;

use Laswitchtech\CoreWeb\Helper\HelperInterface;

final class GreetingHelper implements HelperInterface
{
    public function name(): string
    {
        return 'greeting';
    }

    public function hello(string $name): string
    {
        return "Hello, {$name}!";
    }
}
```

Register it from the `helper.register` hook (context key: `registry`):

```php
public static function registerHelpers(array $context): void
{
    $context['registry']->register(
        helper:   new GreetingHelper(),
        provider: 'plugin',   // app | plugin | core
        priority: 0,
        metadata: [],
    );
}
```

Add the hook to your manifest:

```json
"hooks": [
    "helper.register::App\\Plugin\\Greeting\\Greeting::registerHelpers"
]
```

Now every view can use it:

```php
<?= $helpers->greeting->hello('World') ?>
```

### Precedence

If several providers register a helper with the same name, resolution
prefers higher `priority`, then provider rank (`app` > `plugin` > `core`),
then the later registration.

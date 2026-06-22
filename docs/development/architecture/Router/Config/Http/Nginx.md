# Nginx Configuration

## Purpose

The Nginx Configuration generator produces a server block snippet with try_files routing and optional PHP-FPM handling for Core-Web deployments on Nginx.

## Responsibilities

_(none)_

## Public API

_(none)_

## Generated Output Examples

### Root deployment (generate(''))

```nginx
    location / {
        # Serve static files, then fall through to index.php.
        try_files $uri $uri/ /index.php$is_args$args;

        # Pass everything else to the PHP-FPM backend.
        include fastcgi_params;
        fastcgi_pass   unix:/run/php-fpm/www.sock;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
```

### Subdirectory deployment (generate('app'))

**NOTE**: Location prefix uses the `{trimmed}` variable. `$path` and `{$trimmed}` in template produce `/app/`:

```nginx
    location /app/ {
        # Serve static files at /{subdir}/path/to/file, then fall through.
        try_files $uri $uri/ /app/index.php$is_args$args;

        # Pass everything else to the PHP-FPM backend.
        include fastcgi_params;
        fastcgi_pass   unix:/run/php-fpm/www.sock;
        fastcgi_param  SCRIPT_FILENAME $document_root/app/index.php;
        fastcgi_param  PATH_INFO          $fastcgi_path_info;
    }

```

## Dependencies

---

## Lifecycle

---

## Future Enhancements

---

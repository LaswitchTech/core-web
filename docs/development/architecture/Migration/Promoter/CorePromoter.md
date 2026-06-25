# CorePromoter.php

## File reference

- **Src path:** `src/Migration/Promoter/CorePromoter.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration\Promoter`
- **Type:** Final class implementing MigrationPromoterInterface
- **Priority:** 0 (highest — first in Runner's execution order)

## Responsibilities

Scans the core framework migration directory (default: `CORE_WEB_ROOT/migrations/`) for `.sql` files. Each file is validated via `Migration::fromFile()`: only files matching the version pattern `YYYYMMDDHHmmss_*.sql` are included; others log to STDERR and are skipped.

## Constructor

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `$directory` | string | required | Absolute path to the core migrations directory |

## Methods

### discover(): list<Migration>

```
if (directory exists):
    glob("{$directory}/*.sql") → sort each file path ascending
    for each file:
        load via Migration::fromFile(file)
        if valid: add to result list
    return sorted migrations (ascending by version prefix from filename)
else:
    return [] (empty, no error)
```

### priority(): int

Always returns `0` — core migrations always execute before application migrations.

### migrationDirectory(): string

Returns the configured `$directory` path.

---

See also: [Architecture](../Architecture.md), [MigrationPromoterInterface](./MigrationPromoterInterface.md).

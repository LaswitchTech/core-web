# AppPromoter.php

## File reference

- **Src path:** `src/Migration/Promoter/AppPromoter.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration\Promoter`
- **Type:** Final class implementing MigrationPromoterInterface
- **Priority:** 1 (after core, before extensions)

## Responsibilities

Scans the *application* migration directory for `.sql` files. This is where developers add their own migrations during app development. Files are validated via `Migration::fromFile()` — only those matching the version pattern are included.

## Constructor

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `$directory` | string | required | Absolute path to the application migrations directory (from Bootstrap, resolved as `$appRoot . '/migrations'`) |

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

Always returns `1` — application migrations execute after core but before any extension migrations.

### migrationDirectory(): string

Returns the configured app `$directory` path.

## Discovery algorithm

Identical to CorePromoter in structure; differs only in:
- Priority value (1 vs 0)
- Directory source (app-level config vs CORE_WEB_ROOT constant)

---

See also: [Architecture](../Architecture.md), [CorePromoter](./CorePromoter.md), [MigrationPromoterInterface](./MigrationPromoterInterface.md).

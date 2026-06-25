# MigrationPromoterInterface.php

## File reference

- **Src path:** `src/Migration/Promoter/MigrationPromoterInterface.php`
- **Namespace:** `Laswitchtech\CoreWeb\Migration\Promoter`
- **Type:** Interface
- **Purpose:** Contract for discovering migration files from any source directory (core, application, extensions).

## Methods

| Method | Return | Description |
|--------|--------|-------------|
| `priority()` | int | Rank number — lower = higher priority. Executed first in Runner's sort order. |
| `migrationDirectory()` | string | Base path this promoter scans for `.sql` migration files. |
| `discover()` | list\<Migration\> | Loads all valid migrations from the directory, sorted version ascending. |

## Implementation note

Both `CorePromoter` (rank 0) and `AppPromoter` (rank 1) validate that promoters are provided in strict ascending priority order; if not, `Runner` throws `InvalidArgumentException`.

---

See also: [Architecture](../Architecture.md), [CorePromoter](./CorePromoter.md), [AppPromoter](./AppPromoter.md).

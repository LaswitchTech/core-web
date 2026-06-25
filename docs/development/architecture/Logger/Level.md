---
title: "Level"
status: "completed"
tags: ["Logger"]
---

# Level

## Overview

The `Level` enum defines log severity levels for the CoreWeb Logger subsystem. Levels are backed by integer values in ascending severity order, which enables filtering entries based on a configured minimum level threshold.

## Available Levels

| Case | Int Value | Description |
|------|-----------|-------------|
| `DEBUG` | 0 | Debugging information (lowest severity). |
| `INFO` | 1 | General operational information. |
| `WARNING` | 2 | Potentially problematic situations. |
| `ERROR` | 3 | Runtime errors requiring attention. |
| `CRITICAL` | 4 | Critical conditions causing failure (highest severity). |

```php
enum Level: int
{
    case DEBUG = 0;
    case INFO = 1;
    case WARNING = 2;
    case ERROR = 3;
    case CRITICAL = 4;
}
```

## Filtering Logic

When a `Logger` is constructed with a `minimumLevel`, the `accepts()` method determines whether a log entry will be written:

- An entry is **accepted** when `entry_level->value >= minimumLevel->value`.
- An entry is **rejected** when `entry_level->value < minimumLevel->value`.

For example, if a Logger is configured with `minimumLevel = Level::WARNING`, entries of level `DEBUG` and `INFO` are silently discarded, while `WARNING`, `ERROR`, and `CRITICAL` entries are written.

## Compatibility

The enum uses **backed int cases** (not typed class constants), ensuring compatibility with PHP 8.2+. No typed class constants (`const string`, etc.) are present in this file.

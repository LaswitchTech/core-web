<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Logger;

/**
 * Log levels in ascending severity order.
 */
enum Level: int
{
    case DEBUG = 0;
    case INFO = 1;
    case WARNING = 2;
    case ERROR = 3;
    case CRITICAL = 4;
}

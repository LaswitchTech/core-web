<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Helper;

/**
 * Base contract for all helper implementations.
 */
interface HelperInterface
{
    /**
     * Returns the unique name of this helper.
     */
    public function name(): string;
}

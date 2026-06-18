<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Plugin;

/**
 * Hello world extension — registers a callback on the `plugin.started` hook.
 *
 * WEB mode prints an HTML heading; CLI mode prints plain text to STDOUT.
 */
final class HelloWorld
{
    /** Run when boot completes (fired by bootstrap via plugin.started hook). */
    public static function onStartup(array $context): void
    {
        echo \PHP_SAPI === 'cli'
            ? "Hello World!\n"
            : '<h1>Hello World!</h1>' . \PHP_EOL;
    }
}

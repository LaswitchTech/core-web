<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router\Request;

/**
 * Immutable CLI request representation parsed from argv.
 */
final class Cli
{
    private readonly string $command;
    /** @var list<string> */
    private readonly array $args;
    /** @var array<string,bool|string> */
    private readonly array $flags;

    /**
     * Parse argv into command + positional args + flag map.
     *
     * Example: `php cli hello.world Louis --upper --format=json`
     *         => command = 'hello.world',  args = ['Louis'],  flags = ['upper' => true, 'format' => 'json']
     */
    public static function fromArgv(array $argv): self
    {
        // Strip 'php' and 'cli' leading elements if they appear.
        while ($argv !== [] && in_array(strtolower(basename($argv[0] ?? '')), ['php', 'cli'], true)) {
            array_shift($argv);
        }

        $command   = '';
        $args      = [];
        $flags     = [];

        foreach ($argv as $i => $segment) {
            if (!str_starts_with($segment, '--')) {
                // First non-flag token is the command name; all following are positional args.
                if ($command === '') {
                    $command = $segment;
                } else {
                    $args[] = $segment;
                }
                continue;
            }

            // Flag with optional value: --key=value  or  --key
            $rest = substr($segment, 2);
            if (str_contains($rest, '=')) {
                [$flagKey, $flagVal] = explode('=', $rest, 2);
                $flags[$flagKey]     = $flagVal;
            } else {
                $flags[$rest] = true;
            }
        }

        return new self($command, $args, $flags);
    }

    private function __construct(
        string $command,
        array  $args,
        /** @var array<string,bool|string> */
        array  $flags,
    ) {
        $this->command = trim($command);
        $this->args    = array_values(array_filter($args));
        $this->flags   = $flags;
    }

    public function command(): string { return $this->command; }
    public function args(): array      { return $this->args; }

    /** Get a single positional argument by index. */
    public function arg(int $index, mixed $default = null): mixed
    {
        return $this->args[$index] ?? $default;
    }

    public function flags(): array { return $this->flags; }

    /** Get a flag value (true for bare --flag, string for --key=value). */
    public function flag(string $name, mixed $default = null): mixed
    {
        return $this->flags[$name] ?? $default;
    }
}

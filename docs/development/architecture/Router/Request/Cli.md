# CLI Request Class

## Overview

The `Cli` class is an immutable value object representing a single CLI command execution. It parses `$argv` (the PHP global containing the command-line arguments) into a structured request with a command name, positional arguments (`$arg[]`), and flags (`--flag` → `$flags[]` or `--key=value`). Unlike the Web request class which wraps HTTP globals, the Cli class is constructed from a raw string array — typically `$argv` but can be injected directly for testing.

## Responsibilities

- **Argument parsing** — splits the input array into a command name, positional arguments and named flags (with optional values).
- **Immutable encapsulation** of CLI request data — all values are set once at construction via `fromArgv()` and exposed through getters only.
- **Flag parsing support** — recognizes `--flag` syntax for booleans and `--key=value` / `--key value` for key-value pairs, storing results in the accessible `$flags` array.
- **Convenience accessors** — `arg($index)` returns a positional argument by index; `args()` returns all positional arguments as an indexed array.

### Supported Accessor Methods

| Method              | Return Type | Description |
|---------------------|-------------|-------------|
| `command()`         | string      | The parsed command name (e.g., 'core.config.show') |
| `arg(int)`          | ?string     | Positional argument by index; null if out of bounds |
| `args()`            | array<int,string>  | All positional arguments as an indexed array |
| `flags()`           | array<string, mixed> | Parsed flags in associative form (keys map to string/bool values) |
| `rawArgs()`         | array<string>   | The original unprocessed `$argv` string array passed at construction |

## Architecture

### Internal Structure

Cli uses the immutable value object pattern: all state is constructed via a static factory (`fromArgv()`) and accessible only through typed getters. Private readonly fields store four arrays/maps parsed from the input string array.

| Field         | Type           | Description                                |
|---------------|----------------|--------------------------------------------|
| `command`     | string         | Parsed command name (first non-flag token) |
| `args`        | string[]       | Positional arguments in order (non-flag tokens after command) |
| `flags`       | array<string, mixed>  | Parsed key-value flags (key → value/map of flags) |
| `rawArgs`     | string[]       | The original unprocessed `$argv` input array |

### Argument Parsing Algorithm (fromArgv Factory Method)

The factory traverses the input string array from index 0 onward:

1. **First token** — always treated as the command name; stored in `$command`.
2. **Subsequent tokens** — each is classified as either a positional argument or a flag based on whether it starts with `--`:
   - `--name` → boolean flag (value = true)
   - `--name=value` → key-value flag (value parsed from after '=')
   - `--name value` → two-token flag: `'name'` maps to the next token as its string value
   - Anything else → positional argument appended to `$args[]`

This means flags can appear anywhere after the command name; they are not position-dependent.

### Flag Format Conventions

| Syntax              | Parsed Result       | Description |
|---------------------|--------------------|-------------|
| `--verbose`         | `['verbose' => true]`           | Boolean flag (always true)  | 
| `--version=1`       | `['version' => '1']`            | Key-value flag with string value |
| `--key value`   | `['key' => 'value']`          | Two-token flag (next token becomes the value) |
| `--output=/tmp/file.txt` | `['output' => '/tmp/file.txt']` | Single-token key-value flag with path value |

### Usage Example — Handler Pattern

```php
$router->command('core.config.show', function(Cli $request): Response {
    return Response::text("Config from {$request->arg(0)}\n");
});

// In a CLI handler:
return match($req->command()) {
    'plugin.greet' => sprintf("Greetings, %s! Flags: %s", 
        $req->arg(0) ?: 'stranger', 
        json_encode($req->flags()), 
    ),
};
```

### Example: Complete CLI Handler Pattern with Flag Support

```php
$router->command('core.install', static function(Cli $request): Response {
    $targetDir = $request->arg(0) ?: '/var/www';  // positional or default
    $verbose = $request->flags()['verbose'] ?? false;  // flag boolean
    
    if ($verbose) {
        return Response::text("Verbose mode - installing to {$targetDir}\n");
    }
    
    return Response::text("Installing to {$targetDir}\n");
});

// Usage:
php cli core.install /some/dir --verbose     # → "Verbose mode - installing..."
php cli core.install                          # → "Installing to /var/www" (default)
```

## Limitations

- **No sub-command discovery** — the parser treats the entire command name as a single string (e.g., 'core.config.show' is stored verbatim); the Router then matches it against registered commands. There is no hierarchical sub-command resolution built into the Cli class itself.
- **Flag parsing is rigid** — `--key value` requires two consecutive tokens; there is no quoting mechanism for values containing spaces (e.g., `'--message hello world'` would parse as key='message', value='hello' and 'world' becomes a positional arg). Only the first `=` token is used for `key=value` parsing.
- **No stdin/stdout abstraction** — the Cli class only parses `$argv`; it does not wrap PHP's native STDIN, STDOUT, STDERR or provide any stream-based I/O helper. Extensions must access these globals directly when needed.

## Future Enhancements

- Add support for optional flags with default values (e.g., `--verbose=false`).
- Support quoted flag values (`'--message hello world'` parsed as single value).
- Provide a `Stdin` wrapper class for reading input and `Stdout`/`Stderr` wrappers for typed output (color formatting, progress indicators).
- Add argument validation via constraints (e.g., requiring certain positional args or mandatory flags) at construction time rather than in handlers.

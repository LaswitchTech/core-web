# CLI Request

## Purpose

The CLI Request component is an immutable value object that encapsulates a single CLI command execution by parsing `$argv` into structured request data: command name, positional arguments, and flags.

## Responsibilities

- Strip leading `php`/`cli` tokens from `$argv`.
- Identify the first non-flag token as the command name.
- Collect subsequent non-flag tokens as positional arguments.
- Parse `--key=value` flags into a string map and bare `--flag` flags into booleans.

## Public API

| Method | Description |
|---|---|
| `static fromArgv(array $argv): self` | Entry point that parses `$argv`. Strips leading tokens named `php` or `cli` (case-insensitive, uses `basename()` for comparison). The first non-flag token (not starting with `--`) becomes the command. Subsequent non-flag tokens become positional arguments. Tokens starting with `--` are parsed as flags: `--key=value` stores the string value; bare `--flag` stores `true`. Empty args are filtered out via `array_filter()`. |
| `command(): string` | The resolved command name (trimmed, never empty). |
| `args(): array` | Positional arguments as a list of strings. Excludes the command token and any flag tokens. |
| `arg(int $index, mixed $default = null): mixed` | Get a single positional argument by zero-based index. Returns `$default` when the index is out of bounds. |
| `flags(): array` | Flag map: associative array where bare flags (e.g. `--upper`) have value `true`, and key-value flags (e.g. `--format=json`) have their string value. Keys are the flag name without the `--` prefix. |
| `flag(string $name, mixed $default = null): mixed` | Get a single flag value by name (without `--`). Returns `true` for bare flags, the stored string for `--key=value` flags, or `$default` when unset. |

## Internal Architecture

- **Leading-token stripping**: loops while the first element (lowercased via `strtolower(basename($argv[0]))`) equals `php` or `cli`, calling `array_shift()` to remove it.
- **Flag parsing**: for each `--key=value` token, splits at the first `=` into key and value; stores as `[$key] => $value`. For bare `--flag`, stores as `[$rest] => true` where `$rest` is the substring after `--`.
- **`$v --key value` is not supported**: the parser only recognises `--key=value` for string-valued flags; a space-separated token like `value` would be treated as a positional argument instead of a flag value.

## Dependencies

- No external dependencies; reads `$argv` directly.

## Lifecycle

1. **Instantiation** — always via `fromArgv(array $argv)` static factory; the constructor is private. Parses all tokens in a single pass.
2. **Dispatch use** — passed to CLI command handlers for resolution of the command name and its parameters.
3. **Destruction** — PHP garbage-collects the object when it goes out of scope.

## Future Enhancements

- Support for short flags (`-v`, `-f foo`) not yet implemented.
- Support for space-separated flag values (`--key value`) not yet implemented (only `--key=value` is recognised).
- Quoted argument handling (e.g. `"my arg"`) not yet implemented.

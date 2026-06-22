# Hello World Plugin (Reference Example)

This is a minimal example of a CoreWeb plugin. It was moved here from `ext/plugins/` because it is no longer actively shipped in the framework distribution — its functionality is now part of the core routing engine.

Keep this folder for reference when building your own plugins:

- `manifest.json` shows the required extension format
- `route.php` demonstrates route registration via `add_route()` hook
- `hook.php` demonstrates the `init` hook implementation

For production use, copy this structure into your extension's directory and adapt.

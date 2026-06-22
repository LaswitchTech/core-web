# Hello World Plugin (Reference Example)

This plugin was originally moved to `examples/plugins/hello-world/` as part of a cleanup pass, but it was moved back to `ext/plugins/` because `test/extension_autoload.php` hardcodes discovery under `__DIR__ . '/../ext'` and asserts the physical presence of `ext/plugins/hello-world/src/HelloWorld.php`.

**TODO:** Update `test/extension_autoload.php` (line ~7–6) to support a configurable extension discovery path before removing this from ext/. Until then, copy this directory as a reference for building your own plugins.

For the current framework, its route registration functionality is already provided by the core routing engine — keep only as an example manifest/source reference.

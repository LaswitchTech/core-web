# Builder Component Runtime

## Overview

Builder is Core-Web's browser-side JavaScript component runtime. It provides a `Component` base class for building stateful UI components and serves as the single point of coordination for the entire component lifecycle. The `Builder` object owns component registration, override resolution, creation, generated identity assignment, active-instance lookup, destruction, safe text rendering, and safe HTML rendering. Each component instance owns its own configuration, DOM rendering, mounting, updating, child relationships, lifecycle hooks, and destruction state.

The runtime is loaded from `Assets/js/kernel.js`. Built-in components are discovered from `Assets/js/components/`, where each file defines a component class that extends `Component` and registers itself with the global `Builder`. These built-in component files load after `kernel.js` loads but before any application JavaScript executes, ensuring the globally available registration APIs are in place when application code runs. The first built-in reference implementation is `Assets/js/components/card.js`.

V1.0 uses classic scripts with globally available `Builder` and `Component` APIs for all component operations. ES modules and static imports are deferred to V2.0.

## Architecture

```
Asset Registry
    -> /js/kernel
    -> /js/kernel/components/*.js
    -> browser script execution

Assets/js/kernel.js
    -> provides global Component
    -> provides global Builder

Assets/js/components/card.js
    -> extends Component
    -> registers through Builder.register()

Builder
    -> component definitions
    -> registration metadata
    -> live instances
    -> Custom Elements
    -> safe text/HTML utilities

Component
    -> configuration
    -> lifecycle
    -> rendered Element
    -> mounting
    -> children
    -> refresh
    -> destruction
```

The architecture separates concerns across four layers. The Asset Registry handles script loading order, ensuring `kernel.js` executes before any component definition files. Kernel provides the foundational types (`Component`) and runtime services (`Builder`) as globals. Individual component files extend `Component` and register through `Builder`, introducing their custom element tag names without touching the runtime core. Finally, `Builder` and `Component` each own a distinct responsibility: `Builder` manages the registry of available types, resolves overrides, creates instances, and provides safe rendering utilities; `Component` manages instance-level state including configuration, DOM lifecycle, child tracking, and destructors. This keeps the global coordination layer separate from per-instance concerns.

## Runtime Files

| File | Role in the Builder Runtime | Reference Demonstration |
|------|----------------------------|------------------------|
| `Assets/js/kernel.js` | Core runtime: defines the global `Component` base class and exposes the `Builder` registry object on `window`. It provides safe text and HTML rendering utilities, component registration, override resolution, instance creation, identity generation, active-instance lookup, destruction orchestration, and custom element registration. | `test/test_builder_runtime.php` |
| `Assets/js/components/card.js` | First built-in component: defines the `<x-card>` custom element by extending `Component`. Demonstrates how a concrete component registers itself through `Builder.register()` and implements the rendering lifecycle. | `test/test_component_card.php` |
| `ext/plugins/hello-world/Assets/js/app.js` | Plugin-level application JavaScript loaded after kernel and built-in components. Demonstrates plugin code that depends on the global `Builder` and `Component` availability, registering its own custom element (`<x-hello>`). | `ext/plugins/hello-world/Manifest.json`; `test/test_hello_world_hook.php` |
| `ext/plugins/hello-world/views/hello-view.php` | Server-rendered template that outputs `<x-hello>` custom elements in HTML. Demonstrates the declarative consumption of a Builder component from PHP templates, including where configuration is passed (data attributes) and how child content flows through slot-like innerHTML. | `test/test_hello_world_hook.php` |
| `src/Bootstrap.php` | Application bootstrap orchestration: loads config, initializes the DI container, starts the session, registers core services, and triggers the asset pipeline. Does not directly reference Builder but ensures kernel and component scripts are available to the page before application JavaScript runs. | `test/smoke_bootstrap_assets.php` |
| `src/Helper/Asset.php` | Asset resolution helper for PHP views: produces URLs and links to registered or built-in assets such as `Assets/js/kernel.js`. Used by templates and layouts to insert script/link tags in the correct loading order. | `test/test_smoke_builder_components_registered.php`; `test/test_smoke_kernel_before_app.js` |
| `src/Asset/Entry.php` | Immutable value object representing a single asset entry (type, path, attributes). Created by the Asset Registry and passed through registration metadata without executing any Builder- or component-specific logic. | `test/test_builder_component_entry.php`; `test/test_smoke_asset_entry.php` |
| `src/Asset/Registry.php` | PHP-side registry of static assets for a page: collects entries (kernel, components, application JS), enforces loading order semantics (kernel → built-ins → app), and prepares the resolved list for view consumption. Does not depend on the browser-side Builder directly. | `test/test_smoke_asset_entry.php`; `test/test_smoke_kernel_before_app.js`; `test/test_builder_component_entry.php` |
| `src/Router/Router.php` | Handles URL-to-handler resolution and dispatches requests to application code. Interacts with asset loading indirectly via Bootstrap but does not participate in the Builder component lifecycle itself. | `test/test_smoke_router_basic.php` |

## Registration and Discovery

V1.0 relies on a convention-based discovery mechanism for built-in components. The kernel runtime script `Assets/js/kernel.js` is registered first, establishing the global Foundation (`Component`) and coordination layer (`Builder`). Any readable `.js` files beneath `Assets/js/components/` are then discovered recursively by directory scan. Component filenames are expressed as paths relative to `Assets/js/`, producing a component identity derived from that relative path — for example, `components/card.js`. Discovered component files are sorted alphabetically to ensure deterministic load order.

Both the kernel runtime and all built-in component assets use asset priority `100`, giving them loading precedence over application-level scripts. The canonical runtime alias is `/js/kernel`; a component file at `Assets/js/components/card.js` is addressed as `/js/kernel/components/card.js`. Plugin component files living outside the core `Assets/` directory are not auto-discovered by this kernel directory scan — they must be registered explicitly. V2.0 will replace discovery-based classic-script loading with ES-module imports to remove this convention dependency.

Script loading order:

```
kernel.js
components/card.js
app.js
```

## Component Creation Flow

`Builder.create(slug, config)` follows a deterministic high-level sequence that produces a component instance ready for mounting:

1. **Slug normalization:** The provided slug string is normalized into a consistent lookup key (lower-cased, path separators resolved) so that registrations and lookups use the same canonical form.
2. **Active class lookup:** The Builder registry is consulted to resolve the normalized slug to its currently active component constructor — this is the class that any new instances of this slug will instantiate.
3. **Component construction with configuration:** A new instance of the resolved class is created and initialized with the provided configuration object, allowing per-instance customization at birth.
4. **Generated ID allocation:** A unique identifier is allocated for the instance in the shape `builder-{slug}-{counter}`, where `slug` is the normalized component slug and `counter` is an incrementing integer maintained within the current runtime session.
5. **Identity initialization:** The newly generated ID is embedded into the instance's identity so that all subsequent lookups, DOM references, and lifecycle events can be traced back to this specific object.
6. **`onCreate()` invocation:** The `onCreate()` lifecycle hook fires immediately after construction, giving the component a chance to perform one-time setup before rendering — such as subscribing to internal state or configuring child references.
7. **Initial render execution:** The component's `render()` logic executes for the first time, producing a raw DOM element tree that represents the component's output based on its current configuration and state.
8. **Root Element validation and binding:** The resulting root element is validated for correctness (it must be a single top-level element) and bound to the instance as the render anchor, ensuring all subsequent rendering and updates operate against a consistent DOM subtree.
9. **Live-instance registration:** The fully initialized instance is registered into the Builder's active-instance collection under its generated ID, making it discoverable for lifecycle events, destruction calls, and state queries.
10. **Returning the component:** The instance is returned to the caller so that application code or declarative markup can proceed with mounting or further configuration.

Generated IDs follow the shape `builder-{slug}-{counter}`. IDs are unique within the current runtime session — no two live instances share the same identifier. When a later registration overrides an existing slug, newly created instances adopt the new class; previously created instances retain their original class because instance creation fixes the constructor at step 3 before the override takes effect.

## Declarative Custom Elements

A component slug registered via `Builder.register("card", Card)` maps to a custom element named `<builder-card>`. The mapping transforms the kebab-cased slug by prefixing it with `builder-` and using hyphens as segment separators. Custom elements are defined programmatically only when browser support for the Custom Elements API exists — in non-browser environments or browsers without Custom Elements, registration proceeds without defining a custom element class, and components can still be created imperatively through `Builder.create()`. Registration does not require Custom Elements support in non-browser environments; it simply records the mapping in the registry without touching `customElements`.

Existing Custom Element definitions are reused during component class overrides — if an element has already been defined with a given name, a subsequent registration of that same slug swaps the active constructor in the Builder registry without re-invoking `customElements.define()`, preventing native browser errors about redefining elements. On first connection to the DOM (`connectedCallback`), the element's attributes are read and converted into a configuration object passed to component creation. Attribute values undergo type coercion:

- `"true"` becomes `true`
- `"false"` becomes `false`
- `"null"` becomes `null`
- supported numeric strings (e.g., `"42"`, `"-7"`) become numbers
- all other values remain strings

The active definition for any given slug is resolved dynamically through `Builder.create()` at connection time — the custom element does not lock into a constructor until that moment. After the component is created and rendered, its root Element replaces the original declarative custom element node in the DOM tree. No MutationObserver is used to discover or instantiate components; the flow is entirely driven by Custom Elements native lifecycle callbacks when available.

Example usage:

```html
<builder-card title="Welcome" content="Hello world" footer="© 2026"></builder-card>
```

## Rendering and Refresh Model

A component's `render()` method performs the initial construction of one root Element. A component can render only once — `render()` is a single-wire operation that produces the original DOM tree for this instance. The returned value from `render()` must be exactly one Element; if multiple elements or non-element values are produced, rendering fails at validation time.

When the root Element exists on screen, Builder assigns it two attributes: the component's generated identifier (e.g., `"builder-card-1"`) and a `data-builder-component` attribute that records the slug of the registered class (`"card"`). These attributes persist for the lifetime of the instance and serve as anchors for lifecycle events, destruction calls, and introspection.

Subsequent content changes use the `update(element)` method, which receives the existing root Element directly and applies modifications in place rather than constructing a new tree. The `refresh()` method orchestrates updates via three phases: it invokes `beforeRender()` to allow pre-update hooks, calls `update(existingElement)` to apply the component's modified output to the DOM, and fires `afterRender()` for post-update hooks. Crucially, `refresh()` does not call `render()` — a component that calls `render()` during a refresh phase will fail the single-render constraint.

Root Element identity must remain stable across all updates. The same DOM node object is retained; only its contents change. Mounting state and the generated component identity survive refresh operations without reset or reallocation. Components should resolve stable child regions — identified by `data-builder-component` attributes or other durable markers — and update their contents in place rather than rebuilding the root tree.

For example, the built-in Card component defines three regions: header, body, and footer. Each region is a distinct descendant element that can be independently updated without touching the others. When content changes via `update()`, only the affected region's inner markup is replaced, while the surrounding structure and the root Element itself remain intact.

## Provider Precedence

Provider precedence determines which registration of a given slug becomes the active definition when multiple registrations share the same component. The accepted provider values are `kernel`, `plugin`, and `application`. Each registration carries metadata fields: `provider` (the source layer that registered), `priority` (a numeric value for ordering), and `order` (a monotonically increasing counter reflecting registration sequence within the current runtime).

When a new registration arrives for an existing slug, the current active definition is compared against the candidate using this exact order:

1. Higher numeric priority wins.
2. When priorities are equal: application > plugin > kernel.
3. When priority and provider are equal: later successful registration wins.

Metadata is accessible through `Builder.metadata(slug)`. The returned metadata object is a copy — mutating it has no effect on the registry. Weaker registrations that lose the comparison are silently ignored; they consume no order counter, meaning subsequent registrations do not shift position due to a lost candidate. Validation failures (e.g., missing constructor, invalid class hierarchy) also consume no order.

When Custom Element registration fails during the registration process, both the existing custom element definition and the newly proposed metadata are rolled back — the failed registration does not partially apply. Existing component instances already mounted in the DOM are not replaced when a definition is overridden; they retain their original class and render tree. Only future creations of that slug use the newly active winning definition.

Example precedence table:

| Registration | Provider  | Priority | Result for same slug vs others |
|-------------|-----------|----------|--------------------------------|
| A           | kernel    | 50       | Loses to any priority > 50; loses provider tie to plugin or application |
| B           | plugin    | 100      | Wins kernel ties at priority ≤ 100; loses application tie at equal priority |
| C           | application | 100    | Wins all ties at priority ≥ 100 within same provider via later order position |

## Safe Content Rendering

Builder provides two rendering APIs that guarantee output safety without requiring developers to handle escaping manually. `Builder.text(element, value)` writes literal text content into a target element — the value passes through as plain text nodes with no parsing or interpretation. This is the default when safe HTML is not required.

`Builder.html(element, value)` handles raw HTML strings securely by first parsing them through an inert template element (rather than assigning to `innerHTML` on a live node), sanitizing the resulting fragment tree, and then atomically replacing all children of the target element with the cleaned DOM subtree. Raw HTML strings are never assigned directly to a live target element — this two-phase approach prevents injected scripts during parsing.

Sanitization uses an allowlist model: only permitted elements, attributes, and specific element/URL attribute pairings (e.g., `<img src="..."/>` but not `<script href="..."/>`) pass through validation. URL protocol validation restricts which schemes are accepted for attribute pairs such as `href` and `src`. Forbidden elements are removed along with their complete subtree from the fragment tree so that nested children of blocked elements also disappear. Text nodes contained within the fragment are preserved through sanitization unchanged. Unsupported node types encountered during traversal are stripped entirely. If input validation fails on the raw HTML string, the target's existing contents remain untouched — no partial write occurs.

Detailed sanitization rules and the complete allowlist are documented in [HtmlSanitization](./HtmlSanitization.md).

## Built-in Components

The first built-in reference component is Card, defined in `Assets/js/components/card.js` and registered under the slug `card` with provider `kernel` and priority `0`. It renders three distinct regions — header, body, and footer — each as a child region within the card's root Element. Header and footer content use safe text rendering via `Builder.text()`, ensuring user-supplied titles and footers cannot be interpreted as HTML. The body region uses safe HTML rendering via `Builder.html()`, allowing rich formatted content while still applying the full sanitization pipeline documented in [HtmlSanitization](./HtmlSanitization.md).

The Hello World plugin provides the end-to-end runtime demonstration, showing a kernel-discovered component interacting with an application-layer custom element. For the Card reference implementation's full specification, see [Components/Card](./Components/Card.md).

## V1.0 Constraints

V1.0 operates under the following constraints:

- Classic scripts only; no ES-module imports or `import` statements in any runtime file.
- Global `Builder` and `Component` objects on `window`; no scoped modules or namespaces as alternatives.
- Built-in component discovery under `Assets/js/components/` via directory scan of readable `.js` files.
- No MutationObserver for DOM traversal or component discovery at any point during initialization.
- No manual declarative DOM scan — all components are either discovered through the Custom Elements lifecycle or created imperatively via `Builder.create()`.
- No automatic plugin component-directory discovery — plugins must register explicitly; only kernel and application layers participate in built-in discovery.
- No hydration or server-rendered component state — the runtime creates DOM nodes fresh on each mount; no server-side component tree reconciliation.
- No asynchronous component creation — all creation, rendering, and mounting is synchronous within the same turn.
- No Shadow DOM — all components render into the light DOM by default.
- No deep configuration merge — configuration objects are passed as-is without recursive merging of nested structures.

## Files

### Runtime Documentation

| File | Documented In |
|------|---------------|
| `Builder` (runtime object) | [Builder](./Builder.md) |
| `Component` (base class) | [Component](./Component.md) |
| HTML sanitization pipeline | [HtmlSanitization](./HtmlSanitization.md) |
| Card component reference implementation | [Components/Card](./Components/Card.md) |

### Source Files
- `Assets/js/kernel.js`
- `Assets/js/components/card.js`

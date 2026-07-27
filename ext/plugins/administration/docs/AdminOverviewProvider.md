# Admin Overview Provider

## Purpose

`admin.overview.register` provides an extension contract that allows the Administration plugin, the application, and other enabled plugins to contribute Builder-rendered entries to the `/admin` Overview dashboard. Each entry is registered under a unique ID with metadata controlling its display properties and component mapping.

## Context

The hook trigger passes a context array to each registered provider callback. Providers receive the following values:

| Key | Type | Description |
|-----|------|-------------|
| `registry` | `Laswitchtech\CoreWeb\Plugin\Administration\Overview\Registry` | The Administration Overview registry used to register entries. |
| `container` | `ContainerInterface` | The Core-Web dependency injection container for resolving services. |
| `mode` | `string` | The current bootstrap mode — currently `"web"` for the Administration dashboard request. |

A provider must verify that a compatible registration registry is available in the context and return early without registering entries if it is absent or not an instance of `Laswitchtech\CoreWeb\Plugin\Administration\Overview\Registry`.

## Manifest Declaration

An extension registers its overview provider by including an `admin.overview.register` hook entry in its manifest:

```json
{
    "type": "plugin",
    "name": "example-plugin",
    "version": "1.0.0",
    "hooks": [
        "admin.overview.register::Example\\Plugin\\DashboardOverviewProvider::register"
    ]
}
```

The referenced method is invoked when the Administration Overview registry is assembled during bootstrap.

## Entry

Contributor registration creates `Laswitchtech\CoreWeb\Plugin\Administration\Overview\Entry` instances with the following constructor fields:

| Field | Type | Rule |
|-------|------|------|
| `id` | `string` | Must begin with a lowercase letter and may contain lowercase letters, digits, dots, underscores, and hyphens. IDs should be stable because they identify entries for overrides and future customization persistence. |
| `component` | `string` | Must be a valid lowercase Builder slug using single hyphens. |
| `config` | `array` | The configuration array passed to `Builder.create(component, config)`. |
| `columns` | `int` | Must be between 1 and 4. |
| `priority` | `int` | Controls default ordering and conflict resolution. |
| `provider` | `string` | Must be `kernel`, `plugin`, or `application`. |
| `order` | `int` | Assigned by the registry through `withOrder()` and should normally be omitted by contributors. |

### Overview Column Spans

The `columns` field accepts integers from 1 through 4 and controls the requested grid-column span for the entry within the dashboard layout. On screens below 768 pixels, any entry requesting two or more columns falls back to a single column. A requested span does not guarantee a fixed physical width because the underlying grid uses responsive auto-fit columns. Providers should select the smallest span that presents the component clearly — prefer `1` unless the component genuinely needs more horizontal space to render legibly.

## Badge Example

```php
<?php declare(strict_types=1);

namespace Example\\Plugin;

use Laswitchtech\\CoreWeb\\Plugin\\Administration\\Overview\\Entry;
use Laswitchtech\\CoreWeb\\Plugin\\Administration\\Overview\\Registry;

final class DashboardOverviewProvider
{
    public static function register(array $context): void
    {
        if (!($context['registry'] ?? null) instanceof Registry) {
            return;
        }

        $registry = $context['registry'];

        $entry = new Entry(
            id: 'example_status',
            component: 'badge',
            config: [
                'label' => 'Example Status',
                'tooltip' => 'Displays example status information',
                'value' => 'Operational',
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm1.9 4.7-4.7 6.3a.7.7 0 0 1-1.1 0l-2.1-2.8a.7.7 0 1 1 1.1-.9l1.5 2 4.1-5.5a.7.7 0 1 1 1.2.6Z"/></svg>',
                'href' => '/example/detail',
            ],
            columns: 1,
            priority: 100,
            provider: Entry::PROVIDER_PLUGIN,
        );

        $registry->register($entry);
    }
}
```

## Card Example

A second entry using the `card` component:

```php
$entry = new Entry(
    id: 'example_information',
    component: 'card',
    config: [
        'title' => 'Example Information',
        'content' => 'This card provides example information for demonstration purposes.',
        'footer' => 'Footer text for the card',
        'headerVisible' => true,
        'bodyVisible' => true,
        'footerVisible' => true,
        'controlMenuEnabled' => false,
        'collapseControlVisible' => false,
        'fullscreenControlVisible' => false,
    ],
    columns: 2,
    priority: 50,
    provider: Entry::PROVIDER_PLUGIN,
);
```

Component configuration must match the selected Builder component's public configuration contract. Ensure all keys and value types align with the target component's documented API to avoid unexpected rendering behavior.

## Builder Component Availability

The client-side Overview renderer follows a deterministic registration-based validation flow before processing entries:

1. **Availability check.** The renderer verifies that each target entry's component has been registered by calling `Builder.has(entry.component)` prior to creation. If the component is unknown, the entry is silently skipped — no rendering or error output is produced for missing components.
2. **Creation.** For each available component, the renderer calls `Builder.create(entry.component, entry.config)`, passing the full configuration object as returned by the provider's Entry.
3. **Plugin responsibility.** Any plugin that contributes an Overview entry using a custom Builder component must also register and ensure its component is loadable before the Overview renderer processes entries. The plugin cannot rely on another extension to supply its component.
4. **No direct Administration dependency.** Components registered by plugins must not depend directly on the Administration plugin or any of its internal code paths. Use only framework-level APIs that remain available outside the Administration context.
5. **Graceful degradation.** Optional integrations must detect availability through standard capability checks and degrade gracefully when dependencies are absent. Never assume a component, service, or API exists at runtime without verifying it first.
6. **Client-safe configuration.** All Entry configuration values must contain client-serializable data (strings, integers, booleans, arrays of serializable values). Secrets, credentials, service tokens, and sensitive server state **must never** be exported through Overview configuration — if a value cannot safely appear in the browser payload, it must not be included in the config object.

## Charts and Monitoring

Charts may use a plugin-owned Builder component. The chart component is responsible for detecting optional chart-library availability at registration time; an overview provider should pass only client-safe chart data and options to the component's config. A future Monitoring plugin may register CPU, RAM, disk usage, disk health, network, and service-status widgets. Monitoring widgets should use stable IDs because they identify persistent metrics across sessions and updates. They should also choose column spans appropriate to their content — a single metric fits in one column while a summary dashboard row benefits from two or more.

Monitoring providers must not place polling, system inspection, or chart-library logic inside the Administration plugin. The Administration Overview only owns registration, layout, and Builder mounting; all data collection and library dependencies belong in the consuming or providing extension.

Example pseudo-registration for a monitoring entry that uses a plugin-owned `monitor-chart` component:

```php
$entry = new Entry(
    id: 'monitor_cpu',
    component: 'monitor-chart',
    config: [
        'title' => 'CPU Usage',
        'series' => ['idle', 'user', 'system'],
        'maxValue' => 100,
        'unit' => '%',
    ],
    columns: 2,
    priority: 30,
    provider: Entry::PROVIDER_PLUGIN,
);

$registry->register($entry);
```

`monitor-chart` is not a built-in component; it is provided by the extension that owns monitoring features and must be registered with `Builder.register()` before this entry is rendered.

## Default Resolution and Ordering

Entries sharing the same ID compete during resolution when multiple providers register with conflicting identifiers. The resolver applies these rules in sequence:

1. **Higher priority wins.** An entry registered with a larger positive numeric priority overrides entries with lower priority.
2. **Provider precedence at equal priority.** When priorities are equal, the provider layer breaks the tie: application > plugin > kernel.
3. **Registration order at equal priority and provider.** When both priority and provider are identical, whichever entry was registered first wins; later registrations for the same ID are silently ignored.

### Default Dashboard Navigation Order

After competing entries have been resolved, the remaining unique entries are ordered for dashboard navigation as follows:

1. **Priority descending** — higher-priority entries appear before lower-priority ones.
2. **Registration order ascending** — within a group that shares the same priority, earlier registered entries appear first.

Registry order (the state produced by successful resolution) is the default layout whenever no saved customization exists for a given session or user. When future user-customizable ordering features are implemented, they must operate on top of this resolved set without altering the underlying conflict resolution rules; users can reorder or hide entries after resolution, but they cannot change which entry won a particular ID conflict.

Contributors should use priority to express broad placement intent — placing a chart above summary badges, for example — rather than attempting exact pixel-level positioning through micro-adjustments to numeric values. Small increments between entries reduce the signal that priority conveys and make future ordering changes harder to reason about.

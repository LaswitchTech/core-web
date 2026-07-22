<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

final class BreadcrumbRenderer
{
    private function __construct() {}

    private static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public static function renderRoute(
        \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Registry $registry,
        string $currentUrl,
    ): string {
        $currentUrl = trim($currentUrl);

        if ($currentUrl !== '/' && str_ends_with($currentUrl, '/')) {
            $currentUrl = rtrim($currentUrl, '/');
        }

        /** @var list<\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry> $selected */
        $selected = [];

        foreach ($registry->resolved() as $entry) {
            $entryUrl = $entry->url();

            if ($currentUrl === $entryUrl || str_starts_with($currentUrl, $entryUrl . '/')) {
                $selected[] = $entry;
            }
        }

        usort($selected, static function (\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $a, \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $b): int {
            return count(explode('/', $a->url())) <=> count(explode('/', $b->url()));
        });

        $homeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="app-icon" viewBox="0 0 16 16" aria-hidden="true">' . "\n"
            . '  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>' . "\n"
            . '</svg>';

        $parts = [];
        $total = count($selected);

        foreach ($selected as $index => $entry) {
            $isCurrent = ($total > 0 && $currentUrl === $entry->url());

            if (!$isCurrent) {
                $href = self::escape($entry->url());
                $label = self::escape($entry->label());
                $parts[] = sprintf(
                    '    <li class="panel-route-breadcrumb-item"><a href="%s" title="%s">%s%s<span class="visually-hidden">/</span></a></li>',
                    $href,
                    self::escape($entry->description() !== null ? $entry->description() : $entry->label()),
                    self::renderEntryIcon($entry),
                    $label,
                );
            } else {
                $label = self::escape($entry->label());
                $titleFallback = $entry->tooltip() !== null ? $entry->tooltip() : ($entry->description() !== null ? $entry->description() : $entry->label());
                $escapedTooltip = self::escape($titleFallback);
                $parts[] = sprintf(
                    '    <li class="panel-route-breadcrumb-item" title="%s" aria-current="page">%s%s</li>',
                    $escapedTooltip,
                    self::renderEntryIcon($entry),
                    $label,
                );
            }
        }

        $nav = '<nav class="panel-route-breadcrumbs" aria-label="' . self::escape('Route hierarchy') . '">' . "\n"
            . '    <ol>' . "\n"
            . '      <li class="panel-route-breadcrumb-item"><a href="/" title="' . self::escape('Home') . '">' . $homeSvg . '<span class="visually-hidden">/</span></a></li>' . "\n";

        if ($parts !== []) {
            $nav .= implode("\n", $parts) . "\n";
        }

        $nav .= '    </ol>' . "\n"
            . '</nav>';

        return $nav;
    }

    private static function renderEntryIcon(
        \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $entry,
    ): string {
        $rendered = IconRenderer::render($entry->icon());

        if ($rendered === '') {
            return '';
        }

        return '<span class="panel-route-breadcrumb-icon" aria-hidden="true">' . $rendered . '</span>';
    }
}

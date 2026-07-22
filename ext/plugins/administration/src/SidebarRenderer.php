<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Administration;

final class SidebarRenderer
{
    private function __construct() {}

    private static function escape(string $value): string
    {
        return htmlspecialchars(
            $value,
            ENT_QUOTES | ENT_SUBSTITUTE,
            'UTF-8',
        );
    }


    public static function render(
        \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Registry $registry,
        string $currentUrl,
    ): string {
        $currentUrl = trim($currentUrl);

        if ($currentUrl !== '/') {
            $currentUrl = rtrim($currentUrl, '/');
        }

        $sections = $registry->sections();

        $childrenByParent = [];

        foreach ($registry->resolved() as $entry) {
            $parentId = $entry->parent();
            if ($parentId !== null) {
                $childrenByParent[$parentId][] = $entry;
            }
        }

        $rootBySection = [];
        foreach ($sections as $section => $entries) {
            $roots = array_filter(
                $entries,
                static function (\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $entry): bool {
                    return $entry->parent() === null;
                },
            );
            if ($roots !== []) {
                $rootBySection[$section] = $roots;
            }
        }

        if ($rootBySection === []) {
            return '';
        }

        $parts = ['<div class="panel-sidebar-menu">'];

        foreach ($rootBySection as $section => $entries) {
            $humanLabel = ucwords(str_replace(['.', '_', '-'], ' ', $section));
            $escapedSection = self::escape($section);
            $escapedHumanLabel = self::escape($humanLabel);

            $parts[] = sprintf(
                '<div class="panel-sidebar-section" data-section="%s"><div class="panel-sidebar-section-label">%s</div>',
                $escapedSection,
                $escapedHumanLabel,
            );

            foreach ($entries as $entry) {
                $parts[] = self::renderEntryTree(
                    $entry,
                    $currentUrl,
                    $childrenByParent,
                    [],
                );
            }

            $parts[] = '</div>';
        }

        $parts[] = '</div>';

        return implode("\n", $parts);
    }

    /**
     * @param array<string, list<\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry>> $childrenByParent
     * @param array<string, true> $visited
     */
    private static function renderEntryTree(
        \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $entry,
        string $currentUrl,
        array $childrenByParent,
        array $visited,
    ): string {
        if (isset($visited[$entry->id()])) {
            return '';
        }

        $visited[$entry->id()] = true;

        $children = $childrenByParent[$entry->id()] ?? [];
        $hasActiveDescendant = self::hasActiveDescendant(
            $children,
            $currentUrl,
            $childrenByParent,
            $visited,
        );

        $parts = [
            self::renderEntry(
                $entry,
                $currentUrl,
                $hasActiveDescendant,
            ),
        ];

        if ($children !== []) {
            $parts[] = '<div class="panel-sidebar-children">';

            foreach ($children as $child) {
                $parts[] = self::renderEntryTree(
                    $child,
                    $currentUrl,
                    $childrenByParent,
                    $visited,
                );
            }

            $parts[] = '</div>';
        }

        return implode("\n", $parts);
    }

    /**
     * @param list<\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry> $entries
     * @param array<string, list<\Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry>> $childrenByParent
     * @param array<string, true> $visited
     */
    private static function hasActiveDescendant(
        array $entries,
        string $currentUrl,
        array $childrenByParent,
        array $visited,
    ): bool {
        foreach ($entries as $entry) {
            if (isset($visited[$entry->id()])) {
                continue;
            }

            $entryUrl = $entry->url();

            if (
                $currentUrl === $entryUrl
                || (
                    $entryUrl !== '/admin'
                    && str_starts_with($currentUrl, $entryUrl . '/')
                )
            ) {
                return true;
            }

            $nextVisited = $visited;
            $nextVisited[$entry->id()] = true;

            if (self::hasActiveDescendant(
                $childrenByParent[$entry->id()] ?? [],
                $currentUrl,
                $childrenByParent,
                $nextVisited,
            )) {
                return true;
            }
        }

        return false;
    }

    private static function renderEntry(
        \Laswitchtech\CoreWeb\Plugin\Administration\Menu\Entry $entry,
        string $currentUrl,
        bool $hasActiveDescendant = false,
    ): string {
        $href = self::escape($entry->url());
        $label = self::escape($entry->label());

        $titleFallback = $entry->tooltip() !== null ? $entry->tooltip() : $entry->description();

        if ($titleFallback === null) {
            $titleFallback = $entry->label();
        }

        $titleValue = self::escape($titleFallback);

        $renderedIcon = IconRenderer::render($entry->icon());
        $iconHtml = $renderedIcon !== ''
            ? '<span class="panel-sidebar-link-icon" aria-hidden="true">' . $renderedIcon . '</span>'
            : '';

        $entryUrl = $entry->url();
        $activeClass = '';
        $ariaCurrent = '';

        if ($currentUrl === $entryUrl) {
            $activeClass = ' active';
            $ariaCurrent = ' aria-current="page"';
        } elseif (
            $hasActiveDescendant
            || (
                $entryUrl !== '/admin'
                && str_starts_with($currentUrl, $entryUrl . '/')
            )
        ) {
            $activeClass = ' active';
        }

        return sprintf(
            '<a class="panel-sidebar-link%s" href="%s"%s title="%s">%s<span class="panel-sidebar-link-label">%s</span></a>',
            $activeClass,
            $href,
            $ariaCurrent,
            $titleValue,
            $iconHtml,
            $label,
        );
    }
}

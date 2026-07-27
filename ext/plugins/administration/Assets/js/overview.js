(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Administration Overview."
        );
    }

    function normalizeEntries(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(function (entry) {
            return entry !== null
                && typeof entry === "object"
                && typeof entry.id === "string"
                && entry.id !== ""
                && typeof entry.component === "string"
                && entry.component !== ""
                && entry.config !== null
                && typeof entry.config === "object"
                && !Array.isArray(entry.config)
                && Number.isSafeInteger(entry.columns)
                && entry.columns >= 1
                && entry.columns <= 4;
        });
    }

    function initializeOverview() {
        const mount = document.getElementById(
            "admin-overview-widgets"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        let entries = [];

        try {
            entries = normalizeEntries(
                JSON.parse(
                    mount.dataset.overviewEntries || "[]"
                )
            );
        } catch (_error) {
            entries = [];
        }

        entries.forEach(function (entry) {
            if (!global.Builder.has(entry.component)) {
                return;
            }

            const component = global.Builder.create(
                entry.component,
                entry.config
            );

            const element = component.element();

            if (element instanceof Element) {
                element.classList.add(
                    "admin-overview-entry",
                    "admin-overview-columns-" + entry.columns
                );

                element.setAttribute(
                    "data-overview-entry",
                    entry.id
                );
            }

            component.appendTo(mount);
        });

    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeOverview,
            { once: true }
        );
    } else {
        initializeOverview();
    }

})(globalThis);

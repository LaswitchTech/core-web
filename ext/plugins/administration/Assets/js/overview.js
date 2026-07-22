(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Administration Overview."
        );
    }

    function normalizeWidgets(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(function (widget) {
            return widget !== null
                && typeof widget === "object"
                && typeof widget.title === "string"
                && typeof widget.value === "string"
                && typeof widget.footer === "string";
        });
    }

    function initializeOverview() {
        const mount = document.getElementById(
            "admin-overview-widgets"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        let widgets = [];

        try {
            widgets = normalizeWidgets(
                JSON.parse(
                    mount.dataset.overviewWidgets || "[]"
                )
            );
        } catch (_error) {
            widgets = [];
        }

        widgets.forEach(function (widget) {
            global.Builder.create(
                "card",
                {
                    title: widget.title,
                    content: '<strong class="admin-overview-widget-value">'
                        + widget.value
                        + "</strong>",
                    footer: widget.footer,
                }
            ).appendTo(mount);
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

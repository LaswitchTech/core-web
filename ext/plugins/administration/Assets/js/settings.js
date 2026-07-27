(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Administration Settings."
        );
    }

    function normalizeEntries(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(function (entry) {
            return entry !== null
                && typeof entry === "object"
                && typeof entry.key === "string"
                && entry.key !== ""
                && typeof entry.label === "string"
                && entry.label !== ""
                && typeof entry.description === "string"
                && typeof entry.type === "string"
                && entry.type !== ""
                && typeof entry.category === "string"
                && typeof entry.overridden === "boolean"
                && entry.category !== "";
        });
    }

    function initializeSettings() {
        const mount = document.getElementById(
            "admin-system-settings"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        let entries = [];

        try {
            entries = normalizeEntries(
                JSON.parse(
                    mount.dataset.settingsEntries || "[]"
                )
            );
        } catch (_error) {
            entries = [];
        }

        const brandingEntries = entries.filter(function (entry) {
            return entry.category === "branding";
        });

        if (!global.Builder.has("card")) {
            return;
        }

        const categoryCard = global.Builder.create(
            "card",
            {
                title: "Branding",
                content: "",
                footer: "",
                headerVisible: true,
                bodyVisible: true,
                footerVisible: false,
                controlMenuEnabled: false,
                closeControlVisible: false,
                fullscreenControlVisible: false,
                collapseControlVisible: false,
            }
        );

        const categoryElement = categoryCard.element();

        if (!(categoryElement instanceof Element)) {
            return;
        }

        categoryElement.classList.add(
            "admin-system-settings-category"
        );

        categoryElement.setAttribute(
            "data-settings-category",
            "branding"
        );

        const categoryBody = categoryElement.querySelector(
            '[data-card-region="body"]'
        );

        if (!(categoryBody instanceof Element)) {
            return;
        }

        brandingEntries.forEach(function (entry) {
            const field = document.createElement("div");

            field.classList.add(
                "admin-system-settings-field"
            );

            field.setAttribute(
                "data-setting-key",
                entry.key
            );

            const label = document.createElement("label");

            label.classList.add(
                "admin-system-settings-label"
            );

            label.setAttribute(
                "for",
                "admin-setting-" + entry.key
            );

            global.Builder.text(
                label,
                entry.label
            );

            field.append(label);

            const description = document.createElement("p");

            description.classList.add(
                "admin-system-settings-description"
            );

            description.id =
                "admin-setting-description-" + entry.key;

            global.Builder.text(
                description,
                entry.description
            );

            field.append(description);

            const input = document.createElement("input");

            input.type = "text";
            input.id = "admin-setting-" + entry.key;
            input.name = entry.key;
            input.classList.add(
                "admin-system-settings-input"
            );

            input.setAttribute(
                "aria-describedby",
                description.id
            );

            input.value =
                typeof entry.value === "string"
                    ? entry.value
                    : "";

            field.append(input);

            categoryBody.append(field);
        });

        categoryCard.appendTo(mount);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeSettings,
            { once: true }
        );
    } else {
        initializeSettings();
    }

})(globalThis);
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

        if (
            !global.Builder.has("card")
            || !global.Builder.has("form-field")
            || !global.Builder.has("input")
            || !global.Builder.has("button")
        ) {
            return;
        }

        const form = document.createElement("form");

        form.method = "post";
        form.action = "/admin/settings";

        form.classList.add(
            "admin-system-settings-form"
        );

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
                            const controlId =
                                "admin-setting-" + entry.key;

                            const field = global.Builder.create(
                                "form-field",
                                {
                                    controlId,
                                    label: entry.label,
                                    description: entry.description,
                                    error: "",
                                    required: false,
                                }
                            );

                            const fieldElement = field.element();

                            if (!(fieldElement instanceof Element)) {
                                return;
                            }

                            fieldElement.setAttribute(
                                "data-setting-key",
                                entry.key
                            );
                            const input = global.Builder.create(
                                "input",
                                {
                                    type: "text",
                                    name: entry.key,
                                    value:
                                        typeof entry.value === "string"
                                            ? entry.value
                                            : "",
                                    placeholder: "",
                                    autocomplete: "",
                                    describedBy: field.descriptionId(),
                                    required: false,
                                    disabled: false,
                                    readonly: false,
                                    invalid: false,
                                }
                            );

                            const inputElement = input.element();

                            if (!(inputElement instanceof HTMLInputElement)) {
                                return;
                            }

                            inputElement.id = controlId;

                            input.appendTo(
                                field.controlMount()
                            );

                            field.appendTo(categoryBody);
        });

        const actions = document.createElement("div");

        actions.classList.add(
            "admin-system-settings-actions"
        );

        form.append(actions);

        categoryCard.appendTo(form);

        mount.append(form);
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
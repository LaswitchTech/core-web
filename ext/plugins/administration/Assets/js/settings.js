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
                && entry.category !== ""
                && typeof entry.overridden === "boolean";
        });
    }

    function createFallbackLogo() {
        var namespace = "http://www.w3.org/2000/svg";

        var svg = document.createElementNS(namespace, "svg");

        svg.setAttribute("xmlns", namespace);
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("fill", "currentColor");
        svg.classList.add("app-icon");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("aria-hidden", "true");

        var path = document.createElementNS(namespace, "path");

        path.setAttribute(
            "d",
            "M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"
        );

        var path2 = document.createElementNS(namespace, "path");

        path2.setAttribute(
            "d",
            "M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"
        );

        svg.appendChild(path);
        svg.appendChild(path2);

        return svg;
    }

    function renderBrandLogo(logoUrl) {
        var mount = document.querySelector(
            "[data-app-brand-logo]"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        mount.classList.remove(
            "panel-sidebar-brand-mark-image",
            "panel-sidebar-brand-mark-fallback"
        );

        mount.replaceChildren();

        if (typeof logoUrl === "string" && logoUrl !== "") {
            var image = document.createElement("img");
            var separator = logoUrl.includes("?") ? "&" : "?";

            image.classList.add(
                "panel-sidebar-brand-image"
            );

            image.alt = "";
            image.src = logoUrl
                + separator
                + "v="
                + Date.now();

            mount.appendChild(image);

            mount.classList.add(
                "panel-sidebar-brand-mark-image"
            );

            return;
        }

        mount.appendChild(
            createFallbackLogo()
        );

        mount.classList.add(
            "panel-sidebar-brand-mark-fallback"
        );
    }

    function updateBranding(branding) {
        if (
            branding === null
            || typeof branding !== "object"
        ) {
            return;
        }

        if (typeof branding.logo === "string") {
            renderBrandLogo(
                branding.logo
            );
        }

        var nameMount = document.querySelector(
            "[data-app-brand-name]"
        );

        if (
            nameMount instanceof Element
            && typeof branding.name === "string"
        ) {
            nameMount.textContent = branding.name;
        }

        var footerMount = document.querySelector(
            ".panel-main-footer p, .panel-sidebar-footer p"
        );

        if (
            footerMount instanceof Element
            && typeof branding.footer === "string"
        ) {
            footerMount.textContent = branding.footer;
        }
    }

    function initializeSettings() {
        var mount = document.getElementById(
            "admin-system-settings"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        var entries = [];

        try {
            entries = normalizeEntries(
                JSON.parse(
                    mount.dataset.settingsEntries || "[]"
                )
            );
        } catch (_error) {
            entries = [];
        }

        var brandingEntries = entries.filter(function (entry) {
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

        var currentLogoValue = "";
        var logoFieldElement = null;
        var logoInputElement = null;
        var logoRemoveButton = null;
        var logoPreviewElement = null;

        var form = document.createElement("form");

        form.method = "post";
        form.action = "/admin/settings";
        form.enctype = "multipart/form-data";

        form.classList.add(
            "admin-system-settings-form"
        );

        var categoryCard = global.Builder.create(
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

        var categoryElement = categoryCard.element();

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

        var categoryBody = categoryElement.querySelector(
            '[data-card-region="body"]'
        );

        if (!(categoryBody instanceof Element)) {
            return;
        }

        function getLogoActionsElement() {
            if (!(logoFieldElement instanceof Element)) {
                return null;
            }

            return logoFieldElement.querySelector(
                ".admin-system-settings-logo-actions"
            );
        }

        function clearLogoRemovalState() {
            if (!(logoFieldElement instanceof Element)) {
                return;
            }

            var hiddenInput = logoFieldElement.querySelector(
                "[data-remove-application-logo]"
            );

            if (hiddenInput instanceof HTMLInputElement) {
                hiddenInput.value = "0";
            }

            logoFieldElement.classList.remove(
                "admin-system-settings-logo-pending-removal"
            );

            var note = logoFieldElement.querySelector(
                ".admin-system-settings-logo-removal-note"
            );

            if (note instanceof Element) {
                note.remove();
            }

            if (logoRemoveButton !== null) {
                logoRemoveButton.config({
                    label: "Remove",
                    disabled: false,
                });
            }
        }

        function removeLogoActions() {
            var actionsElement = getLogoActionsElement();

            if (actionsElement instanceof Element) {
                actionsElement.remove();
            }

            logoRemoveButton = null;
        }

        function removeLogoPreview() {
            if (logoPreviewElement instanceof Element) {
                logoPreviewElement.remove();
            }

            logoPreviewElement = null;
        }

        function createLogoPreview() {
            removeLogoPreview();

            if (
                currentLogoValue === ""
                || !(logoFieldElement instanceof Element)
                || !(logoInputElement instanceof HTMLInputElement)
            ) {
                return;
            }

            var previewElement = document.createElement("div");

            previewElement.classList.add(
                "admin-system-settings-logo-preview"
            );

            var imageElement = document.createElement("img");

            imageElement.classList.add(
                "admin-system-settings-logo-image"
            );

            var separator =
                currentLogoValue.includes("?") ? "&" : "?";

            imageElement.src =
                currentLogoValue
                + separator
                + "v="
                + Date.now();

            imageElement.alt = "Current application logo";

            previewElement.append(imageElement);

            // Make the preview clickable to trigger file input replacement.
            previewElement.setAttribute(
                "role",
                "button"
            );

            previewElement.setAttribute(
                "tabindex",
                "0"
            );

            previewElement.setAttribute(
                "aria-label",
                "Replace application logo"
            );

            function openLogoInput() {
                if (
                    logoInputElement
                    instanceof HTMLInputElement
                ) {
                    logoInputElement.click();
                }
            }

            previewElement.addEventListener(
                "click",
                openLogoInput
            );

            previewElement.addEventListener("keydown", function (event) {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();

                openLogoInput();
            });

            logoPreviewElement = previewElement;

            logoFieldElement.append(previewElement);
        }

        function renderLogoFieldState() {
            if (
                !(logoFieldElement instanceof Element)
                || !(logoInputElement instanceof HTMLInputElement)
            ) {
                return;
            }

            if (currentLogoValue === "") {
                logoInputElement.hidden = false;

                removeLogoPreview();
                removeLogoActions();

                return;
            }

            logoInputElement.hidden = true;

            createLogoPreview();
            createLogoActions();
        }

        function createLogoActions() {
            if (
                currentLogoValue === ""
                || !(logoFieldElement instanceof Element)
                || !(logoInputElement instanceof HTMLInputElement)
            ) {
                removeLogoActions();

                return;
            }

            removeLogoActions();

            var actionsElement = document.createElement("div");

            actionsElement.classList.add(
                "admin-system-settings-logo-actions"
            );

            var hiddenInput = document.createElement("input");

            hiddenInput.type = "hidden";
            hiddenInput.name =
                "actions[remove_application_logo]";
            hiddenInput.value = "0";

            hiddenInput.setAttribute(
                "data-remove-application-logo",
                "true"
            );

            var removeButton = global.Builder.create(
                "button",
                {
                    label: "Remove",
                    type: "button",
                    variant: "danger",
                    size: "small",
                    disabled: false,
                    loading: false,
                    title: "Remove current logo",
                }
            );

            var removeButtonElement = removeButton.element();

            if (!(removeButtonElement instanceof Element)) {
                return;
            }

            logoRemoveButton = removeButton;

            removeButtonElement.addEventListener(
                "click",
                function () {
                    hiddenInput.value = "1";
                    logoInputElement.value = "";
                    currentLogoValue = "";

                    removeLogoPreview();

                    logoInputElement.hidden = false;

                    actionsElement.hidden = true;
                }
            );

            actionsElement.append(hiddenInput);
            actionsElement.append(removeButtonElement);
            logoFieldElement.append(actionsElement);
        }

        brandingEntries.forEach(function (entry) {
            var controlId =
                "admin-setting-" + entry.key;

            var inputType =
                entry.type === "file"
                    ? "file"
                    : "text";

            var field = global.Builder.create(
                "form-field",
                {
                    controlId: controlId,
                    label: entry.label,
                    description: entry.description,
                    error: "",
                    required: false,
                }
            );

            var fieldElement = field.element();

            if (!(fieldElement instanceof Element)) {
                return;
            }

            fieldElement.setAttribute(
                "data-setting-key",
                entry.key
            );

            if (entry.type === "file") {
                currentLogoValue =
                    typeof entry.value === "string"
                        ? entry.value
                        : "";
            }

            var input = global.Builder.create(
                "input",
                {
                    type: inputType,
                    name:
                        inputType === "file"
                            ? "uploads[application_logo]"
                            : "settings[" + entry.key + "]",
                    value:
                        inputType === "file"
                            ? ""
                            : (
                                typeof entry.value === "string"
                                    ? entry.value
                                    : ""
                            ),
                    placeholder: "",
                    autocomplete: "",
                    accept:
                        inputType === "file"
                            ? ".png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp"
                            : "",
                    describedBy: field.descriptionId(),
                    multiple: false,
                    required: false,
                    disabled: false,
                    readonly: false,
                    invalid: false,
                }
            );

            var inputElement = input.element();

            if (!(inputElement instanceof HTMLInputElement)) {
                return;
            }

            inputElement.id = controlId;

            if (entry.type === "file") {
                logoFieldElement = fieldElement;
                logoInputElement = inputElement;

                inputElement.addEventListener(
                    "change",
                    function () {
                        clearLogoRemovalState();

                        if (
                            logoInputElement.files !== null
                            && logoInputElement.files.length > 0
                        ) {
                            var selectedFile =
                                logoInputElement.files.item(0);

                            if (selectedFile instanceof File) {
                                removeLogoPreview();

                                var previewElement =
                                    document.createElement("div");

                                previewElement.classList.add(
                                    "admin-system-settings-logo-preview"
                                );

                                var imageElement =
                                    document.createElement("img");

                                imageElement.classList.add(
                                    "admin-system-settings-logo-image"
                                );

                                imageElement.src =
                                    URL.createObjectURL(selectedFile);

                                imageElement.alt =
                                    "Selected application logo";

                                previewElement.append(imageElement);

                                logoPreviewElement = previewElement;

                                logoFieldElement.append(previewElement);
                            }
                        }
                    }
                );
            }

            input.appendTo(
                field.controlMount()
            );

            field.appendTo(
                categoryBody
            );

            if (entry.type === "file") {
                renderLogoFieldState();
            }
        });

        var actions = document.createElement("div");

        actions.classList.add(
            "admin-system-settings-actions"
        );

        var saveButton = global.Builder.create(
            "button",
            {
                label: "Save Settings",
                type: "submit",
                variant: "primary",
                size: "medium",
                disabled: false,
                loading: false,
                title: "Save Settings",
            }
        );

        categoryCard.appendTo(form);
        saveButton.appendTo(actions);
        form.append(actions);
        mount.append(form);

        var saveButtonElement = saveButton.element();

        if (!(saveButtonElement instanceof Element)) {
            return;
        }

        form.addEventListener(
            "submit",
            function (event) {
                event.preventDefault();

                saveButton.config({
                    loading: true,
                    disabled: true,
                });

                var formData = new FormData(form);

                fetch(
                    form.action,
                    {
                        method: "POST",
                        body: formData,
                        headers: {
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    }
                )
                    .then(function (response) {
                        return response.json().then(function (payload) {
                            return {
                                status: response.status,
                                payload: payload,
                            };
                        });
                    })
                    .then(function (result) {
                        var status = result.status;
                        var payload = result.payload;

                        if (
                            status < 200
                            || status >= 300
                            || payload === null
                            || typeof payload !== "object"
                            || payload.success !== true
                        ) {
                            return;
                        }

                        var settings =
                            payload.settings !== null
                            && typeof payload.settings === "object"
                                ? payload.settings
                                : {};

                        currentLogoValue =
                            typeof settings["application.logo"] === "string"
                                ? settings["application.logo"]
                                : "";

                        if (
                            payload.branding !== null
                            && typeof payload.branding === "object"
                        ) {
                            updateBranding(
                                payload.branding
                            );
                        }

                        if (
                            logoInputElement
                            instanceof HTMLInputElement
                        ) {
                            logoInputElement.value = "";
                        }

                        clearLogoRemovalState();

                        renderLogoFieldState();
                    })
                    .catch(function () {
                    })
                    .finally(function () {
                        saveButton.config({
                            loading: false,
                            disabled: false,
                        });
                    });
            }
        );
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

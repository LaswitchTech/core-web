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

    function isSortableAvailable() {
        return (
            typeof global.Sortable === "function"
            || (
                global.Sortable !== null
                && typeof global.Sortable === "object"
                && typeof global.Sortable.create
                    === "function"
            )
        );
    }

    function initializeOverview() {
        const mount = document.getElementById(
            "admin-overview-widgets"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        const controlsMount =
            document.getElementById(
                "admin-overview-customization-controls"
            );

        const endpoint =
            mount.dataset.overviewOrderEndpoint
            || "";

        const components =
            new Map();

        let sortable =
            null;

        let customizing =
            false;

        let originalOrder =
            [];

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

        async function persistOrder(
            action,
            order
        ) {
            if (endpoint === "") {
                throw new Error(
                    "Administration Overview ordering endpoint is missing."
                );
            }

            const formData =
                new FormData();

            formData.append(
                "action",
                action
            );

            if (Array.isArray(order)) {
                order.forEach(
                    function (id) {
                        formData.append(
                            "order[]",
                            id
                        );
                    }
                );
            }

            const response =
                await fetch(
                    endpoint,
                    {
                        method:
                            "POST",
                        body:
                            formData,
                        headers: {
                            "X-Requested-With":
                                "XMLHttpRequest",
                        },
                    }
                );

            const payload =
                await response.json();

            if (
                !response.ok
                || payload === null
                || typeof payload !== "object"
                || payload.success !== true
            ) {
                throw new Error(
                    payload !== null
                    && typeof payload === "object"
                    && typeof payload.message === "string"
                    && payload.message !== ""
                        ? payload.message
                        : "The Overview order could not be saved."
                );
            }

            return payload;
        }

        function destroySortable() {
            if (
                sortable !== null
                && typeof sortable.destroy
                    === "function"
            ) {
                sortable.destroy();
            }

            sortable =
                null;
        }

        function enableCustomization() {
            if (
                customizing
                || !isSortableAvailable()
            ) {
                return;
            }

            originalOrder =
                currentOrder();

            customizing =
                true;

            showMoveHandles();

            sortable =
                global.Sortable.create(
                    mount,
                    {
                        draggable:
                            ".admin-overview-sortable-entry",
                        handle:
                            ".admin-overview-move-handle",
                        animation:
                            150,
                        ghostClass:
                            "admin-overview-sortable-ghost",
                    }
                );

            mount.classList.add(
                "is-customizing"
            );

            renderControls();
        }

        function disableCustomization() {
            destroySortable();
            hideMoveHandles();

            customizing =
                false;

            mount.classList.remove(
                "is-customizing"
            );

            renderControls();
        }

        function showMoveHandles() {
            components.forEach(
                function (component) {
                    if (
                        typeof component.showMoveHandle
                            !== "function"
                    ) {
                        return;
                    }

                    component.showMoveHandle();

                    const element =
                        component.element();

                    if (!(element instanceof Element)) {
                        return;
                    }

                    const handle =
                        Array.from(
                            element.querySelectorAll(
                                "button"
                            )
                        ).find(
                            function (button) {
                                return Array.from(
                                    button.classList
                                ).some(
                                    function (className) {
                                        return className.endsWith(
                                            "-move-handle"
                                        );
                                    }
                                );
                            }
                        );

                    if (!(handle instanceof HTMLButtonElement)) {
                        return;
                    }

                    handle.classList.add(
                        "admin-overview-move-handle"
                    );

                    element.classList.add(
                        "admin-overview-sortable-entry"
                    );
                }
            );
        }

        function hideMoveHandles() {
            components.forEach(
                function (component) {
                    const element =
                        component.element();

                    if (element instanceof Element) {
                        element.classList.remove(
                            "admin-overview-sortable-entry"
                        );

                        element.querySelectorAll(
                            ".admin-overview-move-handle"
                        ).forEach(
                            function (handle) {
                                handle.classList.remove(
                                    "admin-overview-move-handle"
                                );
                            }
                        );
                    }

                    if (
                        typeof component.hideMoveHandle
                            === "function"
                    ) {
                        component.hideMoveHandle();
                    }
                }
            );
        }

        function currentOrder() {
            return Array.from(
                mount.querySelectorAll(
                    "[data-overview-entry]"
                )
            ).map(
                function (element) {
                    return element.getAttribute(
                        "data-overview-entry"
                    );
                }
            ).filter(
                function (id) {
                    return (
                        typeof id === "string"
                        && id !== ""
                    );
                }
            );
        }

        function restoreOrder(order) {
            order.forEach(
                function (id) {
                    const element =
                        mount.querySelector(
                            '[data-overview-entry="'
                            + CSS.escape(id)
                            + '"]'
                        );

                    if (element instanceof Element) {
                        mount.append(
                            element
                        );
                    }
                }
            );
        }

        function renderControls() {
            if (!(controlsMount instanceof Element)) {
                return;
            }

            controlsMount.replaceChildren();

            if (
                !isSortableAvailable()
                || !global.Builder.has(
                    "button-group"
                )
            ) {
                return;
            }

            const buttons =
                customizing
                    ? [
                        {
                            label:
                                "Save",
                            variant:
                                "primary",
                            callback:
                                async function () {
                                    await persistOrder(
                                        "save",
                                        currentOrder()
                                    );

                                    disableCustomization();
                                },
                        },
                        {
                            label:
                                "Reset",
                            variant:
                                "secondary",
                            callback:
                                async function () {
                                    await persistOrder(
                                        "reset",
                                        []
                                    );

                                    global.location.reload();
                                },
                        },
                        {
                            label:
                                "Cancel",
                            variant:
                                "secondary",
                            callback:
                                function () {
                                    restoreOrder(
                                        originalOrder
                                    );

                                    disableCustomization();
                                },
                        },
                    ]
                    : [
                        {
                            label:
                                "Customize Overview",
                            variant:
                                "secondary",
                            callback:
                                function () {
                                    enableCustomization();
                                },
                        },
                    ];

            global.Builder.create(
                "button-group",
                {
                    buttons:
                        buttons,
                    orientation:
                        "horizontal",
                    presentation:
                        "spaced",
                    equalWidth:
                        false,
                    wrap:
                        true,
                }
            ).appendTo(
                controlsMount
            );
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

            components.set(
                entry.id,
                component
            );
        });

        renderControls();
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

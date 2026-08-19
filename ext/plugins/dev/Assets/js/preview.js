(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Theme Preview."
        );
    }

    const VCARD_PREVIEW_ICONS = Object.freeze({
        email: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>',
            '<path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/>',
            "</svg>",
        ].join(""),
        phone: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>',
            "</svg>",
        ].join(""),
        address: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>',
            '<path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>',
            "</svg>",
        ].join(""),
        status: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/>',
            '<path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>',
            "</svg>",
        ].join(""),
    });

    const TABS_PREVIEW_ICONS = Object.freeze({
        overview: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M0 0h6v6H0zm10 0h6v6h-6zM0 10h6v6H0zm10 0h6v6h-6z"/>',
            "</svg>",
        ].join(""),
    });

    const DROPDOWN_PREVIEW_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        edit: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1-2-2 1-1a.5.5 0 0 1 .707 0zM13.5 4.207l-2-2L4 9.707V11.5h1.793z"/>',
            '<path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>',
            "</svg>",
        ].join(""),
    });

    const ALERT_PREVIEW_ICONS = Object.freeze({
        info: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>',
            "</svg>",
        ].join(""),
    });

    function createSection(
        mount,
        title,
        description
    ) {
        const section =
            document.createElement(
                "section"
            );

        const headingRow =
            document.createElement(
                "div"
            );

        const heading =
            document.createElement(
                "h2"
            );

        const controls =
            document.createElement(
                "div"
            );

        const text =
            document.createElement(
                "p"
            );

        const examples =
            document.createElement(
                "div"
            );

        section.classList.add(
            "dev-theme-preview-section"
        );

        headingRow.classList.add(
            "dev-theme-preview-section-heading"
        );

        controls.classList.add(
            "dev-theme-preview-section-controls"
        );

        heading.classList.add(
            "dev-theme-preview-section-title"
        );

        text.classList.add(
            "dev-theme-preview-section-description"
        );

        examples.classList.add(
            "dev-theme-preview-examples"
        );

        global.Builder.text(
            heading,
            title
        );

        global.Builder.text(
            text,
            description
        );

        headingRow.append(
            heading,
            controls
        );

        section.append(
            headingRow,
            text,
            examples
        );

        mount.append(
            section
        );

        return examples;
    }

    function createToggleControl(
        examples,
        label,
        initialEnabled,
        callback
    ) {
        const section =
            examples.closest(
                ".dev-theme-preview-section"
            );

        if (!(section instanceof Element)) {
            return null;
        }

        const controls =
            section.querySelector(
                ".dev-theme-preview-section-controls"
            );

        if (!(controls instanceof Element)) {
            return null;
        }

        let enabled =
            initialEnabled === true;

        const button =
            global.Builder.create(
                "button",
                {
                    label:
                        label
                        + ": "
                        + (
                            enabled
                                ? "On"
                                : "Off"
                        ),
                    variant:
                        enabled
                            ? "primary"
                            : "secondary",
                    size: "small",
                }
            );

        button.appendTo(
            controls
        );

        const element =
            button.element();

        if (!(element instanceof HTMLButtonElement)) {
            return button;
        }

        element.addEventListener(
            "click",
            function () {
                enabled = !enabled;

                button.config(
                    "label",
                    label
                    + ": "
                    + (
                        enabled
                            ? "On"
                            : "Off"
                    )
                );

                button.config(
                    "variant",
                    enabled
                        ? "primary"
                        : "secondary"
                );

                button.refresh();

                callback(
                    enabled
                );
            }
        );

        return button;
    }

    function initializeThemePreview() {
        const mount =
            document.getElementById(
                "dev-theme-preview"
            );

        if (!(mount instanceof Element)) {
            return;
        }


        const alertExamples =
            createSection(
                mount,
                "Alert",
                "Inline alerts with semantic colors, optional title, icon, content, and dismiss behavior."
            );

        if (global.Builder.has("alert")) {
            [
                "primary",
                "secondary",
                "success",
                "danger",
                "warning",
                "info",
                "light",
                "dark",
            ].forEach(function (color) {
                global.Builder.create(
                    "alert",
                    {
                        title:
                            color.charAt(0)
                                .toUpperCase()
                            + color.slice(1)
                            + " Alert",
                        content:
                            "<p>This is the "
                            + color
                            + " semantic Alert example.</p>",
                        color:
                            color,
                        dismissible:
                            color === "primary",
                        onDismiss:
                            color === "primary"
                                ? function () {}
                                : null,
                        icon:
                            color === "info"
                                ? ALERT_PREVIEW_ICONS.info
                                : "",
                    }
                ).appendTo(
                    alertExamples
                );
            });
        }

        const toastExamples =
            createSection(
                mount,
                "Toast",
                "Transient notification with semantic color, optional icon, dismiss control, and automatic dismissal."
            );

        if (global.Builder.has("toast")) {
            global.Builder.create(
                "toast",
                {
                    title:
                        "Example Toast",
                    content:
                        "<p>This persistent example allows the Toast presentation and dismiss behavior to be reviewed.</p>",
                    color:
                        "info",
                    icon:
                        ALERT_PREVIEW_ICONS.info,
                    dismissible:
                        true,
                    persistent:
                        true,
                }
            ).appendTo(
                toastExamples
            );

            global.Builder.create(
                "toast",
                {
                    title:
                        "Auto-dismiss Toast",
                    content:
                        "<p>This Toast demonstrates the automatic-dismiss timer and progress indicator.</p>",
                    color:
                        "success",
                    dismissible:
                        true,
                    persistent:
                        false,
                    delay:
                        15000,
                }
            ).appendTo(
                toastExamples
            );
        }

        const toastAreaExamples =
            createSection(
                mount,
                "Toast Area",
                "Viewport-positioned Toast collection with configurable placement, stacking, and collection controls."
            );

        if (
            global.Builder.has("toast-area")
            && global.Builder.has("button")
        ) {
            const toastArea =
                global.Builder.create(
                    "toast-area",
                    {
                        position:
                            "bottom-right",
                    }
                );

            toastArea.appendTo(
                document.body
            );

            const toastAreaViewport =
                document.createElement(
                    "div"
                );

            toastAreaViewport.classList.add(
                "dev-toast-area-viewport"
            );

            [
                "top-left",
                "top-center",
                "top-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
            ].forEach(function (position) {
                const positionButton =
                    global.Builder.create(
                        "button",
                        {
                            label:
                                position
                                    .split("-")
                                    .map(
                                        function (part) {
                                            return part
                                                .charAt(0)
                                                .toUpperCase()
                                                + part.slice(1);
                                        }
                                    )
                                    .join(" "),
                            variant:
                                position === "bottom-right"
                                    ? "primary"
                                    : "secondary",
                            size:
                                "small",
                            callback:
                                function () {
                                    toastArea.setPosition(
                                        position
                                    );

                                    toastAreaViewport
                                        .querySelectorAll(
                                            ".app-button"
                                        )
                                        .forEach(
                                            function (button) {
                                                button.classList.remove(
                                                    "app-button-primary"
                                                );

                                                button.classList.add(
                                                    "app-button-secondary"
                                                );
                                            }
                                        );

                                    const element =
                                        positionButton.element();

                                    if (
                                        element
                                        instanceof HTMLButtonElement
                                    ) {
                                        element.classList.remove(
                                            "app-button-secondary"
                                        );

                                        element.classList.add(
                                            "app-button-primary"
                                        );
                                    }
                                },
                        }
                    );

                const element =
                    positionButton.element();

                if (
                    element
                    instanceof HTMLButtonElement
                ) {
                    element.setAttribute(
                        "data-toast-area-preview-position",
                        position
                    );
                }

                positionButton.appendTo(
                    toastAreaViewport
                );
            });

            toastAreaExamples.append(
                toastAreaViewport
            );

            global.Builder.create(
                "button",
                {
                    label:
                        "Add Toast",
                    variant:
                        "primary",
                    size:
                        "small",
                    callback:
                        function () {
                            toastArea.addToast({
                                title:
                                    "Toast Area Example",
                                content:
                                    "<p>This Toast was added through Toast Area.</p>",
                                color:
                                    "success",
                                dismissible:
                                    true,
                                delay:
                                    10000,
                                persistent:
                                    false,
                            });
                        },
                }
            ).appendTo(
                toastAreaExamples
            );

            global.Builder.create(
                "button",
                {
                    label:
                        "Clear Toasts",
                    variant:
                        "secondary",
                    size:
                        "small",
                    callback:
                        function () {
                            toastArea.clearToasts();
                        },
                }
            ).appendTo(
                toastAreaExamples
            );

            global.devToastArea =
                toastArea;
        }

        const modalExamples =
            createSection(
                mount,
                "Modal",
                "Dialog component with semantic colors, configurable sizes, fullscreen, close, overflow actions, backdrop closing, and keyboard accessibility."
            );

        if (
            global.Builder.has("modal")
            && global.Builder.has("button")
        ) {
            [
                {
                    size:
                        "small",
                    color:
                        "primary",
                    footer:
                        "default",
                    okLabel:
                        "Install",
                },
                {
                    size:
                        "medium",
                    color:
                        "success",
                },
                {
                    size:
                        "large",
                    color:
                        "warning",
                },
                {
                    size:
                        "xlarge",
                    color:
                        "danger",
                },
            ].forEach(function (example) {
                const modal =
                    global.Builder.create(
                        "modal",
                        {
                            title:
                                example.size
                                    .charAt(0)
                                    .toUpperCase()
                                + example.size.slice(1)
                                + " Modal",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            body:
                                example.size === "xlarge"
                                    ? [
                                        "<p>This xlarge Modal includes enough content to demonstrate the scrollable Modal body.</p>",
                                        "<h3>Modal body scrolling</h3>",
                                        "<p>The Modal body is constrained to a maximum height so longer content remains contained within the dialog instead of expanding beyond the viewport.</p>",
                                        "<p>When this content exceeds the available body height, the body becomes vertically scrollable while the header and footer remain visible.</p>",
                                        "<h3>Header and footer</h3>",
                                        "<p>The Modal header contains the title, optional icon, fullscreen control, close control, and overflow action menu.</p>",
                                        "<p>The footer remains outside the scrolling body so important actions or contextual information can stay visible while the body content is reviewed.</p>",
                                        "<h3>Responsive behavior</h3>",
                                        "<p>The Modal remains constrained by the viewport and should continue to behave predictably across different screen sizes.</p>",
                                        "<p>Long content should never force the entire dialog beyond the available viewport height.</p>",
                                        "<h3>Fullscreen behavior</h3>",
                                        "<p>The fullscreen control expands the Modal to use the full viewport while preserving the same header, body, and footer structure.</p>",
                                        "<p>In fullscreen mode, the body can use the remaining available height instead of retaining the normal 75-percent viewport-height limit.</p>",
                                        "<h3>Accessibility</h3>",
                                        "<p>Keyboard focus remains inside the open Modal, Escape can close it when enabled, and focus returns to the element that opened the Modal.</p>",
                                        "<p>The body scrollbar must remain keyboard-accessible without interfering with the Modal controls.</p>",
                                        "<h3>Additional content</h3>",
                                        "<p>This additional section intentionally increases the content height so the preview consistently exercises vertical overflow.</p>",
                                        "<p>The scrollbar should appear inside the Modal body while the colored header and footer remain stationary.</p>",
                                        "<h3>Final section</h3>",
                                        "<p>This final section confirms that content near the bottom of a long Modal remains reachable through normal body scrolling.</p>",
                                        "<p>If this paragraph is visible after scrolling, the overflow behavior is working as intended.</p>",
                                    ].join("")
                                    : (
                                        "<p>This example demonstrates the "
                                        + example.size
                                        + " Modal size and "
                                        + example.color
                                        + " semantic color.</p><p>Use the header controls, Escape key, or backdrop to close the Modal.</p>"
                                    ),
                            footer:
                                typeof example.footer === "string"
                                    ? example.footer
                                    : "",
                            okLabel:
                                typeof example.okLabel === "string"
                                    ? example.okLabel
                                    : "Ok",
                            size:
                                example.size,
                            color:
                                example.color,
                            fullscreenControlVisible:
                                true,
                            closeControlVisible:
                                true,
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                {
                                    label:
                                        "Inspect",
                                    callback:
                                        function () {},
                                },
                                {
                                    label:
                                        "Another action",
                                    callback:
                                        function () {},
                                },
                            ],
                            closeOnEscape:
                                true,
                            closeOnBackdrop:
                                true,
                        }
                    );

                modal.appendTo(
                    document.body
                );

                global.Builder.create(
                    "button",
                    {
                        label:
                            "Open "
                            + example.size
                                .charAt(0)
                                .toUpperCase()
                            + example.size.slice(1)
                            + " Modal",
                        variant:
                            example.color,
                        size:
                            "small",
                        callback:
                            function () {
                                modal.open();
                            },
                    }
                ).appendTo(
                    modalExamples
                );
            });
        }

        const offcanvasExamples =
            createSection(
                mount,
                "Offcanvas",
                "Sliding overlay panel with configurable placement, size, semantic color, backdrop, close control, and keyboard accessibility."
            );

        if (
            global.Builder.has("offcanvas")
            && global.Builder.has("button")
        ) {
            [
                {
                    placement:
                        "left",
                    size:
                        "small",
                    color:
                        "primary",
                },
                {
                    placement:
                        "right",
                    size:
                        "medium",
                    color:
                        "success",
                },
                {
                    placement:
                        "top",
                    size:
                        "medium",
                    color:
                        "warning",
                },
                {
                    placement:
                        "bottom",
                    size:
                        "large",
                    color:
                        "danger",
                },
            ].forEach(function (example) {
                const label =
                    example.placement
                        .charAt(0)
                        .toUpperCase()
                    + example.placement.slice(1);

                const offcanvas =
                    global.Builder.create(
                        "offcanvas",
                        {
                            title:
                                label
                                + " Offcanvas",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            body:
                                "<p>This Offcanvas demonstrates the "
                                + example.placement
                                + " placement, "
                                + example.size
                                + " size, and "
                                + example.color
                                + " semantic color.</p><p>Use the close control, Escape key, or backdrop to close the panel.</p>",
                            footer:
                                "<span>Offcanvas footer example</span>",
                            placement:
                                example.placement,
                            size:
                                example.size,
                            color:
                                example.color,
                            backdrop:
                                true,
                            fullscreenControlVisible:
                                true,
                            closeControlVisible:
                                true,
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                 {
                                    label:
                                         "Inspect",
                                    callback:
                                        function () {},
                                 },
                                 {
                                    label:
                                         "Another action",
                                    callback:
                                        function () {},
                                 },
                             ],
                            closeOnEscape:
                                true,
                            closeOnBackdrop:
                                true,
                        }
                    );

                offcanvas.appendTo(
                    document.body
                );

                global.Builder.create(
                    "button",
                    {
                        label:
                            "Open "
                            + label
                            + " Offcanvas",
                        variant:
                            example.color,
                        size:
                            "small",
                        callback:
                            function () {
                                offcanvas.open();
                            },
                    }
                ).appendTo(
                    offcanvasExamples
                );
            });
        }

        const avatarExamples =
            createSection(
                mount,
                "Avatar",
                "Reusable profile image with initials fallback, standardized sizes, optional link, and broken-image fallback."
            );

        if (global.Builder.has("avatar")) {

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Alex Morgan",
                    size:
                        "small",
                }
            ).appendTo(
                avatarExamples
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Jamie Rivera",
                    size:
                        "medium",
                    href:
                        "/admin/dev/preview",
                }
            ).appendTo(
                avatarExamples
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Taylor Chen",
                    src:
                        "https://picsum.photos/200/200",
                    size:
                        "large",
                }
            ).appendTo(
                avatarExamples
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Morgan Lee",
                    src:
                        "/this-avatar-does-not-exist.png",
                    size:
                        "medium",
                }
            ).appendTo(
                avatarExamples
            );
        }

        const badgeExamples =
            createSection(
                mount,
                "Badge",
                "Status and summary badge examples."
            );

        if (global.Builder.has("badge")) {
            const badgeOne =
                global.Builder.create(
                    "badge",
                    {
                        value: "42",
                        label: "Primary Badge",
                        color: "primary",
                        tooltip:
                            "Primary badge example",
                    }
                );

            const badgeTwo =
                global.Builder.create(
                    "badge",
                    {
                        value: "17",
                        label: "Success Badge",
                        color: "success",
                        tooltip:
                            "Success badge example",
                    }
                );

            badgeOne.appendTo(
                badgeExamples
            );

            badgeTwo.appendTo(
                badgeExamples
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                let badgeSortable =
                    null;

                createToggleControl(
                    badgeExamples,
                    "Sortable",
                    false,
                    function (enabled) {
                        if (
                            badgeSortable !== null
                            && typeof badgeSortable.destroy
                                === "function"
                        ) {
                            badgeSortable.destroy();
                            badgeSortable = null;
                        }

                        if (!enabled) {
                            badgeOne.hideMoveHandle();
                            badgeTwo.hideMoveHandle();
                            return;
                        }

                        badgeOne.showMoveHandle();
                        badgeTwo.showMoveHandle();

                        badgeSortable =
                            global.Sortable.create(
                                badgeExamples,
                                {
                                    draggable:
                                        ".app-badge",
                                    handle:
                                        ".app-badge-move-handle",
                                    animation: 150,
                                }
                            );
                    }
                );
            }
        }

        const cardExamples =
            createSection(
                mount,
                "Card",
                "Card layout and interactive control examples."
            );

        if (global.Builder.has("card")) {
            const cardOne =
                global.Builder.create(
                    "card",
                    {
                        title: "Example Card One",
                        content:
                            "<p>Theme preview card content.</p>",
                        footer:
                            "Example footer",
                        controlMenuEnabled: true,
                        controlMenuItems: [
                            {
                                label:
                                    "Inspect",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Remove",
                                callback:
                                    function () {},
                            },
                        ],
                        collapseControlVisible: true,
                        fullscreenControlVisible: true,
                        closeControlVisible: true,
                    }
                );

            const cardTwo =
                global.Builder.create(
                    "card",
                    {
                        title: "Example Card Two",
                        content:
                            "<p>Second card for sortable testing.</p>",
                        footer:
                            "Example footer",
                                                controlMenuEnabled: true,
                        controlMenuItems: [
                            {
                                label:
                                    "Edit",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Archive",
                                callback:
                                    function () {},
                            },
                        ],
                        collapseControlVisible: true,

                        fullscreenControlVisible: true,
                        closeControlVisible: true,
                    }
                );

            cardOne.appendTo(
                cardExamples
            );

            cardTwo.appendTo(
                cardExamples
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                let cardSortable =
                    null;

                createToggleControl(
                    cardExamples,
                    "Sortable",
                    false,
                    function (enabled) {
                        if (
                            cardSortable !== null
                            && typeof cardSortable.destroy
                                === "function"
                        ) {
                            cardSortable.destroy();
                            cardSortable = null;
                        }

                        if (!enabled) {
                            cardOne.hideMoveHandle();
                            cardTwo.hideMoveHandle();
                            return;
                        }

                        cardOne.showMoveHandle();
                        cardTwo.showMoveHandle();

                        cardSortable =
                            global.Sortable.create(
                                cardExamples,
                                {
                                    draggable:
                                        ".app-card",
                                    handle:
                                        ".app-card-move-handle",
                                    animation: 150,
                                }
                            );
                    }
                );
            }
        }

        const collapseExamples =
            createSection(
                mount,
                "Collapse",
                "Reusable content region with programmatic collapse, expand, and toggle behavior."
            );

        if (
            global.Builder.has("collapse")
            && global.Builder.has("button")
        ) {
            const collapseExample =
                global.Builder.create(
                    "collapse",
                    {
                        content:
                            "<p>This content is controlled by the reusable Collapse component.</p><p>The trigger remains external so any component can control the collapsed state.</p>",
                        collapsed:
                            false,
                    }
                );

            global.Builder.create(
                "button",
                {
                    label:
                        "Toggle Collapse",
                    variant:
                        "primary",
                    size:
                        "small",
                    callback:
                        function () {
                            collapseExample.toggle();
                        },
                }
            ).appendTo(
                collapseExamples
            );

            collapseExample.appendTo(
                collapseExamples
            );
        }

        const dropdownExamples =
            createSection(
                mount,
                "Dropdown",
                "Reusable action dropdown with label, icon, links, callbacks, and disabled items."
            );

        if (global.Builder.has("dropdown")) {
            global.Builder.create(
                "dropdown",
                {
                    triggerLabel:
                        "Actions",
                    triggerIcon:
                        DROPDOWN_PREVIEW_ICONS.menu,
                    triggerTitle:
                        "Actions",
                    items: [
                        {
                            label:
                                "Edit",
                            icon:
                                DROPDOWN_PREVIEW_ICONS.edit,
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Open Preview",
                            href:
                                "/admin/dev/preview",
                        },
                        {
                            label:
                                "Disabled",
                            disabled:
                                true,
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                dropdownExamples
            );

            global.Builder.create(
                "dropdown",
                {
                    triggerIcon:
                        DROPDOWN_PREVIEW_ICONS.menu,
                    triggerTitle:
                        "More actions",
                    items: [
                        {
                            label:
                                "Edit",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Remove",
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                dropdownExamples
            );
        }

        const fieldExamples =
            createSection(
                mount,
                "Form Field",
                "Form field label, description, and validation structure."
            );

        if (global.Builder.has("form-field")) {
            global.Builder.create(
                "form-field",
                {
                    controlId:
                        "dev-preview-field",
                    label:
                        "Example Field",
                    description:
                        "Example field description.",
                    error: "",
                    required: true,
                }
            ).appendTo(
                fieldExamples
            );
        }

        const inputExamples =
            createSection(
                mount,
                "Input",
                "Input controls and input-group behavior."
            );

        if (global.Builder.has("input")) {
            global.Builder.create(
                "input",
                {
                    type: "text",
                    name:
                        "dev-preview-input",
                    value:
                        "Example value",
                    label:
                        "Text Input",
                    placeholder:
                        "Example placeholder",
                    clearActionEnabled: true,
                }
            ).appendTo(
                inputExamples
            );
        }

        const selectExamples =
            createSection(
                mount,
                "Select",
                "Native Select and optional Select2 integration."
            );

        if (global.Builder.has("select")) {
            const selectExample =
                global.Builder.create(
                    "select",
                    {
                        name:
                            "dev-preview-select",
                        label:
                            "Example Select",
                        options: [
                            {
                                value: "one",
                                label: "Option One",
                            },
                            {
                                value: "two",
                                label: "Option Two",
                            },
                            {
                                value: "three",
                                label: "Option Three",
                            },
                        ],
                        value: "one",
                        select2Enabled: false,
                    }
                );

            selectExample.appendTo(
                selectExamples
            );

            if (
                global.jQuery
                && global.jQuery.fn
                && typeof global.jQuery.fn.select2
                    === "function"
            ) {
                createToggleControl(
                    selectExamples,
                    "Select2",
                    false,
                    function (enabled) {
                        selectExample.config(
                            "select2Enabled",
                            enabled
                        );

                        selectExample.refresh();
                    }
                );
            }
        }

        const vcardExamples =
            createSection(
                mount,
                "vCard",
                "Contact and organization identity card examples."
            );

        if (global.Builder.has("vcard")) {
            const vcardConfigs = [
                {
                    name: "Alex Morgan",
                    organization: "Core-Web",
                    title: "Developer",
                    tags: [
                        "Administrator",
                        "Engineering",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "alex@example.com",
                            href: "mailto:alex@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2026",
                            href: "tel:+15550102026",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "123 Example Street, Montreal, QC",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Status",
                            value: "Active · Full-time",
                        },
                    ],
                    links: [
                        {
                            label: "Website",
                            href: "https://example.com",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Jamie Rivera",
                    organization: "Example Inc.",
                    title: "Operations Manager",
                    tags: [
                        "Manager",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "jamie@example.com",
                            href: "mailto:jamie@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2027",
                            href: "tel:+15550102027",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "456 Example Avenue, Toronto, ON",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Department",
                            value: "Operations · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Taylor Chen",
                    organization: "Core-Web",
                    title: "Designer",
                    tags: [
                        "Design",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "taylor@example.com",
                            href: "mailto:taylor@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2028",
                            href: "tel:+15550102028",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "789 Example Road, Vancouver, BC",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Work",
                            value: "UI/UX · Remote",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Morgan Patel",
                    organization: "Example Inc.",
                    title: "Account Manager",
                    tags: [
                        "Sales",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "morgan@example.com",
                            href: "mailto:morgan@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2029",
                            href: "tel:+15550102029",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "101 Example Boulevard, Ottawa, ON",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Department",
                            value: "Accounts · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Jordan Smith",
                    organization: "Core-Web",
                    title: "Support Specialist",
                    tags: [
                        "Support",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "jordan@example.com",
                            href: "mailto:jordan@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2030",
                            href: "tel:+15550102030",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "202 Example Lane, Calgary, AB",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Support",
                            value: "Tier 2 · Online",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Casey Williams",
                    organization: "Example Inc.",
                    title: "Project Coordinator",
                    tags: [
                        "Projects",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "casey@example.com",
                            href: "mailto:casey@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2031",
                            href: "tel:+15550102031",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "303 Example Drive, Halifax, NS",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Role",
                            value: "Coordinator · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
            ];

            const vcardGrid =
                global.Builder.create(
                    "vcard-grid",
                    {
                        items:
                            vcardConfigs,
                        searchEnabled:
                            true,
                        sortableEnabled:
                            false,
                        searchPlaceholder:
                            "Search contacts…",
                        emptyMessage:
                            "No matching contacts.",
                    }
                );

            vcardGrid.appendTo(
                vcardExamples
            );


            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                createToggleControl(
                    vcardExamples,
                    "Sortable",
                    false,
                    function (enabled) {
                        vcardGrid.config(
                            "sortableEnabled",
                            enabled
                        );

                        vcardGrid.refresh();
                    }
                );
            }
        }

        const listExamples =
            createSection(
                mount,
                "List",
                "Searchable and sortable list with optional actions."
            );

        if (global.Builder.has("list")) {
            const listExample =
                global.Builder.create(
                    "list",
                    {
                        searchEnabled: true,
                        sortableEnabled: false,
                        items: [
                            {
                                id: "alpha",
                                title: "Alpha",
                                description:
                                    "First example list item.",
                                metadata: [
                                    "Example",
                                    "Enabled",
                                ],
                                actions: [
                                    {
                                        label: "Inspect",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id: "bravo",
                                title: "Bravo",
                                description:
                                    "Second example list item.",
                                metadata: [
                                    "Example",
                                ],
                                actions: [
                                    {
                                        label: "Edit",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label: "Remove",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                        ],
                    }
                );

            listExample.appendTo(
                listExamples
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                createToggleControl(
                    listExamples,
                    "Sortable",
                    false,
                    function (enabled) {
                        listExample.config(
                            "sortableEnabled",
                            enabled
                        );

                        listExample.refresh();
                    }
                );
            }
        }

        const tableExamples =
            createSection(
                mount,
                "Table",
                "Structured tabular data with optional DataTables enhancement."
            );

        if (global.Builder.has("table")) {
            const tableExample =
                global.Builder.create(
                    "table",
                    {
                        caption:
                            "Example Table",
                        columns: [
                            {
                                key: "name",
                                label: "Name",
                            },
                            {
                                key: "status",
                                label: "Status",
                            },
                        ],
                        rows: [
                            {
                                name: "Alpha",
                                status: "Enabled",
                            },
                            {
                                name: "Bravo",
                                status: "Disabled",
                            },
                        ],
                        actions: [
                            {
                                id: "inspect",
                                label: "Inspect",
                                handler:
                                    function () {},
                                visible:
                                    function (
                                        row
                                    ) {
                                        return row.name
                                            === "Alpha";
                                    },
                            },
                            {
                                id: "edit",
                                label: "Edit",
                                handler:
                                    function () {},
                            },
                            {
                                id: "remove",
                                label: "Remove",
                                handler:
                                    function () {},
                                disabled:
                                    function (
                                        row,
                                        rowIndex,
                                        table,
                                        context
                                    ) {
                                        return !context
                                            .selectedRowIndexes
                                            .includes(
                                                rowIndex
                                            );
                                    },
                            },
                        ],
                        selectable: true,
                        multiSelect: true,
                        dataTableEnabled: false,
                    }
                );

            tableExample.appendTo(
                tableExamples
            );

            if (
                typeof global.DataTable === "function"
                || (
                    global.jQuery
                    && global.jQuery.fn
                    && typeof global.jQuery.fn.dataTable
                        === "function"
                )
            ) {
                createToggleControl(
                    tableExamples,
                    "DataTables",
                    false,
                    function (enabled) {
                        tableExample.config(
                            "dataTableEnabled",
                            enabled
                        );

                        tableExample.refresh();
                    }
                );
            }
        }

        const tabsExamples =
            createSection(
                mount,
                "Tabs",
                "Tabbed content with programmatic selection, disabled tabs, icons, and keyboard navigation."
            );

        if (global.Builder.has("tabs")) {
            const tabsExample =
                global.Builder.create(
                    "tabs",
                    {
                        selectedTab:
                            "overview",
                        actions: [
                            {
                                label:
                                    "Refresh",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Settings",
                                callback:
                                    function () {},
                            },
                        ],
                        tabs: [
                            {
                                id:
                                    "overview",
                                label:
                                    "Overview",
                                icon:
                                    TABS_PREVIEW_ICONS.overview,
                                content:
                                    "<p>Overview tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Edit overview",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label:
                                            "Export overview",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "details",
                                label:
                                    "Details",
                                content:
                                    "<p>Details tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Edit details",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label:
                                            "Copy details",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "activity",
                                label:
                                    "Activity",
                                content:
                                    "<p>Activity tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Clear activity",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "disabled",
                                label:
                                    "Disabled",
                                content:
                                    "<p>This content should not be selectable while the tab is disabled.</p>",
                                disabled:
                                    true,
                            },
                        ],
                    }
                );

            tabsExample.appendTo(
                tabsExamples
            );

            global.Builder.create(
                "tabs",
                {
                    presentation:
                        "pills",
                    selectedTab:
                        "overview",
                    actions: [
                        {
                            label:
                                "Refresh",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Settings",
                            callback:
                                function () {},
                        },
                    ],
                    tabs: [
                        {
                            id:
                                "overview",
                            label:
                                "Overview",
                            icon:
                                TABS_PREVIEW_ICONS.overview,
                            content:
                                "<p>Pill-style overview content.</p>",
                        },
                        {
                            id:
                                "details",
                            label:
                                "Details",
                            content:
                                "<p>Pill-style details content.</p>",
                        },
                        {
                            id:
                                "activity",
                            label:
                                "Activity",
                            content:
                                "<p>Pill-style activity content.</p>",
                        },
                        {
                            id:
                                "disabled",
                            label:
                                "Disabled",
                            content:
                                "<p>This pill should remain disabled.</p>",
                            disabled:
                                true,
                        },
                    ],
                }
            ).appendTo(
                tabsExamples
            );

            global.devTabsExample =
                tabsExample;
        }

        const postExamples =
            createSection(
                mount,
                "Post",
                "Social-style post with author identity, categories, attachments, actions, and optional comments."
            );

        if (global.Builder.has("post")) {
            global.Builder.create(
                "post",
                {
                    author: {
                        name:
                            "Alex Morgan",
                        title:
                            "Developer",
                        href:
                            "/admin/dev/preview",
                    },
                    timestamp:
                        "2026-08-17T10:30:00-04:00",
                    content:
                        "<p>This Post example exercises identity, relative time, categories, attachments, overflow actions, and direct social actions.</p><p>It also provides enough content to evaluate spacing between the different Post regions.</p>",
                    categories: [
                        "Announcement",
                        "Engineering",
                    ],
                    status:
                        "Published",
                    attachments: [
                        {
                            type:
                                "image",
                            label:
                                "Preview image",
                            url:
                                "/admin/dev/preview",
                            preview:
                                "https://picsum.photos/800/450",
                            metadata:
                                "Image · 800 × 450",
                        },
                        {
                            type:
                                "file",
                            label:
                                "Project notes.pdf",
                            url:
                                "/admin/dev/preview",
                            metadata:
                                "PDF · 2.4 MB",
                        },
                    ],
                    editControlVisible:
                        true,
                    deleteControlVisible:
                        true,
                    archiveControlVisible:
                        true,
                    likeControlVisible:
                        true,
                    shareControlVisible:
                        true,
                    commentsControlVisible:
                        true,
                    liked:
                        true,
                    shared:
                        false,
                    likeCount:
                        12,
                    shareCount:
                        4,
                    commentCount:
                        3,
                    onEdit:
                        function () {},
                    onDelete:
                        function () {},
                    onArchive:
                        function () {},
                    onLike:
                        function () {},
                    onShare:
                        function () {},
                    onViewComments:
                        function () {},
                }
            ).appendTo(
                postExamples
            );

            global.Builder.create(
                "post",
                {
                    author: {
                        name:
                            "Jamie Rivera",
                        title:
                            "Operations Manager",
                    },
                    timestamp:
                        "2026-08-17T11:15:00-04:00",
                    content:
                        "<p>This Post demonstrates the embedded Comments component.</p>",
                    categories: [
                        "Discussion",
                    ],
                    status:
                        "Draft",
                    commentsControlVisible:
                        true,
                    commentCount:
                        2,
                    onViewComments:
                        function () {},
                    commentsVisible:
                        false,
                    commentsConfig: {
                        title:
                            "Discussion",
                        titleVisible:
                            true,
                        indentationEnabled:
                            true,
                        maxIndentDepth:
                            3,
                    },
                    comments: [
                        {
                            id:
                                "post-comment-one",
                            author: {
                                name:
                                    "Taylor Chen",
                                title:
                                    "Designer",
                            },
                            timestamp:
                                "2026-08-17T11:20:00-04:00",
                            content:
                                "<p>The embedded Comments layout looks good here.</p>",
                            likeControlVisible:
                                true,
                            replyControlVisible:
                                true,
                            likeCount:
                                2,
                            onLike:
                                function () {},
                            onDislike:
                                function () {},
                            onReply:
                                function () {},
                            replies: [
                                {
                                    id:
                                        "post-comment-reply-one",
                                    author: {
                                        name:
                                            "Alex Morgan",
                                        title:
                                            "Developer",
                                    },
                                    timestamp:
                                        "2026-08-17T11:25:00-04:00",
                                    content:
                                        "<p>This reply verifies nested Comments inside a Post.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                },
                            ],
                        },
                    ],
                }
            ).appendTo(
                postExamples
            );
        }

        const feedExamples =
            createSection(
                mount,
                "Feed",
                "Searchable collection of Post components filtered by author, content, categories, and status."
            );

        if (global.Builder.has("feed")) {
            global.Builder.create(
                "feed",
                {
                    searchEnabled:
                        true,
                    searchPlaceholder:
                        "Search feed…",
                    emptyMessage:
                        "No matching posts.",
                    posts: [
                        {
                            author: {
                                name:
                                    "Alex Morgan",
                                title:
                                    "Developer",
                                href:
                                    "/admin/dev/preview",
                            },
                            timestamp:
                                "2026-08-17T09:15:00-04:00",
                            content:
                                "<p>The engineering team completed the new Builder feed component.</p>",
                            categories: [
                                "Engineering",
                                "Announcement",
                            ],
                            status:
                                "Published",
                            likeControlVisible:
                                true,
                            shareControlVisible:
                                true,
                            commentsControlVisible:
                                true,
                            likeCount:
                                8,
                            shareCount:
                                2,
                            commentCount:
                                4,
                            commentsVisible:
                                false,
                            comments: [
                                {
                                    id:
                                        "c-001",
                                    author: {
                                        name:
                                            "Jamie Rivera",
                                        title:
                                            "Operations Manager",
                                    },
                                    timestamp:
                                        "2026-08-17T09:25:00-04:00",
                                    content:
                                        "<p>Nice work. This should make activity streams much easier to build.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    likeCount:
                                        3,
                                    dislikeCount:
                                        0,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                    replies: [
                                        {
                                            id:
                                                "c-002",
                                            author: {
                                                name:
                                                    "Taylor Chen",
                                                title:
                                                    "Designer",
                                            },
                                            timestamp:
                                                "2026-08-17T09:32:00-04:00",
                                            content:
                                                "<p>The Feed layout works nicely with the existing Post presentation.</p>",
                                            likeControlVisible:
                                                true,
                                            replyControlVisible:
                                                true,
                                            likeCount:
                                                1,
                                            dislikeCount:
                                                0,
                                            onLike:
                                                function () {},
                                            onDislike:
                                                function () {},
                                            onReply:
                                                function () {},
                                        },
                                    ],
                                },
                                {
                                    id:
                                        "c-003",
                                    author: {
                                        name:
                                            "Morgan Lee",
                                        title:
                                            "Product Manager",
                                    },
                                    timestamp:
                                        "2026-08-17T09:41:00-04:00",
                                    content:
                                        "<p>Search across the different post fields is especially useful.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    likeCount:
                                        2,
                                    dislikeCount:
                                        0,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                    replies: [
                                        {
                                            id:
                                                "c-004",
                                            author: {
                                                name:
                                                    "Casey Smith",
                                                title:
                                                    "QA Engineer",
                                            },
                                            timestamp:
                                                "2026-08-17T09:48:00-04:00",
                                            content:
                                                "<p>I tested the empty state and several search combinations successfully.</p>",
                                            likeControlVisible:
                                                true,
                                            replyControlVisible:
                                                true,
                                            likeCount:
                                                1,
                                            dislikeCount:
                                                0,
                                            onLike:
                                                function () {},
                                            onDislike:
                                                function () {},
                                            onReply:
                                                function () {},
                                        },
                                    ],
                                },
                            ],
                            onLike:
                                function () {},
                            onShare:
                                function () {},
                            onViewComments:
                                function () {},
                        },
                        {
                            author: {
                                name:
                                    "Jamie Rivera",
                                title:
                                    "Operations Manager",
                            },
                            timestamp:
                                "2026-08-17T10:45:00-04:00",
                            content:
                                "<p>Operations notes for the upcoming deployment window are ready for internal review.</p>",
                            categories: [
                                "Operations",
                                "Internal",
                            ],
                            status:
                                "Draft",
                            commentsControlVisible:
                                true,
                            commentCount:
                                1,
                            onViewComments:
                                function () {},
                        },
                        {
                            author: {
                                name:
                                    "Taylor Chen",
                                title:
                                    "Designer",
                            },
                            timestamp:
                                "2026-08-17T12:30:00-04:00",
                            content:
                                "<p>The interface accessibility review is scheduled for the next design session.</p>",
                            categories: [
                                "Design",
                                "Accessibility",
                            ],
                            status:
                                "Scheduled",
                        },
                    ],
                }
            ).appendTo(
                feedExamples
            );
        }

        const commentExamples =
            createSection(
                mount,
                "Comment",
                "Individual discussion comments with author identity, status, overflow actions, and direct actions."
            );

        if (global.Builder.has("comment")) {
            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Alex Morgan",
                        title:
                            "Developer",
                        href:
                            "/admin/dev/preview",
                    },
                    timestamp:
                        "2026-08-13T11:45:00-04:00",
                    content:
                        "<p>This comment demonstrates the complete Comment control set, including overflow and direct actions.</p>",
                    status:
                        "Approved",
                    editControlVisible:
                        true,
                    deleteControlVisible:
                        true,
                    likeControlVisible:
                        true,
                    replyControlVisible:
                        true,
                    onEdit:
                        function () {},
                    onDelete:
                        function () {},
                    onLike:
                        function () {},
                    onReply:
                        function () {},
                }
            ).appendTo(
                commentExamples
            );

            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Jamie Rivera",
                        title:
                            "Operations Manager",
                    },
                    timestamp:
                        "2026-08-12T13:30:00-04:00",
                    content:
                        "<p>This example has no status and no actions, validating the minimal Comment presentation.</p>",
                }
            ).appendTo(
                commentExamples
            );

            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Taylor Chen",
                        title:
                            "Designer",
                    },
                    timestamp:
                        "2026-08-13T13:30:00-04:00",
                    content:
                        "<p>This comment exposes Like and Reply without the overflow Edit/Delete menu.</p>",
                    status:
                        "Visible",
                    likeControlVisible:
                        true,
                    replyControlVisible:
                        true,
                    onLike:
                        function () {},
                    onDislike:
                        function () {},
                    onReply:
                        function () {},
                }
            ).appendTo(
                commentExamples
            );

            const commentControlExample =
                global.Builder.create(
                    "comment",
                    {
                        author: {
                            name:
                                "Morgan Patel",
                            title:
                                "Account Manager",
                        },
                        timestamp:
                            "2026-08-13T13:44:00-04:00",
                        content:
                            "<p>This comment exposes only the Edit and Delete overflow actions.</p>",
                        editControlVisible:
                            true,
                        deleteControlVisible:
                            true,
                        likeControlVisible:
                            true,
                        replyControlVisible:
                            true,
                        liked:
                            true,
                        disliked:
                            false,
                        likeCount:
                            12,
                        dislikeCount:
                            3,
                        onEdit:
                            function () {},
                        onDelete:
                            function () {},
                        onLike:
                            function () {},
                        onDislike:
                            function () {},
                        onReply:
                            function () {},
                    }
                );

            commentControlExample.appendTo(
                commentExamples
            );
        }

        const commentsExamples =
            createSection(
                mount,
                "Comments",
                "Nested discussion collection with configurable indentation, reply depth, empty state, and section-level actions."
            );

        if (global.Builder.has("comments")) {
            const commentsExample =
                global.Builder.create(
                    "comments",
                    {
                        title:
                            "Discussion",
                        titleVisible:
                            true,
                        indentationEnabled:
                            true,
                        maxIndentDepth:
                            3,
                        emptyMessage:
                            "No comments are available.",
                        actions: [
                            {
                                label:
                                    "Moderate comments",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Review reported comments",
                                callback:
                                    function () {},
                            },
                        ],
                        comments: [
                            {
                                id:
                                    "comments-alex",
                                author: {
                                    name:
                                        "Alex Morgan",
                                    title:
                                        "Developer",
                                },
                                timestamp:
                                    "2026-08-14T12:00:00-04:00",
                                content:
                                    "<p>This is the root comment for the nested discussion example.</p>",
                                likeControlVisible:
                                    true,
                                replyControlVisible:
                                    true,
                                likeCount:
                                    8,
                                dislikeCount:
                                    1,
                                onLike:
                                    function () {},
                                onDislike:
                                    function () {},
                                onReply:
                                    function () {},
                                replies: [
                                    {
                                        id:
                                            "comments-jamie",
                                        author: {
                                            name:
                                                "Jamie Rivera",
                                            title:
                                                "Operations Manager",
                                        },
                                        timestamp:
                                            "2026-08-14T12:10:00-04:00",
                                        content:
                                            "<p>This is a first-level reply.</p>",
                                        likeControlVisible:
                                            true,
                                        replyControlVisible:
                                            true,
                                        onLike:
                                            function () {},
                                        onDislike:
                                            function () {},
                                        onReply:
                                            function () {},
                                        replies: [
                                            {
                                                id:
                                                    "comments-taylor",
                                                author: {
                                                    name:
                                                        "Taylor Chen",
                                                    title:
                                                        "Designer",
                                                },
                                                timestamp:
                                                    "2026-08-14T12:20:00-04:00",
                                                content:
                                                    "<p>This is a second-level reply.</p>",
                                                likeControlVisible:
                                                    true,
                                                replyControlVisible:
                                                    true,
                                                onLike:
                                                    function () {},
                                                onDislike:
                                                    function () {},
                                                onReply:
                                                    function () {},
                                                replies: [
                                                    {
                                                        id:
                                                            "comments-morgan",
                                                        author: {
                                                            name:
                                                                "Morgan Patel",
                                                            title:
                                                                "Account Manager",
                                                        },
                                                        timestamp:
                                                            "2026-08-14T12:30:00-04:00",
                                                        content:
                                                            "<p>This is a third-level reply.</p>",
                                                        likeControlVisible:
                                                            true,
                                                        replyControlVisible:
                                                            true,
                                                        onLike:
                                                            function () {},
                                                        onDislike:
                                                            function () {},
                                                        onReply:
                                                            function () {},
                                                        replies: [
                                                            {
                                                                id:
                                                                    "comments-casey",
                                                                author: {
                                                                    name:
                                                                        "Casey Williams",
                                                                    title:
                                                                        "Project Coordinator",
                                                                },
                                                                timestamp:
                                                                    "2026-08-14T12:40:00-04:00",
                                                                content:
                                                                    "<p>This reply is deeper than maxIndentDepth and should remain structurally nested without moving farther to the right.</p>",
                                                                likeControlVisible:
                                                                    true,
                                                                replyControlVisible:
                                                                    true,
                                                                onLike:
                                                                    function () {},
                                                                onDislike:
                                                                    function () {},
                                                                onReply:
                                                                    function () {},
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                id:
                                    "comments-jordan",
                                author: {
                                    name:
                                        "Jordan Smith",
                                    title:
                                        "Support Specialist",
                                },
                                timestamp:
                                    "2026-08-14T12:50:00-04:00",
                                content:
                                    "<p>This is a separate root-level comment used to verify spacing between independent discussion branches.</p>",
                                status:
                                    "Visible",
                                editControlVisible:
                                    true,
                                deleteControlVisible:
                                    true,
                                likeControlVisible:
                                    true,
                                replyControlVisible:
                                    true,
                                likeCount:
                                    3,
                                dislikeCount:
                                    0,
                                onEdit:
                                    function () {},
                                onDelete:
                                    function () {},
                                onLike:
                                    function () {},
                                onDislike:
                                    function () {},
                                onReply:
                                    function () {},
                            },
                        ],
                    }
                );

            commentsExample.appendTo(
                commentsExamples
            );

            createToggleControl(
                commentsExamples,
                "Indentation",
                true,
                function (enabled) {
                    if (enabled) {
                        commentsExample.enableIndentation();

                        return;
                    }

                    commentsExample.disableIndentation();
                }
            );
        }

        const progressBarExamples =
            createSection(
                mount,
                "Progress Bar",
                "Determinate and indeterminate progress with labels, percentages, ranges, and semantic colors."
            );

        if (global.Builder.has("progress-bar")) {
            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Upload progress",
                    min:
                        0,
                    max:
                        100,
                    value:
                        65,
                    percentageVisible:
                        true,
                    color:
                        "primary",
                }
            ).appendTo(
                progressBarExamples
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Completed",
                    min:
                        0,
                    max:
                        100,
                    value:
                        100,
                    percentageVisible:
                        true,
                    color:
                        "success",
                }
            ).appendTo(
                progressBarExamples
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Custom range",
                    min:
                        20,
                    max:
                        80,
                    value:
                        35,
                    percentageVisible:
                        true,
                    color:
                        "warning",
                }
            ).appendTo(
                progressBarExamples
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Processing",
                    indeterminate:
                        true,
                    percentageVisible:
                        true,
                    color:
                        "info",
                }
            ).appendTo(
                progressBarExamples
            );
        }

        const buttonGroupExamples =
            createSection(
                mount,
                "Button Group",
                "Grouped Builder buttons with spaced, attached, horizontal, vertical, and equal-width layouts."
            );

        if (global.Builder.has("button-group")) {
            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Save",
                            variant: "primary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Duplicate",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Delete",
                            variant: "danger",
                            callback:
                                function () {},
                        },
                    ],
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
                buttonGroupExamples
            );

            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Left",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Center",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Right",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                    ],
                    orientation:
                        "horizontal",
                    presentation:
                        "attached",
                    equalWidth:
                        true,
                    wrap:
                        false,
                }
            ).appendTo(
                buttonGroupExamples
            );

            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Profile",
                            variant: "primary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Message",
                            variant: "info",
                            callback:
                                function () {},
                        },
                        {
                            label: "Disabled",
                            variant: "secondary",
                            disabled: true,
                            callback:
                                function () {},
                        },
                    ],
                    orientation:
                        "vertical",
                    presentation:
                        "attached",
                    equalWidth:
                        false,
                    wrap:
                        false,
                }
            ).appendTo(
                buttonGroupExamples
            );
        }

        const buttonExamples =
            createSection(
                mount,
                "Button",
                "Button variants and states."
            );

        if (global.Builder.has("button")) {
            [
                "primary",
                "secondary",
                "success",
                "danger",
                "warning",
                "info",
                "light",
                "dark",
            ].forEach(function (variant) {
                global.Builder.create(
                    "button",
                    {
                        label:
                            variant.charAt(0)
                                .toUpperCase()
                            + variant.slice(1),
                        variant: variant,
                        size: "medium",
                    }
                ).appendTo(
                    buttonExamples
                );
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeThemePreview,
            { once: true }
        );
    } else {
        initializeThemePreview();
    }

})(globalThis);

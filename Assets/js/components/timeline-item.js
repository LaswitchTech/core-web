(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Timeline Item."
        );
    }

    const TIMELINE_ITEM_ICONS = Object.freeze({
        default: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>',
            "</svg>",
        ].join(""),
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
    });

    const TIMELINE_ITEM_COLORS =
        Object.freeze([
            "primary",
            "secondary",
            "success",
            "danger",
            "warning",
            "info",
            "light",
            "dark",
        ]);

    function normalizeColor(value) {
        return TIMELINE_ITEM_COLORS.includes(
            value
        )
            ? value
            : "secondary";
    }

    function normalizeLayout(value) {
        return value === "horizontal"
            ? "horizontal"
            : "vertical";
    }

    function renderIcon(element, value) {
        global.Builder.text(
            element,
            ""
        );

        if (
            typeof value !== "string"
            || value.trim() === ""
        ) {
            return;
        }

        const parsed =
            new DOMParser().parseFromString(
                value,
                "image/svg+xml"
            );

        const source =
            parsed.documentElement;

        if (
            source.localName !== "svg"
            || parsed.querySelector(
                "parsererror"
            ) !== null
        ) {
            return;
        }

        const svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

        svg.setAttribute(
            "viewBox",
            source.getAttribute("viewBox")
                || "0 0 16 16"
        );

        svg.setAttribute(
            "fill",
            "currentColor"
        );

        svg.setAttribute(
            "class",
            "app-icon"
        );

        svg.setAttribute(
            "aria-hidden",
            "true"
        );

        source.querySelectorAll(
            "path"
        ).forEach(function (sourcePath) {
            const pathData =
                sourcePath.getAttribute(
                    "d"
                );

            if (
                typeof pathData !== "string"
                || pathData.trim() === ""
            ) {
                return;
            }

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            path.setAttribute(
                "d",
                pathData
            );

            const fillRule =
                sourcePath.getAttribute(
                    "fill-rule"
                );

            if (
                fillRule === "evenodd"
                || fillRule === "nonzero"
            ) {
                path.setAttribute(
                    "fill-rule",
                    fillRule
                );
            }

            svg.append(
                path
            );
        });

        if (svg.childElementCount === 0) {
            return;
        }

        element.replaceChildren(
            svg
        );
    }

    function normalizeUser(value) {
        if (
            value === null
            || value === undefined
        ) {
            return {
                name: "",
                href: "",
                src: "",
            };
        }

        if (
            typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Timeline Item user must be an object or null."
            );
        }

        return {
            name:
                typeof value.name === "string"
                    ? value.name
                    : "",
            href:
                typeof value.href === "string"
                    ? value.href
                    : "",
            src:
                typeof value.src === "string"
                    ? value.src
                    : "",
        };
    }

    function formatRelativeTime(value) {
        const date =
            new Date(
                value
            );

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const difference =
            date.getTime()
            - Date.now();

        const units = [
            [
                "year",
                365 * 24 * 60 * 60 * 1000,
            ],
            [
                "month",
                30 * 24 * 60 * 60 * 1000,
            ],
            [
                "week",
                7 * 24 * 60 * 60 * 1000,
            ],
            [
                "day",
                24 * 60 * 60 * 1000,
            ],
            [
                "hour",
                60 * 60 * 1000,
            ],
            [
                "minute",
                60 * 1000,
            ],
            [
                "second",
                1000,
            ],
        ];

        const formatter =
            new Intl.RelativeTimeFormat(
                undefined,
                {
                    numeric: "auto",
                }
            );

        for (
            const [
                unit,
                milliseconds
            ] of units
        ) {
            if (
                Math.abs(difference)
                    >= milliseconds
                || unit === "second"
            ) {
                return formatter.format(
                    Math.round(
                        difference
                        / milliseconds
                    ),
                    unit
                );
            }
        }

        return "";
    }

    function formatExactTime(value) {
        const date =
            new Date(
                value
            );

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(
            undefined,
            {
                dateStyle: "long",
                timeStyle: "medium",
            }
        ).format(
            date
        );
    }

    function normalizeActions(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Timeline Item actions must be an array."
            );
        }

        return value.map(function (action) {
            if (
                action === null
                || typeof action !== "object"
                || Array.isArray(action)
            ) {
                throw new TypeError(
                    "Timeline Item action configuration is invalid."
                );
            }

            const label =
                typeof action.label === "string"
                    ? action.label
                    : "";

            const callback =
                typeof action.callback === "function"
                    ? action.callback
                    : null;

            if (label === "") {
                throw new TypeError(
                    "Timeline Item actions require a label."
                );
            }

            if (callback === null) {
                throw new TypeError(
                    "Timeline Item actions require a callback."
                );
            }

            return {
                label: label,
                variant:
                    typeof action.variant === "string"
                        ? action.variant
                        : "secondary",
                disabled:
                    action.disabled === true,
                callback: callback,
            };
        });
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Timeline Item controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Timeline Item control menu item configuration is invalid."
                );
            }

            const label =
                typeof item.label === "string"
                    ? item.label
                    : "";

            const icon =
                typeof item.icon === "string"
                    ? item.icon
                    : "";

            const href =
                typeof item.href === "string"
                    ? item.href
                    : "";

            const callback =
                typeof item.callback === "function"
                    ? item.callback
                    : null;

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "Timeline Item control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Timeline Item control menu items require href or callback."
                );
            }

            return {
                label: label,
                icon: icon,
                href: href,
                disabled:
                    item.disabled === true,
                callback: callback,
            };
        });
    }

    class TimelineItem extends global.Component {
        constructor(config) {
            super(config);

            this.controlMenuDropdown =
                null;

            this.userAvatar =
                null;

            this.actionButtons =
                [];
        }

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Timeline Item control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            TIMELINE_ITEM_ICONS.menu,
                        triggerTitle:
                            "Timeline item controls",
                        items:
                            items,
                        open:
                            this.config("controlMenuOpen") === true,
                        onOpenChange:
                            (open) => {
                                this.config(
                                    "controlMenuOpen",
                                    open
                                );
                            },
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Timeline Item control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-timeline-item-control-dropdown"
            );

            this.controlMenuDropdown =
                dropdown;

            return element;
        }

        destroyUserAvatar() {
            if (
                this.userAvatar !== null
                && typeof this.userAvatar.destroy
                    === "function"
            ) {
                this.userAvatar.destroy();
            }

            this.userAvatar =
                null;

            return this;
        }

        destroyActionButtons() {
            this.actionButtons.forEach(
                function (button) {
                    if (
                        button !== null
                        && typeof button.destroy
                            === "function"
                    ) {
                        button.destroy();
                    }
                }
            );

            this.actionButtons =
                [];

            return this;
        }

        destroyControlMenuDropdown() {
            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.destroy
                    === "function"
            ) {
                this.controlMenuDropdown.destroy();
            }

            this.controlMenuDropdown =
                null;

            return this;
        }

        beforeDestroy() {
            this.destroyUserAvatar();
            this.destroyActionButtons();
            this.destroyControlMenuDropdown();
        }

        setColor(color) {
            this.config(
                "color",
                normalizeColor(
                    color
                )
            );

            this.refresh();

            return this;
        }

        enableControlMenu() {
            this.config(
                "controlMenuEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableControlMenu() {
            this.config(
                "controlMenuEnabled",
                false
            );

            this.refresh();

            return this;
        }

        toggleControlMenu() {
            this.config(
                "controlMenuEnabled",
                this.config("controlMenuEnabled") !== true
            );

            this.refresh();

            return this;
        }

        openControlMenu() {
            this.config(
                "controlMenuOpen",
                true
            );

            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.open
                    === "function"
            ) {
                this.controlMenuDropdown.open();

                return this;
            }

            this.refresh();

            return this;
        }

        closeControlMenu() {
            this.config(
                "controlMenuOpen",
                false
            );

            this.refresh();

            return this;
        }

        toggleControlMenuOpen() {
            return this.config(
                "controlMenuOpen"
            ) === true
                ? this.closeControlMenu()
                : this.openControlMenu();
        }

        static defaults() {
            return {
                id: "",
                layout: "vertical",
                type: "",
                title: "",
                content: "",
                icon: "",
                color: "secondary",
                user: null,
                timestamp: "",
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
                actions: [],
            };
        }

        render() {
            const root =
                document.createElement(
                    "article"
                );

            const indicator =
                document.createElement(
                    "div"
                );

            const indicatorIcon =
                document.createElement(
                    "span"
                );

            const card =
                document.createElement(
                    "div"
                );

            const header =
                document.createElement(
                    "div"
                );

            const metadata =
                document.createElement(
                    "div"
                );

            const avatar =
                document.createElement(
                    "span"
                );

            const user =
                document.createElement(
                    "span"
                );

            const time =
                document.createElement(
                    "time"
                );

            const controls =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            const body =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-timeline-item"
            );

            indicator.classList.add(
                "app-timeline-item-indicator"
            );

            indicatorIcon.classList.add(
                "app-timeline-item-indicator-icon"
            );

            card.classList.add(
                "app-timeline-item-card"
            );

            header.classList.add(
                "app-timeline-item-header"
            );

            metadata.classList.add(
                "app-timeline-item-metadata"
            );

            user.classList.add(
                "app-timeline-item-user"
            );

            avatar.classList.add(
                "app-timeline-item-avatar"
            );

            time.classList.add(
                "app-timeline-item-time"
            );

            controls.classList.add(
                "app-timeline-item-controls"
            );

            title.classList.add(
                "app-timeline-item-title"
            );

            body.classList.add(
                "app-timeline-item-body"
            );

            indicator.setAttribute(
                "data-timeline-item-region",
                "indicator"
            );

            avatar.setAttribute(
                "data-timeline-item-region",
                "avatar"
            );

            user.setAttribute(
                "data-timeline-item-region",
                "user"
            );

            time.setAttribute(
                "data-timeline-item-region",
                "time"
            );

            controls.setAttribute(
                "data-timeline-item-region",
                "controls"
            );

            title.setAttribute(
                "data-timeline-item-region",
                "title"
            );

            body.setAttribute(
                "data-timeline-item-region",
                "body"
            );

            renderIcon(
                indicatorIcon,
                TIMELINE_ITEM_ICONS.default
            );

            indicator.append(
                indicatorIcon
            );

            metadata.append(
                avatar,
                user,
                time,
                controls
            );

            header.append(
                metadata
            );

            card.append(
                header,
                title,
                body
            );

            root.append(
                indicator,
                card
            );

            this.update(
                root
            );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Timeline Item update requires an HTMLElement."
                );
            }

            const id =
                this.config(
                    "id"
                );

            const layout =
                normalizeLayout(
                    this.config(
                        "layout"
                    )
                );

            this.config(
                "layout",
                layout
            );

            element.setAttribute(
                "data-timeline-item-layout",
                layout
            );

            const type =
                this.config(
                    "type"
                );

            const title =
                this.config(
                    "title"
                );

            const content =
                this.config(
                    "content"
                );

            const icon =
                this.config(
                    "icon"
                );

            const color =
                normalizeColor(
                    this.config(
                        "color"
                    )
                );

            const user =
                normalizeUser(
                    this.config(
                        "user"
                    )
                );

            const actions =
                normalizeActions(
                    this.config(
                        "actions"
                    )
                );

            this.config(
                "actions",
                actions
            );

            const controlMenuEnabled =
                this.config(
                    "controlMenuEnabled"
                );

            const controlMenuOpen =
                this.config(
                    "controlMenuOpen"
                );

            if (typeof controlMenuEnabled !== "boolean") {
                throw new TypeError(
                    "Timeline Item controlMenuEnabled must be a boolean."
                );
            }

            if (typeof controlMenuOpen !== "boolean") {
                throw new TypeError(
                    "Timeline Item controlMenuOpen must be a boolean."
                );
            }

            const timestamp =
                this.config(
                    "timestamp"
                );

            if (typeof timestamp !== "string") {
                throw new TypeError(
                    "Timeline Item timestamp must be a string."
                );
            }

            if (typeof id !== "string") {
                throw new TypeError(
                    "Timeline Item id must be a string."
                );
            }

            if (typeof type !== "string") {
                throw new TypeError(
                    "Timeline Item type must be a string."
                );
            }

            if (typeof title !== "string") {
                throw new TypeError(
                    "Timeline Item title must be a string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Timeline Item content must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Timeline Item icon must be a string."
                );
            }

            const indicator =
                element.querySelector(
                    ".app-timeline-item-indicator-icon"
                );

            const titleRegion =
                element.querySelector(
                    '[data-timeline-item-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-timeline-item-region="body"]'
                );

            const avatarRegion =
                element.querySelector(
                    '[data-timeline-item-region="avatar"]'
                );

            const userRegion =
                element.querySelector(
                    '[data-timeline-item-region="user"]'
                );

            const timeRegion =
                element.querySelector(
                    '[data-timeline-item-region="time"]'
                );

            const controlsRegion =
                element.querySelector(
                    '[data-timeline-item-region="controls"]'
                );

            if (
                !(indicator instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(avatarRegion instanceof HTMLElement)
                || !(userRegion instanceof HTMLElement)
                || !(timeRegion instanceof HTMLTimeElement)
                || !(controlsRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Timeline Item rendered regions are missing."
                );
            }

            this.config(
                "color",
                color
            );

            renderIcon(
                indicator,
                icon === ""
                    ? TIMELINE_ITEM_ICONS.default
                    : icon
            );

            global.Builder.text(
                titleRegion,
                title
            );

            global.Builder.html(
                bodyRegion,
                content
            );

            titleRegion.hidden =
                title === "";

            bodyRegion.hidden =
                content === "";

            this.destroyUserAvatar();

            avatarRegion.replaceChildren();

            if (
                user.name !== ""
                && global.Builder.has("avatar")
            ) {
                const avatar =
                    global.Builder.create(
                        "avatar",
                        {
                            name:
                                user.name,
                            src:
                                user.src,
                            href:
                                user.href,
                            size:
                                "small",
                        }
                    );

                const avatarElement =
                    avatar.element();

                if (avatarElement instanceof HTMLElement) {
                    avatarRegion.append(
                        avatarElement
                    );

                    this.userAvatar =
                        avatar;
                } else {
                    avatar.destroy();
                }
            }

            avatarRegion.hidden =
                this.userAvatar === null;

            userRegion.replaceChildren();

            if (user.name !== "") {
                if (user.href === "") {
                    global.Builder.text(
                        userRegion,
                        user.name
                    );
                } else {
                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        user.href;

                    global.Builder.text(
                        link,
                        user.name
                    );

                    userRegion.append(
                        link
                    );
                }
            }

            userRegion.hidden =
                user.name === "";

            element.setAttribute(
                "data-timeline-item-color",
                color
            );

            if (id === "") {
                element.removeAttribute(
                    "data-timeline-item-id"
                );
            } else {
                element.setAttribute(
                    "data-timeline-item-id",
                    id
                );
            }

            if (type === "") {
                element.removeAttribute(
                    "data-timeline-item-type"
                );
            } else {
                element.setAttribute(
                    "data-timeline-item-type",
                    type
                );
            }

            this.config(
                "user",
                user
            );

            const relativeTime =
                formatRelativeTime(
                    timestamp
                );

            const exactTime =
                formatExactTime(
                    timestamp
                );

            global.Builder.text(
                timeRegion,
                relativeTime
            );

            const controlMenuItems =
                normalizeControlMenuItems(
                    this.config(
                        "controlMenuItems"
                    )
                );

            this.config(
                "controlMenuItems",
                controlMenuItems
            );

            const controlMenuVisible =
                controlMenuEnabled
                && controlMenuItems.length > 0;

            this.destroyActionButtons();
            this.destroyControlMenuDropdown();

            controlsRegion.replaceChildren();

            if (
                actions.length > 0
                && !global.Builder.has("button")
            ) {
                throw new Error(
                    "Timeline Item actions require the Button component."
                );
            }

            actions.forEach(
                (action) => {
                    const button =
                        global.Builder.create(
                            "button",
                            {
                                label:
                                    action.label,
                                variant:
                                    action.variant,
                                size:
                                    "small",
                                disabled:
                                    action.disabled,
                                callback:
                                    action.callback,
                            }
                        );

                    const buttonElement =
                        button.element();

                    if (buttonElement instanceof HTMLElement) {
                        buttonElement.classList.add(
                            "app-timeline-item-action"
                        );

                        controlsRegion.append(
                            buttonElement
                        );

                        this.actionButtons.push(
                            button
                        );

                        return;
                    }

                    button.destroy();
                }
            );

            if (controlMenuVisible) {
                controlsRegion.append(
                    this.createControlMenuDropdown(
                        controlMenuItems
                    )
                );
            }

            controlsRegion.hidden =
                actions.length === 0
                && !controlMenuVisible;

            if (
                timestamp === ""
                || relativeTime === ""
            ) {
                timeRegion.removeAttribute(
                    "datetime"
                );

                timeRegion.removeAttribute(
                    "title"
                );

                timeRegion.hidden =
                    true;
            } else {
                timeRegion.setAttribute(
                    "datetime",
                    timestamp
                );

                timeRegion.setAttribute(
                    "title",
                    exactTime
                );

                timeRegion.hidden =
                    false;
            }

            return this;
        }
    }

    global.Builder.register(
        "timeline-item",
        TimelineItem,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);
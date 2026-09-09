(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Callout."
        );
    }

    const CALLOUT_ICONS = Object.freeze({
        move: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>',
            "</svg>",
        ].join(""),
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
    });

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

    const CALLOUT_COLORS =
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
        return CALLOUT_COLORS.includes(
            value
        )
            ? value
        : "primary";
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Callout controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Callout control menu item configuration is invalid."
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
                    "Callout control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Callout control menu items require href or callback."
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

    class Callout extends global.Component {
        constructor(config) {
            super(config);

            this.controlMenuDropdown =
                null;
        }

        showMoveHandle() {
            this.config(
                "moveHandleVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideMoveHandle() {
            this.config(
                "moveHandleVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleMoveHandle() {
            return this.config(
                "moveHandleVisible"
            ) === true
                ? this.hideMoveHandle()
                : this.showMoveHandle();
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

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Callout control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            CALLOUT_ICONS.menu,
                        triggerTitle:
                            "Callout controls",
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
                    "Callout control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-callout-control-dropdown"
            );

            this.controlMenuDropdown =
                dropdown;

            return element;
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
            this.destroyControlMenuDropdown();
        }

        isSortableAvailable() {
            return (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            );
        }

        static defaults() {
            return {
                title: "",
                content: "",
                icon: "",
                color: "primary",
                moveHandleVisible: false,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
            };
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const icon =
                document.createElement(
                    "div"
                );

            const content =
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

            const controls =
                document.createElement(
                    "div"
                );

            const moveHandle =
                document.createElement(
                    "button"
                );

            const controlMenuRegion =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-callout"
            );

            icon.classList.add(
                "app-callout-icon"
            );

            content.classList.add(
                "app-callout-content"
            );

            title.classList.add(
                "app-callout-title"
            );

            body.classList.add(
                "app-callout-body"
            );

            controls.classList.add(
                "app-callout-controls"
            );

            moveHandle.type =
                "button";

            moveHandle.classList.add(
                "app-callout-move-handle"
            );

            moveHandle.setAttribute(
                "data-callout-region",
                "move-handle"
            );

            moveHandle.setAttribute(
                "aria-label",
                "Move callout"
            );

            moveHandle.setAttribute(
                "title",
                "Move callout"
            );

            renderIcon(
                moveHandle,
                CALLOUT_ICONS.move
            );

            icon.setAttribute(
                "data-callout-region",
                "icon"
            );

            title.setAttribute(
                "data-callout-region",
                "title"
            );

            body.setAttribute(
                "data-callout-region",
                "body"
            );

            controlMenuRegion.setAttribute(
                "data-callout-region",
                "control-menu"
            );

            content.append(
                title,
                body
            );

            controls.append(
                moveHandle,
                controlMenuRegion
            );

            root.append(
                icon,
                content,
                controls
            );

            this.update(
                root
            );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Callout update requires an HTMLElement."
                );
            }

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

            const moveHandleVisible =
                this.config(
                    "moveHandleVisible"
                );

            const controlMenuEnabled =
                this.config(
                    "controlMenuEnabled"
                );

            const controlMenuOpen =
                this.config(
                    "controlMenuOpen"
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Callout title must be a string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Callout content must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Callout icon must be a string."
                );
            }

            if (typeof moveHandleVisible !== "boolean") {
                throw new TypeError(
                    "Callout moveHandleVisible must be a boolean."
                );
            }

            if (typeof controlMenuEnabled !== "boolean") {
                throw new TypeError(
                    "Callout controlMenuEnabled must be a boolean."
                );
            }

            if (typeof controlMenuOpen !== "boolean") {
                throw new TypeError(
                    "Callout controlMenuOpen must be a boolean."
                );
            }

            this.config(
                "color",
                color
            );

            const titleRegion =
                element.querySelector(
                    '[data-callout-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-callout-region="body"]'
                );

            const iconRegion =
                element.querySelector(
                    '[data-callout-region="icon"]'
                );

            const moveHandle =
                element.querySelector(
                    ".app-callout-move-handle"
                );

            const controlMenuRegion =
                element.querySelector(
                    '[data-callout-region="control-menu"]'
                );

            if (
                !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(iconRegion instanceof HTMLElement)
                || !(moveHandle instanceof HTMLButtonElement)
                || !(controlMenuRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Callout rendered regions are missing."
                );
            }

            global.Builder.text(
                titleRegion,
                title
            );

            global.Builder.html(
                bodyRegion,
                content
            );

            renderIcon(
                iconRegion,
                icon
            );

            titleRegion.hidden =
                title === "";

            iconRegion.hidden =
                icon === "";

            element.setAttribute(
                "data-callout-color",
                color
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

            this.destroyControlMenuDropdown();

            controlMenuRegion.replaceChildren();

            if (controlMenuVisible) {
                controlMenuRegion.append(
                    this.createControlMenuDropdown(
                        controlMenuItems
                    )
                );
            }

            controlMenuRegion.hidden =
                !controlMenuVisible;

            moveHandle.hidden =
                !moveHandleVisible
                || !this.isSortableAvailable();

            element.classList.toggle(
                "has-move-handle",
                !moveHandle.hidden
            );

            return this;
        }
    }

    global.Builder.register(
        "callout",
        Callout,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);
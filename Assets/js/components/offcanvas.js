(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Offcanvas."
        );
    }

    const OFFCANVAS_PLACEMENTS = Object.freeze([
        "left",
        "right",
        "top",
        "bottom",
    ]);

    const OFFCANVAS_SIZES = Object.freeze([
        "small",
        "medium",
        "large",
    ]);

    const OFFCANVAS_COLORS = Object.freeze([
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark",
    ]);

    const OFFCANVAS_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        close: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>',
            "</svg>",
        ].join(""),
        fullscreen: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>',
            "</svg>",
        ].join(""),
        exitFullscreen: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z"/>',
            "</svg>",
        ].join(""),
    });

    function renderIcon(
        element,
        value
    ) {
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

    function createCloseButton() {
        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.classList.add(
            "app-offcanvas-control"
        );

        button.setAttribute(
            "data-offcanvas-action",
            "close"
        );

        button.setAttribute(
            "aria-label",
            "Close panel"
        );

        button.setAttribute(
            "title",
            "Close panel"
        );

        return button;
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Offcanvas controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Offcanvas control menu item configuration is invalid."
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
                    "Offcanvas control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Offcanvas control menu items require href or callback."
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

    function normalizePlacement(value) {
        return OFFCANVAS_PLACEMENTS.includes(value)
            ? value
            : "right";
    }

    function normalizeSize(value) {
        return OFFCANVAS_SIZES.includes(value)
            ? value
            : "medium";
    }

    function normalizeColor(value) {
        return OFFCANVAS_COLORS.includes(value)
            ? value
            : "primary";
    }

    class Offcanvas extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick =
                this.handleClick.bind(this);

            this.handleDocumentKeyDown =
                this.handleDocumentKeyDown.bind(this);

            this.controlMenuDropdown =
                null;

            this.previousActiveElement =
                null;
        }

        static defaults() {
            return {
                title: "",
                icon: "",
                body: "",
                footer: "",
                placement: "right",
                size: "medium",
                color: "primary",
                open: false,
                backdrop: true,
                fullscreen: false,
                closeControlVisible: true,
                fullscreenControlVisible: false,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
                closeOnEscape: true,
                closeOnBackdrop: true,
                onOpen: null,
                onClose: null,
            };
        }

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Offcanvas control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            OFFCANVAS_ICONS.menu,
                        triggerTitle:
                            "Offcanvas controls",
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
                    "Offcanvas control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-offcanvas-control-dropdown"
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

            const element =
                this.element();

            if (element instanceof HTMLElement) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );

                element.classList.remove(
                    "is-open"
                );

                element.hidden =
                    true;
            }

            document.removeEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );

            this.syncBodyScrollLock();
        }

        syncBodyScrollLock() {
            if (!(document.body instanceof HTMLElement)) {
                return this;
            }

            const openOverlay =
                document.querySelector(
                    ".app-modal.is-open:not([hidden]), .app-offcanvas.is-open:not([hidden])"
                );

            document.body.classList.toggle(
                "app-overlay-open",
                openOverlay !== null
            );

            return this;
        }

        focusPanel() {
            if (this.config("open") !== true) {
                return this;
            }

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            const panel =
                element.querySelector(
                    '[data-offcanvas-region="panel"]'
                );

            if (!(panel instanceof HTMLElement)) {
                return this;
            }

            const focusable =
                this.getFocusableElements();

            if (focusable.length > 0) {
                focusable[0].focus();

                return this;
            }

            panel.focus();

            return this;
        }

        getFocusableElements() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return [];
            }

            const panel =
                element.querySelector(
                    '[data-offcanvas-region="panel"]'
                );

            if (!(panel instanceof HTMLElement)) {
                return [];
            }

            return Array.from(
                panel.querySelectorAll(
                    [
                        "a[href]",
                        "button:not([disabled])",
                        "input:not([disabled])",
                        "select:not([disabled])",
                        "textarea:not([disabled])",
                        '[tabindex]:not([tabindex="-1"])',
                    ].join(",")
                )
            ).filter(
                function (candidate) {
                    return candidate instanceof HTMLElement
                        && !candidate.hidden
                        && candidate.getAttribute(
                    "aria-hidden"
                        ) !== "true";
                }
            );
        }

        handleDocumentKeyDown(event) {
            if (this.config("open") !== true) {
                return;
            }

            if (event.key === "Tab") {
                const focusable =
                    this.getFocusableElements();

                const element =
                    this.element();

                const panel =
                    element instanceof HTMLElement
                        ? element.querySelector(
                            '[data-offcanvas-region="panel"]'
                        )
                        : null;

                if (focusable.length === 0) {
                    if (panel instanceof HTMLElement) {
                        event.preventDefault();
                        panel.focus();
                    }

                    return;
                }

                const first =
                    focusable[0];

                const last =
                    focusable[
                        focusable.length - 1
                    ];

                if (
                    event.shiftKey
                    && document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();

                    return;
                }

                if (
                    !event.shiftKey
                    && document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }

                return;
            }

            if (
                event.key !== "Escape"
                || this.config("closeOnEscape") !== true
            ) {
                return;
            }

            event.preventDefault();

            this.close();
        }

        handleClick(event) {
            if (!(event.target instanceof Element)) {
                return;
            }

            if (
                event.target.matches(
                    '[data-offcanvas-region="backdrop"]'
                )
            ) {
                if (
                    this.config("closeOnBackdrop")
                    === true
                ) {
                    this.close();
                }

                return;
            }

            const control =
                event.target.closest(
                    "[data-offcanvas-action]"
                );

            if (
                !(control instanceof HTMLButtonElement)
                || !this.element()?.contains(
                    control
                )
            ) {
                return;
            }

            const action =
                control.getAttribute(
                     "data-offcanvas-action"
                 );

            if (action === "fullscreen") {
                this.toggleFullscreen();

                return;
             }

            if (action === "close") {
                this.close();
             }
        }

        showBackdrop() {
            this.config(
                "backdrop",
                true
            );

            this.refresh();

            return this;
        }

        hideBackdrop() {
            this.config(
                "backdrop",
                false
            );

            this.refresh();

            return this;
        }

        toggleBackdrop() {
            return this.config(
                "backdrop"
            ) === true
                ? this.hideBackdrop()
                : this.showBackdrop();
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

        showFullscreenControl() {
            this.config(
                "fullscreenControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideFullscreenControl() {
            this.config(
                "fullscreenControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleFullscreenControl() {
            return this.config(
                "fullscreenControlVisible"
            ) === true
                ? this.hideFullscreenControl()
                : this.showFullscreenControl();
        }

        enterFullscreen() {
            this.config(
                "fullscreen",
                true
            );

            this.refresh();

            return this;
        }

        exitFullscreen() {
            this.config(
                "fullscreen",
                false
            );

            this.refresh();

            return this;
        }

        toggleFullscreen() {
            return this.config(
                "fullscreen"
            ) === true
                ? this.exitFullscreen()
                : this.enterFullscreen();
        }

        showCloseControl() {
            this.config(
                "closeControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideCloseControl() {
            this.config(
                "closeControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleCloseControl() {
            return this.config(
                "closeControlVisible"
            ) === true
                ? this.hideCloseControl()
                : this.showCloseControl();
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

        setSize(size) {
            this.config(
                "size",
                normalizeSize(
                    size
                )
            );

            this.refresh();

            return this;
        }

        setPlacement(placement) {
            this.config(
                "placement",
                normalizePlacement(
                    placement
                )
            );

            this.refresh();

            return this;
        }

        open() {
            if (this.config("open") === true) {
                return this;
            }

            this.previousActiveElement =
                document.activeElement
                    instanceof HTMLElement
                    ? document.activeElement
                    : null;

            this.config(
                "open",
                true
            );

            this.refresh();

            this.syncBodyScrollLock();

            this.focusPanel();

            const callback =
                this.config("onOpen");

            if (typeof callback === "function") {
                callback(
                    this
                );
            }

            return this;
        }

        close() {
            if (this.config("open") !== true) {
                return this;
            }

            this.config(
                "open",
                false
            );

            this.refresh();

            this.syncBodyScrollLock();

            if (
                this.previousActiveElement
                instanceof HTMLElement
                && this.previousActiveElement.isConnected
            ) {
                this.previousActiveElement.focus();
            }

            this.previousActiveElement =
                null;

            const callback =
                this.config("onClose");

            if (typeof callback === "function") {
                callback(
                    this
                );
            }

            return this;
        }

        toggle() {
            return this.config("open") === true
                ? this.close()
                : this.open();
        }

        render() {
            const offcanvas =
                document.createElement(
                    "div"
                );

            const backdrop =
                document.createElement(
                    "div"
                );

            const panel =
                document.createElement(
                    "div"
                );

            const header =
                document.createElement(
                    "div"
                );

            const headerIdentity =
                document.createElement(
                    "div"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const title =
                document.createElement(
                    "h2"
                );

            const controls =
                document.createElement(
                    "div"
                );

            const controlMenuRegion =
                document.createElement(
                    "div"
                );

            const body =
                document.createElement(
                    "div"
                );

            const footer =
                document.createElement(
                    "div"
                );

            const fullscreenControl =
                createCloseButton();

            const closeControl =
                createCloseButton();

            fullscreenControl.setAttribute(
                "data-offcanvas-action",
                "fullscreen"
            );

            fullscreenControl.setAttribute(
                "aria-label",
                "Enter fullscreen"
            );

            fullscreenControl.setAttribute(
                "title",
                "Enter fullscreen"
            );

            offcanvas.classList.add(
                "app-offcanvas"
            );

            backdrop.classList.add(
                "app-offcanvas-backdrop"
            );

            panel.classList.add(
                "app-offcanvas-panel"
            );

            header.classList.add(
                "app-offcanvas-header"
            );

            headerIdentity.classList.add(
                "app-offcanvas-header-identity"
            );

            icon.classList.add(
                "app-offcanvas-icon"
            );

            title.classList.add(
                "app-offcanvas-title"
            );

            controls.classList.add(
                "app-offcanvas-controls"
            );

            controlMenuRegion.classList.add(
                "app-offcanvas-control-menu-region"
            );

            controlMenuRegion.setAttribute(
                "data-offcanvas-region",
                "control-menu"
            );

            body.classList.add(
                "app-offcanvas-body"
            );

            footer.classList.add(
                "app-offcanvas-footer"
            );

            icon.setAttribute(
                "data-offcanvas-region",
                "icon"
            );

            title.setAttribute(
                "data-offcanvas-region",
                "title"
            );

            controls.setAttribute(
                "data-offcanvas-region",
                "controls"
            );

            body.setAttribute(
                "data-offcanvas-region",
                "body"
            );

            footer.setAttribute(
                "data-offcanvas-region",
                "footer"
            );

            backdrop.setAttribute(
                "data-offcanvas-region",
                "backdrop"
            );

            panel.setAttribute(
                "data-offcanvas-region",
                "panel"
            );

            panel.setAttribute(
                "role",
                "dialog"
            );

            panel.setAttribute(
                "aria-modal",
                "true"
            );

            panel.setAttribute(
                "tabindex",
                "-1"
            );

            headerIdentity.append(
                icon,
                title
            );

            renderIcon(
                fullscreenControl,
                OFFCANVAS_ICONS.fullscreen
             );

            renderIcon(
                closeControl,
                OFFCANVAS_ICONS.close
             );

            controls.append(
                fullscreenControl,
                closeControl,
                controlMenuRegion
             );

            header.append(
                headerIdentity,
                controls
            );

            panel.append(
                header,
                body,
                footer
            );

            offcanvas.append(
                backdrop,
                panel
            );

            offcanvas.addEventListener(
                "click",
                this.handleClick
            );

            document.addEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );

            this.update(
                offcanvas
            );

            queueMicrotask(
                () => {
                    if (
                        offcanvas.isConnected
                        && this.config("open") === true
                    ) {
                        this.previousActiveElement =
                            document.activeElement
                                instanceof HTMLElement
                                ? document.activeElement
                                : null;

                        this.syncBodyScrollLock();

                        this.focusPanel();
                    }
                }
            );

            return offcanvas;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Offcanvas update requires an HTMLElement."
                );
            }

            const placement =
                normalizePlacement(
                    this.config("placement")
                );

            const size =
                normalizeSize(
                    this.config("size")
                );

            const color =
                normalizeColor(
                    this.config("color")
                );

            const open =
                this.config("open");

            const backdrop =
                this.config("backdrop");

            const fullscreen =
                this.config(
                     "fullscreen"
                 );

            const closeOnEscape =
                this.config(
                    "closeOnEscape"
                );

            const closeOnBackdrop =
                this.config(
                    "closeOnBackdrop"
                );

            if (typeof open !== "boolean") {
                throw new TypeError(
                    "Offcanvas open must be a boolean."
                );
            }

            if (typeof backdrop !== "boolean") {
                throw new TypeError(
                     "Offcanvas backdrop must be a boolean."
                 );
             }

            if (typeof fullscreen !== "boolean") {
                throw new TypeError(
                     "Offcanvas fullscreen must be a boolean."
                 );
             }


            if (typeof closeOnEscape !== "boolean") {
                throw new TypeError(
                    "Offcanvas closeOnEscape must be a boolean."
                );
            }

            if (typeof closeOnBackdrop !== "boolean") {
                throw new TypeError(
                    "Offcanvas closeOnBackdrop must be a boolean."
                );
            }

            this.config(
                "placement",
                placement
            );

            this.config(
                "size",
                size
            );

            this.config(
                "color",
                color
            );

            element.setAttribute(
                "data-offcanvas-placement",
                placement
            );

            element.setAttribute(
                "data-offcanvas-size",
                size
            );

            element.setAttribute(
                "data-offcanvas-color",
                color
            );

            element.classList.toggle(
                 "is-open",
                open
             );

            element.classList.toggle(
                 "is-fullscreen",
                fullscreen
             );


            element.hidden =
                !open;

            const iconRegion =
                element.querySelector(
                    '[data-offcanvas-region="icon"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-offcanvas-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-offcanvas-region="body"]'
                );

            const footerRegion =
                element.querySelector(
                    '[data-offcanvas-region="footer"]'
                );

            const panel =
                element.querySelector(
                    '[data-offcanvas-region="panel"]'
                );

            const backdropRegion =
                element.querySelector(
                    '[data-offcanvas-region="backdrop"]'
                );

            if (
                !(iconRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(footerRegion instanceof HTMLElement)
                || !(panel instanceof HTMLElement)
                || !(backdropRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Offcanvas rendered regions are missing."
                );
            }

            const title =
                this.config("title");

            const icon =
                this.config("icon");

            const body =
                this.config("body");

            const footer =
                this.config("footer");

            const onOpen =
                this.config(
                    "onOpen"
                );

            const onClose =
                this.config(
                    "onClose"
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Offcanvas title must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Offcanvas icon must be a string."
                );
            }

            if (typeof body !== "string") {
                throw new TypeError(
                    "Offcanvas body must be a string."
                );
            }

            if (typeof footer !== "string") {
                throw new TypeError(
                    "Offcanvas footer must be a string."
                );
            }

            if (
                onOpen !== null
                && typeof onOpen !== "function"
            ) {
                throw new TypeError(
                    "Offcanvas onOpen must be a function or null."
                );
            }

            if (
                onClose !== null
                && typeof onClose !== "function"
            ) {
                throw new TypeError(
                    "Offcanvas onClose must be a function or null."
                );
            }

            renderIcon(
                iconRegion,
                icon
            );

            iconRegion.hidden =
                icon === "";

            global.Builder.text(
                titleRegion,
                title
            );

            titleRegion.hidden =
                title === "";

            global.Builder.html(
                bodyRegion,
                body
            );

            global.Builder.html(
                footerRegion,
                footer
            );

            footerRegion.hidden =
                footer === "";

            backdropRegion.hidden =
                !backdrop;

            if (title !== "") {
                if (titleRegion.id === "") {
                    titleRegion.id =
                        "app-offcanvas-title-"
                        + Math.random()
                            .toString(36)
                            .slice(2);
                }

                panel.setAttribute(
                    "aria-labelledby",
                    titleRegion.id
                );
            } else {
                panel.removeAttribute(
                    "aria-labelledby"
                );
            }

            const controlMenuRegion =
                element.querySelector(
                      '[data-offcanvas-region="control-menu"]'
                  );

            const fullscreenControl =
                element.querySelector(
                      '[data-offcanvas-action="fullscreen"]'
                  );

            const closeControl =
                element.querySelector(
                      '[data-offcanvas-action="close"]'
                  );

            if (
                 !(controlMenuRegion instanceof HTMLElement)
                 || !(fullscreenControl instanceof HTMLButtonElement)
                 || !(closeControl instanceof HTMLButtonElement)
             ) {
                throw new Error(
                      "Offcanvas controls are missing."
                  );
             }

            const closeControlVisible =
                this.config(
                    "closeControlVisible"
                );

            if (typeof closeControlVisible !== "boolean") {
                throw new TypeError(
                    "Offcanvas closeControlVisible must be a boolean."
                );
            }

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
                this.config("controlMenuEnabled") === true
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

            fullscreenControl.hidden =
                this.config(
                      "fullscreenControlVisible"
                 ) !== true;

            closeControl.hidden =
                 !closeControlVisible;

            fullscreenControl.setAttribute(
                 "aria-label",
                fullscreen
                     ? "Exit fullscreen"
                     : "Enter fullscreen"
             );

            fullscreenControl.setAttribute(
                 "title",
                fullscreen
                     ? "Exit fullscreen"
                     : "Enter fullscreen"
             );

            renderIcon(
                fullscreenControl,
                fullscreen
                     ? OFFCANVAS_ICONS.exitFullscreen
                     : OFFCANVAS_ICONS.fullscreen
             );

            return this;
        }
    }

    global.Builder.register(
        "offcanvas",
        Offcanvas,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

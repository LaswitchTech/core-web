(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Modal."
        );
    }

    const MODAL_SIZES = Object.freeze([
        "small",
        "medium",
        "large",
        "xlarge",
    ]);

    const MODAL_COLORS = Object.freeze([
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark",
    ]);

    const MODAL_ICONS = Object.freeze({
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

    function createControlButton(
        action,
        label
    ) {
        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.classList.add(
            "app-modal-control"
        );

        button.setAttribute(
            "data-modal-action",
            action
        );

        button.setAttribute(
            "aria-label",
            label
        );

        button.setAttribute(
            "title",
            label
        );

        return button;
    }

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

    function normalizeSize(value) {
        return MODAL_SIZES.includes(value)
            ? value
            : "medium";
    }

    function normalizeColor(value) {
        return MODAL_COLORS.includes(value)
            ? value
            : "primary";
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Modal controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Modal control menu item configuration is invalid."
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
                    "Modal control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Modal control menu items require href or callback."
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

    class Modal extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick =
                this.handleClick.bind(this);

            this.handleDocumentKeyDown =
                this.handleDocumentKeyDown.bind(this);

            this.controlMenuDropdown =
                null;

            this.footerButtonComponents =
                [];

            this.previousActiveElement =
                null;
        }

        static defaults() {
            return {
                title: "",
                icon: "",
                body: "",
                footer: "",
                size: "medium",
                color: "primary",
                open: false,
                fullscreen: false,
                closeControlVisible: true,
                fullscreenControlVisible: false,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
                closeOnEscape: true,
                closeOnBackdrop: true,
                cancelLabel: "Cancel",
                okLabel: "Ok",
                onCancel: null,
                onOk: null,
                onOpen: null,
                onClose: null,
            };
        }

        focusModal() {
            if (this.config("open") !== true) {
                return this;
            }

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            const dialog =
                element.querySelector(
                    '[data-modal-region="dialog"]'
                );

            if (!(dialog instanceof HTMLElement)) {
                return this;
            }

            const focusable =
                this.getFocusableElements();

            if (focusable.length > 0) {
                focusable[0].focus();

                return this;
            }

            dialog.focus();

            return this;
        }

        syncBodyScrollLock() {
            if (!(document.body instanceof HTMLElement)) {
                return this;
            }

            const openModal =
                document.querySelector(
                    ".app-modal.is-open:not([hidden])"
                );

            document.body.classList.toggle(
                "app-overlay-open",
                openModal !== null
            );

            return this;
        }

        getFocusableElements() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return [];
            }

            const dialog =
                element.querySelector(
                    '[data-modal-region="dialog"]'
                );

            if (!(dialog instanceof HTMLElement)) {
                return [];
            }

            return Array.from(
                dialog.querySelectorAll(
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
            if (
                event.key === "Tab"
                && this.config("open") === true
            ) {
                const focusable =
                    this.getFocusableElements();

                const element =
                    this.element();

                const dialog =
                    element instanceof HTMLElement
                        ? element.querySelector(
                            '[data-modal-region="dialog"]'
                        )
                        : null;

                if (focusable.length === 0) {
                    if (dialog instanceof HTMLElement) {
                        event.preventDefault();
                        dialog.focus();
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
                || this.config("open") !== true
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
                    '[data-modal-region="backdrop"]'
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
                    "[data-modal-action]"
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
                    "data-modal-action"
                );

            if (action === "close") {
                this.close();

                return;
            }

            if (action === "fullscreen") {
                this.toggleFullscreen();
            }
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

            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.close
                    === "function"
            ) {
                this.controlMenuDropdown.close();

                return this;
            }

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
            return this.config(
                "controlMenuEnabled"
            ) === true
                ? this.disableControlMenu()
                : this.enableControlMenu();
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
            return this.config("fullscreen") === true
                ? this.exitFullscreen()
                : this.enterFullscreen();
        }

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Modal control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            MODAL_ICONS.menu,
                        triggerTitle:
                            "Modal controls",
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
                    "Modal control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-modal-control-dropdown"
            );

            this.controlMenuDropdown =
                dropdown;

            return element;
        }

        createDefaultFooterButtons(
            footerRegion
        ) {
            if (!(footerRegion instanceof HTMLElement)) {
                throw new TypeError(
                    "Modal footer region must be an HTMLElement."
                );
            }

            if (!global.Builder.has("button")) {
                throw new Error(
                    "Modal default footer requires the Button component."
                );
            }

            this.destroyFooterButtons();

            footerRegion.replaceChildren();

            const cancelButton =
                global.Builder.create(
                    "button",
                    {
                        label:
                            "Cancel",
                        variant:
                            "secondary",
                        size:
                            "medium",
                        callback:
                            () => {
                                const callback =
                                    this.config(
                                        "onCancel"
                                    );

                                if (
                                    typeof callback
                                    === "function"
                                ) {
                                    callback(
                                        this
                                    );
                                }

                                this.close();
                            },
                    }
                );

            const okButton =
                global.Builder.create(
                    "button",
                    {
                        label:
                            "Ok",
                        variant:
                            "primary",
                        size:
                            "medium",
                        callback:
                            () => {
                                const callback =
                                    this.config(
                                        "onOk"
                                    );

                                if (
                                    typeof callback
                                    === "function"
                                ) {
                                    callback(
                                        this
                                    );
                                }

                                this.close();
                            },
                    }
                );

            cancelButton.appendTo(
                footerRegion
            );

            okButton.appendTo(
                footerRegion
            );

            this.footerButtonComponents.push(
                cancelButton,
                okButton
            );

            return this;
        }

        destroyFooterButtons() {
            this.footerButtonComponents.forEach(
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

            this.footerButtonComponents =
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
            this.destroyControlMenuDropdown();
            this.destroyFooterButtons();

            const renderedElement =
                this.element();

            if (renderedElement instanceof HTMLElement) {
                renderedElement.classList.remove(
                    "is-open"
                );

                renderedElement.hidden =
                    true;
            }

            this.syncBodyScrollLock();

            const element =
                this.element();

            if (element instanceof HTMLElement) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );
            }

            document.removeEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );
        }

        render() {
            const modal =
                document.createElement(
                    "div"
                );

            const backdrop =
                document.createElement(
                    "div"
                );

            const dialog =
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
                createControlButton(
                    "fullscreen",
                    "Enter fullscreen"
                );

            const closeControl =
                createControlButton(
                    "close",
                    "Close modal"
                );

            modal.classList.add(
                "app-modal"
            );

            backdrop.classList.add(
                "app-modal-backdrop"
            );

            backdrop.setAttribute(
                "data-modal-region",
                "backdrop"
            );

            dialog.classList.add(
                "app-modal-dialog"
            );

            header.classList.add(
                "app-modal-header"
            );

            headerIdentity.classList.add(
                "app-modal-header-identity"
            );

            icon.classList.add(
                "app-modal-icon"
            );

            title.classList.add(
                "app-modal-title"
            );

            controls.classList.add(
                "app-modal-controls"
            );

            controlMenuRegion.classList.add(
                "app-modal-control-menu-region"
            );

            controlMenuRegion.setAttribute(
                "data-modal-region",
                "control-menu"
            );

            body.classList.add(
                "app-modal-body"
            );

            footer.classList.add(
                "app-modal-footer"
            );

            icon.setAttribute(
                "data-modal-region",
                "icon"
            );

            title.setAttribute(
                "data-modal-region",
                "title"
            );

            controls.setAttribute(
                "data-modal-region",
                "controls"
            );

            body.setAttribute(
                "data-modal-region",
                "body"
            );

            footer.setAttribute(
                "data-modal-region",
                "footer"
            );

            dialog.setAttribute(
                "data-modal-region",
                "dialog"
            );

            dialog.setAttribute(
                "role",
                "dialog"
            );

            dialog.setAttribute(
                "aria-modal",
                "true"
            );

            dialog.setAttribute(
                "tabindex",
                "-1"
            );

            headerIdentity.append(
                icon,
                title
            );

            renderIcon(
                fullscreenControl,
                MODAL_ICONS.fullscreen
            );

            renderIcon(
                closeControl,
                MODAL_ICONS.close
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

            dialog.append(
                header,
                body,
                footer
            );

            modal.append(
                backdrop,
                dialog
            );

            modal.addEventListener(
                "click",
                this.handleClick
            );

            document.addEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );

            this.update(
                modal
            );

            queueMicrotask(
                () => {
                    if (
                        modal.isConnected
                        && this.config("open") === true
                    ) {
                        this.previousActiveElement =
                            document.activeElement
                                instanceof HTMLElement
                                ? document.activeElement
                                : null;

                        this.focusModal();
                    }
                }
            );

            return modal;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Modal update requires an HTMLElement."
                );
            }

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

            const fullscreen =
                this.config("fullscreen");

            if (typeof open !== "boolean") {
                throw new TypeError(
                    "Modal open must be a boolean."
                );
            }

            if (typeof fullscreen !== "boolean") {
                throw new TypeError(
                    "Modal fullscreen must be a boolean."
                );
            }

            this.config(
                "size",
                size
            );

            this.config(
                "color",
                color
            );

            element.setAttribute(
                "data-modal-size",
                size
            );

            element.setAttribute(
                "data-modal-color",
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
                    '[data-modal-region="icon"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-modal-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-modal-region="body"]'
                );

            const footerRegion =
                element.querySelector(
                    '[data-modal-region="footer"]'
                );

            const dialog =
                element.querySelector(
                    '[data-modal-region="dialog"]'
                );

            if (
                !(iconRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(footerRegion instanceof HTMLElement)
                || !(dialog instanceof HTMLElement)
            ) {
                throw new Error(
                    "Modal rendered regions are missing."
                );
            }

            const title =
                this.config("title");

            const body =
                this.config("body");

            const footer =
                this.config("footer");

            if (typeof title !== "string") {
                throw new TypeError(
                    "Modal title must be a string."
                );
            }

            if (typeof body !== "string") {
                throw new TypeError(
                    "Modal body must be a string."
                );
            }

            if (typeof footer !== "string") {
                throw new TypeError(
                    "Modal footer must be a string."
                );
            }

            const cancelLabel =
                this.config(
                    "cancelLabel"
                );

            const okLabel =
                this.config(
                    "okLabel"
                );

            if (typeof cancelLabel !== "string") {
                throw new TypeError(
                    "Modal cancelLabel must be a string."
                );
            }

            if (typeof okLabel !== "string") {
                throw new TypeError(
                    "Modal okLabel must be a string."
                );
            }

            const onCancel =
                this.config(
                    "onCancel"
                );

            const onOk =
                this.config(
                    "onOk"
                );

            if (
                onCancel !== null
                && typeof onCancel !== "function"
            ) {
                throw new TypeError(
                    "Modal onCancel must be a function or null."
                );
            }

            if (
                onOk !== null
                && typeof onOk !== "function"
            ) {
                throw new TypeError(
                    "Modal onOk must be a function or null."
                );
            }

            const icon =
                this.config("icon");

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Modal icon must be a string."
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

            global.Builder.html(
                bodyRegion,
                body
            );

            if (footer === "") {
                this.destroyFooterButtons();
                footerRegion.hidden = true;
            } else {
                this.createDefaultFooterButtons(
                    footerRegion
                );
                footerRegion.hidden = false;
            }

            titleRegion.hidden =
                title === "";

            if (title !== "") {
                if (titleRegion.id === "") {
                    titleRegion.id =
                        "app-modal-title-"
                        + Math.random()
                            .toString(36)
                            .slice(2);
                }

                dialog.setAttribute(
                    "aria-labelledby",
                    titleRegion.id
                );
            } else {
                dialog.removeAttribute(
                    "aria-labelledby"
                );
            }

            const controlMenuRegion =
                element.querySelector(
                    '[data-modal-region="control-menu"]'
                );

            const fullscreenControl =
                element.querySelector(
                    '[data-modal-action="fullscreen"]'
                );

            const closeControl =
                element.querySelector(
                    '[data-modal-action="close"]'
                );

            if (
                !(controlMenuRegion instanceof HTMLElement)
                || !(fullscreenControl instanceof HTMLButtonElement)
                || !(closeControl instanceof HTMLButtonElement)
            ) {
                throw new Error(
                    "Modal controls are missing."
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
                this.config(
                    "closeControlVisible"
                ) !== true;

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
                    ? MODAL_ICONS.exitFullscreen
                    : MODAL_ICONS.fullscreen
            );

            return this;
        }
    }

    global.Builder.register(
        "modal",
        Modal,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

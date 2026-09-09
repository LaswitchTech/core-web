(function (global) {
    "use strict";

    if (typeof global.Component !== "function") {
        throw new Error(
            "Core-Web Component must be loaded before the Card component."
        );
    }

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before the Card component."
        );
    }
    const CARD_ICONS = Object.freeze({
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
        collapse: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path fill-rule="evenodd" d="M3.646 14.854a.5.5 0 0 0 .708 0L8 11.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708m0-13.708a.5.5 0 0 1 .708 0L8 4.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8"/>',
            "</svg>",
        ].join(""),
        expand: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path fill-rule="evenodd" d="M3.646 10.146a.5.5 0 0 1 .708 0L8 13.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708m0-4.292a.5.5 0 0 0 .708 0L8 2.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8"/>',
            "</svg>",
        ].join(""),
    });

    function createControlButton(action, label) {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("app-card-control");
        button.setAttribute("data-card-action", action);
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);

        return button;
    }


    function renderIcon(element, value) {
        global.Builder.text(element, "");

        if (
            typeof value !== "string"
            || value.trim() === ""
        ) {
            return;
        }

        const parsed = new DOMParser().parseFromString(
            value,
            "image/svg+xml"
        );
        const source = parsed.documentElement;

        if (
            source.localName !== "svg"
            || parsed.querySelector("parsererror") !== null
        ) {
            return;
        }

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        svg.setAttribute(
            "viewBox",
            source.getAttribute("viewBox") || "0 0 16 16"
        );
        svg.setAttribute("fill", "currentColor");
        svg.setAttribute("class", "app-icon");
        svg.setAttribute("aria-hidden", "true");

        source.querySelectorAll("path").forEach(function (sourcePath) {
            const pathData = sourcePath.getAttribute("d");

            if (
                typeof pathData !== "string"
                || pathData.trim() === ""
            ) {
                return;
            }

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            path.setAttribute("d", pathData);

            const fillRule = sourcePath.getAttribute(
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

            svg.append(path);
        });

        if (svg.childElementCount === 0) {
            return;
        }

        element.replaceChildren(svg);
    }

    function renderRegionContent(element, value, htmlEnabled) {
        if (!(element instanceof Element)) {
            throw new TypeError(
                "Card region rendering requires an Element."
            );
        }

        if (value instanceof Element) {
            element.replaceChildren(value);
            return;
        }

        if (value === null || value === undefined) {
            element.replaceChildren();
            return;
        }

        if (typeof value !== "string") {
            throw new TypeError(
                "Card region content must be a string, Element, null, or undefined."
            );
        }

        if (htmlEnabled === true) {
            global.Builder.html(
                element,
                value
            );
        } else {
            global.Builder.text(
                element,
                value
            );
        }
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Card controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Card control menu item configuration is invalid."
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
                    "Card control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Card control menu items require href or callback."
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


    class Card extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick = this.handleClick.bind(this);
            this.controlMenuDropdown = null;
            this.collapseComponent = null;
        }

        static defaults() {
            return {
                title: "",
                subtitle: "",
                content: "",
                footer: "",
                headerVisible: true,
                bodyVisible: true,
                bodyPaddingEnabled: true,
                footerVisible: true,
                headerIcon: "",
                moveHandleVisible: false,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
                closeControlVisible: false,
                fullscreenControlVisible: false,
                collapseControlVisible: false,
                collapsed: false,
                fullscreen: false,
            };
        }

        render() {
            if (
                typeof document === "undefined"
                || typeof document.createElement !== "function"
            ) {
                throw new Error(
                    "Card rendering requires a browser document."
                );
            }

            const card =
                document.createElement("div");

            const overlayControls =
                document.createElement("div");

            const moveHandle =
                createControlButton(
                    "move",
                    "Move card"
                );

            const controlMenuRegion =
                document.createElement("div");

            const header =
                document.createElement("div");

            const headerIdentity =
                document.createElement("div");

            const headerIcon =
                document.createElement("span");

            const headerTitle =
                document.createElement("span");

            const headerSubtitle =
                document.createElement("span");

            const body =
                document.createElement("div");

            const footer =
                document.createElement("div");

            const collapsible =
                document.createElement("div");

            const headerControls =
                document.createElement("div");

            const collapseControl =
                createControlButton(
                    "collapse",
                    "Collapse card"
                );

            const fullscreenControl =
                createControlButton(
                    "fullscreen",
                    "Enter fullscreen"
                );

            const closeControl =
                createControlButton(
                    "close",
                    "Close card"
                );

            card.classList.add(
                "app-card"
            );

            overlayControls.classList.add(
                "app-card-overlay-controls"
            );

            moveHandle.classList.add(
                "app-card-move-handle"
            );

            controlMenuRegion.classList.add(
                "app-card-control-menu-region"
            );

            overlayControls.setAttribute(
                "data-card-region",
                "overlay-controls"
            );

            moveHandle.setAttribute(
                "data-card-region",
                "move-handle"
            );

            controlMenuRegion.setAttribute(
                "data-card-region",
                "control-menu"
            );

            header.classList.add(
                "app-card-header"
            );

            headerIdentity.classList.add(
                "app-card-header-identity"
            );

            headerIcon.classList.add(
                "app-card-header-icon"
            );

            headerTitle.classList.add(
                "app-card-header-title"
            );

            headerSubtitle.classList.add(
                "app-card-header-subtitle"
            );

            headerControls.classList.add(
                "app-card-header-controls"
            );

            body.classList.add(
                "app-card-body"
            );

            footer.classList.add(
                "app-card-footer"
            );

            header.setAttribute(
                "data-card-region",
                "header"
            );

            headerIdentity.setAttribute(
                "data-card-region",
                "header-identity"
            );

            headerIcon.setAttribute(
                "data-card-region",
                "header-icon"
            );

            headerTitle.setAttribute(
                "data-card-region",
                "header-title"
            );

            headerSubtitle.setAttribute(
                "data-card-region",
                "header-subtitle"
            );

            headerControls.setAttribute(
                "data-card-region",
                "header-controls"
            );

            body.setAttribute(
                "data-card-region",
                "body"
            );

            footer.setAttribute(
                "data-card-region",
                "footer"
            );

            renderIcon(
                headerIcon,
                this.config("headerIcon")
            );

            global.Builder.text(
                headerTitle,
                this.config("title")
            );

            headerIdentity.append(
                headerIcon,
                headerTitle,
                headerSubtitle
            );

            renderIcon(
                collapseControl,
                CARD_ICONS.collapse
            );

            renderIcon(
                fullscreenControl,
                CARD_ICONS.fullscreen
            );

            renderIcon(
                closeControl,
                CARD_ICONS.close
            );

            headerControls.append(
                collapseControl,
                fullscreenControl,
                closeControl
            );

            header.append(
                headerIdentity,
                headerControls
            );

            renderRegionContent(
                body,
                this.config("content"),
                true
            );

            renderRegionContent(
                footer,
                this.config("footer"),
                false
            );

            collapsible.append(
                body,
                footer
            );

            if (!global.Builder.has("collapse")) {
                throw new Error(
                    "Card requires the Collapse component."
                );
            }

            this.destroyCollapseComponent();

            this.collapseComponent =
                global.Builder.create(
                    "collapse",
                    {
                        content:
                            collapsible,
                        collapsed:
                            this.config("collapsed") === true,
                    }
                );

            const collapseElement =
                this.collapseComponent.element();

            if (!(collapseElement instanceof HTMLElement)) {
                throw new Error(
                    "Card Collapse component did not render an HTMLElement."
                );
            }

            renderIcon(
                moveHandle,
                CARD_ICONS.move
            );

            overlayControls.append(
                moveHandle,
                controlMenuRegion
            );

            card.append(
                overlayControls,
                header,
                collapseElement
            );

            card.addEventListener(
                "click",
                this.handleClick
            );

            this.update(
                card
            );

            return card;
        }

        handleClick(event) {
            if (!(event.target instanceof Element)) {
                return;
            }

            const control = event.target.closest(
                "[data-card-action]"
            );

            if (
                !(control instanceof HTMLButtonElement)
                || control.closest(".app-card")
                    !== this.element()
            ) {
                return;
            }

            const action = control.getAttribute(
                "data-card-action"
            );

            if (action === "close") {
                this.destroy();
                return;
            }

            if (action === "collapse") {
                this.toggleCollapsed();

                return;
            }

            if (action === "fullscreen") {
                this.toggleFullscreen();

                return;
            }

            return;
        }

        destroyControlMenuDropdown() {
            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.destroy === "function"
            ) {
                this.controlMenuDropdown.destroy();
            }

            this.controlMenuDropdown = null;

            return this;
        }

        destroyCollapseComponent() {
            if (
                this.collapseComponent !== null
                && typeof this.collapseComponent.destroy
                    === "function"
            ) {
                this.collapseComponent.destroy();
            }

            this.collapseComponent = null;

            return this;
        }

        beforeDestroy() {
            this.destroyControlMenuDropdown();
            this.destroyCollapseComponent();

            const element = this.element();

            if (element instanceof Element) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );
            }
        }

        isSortableAvailable() {
            return typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                );
        }

        showHeader() {
            this.config(
                "headerVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideHeader() {
            this.config(
                "headerVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleHeader() {
            return this.config(
                "headerVisible"
            ) === true
                ? this.hideHeader()
                : this.showHeader();
        }

        showBody() {
            this.config(
                "bodyVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideBody() {
            this.config(
                "bodyVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleBody() {
            return this.config(
                "bodyVisible"
            ) === true
                ? this.hideBody()
                : this.showBody();
        }

        showFooter() {
            this.config(
                "footerVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideFooter() {
            this.config(
                "footerVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleFooter() {
            return this.config(
                "footerVisible"
            ) === true
                ? this.hideFooter()
                : this.showFooter();
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
                && typeof this.controlMenuDropdown.open === "function"
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

        showCollapseControl() {
            this.config(
                "collapseControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideCollapseControl() {
            this.config(
                "collapseControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleCollapseControl() {
            return this.config(
                "collapseControlVisible"
            ) === true
                ? this.hideCollapseControl()
                : this.showCollapseControl();
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

        collapse() {
            this.config(
                "collapsed",
                true
            );

            this.refresh();

            return this;
        }

        expand() {
            this.config(
                "collapsed",
                false
            );

            this.refresh();

            return this;
        }

        toggleCollapsed() {
            return this.config(
                "collapsed"
            ) === true
                ? this.expand()
                : this.collapse();
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

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Card control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            CARD_ICONS.menu,
                        triggerTitle:
                            "Card controls",
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
                    "Card control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-card-control-dropdown"
            );

            this.controlMenuDropdown =
                dropdown;

            return element;
        }

        updateOverlayControls(
            overlayControls,
            moveHandle,
            controlMenuRegion,
            header
        ) {
            const items =
                normalizeControlMenuItems(
                    this.config(
                        "controlMenuItems"
                    )
                );

            this.config(
                "controlMenuItems",
                items
            );

            moveHandle.hidden =
                this.config("moveHandleVisible") !== true
                || !this.isSortableAvailable();

            const menuVisible =
                this.config("controlMenuEnabled") === true
                && items.length > 0;

            this.destroyControlMenuDropdown();

            controlMenuRegion.replaceChildren();

            if (menuVisible) {
                controlMenuRegion.append(
                    this.createControlMenuDropdown(
                        items
                    )
                );
            }

            controlMenuRegion.hidden =
                !menuVisible;

            overlayControls.hidden =
                moveHandle.hidden
                && !menuVisible;

            header.classList.toggle(
                "has-move-handle",
                !moveHandle.hidden
            );

            header.classList.toggle(
                "has-control-menu",
                menuVisible
            );

            return this;
        }

        updateHeaderControls(
            header,
            headerIcon,
            headerTitle,
            headerSubtitle,
            headerControls,
            collapseControl,
            fullscreenControl,
            closeControl
        ) {
            const subtitle =
                this.config(
                    "subtitle"
                );

            if (typeof subtitle !== "string") {
                throw new TypeError(
                    "Card subtitle must be a string."
                );
            }

            collapseControl.hidden =
                this.config("collapseControlVisible") !== true;

            fullscreenControl.hidden =
                this.config("fullscreenControlVisible") !== true;

            closeControl.hidden =
                this.config("closeControlVisible") !== true;

            headerControls.hidden =
                collapseControl.hidden
                && fullscreenControl.hidden
                && closeControl.hidden;

            header.hidden =
                this.config("headerVisible") !== true;

            renderIcon(
                headerIcon,
                this.config("headerIcon")
            );

            global.Builder.text(
                headerTitle,
                this.config("title")
            );

            global.Builder.text(
                headerSubtitle,
                subtitle
            );

            headerSubtitle.hidden =
                subtitle === "";

            return this;
        }

        updateBodyAndState(
            element,
            body,
            footer,
            collapseControl,
            fullscreenControl
        ) {
            const bodyPaddingEnabled =
                this.config(
                    "bodyPaddingEnabled"
                );

            if (typeof bodyPaddingEnabled !== "boolean") {
                throw new TypeError(
                    "Card bodyPaddingEnabled must be a boolean."
                );
            }

            const collapsed =
                this.config("collapsed") === true;

            const fullscreen =
                this.config("fullscreen") === true;

            body.hidden =
                this.config("bodyVisible") !== true;

            body.classList.toggle(
                "app-card-body-flush",
                bodyPaddingEnabled === false
            );

            renderRegionContent(
                body,
                this.config("content"),
                true
            );

            footer.hidden =
                this.config("footerVisible") !== true;

            renderRegionContent(
                footer,
                this.config("footer"),
                false
            );

            if (this.collapseComponent === null) {
                throw new Error(
                    "Card Collapse component is missing."
                );
            }

            this.collapseComponent.config(
                "collapsed",
                collapsed
            );

            this.collapseComponent.refresh();

            element.classList.toggle(
                "is-collapsed",
                collapsed
            );

            element.classList.toggle(
                "is-fullscreen",
                fullscreen
            );

            element.setAttribute(
                "aria-expanded",
                collapsed ? "false" : "true"
            );

            collapseControl.setAttribute(
                "aria-label",
                collapsed ? "Expand card" : "Collapse card"
            );

            collapseControl.setAttribute(
                "title",
                collapsed ? "Expand card" : "Collapse card"
            );

            renderIcon(
                collapseControl,
                collapsed
                    ? CARD_ICONS.expand
                    : CARD_ICONS.collapse
            );

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
                    ? CARD_ICONS.exitFullscreen
                    : CARD_ICONS.fullscreen
            );

            return this;
        }

        update(element) {
            if (
                typeof Element === "undefined"
                || !(element instanceof Element)
            ) {
                throw new TypeError(
                    "Card update requires the rendered Element."
                );
            }

            const overlayControls =
                element.querySelector(
                    '[data-card-region="overlay-controls"]'
                );

            const controlMenuRegion =
                element.querySelector(
                    '[data-card-region="control-menu"]'
                );

            const moveHandle =
                element.querySelector(
                    '[data-card-action="move"]'
                );

            const header =
                element.querySelector(
                    '[data-card-region="header"]'
                );

            const headerIcon =
                element.querySelector(
                    '[data-card-region="header-icon"]'
                );

            const headerTitle =
                element.querySelector(
                    '[data-card-region="header-title"]'
                );

            const headerSubtitle =
                element.querySelector(
                    '[data-card-region="header-subtitle"]'
                );

            const headerControls =
                element.querySelector(
                    '[data-card-region="header-controls"]'
                );

            const collapseControl =
                element.querySelector(
                    '[data-card-action="collapse"]'
                );

            const fullscreenControl =
                element.querySelector(
                    '[data-card-action="fullscreen"]'
                );

            const closeControl =
                element.querySelector(
                    '[data-card-action="close"]'
                );

            const body =
                element.querySelector(
                    ':scope > .app-collapse > .app-collapse-content > * > [data-card-region="body"]'
                );

            const footer =
                element.querySelector(
                    ':scope > .app-collapse > .app-collapse-content > * > [data-card-region="footer"]'
                );

            if (
                !(overlayControls instanceof Element)
                || !(controlMenuRegion instanceof Element)
                || !(moveHandle instanceof HTMLButtonElement)
                || !(header instanceof Element)
                || !(headerIcon instanceof Element)
                || !(headerTitle instanceof Element)
                || !(headerSubtitle instanceof Element)
                || !(headerControls instanceof Element)
                || !(collapseControl instanceof HTMLButtonElement)
                || !(fullscreenControl instanceof HTMLButtonElement)
                || !(closeControl instanceof HTMLButtonElement)
                || !(body instanceof Element)
                || !(footer instanceof Element)
            ) {
                throw new Error(
                    "Card rendered structure is incomplete."
                );
            }

            this.updateOverlayControls(
                overlayControls,
                moveHandle,
                controlMenuRegion,
                header
            );

            this.updateHeaderControls(
                header,
                headerIcon,
                headerTitle,
                headerSubtitle,
                headerControls,
                collapseControl,
                fullscreenControl,
                closeControl
            );

            this.updateBodyAndState(
                element,
                body,
                footer,
                collapseControl,
                fullscreenControl
            );

            return this;
        }
    }

    global.Builder.register(
        "card",
        Card,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

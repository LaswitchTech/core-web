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


    class Card extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick = this.handleClick.bind(this);
        }

        static defaults() {
            return {
                title: "",
                content: "",
                footer: "",
                headerVisible: true,
                bodyVisible: true,
                footerVisible: true,
                headerIcon: "",
                moveHandleVisible: false,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuContent: "",
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

            const menuControl =
                createControlButton(
                    "menu",
                    "Open card controls"
                );

            const controlMenu =
                document.createElement("div");

            const header =
                document.createElement("div");

            const headerIdentity =
                document.createElement("div");

            const headerIcon =
                document.createElement("span");

            const headerTitle =
                document.createElement("span");

            const body =
                document.createElement("div");

            const footer =
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

            card.classList.add("app-card");
            overlayControls.classList.add(
                "app-card-overlay-controls"
            );
            moveHandle.classList.add(
                "app-card-move-handle"
            );
            menuControl.classList.add(
                "app-card-menu-control"
            );
            controlMenu.classList.add(
                "app-card-control-menu"
            );

            overlayControls.setAttribute(
                "data-card-region",
                "overlay-controls"
            );

            moveHandle.setAttribute(
                "data-card-region",
                "move-handle"
            );

            menuControl.setAttribute(
                "data-card-region",
                "menu-control"
            );

            controlMenu.setAttribute(
                "data-card-region",
                "control-menu"
            );

            header.classList.add("app-card-header");
            headerIdentity.classList.add(
                "app-card-header-identity"
            );
            headerIcon.classList.add(
                "app-card-header-icon"
            );
            headerTitle.classList.add(
                "app-card-header-title"
            );
            headerControls.classList.add(
                "app-card-header-controls"
            );
            body.classList.add("app-card-body");
            footer.classList.add("app-card-footer");

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
                headerTitle
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

            global.Builder.html(
                body,
                this.config("content")
            );

            global.Builder.text(
                footer,
                this.config("footer")
            );

            renderIcon(
                moveHandle,
                CARD_ICONS.move
            );

            renderIcon(
                menuControl,
                CARD_ICONS.menu
            );

            overlayControls.append(
                moveHandle,
                menuControl,
                controlMenu
            );

            card.append(
                overlayControls,
                header,
                body,
                footer
            );

            card.addEventListener(
                "click",
                this.handleClick
            );

            this.update(card);

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
                || !this.element()?.contains(control)
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
                this.config(
                    "collapsed",
                    this.config("collapsed") !== true
                );
                this.refresh();
                return;
            }

            if (action === "fullscreen") {
                this.config(
                    "fullscreen",
                    this.config("fullscreen") !== true
                );
                this.refresh();
                return;
            }

            if (action !== "menu") {
                return;
            }

            this.config(
                "controlMenuOpen",
                this.config("controlMenuOpen") !== true
            );

            this.refresh();
        }

        beforeDestroy() {
            const element = this.element();

            if (element instanceof Element) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );
            }
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

            const controlMenu =
                element.querySelector(
                    '[data-card-region="control-menu"]'
                );

            const moveHandle =
                element.querySelector(
                    '[data-card-action="move"]'
                );

            const menuControl =
                element.querySelector(
                    '[data-card-action="menu"]'
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
                    '[data-card-region="body"]'
                );

            const footer =
                element.querySelector(
                    '[data-card-region="footer"]'
                );

            if (
                !(overlayControls instanceof Element)
                || !(controlMenu instanceof Element)
                || !(moveHandle instanceof HTMLButtonElement)
                || !(menuControl instanceof HTMLButtonElement)
                || !(header instanceof Element)
                || !(headerIcon instanceof Element)
                || !(headerTitle instanceof Element)
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

            moveHandle.hidden =
                this.config("moveHandleVisible") !== true;

            menuControl.hidden =
                this.config("controlMenuEnabled") !== true;

            controlMenu.hidden =
                this.config("controlMenuEnabled") !== true
                || this.config("controlMenuOpen") !== true;

            overlayControls.hidden =
                moveHandle.hidden
                && menuControl.hidden;

            header.classList.toggle(
                "has-move-handle",
                !moveHandle.hidden
            );

            header.classList.toggle(
                "has-control-menu",
                !menuControl.hidden
            );

            menuControl.setAttribute(
                "aria-expanded",
                controlMenu.hidden ? "false" : "true"
            );

            global.Builder.html(
                controlMenu,
                this.config("controlMenuContent")
            );

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

            header.hidden = this.config("headerVisible") !== true;

            renderIcon(
                headerIcon,
                this.config("headerIcon")
            );

            global.Builder.text(
                headerTitle,
                this.config("title")
            );

            const collapsed =
                this.config("collapsed") === true;

            const fullscreen =
                this.config("fullscreen") === true;

            body.hidden =
                this.config("bodyVisible") !== true
                || collapsed;

            global.Builder.html(
                body,
                this.config("content")
            );

            footer.hidden =
                this.config("footerVisible") !== true
                || collapsed;

            global.Builder.text(
                footer,
                this.config("footer")
            );

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

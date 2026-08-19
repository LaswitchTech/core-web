(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Badge."
        );
    }

    const BADGE_ICONS = Object.freeze({
        default: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>',
            "</svg>",
        ].join(""),
        move: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>',
            "</svg>",
        ].join(""),
    });

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

    function normalizeBadgeColor(value) {
        const colors = [
            "primary",
            "secondary",
            "success",
            "danger",
            "warning",
            "info",
            "light",
            "dark",
        ];

        return colors.includes(value)
            ? value
            : "primary";
    }

    class Badge extends global.Component {
        static defaults() {
            return {
                href: "",
                icon: "",
                color: "primary",
                moveHandleVisible: false,
                value: "",
                label: "",
                tooltip: "",
            };
        }

        isSortableAvailable() {
            return typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                );
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
                normalizeBadgeColor(color)
            );

            this.refresh();

            return this;
        }

        render() {
            const badge = document.createElement(
                this.config("href") === "" ? "div" : "a"
            );
            const moveHandle = document.createElement("button");
            const icon = document.createElement("span");
            const content = document.createElement("span");
            const value = document.createElement("span");
            const label = document.createElement("span");

            badge.classList.add("app-badge");

            moveHandle.type = "button";
            moveHandle.classList.add(
                "app-badge-move-handle"
            );
            moveHandle.setAttribute(
                "data-badge-region",
                "move-handle"
            );
            moveHandle.setAttribute(
                "aria-label",
                "Move badge"
            );
            moveHandle.setAttribute(
                "title",
                "Move badge"
            );

            icon.classList.add("app-badge-icon");
            content.classList.add("app-badge-content");
            value.classList.add("app-badge-value");
            label.classList.add("app-badge-label");

            icon.setAttribute("data-badge-region", "icon");
            value.setAttribute("data-badge-region", "value");
            label.setAttribute("data-badge-region", "label");

            content.append(value, label);

            renderIcon(
                moveHandle,
                BADGE_ICONS.move
            );

            badge.append(
                moveHandle,
                icon,
                content
            );

            this.update(badge);

            return badge;
        }

        update(element) {
            const moveHandle = element.querySelector(
                '[data-badge-region="move-handle"]'
            );

            const icon = element.querySelector(
                '[data-badge-region="icon"]'
            );
            const value = element.querySelector(
                '[data-badge-region="value"]'
            );
            const label = element.querySelector(
                '[data-badge-region="label"]'
            );

            if (
                !(moveHandle instanceof HTMLButtonElement)
                || !(icon instanceof Element)
                || !(value instanceof Element)
                || !(label instanceof Element)
            ) {
                throw new Error(
                    "Badge regions are missing from the rendered element."
                );
            }

            const href = this.config("href");
            const tooltip = this.config("tooltip");
            const color = normalizeBadgeColor(
                this.config("color")
            );

            element.setAttribute(
                "data-badge-color",
                color
            );

            moveHandle.hidden =
                this.config("moveHandleVisible") !== true
                || !this.isSortableAvailable();

            element.classList.toggle(
                "has-move-handle",
                !moveHandle.hidden
            );

            if (element instanceof HTMLAnchorElement) {
                element.href = href;
            }

            if (tooltip === "") {
                element.removeAttribute("title");
            } else {
                element.setAttribute("title", tooltip);
            }

            renderIcon(
                icon,
                this.config("icon") || BADGE_ICONS.default
            );

            global.Builder.text(value, this.config("value"));
            global.Builder.text(label, this.config("label"));

            return this;
        }
    }

    global.Builder.register(
        "badge",
        Badge,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

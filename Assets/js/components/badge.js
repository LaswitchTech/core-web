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

    class Badge extends global.Component {
        static defaults() {
            return {
                href: "",
                icon: "",
                value: "",
                label: "",
                tooltip: "",
            };
        }

        render() {
            const badge = document.createElement(
                this.config("href") === "" ? "div" : "a"
            );
            const icon = document.createElement("span");
            const content = document.createElement("span");
            const value = document.createElement("span");
            const label = document.createElement("span");

            badge.classList.add("app-badge");
            icon.classList.add("app-badge-icon");
            content.classList.add("app-badge-content");
            value.classList.add("app-badge-value");
            label.classList.add("app-badge-label");

            icon.setAttribute("data-badge-region", "icon");
            value.setAttribute("data-badge-region", "value");
            label.setAttribute("data-badge-region", "label");

            content.append(value, label);
            badge.append(icon, content);

            this.update(badge);

            return badge;
        }

        update(element) {
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
                !(icon instanceof Element)
                || !(value instanceof Element)
                || !(label instanceof Element)
            ) {
                throw new Error(
                    "Badge regions are missing from the rendered element."
                );
            }

            const href = this.config("href");
            const tooltip = this.config("tooltip");

            if (element instanceof HTMLAnchorElement) {
                element.href = href;
            }

            if (tooltip === "") {
                element.removeAttribute("title");
            } else {
                element.setAttribute("title", tooltip);
            }

            renderIcon(icon, this.config("icon"));
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

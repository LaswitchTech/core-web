(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Button."
        );
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
                sourcePath.getAttribute("d");

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

    const BUTTON_TYPES = Object.freeze([
        "button",
        "reset",
        "submit",
    ]);

    const BUTTON_VARIANTS = Object.freeze([
        "danger",
        "dark",
        "info",
        "light",
        "link",
        "primary",
        "secondary",
        "success",
        "warning",
    ]);

    const BUTTON_SIZES = Object.freeze([
        "small",
        "medium",
        "large",
    ]);

    class Button extends global.Component {
        static defaults() {
            return {
                label: "",
                icon: "",
                href: "",
                callback: null,
                type: "button",
                variant: "primary",
                size: "medium",
                disabled: false,
                loading: false,
                title: "",
            };
        }

        constructor(config) {
            super(config);

            this.handleClick =
                this.handleClick.bind(this);
        }

        beforeDestroy() {
            const element =
                this.element();

            if (element instanceof HTMLButtonElement) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );
            }
        }

        handleClick(event) {
            if (
                !(event.currentTarget instanceof HTMLButtonElement)
                || event.currentTarget.disabled
            ) {
                return;
            }

            const callback =
                this.config("callback");

            if (typeof callback === "function") {
                callback(
                    event,
                    this
                );
            }

            const href =
                this.config("href");

            if (href !== "") {
                global.location.href =
                    href;
            }
        }

        render() {
            const button =
                document.createElement(
                    "button"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const label =
                document.createElement(
                    "span"
                );

            button.classList.add(
                "app-button"
            );

            icon.classList.add(
                "app-button-icon"
            );

            label.classList.add(
                "app-button-label"
            );

            icon.setAttribute(
                "data-button-region",
                "icon"
            );

            label.setAttribute(
                "data-button-region",
                "label"
            );

            button.append(
                icon,
                label
            );

            button.addEventListener(
                "click",
                this.handleClick
            );

            this.update(
                button
            );

            return button;
        }

        update(element) {
            if (!(element instanceof HTMLButtonElement)) {
                throw new TypeError(
                    "Button update() requires an HTMLButtonElement."
                );
            }

            const label = this.config("label");
            const icon = this.config("icon");
            const href = this.config("href");
            const callback = this.config("callback");
            const type = this.config("type");
            const variant = this.config("variant");
            const size = this.config("size");
            const title = this.config("title");

            if (typeof label !== "string") {
                throw new TypeError(
                    "Button label must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Button icon must be a string."
                );
            }

            if (typeof href !== "string") {
                throw new TypeError(
                    "Button href must be a string."
                );
            }

            if (
                callback !== null
                && typeof callback !== "function"
            ) {
                throw new TypeError(
                    "Button callback must be a function or null."
                );
            }

            if (
                typeof type !== "string"
                || !BUTTON_TYPES.includes(type)
            ) {
                throw new TypeError(
                    "Button type must be button, reset, or submit."
                );
            }

            if (
                typeof variant !== "string"
                || !BUTTON_VARIANTS.includes(variant)
            ) {
                throw new TypeError(
                    "Button variant must be danger, dark, info, light, link, primary, secondary, success, or warning."
                );
            }

            if (
                typeof size !== "string"
                || !BUTTON_SIZES.includes(size)
            ) {
                throw new TypeError(
                    "Button size must be small, medium, or large."
                );
            }

            if (typeof title !== "string") {
                throw new TypeError(
                    "Button title must be a string."
                );
            }

            element.type = type;

            const iconRegion =
                element.querySelector(
                    '[data-button-region="icon"]'
                );

            const labelRegion =
                element.querySelector(
                    '[data-button-region="label"]'
                );

            if (
                !(iconRegion instanceof HTMLElement)
                || !(labelRegion instanceof HTMLSpanElement)
            ) {
                throw new Error(
                    "Button rendered regions are missing."
                );
            }

            renderIcon(
                iconRegion,
                icon
            );

            global.Builder.text(
                labelRegion,
                this.config("loading") === true
                    ? "Loading..."
                    : label
            );

            iconRegion.hidden =
                icon === ""
                || this.config("loading") === true;

            labelRegion.hidden =
                label === ""
                && this.config("loading") !== true;

            element.disabled =
                this.config("disabled") === true
                || this.config("loading") === true;

            element.classList.remove(
                "app-button-danger",
                "app-button-dark",
                "app-button-info",
                "app-button-light",
                "app-button-link",
                "app-button-primary",
                "app-button-secondary",
                "app-button-success",
                "app-button-warning",
                "app-button-small",
                "app-button-medium",
                "app-button-large",
                "is-loading"
            );

            element.classList.add(
                "app-button-" + variant,
                "app-button-" + size
            );

            element.classList.toggle(
                "is-loading",
                this.config("loading") === true
            );

            if (title === "") {
                element.removeAttribute("title");
            } else {
                element.title = title;
            }

            element.setAttribute(
                "aria-busy",
                this.config("loading") === true
                    ? "true"
                    : "false"
            );

            return this;
        }
    }

    global.Builder.register(
        "button",
        Button,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

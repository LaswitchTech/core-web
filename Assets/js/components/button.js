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
                type: "button",
                variant: "primary",
                size: "medium",
                disabled: false,
                loading: false,
                title: "",
            };
        }

        render() {
            const button = document.createElement("button");

            button.classList.add("app-button");

            this.update(button);

            return button;
        }

        update(element) {
            if (!(element instanceof HTMLButtonElement)) {
                throw new TypeError(
                    "Button update() requires an HTMLButtonElement."
                );
            }

            const label = this.config("label");
            const type = this.config("type");
            const variant = this.config("variant");
            const size = this.config("size");
            const title = this.config("title");

            if (typeof label !== "string") {
                throw new TypeError(
                    "Button label must be a string."
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

            global.Builder.text(
                element,
                this.config("loading") === true
                    ? "Loading..."
                    : label
            );

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

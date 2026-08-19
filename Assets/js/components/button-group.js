(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Button Group."
        );
    }

    const ORIENTATIONS = Object.freeze([
        "horizontal",
        "vertical",
    ]);

    const PRESENTATIONS = Object.freeze([
        "spaced",
        "attached",
    ]);

    function normalizeButtons(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Button Group buttons must be an array."
            );
        }

        return value.map(function (button) {
            if (
                button === null
                || typeof button !== "object"
                || Array.isArray(button)
            ) {
                throw new TypeError(
                    "Button Group button configuration is invalid."
                );
            }

            return Object.assign(
                {},
                button
            );
        });
    }

    class ButtonGroup extends global.Component {
        constructor(config) {
            super(config);

            this.buttons = [];
        }

        destroyButtons() {
            this.buttons.forEach(
                function (button) {
                    if (
                        button
                        && typeof button.destroy === "function"
                    ) {
                        button.destroy();
                    }
                }
            );

            this.buttons = [];

            return this;
        }

        beforeDestroy() {
            this.destroyButtons();
        }

        render() {
            const group =
                document.createElement(
                    "div"
                );

            const buttons =
                document.createElement(
                    "div"
                );

            group.classList.add(
                "app-button-group"
            );

            group.setAttribute(
                "role",
                "group"
            );

            buttons.classList.add(
                "app-button-group-buttons"
            );

            buttons.setAttribute(
                "data-button-group-region",
                "buttons"
            );

            group.append(
                buttons
            );

            this.update(
                group
            );

            return group;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Button Group update requires an HTMLElement."
                );
            }

            const buttons =
                normalizeButtons(
                    this.config("buttons")
                );

            const orientation =
                this.config(
                    "orientation"
                );

            const equalWidth =
                this.config(
                    "equalWidth"
                );

            const presentation =
                this.config(
                    "presentation"
                );

            const wrap =
                this.config(
                    "wrap"
                );

            if (!ORIENTATIONS.includes(orientation)) {
                throw new TypeError(
                    "Button Group orientation is invalid."
                );
            }

            if (typeof equalWidth !== "boolean") {
                throw new TypeError(
                    "Button Group equalWidth must be a boolean."
                );
            }

            if (!PRESENTATIONS.includes(presentation)) {
                throw new TypeError(
                    "Button Group presentation is invalid."
                );
            }

            if (typeof wrap !== "boolean") {
                throw new TypeError(
                    "Button Group wrap must be a boolean."
                );
            }

            this.config(
                "buttons",
                buttons
            );

            element.setAttribute(
                "data-button-group-orientation",
                orientation
            );

            element.setAttribute(
                "data-button-group-presentation",
                presentation
            );

            element.classList.toggle(
                "is-equal-width",
                equalWidth
            );

            element.classList.toggle(
                "is-wrapping",
                wrap
            );

            const buttonsRegion =
                element.querySelector(
                    '[data-button-group-region="buttons"]'
                );

            if (!(buttonsRegion instanceof HTMLElement)) {
                throw new Error(
                    "Button Group buttons region is missing."
                );
            }

            if (!global.Builder.has("button")) {
                throw new Error(
                    "Button Group requires the Button component."
                );
            }

            this.destroyButtons();

            buttonsRegion.replaceChildren();

            buttons.forEach(
                (config) => {
                    const button =
                        global.Builder.create(
                            "button",
                            config
                        );

                    const buttonElement =
                        button.element();

                    if (
                        !(
                            buttonElement
                            instanceof HTMLButtonElement
                        )
                    ) {
                        button.destroy();

                        throw new Error(
                            "Button Group child Button did not render an HTMLButtonElement."
                        );
                    }

                    buttonElement.classList.add(
                        "app-button-group-button"
                    );

                    button.appendTo(
                        buttonsRegion
                    );

                    this.buttons.push(
                        button
                    );
                }
            );

            return this;
        }

        static defaults() {
            return {
                buttons: [],
                orientation: "horizontal",
                equalWidth: false,
                presentation: "spaced",
                wrap: true,
            };
        }
    }

    global.Builder.register(
        "button-group",
        ButtonGroup,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);
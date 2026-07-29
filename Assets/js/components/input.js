(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Input."
        );
    }

    const INPUT_TYPES = Object.freeze([
        "email",
        "file",
        "number",
        "password",
        "search",
        "tel",
        "text",
        "url",
    ]);

    class Input extends global.Component {
        static defaults() {
            return {
                type: "text",
                name: "",
                value: "",
                placeholder: "",
                autocomplete: "",
                accept: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                readonly: false,
                invalid: false,
            };
        }

        render() {
            const input = document.createElement("input");

            input.classList.add("app-form-control");

            this.update(input);

            return input;
        }

        update(element) {
            if (!(element instanceof HTMLInputElement)) {
                throw new TypeError(
                    "Input update() requires an HTMLInputElement."
                );
            }

            const type = this.config("type");
            const name = this.config("name");
            const value = this.config("value");
            const placeholder = this.config("placeholder");
            const autocomplete = this.config("autocomplete");
            const accept = this.config("accept");
            const describedBy = this.config("describedBy");

            if (
                typeof type !== "string"
                || !INPUT_TYPES.includes(type)
            ) {
                throw new TypeError(
                    "Input type must be email, file, number, password, search, tel, text, or url."
                );
            }

            if (typeof name !== "string") {
                throw new TypeError(
                    "Input name must be a string."
                );
            }

            if (
                value !== null
                && typeof value !== "string"
                && typeof value !== "number"
            ) {
                throw new TypeError(
                    "Input value must be a string, number, or null."
                );
            }

            if (typeof placeholder !== "string") {
                throw new TypeError(
                    "Input placeholder must be a string."
                );
            }

            if (typeof autocomplete !== "string") {
                throw new TypeError(
                    "Input autocomplete must be a string."
                );
            }

            if (typeof accept !== "string") {
                throw new TypeError(
                    "Input accept must be a string."
                );
            }

            if (typeof describedBy !== "string") {
                throw new TypeError(
                    "Input describedBy must be a string."
                );
            }

            element.type = type;
            element.classList.toggle(
                "app-form-control-file",
                type === "file"
            );
            element.name = name;

            if (type === "file") {
                element.value = "";
            } else {
                element.value =
                    value === null ? "" : String(value);
            }

            element.placeholder = placeholder;
            element.multiple =
                this.config("multiple") === true;
            element.required =
                this.config("required") === true;
            element.disabled =
                this.config("disabled") === true;
            element.readOnly =
                this.config("readonly") === true;

            if (autocomplete === "") {
                element.removeAttribute("autocomplete");
            } else {
                element.setAttribute(
                    "autocomplete",
                    autocomplete
                );
            }

            if (accept === "") {
                element.removeAttribute("accept");
            } else {
                element.setAttribute(
                    "accept",
                    accept
                );
            }

            if (describedBy === "") {
                element.removeAttribute("aria-describedby");
            } else {
                element.setAttribute(
                    "aria-describedby",
                    describedBy
                );
            }

            const invalid =
                this.config("invalid") === true;

            element.classList.toggle(
                "is-invalid",
                invalid
            );

            if (invalid) {
                element.setAttribute(
                    "aria-invalid",
                    "true"
                );
            } else {
                element.removeAttribute("aria-invalid");
            }

            return this;
        }
    }

    global.Builder.register(
        "input",
        Input,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

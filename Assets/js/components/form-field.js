(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Form Field."
        );
    }

    class FormField extends global.Component {
        static defaults() {
            return {
                controlId: "",
                label: "",
                description: "",
                error: "",
                required: false,
            };
        }

        render() {
            const field = document.createElement("div");

            field.classList.add("app-form-field");

            const label = document.createElement("label");

            label.classList.add("app-form-label");
            label.setAttribute(
                "data-form-field-region",
                "label"
            );

            const description = document.createElement("p");

            description.classList.add(
                "app-form-description"
            );

            description.setAttribute(
                "data-form-field-region",
                "description"
            );

            const control = document.createElement("div");

            control.classList.add(
                "app-form-control-mount"
            );

            control.setAttribute(
                "data-form-field-region",
                "control"
            );

            const error = document.createElement("div");

            error.classList.add(
                "app-form-error"
            );

            error.setAttribute(
                "data-form-field-region",
                "error"
            );

            error.setAttribute(
                "role",
                "alert"
            );

            field.append(
                label,
                description,
                control,
                error
            );

            this.update(field);

            return field;
        }

        update(element) {
            if (!(element instanceof HTMLDivElement)) {
                throw new TypeError(
                    "Form Field update() requires an HTMLDivElement."
                );
            }

            const controlId =
                this.config("controlId");

            const labelText =
                this.config("label");

            const descriptionText =
                this.config("description");

            const errorText =
                this.config("error");

            if (typeof controlId !== "string") {
                throw new TypeError(
                    "Form Field controlId must be a string."
                );
            }

            if (typeof labelText !== "string") {
                throw new TypeError(
                    "Form Field label must be a string."
                );
            }

            if (typeof descriptionText !== "string") {
                throw new TypeError(
                    "Form Field description must be a string."
                );
            }

            if (typeof errorText !== "string") {
                throw new TypeError(
                    "Form Field error must be a string."
                );
            }

            const label = element.querySelector(
                '[data-form-field-region="label"]'
            );

            const description = element.querySelector(
                '[data-form-field-region="description"]'
            );

            const error = element.querySelector(
                '[data-form-field-region="error"]'
            );

            if (
                !(label instanceof HTMLLabelElement)
                || !(description instanceof HTMLParagraphElement)
                || !(error instanceof HTMLDivElement)
            ) {
                throw new Error(
                    "Form Field rendered regions are invalid."
                );
            }

            const descriptionId =
                controlId === ""
                    ? ""
                    : controlId + "-description";

            const errorId =
                controlId === ""
                    ? ""
                    : controlId + "-error";

            if (controlId === "") {
                label.removeAttribute("for");
            } else {
                label.htmlFor = controlId;
            }

            global.Builder.text(
                label,
                labelText
            );

            label.classList.toggle(
                "is-required",
                this.config("required") === true
            );

            global.Builder.text(
                description,
                descriptionText
            );

            description.hidden =
                descriptionText === "";

            if (descriptionId === "") {
                description.removeAttribute("id");
            } else {
                description.id = descriptionId;
            }

            global.Builder.text(
                error,
                errorText
            );

            error.hidden =
                errorText === "";

            if (errorId === "") {
                error.removeAttribute("id");
            } else {
                error.id = errorId;
            }

            element.classList.toggle(
                "is-invalid",
                errorText !== ""
            );

            return this;
        }

        controlMount() {
            const element = this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Form Field must be rendered before resolving its control mount."
                );
            }

            const control = element.querySelector(
                '[data-form-field-region="control"]'
            );

            if (!(control instanceof HTMLDivElement)) {
                throw new Error(
                    "Form Field control mount is invalid."
                );
            }

            return control;
        }

        descriptionId() {
            const controlId =
                this.config("controlId");

            return typeof controlId === "string"
                && controlId !== ""
                    ? controlId + "-description"
                    : "";
        }

        errorId() {
            const controlId =
                this.config("controlId");

            return typeof controlId === "string"
                && controlId !== ""
                    ? controlId + "-error"
                    : "";
        }
    }

    global.Builder.register(
        "form-field",
        FormField,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

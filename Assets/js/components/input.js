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
        "date",
        "datetime-local",
        "email",
        "file",
        "number",
        "password",
        "search",
        "tel",
        "text",
        "time",
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
                label: "",
                clearActionEnabled: false,
                defaultActionEnabled: false,
                defaultValue: "",
                resetActionEnabled: false,
                previousValue: "",
            };
        }

        render() {
            const group = document.createElement("div");
            const label = document.createElement("span");
            const input = document.createElement("input");
            const clearAction =
                document.createElement("button");
            clearAction.type = "button";
            clearAction.classList.add(
                "app-input-group-action"
            );

            const clearIcon = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            clearIcon.setAttribute(
                "xmlns",
                "http://www.w3.org/2000/svg"
            );

            clearIcon.setAttribute(
                "width",
                "16"
            );

            clearIcon.setAttribute(
                "height",
                "16"
            );

            clearIcon.setAttribute(
                "fill",
                "currentColor"
            );

            clearIcon.classList.add("app-icon");

            clearIcon.setAttribute(
                "viewBox",
                "0 0 16 16"
            );

            clearIcon.setAttribute(
                "aria-hidden",
                "true"
            );

            const clearIconPath =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            clearIconPath.setAttribute(
                "d",
                "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"
            );

            clearIcon.append(clearIconPath);

            clearAction.append(clearIcon);

            const defaultAction =
                document.createElement("button");

            const defaultIcon =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );

            defaultIcon.setAttribute(
                "xmlns",
                "http://www.w3.org/2000/svg"
            );
            defaultIcon.setAttribute("width", "16");
            defaultIcon.setAttribute("height", "16");
            defaultIcon.setAttribute(
                "fill",
                "currentColor"
            );
            defaultIcon.classList.add("app-icon");
            defaultIcon.setAttribute(
                "viewBox",
                "0 0 16 16"
            );
            defaultIcon.setAttribute(
                "aria-hidden",
                "true"
            );

            const defaultIconPathOne =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            defaultIconPathOne.setAttribute(
                "fill-rule",
                "evenodd"
            );

            defaultIconPathOne.setAttribute(
                "d",
                "M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1z"
            );

            const defaultIconPathTwo =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            defaultIconPathTwo.setAttribute(
                "fill-rule",
                "evenodd"
            );

            defaultIconPathTwo.setAttribute(
                "d",
                "M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z"
            );

            defaultIcon.append(
                defaultIconPathOne,
                defaultIconPathTwo
            );

            defaultAction.append(defaultIcon);

            const resetAction =
                document.createElement("button");

            const resetIcon =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );

            resetIcon.setAttribute(
                "xmlns",
                "http://www.w3.org/2000/svg"
            );
            resetIcon.setAttribute("width", "16");
            resetIcon.setAttribute("height", "16");
            resetIcon.setAttribute(
                "fill",
                "currentColor"
            );
            resetIcon.classList.add("app-icon");
            resetIcon.setAttribute(
                "viewBox",
                "0 0 16 16"
            );
            resetIcon.setAttribute(
                "aria-hidden",
                "true"
            );

            const resetIconPathOne =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            resetIconPathOne.setAttribute(
                "fill-rule",
                "evenodd"
            );

            resetIconPathOne.setAttribute(
                "d",
                "M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"
            );

            const resetIconPathTwo =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            resetIconPathTwo.setAttribute(
                "d",
                "M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"
            );

            resetIcon.append(
                resetIconPathOne,
                resetIconPathTwo
            );

            resetAction.append(resetIcon);

            group.classList.add("app-input-group");

            label.classList.add(
                "app-input-group-label"
            );

            input.classList.add("app-form-control");

            defaultAction.type = "button";
            defaultAction.classList.add(
                "app-input-group-action"
            );

            resetAction.type = "button";
            resetAction.classList.add(
                "app-input-group-action"
            );

            label.setAttribute(
                "data-input-region",
                "label"
            );

            input.setAttribute(
                "data-input-region",
                "control"
            );

            clearAction.setAttribute(
                "data-input-action",
                "clear"
            );

            defaultAction.setAttribute(
                "data-input-action",
                "default"
            );

            resetAction.setAttribute(
                "data-input-action",
                "reset"
            );

            group.append(
                label,
                input,
                clearAction,
                defaultAction,
                resetAction
            );

            this.update(group);

            return group;
        }

        inputElement() {
            const element = this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Input must be rendered before resolving its control."
                );
            }

            const input = element.querySelector(
                '[data-input-region="control"]'
            );

            if (!(input instanceof HTMLInputElement)) {
                throw new Error(
                    "Input control region is invalid."
                );
            }

            return input;
        }

        val(value) {
            const element = this.inputElement();

            if (arguments.length === 0) {
                return element.value;
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

            const normalizedValue =
                value === null ? "" : String(value);

            if (
                this.config("type") === "file"
                && normalizedValue !== ""
            ) {
                throw new TypeError(
                    "File input value may only be cleared."
                );
            }

            this.config(
                "value",
                normalizedValue
            );

            element.value = normalizedValue;

            this.input();

            this.#updateActionVisibility();

            return this;
        }

        value(value) {
            if (arguments.length === 0) {
                return this.val();
            }

            this.val(value);

            return this;
        }

        defaultValue(value) {
            if (arguments.length === 0) {
                return this.config(
                    "defaultValue"
                );
            }

            if (
                value !== null
                && typeof value !== "string"
                && typeof value !== "number"
            ) {
                throw new TypeError(
                    "Input defaultValue must be a string, number, or null."
                );
            }

            this.config(
                "defaultValue",
                value
            );

            this.#updateActionVisibility();

            return this;
        }

        previousValue(value) {
            if (arguments.length === 0) {
                return this.config(
                    "previousValue"
                );
            }

            if (
                value !== null
                && typeof value !== "string"
                && typeof value !== "number"
            ) {
                throw new TypeError(
                    "Input previousValue must be a string, number, or null."
                );
            }

            this.config(
                "previousValue",
                value
            );

            this.#updateActionVisibility();

            return this;
        }

        isDirty() {
            return this.value()
                !== String(
                    this.previousValue() ?? ""
                );
        }

        isDefault() {
            return this.value()
                === String(
                    this.defaultValue() ?? ""
                );
        }

        clear() {
            if (this.value() === "") {
                return this;
            }

            this.value("");
            this.change();

            return this;
        }

        restoreDefault() {
            if (this.isDefault()) {
                return this;
            }

            this.value(
                this.defaultValue()
            );

            this.change();

            return this;
        }

        reset() {
            if (!this.isDirty()) {
                return this;
            }

            this.value(
                this.previousValue()
            );

            this.change();

            return this;
        }

        commit() {
            this.previousValue(
                this.value()
            );

            return this;
        }

        commitValue() {
            return this.commit();
        }

        change() {
            this.inputElement().dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true,
                    }
                )
            );

            return this;
        }

        input() {
            this.inputElement().dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true,
                    }
                )
            );

            return this;
        }

        enable() {
            const element = this.inputElement();

            this.config(
                "disabled",
                false
            );

            element.disabled = false;

            return this;
        }

        disable() {
            const element = this.inputElement();

            this.config(
                "disabled",
                true
            );

            element.disabled = true;

            return this;
        }

        isDisabled() {
            const element = this.inputElement();

            return element.disabled;
        }

        update(element) {
            if (!(element instanceof HTMLDivElement)) {
                throw new TypeError(
                    "Input update() requires an HTMLDivElement."
                );
            }

            const input = element.querySelector(
                '[data-input-region="control"]'
            );

            const labelElement = element.querySelector(
                '[data-input-region="label"]'
            );

            const clearAction = element.querySelector(
                '[data-input-action="clear"]'
            );

            const defaultAction = element.querySelector(
                '[data-input-action="default"]'
            );

            const resetAction = element.querySelector(
                '[data-input-action="reset"]'
            );

            const defaultActionEnabled =
                this.config(
                    "defaultActionEnabled"
                );

            const resetActionEnabled =
                this.config(
                    "resetActionEnabled"
                );

            const defaultValue =
                this.config(
                    "defaultValue"
                );

            const previousValue =
                this.config(
                    "previousValue"
                );

            if (
                !(input instanceof HTMLInputElement)
                || !(labelElement instanceof HTMLSpanElement)
                || !(clearAction instanceof HTMLButtonElement)
                || !(defaultAction instanceof HTMLButtonElement)
                || !(resetAction instanceof HTMLButtonElement)
            ) {
                throw new Error(
                    "Input rendered regions are invalid."
                );
            }

            const type = this.config("type");
            const name = this.config("name");
            const value = this.config("value");
            const placeholder = this.config("placeholder");
            const autocomplete = this.config("autocomplete");
            const accept = this.config("accept");
            const describedBy = this.config("describedBy");
            const label = this.config("label");

            const clearActionEnabled =
                this.config("clearActionEnabled");

            if (
                typeof type !== "string"
                || !INPUT_TYPES.includes(type)
            ) {
                throw new TypeError(
                    "Input type must be date, datetime-local, email, file, number, password, search, tel, text, time, or url."
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

            if (typeof label !== "string") {
                throw new TypeError(
                    "Input label must be a string."
                );
            }

            if (typeof clearActionEnabled !== "boolean") {
                throw new TypeError(
                    "Input clearActionEnabled must be a boolean."
                );
            }

            if (typeof defaultActionEnabled !== "boolean") {
                throw new TypeError(
                    "Input defaultActionEnabled must be a boolean."
                );
            }

            if (typeof resetActionEnabled !== "boolean") {
                throw new TypeError(
                    "Input resetActionEnabled must be a boolean."
                );
            }

            if (
                defaultValue !== null
                && typeof defaultValue !== "string"
                && typeof defaultValue !== "number"
            ) {
                throw new TypeError(
                    "Input defaultValue must be a string, number, or null."
                );
            }

            if (
                previousValue !== null
                && typeof previousValue !== "string"
                && typeof previousValue !== "number"
            ) {
                throw new TypeError(
                    "Input previousValue must be a string, number, or null."
                );
            }

            global.Builder.text(
                labelElement,
                label
            );

            labelElement.hidden =
                label === "";

            clearAction.title = "Clear";

            clearAction.setAttribute(
                "aria-label",
                "Clear"
            );

            defaultAction.title = "Default";

            defaultAction.setAttribute(
                "aria-label",
                "Default"
            );

            resetAction.title = "Reset";

            resetAction.setAttribute(
                "aria-label",
                "Reset"
            );

            const clearClickListenerBound =
                clearAction.dataset.clearClickListenerBound === "true";

            const defaultClickListenerBound =
                defaultAction.dataset.defaultClickListenerBound === "true";

            const resetClickListenerBound =
                resetAction.dataset.resetClickListenerBound === "true";

            const clearInputListenerBound =
                input.dataset.clearInputListenerBound === "true";

            if (!clearInputListenerBound) {
                input.addEventListener(
                    "input",
                    () => {
                        this.config(
                            "value",
                            input.value
                        );
                        this.#updateActionVisibility(input);
                    }
                );
                input.dataset.clearInputListenerBound =
                    "true";
            }

            if (!clearClickListenerBound) {
                clearAction.addEventListener(
                    "click",
                    () => {
                        this.clear();
                    }
                );
                clearAction.dataset.clearClickListenerBound =
                    "true";
            }

            if (!defaultClickListenerBound) {
                defaultAction.addEventListener(
                    "click",
                    () => {
                        this.restoreDefault();
                    }
                );

                defaultAction.dataset.defaultClickListenerBound =
                    "true";
            }

            if (!resetClickListenerBound) {
                resetAction.addEventListener(
                    "click",
                    () => {
                        this.reset();
                    }
                );

                resetAction.dataset.resetClickListenerBound =
                    "true";
            }

            input.type = type;
            input.classList.toggle(
                "app-form-control-file",
                type === "file"
            );
            input.name = name;

            if (type === "file") {
                input.value = "";
            } else {
                input.value =
                    value === null ? "" : String(value);
            }

            this.#updateActionVisibility(input);

            input.placeholder = placeholder;
            input.multiple =
                this.config("multiple") === true;
            input.required =
                this.config("required") === true;
            input.disabled =
                this.config("disabled") === true;
            input.readOnly =
                this.config("readonly") === true;

            if (autocomplete === "") {
                input.removeAttribute("autocomplete");
            } else {
                input.setAttribute(
                    "autocomplete",
                    autocomplete
                );
            }

            if (accept === "") {
                input.removeAttribute("accept");
            } else {
                input.setAttribute(
                    "accept",
                    accept
                );
            }

            if (describedBy === "") {
                input.removeAttribute("aria-describedby");
            } else {
                input.setAttribute(
                    "aria-describedby",
                    describedBy
                );
            }

            const invalid =
                this.config("invalid") === true;

            input.classList.toggle(
                "is-invalid",
                invalid
            );

            if (invalid) {
                input.setAttribute(
                    "aria-invalid",
                    "true"
                );
            } else {
                input.removeAttribute("aria-invalid");
            }

            return this;
        }

        #updateActionVisibility(input = null) {
            if (input === null) {
                input = this.inputElement();
            }

            if (!(input instanceof HTMLInputElement)) {
                throw new Error(
                    "Input control region is invalid."
                );
            }

            const group = input.closest(".app-input-group");

            if (!(group instanceof Element)) {
                throw new Error(
                    "Input rendered regions are invalid."
                );
            }

            const clearAction = group.querySelector(
                '[data-input-action="clear"]'
            );

            const defaultAction = group.querySelector(
                '[data-input-action="default"]'
            );

            const resetAction = group.querySelector(
                '[data-input-action="reset"]'
            );

            if (
                !(clearAction instanceof HTMLButtonElement)
                || !(defaultAction instanceof HTMLButtonElement)
                || !(resetAction instanceof HTMLButtonElement)
            ) {
                throw new Error(
                    "Input rendered regions are invalid."
                );
            }

            clearAction.classList.remove(
                "app-input-group-action-last"
            );

            defaultAction.classList.remove(
                "app-input-group-action-last"
            );

            resetAction.classList.remove(
                "app-input-group-action-last"
            );

            const clearActionEnabled =
                this.config("clearActionEnabled");
            const defaultActionEnabled =
                this.config("defaultActionEnabled");
            const resetActionEnabled =
                this.config("resetActionEnabled");
            const defaultValue =
                this.config("defaultValue");
            const previousValue =
                this.config("previousValue");

            const normalizedDefaultValue =
                String(defaultValue ?? "");
            const normalizedPreviousValue =
                String(previousValue ?? "");

            clearAction.hidden =
                !clearActionEnabled
                || input.value === "";

            defaultAction.hidden =
                !defaultActionEnabled
                || input.value === normalizedDefaultValue;

            resetAction.hidden =
                !resetActionEnabled
                || input.value === normalizedPreviousValue;


            const visibleActions = [
                clearAction,
                defaultAction,
                resetAction,
            ].filter(function (action) {
                return action.hidden === false;
            });

            input.classList.toggle(
                "app-form-control-actionless",
                visibleActions.length === 0
            );

            const lastVisibleAction =
                visibleActions.at(-1);

            if (
                lastVisibleAction
                instanceof HTMLButtonElement
            ) {
                lastVisibleAction.classList.add(
                    "app-input-group-action-last"
                );
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

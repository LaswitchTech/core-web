(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Select."
        );
    }

    function normalizeOptions(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Select options must be an array."
            );
        }

        return value.map(function (option) {
            if (
                option === null
                || typeof option !== "object"
                || Array.isArray(option)
                || (
                    typeof option.value !== "string"
                    && typeof option.value !== "number"
                )
                || typeof option.label !== "string"
            ) {
                throw new TypeError(
                    "Select option configuration is invalid."
                );
            }

            return {
                value: String(
                    option.value
                ),
                label: option.label,
                disabled:
                    option.disabled === true,
            };
        });
    }

    function normalizeSelect2Options(value) {
        if (
            value === null
            || typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Select select2Options must be an object."
            );
        }

        return {
            ...value,
        };
    }

    class Select extends global.Component {
        static defaults() {
            return {
                name: "",
                label: "",
                options: [],
                value: "",
                values: [],
                placeholder: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                invalid: false,
                select2Enabled: true,
                select2Options: {},
            };
        }

        /* ── Select2 ↔ native change bridge ─────────────────────── */



        /* ── internal bridge tracking ───────────────────────────── */
        _select2BridgeBound = false;

        _bindSelect2Bridge($select) {
            var self = this;

            if (this._select2BridgeBound) {
                return;
            }

            function applyState() {
                if (self.config("multiple") === true) {
                    var options = $select[0].selectedOptions;

                    self.config(
                        "values",
                        Array.from(options).map(function (option) {
                            return option.value;
                        })
                    );
                } else {
                    self.config(
                        "value",
                        $select[0].value
                    );
                }

                $select[0].dispatchEvent(
                    new Event(
                        "change",
                        { bubbles: true }
                    )
                );
            }

            $select.on(
                "select2:select.appBuilderSelect",
                function () { applyState(); }
            );

            $select.on(
                "select2:unselect.appBuilderSelect",
                function () { applyState(); }
            );

            $select.on(
                "select2:clear.appBuilderSelect",
                function () { applyState(); }
            );

            this._select2BridgeBound = true;
        }

        _unbindSelect2Bridge($select) {
            $select.off(
                ".appBuilderSelect"
            );

            this._select2BridgeBound = false;
        }

        render() {
            const group =
                document.createElement("div");

            const label =
                document.createElement("span");

            const select =
                document.createElement("select");

            group.classList.add(
                "app-input-group",
                "app-select-group"
            );

            label.classList.add(
                "app-input-group-label"
            );

            label.setAttribute(
                "data-select-region",
                "label"
            );

            select.classList.add(
                "app-form-control",
                "app-select-control"
            );

            select.setAttribute(
                "data-select-region",
                "control"
            );

            group.append(
                label,
                select
            );

            this.update(group);

            return group;
        }

        isSelect2Available() {
            return typeof global.jQuery === "function"
                && global.jQuery.fn !== undefined
                && typeof global.jQuery.fn.select2 === "function";
        }

        isSelect2Initialized(element = null) {
            const select =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-select-region="control"]'
                    )
                    : this.selectElement();

            if (!(select instanceof HTMLSelectElement)) {
                return false;
            }

            return select.classList.contains(
                "select2-hidden-accessible"
            );
        }

        buildSelect2Options() {
            const configuredOptions =
                normalizeSelect2Options(
                    this.config(
                        "select2Options"
                    )
                );

            const placeholder =
                this.config(
                    "placeholder"
                );

            const options = {
                width: "100%",
                ...(
                    placeholder !== ""
                        ? {
                            placeholder: placeholder,
                        }
                        : {}
                ),
                ...configuredOptions,
            };

            // always append app-select2-dropdown
            let existingClasses =
                (options.dropdownCssClass || "")
                    .toString()
                    .split(" ")
                    .filter((c) => c.length > 0);

            if (
                !existingClasses.includes(
                    "app-select2-dropdown"
                )
            ) {
                existingClasses.push(
                    "app-select2-dropdown"
                );
            }

            options.dropdownCssClass =
                existingClasses.join(" ");

            return options;
        }

        destroySelect2(element = null) {
            const select =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-select-region="control"]'
                    )
                    : this.selectElement();

            if (
                !(select instanceof HTMLSelectElement)
                || !this.isSelect2Available()
                || !this.isSelect2Initialized(
                    element
                )
            ) {
                return this;
            }

            const $select = global.jQuery(select);

            this._unbindSelect2Bridge($select);

            $select.select2(
                "destroy"
            );

            return this;
        }

        initializeSelect2() {
            if (
                this.config(
                    "select2Enabled"
                ) !== true
                || !this.isSelect2Available()
                || this.isSelect2Initialized()
            ) {
                return this;
            }

            const select =
                this.selectElement();

            try {
                const $select =
                    global.jQuery(
                        select
                    );

                $select.select2(
                    this.buildSelect2Options()
                );

                this._bindSelect2Bridge(
                    $select
                );
            } catch (_error) {
                return this;
            }

            const $select = global.jQuery(select);

            this._bindSelect2Bridge($select);

            return this;
        }

        value(value) {
            if (arguments.length === 0) {
                return this.selectElement().value;
            }

            if (
                typeof value !== "string"
                && typeof value !== "number"
            ) {
                throw new TypeError(
                    "Select value must be a string or number."
                );
            }

            if (this.config("multiple") === true) {
                throw new Error(
                    "Select value() cannot set a multiple select."
                );
            }

            const normalizedValue =
                String(value);

            this.config(
                "value",
                normalizedValue
            );

            const select =
                this.selectElement();

            select.value =
                normalizedValue;

            if (
                this.isSelect2Available()
                && this.isSelect2Initialized()
            ) {
                global.jQuery(
                    select
                ).trigger(
                    "change.select2"
                );
            }

            return this;
        }

        values(values) {
            if (arguments.length === 0) {
                return Array.from(
                    this.selectElement().selectedOptions
                ).map(function (option) {
                    return option.value;
                });
            }

            if (!Array.isArray(values)) {
                throw new TypeError(
                    "Select values must be an array."
                );
            }

            if (this.config("multiple") !== true) {
                throw new Error(
                    "Select values() requires a multiple select."
                );
            }

            const normalizedValues =
                values.map(function (value) {
                    if (
                        typeof value !== "string"
                        && typeof value !== "number"
                    ) {
                        throw new TypeError(
                            "Select values must contain only strings or numbers."
                        );
                    }

                    return String(value);
                });

            this.config(
                "values",
                normalizedValues
            );

            const select =
                this.selectElement();

            select.querySelectorAll("option")
                .forEach(function (option) {
                    option.selected =
                        normalizedValues.includes(
                            option.value
                        );
                });

            if (
                this.isSelect2Available()
                && this.isSelect2Initialized()
            ) {
                global.jQuery(
                    select
                ).trigger(
                    "change.select2"
                );
            }

            return this;
        }

        change() {
            this.selectElement().dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true,
                    }
                )
            );

            return this;
        }

        enable() {
            this.config(
                "disabled",
                false
            );

            const select =
                this.selectElement();

            select.disabled =
                false;

            if (
                this.isSelect2Available()
                && this.isSelect2Initialized()
            ) {
                global.jQuery(
                    select
                ).trigger(
                    "change.select2"
                );
            }

            return this;
        }

        disable() {
            this.config(
                "disabled",
                true
            );

            const select =
                this.selectElement();

            select.disabled =
                true;

            if (
                this.isSelect2Available()
                && this.isSelect2Initialized()
            ) {
                global.jQuery(
                    select
                ).trigger(
                    "change.select2"
                );
            }

            return this;
        }

        isDisabled() {
            return this.selectElement().disabled;
        }

        setOptions(options) {
            this.destroySelect2();

            this.config(
                "options",
                normalizeOptions(options)
            );

            this.renderOptions();
            this.initializeSelect2();

            return this;
        }

        selectElement() {
            const element =
                this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Select must be rendered before resolving its control."
                );
            }

            const select =
                element.querySelector(
                    '[data-select-region="control"]'
                );

            if (!(select instanceof HTMLSelectElement)) {
                throw new Error(
                    "Select control region is invalid."
                );
            }

            return select;
        }

        renderOptions(element = null) {
            const select =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-select-region="control"]'
                    )
                    : this.selectElement();

            if (!(select instanceof HTMLSelectElement)) {
                throw new Error(
                    "Select control region is invalid."
                );
            }

            const options =
                this.config("options");

            const optionElements = [];

            const placeholder =
                this.config("placeholder");

            if (
                this.config("multiple") !== true
                && placeholder !== ""
            ) {
                const placeholderOption =
                    document.createElement("option");

                placeholderOption.value = "";
                placeholderOption.textContent =
                    placeholder;

                optionElements.push(
                    placeholderOption
                );
            }

            options.forEach(function (option) {
                const optionElement =
                    document.createElement("option");

                optionElement.value =
                    option.value;

                optionElement.textContent =
                    option.label;

                optionElement.disabled =
                    option.disabled;

                optionElements.push(
                    optionElement
                );
            });

            select.replaceChildren(
                ...optionElements
            );

            if (this.config("multiple") === true) {
                const selectedValues =
                    this.config("values");

                select.querySelectorAll("option")
                    .forEach(function (option) {
                        option.selected =
                            selectedValues.includes(
                                option.value
                            );
                    });
            } else {
                select.value =
                    this.config("value");
            }

            return this;
        }

        beforeDestroy() {
            const element =
                this.element();

            if (element instanceof HTMLDivElement) {
                this.destroySelect2(
                    element
                );
            }
        }

        update(element = null) {
            if (element === null || element === undefined) {
                return this;
            }

            if (!(element instanceof HTMLDivElement)) {
                throw new TypeError(
                    "Select update() requires an HTMLDivElement."
                );
            }

            this.destroySelect2(element);

            const name =
                this.config("name");

            const label =
                this.config("label");

            const options =
                normalizeOptions(
                    this.config("options")
                );

            const value =
                this.config("value");

            const values =
                this.config("values");

            const placeholder =
                this.config("placeholder");

            const describedBy =
                this.config("describedBy");

            const multiple =
                this.config("multiple");

            const required =
                this.config("required");

            const disabled =
                this.config("disabled");

            const invalid =
                this.config("invalid");

            const select2Enabled =
                this.config(
                    "select2Enabled"
                );

            const select2Options =
                normalizeSelect2Options(
                    this.config(
                        "select2Options"
                    )
                );

            if (typeof name !== "string") {
                throw new TypeError(
                    "Select name must be a string."
                );
            }

            if (typeof label !== "string") {
                throw new TypeError(
                    "Select label must be a string."
                );
            }

            if (
                typeof value !== "string"
                && typeof value !== "number"
            ) {
                throw new TypeError(
                    "Select value must be a string or number."
                );
            }

            if (!Array.isArray(values)) {
                throw new TypeError(
                    "Select values must be an array."
                );
            }

            const normalizedValues =
                values.map(function (selectedValue) {
                    if (
                        typeof selectedValue !== "string"
                        && typeof selectedValue !== "number"
                    ) {
                        throw new TypeError(
                            "Select values must contain only strings or numbers."
                        );
                    }

                    return String(
                        selectedValue
                    );
                });

            if (typeof placeholder !== "string") {
                throw new TypeError(
                    "Select placeholder must be a string."
                );
            }

            if (typeof describedBy !== "string") {
                throw new TypeError(
                    "Select describedBy must be a string."
                );
            }

            if (typeof multiple !== "boolean") {
                throw new TypeError(
                    "Select multiple must be a boolean."
                );
            }

            if (typeof required !== "boolean") {
                throw new TypeError(
                    "Select required must be a boolean."
                );
            }

            if (typeof disabled !== "boolean") {
                throw new TypeError(
                    "Select disabled must be a boolean."
                );
            }

            if (typeof invalid !== "boolean") {
                throw new TypeError(
                    "Select invalid must be a boolean."
                );
            }

            if (typeof select2Enabled !== "boolean") {
                throw new TypeError(
                    "Select select2Enabled must be a boolean."
                );
            }

            this.config(
                "options",
                options
            );

            this.config(
                "value",
                String(value)
            );

            this.config(
                "values",
                normalizedValues
            );

            this.config(
                "select2Options",
                select2Options
            );

            const labelElement =
                element.querySelector(
                    '[data-select-region="label"]'
                );

            const selectElement =
                element.querySelector(
                    '[data-select-region="control"]'
                );

            if (
                !(labelElement instanceof HTMLSpanElement)
                || !(selectElement instanceof HTMLSelectElement)
            ) {
                throw new Error(
                    "Select rendered regions are invalid."
                );
            }

            global.Builder.text(
                labelElement,
                label
            );

            labelElement.hidden =
                label === "";

            selectElement.name =
                name;

            selectElement.multiple =
                multiple;

            selectElement.required =
                required;

            selectElement.disabled =
                disabled;

            if (describedBy === "") {
                selectElement.removeAttribute(
                    "aria-describedby"
                );
            } else {
                selectElement.setAttribute(
                    "aria-describedby",
                    describedBy
                );
            }

            selectElement.classList.toggle(
                "is-invalid",
                invalid
            );

            if (invalid) {
                selectElement.setAttribute(
                    "aria-invalid",
                    "true"
                );
            } else {
                selectElement.removeAttribute(
                    "aria-invalid"
                );
            }

            this.renderOptions(
                element
            );

            const changeListenerBound =
                selectElement.dataset
                    .selectChangeListenerBound
                    === "true";

            if (!changeListenerBound) {
                selectElement.addEventListener(
                    "change",
                    () => {
                        if (
                            this.config(
                                "multiple"
                            ) === true
                        ) {
                            this.config(
                                "values",
                                Array.from(
                                    selectElement
                                        .selectedOptions
                                ).map(function (option) {
                                    return option.value;
                                })
                            );
                        } else {
                            this.config(
                                "value",
                                selectElement.value
                            );
                        }
                    }
                );

                selectElement.dataset
                    .selectChangeListenerBound =
                    "true";
            }

            queueMicrotask(() => {
                const renderedElement =
                    this.element();

                if (!(renderedElement instanceof HTMLDivElement)) {
                    return;
                }

                this.initializeSelect2();
            });

            return this;
        }
    }

    global.Builder.register(
        "select",
        Select,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

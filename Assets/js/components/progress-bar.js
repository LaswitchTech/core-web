(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Progress Bar."
        );
    }

    const COLORS = Object.freeze([
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark",
    ]);

    function clamp(value, min, max) {
        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );
    }

    function calculatePercentage(
        value,
        min,
        max
    ) {
        if (max === min) {
            return 100;
        }

        return (
            (
                value - min
            )
            / (
                max - min
            )
        ) * 100;
    }

    class ProgressBar extends global.Component {
        setValue(value) {
            if (
                typeof value !== "number"
                || !Number.isFinite(value)
            ) {
                throw new TypeError(
                    "Progress Bar value must be a finite number."
                );
            }

            this.config(
                "value",
                value
            );

            this.refresh();

            return this;
        }

        increment(amount = 1) {
            if (
                typeof amount !== "number"
                || !Number.isFinite(amount)
            ) {
                throw new TypeError(
                    "Progress Bar increment amount must be a finite number."
                );
            }

            return this.setValue(
                this.config("value")
                + amount
            );
        }

        setIndeterminate(indeterminate) {
            if (typeof indeterminate !== "boolean") {
                throw new TypeError(
                    "Progress Bar indeterminate must be a boolean."
                );
            }

            this.config(
                "indeterminate",
                indeterminate
            );

            this.refresh();

            return this;
        }

        showIndeterminate() {
            return this.setIndeterminate(
                true
            );
        }

        hideIndeterminate() {
            return this.setIndeterminate(
                false
            );
        }

        toggleIndeterminate() {
            return this.setIndeterminate(
                this.config("indeterminate")
                !== true
            );
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const heading =
                document.createElement(
                    "div"
                );

            const label =
                document.createElement(
                    "span"
                );

            const percentage =
                document.createElement(
                    "span"
                );

            const track =
                document.createElement(
                    "div"
                );

            const bar =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-progress-bar"
            );

            heading.classList.add(
                "app-progress-bar-heading"
            );

            label.classList.add(
                "app-progress-bar-label"
            );

            percentage.classList.add(
                "app-progress-bar-percentage"
            );

            track.classList.add(
                "app-progress-bar-track"
            );

            bar.classList.add(
                "app-progress-bar-value"
            );

            label.setAttribute(
                "data-progress-bar-region",
                "label"
            );

            percentage.setAttribute(
                "data-progress-bar-region",
                "percentage"
            );

            track.setAttribute(
                "data-progress-bar-region",
                "track"
            );

            bar.setAttribute(
                "data-progress-bar-region",
                "value"
            );

            heading.append(
                label,
                percentage
            );

            track.append(
                bar
            );

            root.append(
                heading,
                track
            );

            this.update(
                root
            );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Progress Bar update requires an HTMLElement."
                );
            }

            const min =
                this.config("min");

            const max =
                this.config("max");

            const value =
                this.config("value");

            const label =
                this.config("label");

            const percentageVisible =
                this.config(
                    "percentageVisible"
                );

            const color =
                this.config("color");

            const indeterminate =
                this.config(
                    "indeterminate"
                );

            if (
                typeof min !== "number"
                || !Number.isFinite(min)
            ) {
                throw new TypeError(
                    "Progress Bar min must be a finite number."
                );
            }

            if (
                typeof max !== "number"
                || !Number.isFinite(max)
                || max <= min
            ) {
                throw new TypeError(
                    "Progress Bar max must be a finite number greater than min."
                );
            }

            if (
                typeof value !== "number"
                || !Number.isFinite(value)
            ) {
                throw new TypeError(
                    "Progress Bar value must be a finite number."
                );
            }

            if (typeof label !== "string") {
                throw new TypeError(
                    "Progress Bar label must be a string."
                );
            }

            if (typeof percentageVisible !== "boolean") {
                throw new TypeError(
                    "Progress Bar percentageVisible must be a boolean."
                );
            }

            if (
                typeof color !== "string"
                || !COLORS.includes(color)
            ) {
                throw new TypeError(
                    "Progress Bar color is invalid."
                );
            }

            if (typeof indeterminate !== "boolean") {
                throw new TypeError(
                    "Progress Bar indeterminate must be a boolean."
                );
            }

            const resolvedValue =
                clamp(
                    value,
                    min,
                    max
                );

            this.config(
                "value",
                resolvedValue
            );

            const labelRegion =
                element.querySelector(
                    '[data-progress-bar-region="label"]'
                );

            const percentageRegion =
                element.querySelector(
                    '[data-progress-bar-region="percentage"]'
                );

            const trackRegion =
                element.querySelector(
                    '[data-progress-bar-region="track"]'
                );

            const valueRegion =
                element.querySelector(
                    '[data-progress-bar-region="value"]'
                );

            if (
                !(labelRegion instanceof HTMLElement)
                || !(percentageRegion instanceof HTMLElement)
                || !(trackRegion instanceof HTMLElement)
                || !(valueRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Progress Bar rendered regions are missing."
                );
            }

            const percentage =
                calculatePercentage(
                    resolvedValue,
                    min,
                    max
                );

            global.Builder.text(
                labelRegion,
                label
            );

            global.Builder.text(
                percentageRegion,
                Math.round(
                    percentage
                ) + "%"
            );

            labelRegion.hidden =
                label === "";

            percentageRegion.hidden =
                percentageVisible !== true
                || indeterminate;

            element.setAttribute(
                "data-progress-bar-color",
                color
            );

            element.classList.toggle(
                "is-indeterminate",
                indeterminate
            );

            valueRegion.style.width =
                indeterminate
                    ? ""
                    : percentage + "%";

            trackRegion.setAttribute(
                "role",
                "progressbar"
            );

            trackRegion.setAttribute(
                "aria-valuemin",
                String(min)
            );

            trackRegion.setAttribute(
                "aria-valuemax",
                String(max)
            );

            if (indeterminate) {
                trackRegion.removeAttribute(
                    "aria-valuenow"
                );

                trackRegion.removeAttribute(
                    "aria-valuetext"
                );
            } else {
                trackRegion.setAttribute(
                    "aria-valuenow",
                    String(resolvedValue)
                );

                trackRegion.setAttribute(
                    "aria-valuetext",
                    Math.round(
                        percentage
                    ) + "%"
                );
            }

            if (label === "") {
                trackRegion.setAttribute(
                    "aria-label",
                    "Progress"
                );
            } else {
                trackRegion.setAttribute(
                    "aria-label",
                    label
                );
            }

            return this;
        }

        static defaults() {
            return {
                min: 0,
                max: 100,
                value: 0,
                label: "",
                percentageVisible: true,
                color: "primary",
                indeterminate: false,
            };
        }
    }

    global.Builder.register(
        "progress-bar",
        ProgressBar,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

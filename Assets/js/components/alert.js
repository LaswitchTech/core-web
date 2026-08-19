(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Alert."
        );
    }

    const ALERT_COLORS = Object.freeze([
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark",
    ]);

    const ALERT_ICONS = Object.freeze({
        close: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>',
            "</svg>",
        ].join(""),
    });

    function normalizeColor(value) {
        return ALERT_COLORS.includes(value)
            ? value
            : "primary";
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
                sourcePath.getAttribute(
                    "d"
                );

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

    class Alert extends global.Component {
        constructor(config) {
            super(config);

            this.handleDismiss =
                this.handleDismiss.bind(this);
        }

        beforeDestroy() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            const dismiss =
                element.querySelector(
                    '[data-alert-action="dismiss"]'
                );

            if (
                dismiss
                instanceof HTMLButtonElement
            ) {
                dismiss.removeEventListener(
                    "click",
                    this.handleDismiss
                );
            }
        }

        handleDismiss() {
            this.dismiss();
        }

        show() {
            this.config(
                "visible",
                true
            );

            this.refresh();

            return this;
        }

        hide() {
            this.config(
                "visible",
                false
            );

            this.refresh();

            return this;
        }

        toggle() {
            return this.config(
                "visible"
            ) === true
                ? this.hide()
                : this.show();
        }

        dismiss() {
            if (this.config("visible") !== true) {
                return this;
            }

            this.config(
                "visible",
                false
            );

            this.refresh();

            const callback =
                this.config(
                    "onDismiss"
                );

            if (typeof callback === "function") {
                callback(
                    this
                );
            }

            return this;
        }

        setColor(color) {
            this.config(
                "color",
                normalizeColor(
                    color
                )
            );

            this.refresh();

            return this;
        }

        render() {
            const alert =
                document.createElement(
                    "div"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const content =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            const body =
                document.createElement(
                    "div"
                );

            const dismiss =
                document.createElement(
                    "button"
                );

            alert.classList.add(
                "app-alert"
            );

            icon.classList.add(
                "app-alert-icon"
            );

            content.classList.add(
                "app-alert-content"
            );

            title.classList.add(
                "app-alert-title"
            );

            body.classList.add(
                "app-alert-body"
            );

            dismiss.type =
                "button";

            dismiss.classList.add(
                "app-alert-dismiss"
            );

            icon.setAttribute(
                "data-alert-region",
                "icon"
            );

            title.setAttribute(
                "data-alert-region",
                "title"
            );

            body.setAttribute(
                "data-alert-region",
                "body"
            );

            dismiss.setAttribute(
                "data-alert-action",
                "dismiss"
            );

            dismiss.setAttribute(
                "aria-label",
                "Dismiss alert"
            );

            dismiss.setAttribute(
                "title",
                "Dismiss alert"
            );

            renderIcon(
                dismiss,
                ALERT_ICONS.close
            );

            dismiss.addEventListener(
                "click",
                this.handleDismiss
            );

            content.append(
                title,
                body
            );

            alert.append(
                icon,
                content,
                dismiss
            );

            this.update(
                alert
            );

            return alert;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Alert update requires an HTMLElement."
                );
            }

            const title =
                this.config(
                    "title"
                );

            const content =
                this.config(
                    "content"
                );

            const icon =
                this.config(
                    "icon"
                );

            const color =
                normalizeColor(
                    this.config(
                        "color"
                    )
                );

            const dismissible =
                this.config(
                    "dismissible"
                );

            const visible =
                this.config(
                    "visible"
                );

            const onDismiss =
                this.config(
                    "onDismiss"
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Alert title must be a string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Alert content must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Alert icon must be a string."
                );
            }

            if (typeof dismissible !== "boolean") {
                throw new TypeError(
                    "Alert dismissible must be a boolean."
                );
            }

            if (typeof visible !== "boolean") {
                throw new TypeError(
                    "Alert visible must be a boolean."
                );
            }

            if (
                onDismiss !== null
                && typeof onDismiss !== "function"
            ) {
                throw new TypeError(
                    "Alert onDismiss must be a function or null."
                );
            }

            const iconRegion =
                element.querySelector(
                    '[data-alert-region="icon"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-alert-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-alert-region="body"]'
                );

            const dismissControl =
                element.querySelector(
                    '[data-alert-action="dismiss"]'
                );

            if (
                !(iconRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(dismissControl instanceof HTMLButtonElement)
            ) {
                throw new Error(
                    "Alert rendered regions are missing."
                );
            }

            this.config(
                "color",
                color
            );

            element.setAttribute(
                "data-alert-color",
                color
            );

            element.setAttribute(
                "role",
                "alert"
            );

            element.setAttribute(
                "aria-hidden",
                visible
                    ? "false"
                    : "true"
            );

            element.hidden =
                !visible;

            renderIcon(
                iconRegion,
                icon
            );

            iconRegion.hidden =
                icon === "";

            global.Builder.text(
                titleRegion,
                title
            );

            titleRegion.hidden =
                title === "";

            global.Builder.html(
                bodyRegion,
                content
            );

            bodyRegion.hidden =
                content === "";

            dismissControl.hidden =
                !dismissible;

            return this;
        }

        static defaults() {
            return {
                title: "",
                content: "",
                icon: "",
                color: "primary",
                dismissible: false,
                visible: true,
                onDismiss: null,
            };
        }
    }

    global.Builder.register(
        "alert",
        Alert,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

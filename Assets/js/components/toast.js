(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Toast."
        );
    }

    const TOAST_COLORS = Object.freeze([
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark",
    ]);

    const TOAST_ICONS = Object.freeze({
        close: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>',
            "</svg>",
        ].join(""),
    });

    function normalizeColor(value) {
        return TOAST_COLORS.includes(value)
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

    class Toast extends global.Component {
        constructor(config) {
            super(config);

            this.handleDismiss =
                this.handleDismiss.bind(this);

            this.handleInteractionStart =
                this.handleInteractionStart.bind(this);

            this.handleInteractionEnd =
                this.handleInteractionEnd.bind(this);

            this.dismissTimer =
                null;

            this.remainingDelay =
                null;

            this.timerStartedAt =
                null;
        }

        clearDismissTimer() {
            if (this.dismissTimer !== null) {
                global.clearTimeout(
                    this.dismissTimer
                );
            }

            this.dismissTimer =
                null;

            this.timerStartedAt =
                null;

            return this;
        }

        updateProgress(
            remaining,
            animate
        ) {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            const progressBar =
                element.querySelector(
                    '[data-toast-region="progress-bar"]'
                );

            if (!(progressBar instanceof HTMLElement)) {
                return this;
            }

            const delay =
                this.config("delay");

            const ratio =
                delay === 0
                    ? 0
                    : Math.max(
                        0,
                        Math.min(
                            1,
                            remaining / delay
                        )
                    );

            progressBar.style.transition =
                animate
                    ? (
                        "transform "
                        + remaining
                        + "ms linear"
                    )
                    : "none";

            progressBar.style.transform =
                "scaleX("
                + (
                    animate
                        ? 0
                        : ratio
                )
                + ")";

            return this;
        }

        startDismissTimer() {
            this.clearDismissTimer();

            if (
                this.config("persistent") === true
                || this.config("visible") !== true
            ) {
                return this;
            }

            const delay =
                this.remainingDelay === null
                    ? this.config("delay")
                    : this.remainingDelay;

            this.remainingDelay =
                delay;

            this.timerStartedAt =
                Date.now();

            this.updateProgress(
                delay,
                false
            );

            requestAnimationFrame(
                () => {
                    this.updateProgress(
                        delay,
                        true
                    );
                }
            );

            this.dismissTimer =
                global.setTimeout(
                    () => {
                        this.dismissTimer =
                            null;

                        this.remainingDelay =
                            null;

                        this.timerStartedAt =
                            null;

                        this.dismiss();
                    },
                    delay
                );

            return this;
        }

        pauseDismissTimer() {
            if (
                this.dismissTimer === null
                || this.timerStartedAt === null
            ) {
                return this;
            }

            const elapsed =
                Date.now()
                - this.timerStartedAt;

            this.remainingDelay =
                Math.max(
                    0,
                    this.remainingDelay
                    - elapsed
                );

            this.updateProgress(
                this.remainingDelay,
                false
            );

            this.clearDismissTimer();

            return this;
        }

        resumeDismissTimer() {
            if (
                this.config("persistent") === true
                || this.config("visible") !== true
                || this.remainingDelay === null
            ) {
                return this;
            }

            return this.startDismissTimer();
        }

        endDismissTimer() {
            if (
                this.timerStartedAt === null
                || this.dismissTimer === null
            ) {
                return this;
            }

            const remaining =
                Date.now()
                    - this.timerStartedAt;

            const delay =
                this.remainingDelay === null
                    ? this.config("delay")
                    : this.remainingDelay;

            if (delay < 5000) {
                return this;
            }

            this.clearDismissTimer();

            this.dismissTimer =
                global.setTimeout(
                    () => {
                        this.dismissTimer =
                            null;

                        this.dismiss();
                    },
                    Math.max(
                        remaining - 100,
                        0
                    )
                );

            return this;
        }

        beforeDestroy() {
            this.clearDismissTimer();

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            const dismiss =
                element.querySelector(
                    '[data-toast-action="dismiss"]'
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

            element.removeEventListener(
                "mouseenter",
                this.handleInteractionStart
            );

            element.removeEventListener(
                "mouseleave",
                this.handleInteractionEnd
            );

            element.removeEventListener(
                "focusin",
                this.handleInteractionStart
            );

            element.removeEventListener(
                "focusout",
                this.handleInteractionEnd
            );
        }

        handleDismiss() {
            this.dismiss();
        }

        handleInteractionStart() {
            this.pauseDismissTimer();
        }

        handleInteractionEnd() {
            this.resumeDismissTimer();
        }

        show() {
            this.config(
                "visible",
                true
            );

            this.refresh();

            this.remainingDelay =
                this.config("delay");

            this.startDismissTimer();

            const callback =
                this.config(
                    "onShow"
                );

            if (typeof callback === "function") {
                callback(
                    this
                );
            }

            return this;
        }

        hide() {
            this.clearDismissTimer();

            this.remainingDelay =
                null;

            this.config(
                "visible",
                false
            );

            this.refresh();

            const callback =
                this.config(
                    "onHide"
                );

            if (typeof callback === "function") {
                callback(
                    this
                );
            }

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

            this.clearDismissTimer();

            this.remainingDelay =
                null;

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

        render() {
            const toast =
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

            const progress =
                document.createElement(
                    "div"
                );

            const progressBar =
                document.createElement(
                    "div"
                );

            toast.classList.add(
                "app-toast"
            );

            icon.classList.add(
                "app-toast-icon"
            );

            content.classList.add(
                "app-toast-content"
            );

            title.classList.add(
                "app-toast-title"
            );

            body.classList.add(
                "app-toast-body"
            );

            dismiss.type =
                "button";

            dismiss.classList.add(
                "app-toast-dismiss"
            );

            progress.classList.add(
                "app-toast-progress"
            );

            progressBar.classList.add(
                "app-toast-progress-bar"
            );

            icon.setAttribute(
                "data-toast-region",
                "icon"
            );

            title.setAttribute(
                "data-toast-region",
                "title"
            );

            body.setAttribute(
                "data-toast-region",
                "body"
            );

            progress.setAttribute(
                "data-toast-region",
                "progress"
            );

            progressBar.setAttribute(
                "data-toast-region",
                "progress-bar"
            );

            dismiss.setAttribute(
                "data-toast-action",
                "dismiss"
            );

            dismiss.setAttribute(
                "aria-label",
                "Dismiss notification"
            );

            dismiss.setAttribute(
                "title",
                "Dismiss notification"
            );

            renderIcon(
                dismiss,
                TOAST_ICONS.close
            );

            dismiss.addEventListener(
                "click",
                this.handleDismiss
            );

            toast.addEventListener(
                "mouseenter",
                this.handleInteractionStart
            );

            toast.addEventListener(
                "mouseleave",
                this.handleInteractionEnd
            );

            toast.addEventListener(
                "focusin",
                this.handleInteractionStart
            );

            toast.addEventListener(
                "focusout",
                this.handleInteractionEnd
            );

            content.append(
                title,
                body
            );

            progress.append(
                progressBar
            );

            toast.append(
                icon,
                content,
                dismiss,
                progress
            );

            this.update(
                toast
            );

            queueMicrotask(
                () => {
                    if (
                        toast.isConnected
                        && this.config("visible") === true
                    ) {
                        this.remainingDelay =
                            this.config("delay");

                        this.startDismissTimer();
                    }
                }
            );

            return toast;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Toast update requires an HTMLElement."
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

            const delay =
                this.config(
                    "delay"
                );

            const persistent =
                this.config(
                    "persistent"
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Toast title must be a string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Toast content must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Toast icon must be a string."
                );
            }

            if (typeof dismissible !== "boolean") {
                throw new TypeError(
                    "Toast dismissible must be a boolean."
                );
            }

            if (typeof visible !== "boolean") {
                throw new TypeError(
                    "Toast visible must be a boolean."
                );
            }

            if (
                !Number.isInteger(delay)
                || delay < 0
            ) {
                throw new TypeError(
                    "Toast delay must be a non-negative integer."
                );
            }

            if (typeof persistent !== "boolean") {
                throw new TypeError(
                    "Toast persistent must be a boolean."
                );
            }

            [
                [
                    "onShow",
                    this.config("onShow"),
                ],
                [
                    "onHide",
                    this.config("onHide"),
                ],
                [
                    "onDismiss",
                    this.config("onDismiss"),
                ],
            ].forEach(function (entry) {
                if (
                    entry[1] !== null
                    && typeof entry[1] !== "function"
                ) {
                    throw new TypeError(
                        "Toast "
                        + entry[0]
                        + " must be a function or null."
                    );
                }
            });

            const iconRegion =
                element.querySelector(
                    '[data-toast-region="icon"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-toast-region="title"]'
                );

            const bodyRegion =
                element.querySelector(
                    '[data-toast-region="body"]'
                );

            const dismissControl =
                element.querySelector(
                    '[data-toast-action="dismiss"]'
                );

            const progressRegion =
                element.querySelector(
                    '[data-toast-region="progress"]'
                );

            const progressBar =
                element.querySelector(
                    '[data-toast-region="progress-bar"]'
                );

            if (
                !(iconRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(bodyRegion instanceof HTMLElement)
                || !(dismissControl instanceof HTMLButtonElement)
                || !(progressRegion instanceof HTMLElement)
                || !(progressBar instanceof HTMLElement)
            ) {
                throw new Error(
                    "Toast rendered regions are missing."
                );
            }

            this.config(
                "color",
                color
            );

            element.setAttribute(
                "data-toast-color",
                color
            );

            element.setAttribute(
                "role",
                color === "danger"
                    ? "alert"
                    : "status"
            );

            element.setAttribute(
                "aria-live",
                color === "danger"
                    ? "assertive"
                    : "polite"
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

            progressRegion.hidden =
                persistent;

            return this;
        }

        static defaults() {
            return {
                title: "",
                content: "",
                icon: "",
                color: "primary",
                dismissible: true,
                visible: true,
                delay: 5000,
                persistent: false,
                onShow: null,
                onHide: null,
                onDismiss: null,
            };
        }
    }

    global.Builder.register(
        "toast",
        Toast,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

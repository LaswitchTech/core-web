(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Toast Area."
        );
    }

    const TOAST_AREA_POSITIONS = Object.freeze([
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
    ]);

    class ToastArea extends global.Component {
        constructor(config) {
            super(config);

            this.toastComponents =
                new Map();

            this.nextToastId =
                1;
        }

        beforeDestroy() {
            this.clearToasts();
        }

        setPosition(position) {
            if (
                typeof position !== "string"
                || !TOAST_AREA_POSITIONS.includes(
                    position
                )
            ) {
                throw new TypeError(
                    "Toast Area position is invalid."
                );
            }

            this.config(
                "position",
                position
            );

            this.refresh();

            return this;
        }

        addToast(config) {
            if (
                config === null
                || typeof config !== "object"
                || Array.isArray(config)
            ) {
                throw new TypeError(
                    "Toast Area Toast configuration must be an object."
                );
            }

            if (!global.Builder.has("toast")) {
                throw new Error(
                    "Toast Area requires the Toast component."
                );
            }

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                throw new Error(
                    "Toast Area rendered element is missing."
                );
            }

            const id =
                "toast-"
                + this.nextToastId++;

            const originalOnDismiss =
                typeof config.onDismiss === "function"
                    ? config.onDismiss
                    : null;

            const toastConfig =
                Object.assign(
                    {},
                    config,
                    {
                        onDismiss:
                            (toast) => {
                                if (originalOnDismiss !== null) {
                                    originalOnDismiss(
                                        toast
                                    );
                                }

                                this.removeToast(
                                    id
                                );
                            },
                    }
                );

            const toast =
                global.Builder.create(
                    "toast",
                    toastConfig
                );

            toast.appendTo(
                element
            );

            this.toastComponents.set(
                id,
                toast
            );

            return id;
        }

        removeToast(id) {
            if (
                typeof id !== "string"
                || id.trim() === ""
            ) {
                throw new TypeError(
                    "Toast Area toast id must be a non-empty string."
                );
            }

            const toast =
                this.toastComponents.get(
                    id
                );

            if (toast === undefined) {
                return this;
            }

            this.toastComponents.delete(
                id
            );

            if (typeof toast.destroy === "function") {
                toast.destroy();
            }

            return this;
        }

        clearToasts() {
            Array.from(
                this.toastComponents.keys()
            ).forEach(
                (id) => {
                    this.removeToast(
                        id
                    );
                }
            );

            return this;
        }

        render() {
            const area =
                document.createElement(
                    "div"
                );

            area.classList.add(
                "app-toast-area"
            );

            area.setAttribute(
                "aria-label",
                "Notifications"
            );

            this.update(
                area
            );

            return area;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Toast Area update requires an HTMLElement."
                );
            }

            const position =
                this.config(
                    "position"
                );

            if (
                typeof position !== "string"
                || !TOAST_AREA_POSITIONS.includes(
                    position
                )
            ) {
                throw new TypeError(
                    "Toast Area position is invalid."
                );
            }

            element.setAttribute(
                "data-toast-area-position",
                position
            );

            return this;
        }

        static defaults() {
            return {
                position: "top-right",
            };
        }
    }

    global.Builder.register(
        "toast-area",
        ToastArea,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

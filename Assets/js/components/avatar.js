(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Avatar."
        );
    }

    const AVATAR_SIZES = Object.freeze([
        "small",
        "medium",
        "large",
    ]);

    function initials(name) {
        if (
            typeof name !== "string"
            || name.trim() === ""
        ) {
            return "?";
        }

        return name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                function (part) {
                    return part.charAt(0);
                }
            )
            .join("")
            .toUpperCase();
    }

    class Avatar extends global.Component {
        constructor(config) {
            super(config);

            this.handleImageError =
                this.handleImageError.bind(this);

            this.handleImageLoad =
                this.handleImageLoad.bind(this);
        }

        beforeDestroy() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            const image =
                element.querySelector(
                    '[data-avatar-region="image"]'
                );

            if (image instanceof HTMLImageElement) {
                image.removeEventListener(
                    "error",
                    this.handleImageError
                );

                image.removeEventListener(
                    "load",
                    this.handleImageLoad
                );
            }
        }

        handleImageError() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            const image =
                element.querySelector(
                    '[data-avatar-region="image"]'
                );

            const fallback =
                element.querySelector(
                    '[data-avatar-region="fallback"]'
                );

            if (
                !(image instanceof HTMLImageElement)
                || !(fallback instanceof HTMLElement)
            ) {
                return;
            }

            image.hidden =
                true;

            fallback.hidden =
                false;
        }

        handleImageLoad() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            const image =
                element.querySelector(
                    '[data-avatar-region="image"]'
                );

            const fallback =
                element.querySelector(
                    '[data-avatar-region="fallback"]'
                );

            if (
                !(image instanceof HTMLImageElement)
                || !(fallback instanceof HTMLElement)
            ) {
                return;
            }

            image.hidden =
                false;

            fallback.hidden =
                true;
        }

        render() {
            const avatar =
                document.createElement(
                    this.config("href") === ""
                        ? "span"
                        : "a"
                );

            const image =
                document.createElement(
                    "img"
                );

            const fallback =
                document.createElement(
                    "span"
                );

            avatar.classList.add(
                "app-avatar"
            );

            image.classList.add(
                "app-avatar-image"
            );

            fallback.classList.add(
                "app-avatar-fallback"
            );

            image.setAttribute(
                "data-avatar-region",
                "image"
            );

            fallback.setAttribute(
                "data-avatar-region",
                "fallback"
            );

            image.addEventListener(
                "error",
                this.handleImageError
            );

            image.addEventListener(
                "load",
                this.handleImageLoad
            );

            avatar.append(
                image,
                fallback
            );

            this.update(
                avatar
            );

            return avatar;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Avatar update requires an HTMLElement."
                );
            }

            const name =
                this.config(
                    "name"
                );

            const src =
                this.config(
                    "src"
                );

            const alt =
                this.config(
                    "alt"
                );

            const href =
                this.config(
                    "href"
                );

            const size =
                this.config(
                    "size"
                );

            if (typeof name !== "string") {
                throw new TypeError(
                    "Avatar name must be a string."
                );
            }

            if (typeof src !== "string") {
                throw new TypeError(
                    "Avatar src must be a string."
                );
            }

            if (typeof alt !== "string") {
                throw new TypeError(
                    "Avatar alt must be a string."
                );
            }

            if (typeof href !== "string") {
                throw new TypeError(
                    "Avatar href must be a string."
                );
            }

            if (
                typeof size !== "string"
                || !AVATAR_SIZES.includes(
                    size
                )
            ) {
                throw new TypeError(
                    "Avatar size must be small, medium, or large."
                );
            }

            const image =
                element.querySelector(
                    '[data-avatar-region="image"]'
                );

            const fallback =
                element.querySelector(
                    '[data-avatar-region="fallback"]'
                );

            if (
                !(image instanceof HTMLImageElement)
                || !(fallback instanceof HTMLElement)
            ) {
                throw new Error(
                    "Avatar rendered regions are missing."
                );
            }

            element.setAttribute(
                "data-avatar-size",
                size
            );

            if (element instanceof HTMLAnchorElement) {
                element.href =
                    href;

                element.setAttribute(
                    "aria-label",
                    name === ""
                        ? "View profile"
                        : "View " + name
                );
            }

            image.alt =
                alt !== ""
                    ? alt
                    : (
                        name === ""
                            ? "Avatar"
                            : name
                    );

            global.Builder.text(
                fallback,
                initials(
                    name
                )
            );

            if (src === "") {
                image.removeAttribute(
                    "src"
                );

                image.hidden =
                    true;

                fallback.hidden =
                    false;

                return this;
            }

            fallback.hidden =
                true;

            image.hidden =
                false;

            if (image.src !== src) {
                image.src =
                    src;
            }

            return this;
        }

        static defaults() {
            return {
                name: "",
                src: "",
                alt: "",
                href: "",
                size: "medium",
            };
        }
    }

    global.Builder.register(
        "avatar",
        Avatar,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Collapse."
        );
    }

    class Collapse extends global.Component {
        setContent(content) {
            if (
                typeof content !== "string"
                && !(content instanceof Node)
            ) {
                throw new TypeError(
                    "Collapse content must be a string or Node."
                );
            }

            this.config(
                "content",
                content
            );

            this.refresh();

            return this;
        }

        collapse() {
            if (this.config("collapsed") === true) {
                return this;
            }

            this.config(
                "collapsed",
                true
            );

            this.refresh();
            this.notifyChange();

            return this;
        }

        expand() {
            if (this.config("collapsed") === false) {
                return this;
            }

            this.config(
                "collapsed",
                false
            );

            this.refresh();
            this.notifyChange();

            return this;
        }

        toggle() {
            return this.config("collapsed") === true
                ? this.expand()
                : this.collapse();
        }

        notifyChange() {
            const callback =
                this.config(
                    "onChange"
                );

            if (typeof callback === "function") {
                callback(
                    this.config("collapsed"),
                    this
                );
            }

            return this;
        }

        render() {
            const collapse =
                document.createElement(
                    "div"
                );

            const content =
                document.createElement(
                    "div"
                );

            collapse.classList.add(
                "app-collapse"
            );

            content.classList.add(
                "app-collapse-content"
            );

            content.setAttribute(
                "data-collapse-region",
                "content"
            );

            collapse.append(
                content
            );

            this.update(
                collapse
            );

            return collapse;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Collapse update requires an HTMLElement."
                );
            }

            const content =
                this.config(
                    "content"
                );

            const collapsed =
                this.config(
                    "collapsed"
                );

            const onChange =
                this.config(
                    "onChange"
                );

            if (
                typeof content !== "string"
                && !(content instanceof Node)
            ) {
                throw new TypeError(
                    "Collapse content must be a string or Node."
                );
            }

            if (typeof collapsed !== "boolean") {
                throw new TypeError(
                    "Collapse collapsed must be a boolean."
                );
            }

            if (
                onChange !== null
                && typeof onChange !== "function"
            ) {
                throw new TypeError(
                    "Collapse onChange must be a function or null."
                );
            }

            const contentRegion =
                element.querySelector(
                    '[data-collapse-region="content"]'
                );

            if (!(contentRegion instanceof HTMLElement)) {
                throw new Error(
                    "Collapse content region is missing."
                );
            }

            if (typeof content === "string") {
                global.Builder.html(
                    contentRegion,
                    content
                );
            } else {
                contentRegion.replaceChildren(
                    content
                );
            }

            element.setAttribute(
                "data-collapse-collapsed",
                collapsed
                    ? "true"
                    : "false"
            );

            element.setAttribute(
                "aria-hidden",
                collapsed
                    ? "true"
                    : "false"
            );

            contentRegion.inert =
                collapsed;

            return this;
        }

        static defaults() {
            return {
                content: "",
                collapsed: false,
                onChange: null,
            };
        }
    }

    global.Builder.register(
        "collapse",
        Collapse,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

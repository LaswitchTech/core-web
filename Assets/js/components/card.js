(function (global) {
    "use strict";

    if (typeof global.Component !== "function") {
        throw new Error(
            "Core-Web Component must be loaded before the Card component."
        );
    }

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before the Card component."
        );
    }

    class Card extends global.Component {
        static defaults() {
            return {
                title: "",
                content: "",
                footer: "",
            };
        }

        render() {
            if (
                typeof document === "undefined"
                || typeof document.createElement !== "function"
            ) {
                throw new Error(
                    "Card rendering requires a browser document."
                );
            }

            const card =
                document.createElement("div");

            const header =
                document.createElement("div");

            const body =
                document.createElement("div");

            const footer =
                document.createElement("div");

            card.classList.add("app-card");
            header.classList.add("app-card-header");
            body.classList.add("app-card-body");            footer.classList.add("app-card-footer");

            header.setAttribute(
                "data-card-region",
                "header"
            );

            body.setAttribute(
                "data-card-region",
                "body"
            );

            footer.setAttribute(
                "data-card-region",
                "footer"
            );

            global.Builder.text(
                header,
                this.config("title")
            );

            global.Builder.html(
                body,
                this.config("content")
            );

            global.Builder.text(
                footer,
                this.config("footer")
            );

            card.append(
                header,
                body,
                footer
            );

            return card;
        }

        update(element) {
            if (
                typeof Element === "undefined"
                || !(element instanceof Element)
            ) {
                throw new TypeError(
                    "Card update requires the rendered Element."
                );
            }

            const header =
                element.querySelector(
                    '[data-card-region="header"]'
                );

            const body =
                element.querySelector(
                    '[data-card-region="body"]'
                );

            const footer =
                element.querySelector(
                    '[data-card-region="footer"]'
                );

            if (
                !(header instanceof Element)
                || !(body instanceof Element)
                || !(footer instanceof Element)
            ) {
                throw new Error(
                    "Card rendered structure is incomplete."
                );
            }

            global.Builder.text(
                header,
                this.config("title")
            );

            global.Builder.html(
                body,
                this.config("content")
            );

            global.Builder.text(
                footer,
                this.config("footer")
            );

            return this;
        }
    }

    global.Builder.register(
        "card",
        Card,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

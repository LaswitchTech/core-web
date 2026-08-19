(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Dropdown."
        );
    }

    class Dropdown extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick =
                this.handleClick.bind(this);

            this.handleKeyDown =
                this.handleKeyDown.bind(this);

            this.handleDocumentClick =
                this.handleDocumentClick.bind(this);

            this.handleDocumentKeyDown =
                this.handleDocumentKeyDown.bind(this);
        }

        static defaults() {
            return {
                triggerLabel: "",
                triggerIcon: "",
                triggerTitle: "Actions",
                items: [],
                open: false,
            };
        }
    }

    global.Builder.register(
        "dropdown",
        Dropdown,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

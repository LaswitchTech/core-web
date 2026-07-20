(function (global) {
    "use strict";

    const target =
        document.querySelector(
            "#builder-card-demo"
        );

    if (!(target instanceof Element)) {
        throw new Error(
            "Builder Card demo mount point was not found."
        );
    }

    if (
        typeof global.Builder !== "function"
        || !global.Builder.has("card")
    ) {
        throw new Error(
            "Builder Card component is not registered."
        );
    }

    const card =
        global.Builder.create(
            "card",
            {
                title: "Builder Card",
                content:
                    "<strong>Card mounted successfully.</strong>",
                footer: "Initial render",
            }
        );

    const root = card.element();

    card.appendTo(target);

    card.config({
        title: "Builder Card Updated",
        content:
            "<strong>Card refreshed successfully.</strong>",
        footer: "Stable root preserved",
    }).refresh();

    if (
        card.element() !== root
        || !card.mounted()
        || root.parentElement !== target
    ) {
        throw new Error(
            "Builder Card demo refresh validation failed."
        );
    }

    target.setAttribute(
        "data-builder-card-demo",
        "pass"
    );

})(globalThis);

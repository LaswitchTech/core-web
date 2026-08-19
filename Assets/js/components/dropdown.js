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
                sourcePath.getAttribute("d");

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

    function normalizeItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Dropdown items must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Dropdown item configuration is invalid."
                );
            }

            const label =
                typeof item.label === "string"
                    ? item.label
                    : "";

            const icon =
                typeof item.icon === "string"
                    ? item.icon
                    : "";

            const href =
                typeof item.href === "string"
                    ? item.href
                    : "";

            const callback =
                typeof item.callback === "function"
                    ? item.callback
                    : null;

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "Dropdown items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Dropdown items require href or callback."
                );
            }

            return {
                label: label,
                icon: icon,
                href: href,
                disabled:
                    item.disabled === true,
                callback: callback,
            };
        });
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

        open() {
            this.config(
                "open",
                true
            );

            this.refresh();

            const callback =
                this.config("onOpenChange");

            if (typeof callback === "function") {
                callback(true);
            }

            requestAnimationFrame(
                () => {
                    this.updateMenuAlignment();
                }
            );

            return this;
        }

        close() {
            this.config(
                "open",
                false
            );

            this.refresh();

            const callback =
                this.config("onOpenChange");

            if (typeof callback === "function") {
                callback(false);
            }

            return this;
        }

        toggle() {
            return this.config(
                "open"
            ) === true
                ? this.close()
                : this.open();
        }

        updateMenuAlignment() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            const trigger =
                element.querySelector(
                    '[data-dropdown-region="trigger"]'
                );

            const menu =
                element.querySelector(
                    '[data-dropdown-region="menu"]'
                );

            if (
                !(trigger instanceof HTMLButtonElement)
                || !(menu instanceof HTMLElement)
                || menu.hidden
            ) {
                return this;
            }

            element.classList.remove(
                "align-left"
            );

            const triggerRect =
                trigger.getBoundingClientRect();

            const menuRect =
                menu.getBoundingClientRect();

            const viewportWidth =
                document.documentElement.clientWidth;

            const rightAlignedLeft =
                triggerRect.right
                - menuRect.width;

            const leftAlignedRight =
                triggerRect.left
                + menuRect.width;

            const rightAlignmentFits =
                rightAlignedLeft >= 0;

            const leftAlignmentFits =
                leftAlignedRight <= viewportWidth;

            let menuLeft =
                rightAlignedLeft;

            if (
                !rightAlignmentFits
                && leftAlignmentFits
            ) {
                element.classList.add(
                    "align-left"
                );

                menuLeft =
                    triggerRect.left;
            }

            menu.style.top =
                (
                    triggerRect.bottom
                    + 4
                )
                + "px";

            menu.style.left =
                menuLeft
                + "px";

            return this;
        }

        focusItem(direction) {
            const element =
                this.element();

            if (!(element instanceof Element)) {
                return this;
            }

            const items =
                Array.from(
                    element.querySelectorAll(
                        ".app-dropdown-item:not(:disabled):not([aria-disabled='true'])"
                    )
                );

            if (items.length === 0) {
                return this;
            }

            const currentIndex =
                items.indexOf(
                    document.activeElement
                );

            let nextIndex =
                currentIndex;

            if (direction === "first") {
                nextIndex = 0;
            }

            if (direction === "last") {
                nextIndex =
                    items.length - 1;
            }

            if (direction === "next") {
                nextIndex =
                    currentIndex < 0
                        ? 0
                        : (
                            currentIndex + 1
                        ) % items.length;
            }

            if (direction === "previous") {
                nextIndex =
                    currentIndex <= 0
                        ? items.length - 1
                        : currentIndex - 1;
            }

            const target =
                items[nextIndex];

            if (
                target instanceof HTMLElement
            ) {
                target.focus();
            }

            return this;
        }

        beforeDestroy() {
            const element =
                this.element();

            if (element instanceof Element) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );
            }

            document.removeEventListener(
                "click",
                this.handleDocumentClick
            );

            document.removeEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );

            element.removeEventListener(
                "keydown",
                this.handleKeyDown
            );
        }

        handleDocumentKeyDown(event) {
            if (this.config("open") !== true) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();

                this.close();

                requestAnimationFrame(
                    () => {
                        const element =
                            this.element();

                        const trigger =
                            element?.querySelector(
                                '[data-dropdown-region="trigger"]'
                            );

                        if (
                            trigger
                            instanceof HTMLButtonElement
                        ) {
                            trigger.focus();
                        }
                    }
                );

                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();

                this.focusItem(
                    "next"
                );

                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();

                this.focusItem(
                    "previous"
                );

                return;
            }

            if (event.key === "Home") {
                event.preventDefault();

                this.focusItem(
                    "first"
                );

                return;
            }

            if (event.key === "End") {
                event.preventDefault();

                this.focusItem(
                    "last"
                );
            }
        }

        handleDocumentClick(event) {
            if (
                this.config("open") !== true
                || !(event.target instanceof Node)
            ) {
                return;
            }

            const element =
                this.element();

            if (
                element instanceof Element
                && !element.contains(
                    event.target
                )
            ) {
                this.close();
            }
        }

        handleKeyDown(event) {
            if (
                !(event.target instanceof Element)
            ) {
                return;
            }

            const trigger =
                event.target.closest(
                    '[data-dropdown-region="trigger"]'
                );

            if (
                !(trigger instanceof HTMLButtonElement)
                || !this.element()?.contains(
                    trigger
                )
            ) {
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();

                this.open();

                requestAnimationFrame(
                    () => {
                        this.focusItem(
                            "first"
                        );
                    }
                );

                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();

                this.open();

                requestAnimationFrame(
                    () => {
                        this.focusItem(
                            "last"
                        );
                    }
                );
            }
        }

        handleClick(event) {
            if (
                !(event.target instanceof Element)
            ) {
                return;
            }

            const trigger =
                event.target.closest(
                    '[data-dropdown-region="trigger"]'
                );

            if (
                !(trigger instanceof HTMLButtonElement)
                || !this.element()?.contains(
                    trigger
                )
            ) {
                return;
            }

            event.preventDefault();

            this.toggle();
        }

        createItemElement(item) {
            const control =
                document.createElement(
                    item.href === ""
                        ? "button"
                        : "a"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const label =
                document.createElement(
                    "span"
                );

            if (
                control
                instanceof HTMLButtonElement
            ) {
                control.type =
                    "button";

                control.disabled =
                    item.disabled;
            }

            if (
                control
                instanceof HTMLAnchorElement
            ) {
                control.href =
                    item.href;

                if (item.disabled) {
                    control.setAttribute(
                        "aria-disabled",
                        "true"
                    );
                }
            }

            control.classList.add(
                "app-dropdown-item"
            );

            control.setAttribute(
                "role",
                "menuitem"
            );

            control.setAttribute(
                "tabindex",
                "-1"
            );

            icon.classList.add(
                "app-dropdown-item-icon"
            );

            label.classList.add(
                "app-dropdown-item-label"
            );

            renderIcon(
                icon,
                item.icon
            );

            global.Builder.text(
                label,
                item.label
            );

            icon.hidden =
                item.icon === "";

            label.hidden =
                item.label === "";

            control.append(
                icon,
                label
            );

            control.addEventListener(
                "click",
                (event) => {
                    if (item.disabled) {
                        event.preventDefault();
                        return;
                    }

                    if (
                        item.callback !== null
                    ) {
                        item.callback();
                    }

                    this.close();
                }
            );

            return control;
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const trigger =
                document.createElement(
                    "button"
                );

            const triggerIcon =
                document.createElement(
                    "span"
                );

            const triggerLabel =
                document.createElement(
                    "span"
                );

            const menu =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-dropdown"
            );

            trigger.type =
                "button";

            trigger.classList.add(
                "app-dropdown-trigger"
            );

            trigger.setAttribute(
                "data-dropdown-region",
                "trigger"
            );

            triggerIcon.classList.add(
                "app-dropdown-trigger-icon"
            );

            triggerIcon.setAttribute(
                "data-dropdown-region",
                "trigger-icon"
            );

            triggerLabel.classList.add(
                "app-dropdown-trigger-label"
            );

            triggerLabel.setAttribute(
                "data-dropdown-region",
                "trigger-label"
            );

            menu.classList.add(
                "app-dropdown-menu"
            );

            menu.setAttribute(
                "data-dropdown-region",
                "menu"
            );

            menu.setAttribute(
                "role",
                "menu"
            );

            trigger.append(
                triggerLabel,
                triggerIcon
            );

            root.append(
                trigger,
                menu
            );

            root.addEventListener(
                "click",
                this.handleClick
            );

            document.addEventListener(
                "click",
                this.handleDocumentClick
            );

            document.addEventListener(
                "keydown",
                this.handleDocumentKeyDown
            );

            this.update(
                root
            );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Dropdown update requires an HTMLElement."
                );
            }

            const triggerLabel =
                this.config(
                    "triggerLabel"
                );

            const triggerIcon =
                this.config(
                    "triggerIcon"
                );

            const triggerTitle =
                this.config(
                    "triggerTitle"
                );

            const items =
                normalizeItems(
                    this.config("items")
                );

            const open =
                this.config("open");

            if (typeof triggerLabel !== "string") {
                throw new TypeError(
                    "Dropdown triggerLabel must be a string."
                );
            }

            if (typeof triggerIcon !== "string") {
                throw new TypeError(
                    "Dropdown triggerIcon must be a string."
                );
            }

            if (typeof triggerTitle !== "string") {
                throw new TypeError(
                    "Dropdown triggerTitle must be a string."
                );
            }

            if (typeof open !== "boolean") {
                throw new TypeError(
                    "Dropdown open must be a boolean."
                );
            }

            this.config(
                "items",
                items
            );

            const trigger =
                element.querySelector(
                    '[data-dropdown-region="trigger"]'
                );

            const iconRegion =
                element.querySelector(
                    '[data-dropdown-region="trigger-icon"]'
                );

            const labelRegion =
                element.querySelector(
                    '[data-dropdown-region="trigger-label"]'
                );

            const menu =
                element.querySelector(
                    '[data-dropdown-region="menu"]'
                );

            if (
                !(trigger instanceof HTMLButtonElement)
                || !(iconRegion instanceof HTMLElement)
                || !(labelRegion instanceof HTMLElement)
                || !(menu instanceof HTMLElement)
            ) {
                throw new Error(
                    "Dropdown rendered regions are missing."
                );
            }

            renderIcon(
                iconRegion,
                triggerIcon
            );

            global.Builder.text(
                labelRegion,
                triggerLabel
            );

            iconRegion.hidden =
                triggerIcon === "";

            labelRegion.hidden =
                triggerLabel === "";

            trigger.title =
                triggerTitle;

            trigger.setAttribute(
                "aria-haspopup",
                "menu"
            );

            trigger.setAttribute(
                "aria-expanded",
                open
                    ? "true"
                    : "false"
            );

            element.classList.toggle(
                "is-open",
                open
            );

            menu.replaceChildren();

            items.forEach(
                (item) => {
                    menu.append(
                        this.createItemElement(
                            item
                        )
                    );
                }
            );

            menu.hidden =
                !open;

            return this;
        }

        static defaults() {
            return {
                triggerLabel: "",
                triggerIcon: "",
                triggerTitle: "Actions",
                items: [],
                open: false,
                onOpenChange: null,
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

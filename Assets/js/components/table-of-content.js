(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Table of Content."
        );
    }

    const TABLE_OF_CONTENT_ICONS =
        Object.freeze({
            default: [
                '<svg xmlns="http://www.w3.org/2000/svg"',
                ' viewBox="0 0 16 16">',
                '<path fill-rule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"/>',
                '<path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>',
                '<path fill-rule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"/>',
                "</svg>",
            ].join(""),
        });

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

    function normalizeEntries(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table of Content entries must be an array."
            );
        }

        return value.map(function (entry) {
            if (
                entry === null
                || typeof entry !== "object"
                || Array.isArray(entry)
            ) {
                throw new TypeError(
                    "Table of Content entry configuration is invalid."
                );
            }

            const label =
                typeof entry.label === "string"
                    ? entry.label
                    : "";

            const href =
                typeof entry.href === "string"
                    ? entry.href
                    : "";

            if (label === "") {
                throw new TypeError(
                    "Table of Content entries require a label."
                );
            }

            if (href === "") {
                throw new TypeError(
                    "Table of Content entries require an href."
                );
            }

            return {
                label: label,
                href: href,
                children:
                    normalizeEntries(
                        entry.children
                        === undefined
                            ? []
                            : entry.children
                    ),
            };
        });
    }

    class TableOfContent extends global.Component {
        constructor(config) {
            super(config);

            this.scrollspyObserver =
                null;

            this.activeHref =
                "";

            this.handleScrollspyEntries =
                this.handleScrollspyEntries.bind(
                    this
                );

            this.handleScrollspyScroll =
                this.handleScrollspyScroll.bind(
                    this
                );

            const persistedOpen =
                this.readPersistedOpenState();

            if (persistedOpen !== null) {
                this.config(
                    "open",
                    persistedOpen
                );
            }
        }

        destroyScrollspyObserver() {
            if (
                this.scrollspyObserver !== null
                && typeof this.scrollspyObserver.disconnect
                    === "function"
            ) {
                this.scrollspyObserver.disconnect();
            }

            this.scrollspyObserver =
                null;

            return this;
        }

        beforeDestroy() {
            this.destroyScrollspyObserver();

            global.removeEventListener(
                "scroll",
                this.handleScrollspyScroll
            );
        }

        readPersistedOpenState() {
            const key =
                this.config(
                    "persistenceKey"
                );

            if (
                typeof key !== "string"
                || key === ""
            ) {
                return null;
            }

            try {
                const value =
                    global.localStorage.getItem(
                        key
                    );

                if (value === "true") {
                    return true;
                }

                if (value === "false") {
                    return false;
                }
            } catch (error) {
                return null;
            }

            return null;
        }

        persistOpenState() {
            const key =
                this.config(
                    "persistenceKey"
                );

            if (
                typeof key !== "string"
                || key === ""
            ) {
                return this;
            }

            try {
                global.localStorage.setItem(
                    key,
                    this.config("open") === true
                        ? "true"
                        : "false"
                );
            } catch (error) {
                return this;
            }

            return this;
        }

        open() {
            this.config(
                "open",
                true
            );

            this.persistOpenState();
            this.refresh();

            return this;
        }

        close() {
            this.config(
                "open",
                false
            );

            this.persistOpenState();
            this.refresh();

            return this;
        }

        toggle() {
            return this.config(
                "open"
            ) === true
                ? this.close()
                : this.open();
        }

        enableScrollspy() {
            this.config(
                "scrollspyEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableScrollspy() {
            this.config(
                "scrollspyEnabled",
                false
            );

            this.destroyScrollspyObserver();

            global.removeEventListener(
                "scroll",
                this.handleScrollspyScroll
            );

            this.activeHref =
                "";

            this.refresh();

            return this;
        }

        toggleScrollspy() {
            return this.config(
                "scrollspyEnabled"
            ) === true
                ? this.disableScrollspy()
                : this.enableScrollspy();
        }

        getScrollspyTargets(entries) {
            const targets =
                [];

            const collect =
                function (items) {
                    items.forEach(
                        function (entry) {
                            if (
                                entry.href.startsWith(
                                    "#"
                                )
                                && entry.href.length > 1
                            ) {
                                const id =
                                    entry.href.slice(
                                        1
                                    );

                                const target =
                                    document.getElementById(
                                        id
                                    );

                                if (target instanceof HTMLElement) {
                                    targets.push({
                                        href:
                                            entry.href,
                                        element:
                                            target,
                                    });
                                }
                            }

                            collect(
                                entry.children
                            );
                        }
                    );
                };

            collect(
                entries
            );

            return targets;
        }

        setActiveScrollspyHref(href) {
            if (
                typeof href !== "string"
                || href === ""
                || href === "#"
            ) {
                return this;
            }

            this.activeHref =
                href;

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            let activeEntry =
                null;

            element
                .querySelectorAll(
                    "[data-table-of-content-href]"
                )
                .forEach(
                    function (entry) {
                        if (!(entry instanceof HTMLElement)) {
                            return;
                        }

                        const active =
                            entry.getAttribute(
                                "data-table-of-content-href"
                            ) === href;

                        entry.classList.toggle(
                            "is-active",
                            active
                        );

                        if (active) {
                            activeEntry =
                                entry;

                            entry.setAttribute(
                                "aria-current",
                                "location"
                            );
                        } else {
                            entry.removeAttribute(
                                "aria-current"
                            );
                        }
                    }
                );

            if (activeEntry !== null) {
                this.scrollEntryIntoView(
                    activeEntry
                );
            }

            return this;
        }

        handleScrollspyEntries(entries) {
            const visible =
                entries
                    .filter(
                        function (entry) {
                            return entry.isIntersecting;
                        }
                    )
                    .sort(
                        function (left, right) {
                            return left.boundingClientRect.top
                                - right.boundingClientRect.top;
                        }
                    );

            if (visible.length === 0) {
                return;
            }

            const target =
                visible[0].target;

            if (!(target instanceof HTMLElement)) {
                return;
            }

            const href =
                "#"
                + target.id;

            this.setActiveScrollspyHref(
                href
            );
        }

        scrollEntryIntoView(entry) {
            if (!(entry instanceof HTMLElement)) {
                return this;
            }

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            const panel =
                element.querySelector(
                    '[data-table-of-content-region="panel"]'
                );

            const entries =
                element.querySelector(
                    '[data-table-of-content-region="entries"]'
                );

            if (
                !(panel instanceof HTMLElement)
                || !(entries instanceof HTMLElement)
                || panel.hidden
            ) {
                return this;
            }

            const entriesRect =
                entries.getBoundingClientRect();

            const entryRect =
                entry.getBoundingClientRect();

            if (entryRect.top < entriesRect.top) {
                entries.scrollTop -=
                    entriesRect.top
                    - entryRect.top;

                return this;
            }

            if (entryRect.bottom > entriesRect.bottom) {
                entries.scrollTop +=
                    entryRect.bottom
                    - entriesRect.bottom;
            }

            return this;
        }

        handleScrollspyScroll() {
            const entries =
                normalizeEntries(
                    this.config(
                        "entries"
                    )
                );

            this.reconcileScrollspy(
                entries
            );
        }

        reconcileScrollspy(entries) {
            if (
                this.config(
                    "scrollspyEnabled"
                ) !== true
            ) {
                return this;
            }

            const targets =
                this.getScrollspyTargets(
                    entries
                );

            if (targets.length === 0) {
                return this;
            }

            const activationPoint =
                Math.min(
                    global.innerHeight * 0.35,
                    320
                );

            let activeTarget =
                targets[0];

            targets.forEach(
                function (target) {
                    if (
                        target.element
                            .getBoundingClientRect()
                            .top
                        <= activationPoint
                    ) {
                        activeTarget =
                            target;
                    }
                }
            );

            const documentElement =
                document.documentElement;

            const atDocumentEnd =
                global.scrollY
                + global.innerHeight
                >= documentElement.scrollHeight - 2;

            if (atDocumentEnd) {
                activeTarget =
                    targets[
                        targets.length - 1
                    ];
            }

            this.setActiveScrollspyHref(
                activeTarget.href
            );

            return this;
        }
        initializeScrollspy(entries) {
            global.removeEventListener(
                "scroll",
                this.handleScrollspyScroll
            );

            if (
                this.config(
                    "scrollspyEnabled"
                ) !== true
            ) {
                return this;
            }

            const targets =
                this.getScrollspyTargets(
                    entries
                );

            if (targets.length === 0) {
                return this;
            }

            global.addEventListener(
                "scroll",
                this.handleScrollspyScroll,
                {
                    passive: true,
                }
            );

            this.reconcileScrollspy(
                entries
            );

            return this;
        }

        createEntryList(entries) {
            const list =
                document.createElement(
                    "ul"
                );

            list.classList.add(
                "app-table-of-content-list"
            );

            entries.forEach(
                (entry) => {
                    const item =
                        document.createElement(
                            "li"
                        );

                    const link =
                        document.createElement(
                            "a"
                        );

                    item.classList.add(
                        "app-table-of-content-item"
                    );

                    link.classList.add(
                        "app-table-of-content-link"
                    );

                    link.href =
                        entry.href;

                    link.setAttribute(
                        "data-table-of-content-href",
                        entry.href
                    );

                    global.Builder.text(
                        link,
                        entry.label
                    );

                    if (
                        entry.href === this.activeHref
                    ) {
                        link.classList.add(
                            "is-active"
                        );

                        link.setAttribute(
                            "aria-current",
                            "location"
                        );
                    }

                    item.append(
                        link
                    );

                    if (entry.children.length > 0) {
                        item.append(
                            this.createEntryList(
                                entry.children
                            )
                        );
                    }

                    list.append(
                        item
                    );
                }
            );

            return list;
        }

        static defaults() {
            return {
                title: "Table of Content",
                entries: [],
                icon:
                    TABLE_OF_CONTENT_ICONS.default,
                triggerTitle:
                    "Table of Content",
                open: false,
                persistenceKey:
                    "core-web.table-of-content",
                scrollspyEnabled:
                    false,
                scrollspyRootMargin:
                    "-20% 0px -70% 0px",
            };
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Table of Content update requires an HTMLElement."
                );
            }

            const title =
                this.config(
                    "title"
                );

            const icon =
                this.config(
                    "icon"
                );

            const triggerTitle =
                this.config(
                    "triggerTitle"
                );

            const open =
                this.config(
                    "open"
                );

            const scrollspyEnabled =
                this.config(
                    "scrollspyEnabled"
                );

            const entries =
                normalizeEntries(
                    this.config(
                        "entries"
                    )
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Table of Content title must be a string."
                );
            }

            if (typeof icon !== "string") {
                throw new TypeError(
                    "Table of Content icon must be a string."
                );
            }

            if (typeof triggerTitle !== "string") {
                throw new TypeError(
                    "Table of Content triggerTitle must be a string."
                );
            }

            if (typeof open !== "boolean") {
                throw new TypeError(
                    "Table of Content open must be a boolean."
                );
            }

            if (typeof scrollspyEnabled !== "boolean") {
                throw new TypeError(
                    "Table of Content scrollspyEnabled must be a boolean."
                );
            }

            if (!scrollspyEnabled) {
                this.activeHref =
                    "";
            }

            this.config(
                "entries",
                entries
            );

            const panelRegion =
                element.querySelector(
                    '[data-table-of-content-region="panel"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-table-of-content-region="title"]'
                );

            const entriesRegion =
                element.querySelector(
                    '[data-table-of-content-region="entries"]'
                );

            const triggerRegion =
                element.querySelector(
                    '[data-table-of-content-region="trigger"]'
                );

            if (
                !(panelRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(entriesRegion instanceof HTMLElement)
                || !(triggerRegion instanceof HTMLButtonElement)
            ) {
                throw new Error(
                    "Table of Content rendered regions are missing."
                );
            }

            global.Builder.text(
                titleRegion,
                title
            );

            titleRegion.hidden =
                title === "";

            triggerRegion.setAttribute(
                "aria-label",
                triggerTitle
            );

            triggerRegion.setAttribute(
                "title",
                triggerTitle
            );

            triggerRegion.setAttribute(
                "aria-expanded",
                open
                    ? "true"
                    : "false"
            );

            renderIcon(
                triggerRegion,
                icon
            );

            panelRegion.hidden =
                !open;

            element.classList.toggle(
                "is-open",
                open
            );

            entriesRegion.replaceChildren();

            if (entries.length > 0) {
                entriesRegion.append(
                    this.createEntryList(
                        entries
                    )
                );
            }

            this.initializeScrollspy(
                entries
            );

            return this;
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const panel =
                document.createElement(
                    "nav"
                );

            const header =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            const entries =
                document.createElement(
                    "div"
                );

            const trigger =
                document.createElement(
                    "button"
                );

            root.classList.add(
                "app-table-of-content"
            );

            panel.classList.add(
                "app-table-of-content-panel"
            );

            title.classList.add(
                "app-table-of-content-title"
            );

            entries.classList.add(
                "app-table-of-content-entries"
            );

            trigger.type =
                "button";

            trigger.classList.add(
                "app-table-of-content-trigger"
            );

            panel.setAttribute(
                "data-table-of-content-region",
                "panel"
            );

            header.classList.add(
                "app-table-of-content-header"
            );

            title.setAttribute(
                "data-table-of-content-region",
                "title"
            );

            entries.setAttribute(
                "data-table-of-content-region",
                "entries"
            );

            trigger.setAttribute(
                "data-table-of-content-region",
                "trigger"
            );

            header.append(
                title
            );

            panel.append(
                header,
                entries
            );

            root.append(
                trigger,
                panel
            );

            trigger.addEventListener(
                "click",
                () => {
                    this.toggle();
                }
            );

            this.update(
                root
            );

            return root;
        }
    }

    global.Builder.register(
        "table-of-content",
        TableOfContent,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);
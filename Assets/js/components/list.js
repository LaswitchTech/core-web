(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before List."
        );
    }

    const LIST_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        move: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>',
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

            svg.append(
                path
            );
        });

        if (
            svg.childElementCount === 0
        ) {
            return;
        }

        element.replaceChildren(
            svg
        );
    }

    function normalizeActions(value) {
        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new TypeError(
                "List item actions must be an array."
            );
        }

        return value.map(function (action) {
            if (
                action === null
                || typeof action !== "object"
                || Array.isArray(action)
                || typeof action.callback !== "function"
            ) {
                throw new TypeError(
                    "List item action configuration is invalid."
                );
            }

            const label =
                typeof action.label === "string"
                    ? action.label
                    : "";

            const icon =
                typeof action.icon === "string"
                    ? action.icon
                    : "";

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "List item actions require a label or icon."
                );
            }

            return {
                label: label,
                icon: icon,
                disabled:
                    action.disabled === true,
                callback: action.callback,
            };
        });
    }

    function normalizeItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "List items must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
                || typeof item.title !== "string"
            ) {
                throw new TypeError(
                    "List item configuration is invalid."
                );
            }

            const metadata =
                item.metadata === undefined
                    ? []
                    : item.metadata;

            if (
                !Array.isArray(metadata)
                || metadata.some(function (entry) {
                    return typeof entry !== "string";
                })
            ) {
                throw new TypeError(
                    "List item metadata must be an array of strings."
                );
            }

            return {
                id:
                    typeof item.id === "string"
                        ? item.id
                        : "",
                icon:
                    typeof item.icon === "string"
                        ? item.icon
                        : "",
                title: item.title,
                description:
                    typeof item.description === "string"
                        ? item.description
                        : "",
                metadata: metadata.slice(),
                href:
                    typeof item.href === "string"
                        ? item.href
                        : "",
                actions:
                    normalizeActions(
                        item.actions
                    ),
            };
        });
    }

    class List extends global.Component {
        constructor(config) {
            super(config);

            this.searchQuery = "";
            this.sortable = null;
            this.actionDropdowns = [];
            this.handleSearchInput =
                this.handleSearchInput.bind(this);
        }

        static defaults() {
            return {
                items: [],
                searchEnabled: true,
                sortableEnabled: false,
                searchPlaceholder: "Search…",
                emptyMessage: "No items are available.",
            };
        }


        isSortableAvailable() {
            return typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                );
        }

        beforeDestroy() {
            if (
                this.sortable !== null
                && typeof this.sortable.destroy === "function"
            ) {
                this.sortable.destroy();
                this.sortable = null;
            }

            this.destroyActionDropdowns();

            const element =
                this.element();

            if (!(element instanceof Element)) {
                return;
            }

            const searchInput =
                element.querySelector(
                    '[data-list-region="search-input"]'
                );

            if (
                searchInput
                instanceof HTMLInputElement
            ) {
                searchInput.removeEventListener(
                    "input",
                    this.handleSearchInput
                );
            }
        }

        destroyActionDropdowns() {
            this.actionDropdowns.forEach(
                function (dropdown) {
                    if (
                        dropdown
                        && typeof dropdown.destroy === "function"
                    ) {
                        dropdown.destroy();
                    }
                }
            );

            this.actionDropdowns = [];

            return this;
        }

        handleSearchInput(event) {
            if (
                !(event.target instanceof HTMLInputElement)
            ) {
                return;
            }

            this.searchQuery =
                event.target.value
                    .trim()
                    .toLowerCase();

            this.refresh();
        }

        initializeSortable(items) {
            if (
                this.sortable !== null
                && typeof this.sortable.destroy === "function"
            ) {
                this.sortable.destroy();
                this.sortable = null;
            }

            if (
                this.config("sortableEnabled") !== true
                || !this.isSortableAvailable()
                || this.searchQuery !== ""
            ) {
                return this;
            }

            this.sortable =
                global.Sortable.create(
                    items,
                    {
                        draggable:
                            ".app-list-item",
                        handle:
                            ".app-list-item-move-handle",
                        animation: 150,
                        onEnd: (event) => {
                            if (
                                typeof event.oldIndex !== "number"
                                || typeof event.newIndex !== "number"
                                || event.oldIndex === event.newIndex
                            ) {
                                return;
                            }

                            const currentItems =
                                this.config("items").slice();

                            const moved =
                                currentItems.splice(
                                    event.oldIndex,
                                    1
                                )[0];

                            currentItems.splice(
                                event.newIndex,
                                0,
                                moved
                            );

                            this.config(
                                "items",
                                currentItems
                            );
                        },
                    }
                );

            return this;
        }

        itemMatchesSearch(item) {
            if (this.searchQuery === "") {
                return true;
            }

            const searchableText = [
                item.title,
                item.description,
                ...item.metadata,
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                this.searchQuery
            );
        }

        createActionButton(action, item) {
            const button =
                document.createElement(
                    "button"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const label =
                document.createElement(
                    "span"
                );

            button.type = "button";

            button.classList.add(
                "app-list-item-action"
            );

            icon.classList.add(
                "app-list-item-action-icon"
            );

            label.classList.add(
                "app-list-item-action-label"
            );

            renderIcon(
                icon,
                action.icon
            );

            global.Builder.text(
                label,
                action.label
            );

            icon.hidden =
                action.icon === "";

            label.hidden =
                action.label === "";

            button.disabled =
                action.disabled;

            if (action.label !== "") {
                button.setAttribute(
                    "title",
                    action.label
                );

                button.setAttribute(
                    "aria-label",
                    action.label
                );
            }

            button.append(
                icon,
                label
            );

            button.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (button.disabled) {
                        return;
                    }

                    action.callback(
                        item
                    );
                }
            );

            return button;
        }

        createMultipleActionsElement(
            actions,
            item
        ) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "List multiple actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            LIST_ICONS.menu,
                        triggerTitle:
                            "Actions",
                        items:
                            actions.map(
                                function (action) {
                                    return {
                                        label:
                                            action.label,
                                        icon:
                                            action.icon,
                                        disabled:
                                            action.disabled,
                                        callback:
                                            function () {
                                                action.callback(
                                                    item
                                                );
                                            },
                                    };
                                }
                            ),
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "List action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-list-item-action-dropdown"
            );

            this.actionDropdowns.push(
                dropdown
            );

            return element;
        }

        createItemElement(item) {
            const root =
                document.createElement(
                    "div"
                );

            const moveHandle =
                document.createElement(
                    "button"
                );

            const primary =
                document.createElement(
                    item.href === ""
                        ? "div"
                        : "a"
                );

            const icon =
                document.createElement(
                    "span"
                );

            const content =
                document.createElement(
                    "span"
                );

            const title =
                document.createElement(
                    "span"
                );

            const description =
                document.createElement(
                    "span"
                );

            const metadata =
                document.createElement(
                    "span"
                );

            const actions =
                document.createElement(
                    "span"
                );

            root.classList.add(
                "app-list-item"
            );

            moveHandle.type = "button";

            moveHandle.classList.add(
                "app-list-item-move-handle"
            );

            moveHandle.setAttribute(
                "aria-label",
                "Move item"
            );

            moveHandle.setAttribute(
                "title",
                "Move item"
            );

            renderIcon(
                moveHandle,
                LIST_ICONS.move
            );

            primary.classList.add(
                "app-list-item-primary"
            );

            icon.classList.add(
                "app-list-item-icon"
            );

            content.classList.add(
                "app-list-item-content"
            );

            title.classList.add(
                "app-list-item-title"
            );

            description.classList.add(
                "app-list-item-description"
            );

            metadata.classList.add(
                "app-list-item-metadata"
            );

            actions.classList.add(
                "app-list-item-actions"
            );

            if (item.id !== "") {
                root.dataset.listItemId =
                    item.id;
            }

            if (
                primary
                instanceof HTMLAnchorElement
            ) {
                primary.href =
                    item.href;
            }

            renderIcon(
                icon,
                item.icon
            );

            global.Builder.text(
                title,
                item.title
            );

            global.Builder.text(
                description,
                item.description
            );

            description.hidden =
                item.description === "";

            item.metadata.forEach(
                function (entry) {
                    const metadataItem =
                        document.createElement(
                            "span"
                        );

                    metadataItem.classList.add(
                        "app-list-item-metadata-value"
                    );

                    global.Builder.text(
                        metadataItem,
                        entry
                    );

                    metadata.append(
                        metadataItem
                    );
                }
            );

            metadata.hidden =
                item.metadata.length === 0;

            content.append(
                title,
                description,
                metadata
            );

            moveHandle.hidden =
                this.config("sortableEnabled") !== true
                || !this.isSortableAvailable()
                || this.searchQuery !== "";

            primary.append(
                icon,
                content
            );

            if (item.actions.length === 1) {
                actions.append(
                    this.createActionButton(
                        item.actions[0],
                        item
                    )
                );
            }

            if (item.actions.length > 1) {
                actions.append(
                    this.createMultipleActionsElement(
                        item.actions,
                        item
                    )
                );
            }

            actions.hidden =
                item.actions.length === 0;

            root.append(
                moveHandle,
                primary,
                actions
            );

            return root;
        }

        render() {
            const container =
                document.createElement("div");

            const search =
                document.createElement("div");

            const searchInput =
                document.createElement("input");

            const items =
                document.createElement("div");

            const empty =
                document.createElement("div");

            container.classList.add(
                "app-list"
            );

            search.classList.add(
                "app-list-search"
            );

            search.setAttribute(
                "data-list-region",
                "search"
            );

            searchInput.type = "search";

            searchInput.classList.add(
                "app-list-search-input"
            );

            searchInput.setAttribute(
                "data-list-region",
                "search-input"
            );

            items.classList.add(
                "app-list-items"
            );

            items.setAttribute(
                "data-list-region",
                "items"
            );

            empty.classList.add(
                "app-list-empty"
            );

            empty.setAttribute(
                "data-list-region",
                "empty"
            );

            searchInput.addEventListener(
                "input",
                this.handleSearchInput
            );

            search.append(
                searchInput
            );

            container.append(
                search,
                items,
                empty
            );

            this.update(
                container
            );

            return container;
        }

        update(element) {
            const normalizedItems =
                normalizeItems(
                    this.config("items")
                );

            const searchEnabled =
                this.config("searchEnabled");

            const sortableEnabled =
                this.config("sortableEnabled");

            const searchPlaceholder =
                this.config("searchPlaceholder");

            const emptyMessage =
                this.config("emptyMessage");

            if (typeof searchEnabled !== "boolean") {
                throw new TypeError(
                    "List searchEnabled must be a boolean."
                );
            }

            if (typeof sortableEnabled !== "boolean") {
                throw new TypeError(
                    "List sortableEnabled must be a boolean."
                );
            }

            if (typeof searchPlaceholder !== "string") {
                throw new TypeError(
                    "List searchPlaceholder must be a string."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "List emptyMessage must be a string."
                );
            }

            this.config(
                "items",
                normalizedItems
            );

            const search =
                element.querySelector(
                    '[data-list-region="search"]'
                );

            const searchInput =
                element.querySelector(
                    '[data-list-region="search-input"]'
                );

            const items =
                element.querySelector(
                    '[data-list-region="items"]'
                );

            const empty =
                element.querySelector(
                    '[data-list-region="empty"]'
                );

            if (
                !(search instanceof HTMLDivElement)
                || !(searchInput instanceof HTMLInputElement)
                || !(items instanceof HTMLDivElement)
                || !(empty instanceof HTMLDivElement)
            ) {
                throw new Error(
                    "List rendered regions are invalid."
                );
            }

            search.hidden =
                searchEnabled !== true;

            searchInput.placeholder =
                searchPlaceholder;

            searchInput.value =
                this.searchQuery;

            global.Builder.text(
                empty,
                emptyMessage
            );

            this.destroyActionDropdowns();

            const itemElements =
                normalizedItems
                    .filter(
                        (item) =>
                            this.itemMatchesSearch(
                                item
                            )
                    )
                    .map(
                        (item) =>
                            this.createItemElement(
                                item
                            )
                    );

            items.replaceChildren(
                ...itemElements
            );

            empty.hidden =
                itemElements.length > 0;

            this.initializeSortable(
                items
            );

            return this;
        }
    }

    global.Builder.register(
        "list",
        List,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

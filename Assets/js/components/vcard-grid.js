(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before vCard Grid."
        );
    }

    function normalizeItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "vCard Grid items must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "vCard Grid item configuration is invalid."
                );
            }

            return Object.assign(
                {},
                item
            );
        });
    }

    class VCardGrid extends global.Component {
        constructor(config) {
            super(config);

            this.searchQuery = "";
            this.sortable = null;
            this.cards = [];

            this.handleSearchInput =
                this.handleSearchInput.bind(this);
        }

        beforeDestroy() {
            if (
                this.sortable !== null
                && typeof this.sortable.destroy === "function"
            ) {
                this.sortable.destroy();
                this.sortable = null;
            }

            const element =
                this.element();

            if (element instanceof Element) {
                const searchInput =
                    element.querySelector(
                        '[data-vcard-grid-region="search-input"]'
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

            this.destroyCards();
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

        isSortableAvailable() {
            return typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                );
        }

        destroyCards() {
            this.cards.forEach(
                function (card) {
                    if (
                        card
                        && typeof card.destroy === "function"
                    ) {
                        card.destroy();
                    }
                }
            );

            this.cards = [];

            return this;
        }

        initializeSortable(itemsRegion) {
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
                    itemsRegion,
                    {
                        draggable:
                            ".app-vcard",
                        handle:
                            ".app-vcard-move-handle",
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

            const tags =
                Array.isArray(item.tags)
                    ? item.tags
                    : [];

            const metadata =
                Array.isArray(item.metadata)
                    ? item.metadata
                    : [];

            const links =
                Array.isArray(item.links)
                    ? item.links
                    : [];

            const searchableText = [
                item.name,
                item.organization,
                item.title,
                item.email,
                item.phone,
                item.address,
                ...tags,
                ...metadata.flatMap(
                    function (entry) {
                        if (
                            entry === null
                            || typeof entry !== "object"
                        ) {
                            return [];
                        }

                        return [
                            entry.label,
                            entry.value,
                        ];
                    }
                ),
                ...links.flatMap(
                    function (entry) {
                        if (
                            entry === null
                            || typeof entry !== "object"
                        ) {
                            return [];
                        }

                        return [
                            entry.label,
                            entry.href,
                        ];
                    }
                ),
            ]
                .filter(
                    function (value) {
                        return typeof value === "string";
                    }
                )
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                this.searchQuery
            );
        }

        render() {
            const container =
                document.createElement(
                    "div"
                );

            const search =
                document.createElement(
                    "div"
                );

            const searchInput =
                document.createElement(
                    "input"
                );

            const items =
                document.createElement(
                    "div"
                );

            const empty =
                document.createElement(
                    "div"
                );

            container.classList.add(
                "app-vcard-grid"
            );

            search.classList.add(
                "app-vcard-grid-search"
            );

            search.setAttribute(
                "data-vcard-grid-region",
                "search"
            );

            searchInput.type =
                "search";

            searchInput.classList.add(
                "app-vcard-grid-search-input"
            );

            searchInput.setAttribute(
                "data-vcard-grid-region",
                "search-input"
            );

            items.classList.add(
                "app-vcard-grid-items"
            );

            items.setAttribute(
                "data-vcard-grid-region",
                "items"
            );

            empty.classList.add(
                "app-vcard-grid-empty"
            );

            empty.setAttribute(
                "data-vcard-grid-region",
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
            const items =
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
                    "vCard Grid searchEnabled must be a boolean."
                );
            }

            if (typeof sortableEnabled !== "boolean") {
                throw new TypeError(
                    "vCard Grid sortableEnabled must be a boolean."
                );
            }

            if (typeof searchPlaceholder !== "string") {
                throw new TypeError(
                    "vCard Grid searchPlaceholder must be a string."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "vCard Grid emptyMessage must be a string."
                );
            }

            this.config(
                "items",
                items
            );

            const search =
                element.querySelector(
                    '[data-vcard-grid-region="search"]'
                );

            const searchInput =
                element.querySelector(
                    '[data-vcard-grid-region="search-input"]'
                );

            const itemsRegion =
                element.querySelector(
                    '[data-vcard-grid-region="items"]'
                );

            const empty =
                element.querySelector(
                    '[data-vcard-grid-region="empty"]'
                );

            if (
                !(search instanceof HTMLElement)
                || !(searchInput instanceof HTMLInputElement)
                || !(itemsRegion instanceof HTMLElement)
                || !(empty instanceof HTMLElement)
            ) {
                throw new Error(
                    "vCard Grid rendered regions are missing."
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

            this.destroyCards();

            const visibleItems =
                items.filter(
                    (item) =>
                        this.itemMatchesSearch(
                            item
                        )
                );

            itemsRegion.replaceChildren();

            visibleItems.forEach(
                (item) => {
                    const config =
                        Object.assign(
                            {},
                            item,
                            {
                                moveHandleVisible:
                                    sortableEnabled === true
                                    && this.searchQuery === ""
                                    && this.isSortableAvailable(),
                            }
                        );

                    const card =
                        global.Builder.create(
                            "vcard",
                            config
                        );

                    card.appendTo(
                        itemsRegion
                    );

                    this.cards.push(
                        card
                    );
                }
            );

            empty.hidden =
                visibleItems.length > 0;

            this.initializeSortable(
                itemsRegion
            );

            return this;
        }

        static defaults() {
            return {
                items: [],
                searchEnabled: true,
                sortableEnabled: false,
                searchPlaceholder:
                    "Search contacts…",
                emptyMessage:
                    "No contacts are available.",
            };
        }
    }

    global.Builder.register(
        "vcard-grid",
        VCardGrid,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

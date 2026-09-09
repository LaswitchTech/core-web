(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Timeline."
        );
    }

    const TIMELINE_ICONS = Object.freeze({
        start: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>',
            '<path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>',
            '<path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>',
            "</svg>",
        ].join(""),
        now: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>',
            '<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>',
            "</svg>",
        ].join(""),
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        sortDown: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>',
            "</svg>",
        ].join(""),
        sortUp: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.5.5 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>',
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

    function normalizeDirection(value) {
        return value === "ascending"
            ? "ascending"
            : "descending";
    }

    function normalizeLayout(value) {
        return value === "horizontal"
            ? "horizontal"
            : "vertical";
    }

    function normalizeItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Timeline items must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Timeline item configuration is invalid."
                );
            }

            return item;
        });
    }

    function normalizeFilters(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Timeline filters must be an array."
            );
        }

        return value.map(function (filter) {
            if (
                filter === null
                || typeof filter !== "object"
                || Array.isArray(filter)
            ) {
                throw new TypeError(
                    "Timeline filter configuration is invalid."
                );
            }

            const value =
                typeof filter.value === "string"
                    ? filter.value
                    : "";

            const label =
                typeof filter.label === "string"
                    ? filter.label
                    : "";

            if (label === "") {
                throw new TypeError(
                    "Timeline filters require a label."
                );
            }

            return {
                value: value,
                label: label,
            };
        });
    }

    function getDateKey(timestamp) {
        const date =
            new Date(
                timestamp
            );

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0"),
        ].join("-");
    }

    function formatDate(timestamp) {
        const date =
            new Date(
                timestamp
            );

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(
            undefined,
            {
                dateStyle:
                    "long",
            }
        ).format(
            date
        );
    }

    function stripHtml(value) {
        const element =
            document.createElement(
                "div"
            );

        global.Builder.html(
            element,
            typeof value === "string"
                ? value
                : ""
        );

        return element.textContent
            || "";
    }

    class Timeline extends global.Component {
        constructor(config) {
            super(config);

            this.timelineItems =
                [];

            this.filterButtonGroup =
                null;

            this.searchInput =
                null;

            this.sortButton =
                null;

            this.loadMoreButton =
                null;

            this.loadingMore =
                false;

            this.controlMenuDropdown =
                null;
        }

        destroyTimelineItems() {
            this.timelineItems.forEach(
                function (item) {
                    if (
                        item !== null
                        && typeof item.destroy
                            === "function"
                    ) {
                        item.destroy();
                    }
                }
            );

            this.timelineItems =
                [];

            return this;
        }

        destroyFilterButtonGroup() {
            if (
                this.filterButtonGroup !== null
                && typeof this.filterButtonGroup.destroy
                    === "function"
            ) {
                this.filterButtonGroup.destroy();
            }

            this.filterButtonGroup =
                null;

            return this;
        }

        destroySearchInput() {
            if (
                this.searchInput !== null
                && typeof this.searchInput.destroy
                    === "function"
            ) {
                this.searchInput.destroy();
            }

            this.searchInput =
                null;

            return this;
        }

        destroyLoadMoreButton() {
            if (
                this.loadMoreButton !== null
                && typeof this.loadMoreButton.destroy
                    === "function"
            ) {
                this.loadMoreButton.destroy();
            }

            this.loadMoreButton =
                null;

            return this;
        }

        destroySortButton() {
            if (
                this.sortButton !== null
                && typeof this.sortButton.destroy
                    === "function"
            ) {
                this.sortButton.destroy();
            }

            this.sortButton =
                null;

            return this;
        }

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Timeline control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            TIMELINE_ICONS.menu,
                        triggerTitle:
                            "Timeline controls",
                        items:
                            items,
                        open:
                            this.config("controlMenuOpen") === true,
                        onOpenChange:
                            (open) => {
                                this.config(
                                    "controlMenuOpen",
                                    open
                                );
                            },
                    }
                );

            this.controlMenuDropdown =
                dropdown;

            return dropdown;
        }

        destroyControlMenuDropdown() {
            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.destroy
                    === "function"
            ) {
                this.controlMenuDropdown.destroy();
            }

            this.controlMenuDropdown =
                null;

            return this;
        }

        beforeDestroy() {
            this.destroyTimelineItems();
            this.destroyFilterButtonGroup();
            this.destroySearchInput();
            this.destroySortButton();
            this.destroyLoadMoreButton();
            this.destroyControlMenuDropdown();
        }

        getFilteredItems() {
             const items =
                normalizeItems(
                    this.config(
                        "items"
                    )
                );

            const selectedFilter =
                this.config(
                    "selectedFilter"
                );

            const searchQuery =
                this.config(
                    "searchQuery"
                )
                    .trim()
                    .toLowerCase();

            const direction =
                normalizeDirection(
                    this.config(
                        "direction"
                    )
                );

            this.config(
                "direction",
                direction
            );

            return items.filter(
                function (item) {
                    const type =
                        typeof item.type === "string"
                            ? item.type
                            : "";

                    if (
                        selectedFilter !== ""
                        && type !== selectedFilter
                    ) {
                        return false;
                    }

                    if (searchQuery === "") {
                        return true;
                    }

                    const userName =
                        item.user
                        && typeof item.user.name === "string"
                            ? item.user.name
                            : "";

                    const searchable = [
                        typeof item.title === "string"
                            ? item.title
                            : "",
                        stripHtml(
                            item.content
                        ),
                        type,
                        userName,
                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        searchQuery
                    );
                }
            ).sort(
                function (left, right) {
                    const leftTime =
                        new Date(
                            left.timestamp
                        ).getTime();

                    const rightTime =
                        new Date(
                            right.timestamp
                        ).getTime();

                    const normalizedLeft =
                        Number.isNaN(leftTime)
                            ? 0
                            : leftTime;

                    const normalizedRight =
                        Number.isNaN(rightTime)
                            ? 0
                            : rightTime;

                    return direction === "ascending"
                        ? normalizedLeft
                            - normalizedRight
                        : normalizedRight
                            - normalizedLeft;
                }
            );
        }

        async loadMore() {
            const callback =
                this.config(
                    "onLoadMore"
                );

            if (
                typeof callback !== "function"
                || this.loadingMore === true
            ) {
                return this;
            }

            this.loadingMore =
                true;

            this.refresh();

            try {
                await callback(
                    this
                );
            } finally {
                this.loadingMore =
                    false;

                this.refresh();
            }

            return this;
        }

        setDirection(direction) {
            this.config(
                "direction",
                normalizeDirection(
                    direction
                )
            );

            this.refresh();

            return this;
        }

        toggleDirection() {
            return this.setDirection(
                this.config("direction") === "ascending"
                    ? "descending"
                    : "ascending"
            );
        }

        static defaults() {
            return {
                items: [],
                layout: "vertical",
                direction: "descending",
                sortControlVisible: true,
                filters: [],
                selectedFilter: "",
                searchEnabled: true,
                searchPlaceholder: "Search timeline…",
                searchQuery: "",
                startVisible: true,
                endVisible: true,
                emptyMessage: "No matching timeline items.",
                loadMoreLabel: "Load more",
                loadingMoreLabel: "Loading…",
                onLoadMore: null,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
            };
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const toolbar =
                document.createElement(
                    "div"
                );

            const filters =
                document.createElement(
                    "div"
                );

            const search =
                document.createElement(
                    "div"
                );

            const controls =
                document.createElement(
                    "div"
                );

            const stream =
                document.createElement(
                    "div"
                );

            const track =
                document.createElement(
                    "div"
                );

            const empty =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-timeline"
            );

            toolbar.classList.add(
                "app-timeline-toolbar"
            );

            filters.classList.add(
                "app-timeline-filters"
            );

            search.classList.add(
                "app-timeline-search"
            );

            controls.classList.add(
                "app-timeline-controls"
            );

            stream.classList.add(
                "app-timeline-stream"
            );

            track.classList.add(
                "app-timeline-track"
            );

            empty.classList.add(
                "app-timeline-empty"
            );

            filters.setAttribute(
                "data-timeline-region",
                "filters"
            );

            search.setAttribute(
                "data-timeline-region",
                "search"
            );

            controls.setAttribute(
                "data-timeline-region",
                "controls"
            );

            stream.setAttribute(
                "data-timeline-region",
                "stream"
            );

            track.setAttribute(
                "data-timeline-region",
                "track"
            );

            empty.setAttribute(
                "data-timeline-region",
                "empty"
            );

            toolbar.append(
                filters,
                search,
                controls
            );

            stream.append(
                track
            );

            root.append(
                toolbar,
                stream,
                empty
            );

            this.update(
                root
            );

            return root;
        }

        createLoadMoreControl() {
            if (!global.Builder.has("button")) {
                throw new Error(
                    "Timeline Load More requires the Button component."
                );
            }

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.classList.add(
                "app-timeline-load-more"
            );

            const button =
                global.Builder.create(
                    "button",
                    {
                        label:
                            this.loadingMore
                                ? this.config(
                                    "loadingMoreLabel"
                                )
                                : this.config(
                                    "loadMoreLabel"
                                ),
                        variant:
                            "secondary",
                        size:
                            "small",
                        disabled:
                            this.loadingMore,
                        callback:
                            () => {
                                this.loadMore();
                            },
                    }
                );

            button.appendTo(
                wrapper
            );

            this.loadMoreButton =
                button;

            return wrapper;
        }

        renderStream(
            streamRegion,
            emptyRegion,
            startVisible,
            endVisible,
            emptyMessage
        ) {
            this.destroyTimelineItems();
            this.destroyLoadMoreButton();

            streamRegion.replaceChildren();

            const items =
                this.getFilteredItems();

            global.Builder.text(
                emptyRegion,
                emptyMessage
            );

            emptyRegion.hidden =
                items.length > 0;

            if (items.length === 0) {
                return this;
            }

            const createMarker =
                function (
                    type,
                    label,
                    icon
                ) {
                    const marker =
                        document.createElement(
                            "div"
                        );

                    const indicator =
                        document.createElement(
                            "span"
                        );

                    const text =
                        document.createElement(
                            "span"
                        );

                    marker.classList.add(
                        "app-timeline-marker",
                        "app-timeline-marker-"
                            + type
                    );

                    indicator.classList.add(
                        "app-timeline-marker-icon"
                    );

                    text.classList.add(
                        "app-timeline-marker-label"
                    );

                    renderIcon(
                        indicator,
                        icon
                    );

                    global.Builder.text(
                        text,
                        label
                    );

                    marker.append(
                        indicator,
                        text
                    );

                    return marker;
                };

            const direction =
                normalizeDirection(
                    this.config(
                        "direction"
                    )
                );

            const loadMoreVisible =
                typeof this.config(
                    "onLoadMore"
                ) === "function";

            if (
                direction === "descending"
                && endVisible
            ) {
                streamRegion.append(
                    createMarker(
                        "now",
                        "Now",
                        TIMELINE_ICONS.now
                    )
                );
            }

            if (
                direction === "ascending"
                && startVisible
            ) {
                streamRegion.append(
                    createMarker(
                        "start",
                        "Past",
                        TIMELINE_ICONS.start
                    )
                );
            }

            if (
                direction === "ascending"
                && loadMoreVisible
            ) {
                streamRegion.append(
                    this.createLoadMoreControl()
                );
            }

            let previousDateKey =
                null;

            items.forEach(
                (itemConfig) => {
                    const dateKey =
                        getDateKey(
                            itemConfig.timestamp
                        );

                    if (
                        dateKey !== ""
                        && dateKey !== previousDateKey
                    ) {
                        const separator =
                            document.createElement(
                                "div"
                            );

                        separator.classList.add(
                            "app-timeline-date"
                        );

                        global.Builder.text(
                            separator,
                            formatDate(
                                itemConfig.timestamp
                            )
                        );

                        streamRegion.append(
                            separator
                        );

                        previousDateKey =
                            dateKey;
                    }

                    if (!global.Builder.has("timeline-item")) {
                        throw new Error(
                            "Timeline requires the Timeline Item component."
                        );
                    }

                    const timelineItem =
                        global.Builder.create(
                            "timeline-item",
                            Object.assign(
                                {},
                                itemConfig,
                                {
                                    layout:
                                        normalizeLayout(
                                            this.config(
                                                "layout"
                                            )
                                        ),
                                }
                            )
                        );

                    timelineItem.appendTo(
                        streamRegion
                    );

                    this.timelineItems.push(
                        timelineItem
                    );
                }
            );

            if (
                direction === "ascending"
                && endVisible
            ) {
                streamRegion.append(
                    createMarker(
                        "now",
                        "Now",
                        TIMELINE_ICONS.now
                    )
                );
            }

            if (
                direction === "descending"
                && loadMoreVisible
            ) {
                streamRegion.append(
                    this.createLoadMoreControl()
                );
            }

            if (
                direction === "descending"
                && startVisible
            ) {
                streamRegion.append(
                    createMarker(
                        "start",
                        "Past",
                        TIMELINE_ICONS.start
                    )
                );
            }

            return this;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Timeline update requires an HTMLElement."
                );
            }

            const layout =
                normalizeLayout(
                    this.config(
                        "layout"
                    )
                );

            this.config(
                "layout",
                layout
            );

            element.setAttribute(
                "data-timeline-layout",
                layout
            );

            const filters =
                normalizeFilters(
                    this.config(
                        "filters"
                    )
                );

            const sortControlVisible =
                this.config(
                    "sortControlVisible"
                );

            if (typeof sortControlVisible !== "boolean") {
                throw new TypeError(
                    "Timeline sortControlVisible must be a boolean."
                );
            }

            const selectedFilter =
                this.config(
                    "selectedFilter"
                );

            const searchEnabled =
                this.config(
                    "searchEnabled"
                );

            const searchPlaceholder =
                this.config(
                    "searchPlaceholder"
                );

            const searchQuery =
                this.config(
                    "searchQuery"
                );

            const startVisible =
                this.config(
                    "startVisible"
                );

            const endVisible =
                this.config(
                    "endVisible"
                );

            const emptyMessage =
                this.config(
                    "emptyMessage"
                );

            const loadMoreLabel =
                this.config(
                    "loadMoreLabel"
                );

            const loadingMoreLabel =
                this.config(
                    "loadingMoreLabel"
                );

            const onLoadMore =
                this.config(
                    "onLoadMore"
                );

            if (typeof loadMoreLabel !== "string") {
                throw new TypeError(
                    "Timeline loadMoreLabel must be a string."
                );
            }

            if (typeof loadingMoreLabel !== "string") {
                throw new TypeError(
                    "Timeline loadingMoreLabel must be a string."
                );
            }

            if (
                onLoadMore !== null
                && typeof onLoadMore !== "function"
            ) {
                throw new TypeError(
                    "Timeline onLoadMore must be a function or null."
                );
            }

            const controlMenuEnabled =
                this.config(
                    "controlMenuEnabled"
                );

            const controlMenuOpen =
                this.config(
                    "controlMenuOpen"
                );

            const controlMenuItems =
                this.config(
                    "controlMenuItems"
                );

            if (typeof controlMenuEnabled !== "boolean") {
                throw new TypeError(
                    "Timeline controlMenuEnabled must be a boolean."
                );
            }

            if (typeof controlMenuOpen !== "boolean") {
                throw new TypeError(
                    "Timeline controlMenuOpen must be a boolean."
                );
            }

            if (!Array.isArray(controlMenuItems)) {
                throw new TypeError(
                    "Timeline controlMenuItems must be an array."
                );
            }

            if (typeof selectedFilter !== "string") {
                throw new TypeError(
                    "Timeline selectedFilter must be a string."
                );
            }

            if (typeof searchEnabled !== "boolean") {
                throw new TypeError(
                    "Timeline searchEnabled must be a boolean."
                );
            }

            if (typeof searchPlaceholder !== "string") {
                throw new TypeError(
                    "Timeline searchPlaceholder must be a string."
                );
            }

            if (typeof searchQuery !== "string") {
                throw new TypeError(
                    "Timeline searchQuery must be a string."
                );
            }

            if (
                typeof startVisible !== "boolean"
                || typeof endVisible !== "boolean"
            ) {
                throw new TypeError(
                    "Timeline startVisible and endVisible must be booleans."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "Timeline emptyMessage must be a string."
                );
            }

            const filtersRegion =
                element.querySelector(
                    '[data-timeline-region="filters"]'
                );

            const searchRegion =
                element.querySelector(
                    '[data-timeline-region="search"]'
                );

            const streamRegion =
                element.querySelector(
                    '[data-timeline-region="stream"]'
                );

            const controlsRegion =
                element.querySelector(
                    '[data-timeline-region="controls"]'
                );

            const trackRegion =
                element.querySelector(
                    '[data-timeline-region="track"]'
                );

            const emptyRegion =
                element.querySelector(
                    '[data-timeline-region="empty"]'
                );

            if (
                !(filtersRegion instanceof HTMLElement)
                || !(searchRegion instanceof HTMLElement)
                || !(controlsRegion instanceof HTMLElement)
                || !(streamRegion instanceof HTMLElement)
                || !(trackRegion instanceof HTMLElement)
                || !(emptyRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Timeline rendered regions are missing."
                );
            }

            this.config(
                "filters",
                filters
            );

            this.destroyFilterButtonGroup();
            this.destroySearchInput();

            filtersRegion.replaceChildren();
            searchRegion.replaceChildren();

            if (filters.length > 0) {
                if (!global.Builder.has("button-group")) {
                    throw new Error(
                        "Timeline filters require the Button Group component."
                    );
                }

                const filterButtonGroup =
                    global.Builder.create(
                        "button-group",
                        {
                            buttons:
                                filters.map(
                                    (filter) => {
                                        return {
                                            label:
                                                filter.label,
                                            variant:
                                                filter.value
                                                    === selectedFilter
                                                    ? "primary"
                                                    : "secondary",
                                            callback:
                                                () => {
                                                    this.config(
                                                        "selectedFilter",
                                                        filter.value
                                                    );

                                                    this.refresh();
                                                },
                                        };
                                    }
                                ),
                            orientation:
                                "horizontal",
                            presentation:
                                "attached",
                            equalWidth:
                                false,
                            wrap:
                                false,
                        }
                    );

                filterButtonGroup.appendTo(
                    filtersRegion
                );

                this.filterButtonGroup =
                    filterButtonGroup;
            }

            filtersRegion.hidden =
                filters.length === 0;

            if (searchEnabled) {
                if (!global.Builder.has("input")) {
                    throw new Error(
                        "Timeline search requires the Input component."
                    );
                }

                const input =
                    global.Builder.create(
                        "input",
                        {
                            type:
                                "search",
                            name:
                                "timeline-search",
                            value:
                                searchQuery,
                            placeholder:
                                searchPlaceholder,
                            clearActionEnabled:
                                true,
                        }
                    );

                input.appendTo(
                    searchRegion
                );

                const inputElement =
                    input.element()
                        ?.querySelector(
                            "input"
                        );

                if (inputElement instanceof HTMLInputElement) {
                    inputElement.addEventListener(
                        "input",
                        () => {
                            this.config(
                                "searchQuery",
                                inputElement.value
                            );

                            this.renderStream(
                                trackRegion,
                                emptyRegion,
                                startVisible,
                                endVisible,
                                emptyMessage
                            );
                        }
                    );
                }

                this.searchInput =
                    input;
            }

            searchRegion.hidden =
                !searchEnabled;

            this.destroySortButton();
            this.destroyControlMenuDropdown();

            controlsRegion.replaceChildren();

            if (sortControlVisible) {
                if (!global.Builder.has("button")) {
                    throw new Error(
                        "Timeline sort control requires the Button component."
                    );
                }

                const direction =
                    normalizeDirection(
                        this.config(
                            "direction"
                        )
                    );

                const sortButton =
                    global.Builder.create(
                        "button",
                        {
                            icon:
                                direction === "descending"
                                    ? TIMELINE_ICONS.sortDown
                                    : TIMELINE_ICONS.sortUp,
                            variant:
                                "secondary",
                            size:
                                "small",
                            title:
                                direction === "descending"
                                    ? "Sort oldest first"
                                    : "Sort newest first",
                            callback:
                                () => {
                                    this.toggleDirection();
                                },
                        }
                    );

                sortButton.appendTo(
                    controlsRegion
                );

                this.sortButton =
                    sortButton;
            }

            const controlMenuVisible =
                controlMenuEnabled
                && controlMenuItems.length > 0;

            if (controlMenuVisible) {
                const dropdown =
                    this.createControlMenuDropdown(
                        controlMenuItems
                    );

                dropdown.appendTo(
                    controlsRegion
                );
            }

            controlsRegion.hidden =
                !sortControlVisible
                && !controlMenuVisible;

            this.renderStream(
                trackRegion,
                emptyRegion,
                startVisible,
                endVisible,
                emptyMessage
            );

            return this;
        }
    }

    global.Builder.register(
        "timeline",
        Timeline,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

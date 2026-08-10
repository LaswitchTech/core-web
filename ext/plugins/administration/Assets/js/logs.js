(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Administration Log Viewer."
        );
    }

    function normalizeStringArray(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(function (item) {
            return typeof item === "string"
                && item !== "";
        });
    }

    function normalizeEntry(value) {
        if (
            value === null
            || typeof value !== "object"
            || typeof value.timestamp !== "string"
            || value.timestamp === ""
            || typeof value.channel !== "string"
            || value.channel === ""
            || typeof value.level !== "string"
            || value.level === ""
            || typeof value.message !== "string"
            || value.context === null
            || typeof value.context !== "object"
            || Array.isArray(value.context)
        ) {
            return null;
        }

        return {
            timestamp: value.timestamp,
            channel: value.channel,
            level: value.level,
            message: value.message,
            context: value.context,
        };
    }

    function formatTimestamp(value) {
        var date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    }

    function createLevelElement(value) {
        var level =
            document.createElement("span");

        level.classList.add(
            "admin-log-viewer-entry-level",
            "admin-log-viewer-entry-level-"
                + String(value).toLowerCase()
        );

        level.textContent =
            String(value);

        return level;
    }

    function createTimestampElement(value) {
        var timestamp =
            document.createElement("time");

        timestamp.classList.add(
            "admin-log-viewer-entry-timestamp"
        );

        timestamp.dateTime =
            String(value);

        timestamp.textContent =
            formatTimestamp(
                String(value)
            );

        return timestamp;
    }

    function createMessageElement(value) {
        var message =
            document.createElement("span");

        message.classList.add(
            "admin-log-viewer-entry-message"
        );

        message.textContent =
            String(value);

        message.setAttribute(
            "data-log-message-collapsed",
            "true"
        );

        return message;
    }

    function createRefreshIconMarkup() {
        return [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' width="16"',
            ' height="16"',
            ' fill="currentColor"',
            ' class="app-icon"',
            ' viewBox="0 0 16 16"',
            ' aria-hidden="true">',
            '<path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>',
            '<path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/>',
            '</svg>',
        ].join("");
    }

    function createRefreshIcon() {
        var namespace =
            "http://www.w3.org/2000/svg";

        var icon =
            document.createElementNS(
                namespace,
                "svg"
            );

        icon.setAttribute(
            "xmlns",
            namespace
        );

        icon.setAttribute(
            "width",
            "16"
        );

        icon.setAttribute(
            "height",
            "16"
        );

        icon.setAttribute(
            "fill",
            "currentColor"
        );

        icon.setAttribute(
            "viewBox",
            "0 0 16 16"
        );

        icon.setAttribute(
            "aria-hidden",
            "true"
        );

        icon.classList.add(
            "app-icon"
        );

        var path =
            document.createElementNS(
                namespace,
                "path"
            );

        path.setAttribute(
            "d",
            "M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
        );

        var path2 =
            document.createElementNS(
                namespace,
                "path"
            );

        path2.setAttribute(
            "d",
            "M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
        );

        icon.append(
            path,
            path2
        );

        return icon;
    }

    function createClearSelectionIcon() {
        return [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' width="16"',
            ' height="16"',
            ' fill="currentColor"',
            ' class="app-icon"',
            ' viewBox="0 0 16 16"',
            ' aria-hidden="true">',
            '<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>',
            '<path d="M2.5 1a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5"/>',
            '</svg>',
        ].join("");
    }

    function createInspectIcon() {
        return [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' width="16"',
            ' height="16"',
            ' fill="currentColor"',
            ' class="app-icon"',
            ' viewBox="0 0 16 16">',
            '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>',
            '<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>',
            '</svg>',
        ].join("");
    }

    function formatContext(value) {
        if (
            value === null
            || typeof value !== "object"
            || Array.isArray(value)
            || Object.keys(value).length === 0
        ) {
            return "";
        }

        try {
            return JSON.stringify(
                value,
                null,
                2
            );
        } catch (_error) {
            return "";
        }
    }

    function initializeLogViewer() {
        var mount = document.getElementById(
            "admin-log-viewer"
        );

        if (!(mount instanceof Element)) {
            return;
        }

        var endpoint =
            mount.dataset.logEndpoint || "";

        if (endpoint === "") {
            return;
        }

        var channels = [];

        try {
            channels = normalizeStringArray(
                JSON.parse(
                    mount.dataset.logChannels || "[]"
                )
            );
        } catch (_error) {
            channels = [];
        }

        var levels = [];

        try {
            levels = normalizeStringArray(
                JSON.parse(
                    mount.dataset.logLevels || "[]"
                )
            );
        } catch (_error) {
            levels = [];
        }

        if (
            !global.Builder.has("card")
            || !global.Builder.has("table")
            || !global.Builder.has("input")
            || !global.Builder.has("select")
            || !global.Builder.has("button")
        ) {
            return;
        }

        var state = {
            channel:
                channels.length > 0
                    ? channels[0]
                    : "",
            levels: [],
            search: "",
            since: "",
            until: "",
            page: 1,
            pageSize: 25,
            hasPrevious: false,
            hasMore: false,
            loading: false,
        };

        var logTable = null;
        var inspectionElement = null;
        var channelControl = null;
        var levelControl = null;
        var searchControl = null;
        var sinceControl = null;
        var untilControl = null;
        var refreshButton = null;
        var clearSelectionButton = null;
        var previousButton = null;
        var nextButton = null;
        var previousPageItem = null;
        var nextPageItem = null;

        var feedback = document.createElement("div");

        feedback.classList.add(
            "admin-log-viewer-feedback"
        );

        feedback.hidden = true;

        feedback.setAttribute(
            "aria-live",
            "polite"
        );

        function showFeedback(type, message) {
            feedback.classList.remove(
                "admin-log-viewer-feedback-error",
                "admin-log-viewer-feedback-info"
            );

            feedback.classList.add(
                type === "error"
                    ? "admin-log-viewer-feedback-error"
                    : "admin-log-viewer-feedback-info"
            );

            feedback.setAttribute(
                "role",
                type === "error"
                    ? "alert"
                    : "status"
            );

            feedback.textContent = message;
            feedback.hidden = false;
        }

        function clearFeedback() {
            feedback.hidden = true;
            feedback.textContent = "";

            feedback.classList.remove(
                "admin-log-viewer-feedback-error",
                "admin-log-viewer-feedback-info"
            );

            feedback.removeAttribute("role");
        }

        function buildRequestUrl() {
            var url = new URL(
                endpoint,
                global.location.origin
            );

            if (state.channel !== "") {
                url.searchParams.set(
                    "channel",
                    state.channel
                );
            }

            url.searchParams.set(
                "page",
                String(state.page)
            );

            url.searchParams.set(
                "pageSize",
                String(state.pageSize)
            );

            if (state.levels.length > 0) {
                url.searchParams.set(
                    "levels",
                    state.levels.join(",")
                );
            }

            if (state.search !== "") {
                url.searchParams.set(
                    "search",
                    state.search
                );
            }

            if (state.since !== "") {
                url.searchParams.set(
                    "since",
                    state.since
                );
            }

            if (state.until !== "") {
                url.searchParams.set(
                    "until",
                    state.until
                );
            }

            return url;
        }

        function updatePaginationControls() {
            if (previousButton !== null) {
                previousButton.config({
                    disabled:
                        state.loading
                        || !state.hasPrevious,
                });
            }

            if (nextButton !== null) {
                nextButton.config({
                    disabled:
                        state.loading
                        || !state.hasMore,
                });
            }

            if (previousPageItem instanceof Element) {
                previousPageItem.classList.toggle(
                    "disabled",
                    state.loading
                        || !state.hasPrevious
                );
            }

            if (nextPageItem instanceof Element) {
                nextPageItem.classList.toggle(
                    "disabled",
                    state.loading
                        || !state.hasMore
                );
            }
        }

        function renderRefreshButton() {
            if (refreshButton === null) {
                return;
            }

            var element =
                refreshButton.element();

            if (!(element instanceof HTMLButtonElement)) {
                return;
            }

            element.setAttribute(
                "aria-label",
                "Refresh log entries"
            );

            if (state.loading) {
                element.textContent = "";

                var spinner =
                    document.createElement("span");

                spinner.classList.add(
                    "admin-log-viewer-refresh-spinner"
                );

                spinner.setAttribute(
                    "aria-hidden",
                    "true"
                );

                element.append(spinner);

                return;
            }

            element.replaceChildren(
                createRefreshIcon()
            );
        }

        function setLoading(loading) {
            state.loading =
                loading === true;

            if (
                logTable !== null
                && typeof logTable.setLoading
                    === "function"
            ) {
                logTable.setLoading(
                    state.loading,
                    "Loading log entries…"
                );
            }

            if (refreshButton !== null) {
                refreshButton.config({
                    loading: state.loading,
                    disabled: state.loading,
                });

                renderRefreshButton();
            }

            updatePaginationControls();

            if (
                logTable !== null
                && typeof logTable.refreshConditionalElements
                    === "function"
            ) {
                logTable.refreshConditionalElements();
            }
        }

        function renderEmptyState(message) {
            if (
                logTable === null
                || typeof logTable.config !== "function"
                || typeof logTable.clearRows !== "function"
            ) {
                return;
            }

            logTable.config(
                "emptyMessage",
                message
            );

            logTable.clearRows();
        }

        function inspectEntry(entry) {
            if (!(inspectionElement instanceof Element)) {
                return;
            }

            var title =
                document.createElement("h3");

            title.classList.add(
                "admin-log-viewer-inspection-title"
            );

            title.textContent =
                entry.level
                + " — "
                + entry.channel;

            var metadata =
                document.createElement("p");

            metadata.classList.add(
                "admin-log-viewer-inspection-metadata"
            );

            metadata.textContent =
                formatTimestamp(
                    entry.timestamp
                );

            var message =
                document.createElement("pre");

            message.classList.add(
                "admin-log-viewer-inspection-message"
            );

            message.textContent =
                entry.message;

            var content = [
                title,
                metadata,
                message,
            ];

            var contextValue =
                formatContext(
                    entry.context
                );

            if (contextValue !== "") {
                var context =
                    document.createElement("pre");

                context.classList.add(
                    "admin-log-viewer-entry-context"
                );

                context.textContent =
                    contextValue;

                content.push(context);
            }

            inspectionElement.replaceChildren(
                ...content
            );

            inspectionElement.hidden = false;

            inspectionElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }

        function renderEntries(entries) {
            var rows = entries
                .map(normalizeEntry)
                .filter(function (entry) {
                    return entry !== null;
                });

            if (rows.length === 0) {
                renderEmptyState(
                    "No valid log entries are available."
                );

                return;
            }

            if (
                logTable === null
                || typeof logTable.config !== "function"
                || typeof logTable.setRows !== "function"
            ) {
                return;
            }

            logTable.config(
                "emptyMessage",
                "No log entries are available."
            );

            logTable.setRows(
                rows
            );
        }

        function isValidPayload(payload) {
            return payload !== null
                && typeof payload === "object"
                && payload.success === true
                && Array.isArray(payload.entries)
                && payload.pagination !== null
                && typeof payload.pagination === "object";
        }

        function loadEntries() {
            if (state.loading) {
                return;
            }

            clearFeedback();

            state.hasPrevious = false;
            state.hasMore = false;

            updatePaginationControls();

            if (inspectionElement instanceof Element) {
                inspectionElement.hidden = true;
                inspectionElement.replaceChildren();
            }

            setLoading(true);

            fetch(
                buildRequestUrl(),
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                }
            )
                .then(function (response) {
                    return response.json().then(function (payload) {
                        return {
                            status: response.status,
                            payload: payload,
                        };
                    });
                })
                .then(function (result) {
                    var payload = result.payload;

                    if (
                        result.status < 200
                        || result.status >= 300
                        || !isValidPayload(payload)
                    ) {
                        var message =
                            payload !== null
                            && typeof payload === "object"
                            && typeof payload.message === "string"
                            && payload.message !== ""
                                ? payload.message
                                : "The log entries could not be loaded.";

                        showFeedback(
                            "error",
                            message
                        );

                        renderEmptyState(
                            "No log entries are available."
                        );

                        return;
                    }

                    state.hasPrevious =
                        payload.pagination.hasPrevious === true;

                    state.hasMore =
                        payload.pagination.hasMore === true;

                    updatePaginationControls();

                    if (payload.entries.length === 0) {
                        renderEmptyState(
                            "No log entries match the current filters."
                        );

                        return;
                    }

                    renderEntries(
                        payload.entries
                    );
                })
                .catch(function () {
                    showFeedback(
                        "error",
                        "The log request could not be completed."
                    );

                    renderEmptyState(
                        "No log entries are available."
                    );
                })
                .finally(function () {
                    setLoading(false);
                });
        }

        channelControl = global.Builder.create(
            "select",
            {
                name: "log-channel",
                label: "Channel",
                options:
                    channels.map(function (channel) {
                        return {
                            value: channel,
                            label: channel,
                        };
                    }),
                value: state.channel,
                values: [],
                placeholder: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                invalid: false,
                select2Enabled: true,
                select2Options: {
                    minimumResultsForSearch:
                        channels.length > 10
                            ? 0
                            : Infinity,
                },
            }
        );

        var channelElement =
            channelControl.selectElement();

        channelElement.addEventListener(
            "change",
            function () {
                state.channel =
                    channelControl.value();

                state.page = 1;

                loadEntries();
            }
        );

        levelControl = global.Builder.create(
            "select",
            {
                name: "log-levels",
                label: "Levels",
                options:
                    levels.map(function (level) {
                        return {
                            value: level,
                            label: level,
                        };
                    }),
                value: "",
                values: state.levels,
                placeholder:
                    "All levels",
                describedBy: "",
                multiple: true,
                required: false,
                disabled: false,
                invalid: false,
                select2Enabled: true,
                select2Options: {
                    closeOnSelect: false,
                },
            }
        );

        var levelElement =
            levelControl.selectElement();

        levelElement.addEventListener(
            "change",
            function () {
                state.levels =
                    levelControl.values();

                state.page = 1;

                loadEntries();
            }
        );

        searchControl = global.Builder.create(
            "input",
            {
                type: "search",
                name: "log-search",
                value: state.search,
                placeholder:
                    "Search messages and context",
                autocomplete: "off",
                accept: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                readonly: false,
                invalid: false,
                label: "Search",
                clearActionEnabled: true,
                defaultActionEnabled: false,
                defaultValue: "",
                resetActionEnabled: false,
                previousValue: state.search,
            }
        );

        var searchElement =
            searchControl.inputElement();

        searchElement.addEventListener(
            "change",
            function () {
                state.search =
                    searchControl.value().trim();

                state.page = 1;

                loadEntries();
            }
        );

        searchElement.addEventListener(
            "keydown",
            function (event) {
                if (event.key !== "Enter") {
                    return;
                }

                event.preventDefault();

                state.search =
                    searchControl.value().trim();

                state.page = 1;

                loadEntries();
            }
        );

        sinceControl = global.Builder.create(
            "input",
            {
                type: "datetime-local",
                name: "log-since",
                value: state.since,
                placeholder: "",
                autocomplete: "off",
                accept: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                readonly: false,
                invalid: false,
                label: "From",
                clearActionEnabled: true,
                defaultActionEnabled: false,
                defaultValue: "",
                resetActionEnabled: false,
                previousValue: state.since,
            }
        );

        var sinceElement =
            sinceControl.inputElement();

        sinceElement.addEventListener(
            "change",
            function () {
                state.since =
                    sinceControl.value();

                state.page = 1;

                loadEntries();
            }
        );

        untilControl = global.Builder.create(
            "input",
            {
                type: "datetime-local",
                name: "log-until",
                value: state.until,
                placeholder: "",
                autocomplete: "off",
                accept: "",
                describedBy: "",
                multiple: false,
                required: false,
                disabled: false,
                readonly: false,
                invalid: false,
                label: "Until",
                clearActionEnabled: true,
                defaultActionEnabled: false,
                defaultValue: "",
                resetActionEnabled: false,
                previousValue: state.until,
            }
        );

        var untilElement =
            untilControl.inputElement();

        untilElement.addEventListener(
            "change",
            function () {
                state.until =
                    untilControl.value();

                state.page = 1;

                loadEntries();
            }
        );

        refreshButton = global.Builder.create(
            "button",
            {
                label: "",
                type: "button",
                variant: "secondary",
                size: "medium",
                disabled: false,
                loading: false,
                title: "Refresh log entries",
            }
        );

        var refreshButtonElement =
            refreshButton.element();

        if (!(refreshButtonElement instanceof Element)) {
            refreshButton = null;
        } else {
            refreshButtonElement.classList.add(
                "admin-log-viewer-refresh"
            );

            renderRefreshButton();

            refreshButtonElement.addEventListener(
                "click",
                function () {
                    loadEntries();
                }
            );
        }

        clearSelectionButton =
            global.Builder.create(
                "button",
                {
                    label: "Clear Selection",
                    type: "button",
                    variant: "secondary",
                    size: "medium",
                    disabled: false,
                    loading: false,
                    title: "Clear selected log entries",
                }
            );

        var clearSelectionButtonElement =
            clearSelectionButton.element();

        if (!(clearSelectionButtonElement instanceof Element)) {
            clearSelectionButton = null;
        } else {
            clearSelectionButtonElement.addEventListener(
                "click",
                function () {
                    if (
                        logTable !== null
                        && typeof logTable.clearSelection
                            === "function"
                    ) {
                        logTable.clearSelection();
                    }
                }
            );
        }

        previousButton = global.Builder.create(
            "button",
            {
                label: "Previous",
                type: "button",
                variant: "secondary",
                size: "medium",
                disabled: true,
                loading: false,
                title: "Load previous page",
            }
        );

        nextButton = global.Builder.create(
            "button",
            {
                label: "Next",
                type: "button",
                variant: "secondary",
                size: "medium",
                disabled: true,
                loading: false,
                title: "Load next page",
            }
        );

        var previousButtonElement =
            previousButton.element();

        var nextButtonElement =
            nextButton.element();

        if (
            !(previousButtonElement instanceof Element)
            || !(nextButtonElement instanceof Element)
        ) {
            return;
        }

        var pagination =
            document.createElement("ul");

        pagination.classList.add(
            "pagination",
            "admin-log-viewer-pagination"
        );

        previousPageItem =
            document.createElement("li");

        previousPageItem.classList.add(
            "page-item"
        );

        nextPageItem =
            document.createElement("li");

        nextPageItem.classList.add(
            "page-item"
        );

        previousButtonElement.classList.add(
            "page-link"
        );

        nextButtonElement.classList.add(
            "page-link"
        );

        previousPageItem.append(
            previousButtonElement
        );

        nextPageItem.append(
            nextButtonElement
        );

        pagination.append(
            previousPageItem,
            nextPageItem
        );

        previousButtonElement.addEventListener(
            "click",
            function () {
                if (
                    state.loading
                    || !state.hasPrevious
                    || state.page <= 1
                ) {
                    return;
                }

                state.page -= 1;

                loadEntries();
            }
        );

        nextButtonElement.addEventListener(
            "click",
            function () {
                if (
                    state.loading
                    || !state.hasMore
                ) {
                    return;
                }

                state.page += 1;

                loadEntries();
            }
        );

        var viewerCard = global.Builder.create(
            "card",
            {
                title: "Application Logs",
                content: "",
                footer: "",
                headerVisible: true,
                bodyVisible: true,
                bodyPaddingEnabled: false,
                footerVisible: false,
                controlMenuEnabled: false,
                closeControlVisible: false,
                fullscreenControlVisible: false,
                collapseControlVisible: false,
            }
        );

        var viewerCardElement =
            viewerCard.element();

        if (!(viewerCardElement instanceof Element)) {
            return;
        }

        viewerCardElement.classList.add(
            "admin-log-viewer-card"
        );

        var viewerBody =
            viewerCardElement.querySelector(
                '[data-card-region="body"]'
            );

        if (!(viewerBody instanceof Element)) {
            return;
        }

        logTable = global.Builder.create(
            "table",
            {
                columns: [
                    {
                        key: "timestamp",
                        label: "Timestamp",
                        sortable: true,
                        searchable: false,
                        className:
                            "admin-log-viewer-column-timestamp",
                        formatter:
                            createTimestampElement,
                    },
                    {
                        key: "channel",
                        label: "Channel",
                        sortable: true,
                        searchable: true,
                        className:
                            "admin-log-viewer-column-channel",
                    },
                    {
                        key: "level",
                        label: "Level",
                        sortable: true,
                        searchable: true,
                        className:
                            "admin-log-viewer-column-level",
                        formatter:
                            createLevelElement,
                    },
                    {
                        key: "message",
                        label: "Message",
                        sortable: false,
                        searchable: true,
                        className:
                            "admin-log-viewer-column-message",
                        formatter:
                            createMessageElement,
                    },
                ],
                rows: [],
                actions: [
                    {
                        id: "inspect",
                        label: "",
                        icon: createInspectIcon(),
                        title: "Inspect log entry",
                        className:
                            "admin-log-viewer-inspect-action",
                        disabled: false,
                        handler: function (row) {
                            inspectEntry(
                                row
                            );
                        },
                    },
                ],
                controls: [
                    channelControl.element(),
                    levelControl.element(),
                    searchControl.element(),
                    sinceControl.element(),
                    untilControl.element(),
                    {
                        id: "refresh",
                        element:
                            refreshButton.element(),
                        label: "",
                        icon:
                            createRefreshIconMarkup(),
                        title:
                            "Refresh log entries",
                        className:
                            "admin-log-viewer-refresh",
                        dataTableButton: true,
                        visible: true,
                        disabled:
                            function () {
                                return state.loading;
                            },
                        handler:
                            function () {
                                loadEntries();
                            },
                    },
                    {
                        id: "clear-selection",
                        element:
                            clearSelectionButton.element(),
                        label: "",
                        icon:
                            createClearSelectionIcon(),
                        title:
                            "Clear selected log entries",
                        className:
                            "admin-log-viewer-clear-selection",
                        dataTableButton: true,
                        visible:
                            function (context) {
                                return context.selectedCount
                                    > 0;
                            },
                        disabled: false,
                        handler:
                            function (table) {
                                table.clearSelection();
                            },
                    },
                    {
                        id: "selected-count",
                        component: "button",
                        config: {
                            label: "Selected",
                            type: "button",
                            variant: "secondary",
                            size: "medium",
                            disabled: false,
                            loading: false,
                            title:
                                "Show selected log entry count",
                        },
                        label: "Selected",
                        title:
                            "Show selected log entry count",
                        dataTableButton: true,
                        visible:
                            function (context) {
                                return context.selectedCount
                                    > 0;
                            },
                        disabled:
                            function (context) {
                                return context.selectedCount
                                    < 2;
                            },
                        handler:
                            function (table) {
                                showFeedback(
                                    "info",
                                    String(
                                        table.selectedCount()
                                    )
                                    + " log entries selected."
                                );
                            },
                    },
                ],
                bottomControls: [
                    pagination,
                ],
                selectable: true,
                multiSelect: true,
                caption: "",
                emptyMessage:
                    "No log entries are available.",
                dataTableEnabled: true,
                dataTableOptions: {
                    paging: false,
                    searching: false,
                    info: false,
                    ordering: true,
                    order: [],
                    responsive: false,
                    layout: {
                        topStart: null,
                        topEnd: null,
                        bottomStart: null,
                        bottomEnd: null,
                    },
                },
            }
        );

        var results = logTable.element();

        if (!(results instanceof Element)) {
            return;
        }

        results.classList.add(
            "admin-log-viewer-results"
        );

        results.setAttribute(
            "aria-live",
            "polite"
        );

        inspectionElement =
            document.createElement("section");

        inspectionElement.classList.add(
            "admin-log-viewer-inspection"
        );

        inspectionElement.hidden = true;

        inspectionElement.setAttribute(
            "aria-live",
            "polite"
        );

        viewerBody.append(
            feedback,
            results,
            inspectionElement
        );

        viewerCard.appendTo(
            mount
        );

        if (state.channel === "") {
            showFeedback(
                "error",
                "No readable log channels are available."
            );

            renderEmptyState(
                "No log entries are available."
            );

            return;
        }

        loadEntries();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLogViewer,
            { once: true }
        );
    } else {
        initializeLogViewer();
    }
})(globalThis);

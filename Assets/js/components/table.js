(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Table."
        );
    }

    function normalizeColumns(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table columns must be an array."
            );
        }

        return value.map(function (column) {
            if (
                column === null
                || typeof column !== "object"
                || Array.isArray(column)
                || typeof column.key !== "string"
                || column.key === ""
                || typeof column.label !== "string"
            ) {
                throw new TypeError(
                    "Table column configuration is invalid."
                );
            }

            return {
                key: column.key,
                label: column.label,
                sortable:
                    column.sortable !== false,
                searchable:
                    column.searchable !== false,
                className:
                    typeof column.className === "string"
                        ? column.className
                        : "",
                formatter:
                    typeof column.formatter === "function"
                        ? column.formatter
                        : null,
            };
        });
    }

    function normalizeRows(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table rows must be an array."
            );
        }

        return value.map(function (row) {
            if (
                row === null
                || typeof row !== "object"
                || Array.isArray(row)
            ) {
                throw new TypeError(
                    "Table row must be an object."
                );
            }

            return row;
        });
    }

    function partitionRows(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table rows must be an array."
            );
        }

        const rows = [];
        let invalidCount = 0;

        value.forEach(function (row) {
            if (
                row === null
                || typeof row !== "object"
                || Array.isArray(row)
            ) {
                invalidCount += 1;

                return;
            }

            rows.push(row);
        });

        return {
            rows: rows,
            invalidCount: invalidCount,
        };
    }

    function normalizeControls(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table controls must be an array."
            );
        }

        return value.map(function (control) {
            if (control instanceof Element) {
                return {
                    id: "",
                    element: control,
                    component: null,
                    config: {},
                    label: "",
                    icon: "",
                    title: "",
                    className: "",
                    handler: null,
                    visible: true,
                    disabled: false,
                    dataTableButton: false,
                };
            }

            if (
                control === null
                || typeof control !== "object"
                || Array.isArray(control)
                || (
                    !(control.element instanceof Element)
                    && (
                        typeof control.component !== "string"
                        || control.component === ""
                    )
                )
            ) {
                throw new TypeError(
                    "Table control configuration is invalid."
                );
            }

            if (
                control.config !== undefined
                && (
                    control.config === null
                    || typeof control.config !== "object"
                    || Array.isArray(control.config)
                )
            ) {
                throw new TypeError(
                    "Table control config must be an object."
                );
            }

            if (
                control.dataTableButton === true
                && (
                    typeof control.handler !== "function"
                    || (
                        (
                            typeof control.label !== "string"
                            || control.label === ""
                        )
                        && (
                            typeof control.icon !== "string"
                            || control.icon === ""
                        )
                    )
                )
            ) {
                throw new TypeError(
                    "Table DataTables button control is invalid."
                );
            }

            if (
                control.visible !== undefined
                && typeof control.visible !== "boolean"
                && typeof control.visible !== "function"
            ) {
                throw new TypeError(
                    "Table control visible condition must be a boolean or function."
                );
            }

            if (
                control.disabled !== undefined
                && typeof control.disabled !== "boolean"
                && typeof control.disabled !== "function"
            ) {
                throw new TypeError(
                    "Table control disabled condition must be a boolean or function."
                );
            }

            const config =
                control.config === undefined
                    ? {}
                    : control.config;

            return {
                id:
                    typeof control.id === "string"
                        ? control.id
                        : "",
                element:
                    control.element instanceof Element
                        ? control.element
                        : null,
                component:
                    typeof control.component === "string"
                        ? control.component
                        : null,
                config: config,
                label:
                    typeof control.label === "string"
                        ? control.label
                        : (
                            typeof config.label === "string"
                                ? config.label
                                : ""
                        ),
                icon:
                    typeof control.icon === "string"
                        ? control.icon
                        : "",
                title:
                    typeof control.title === "string"
                        ? control.title
                        : (
                            typeof config.title === "string"
                                ? config.title
                                : ""
                        ),
                className:
                    typeof control.className === "string"
                        ? control.className
                        : "",
                handler:
                    typeof control.handler === "function"
                        ? control.handler
                        : null,
                visible:
                    typeof control.visible === "function"
                        || typeof control.visible === "boolean"
                            ? control.visible
                            : true,
                disabled:
                    typeof control.disabled === "function"
                        || typeof control.disabled === "boolean"
                            ? control.disabled
                            : false,
                dataTableButton:
                    control.dataTableButton === true,
            };
        });
    }

    function normalizeActions(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Table actions must be an array."
            );
        }

        return value.map(function (action) {
            if (
                action === null
                || typeof action !== "object"
                || Array.isArray(action)
                || typeof action.id !== "string"
                || action.id === ""
                || typeof action.handler !== "function"
            ) {
                throw new TypeError(
                    "Table action configuration is invalid."
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

            if (label === "" && icon === "") {
                throw new TypeError(
                    "Table action must provide a label or icon."
                );
            }

            return {
                id: action.id,
                label: label,
                icon: icon,
                title:
                    typeof action.title === "string"
                        ? action.title
                        : label,
                className:
                    typeof action.className === "string"
                        ? action.className
                        : "",
                visible:
                    typeof action.visible === "function"
                        || typeof action.visible === "boolean"
                            ? action.visible
                            : true,
                disabled:
                    typeof action.disabled === "function"
                        || typeof action.disabled === "boolean"
                            ? action.disabled
                            : false,
                handler: action.handler,
            };
        });
    }

    function normalizeDataTableOptions(value) {
        if (
            value === null
            || typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Table dataTableOptions must be an object."
            );
        }

        return {
            ...value,
        };
    }

    const DATA_TABLE_DEFAULTS = Object.freeze({
        pageLength: 25,
        lengthMenu: [
            10,
            25,
            50,
            100,
        ],
        responsive: true,
        layout: {
            topStart: "buttons",
            topEnd: "search",
            bottomStart: "info",
            bottomEnd: "paging",
        },
        language: {
            emptyTable:
                "No data available.",
            zeroRecords:
                "No matching records found.",
            info:
                "Showing _START_–_END_ of _TOTAL_",
            infoEmpty:
                "No entries",
            infoFiltered:
                "(filtered from _MAX_)",
            lengthMenu:
                "Show _MENU_",
            search: "",
            searchPlaceholder:
                "Search…",
            paginate: {
                first: "«",
                previous: "‹",
                next: "›",
                last: "»",
            },
        },
    });

    class Table extends global.Component {
        constructor(config) {
            super(config);

            this.handleTableClick =
                this.handleTableClick.bind(
                    this
                );

            this.actionDropdowns = [];
        }

        static defaults() {
            return {
                columns: [],
                rows: [],
                actions: [],
                controls: [],
                bottomControls: [],
                selectable: false,
                multiSelect: false,
                selectedRowClass:
                    "app-table-row-selected",
                onSelectionChange: null,
                caption: "",
                loading: false,
                loadingMessage: "Loading records…",
                invalidRowMessage:
                    "The supplied rows are invalid.",
                emptyMessage: "No records are available.",
                dataTableEnabled: true,
                dataTableOptions: {},
            };
        }

        render() {
            this.dataTableInstance = null;
            this.dataTableDrawHandler = null;
            this.dataTableButtonVisibilityState =
                [];
            this.selectedRowIndexesState =
                new Set();
            this.selectionAnchorIndex = null;
            this.invalidRowCountState = 0;

            const container =
                document.createElement("div");

            container.classList.add(
                "app-table"
            );

            const controls =
                document.createElement("div");

            controls.classList.add(
                "app-table-controls"
            );

            controls.setAttribute(
                "data-table-region",
                "controls"
            );

            const bottomControls =
                document.createElement("div");

            bottomControls.classList.add(
                "app-table-bottom-controls"
            );

            bottomControls.setAttribute(
                "data-table-region",
                "bottom-controls"
            );

            const scroll =
                document.createElement("div");

            scroll.classList.add(
                "app-table-scroll"
            );

            const table =
                document.createElement("table");

            table.classList.add(
                "app-table-element"
            );

            table.setAttribute(
                "data-table-region",
                "table"
            );

            const caption =
                document.createElement("caption");

            caption.setAttribute(
                "data-table-region",
                "caption"
            );

            const head =
                document.createElement("thead");

            head.setAttribute(
                "data-table-region",
                "head"
            );

            const body =
                document.createElement("tbody");

            body.setAttribute(
                "data-table-region",
                "body"
            );

            table.append(
                caption,
                head,
                body
            );

            scroll.append(table);

            table.addEventListener(
                "click",
                this.handleTableClick
            );

            container.append(
                controls,
                scroll,
                bottomControls
            );

            this.update(container);

            queueMicrotask(() => {
                const element =
                    this.element();

                if (!(element instanceof HTMLDivElement)) {
                    return;
                }

                this.initializeDataTable();
            });

            return container;
        }

        isInteractiveRowTarget(target) {
            if (!(target instanceof Element)) {
                return false;
            }

            return target.closest(
                [
                    "a",
                    "button",
                    "input",
                    "select",
                    "textarea",
                    "summary",
                    "details",
                    '[role="button"]',
                    '[contenteditable="true"]',
                    "[data-table-action]",
                ].join(",")
            ) !== null;
        }

        resolveClickedRowIndex(target) {
            if (!(target instanceof Element)) {
                return null;
            }

            const row =
                target.closest(
                    "[data-table-row-index]"
                );

            if (
                !(row instanceof HTMLTableRowElement)
                || !this.tableElement().contains(
                    row
                )
            ) {
                return null;
            }

            const index =
                Number.parseInt(
                    row.getAttribute(
                        "data-table-row-index"
                    ) ?? "",
                    10
                );

            if (
                !Number.isInteger(index)
                || index < 0
                || index >= this.rows().length
            ) {
                return null;
            }

            return index;
        }

        handleTableClick(event) {
            if (
                this.config(
                    "selectable"
                ) !== true
                || this.isLoading()
                || !(event.target instanceof Element)
                || this.isInteractiveRowTarget(
                    event.target
                )
            ) {
                return;
            }

            const rowIndex =
                this.resolveClickedRowIndex(
                    event.target
                );

            if (rowIndex === null) {
                return;
            }

            const multiSelect =
                this.config(
                    "multiSelect"
                ) === true;

            const toggleRequested =
                multiSelect
                && (
                    event.ctrlKey
                    || event.metaKey
                );

            const rangeRequested =
                multiSelect
                && event.shiftKey
                && Number.isInteger(
                    this.selectionAnchorIndex
                );

            if (rangeRequested) {
                const anchorIndex =
                    this.selectionAnchorIndex;

                this.selectRange(
                    anchorIndex,
                    rowIndex,
                    toggleRequested
                );

                this.selectionAnchorIndex =
                    anchorIndex;

                return;
            }

            if (toggleRequested) {
                this.toggleRow(
                    rowIndex
                );

                if (
                    this.isRowSelected(
                        rowIndex
                    )
                ) {
                    this.selectionAnchorIndex =
                        rowIndex;
                }

                return;
            }

            if (
                this.isRowSelected(
                    rowIndex
                )
                && this.selectedCount() === 1
            ) {
                this.selectionAnchorIndex =
                    rowIndex;

                return;
            }

            this.selectRow(
                rowIndex
            );
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

        beforeDestroy() {
            const element =
                this.element();

            if (!(element instanceof HTMLDivElement)) {
                return;
            }

            const table =
                element.querySelector(
                    '[data-table-region="table"]'
                );

            if (table instanceof HTMLTableElement) {
                table.removeEventListener(
                    "click",
                    this.handleTableClick
                );
            }

            this.destroyActionDropdowns();
            this.destroyDataTable();
        }

        selectedRowIndexes() {
            if (
                !(
                    this.selectedRowIndexesState
                    instanceof Set
                )
            ) {
                return [];
            }

            return Array.from(
                this.selectedRowIndexesState
            ).sort(function (
                left,
                right
            ) {
                return left - right;
            });
        }

        selectedRows() {
            const rows =
                this.rows();

            return this.selectedRowIndexes()
                .filter(function (index) {
                    return index >= 0
                        && index < rows.length;
                })
                .map(function (index) {
                    return rows[index];
                });
        }

        selectedCount() {
            return this.selectedRowIndexes()
                .length;
        }

        isRowSelected(index) {
            if (
                !Number.isInteger(index)
                || index < 0
            ) {
                throw new TypeError(
                    "Table row index must be a non-negative integer."
                );
            }

            return this.selectedRowIndexesState
                instanceof Set
                && this.selectedRowIndexesState.has(
                    index
                );
        }

        selectionContext() {
            return {
                table: this,
                selectedRows:
                    this.selectedRows(),
                selectedRowIndexes:
                    this.selectedRowIndexes(),
                selectedCount:
                    this.selectedCount(),
            };
        }

        conditionContext(
            row = null,
            rowIndex = null
        ) {
            return {
                ...this.selectionContext(),
                row: row,
                rowIndex: rowIndex,
            };
        }

        refreshConditionalElements() {
            this.renderControls();
            this.renderBottomControls();
            this.refreshActionCells();

            if (
                this.hasDataTableButtonVisibilityChanged()
            ) {
                this.destroyDataTable();
                this.initializeDataTable();

                return this;
            }

            this.syncDataTableButtonConditions();

            return this;
        }

        notifySelectionChange() {
            this.refreshConditionalElements();

            const callback =
                this.config(
                    "onSelectionChange"
                );

            if (typeof callback === "function") {
                callback(
                    this.selectionContext()
                );
            }

            return this;
        }

        syncSelectedRowClasses() {
            const body =
                this.bodyElement();

            const selectedRowClass =
                this.config(
                    "selectedRowClass"
                );

            body.querySelectorAll(
                "[data-table-row-index]"
            ).forEach((rowElement) => {
                const index =
                    Number.parseInt(
                        rowElement.getAttribute(
                            "data-table-row-index"
                        ) ?? "",
                        10
                    );

                rowElement.classList.toggle(
                    selectedRowClass,
                    Number.isInteger(index)
                        && this.isRowSelected(index)
                );

                rowElement.setAttribute(
                    "aria-selected",
                    Number.isInteger(index)
                        && this.isRowSelected(index)
                            ? "true"
                            : "false"
                );
            });

            return this;
        }

        clearSelection() {
            if (
                !(
                    this.selectedRowIndexesState
                    instanceof Set
                )
                || this.selectedRowIndexesState.size === 0
            ) {
                this.selectionAnchorIndex = null;

                return this;
            }

            this.selectedRowIndexesState.clear();
            this.selectionAnchorIndex = null;

            this.syncSelectedRowClasses();
            this.notifySelectionChange();

            return this;
        }

        selectRow(
            index,
            additive = false
        ) {
            if (
                !Number.isInteger(index)
                || index < 0
                || index >= this.rows().length
            ) {
                throw new TypeError(
                    "Table selected row index is invalid."
                );
            }

            if (
                typeof additive !== "boolean"
            ) {
                throw new TypeError(
                    "Table additive selection flag must be a boolean."
                );
            }

            if (
                !(
                    this.selectedRowIndexesState
                    instanceof Set
                )
            ) {
                this.selectedRowIndexesState =
                    new Set();
            }

            if (!additive) {
                this.selectedRowIndexesState.clear();
            }

            this.selectedRowIndexesState.add(
                index
            );

            this.selectionAnchorIndex =
                index;

            this.syncSelectedRowClasses();
            this.notifySelectionChange();

            return this;
        }

        deselectRow(index) {
            if (
                !Number.isInteger(index)
                || index < 0
            ) {
                throw new TypeError(
                    "Table row index must be a non-negative integer."
                );
            }

            if (
                !(
                    this.selectedRowIndexesState
                    instanceof Set
                )
                || !this.selectedRowIndexesState.has(
                    index
                )
            ) {
                return this;
            }

            this.selectedRowIndexesState.delete(
                index
            );

            if (
                this.selectionAnchorIndex
                === index
            ) {
                this.selectionAnchorIndex =
                    null;
            }

            this.syncSelectedRowClasses();
            this.notifySelectionChange();

            return this;
        }

        toggleRow(index) {
            if (this.isRowSelected(index)) {
                return this.deselectRow(
                    index
                );
            }

            return this.selectRow(
                index,
                true
            );
        }

        selectRange(
            startIndex,
            endIndex,
            additive = false
        ) {
            if (
                !Number.isInteger(startIndex)
                || !Number.isInteger(endIndex)
                || startIndex < 0
                || endIndex < 0
                || startIndex >= this.rows().length
                || endIndex >= this.rows().length
            ) {
                throw new TypeError(
                    "Table selection range is invalid."
                );
            }

            if (
                typeof additive !== "boolean"
            ) {
                throw new TypeError(
                    "Table additive selection flag must be a boolean."
                );
            }

            if (
                !(
                    this.selectedRowIndexesState
                    instanceof Set
                )
            ) {
                this.selectedRowIndexesState =
                    new Set();
            }

            if (!additive) {
                this.selectedRowIndexesState.clear();
            }

            const first =
                Math.min(
                    startIndex,
                    endIndex
                );

            const last =
                Math.max(
                    startIndex,
                    endIndex
                );

            for (
                let index = first;
                index <= last;
                index += 1
            ) {
                this.selectedRowIndexesState.add(
                    index
                );
            }

            this.selectionAnchorIndex =
                startIndex;

            this.syncSelectedRowClasses();
            this.notifySelectionChange();

            return this;
        }

        columns(value) {
            if (arguments.length === 0) {
                return this.config(
                    "columns"
                );
            }

            this.destroyDataTable();

            this.config(
                "columns",
                normalizeColumns(value)
            );

            this.renderHeader();
            this.renderBody();
            this.initializeDataTable();

            return this;
        }

        rows(value) {
            if (arguments.length === 0) {
                return this.config(
                    "rows"
                );
            }

            this.destroyDataTable();
            this.clearSelection();

            const partition =
                partitionRows(value);

            this.invalidRowCountState =
                partition.invalidCount;

            this.config(
                "rows",
                partition.rows
            );

            this.renderBody();
            this.initializeDataTable();

            return this;
        }

        actions(value) {
            if (arguments.length === 0) {
                return this.config(
                    "actions"
                );
            }

            this.destroyDataTable();

            this.config(
                "actions",
                normalizeActions(value)
            );

            this.renderHeader();
            this.renderBody();
            this.initializeDataTable();

            return this;
        }

        addAction(action) {
            const normalizedActions =
                normalizeActions([
                    action,
                ]);

            return this.actions([
                ...this.actions(),
                normalizedActions[0],
            ]);
        }

        clearActions() {
            return this.actions([]);
        }

        controls(value) {
            if (arguments.length === 0) {
                return this.config(
                    "controls"
                );
            }

            this.destroyDataTable();

            this.config(
                "controls",
                normalizeControls(value)
            );

            this.renderControls();
            this.initializeDataTable();

            return this;
        }

        bottomControls(value) {
            if (arguments.length === 0) {
                return this.config(
                    "bottomControls"
                );
            }

            this.config(
                "bottomControls",
                normalizeControls(value)
            );

            this.renderBottomControls();

            return this;
        }

        addBottomControl(control) {
            const normalizedControls =
                normalizeControls([
                    control,
                ]);

            return this.bottomControls([
                ...this.bottomControls(),
                normalizedControls[0],
            ]);
        }

        clearBottomControls() {
            return this.bottomControls([]);
        }

        addControl(control) {
            const normalizedControls =
                normalizeControls([
                    control,
                ]);

            return this.controls([
                ...this.controls(),
                normalizedControls[0],
            ]);
        }

        clearControls() {
            return this.controls([]);
        }

        isLoading() {
            return this.config(
                "loading"
            ) === true;
        }

        setLoading(
            loading,
            message = null
        ) {
            if (typeof loading !== "boolean") {
                throw new TypeError(
                    "Table loading state must be a boolean."
                );
            }

            if (
                message !== null
                && typeof message !== "string"
            ) {
                throw new TypeError(
                    "Table loading message must be a string or null."
                );
            }

            this.destroyDataTable();

            this.config(
                "loading",
                loading
            );

            const element =
                this.element();

            if (element instanceof HTMLDivElement) {
                element.classList.toggle(
                    "app-table-is-loading",
                    loading
                );

                element.setAttribute(
                    "aria-busy",
                    loading
                        ? "true"
                        : "false"
                );
            }

            if (message !== null) {
                this.config(
                    "loadingMessage",
                    message
                );
            }

            this.renderBody();
            this.initializeDataTable();

            return this;
        }

        showLoading(message = null) {
            return this.setLoading(
                true,
                message
            );
        }

        hideLoading() {
            return this.setLoading(
                false
            );
        }

        setRows(rows) {
            return this.rows(
                rows
            );
        }

        clearRows() {
            return this.rows([]);
        }

        addRow(row) {
            const normalizedRows =
                normalizeRows([row]);

            const rows = [
                ...this.rows(),
                normalizedRows[0],
            ];

            return this.rows(
                rows
            );
        }

        removeRow(index) {
            if (
                !Number.isInteger(index)
                || index < 0
            ) {
                throw new TypeError(
                    "Table row index must be a non-negative integer."
                );
            }

            const rows = [
                ...this.rows(),
            ];

            if (index >= rows.length) {
                return this;
            }

            rows.splice(
                index,
                1
            );

            return this.rows(
                rows
            );
        }

        isDataTableAvailable() {
            if (typeof global.DataTable === "function") {
                return true;
            }

            return typeof global.jQuery === "function"
                && global.jQuery.fn !== undefined
                && typeof global.jQuery.fn.DataTable === "function";
        }

        isDataTableButtonsAvailable() {
            if (
                typeof global.DataTable === "function"
                && typeof global.DataTable.Buttons === "function"
            ) {
                return true;
            }

            return typeof global.jQuery === "function"
                && global.jQuery.fn !== undefined
                && global.jQuery.fn.dataTable !== undefined
                && typeof global.jQuery.fn.dataTable.Buttons === "function";
        }

        bindDataTableDrawHandler() {
            const table =
                this.tableElement();

            if (
                typeof this.dataTableDrawHandler
                === "function"
            ) {
                table.removeEventListener(
                    "draw.dt",
                    this.dataTableDrawHandler
                );
            }

            this.dataTableDrawHandler =
                () => {
                    this.syncSelectedRowClasses();
                };

            table.addEventListener(
                "draw.dt",
                this.dataTableDrawHandler
            );

            return this;
        }

        dataTable() {
            return this.dataTableInstance
                ?? null;
        }

        destroyDataTable() {
            const instance =
                this.dataTable();

            const table =
                this.element()
                instanceof HTMLDivElement
                    ? this.tableElement()
                    : null;

            if (
                table instanceof HTMLTableElement
                && typeof this.dataTableDrawHandler
                    === "function"
            ) {
                table.removeEventListener(
                    "draw.dt",
                    this.dataTableDrawHandler
                );
            }

            this.dataTableDrawHandler = null;
            this.dataTableButtonVisibilityState =
                [];

            if (
                instance !== null
                && typeof instance.destroy === "function"
            ) {
                instance.destroy();
            }

            this.dataTableInstance = null;

            return this;
        }

        dataTableButtonControls() {
            if (!this.isDataTableButtonsAvailable()) {
                return [];
            }

            return this.controls().filter((control) => {
                return control.dataTableButton === true
                    && typeof control.handler === "function"
                    && this.isControlVisible(
                        control
                    );
            });
        }

        dataTableButtonVisibility() {
            return this.controls()
                .filter(function (control) {
                    return control.dataTableButton
                        === true
                        && typeof control.handler
                            === "function";
                })
                .map((control) =>
                    this.isControlVisible(
                        control
                    )
                );
        }

        hasDataTableButtonVisibilityChanged() {
            if (
                !this.isDataTableButtonsAvailable()
                || this.dataTable() === null
            ) {
                return false;
            }

            const visibility =
                this.dataTableButtonVisibility();

            const previousVisibility =
                Array.isArray(
                    this.dataTableButtonVisibilityState
                )
                    ? this.dataTableButtonVisibilityState
                    : [];

            if (
                visibility.length
                !== previousVisibility.length
            ) {
                return true;
            }

            return visibility.some(
                function (
                    visible,
                    index
                ) {
                    return visible
                        !== previousVisibility[index];
                }
            );
        }


        createDataTableButtonText(control) {
            const content =
                document.createElement("span");

            content.classList.add(
                "app-table-control-content"
            );

            const icon =
                this.createActionIcon(
                    control.icon
                );

            if (icon instanceof SVGElement) {
                content.append(icon);
            }

            if (control.label !== "") {
                const label =
                    document.createElement("span");

                label.textContent =
                    control.label;

                content.append(label);
            }

            return content.innerHTML;
        }

        dataTableButtonApi(
            controlIndex
        ) {
            if (
                !Number.isInteger(
                    controlIndex
                )
                || controlIndex < 0
            ) {
                throw new TypeError(
                    "Table DataTables button index must be a non-negative integer."
                );
            }

            const dataTable =
                this.dataTable();

            if (
                dataTable === null
                || typeof dataTable.button
                    !== "function"
            ) {
                return null;
            }

            try {
                return dataTable.button(
                    controlIndex
                );
            } catch (_error) {
                return null;
            }
        }

        buildDataTableButtons() {
            return this.dataTableButtonControls().map((control) => {
                return {
                    name:
                        control.id !== ""
                            ? control.id
                            : undefined,
                    text:
                        this.createDataTableButtonText(
                            control
                        ),
                    titleAttr:
                        control.title,
                    className:
                        control.className,
                    enabled:
                        !this.isControlDisabled(
                            control
                        ),
                    action: (
                        event,
                        dataTable
                    ) => {
                        if (
                            this.isControlDisabled(
                                control
                            )
                        ) {
                            return;
                        }

                        control.handler(
                            this,
                            event,
                            dataTable
                        );
                    },
                };
            });
        }

        syncDataTableButtonConditions() {
            if (
                !this.isDataTableButtonsAvailable()
                || this.dataTable() === null
            ) {
                return this;
            }

            const controls =
                this.dataTableButtonControls();

            controls.forEach(
                (control, index) => {
                    const button =
                        this.dataTableButtonApi(
                            index
                        );

                    if (button === null) {
                        return;
                    }

                    const disabled =
                        this.isControlDisabled(
                            control
                        );

                    if (
                        disabled
                        && typeof button.disable
                            === "function"
                    ) {
                        button.disable();

                        return;
                    }

                    if (
                        !disabled
                        && typeof button.enable
                            === "function"
                    ) {
                        button.enable();
                    }
                }
            );

            return this;
        }

        buildDataTableOptions() {
            const configuredOptions =
                normalizeDataTableOptions(
                    this.config(
                        "dataTableOptions"
                    )
                );

            const resolvedOptions = {
                ...DATA_TABLE_DEFAULTS,
                ...configuredOptions,
                layout: {
                    ...DATA_TABLE_DEFAULTS.layout,
                    ...(
                        configuredOptions.layout !== null
                        && typeof configuredOptions.layout === "object"
                        && !Array.isArray(
                            configuredOptions.layout
                        )
                            ? configuredOptions.layout
                            : {}
                    ),
                },
                language: {
                    ...DATA_TABLE_DEFAULTS.language,
                    ...(
                        configuredOptions.language !== null
                        && typeof configuredOptions.language === "object"
                        && !Array.isArray(
                            configuredOptions.language
                        )
                            ? configuredOptions.language
                            : {}
                    ),
                },
            };

            const columnDefinitions =
                this.columns().map(function (
                    column,
                    index
                ) {
                    return {
                        targets: index,
                        orderable:
                            column.sortable,
                        searchable:
                            column.searchable,
                    };
                });

            if (this.actions().length > 0) {
                columnDefinitions.push({
                    targets: this.columns().length,
                    orderable: false,
                    searchable: false,
                });
            }

            const buttons =
                this.buildDataTableButtons();

            const configuredLayout = {
                ...resolvedOptions.layout,
            };

            if (buttons.length === 0) {
                configuredLayout.topStart = null;
            }

            const configuredLanguage =
                resolvedOptions.language;

            return {
                ...DATA_TABLE_DEFAULTS,
                ...resolvedOptions,
                layout: {
                    ...(
                        DATA_TABLE_DEFAULTS.layout !== null
                        && typeof DATA_TABLE_DEFAULTS.layout === "object"
                        && !Array.isArray(
                            DATA_TABLE_DEFAULTS.layout
                        )
                            ? DATA_TABLE_DEFAULTS.layout
                            : {}
                    ),
                    ...configuredLayout,
                    ...(
                        buttons.length > 0
                            ? {
                                topStart: {
                                    buttons: buttons,
                                },
                            }
                            : {}
                    ),
                },
                language: {
                    ...(
                        DATA_TABLE_DEFAULTS.language !== null
                        && typeof DATA_TABLE_DEFAULTS.language === "object"
                        && !Array.isArray(
                            DATA_TABLE_DEFAULTS.language
                        )
                            ? DATA_TABLE_DEFAULTS.language
                            : {}
                    ),
                    emptyTable:
                        this.config(
                            "emptyMessage"
                        ),
                    ...configuredLanguage,
                },
                columnDefs: [
                    ...(
                        Array.isArray(
                            configuredOptions.columnDefs
                        )
                            ? configuredOptions.columnDefs
                            : []
                    ),
                    ...columnDefinitions,
                ],
            };
        }

        initializeDataTable() {
            if (
                this.config(
                    "dataTableEnabled"
                ) !== true
                || this.config(
                    "loading"
                ) === true
                || (
                    this.rows().length === 0
                    && Number.isInteger(
                        this.invalidRowCountState
                    )
                    && this.invalidRowCountState > 0
                )
                || !this.isDataTableAvailable()
                || this.columns().length === 0
            ) {
                return this;
            }

            if (this.dataTable() !== null) {
                return this;
            }

            const table =
                this.tableElement();

            const options =
                this.buildDataTableOptions();

            if (typeof global.DataTable === "function") {
                try {
                    this.dataTableInstance =
                        new global.DataTable(
                            table,
                            options
                        );

                    this.dataTableButtonVisibilityState =
                        this.dataTableButtonVisibility();

                    this.bindDataTableDrawHandler();
                    this.syncSelectedRowClasses();
                    this.syncDataTableButtonConditions();
                } catch (_error) {
                    this.dataTableInstance = null;
                }

                return this;
            }

            try {
                this.dataTableInstance =
                    global.jQuery(
                        table
                    ).DataTable(
                        options
                    );

                this.dataTableButtonVisibilityState =
                    this.dataTableButtonVisibility();

                this.bindDataTableDrawHandler();
                this.syncSelectedRowClasses();
                this.syncDataTableButtonConditions();
            } catch (_error) {
                this.dataTableInstance = null;
            }

            return this;
        }

        tableElement() {
            const element = this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Table must be rendered before resolving its table element."
                );
            }

            const table = element.querySelector(
                '[data-table-region="table"]'
            );

            if (!(table instanceof HTMLTableElement)) {
                throw new Error(
                    "Table element region is invalid."
                );
            }

            return table;
        }

        headElement() {
            const head = this.tableElement().querySelector(
                '[data-table-region="head"]'
            );

            if (!(head instanceof HTMLTableSectionElement)) {
                throw new Error(
                    "Table head region is invalid."
                );
            }

            return head;
        }

        bodyElement() {
            const body = this.tableElement().querySelector(
                '[data-table-region="body"]'
            );

            if (!(body instanceof HTMLTableSectionElement)) {
                throw new Error(
                    "Table body region is invalid."
                );
            }

            return body;
        }

        controlsElement() {
            const element = this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Table must be rendered before resolving its controls."
                );
            }

            const controls = element.querySelector(
                '[data-table-region="controls"]'
            );

            if (!(controls instanceof HTMLDivElement)) {
                throw new Error(
                    "Table controls region is invalid."
                );
            }

            return controls;
        }

        bottomControlsElement() {
            const element =
                this.element();

            if (!(element instanceof HTMLDivElement)) {
                throw new Error(
                    "Table must be rendered before resolving its bottom controls."
                );
            }

            const bottomControls =
                element.querySelector(
                    '[data-table-region="bottom-controls"]'
                );

            if (!(bottomControls instanceof HTMLDivElement)) {
                throw new Error(
                    "Table bottom controls region is invalid."
                );
            }

            return bottomControls;
        }

        captionElement() {
            const caption = this.tableElement().querySelector(
                '[data-table-region="caption"]'
            );

            if (!(caption instanceof HTMLTableCaptionElement)) {
                throw new Error(
                    "Table caption region is invalid."
                );
            }

            return caption;
        }

        isControlVisible(control) {
            if (typeof control.visible === "function") {
                return control.visible(
                    this.selectionContext()
                ) === true;
            }

            return control.visible !== false;
        }

        isControlDisabled(control) {
            if (typeof control.disabled === "function") {
                return control.disabled(
                    this.selectionContext()
                ) === true;
            }

            return control.disabled === true;
        }

        applyControlDisabledState(
            element,
            disabled
        ) {
            if (!(element instanceof Element)) {
                throw new TypeError(
                    "Table control disabled state requires an Element."
                );
            }

            if (
                element instanceof HTMLButtonElement
                || element instanceof HTMLInputElement
                || element instanceof HTMLSelectElement
                || element instanceof HTMLTextAreaElement
            ) {
                element.disabled =
                    disabled === true;
            } else {
                element.setAttribute(
                    "aria-disabled",
                    disabled === true
                        ? "true"
                        : "false"
                );

                element.classList.toggle(
                    "app-table-control-disabled",
                    disabled === true
                );
            }

            return element;
        }

        createControlElement(control) {
            if (control.element instanceof Element) {
                return this.applyControlDisabledState(
                    control.element,
                    this.isControlDisabled(
                        control
                    )
                );
            }

            if (
                typeof control.component !== "string"
                || control.component === ""
            ) {
                throw new Error(
                    "Table control component is invalid."
                );
            }

            if (!global.Builder.has(control.component)) {
                throw new Error(
                    "Table control component is unavailable: "
                    + control.component
                );
            }

            const component =
                global.Builder.create(
                    control.component,
                    control.config
                );

            const element =
                component.element();

            if (!(element instanceof Element)) {
                throw new Error(
                    "Table control did not render an element."
                );
            }

            return this.applyControlDisabledState(
                element,
                this.isControlDisabled(
                    control
                )
            );
        }

        renderControls(element = null) {
            const controlsElement =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-table-region="controls"]'
                    )
                    : this.controlsElement();

            if (!(controlsElement instanceof HTMLDivElement)) {
                throw new Error(
                    "Table controls region is invalid."
                );
            }

            const buttonsAvailable =
                this.isDataTableButtonsAvailable();

            const controlElements =
                this.controls()
                    .filter((control) => {
                        return (
                            !buttonsAvailable
                            || control.dataTableButton !== true
                        )
                            && this.isControlVisible(
                                control
                            );
                    })
                    .map((control) =>
                        this.createControlElement(
                            control
                        )
                    );

            controlsElement.replaceChildren(
                ...controlElements
            );

            return this;
        }

        renderBottomControls(element = null) {
            const bottomControlsElement =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-table-region="bottom-controls"]'
                    )
                    : this.bottomControlsElement();

            if (
                !(
                    bottomControlsElement
                    instanceof HTMLDivElement
                )
            ) {
                throw new Error(
                    "Table bottom controls region is invalid."
                );
            }

            const controlElements =
                this.bottomControls()
                    .filter((control) =>
                        this.isControlVisible(
                            control
                        )
                    )
                    .map((control) =>
                        this.createControlElement(
                            control
                        )
                    );

            bottomControlsElement.replaceChildren(
                ...controlElements
            );

            return this;
        }

        renderHeader(element = null) {
            const head =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-table-region="head"]'
                    )
                    : this.headElement();

            if (!(head instanceof HTMLTableSectionElement)) {
                throw new Error(
                    "Table head region is invalid."
                );
            }

            const row =
                document.createElement("tr");

            this.columns().forEach(function (column) {
                const cell =
                    document.createElement("th");

                cell.scope = "col";
                cell.textContent =
                    column.label;

                if (column.className !== "") {
                    cell.classList.add(
                        column.className
                    );
                }

                cell.setAttribute(
                    "data-table-column",
                    column.key
                );

                row.append(cell);
            });

            if (this.actions().length > 0) {
                const actionCell =
                    document.createElement("th");

                actionCell.scope = "col";
                actionCell.classList.add(
                    "app-table-actions-heading"
                );

                actionCell.setAttribute(
                    "data-table-column",
                    "actions"
                );

                actionCell.setAttribute(
                    "aria-label",
                    "Actions"
                );

                row.append(actionCell);
            }

            head.replaceChildren(row);

            return this;
        }

        createCell(
            row,
            column,
            rowIndex
        ) {
            const cell =
                document.createElement("td");

            const rawValue =
                Object.prototype.hasOwnProperty.call(
                    row,
                    column.key
                )
                    ? row[column.key]
                    : "";

            const value =
                column.formatter === null
                    ? rawValue
                    : column.formatter(
                        rawValue,
                        row,
                        rowIndex,
                        this
                    );

            if (value instanceof Element) {
                cell.replaceChildren(
                    value
                );
            } else {
                cell.textContent =
                    value === null
                        || value === undefined
                            ? ""
                            : String(value);
            }

            if (column.className !== "") {
                cell.classList.add(
                    column.className
                );
            }

            cell.setAttribute(
                "data-table-column",
                column.key
            );

            return cell;
        }

        isActionVisible(
            action,
            row,
            rowIndex
        ) {
            if (typeof action.visible === "function") {
                return action.visible(
                    row,
                    rowIndex,
                    this,
                    this.conditionContext(
                        row,
                        rowIndex
                    )
                ) === true;
            }

            return action.visible !== false;
        }

        isActionDisabled(
            action,
            row,
            rowIndex
        ) {
            if (typeof action.disabled === "function") {
                return action.disabled(
                    row,
                    rowIndex,
                    this,
                    this.conditionContext(
                        row,
                        rowIndex
                    )
                ) === true;
            }

            return action.disabled === true;
        }

        invokeAction(
            action,
            row,
            rowIndex,
            event
        ) {
            if (
                this.isActionDisabled(
                    action,
                    row,
                    rowIndex
                )
            ) {
                return this;
            }

            action.handler(
                row,
                rowIndex,
                this,
                event
            );

            return this;
        }

        createActionIcon(icon) {
            if (
                typeof icon !== "string"
                || icon === ""
            ) {
                return null;
            }

            const template =
                document.createElement("template");

            template.innerHTML =
                icon.trim();

            const iconElement =
                template.content.firstElementChild;

            if (
                !(iconElement instanceof SVGElement)
                || template.content.childElementCount !== 1
            ) {
                throw new TypeError(
                    "Table action icon must contain exactly one SVG element."
                );
            }

            iconElement.setAttribute(
                "aria-hidden",
                "true"
            );

            return iconElement;
        }

        appendActionContent(
            element,
            action
        ) {
            if (!(element instanceof Element)) {
                throw new TypeError(
                    "Table action content requires an Element."
                );
            }

            const icon =
                this.createActionIcon(
                    action.icon
                );

            if (icon instanceof SVGElement) {
                element.append(icon);
            }

            if (action.label !== "") {
                const label =
                    document.createElement("span");

                label.classList.add(
                    "app-table-action-label"
                );

                label.textContent =
                    action.label;

                element.append(label);
            }

            return this;
        }

        createSingleActionElement(
            action,
            row,
            rowIndex
        ) {
            const button =
                document.createElement("button");

            button.type = "button";

            button.classList.add(
                "app-table-action"
            );

            if (action.className !== "") {
                button.classList.add(
                    action.className
                );
            }

            button.title =
                action.title;

            button.disabled =
                this.isActionDisabled(
                    action,
                    row,
                    rowIndex
                );

            button.setAttribute(
                "data-table-action",
                action.id
            );

            this.appendActionContent(
                button,
                action
            );

            button.addEventListener(
                "click",
                (event) => {
                    this.invokeAction(
                        action,
                        row,
                        rowIndex,
                        event
                    );
                }
            );

            return button;
        }

        createActionsMenuIcon() {
            const namespace =
                "http://www.w3.org/2000/svg";

            const icon =
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

            const path =
                document.createElementNS(
                    namespace,
                    "path"
                );

            path.setAttribute(
                "d",
                "M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
            );

            icon.append(path);

            return icon;
        }

        createMultipleActionsElement(
            actions,
            row,
            rowIndex
        ) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Table multiple actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            [
                                '<svg xmlns="http://www.w3.org/2000/svg"',
                                ' viewBox="0 0 16 16">',
                                '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
                                "</svg>",
                            ].join(""),
                        triggerTitle:
                            "Actions",
                        items:
                            actions.map(
                                (action) => {
                                    return {
                                        label:
                                            action.label,
                                        icon:
                                            action.icon,
                                        disabled:
                                            this.isActionDisabled(
                                                action,
                                                row,
                                                rowIndex
                                            ),
                                        callback:
                                            () => {
                                                this.invokeAction(
                                                    action,
                                                    row,
                                                    rowIndex,
                                                    new CustomEvent(
                                                        "table-action"
                                                    )
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
                    "Table action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-table-action-dropdown"
            );

            this.actionDropdowns.push(
                dropdown
            );

            return element;
        }

        createActionsCell(
            row,
            rowIndex
        ) {
            const cell =
                document.createElement("td");

            cell.classList.add(
                "app-table-actions"
            );

            cell.setAttribute(
                "data-table-column",
                "actions"
            );

            const actions =
                this.actions().filter(
                    (action) =>
                        this.isActionVisible(
                            action,
                            row,
                            rowIndex
                        )
                );

            if (actions.length === 1) {
                cell.append(
                    this.createSingleActionElement(
                        actions[0],
                        row,
                        rowIndex
                    )
                );

                return cell;
            }

            if (actions.length > 1) {
                cell.append(
                    this.createMultipleActionsElement(
                        actions,
                        row,
                        rowIndex
                    )
                );
            }

            return cell;
        }

        refreshActionCells() {
            this.destroyActionDropdowns();

            if (this.actions().length === 0) {
                return this;
            }

            const rows =
                this.rows();

            this.bodyElement()
                .querySelectorAll(
                    "[data-table-row-index]"
                )
                .forEach((rowElement) => {
                    const rowIndex =
                        Number.parseInt(
                            rowElement.getAttribute(
                                "data-table-row-index"
                            ) ?? "",
                            10
                        );

                    if (
                        !Number.isInteger(
                            rowIndex
                        )
                        || rowIndex < 0
                        || rowIndex >= rows.length
                    ) {
                        return;
                    }

                    const currentCell =
                        rowElement.querySelector(
                            '[data-table-column="actions"]'
                        );

                    if (!(currentCell instanceof HTMLTableCellElement)) {
                        return;
                    }

                    currentCell.replaceWith(
                        this.createActionsCell(
                            rows[rowIndex],
                            rowIndex
                        )
                    );
                });

            return this;
        }

        createRowElement(row, rowIndex) {
            const element =
                document.createElement("tr");

            element.setAttribute(
                "data-table-row-index",
                String(rowIndex)
            );

            element.classList.toggle(
                "app-table-row-selectable",
                this.config(
                    "selectable"
                ) === true
            );

            element.setAttribute(
                "aria-selected",
                this.isRowSelected(
                    rowIndex
                )
                    ? "true"
                    : "false"
            );

            element.classList.toggle(
                this.config(
                    "selectedRowClass"
                ),
                this.isRowSelected(
                    rowIndex
                )
            );

            this.columns().forEach((column) => {
                element.append(
                    this.createCell(
                        row,
                        column,
                        rowIndex
                    )
                );
            });

            if (this.actions().length > 0) {
                element.append(
                    this.createActionsCell(
                        row,
                        rowIndex
                    )
                );
            }

            return element;
        }

        renderStateRow(
            body,
            className,
            message
        ) {
            if (
                !(body instanceof HTMLTableSectionElement)
            ) {
                throw new TypeError(
                    "Table state row requires a table body."
                );
            }

            if (
                typeof className !== "string"
                || className === ""
            ) {
                throw new TypeError(
                    "Table state row class must be a non-empty string."
                );
            }

            if (typeof message !== "string") {
                throw new TypeError(
                    "Table state row message must be a string."
                );
            }

            const row =
                document.createElement("tr");

            const cell =
                document.createElement("td");

            cell.classList.add(
                className
            );

            cell.colSpan = Math.max(
                1,
                this.columns().length
                    + (
                        this.actions().length > 0
                            ? 1
                            : 0
                    )
            );

            cell.textContent =
                message;

            row.append(cell);
            body.replaceChildren(row);

            return this;
        }

        usesDataTableEmptyState() {
            return this.config(
                "dataTableEnabled"
            ) === true
                && this.isDataTableAvailable()
                && this.columns().length > 0;
        }

        renderBody(element = null) {
            this.destroyActionDropdowns();

            const body =
                element instanceof HTMLDivElement
                    ? element.querySelector(
                        '[data-table-region="body"]'
                    )
                    : this.bodyElement();

            if (!(body instanceof HTMLTableSectionElement)) {
                throw new Error(
                    "Table body region is invalid."
                );
            }

            const rows = this.rows();

            if (
                this.config(
                    "loading"
                ) === true
            ) {
                return this.renderStateRow(
                    body,
                    "app-table-loading",
                    this.config(
                        "loadingMessage"
                    )
                );
            }

            if (
                rows.length === 0
                && Number.isInteger(
                    this.invalidRowCountState
                )
                && this.invalidRowCountState > 0
            ) {
                return this.renderStateRow(
                    body,
                    "app-table-invalid",
                    this.config(
                        "invalidRowMessage"
                    )
                );
            }

            if (rows.length === 0) {
                if (this.usesDataTableEmptyState()) {
                    body.replaceChildren();

                    return this;
                }

                                return this.renderStateRow(
                    body,
                    "app-table-empty",
                    this.config(
                        "emptyMessage"
                    )
                );

            }

            const rowElements =
                rows.map((row, rowIndex) =>
                    this.createRowElement(
                        row,
                        rowIndex
                    )
                );

            body.replaceChildren(
                ...rowElements
            );

            return this;
        }

        refresh() {
            this.destroyDataTable();
            this.renderHeader();
            this.renderBody();
            this.initializeDataTable();

            return this;
        }

        update(element) {
            if (!(element instanceof HTMLDivElement)) {
                throw new TypeError(
                    "Table update() requires an HTMLDivElement."
                );
            }

            const columns = normalizeColumns(
                this.config("columns")
            );

            const rowPartition =
                partitionRows(
                    this.config("rows")
                );

            const rows =
                rowPartition.rows;

            this.invalidRowCountState =
                rowPartition.invalidCount;

            const controls = normalizeControls(
                this.config("controls")
            );

            const bottomControls =
                normalizeControls(
                    this.config(
                        "bottomControls"
                    )
                );

            const actions = normalizeActions(
                this.config("actions")
            );

            const selectable =
                this.config(
                    "selectable"
                );

            const multiSelect =
                this.config(
                    "multiSelect"
                );

            const selectedRowClass =
                this.config(
                    "selectedRowClass"
                );

            const onSelectionChange =
                this.config(
                    "onSelectionChange"
                );

            const caption =
                this.config("caption");

            const loading =
                this.config("loading");

            const loadingMessage =
                this.config(
                    "loadingMessage"
                );

            const invalidRowMessage =
                this.config(
                    "invalidRowMessage"
                );

            const emptyMessage =
                this.config("emptyMessage");

            const dataTableEnabled =
                this.config(
                    "dataTableEnabled"
                );

            const dataTableOptions =
                normalizeDataTableOptions(
                    this.config(
                        "dataTableOptions"
                    )
                );

            if (typeof selectable !== "boolean") {
                throw new TypeError(
                    "Table selectable must be a boolean."
                );
            }

            if (typeof multiSelect !== "boolean") {
                throw new TypeError(
                    "Table multiSelect must be a boolean."
                );
            }

            if (
                typeof selectedRowClass !== "string"
                || selectedRowClass === ""
            ) {
                throw new TypeError(
                    "Table selectedRowClass must be a non-empty string."
                );
            }

            if (
                onSelectionChange !== null
                && typeof onSelectionChange !== "function"
            ) {
                throw new TypeError(
                    "Table onSelectionChange must be a function or null."
                );
            }

            if (typeof caption !== "string") {
                throw new TypeError(
                    "Table caption must be a string."
                );
            }

            if (typeof loading !== "boolean") {
                throw new TypeError(
                    "Table loading must be a boolean."
                );
            }

            if (typeof loadingMessage !== "string") {
                throw new TypeError(
                    "Table loadingMessage must be a string."
                );
            }

            if (typeof invalidRowMessage !== "string") {
                throw new TypeError(
                    "Table invalidRowMessage must be a string."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "Table emptyMessage must be a string."
                );
            }

            if (typeof dataTableEnabled !== "boolean") {
                throw new TypeError(
                    "Table dataTableEnabled must be a boolean."
                );
            }

            this.config(
                "columns",
                columns
            );

            this.config(
                "rows",
                rows
            );

            this.config(
                "controls",
                controls
            );

            this.config(
                "bottomControls",
                bottomControls
            );

            this.config(
                "actions",
                actions
            );

            this.config(
                "selectable",
                selectable
            );

            this.config(
                "multiSelect",
                multiSelect
            );

            this.config(
                "selectedRowClass",
                selectedRowClass
            );

            this.config(
                "onSelectionChange",
                onSelectionChange
            );

            this.config(
                "loading",
                loading
            );

            this.config(
                "loadingMessage",
                loadingMessage
            );

            this.config(
                "invalidRowMessage",
                invalidRowMessage
            );

            this.config(
                "dataTableEnabled",
                dataTableEnabled
            );

            this.config(
                "dataTableOptions",
                dataTableOptions
            );

            const captionElement =
                element.querySelector(
                    '[data-table-region="caption"]'
                );

            if (
                !(
                    captionElement
                    instanceof
                    HTMLTableCaptionElement
                )
            ) {
                throw new Error(
                    "Table caption region is invalid."
                );
            }

            captionElement.textContent =
                caption;

            captionElement.hidden =
                caption === "";

            element.classList.toggle(
                "app-table-is-loading",
                loading
            );

            element.setAttribute(
                "aria-busy",
                loading
                    ? "true"
                    : "false"
            );

            this.renderControls(element);
            this.renderHeader(element);
            this.renderBody(element);
            this.renderBottomControls(element);

            return this;
        }
    }

    global.Builder.register(
        "table",
        Table,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Tabs."
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

    function normalizeTabs(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Tabs tabs must be an array."
            );
        }

        const ids =
            new Set();

        return value.map(function (tab) {
            if (
                tab === null
                || typeof tab !== "object"
                || Array.isArray(tab)
                || typeof tab.id !== "string"
                || tab.id === ""
                || typeof tab.label !== "string"
                || tab.label === ""
            ) {
                throw new TypeError(
                    "Tabs tab configuration is invalid."
                );
            }

            if (ids.has(tab.id)) {
                throw new TypeError(
                    "Tabs tab ids must be unique."
                );
            }

            ids.add(
                tab.id
            );

            const panelActions =
                tab.panelActions === undefined
                    ? []
                    : tab.panelActions;

            if (!Array.isArray(panelActions)) {
                throw new TypeError(
                    "Tabs panelActions must be an array."
                );
            }

            return {
                id:
                    tab.id,
                label:
                    tab.label,
                icon:
                    typeof tab.icon === "string"
                        ? tab.icon
                        : "",
                content:
                    typeof tab.content === "string"
                    || tab.content instanceof Element
                        ? tab.content
                        : "",
                panelActions:
                    panelActions.slice(),
                disabled:
                    tab.disabled === true,
            };
        });
    }

    const TABS_ICONS = Object.freeze({
        move: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>',
            "</svg>",
        ].join(""),
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
    });

    const PRESENTATIONS = Object.freeze([
        "tabs",
        "pills",
    ]);

    let nextTabsInstanceId =
        0;

    class Tabs extends global.Component {
        constructor(config) {
            super(config);

            this.handleClick =
                this.handleClick.bind(this);

            this.handleKeyDown =
                this.handleKeyDown.bind(this);

            this.instanceId =
                nextTabsInstanceId++;

            this.actionDropdown =
                null;

            this.panelActionDropdowns =
                [];

            this.sortable =
                null;

            this.handleSortEnd =
                this.handleSortEnd.bind(
                    this
                );
        }


        isSortableAvailable() {
            return (
                global.Sortable !== null
                && (
                    typeof global.Sortable === "function"
                    || typeof global.Sortable === "object"
                )
                && typeof global.Sortable.create
                    === "function"
            );
        }

        destroySortable() {
            if (
                this.sortable !== null
                && typeof this.sortable.destroy
                    === "function"
            ) {
                this.sortable.destroy();
            }

            this.sortable =
                null;

            return this;
        }


        enabledTabButtons() {
            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return [];
            }

            return Array.from(
                element.querySelectorAll(
                    '[role="tab"]:not(:disabled)'
                )
            ).filter(
                function (tab) {
                    return tab
                        instanceof HTMLButtonElement;
                }
            );
        }

        handleKeyDown(event) {
            if (
                !(event.target instanceof HTMLButtonElement)
                || event.target.getAttribute("role")
                    !== "tab"
            ) {
                return;
            }

            const tabs =
                this.enabledTabButtons();

            if (tabs.length === 0) {
                return;
            }

            const currentIndex =
                tabs.indexOf(
                    event.target
                );

            if (currentIndex < 0) {
                return;
            }

            let nextIndex =
                null;

            if (event.key === "ArrowRight") {
                nextIndex =
                    (
                        currentIndex + 1
                    ) % tabs.length;
            }

            if (event.key === "ArrowLeft") {
                nextIndex =
                    (
                        currentIndex
                        - 1
                        + tabs.length
                    ) % tabs.length;
            }

            if (event.key === "Home") {
                nextIndex =
                    0;
            }

            if (event.key === "End") {
                nextIndex =
                    tabs.length - 1;
            }

            if (nextIndex === null) {
                return;
            }

            event.preventDefault();

            const next =
                tabs[nextIndex];

            next.focus();

            const tabId =
                next.getAttribute(
                    "data-tabs-tab"
                );

            if (
                typeof tabId === "string"
                && tabId !== ""
            ) {
                this.select(
                    tabId
                );
            }
        }

        handleSortEnd(event) {
            if (
                this.config(
                    "sortableEnabled"
                ) !== true
                || event === null
                || typeof event !== "object"
                || !(event.to instanceof HTMLElement)
            ) {
                return;
            }

            const orderedIds =
                Array.from(
                    event.to.querySelectorAll(
                        "[data-tabs-tab]"
                    )
                ).map(
                    function (button) {
                        return button.getAttribute(
                            "data-tabs-tab"
                        );
                    }
                ).filter(
                    function (tabId) {
                        return (
                            typeof tabId === "string"
                            && tabId !== ""
                        );
                    }
                );

            const tabs =
                normalizeTabs(
                    this.config(
                        "tabs"
                    )
                );

            const currentIds =
                tabs.map(
                    function (tab) {
                        return tab.id;
                    }
                );

            if (
                orderedIds.length
                !== tabs.length
            ) {
                this.refresh();

                return;
            }

            const orderChanged =
                orderedIds.some(
                    function (tabId, index) {
                        return tabId
                            !== currentIds[index];
                    }
                );

            if (!orderChanged) {
                return;
            }

            const tabsById =
                new Map(
                    tabs.map(
                        function (tab) {
                            return [
                                tab.id,
                                tab,
                            ];
                        }
                    )
                );

            const reorderedTabs =
                orderedIds.map(
                    function (tabId) {
                        return tabsById.get(
                            tabId
                        );
                    }
                );

            if (
                reorderedTabs.some(
                    function (tab) {
                        return tab === undefined;
                    }
                )
            ) {
                this.refresh();

                return;
            }

            this.config(
                "tabs",
                reorderedTabs
            );

            const onReorder =
                this.config(
                    "onReorder"
                );

            if (
                onReorder !== null
                && typeof onReorder !== "function"
            ) {
                throw new TypeError(
                    "Tabs onReorder must be a function or null."
                );
            }

            if (typeof onReorder === "function") {
                onReorder(
                    reorderedTabs,
                    this
                );
            }

            this.refresh();
        }

        handleClick(event) {
            if (!(event.target instanceof Element)) {
                return;
            }

            const tab =
                event.target.closest(
                    "[data-tabs-tab]"
                );

            if (
                !(tab instanceof HTMLButtonElement)
                || !this.element()?.contains(tab)
                || tab.disabled
            ) {
                return;
            }

            const tabId =
                tab.getAttribute(
                    "data-tabs-tab"
                );

            if (
                typeof tabId !== "string"
                || tabId === ""
            ) {
                return;
            }

            this.select(
                tabId
            );
        }

        enableSortable() {
            this.config(
                "sortableEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableSortable() {
            this.config(
                "sortableEnabled",
                false
            );

            this.destroySortable();
            this.refresh();

            return this;
        }

        toggleSortable() {
            return this.config(
                "sortableEnabled"
            ) === true
                ? this.disableSortable()
                : this.enableSortable();
        }

        setPresentation(presentation) {
            if (
                typeof presentation !== "string"
                || !PRESENTATIONS.includes(
                    presentation
                )
            ) {
                throw new TypeError(
                    "Tabs presentation must be tabs or pills."
                );
            }

            this.config(
                "presentation",
                presentation
            );

            this.refresh();

            return this;
        }

        removeTab(tabId) {
            if (
                typeof tabId !== "string"
                || tabId === ""
            ) {
                throw new TypeError(
                    "Tabs tab id must be a non-empty string."
                );
            }

            const tabs =
                normalizeTabs(
                    this.config("tabs")
                );

            const filtered =
                tabs.filter(
                    function (tab) {
                        return tab.id !== tabId;
                    }
                );

            if (
                filtered.length
                === tabs.length
            ) {
                return this;
            }

            this.config(
                "tabs",
                filtered
            );

            this.refresh();

            return this;
        }

        addTab(tab) {
            const normalized =
                normalizeTabs([
                    tab,
                ])[0];

            const tabs =
                normalizeTabs(
                    this.config("tabs")
                );

            if (
                tabs.some(
                    function (entry) {
                        return entry.id
                            === normalized.id;
                    }
                )
            ) {
                throw new TypeError(
                    "Tabs tab ids must be unique."
                );
            }

            this.config(
                "tabs",
                [
                    ...tabs,
                    normalized,
                ]
            );

            this.refresh();

            return this;
        }

        setTabDisabled(
            tabId,
            disabled
        ) {
            if (
                typeof tabId !== "string"
                || tabId === ""
            ) {
                throw new TypeError(
                    "Tabs tab id must be a non-empty string."
                );
            }

            if (typeof disabled !== "boolean") {
                throw new TypeError(
                    "Tabs disabled state must be a boolean."
                );
            }

            const tabs =
                normalizeTabs(
                    this.config("tabs")
                );

            const index =
                tabs.findIndex(
                    function (tab) {
                        return tab.id === tabId;
                    }
                );

            if (index < 0) {
                return this;
            }

            tabs[index] = {
                ...tabs[index],
                disabled: disabled,
            };

            this.config(
                "tabs",
                tabs
            );

            this.refresh();

            return this;
        }

        enableTab(tabId) {
            return this.setTabDisabled(
                tabId,
                false
            );
        }

        disableTab(tabId) {
            return this.setTabDisabled(
                tabId,
                true
            );
        }

        select(tabId) {
            if (
                typeof tabId !== "string"
                || tabId === ""
            ) {
                throw new TypeError(
                    "Tabs tab id must be a non-empty string."
                );
            }

            const tabs =
                normalizeTabs(
                    this.config("tabs")
                );

            const tab =
                tabs.find(
                    function (entry) {
                        return entry.id === tabId;
                    }
                );

            if (
                tab === undefined
                || tab.disabled
            ) {
                return this;
            }

            this.config(
                "selectedTab",
                tabId
            );

            this.refresh();

            return this;
        }

        resolveSelectedTab(
            tabs,
            selectedTab
        ) {
            const configured =
                tabs.find(
                    function (tab) {
                        return tab.id === selectedTab
                            && !tab.disabled;
                    }
                );

            if (configured !== undefined) {
                return configured.id;
            }

            const firstEnabled =
                tabs.find(
                    function (tab) {
                        return !tab.disabled;
                    }
                );

            return firstEnabled === undefined
                ? ""
                : firstEnabled.id;
        }

        createPanelActionDropdown(
            actions,
            tab
        ) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Tabs panel actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            TABS_ICONS.menu,
                        triggerTitle:
                            tab.label
                            + " actions",
                        items:
                            actions,
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Tabs panel action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-tabs-panel-action-dropdown"
            );

            this.panelActionDropdowns.push(
                dropdown
            );

            return element;
        }

        createActionDropdown(actions) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Tabs actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            TABS_ICONS.menu,
                        triggerTitle:
                            "Tab actions",
                        items:
                            actions,
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Tabs action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-tabs-action-dropdown"
            );

            this.actionDropdown =
                dropdown;

            return element;
        }

        destroyPanelActionDropdowns() {
            this.panelActionDropdowns.forEach(
                function (dropdown) {
                    if (
                        dropdown
                        && typeof dropdown.destroy
                            === "function"
                    ) {
                        dropdown.destroy();
                    }
                }
            );

            this.panelActionDropdowns =
                [];

            return this;
        }

        destroyActionDropdown() {
            if (
                this.actionDropdown !== null
                && typeof this.actionDropdown.destroy
                    === "function"
            ) {
                this.actionDropdown.destroy();
            }

            this.actionDropdown =
                null;

            return this;
        }

        beforeDestroy() {
            this.destroySortable();
            this.destroyActionDropdown();
            this.destroyPanelActionDropdowns();

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return;
            }

            element.removeEventListener(
                "click",
                this.handleClick
            );

            element.removeEventListener(
                "keydown",
                this.handleKeyDown
            );
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const header =
                document.createElement(
                    "div"
                );

            const tabList =
                document.createElement(
                    "div"
                );

            const actions =
                document.createElement(
                    "div"
                );

            const panels =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-tabs"
            );

            header.classList.add(
                "app-tabs-header"
            );

            tabList.classList.add(
                "app-tabs-list"
            );

            actions.classList.add(
                "app-tabs-actions"
            );

            panels.classList.add(
                "app-tabs-panels"
            );

            header.setAttribute(
                "data-tabs-region",
                "header"
            );

            tabList.setAttribute(
                "data-tabs-region",
                "list"
            );

            actions.setAttribute(
                "data-tabs-region",
                "actions"
            );

            panels.setAttribute(
                "data-tabs-region",
                "panels"
            );

            tabList.setAttribute(
                "role",
                "tablist"
            );

            header.append(
                tabList,
                actions
            );

            root.append(
                header,
                panels
            );

            root.addEventListener(
                "click",
                this.handleClick
            );

            root.addEventListener(
                "keydown",
                this.handleKeyDown
            );

            this.update(
                root
            );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Tabs update requires an HTMLElement."
                );
            }

            const tabs =
                normalizeTabs(
                    this.config("tabs")
                );

            const selectedTab =
                this.config(
                    "selectedTab"
                );

            const presentation =
                this.config(
                    "presentation"
                );

            const sortableEnabled =
                this.config(
                    "sortableEnabled"
                );

            if (
                typeof presentation !== "string"
                || !PRESENTATIONS.includes(
                    presentation
                )
            ) {
                throw new TypeError(
                    "Tabs presentation must be tabs or pills."
                );
            }

            if (typeof selectedTab !== "string") {
                throw new TypeError(
                    "Tabs selectedTab must be a string."
                );
            }

            if (typeof sortableEnabled !== "boolean") {
                throw new TypeError(
                    "Tabs sortableEnabled must be a boolean."
                );
            }

            const actions =
                this.config(
                    "actions"
                );

            if (!Array.isArray(actions)) {
                throw new TypeError(
                    "Tabs actions must be an array."
                );
            }

            const resolvedSelectedTab =
                this.resolveSelectedTab(
                    tabs,
                    selectedTab
                );

            this.config(
                "tabs",
                tabs
            );

            this.config(
                "selectedTab",
                resolvedSelectedTab
            );

            this.config(
                "presentation",
                presentation
            );

            element.setAttribute(
                "data-tabs-presentation",
                presentation
            );

            const listRegion =
                element.querySelector(
                    '[data-tabs-region="list"]'
                );

            const actionsRegion =
                element.querySelector(
                    '[data-tabs-region="actions"]'
                );

            const panelsRegion =
                element.querySelector(
                    '[data-tabs-region="panels"]'
                );

            if (
                !(listRegion instanceof HTMLElement)
                || !(actionsRegion instanceof HTMLElement)
                || !(panelsRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Tabs rendered regions are missing."
                );
            }

            this.destroyActionDropdown();

            actionsRegion.replaceChildren();

            if (actions.length > 0) {
                actionsRegion.append(
                    this.createActionDropdown(
                        actions
                    )
                );
            }

            actionsRegion.hidden =
                actions.length === 0;

            this.destroySortable();

            listRegion.replaceChildren();

            tabs.forEach(
                (tab) => {
                    const item =
                        document.createElement(
                            "div"
                        );

                    const moveHandle =
                        document.createElement(
                            "button"
                        );

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

                    const selected =
                        tab.id
                        === resolvedSelectedTab;

                    item.classList.add(
                        "app-tabs-tab-item"
                    );

                    item.setAttribute(
                        "data-tabs-tab-item",
                        tab.id
                    );

                    moveHandle.type =
                        "button";

                    moveHandle.classList.add(
                        "app-tabs-tab-move-handle"
                    );

                    moveHandle.setAttribute(
                        "aria-label",
                        "Move " + tab.label + " tab"
                    );

                    moveHandle.setAttribute(
                        "title",
                        "Move " + tab.label + " tab"
                    );

                    renderIcon(
                        moveHandle,
                        TABS_ICONS.move
                    );

                    moveHandle.hidden =
                        !sortableEnabled
                        || !this.isSortableAvailable();

                    button.type =
                        "button";

                    button.classList.add(
                        "app-tabs-tab"
                    );

                    icon.classList.add(
                        "app-tabs-tab-icon"
                    );

                    label.classList.add(
                        "app-tabs-tab-label"
                    );

                    button.setAttribute(
                        "role",
                        "tab"
                    );

                    button.setAttribute(
                        "data-tabs-tab",
                        tab.id
                    );

                    button.setAttribute(
                        "aria-selected",
                        selected
                            ? "true"
                            : "false"
                    );

                    button.setAttribute(
                        "tabindex",
                        selected
                            ? "0"
                            : "-1"
                    );

                    button.setAttribute(
                        "aria-disabled",
                        tab.disabled
                            ? "true"
                            : "false"
                    );

                    button.disabled =
                        tab.disabled;

                    renderIcon(
                        icon,
                        tab.icon
                    );

                    global.Builder.text(
                        label,
                        tab.label
                    );

                    icon.hidden =
                        tab.icon === "";

                    button.append(
                        icon,
                        label
                    );

                    item.append(
                        moveHandle,
                        button
                    );

                    listRegion.append(
                        item
                    );
                }
            );

            this.destroyPanelActionDropdowns();

            if (
                sortableEnabled
                && this.isSortableAvailable()
            ) {
                this.sortable =
                    global.Sortable.create(
                        listRegion,
                        {
                            draggable:
                                ".app-tabs-tab-item",
                            handle:
                                ".app-tabs-tab-move-handle",
                            animation:
                                150,
                            ghostClass:
                                "app-tabs-tab-sortable-ghost",
                            chosenClass:
                                "app-tabs-tab-sortable-chosen",
                            onEnd:
                                this.handleSortEnd,
                        }
                    );
            }

            element.classList.toggle(
                "is-sortable",
                sortableEnabled
                && this.isSortableAvailable()
            );

            panelsRegion.replaceChildren();

            tabs.forEach(
                (tab) => {
                    const button =
                        listRegion.querySelector(
                            '[data-tabs-tab="'
                            + CSS.escape(tab.id)
                            + '"]'
                        );

                    if (
                        !(button instanceof HTMLButtonElement)
                    ) {
                        throw new Error(
                            "Tabs tab button is missing."
                        );
                    }

                    const panel =
                        document.createElement(
                            "div"
                        );

                    const panelActions =
                        document.createElement(
                            "div"
                        );

                    const panelContent =
                        document.createElement(
                            "div"
                        );

                    panelActions.classList.add(
                        "app-tabs-panel-actions"
                    );

                    panelContent.classList.add(
                        "app-tabs-panel-content"
                    );

                    const tabDomId =
                        "app-tabs-"
                        + this.instanceId
                        + "-tab-"
                        + tab.id;

                    const panelDomId =
                        "app-tabs-"
                        + this.instanceId
                        + "-panel-"
                        + tab.id;

                    const selected =
                        tab.id
                        === resolvedSelectedTab;

                    button.id =
                        tabDomId;

                    button.setAttribute(
                        "aria-controls",
                        panelDomId
                    );

                    panel.id =
                        panelDomId;

                    panel.classList.add(
                        "app-tabs-panel"
                    );

                    panel.setAttribute(
                        "role",
                        "tabpanel"
                    );

                    panel.setAttribute(
                        "aria-labelledby",
                        tabDomId
                    );

                    panel.setAttribute(
                        "tabindex",
                        "0"
                    );

                    panel.setAttribute(
                        "data-tabs-panel",
                        tab.id
                    );

                    panel.hidden =
                        !selected;

                    if (tab.panelActions.length > 0) {
                        panelActions.append(
                            this.createPanelActionDropdown(
                                tab.panelActions,
                                tab
                            )
                        );
                    }

                    panelActions.hidden =
                        tab.panelActions.length === 0;

                    if (tab.content instanceof Element) {
                        panelContent.replaceChildren(
                            tab.content
                        );
                    } else {
                        global.Builder.html(
                            panelContent,
                            tab.content
                        );
                    }

                    panel.append(
                        panelActions,
                        panelContent
                    );

                    panelsRegion.append(
                        panel
                    );
                }
            );

            return this;
        }

        static defaults() {
            return {
                tabs: [],
                selectedTab: "",
                presentation: "tabs",
                actions: [],
                sortableEnabled: false,
                onReorder: null,
            };
        }
    }

    global.Builder.register(
        "tabs",
        Tabs,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

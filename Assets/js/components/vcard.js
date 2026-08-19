(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before vCard."
        );
    }

    const VCARD_ICONS = Object.freeze({
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

    function normalizeString(value) {
        return typeof value === "string"
            ? value
            : "";
    }

    function normalizeActions(value) {
        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new TypeError(
                "vCard actions must be an array."
            );
        }

        return value.map(function (action) {
            if (
                action === null
                || typeof action !== "object"
                || Array.isArray(action)
            ) {
                throw new TypeError(
                    "vCard action configuration is invalid."
                );
            }

            const label =
                normalizeString(
                    action.label
                );

            const icon =
                normalizeString(
                    action.icon
                );

            const href =
                normalizeString(
                    action.href
                );

            const colors = [
                "primary",
                "secondary",
                "success",
                "danger",
                "warning",
                "info",
                "light",
                "dark",
            ];

            const color =
                colors.includes(action.color)
                    ? action.color
                    : "secondary";

            const callback =
                typeof action.callback === "function"
                    ? action.callback
                    : null;

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "vCard actions require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "vCard actions require href or callback."
                );
            }

            return {
                label: label,
                icon: icon,
                href: href,
                color: color,
                disabled:
                    action.disabled === true,
                callback: callback,
            };
        });
    }

    function normalizeLinks(value) {
        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new TypeError(
                "vCard links must be an array."
            );
        }

        return value.map(function (link) {
            if (
                link === null
                || typeof link !== "object"
                || Array.isArray(link)
            ) {
                throw new TypeError(
                    "vCard link configuration is invalid."
                );
            }

            const label =
                normalizeString(
                    link.label
                );

            const href =
                normalizeString(
                    link.href
                );

            if (
                label === ""
                || href === ""
            ) {
                throw new TypeError(
                    "vCard links require label and href."
                );
            }

            return {
                label: label,
                href: href,
            };
        });
    }

    function normalizeTags(value) {
        if (value === undefined) {
            return [];
        }

        if (
            !Array.isArray(value)
            || value.some(function (entry) {
                return typeof entry !== "string";
            })
        ) {
            throw new TypeError(
                "vCard tags must be an array of strings."
            );
        }

        return value.slice();
    }

    function normalizeMetadata(value) {
        if (value === undefined) {
            return [];
        }

        if (!Array.isArray(value)) {
            throw new TypeError(
                "vCard metadata must be an array."
            );
        }

        return value.map(function (entry) {
            if (
                entry === null
                || typeof entry !== "object"
                || Array.isArray(entry)
            ) {
                throw new TypeError(
                    "vCard metadata entry is invalid."
                );
            }

            const icon =
                normalizeString(
                    entry.icon
                );

            const label =
                normalizeString(
                    entry.label
                );

            const value =
                normalizeString(
                    entry.value
                );

            const href =
                normalizeString(
                    entry.href
                );

            if (value === "") {
                throw new TypeError(
                    "vCard metadata entries require a value."
                );
            }

            return {
                icon: icon,
                label: label,
                value: value,
                href: href,
            };
        });
    }

    class VCard extends global.Component {
        constructor(config) {
            super(config);

            this.menuDropdown = null;
            this.actionButtonGroup = null;
        }

        static defaults() {
            return {
                name: "",
                organization: "",
                title: "",
                avatar: "",
                email: "",
                phone: "",
                address: "",
                links: [],
                tags: [],
                metadata: [],
                actions: [],
                menuActions: [],
                moveHandleVisible: false,
            };
        }

        destroyActionButtonGroup() {
            if (
                this.actionButtonGroup !== null
                && typeof this.actionButtonGroup.destroy === "function"
            ) {
                this.actionButtonGroup.destroy();
            }

            this.actionButtonGroup = null;

            return this;
        }

        destroyMenuDropdown() {
            if (
                this.menuDropdown !== null
                && typeof this.menuDropdown.destroy === "function"
            ) {
                this.menuDropdown.destroy();
            }

            this.menuDropdown = null;

            return this;
        }

        beforeDestroy() {
            this.destroyActionButtonGroup();
            this.destroyMenuDropdown();
        }

        isSortableAvailable() {
            return typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                );
        }

        showMoveHandle() {
            this.config(
                "moveHandleVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideMoveHandle() {
            this.config(
                "moveHandleVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleMoveHandle() {
            return this.config(
                "moveHandleVisible"
            ) === true
                ? this.hideMoveHandle()
                : this.showMoveHandle();
        }

        createActionButtonGroup(actions) {
            if (!global.Builder.has("button-group")) {
                throw new Error(
                    "vCard actions require the Button Group component."
                );
            }

            const group =
                global.Builder.create(
                    "button-group",
                    {
                        buttons:
                            actions.map(
                                function (action) {
                                    return {
                                        label:
                                            action.label,
                                        icon:
                                            action.icon,
                                        href:
                                            action.href,
                                        callback:
                                            action.callback,
                                        disabled:
                                            action.disabled,
                                        variant:
                                            action.color,
                                        size:
                                            "small",
                                    };
                                }
                            ),
                        orientation:
                            "horizontal",
                        presentation:
                            "attached",
                        equalWidth:
                            true,
                        wrap:
                            false,
                    }
                );

            const element =
                group.element();

            if (!(element instanceof HTMLElement)) {
                group.destroy();

                throw new Error(
                    "vCard action Button Group did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-vcard-action-button-group"
            );

            this.actionButtonGroup =
                group;

            return element;
        }

        createActionButton(action) {
            const control =
                document.createElement(
                    action.href === ""
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
                    action.disabled;
            }

            if (
                control
                instanceof HTMLAnchorElement
            ) {
                control.href =
                    action.href;

                if (action.disabled) {
                    control.setAttribute(
                        "aria-disabled",
                        "true"
                    );
                }
            }

            control.classList.add(
                "app-vcard-action",
                "app-button",
                "app-button-small",
                "app-button-" + action.color
            );

            icon.classList.add(
                "app-vcard-action-icon"
            );

            label.classList.add(
                "app-vcard-action-label"
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

            if (action.label !== "") {
                control.setAttribute(
                    "title",
                    action.label
                );

                control.setAttribute(
                    "aria-label",
                    action.label
                );
            }

            control.append(
                icon,
                label
            );

            control.addEventListener(
                "click",
                function (event) {
                    if (action.disabled) {
                        event.preventDefault();
                        return;
                    }

                    if (
                        action.callback !== null
                    ) {
                        action.callback();
                    }
                }
            );

            return control;
        }

        createMultipleActionsElement(actions) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "vCard menu actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            VCARD_ICONS.menu,
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
                                        href:
                                            action.href,
                                        disabled:
                                            action.disabled,
                                        callback:
                                            action.callback,
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
                    "vCard action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-vcard-action-dropdown"
            );

            this.menuDropdown =
                dropdown;

            return element;
        }

        updateAvatar(
            region,
            avatar,
            name
        ) {
            region.replaceChildren();

            if (!global.Builder.has("avatar")) {
                throw new Error(
                    "vCard requires the Avatar component."
                );
            }

            global.Builder.create(
                "avatar",
                {
                    name:
                        name,
                    src:
                        avatar,
                    size:
                        "large",
                }
            ).appendTo(
                region
            );

            return this;
        }

        render() {
            const card =
                document.createElement(
                    "article"
                );

            const moveHandle =
                document.createElement(
                    "button"
                );

            const menuActions =
                document.createElement(
                    "div"
                );

            const header =
                document.createElement(
                    "div"
                );

            const tags =
                document.createElement(
                    "div"
                );

            const details =
                document.createElement(
                    "div"
                );

            const avatar =
                document.createElement(
                    "div"
                );

            const identity =
                document.createElement(
                    "div"
                );

            const name =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            const organization =
                document.createElement(
                    "div"
                );

            const contact =
                document.createElement(
                    "div"
                );

            const email =
                document.createElement(
                    "a"
                );

            const phone =
                document.createElement(
                    "a"
                );

            const address =
                document.createElement(
                    "div"
                );

            const links =
                document.createElement(
                    "div"
                );

            const metadata =
                document.createElement(
                    "div"
                );

            const actions =
                document.createElement(
                    "div"
                );

            moveHandle.type =
                "button";

            moveHandle.classList.add(
                "app-vcard-move-handle"
            );

            moveHandle.setAttribute(
                "data-vcard-region",
                "move-handle"
            );

            moveHandle.setAttribute(
                "aria-label",
                "Move contact"
            );

            moveHandle.setAttribute(
                "title",
                "Move contact"
            );

            renderIcon(
                moveHandle,
                VCARD_ICONS.move
            );

            menuActions.classList.add(
                "app-vcard-menu-actions"
            );

            menuActions.setAttribute(
                "data-vcard-region",
                "menu-actions"
            );

            header.classList.add(
                "app-vcard-header"
            );

            tags.classList.add(
                "app-vcard-tags"
            );

            tags.setAttribute(
                "data-vcard-region",
                "tags"
            );

            details.classList.add(
                "app-vcard-details"
            );

            avatar.classList.add(
                "app-vcard-avatar"
            );

            avatar.setAttribute(
                "data-vcard-region",
                "avatar"
            );

            identity.classList.add(
                "app-vcard-identity"
            );

            name.classList.add(
                "app-vcard-name"
            );

            name.setAttribute(
                "data-vcard-region",
                "name"
            );

            title.classList.add(
                "app-vcard-title"
            );

            title.setAttribute(
                "data-vcard-region",
                "title"
            );

            organization.classList.add(
                "app-vcard-organization"
            );

            organization.setAttribute(
                "data-vcard-region",
                "organization"
            );

            contact.classList.add(
                "app-vcard-contact"
            );

            contact.setAttribute(
                "data-vcard-region",
                "contact"
            );

            email.classList.add(
                "app-vcard-contact-link"
            );

            email.setAttribute(
                "data-vcard-region",
                "email"
            );

            phone.classList.add(
                "app-vcard-contact-link"
            );

            phone.setAttribute(
                "data-vcard-region",
                "phone"
            );

            address.classList.add(
                "app-vcard-address"
            );

            address.setAttribute(
                "data-vcard-region",
                "address"
            );

            links.classList.add(
                "app-vcard-links"
            );

            links.setAttribute(
                "data-vcard-region",
                "links"
            );

            metadata.classList.add(
                "app-vcard-metadata"
            );

            metadata.setAttribute(
                "data-vcard-region",
                "metadata"
            );

            actions.classList.add(
                "app-vcard-actions"
            );

            actions.setAttribute(
                "data-vcard-region",
                "actions"
            );

            card.classList.add(
                "app-vcard"
            );

            identity.append(
                name,
                title,
                organization
            );

            header.append(
                avatar,
                identity
            );

            contact.append(
                email,
                phone,
                address
            );

            details.append(
                contact,
                links,
                metadata
            );

            card.append(
                moveHandle,
                menuActions,
                header,
                tags,
                details,
                actions
            );

            this.update(
                card
            );

            return card;
        }

        update(element) {
            const name =
                normalizeString(
                    this.config("name")
                );

            const organization =
                normalizeString(
                    this.config("organization")
                );

            const title =
                normalizeString(
                    this.config("title")
                );

            const avatar =
                normalizeString(
                    this.config("avatar")
                );

            const email =
                normalizeString(
                    this.config("email")
                );

            const phone =
                normalizeString(
                    this.config("phone")
                );

            const address =
                normalizeString(
                    this.config("address")
                );

            const links =
                normalizeLinks(
                    this.config("links")
                );

            const tags =
                normalizeTags(
                    this.config("tags")
                );

            const metadata =
                normalizeMetadata(
                    this.config("metadata")
                );

            const actions =
                normalizeActions(
                    this.config("actions")
                );

            const menuActions =
                normalizeActions(
                    this.config("menuActions")
                );

            this.config(
                "name",
                name
            );

            this.config(
                "organization",
                organization
            );

            this.config(
                "title",
                title
            );

            this.config(
                "avatar",
                avatar
            );

            this.config(
                "email",
                email
            );

            this.config(
                "phone",
                phone
            );

            this.config(
                "address",
                address
            );

            this.config(
                "links",
                links
            );

            this.config(
                "tags",
                tags
            );

            this.config(
                "metadata",
                metadata
            );

            this.config(
                "actions",
                actions
            );

            this.config(
                "menuActions",
                menuActions
            );

            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "vCard update requires an HTMLElement."
                );
            }

            const moveHandleRegion =
                element.querySelector(
                    '[data-vcard-region="move-handle"]'
                );

            const menuActionsRegion =
                element.querySelector(
                    '[data-vcard-region="menu-actions"]'
                );

            const tagsRegion =
                element.querySelector(
                    '[data-vcard-region="tags"]'
                );

            const avatarRegion =
                element.querySelector(
                    '[data-vcard-region="avatar"]'
                );

            const nameRegion =
                element.querySelector(
                    '[data-vcard-region="name"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-vcard-region="title"]'
                );

            const organizationRegion =
                element.querySelector(
                    '[data-vcard-region="organization"]'
                );

            const contactRegion =
                element.querySelector(
                    '[data-vcard-region="contact"]'
                );

            const emailRegion =
                element.querySelector(
                    '[data-vcard-region="email"]'
                );

            const phoneRegion =
                element.querySelector(
                    '[data-vcard-region="phone"]'
                );

            const addressRegion =
                element.querySelector(
                    '[data-vcard-region="address"]'
                );

            const linksRegion =
                element.querySelector(
                    '[data-vcard-region="links"]'
                );

            const metadataRegion =
                element.querySelector(
                    '[data-vcard-region="metadata"]'
                );

            const actionsRegion =
                element.querySelector(
                    '[data-vcard-region="actions"]'
                );

            if (
                !(moveHandleRegion instanceof HTMLButtonElement)
                || !(menuActionsRegion instanceof HTMLElement)
                || !(tagsRegion instanceof HTMLElement)
                || !(avatarRegion instanceof HTMLElement)
                || !(nameRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(organizationRegion instanceof HTMLElement)
                || !(contactRegion instanceof HTMLElement)
                || !(emailRegion instanceof HTMLAnchorElement)
                || !(phoneRegion instanceof HTMLAnchorElement)
                || !(addressRegion instanceof HTMLElement)
                || !(linksRegion instanceof HTMLElement)
                || !(metadataRegion instanceof HTMLElement)
                || !(actionsRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "vCard rendered regions are missing."
                );
            }

            moveHandleRegion.hidden =
                this.config("moveHandleVisible") !== true
                || !this.isSortableAvailable();

            tagsRegion.replaceChildren();

            tags.forEach(function (tag) {
                const element =
                    document.createElement(
                        "span"
                    );

                element.classList.add(
                    "app-vcard-tag"
                );

                global.Builder.text(
                    element,
                    tag
                );

                tagsRegion.append(
                    element
                );
            });

            tagsRegion.hidden =
                tags.length === 0;

            this.updateAvatar(
                avatarRegion,
                avatar,
                name
            );

            global.Builder.text(
                nameRegion,
                name
            );

            global.Builder.text(
                titleRegion,
                title
            );

            global.Builder.text(
                organizationRegion,
                organization
            );

            titleRegion.hidden =
                title === "";

            organizationRegion.hidden =
                organization === "";

            global.Builder.text(
                emailRegion,
                email
            );

            emailRegion.href =
                email === ""
                    ? ""
                    : "mailto:" + email;

            emailRegion.hidden =
                email === "";

            global.Builder.text(
                phoneRegion,
                phone
            );

            phoneRegion.href =
                phone === ""
                    ? ""
                    : "tel:" + phone;

            phoneRegion.hidden =
                phone === "";

            global.Builder.text(
                addressRegion,
                address
            );

            addressRegion.hidden =
                address === "";

            contactRegion.hidden =
                email === ""
                && phone === ""
                && address === "";

            linksRegion.replaceChildren();

            links.forEach(function (link) {
                const element =
                    document.createElement(
                        "a"
                    );

                element.classList.add(
                    "app-vcard-link"
                );

                element.href =
                    link.href;

                global.Builder.text(
                    element,
                    link.label
                );

                linksRegion.append(
                    element
                );
            });

            linksRegion.hidden =
                links.length === 0;

            metadataRegion.replaceChildren();

            metadata.forEach(function (entry) {
                const row =
                    document.createElement(
                        entry.href === ""
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

                const label =
                    document.createElement(
                        "span"
                    );

                const value =
                    document.createElement(
                        "span"
                    );

                row.classList.add(
                    "app-vcard-metadata-item"
                );

                icon.classList.add(
                    "app-vcard-metadata-icon"
                );

                content.classList.add(
                    "app-vcard-metadata-content"
                );

                label.classList.add(
                    "app-vcard-metadata-label"
                );

                value.classList.add(
                    "app-vcard-metadata-value"
                );

                if (
                    row
                    instanceof HTMLAnchorElement
                ) {
                    row.href =
                        entry.href;
                }

                renderIcon(
                    icon,
                    entry.icon
                );

                global.Builder.text(
                    label,
                    entry.label
                );

                global.Builder.text(
                    value,
                    entry.value
                );

                icon.hidden =
                    entry.icon === "";

                label.hidden =
                    entry.label === "";

                content.append(
                    label,
                    value
                );

                row.append(
                    icon,
                    content
                );

                metadataRegion.append(
                    row
                );
            });

            metadataRegion.hidden =
                metadata.length === 0;

            this.destroyMenuDropdown();

            menuActionsRegion.replaceChildren();

            if (menuActions.length > 0) {
                menuActionsRegion.append(
                    this.createMultipleActionsElement(
                        menuActions
                    )
                );
            }

            menuActionsRegion.hidden =
                menuActions.length === 0;

            this.destroyActionButtonGroup();

            actionsRegion.replaceChildren();

            if (actions.length > 0) {
                actionsRegion.append(
                    this.createActionButtonGroup(
                        actions
                    )
                );
            }

            actionsRegion.hidden =
                actions.length === 0;

            return this;
        }
    }

    global.Builder.register(
        "vcard",
        VCard,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

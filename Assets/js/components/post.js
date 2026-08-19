(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Post."
        );
    }

    function normalizeAuthor(value) {
        if (
            value === null
            || typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Post author must be an object."
            );
        }

        return {
            name:
                typeof value.name === "string"
                    ? value.name
                    : "",
            avatar:
                typeof value.avatar === "string"
                    ? value.avatar
                    : "",
            title:
                typeof value.title === "string"
                    ? value.title
                    : "",
            href:
                typeof value.href === "string"
                    ? value.href
                    : "",
        };
    }

    function normalizeCategories(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Post categories must be an array."
            );
        }

        return value.map(
            function (category) {
                if (
                    typeof category !== "string"
                    || category.trim() === ""
                ) {
                    throw new TypeError(
                        "Post categories must contain non-empty strings."
                    );
                }

                return category.trim();
            }
        );
    }

    function normalizeAttachments(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Post attachments must be an array."
            );
        }

        return value.map(
            function (attachment) {
                if (
                    attachment === null
                    || typeof attachment !== "object"
                    || Array.isArray(attachment)
                ) {
                    throw new TypeError(
                        "Post attachment configuration is invalid."
                    );
                }

                const type =
                    typeof attachment.type === "string"
                        ? attachment.type
                        : "";

                const label =
                    typeof attachment.label === "string"
                        ? attachment.label
                        : "";

                const url =
                    typeof attachment.url === "string"
                        ? attachment.url
                        : "";

                const preview =
                    typeof attachment.preview === "string"
                        ? attachment.preview
                        : "";

                const metadata =
                    typeof attachment.metadata === "string"
                        ? attachment.metadata
                        : "";

                if (url === "") {
                    throw new TypeError(
                        "Post attachments require a URL."
                    );
                }

                return {
                    type: type,
                    label: label,
                    url: url,
                    preview: preview,
                    metadata: metadata,
                };
            }
        );
    }


    const POST_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        like: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725a.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>',
            "</svg>",
        ].join(""),
        likeFilled: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a10 10 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733q.086.18.138.363c.077.27.113.567.113.856s-.036.586-.113.856c-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.2 3.2 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16H8c-.605 0-1.07-.081-1.466-.218a4.8 4.8 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"/>',
            "</svg>",
        ].join(""),
        share: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>',
            "</svg>",
        ].join(""),
        shareFilled: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>',
            "</svg>",
        ].join(""),
        comments: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 3a5 5 0 0 0-4.546 7.086l-.78 2.338 2.338-.78A5 5 0 1 0 8 3m-6 5a6 6 0 1 1 3.315 5.372L1 14.81l1.438-4.315A6 6 0 0 1 2 8"/>',
            "</svg>",
        ].join(""),
    });

    class Post extends global.Component {

        constructor(config) {
            super(config);

            this.menuDropdown =
                null;

            this.actionButtonGroup =
                null;

            this.commentsComponent =
                null;

            this.commentsCollapseComponent =
                null;
        }

        isTimeagoAvailable() {
            return typeof global.jQuery === "function"
                && global.jQuery.fn !== undefined
                && typeof global.jQuery.fn.timeago === "function";
        }

        initializeTimeago(timestamp) {
            if (!(timestamp instanceof HTMLTimeElement)) {
                return this;
            }

            queueMicrotask(
                () => {
                    if (
                        !timestamp.isConnected
                        || !this.isTimeagoAvailable()
                    ) {
                        return;
                    }

                    global.jQuery(
                        timestamp
                    ).timeago();
                }
            );

            return this;
        }

        setLiked(liked) {
            if (typeof liked !== "boolean") {
                throw new TypeError(
                    "Post liked state must be a boolean."
                );
            }

            this.config(
                "liked",
                liked
            );

            this.refresh();

            return this;
        }

        like() {
            return this.setLiked(
                true
            );
        }

        unlike() {
            return this.setLiked(
                false
            );
        }

        toggleLiked() {
            return this.setLiked(
                this.config("liked") !== true
            );
        }

        setShared(shared) {
            if (typeof shared !== "boolean") {
                throw new TypeError(
                    "Post shared state must be a boolean."
                );
            }

            this.config(
                "shared",
                shared
            );

            this.refresh();

            return this;
        }

        share() {
            return this.setShared(
                true
            );
        }

        unshare() {
            return this.setShared(
                false
            );
        }

        toggleShared() {
            return this.setShared(
                this.config("shared") !== true
            );
        }

        setLikeCount(count) {
            if (
                count !== null
                && (
                    !Number.isInteger(count)
                    || count < 0
                )
            ) {
                throw new TypeError(
                    "Post like count must be null or a non-negative integer."
                );
            }

            this.config(
                "likeCount",
                count
            );

            this.refresh();

            return this;
        }

        setShareCount(count) {
            if (
                count !== null
                && (
                    !Number.isInteger(count)
                    || count < 0
                )
            ) {
                throw new TypeError(
                    "Post share count must be null or a non-negative integer."
                );
            }

            this.config(
                "shareCount",
                count
            );

            this.refresh();

            return this;
        }

        setCommentCount(count) {
            if (
                count !== null
                && (
                    !Number.isInteger(count)
                    || count < 0
                )
            ) {
                throw new TypeError(
                    "Post comment count must be null or a non-negative integer."
                );
            }

            this.config(
                "commentCount",
                count
            );

            this.refresh();

            return this;
        }

        setComments(comments) {
            if (!Array.isArray(comments)) {
                throw new TypeError(
                    "Post comments must be an array."
                );
            }

            this.config(
                "comments",
                comments
            );

            this.refresh();

            return this;
        }

        setControlVisible(
            option,
            visible
        ) {
            const options = [
                "editControlVisible",
                "deleteControlVisible",
                "archiveControlVisible",
                "likeControlVisible",
                "shareControlVisible",
                "commentsControlVisible",
            ];

            if (
                typeof option !== "string"
                || !options.includes(option)
            ) {
                throw new TypeError(
                    "Post control option is invalid."
                );
            }

            if (typeof visible !== "boolean") {
                throw new TypeError(
                    "Post control visibility must be a boolean."
                );
            }

            this.config(
                option,
                visible
            );

            this.refresh();

            return this;
        }

        toggleControlVisible(option) {
            return this.setControlVisible(
                option,
                this.config(option) !== true
            );
        }

        showEditControl() {
            return this.setControlVisible(
                "editControlVisible",
                true
            );
        }

        hideEditControl() {
            return this.setControlVisible(
                "editControlVisible",
                false
            );
        }

        toggleEditControl() {
            return this.toggleControlVisible(
                "editControlVisible"
            );
        }

        showDeleteControl() {
            return this.setControlVisible(
                "deleteControlVisible",
                true
            );
        }

        hideDeleteControl() {
            return this.setControlVisible(
                "deleteControlVisible",
                false
            );
        }

        toggleDeleteControl() {
            return this.toggleControlVisible(
                "deleteControlVisible"
            );
        }

        showArchiveControl() {
            return this.setControlVisible(
                "archiveControlVisible",
                true
            );
        }

        hideArchiveControl() {
            return this.setControlVisible(
                "archiveControlVisible",
                false
            );
        }

        toggleArchiveControl() {
            return this.toggleControlVisible(
                "archiveControlVisible"
            );
        }

        showLikeControl() {
            return this.setControlVisible(
                "likeControlVisible",
                true
            );
        }

        hideLikeControl() {
            return this.setControlVisible(
                "likeControlVisible",
                false
            );
        }

        toggleLikeControl() {
            return this.toggleControlVisible(
                "likeControlVisible"
            );
        }

        showShareControl() {
            return this.setControlVisible(
                "shareControlVisible",
                true
            );
        }

        hideShareControl() {
            return this.setControlVisible(
                "shareControlVisible",
                false
            );
        }

        toggleShareControl() {
            return this.toggleControlVisible(
                "shareControlVisible"
            );
        }

        showCommentsControl() {
            return this.setControlVisible(
                "commentsControlVisible",
                true
            );
        }

        hideCommentsControl() {
            return this.setControlVisible(
                "commentsControlVisible",
                false
            );
        }

        toggleCommentsControl() {
            return this.toggleControlVisible(
                "commentsControlVisible"
            );
        }

        showComments() {
            this.config(
                "commentsVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideComments() {
            this.config(
                "commentsVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleComments() {
            return this.config(
                "commentsVisible"
            ) === true
                ? this.hideComments()
                : this.showComments();
        }

        createCommentsComponent(
            comments,
            config
        ) {
            if (!global.Builder.has("comments")) {
                throw new Error(
                    "Post comments require the Comments component."
                );
            }

            const componentConfig =
                Object.assign(
                    {},
                    config,
                    {
                        comments:
                            comments,
                    }
                );

            const component =
                global.Builder.create(
                    "comments",
                    componentConfig
                );

            const element =
                component.element();

            if (!(element instanceof HTMLElement)) {
                component.destroy();

                throw new Error(
                    "Post Comments component did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-post-comments-component"
            );

            this.commentsComponent =
                component;

            return element;
        }

        createActionButtonGroup(buttons) {
            if (!global.Builder.has("button-group")) {
                throw new Error(
                    "Post direct actions require the Button Group component."
                );
            }

            const group =
                global.Builder.create(
                    "button-group",
                    {
                        buttons:
                            buttons,
                        orientation:
                            "horizontal",
                        presentation:
                            "spaced",
                        equalWidth:
                            false,
                        wrap:
                            true,
                    }
                );

            const element =
                group.element();

            if (!(element instanceof HTMLElement)) {
                group.destroy();

                throw new Error(
                    "Post action Button Group did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-post-action-button-group"
            );

            this.actionButtonGroup =
                group;

            return element;
        }

        destroyActionButtonGroup() {
            if (
                this.actionButtonGroup !== null
                && typeof this.actionButtonGroup.destroy
                    === "function"
            ) {
                this.actionButtonGroup.destroy();
            }

            this.actionButtonGroup =
                null;

            return this;
        }

        destroyCommentsComponent() {
            if (
                this.commentsComponent !== null
                && typeof this.commentsComponent.destroy
                    === "function"
            ) {
                this.commentsComponent.destroy();
            }

            this.commentsComponent =
                null;

            return this;
        }

        destroyCommentsCollapseComponent() {
            if (
                this.commentsCollapseComponent !== null
                && typeof this.commentsCollapseComponent.destroy
                    === "function"
            ) {
                this.commentsCollapseComponent.destroy();
            }

            this.commentsCollapseComponent =
                null;

            return this;
        }

        createMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Post overflow actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            POST_ICONS.menu,
                        triggerTitle:
                            "Post actions",
                        items:
                            items,
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Post action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-post-action-dropdown"
            );

            this.menuDropdown =
                dropdown;

            return element;
        }

        destroyMenuDropdown() {
            if (
                this.menuDropdown !== null
                && typeof this.menuDropdown.destroy
                    === "function"
            ) {
                this.menuDropdown.destroy();
            }

            this.menuDropdown =
                null;

            return this;
        }

        beforeDestroy() {
            const element =
                this.element();

            if (
                this.isTimeagoAvailable()
                && element instanceof HTMLElement
            ) {
                const timestamp =
                    element.querySelector(
                        '[data-post-region="timestamp"]'
                    );

                if (timestamp instanceof HTMLTimeElement) {
                    global.jQuery(
                        timestamp
                    ).timeago(
                        "dispose"
                    );
                }
            }

            this.destroyMenuDropdown();
            this.destroyActionButtonGroup();
            this.destroyCommentsComponent();
            this.destroyCommentsCollapseComponent();
        }

        createAttachmentElement(
            attachment
        ) {
            const link =
                document.createElement(
                    "a"
                );

            const preview =
                document.createElement(
                    "span"
                );

            const body =
                document.createElement(
                    "span"
                );

            const label =
                document.createElement(
                    "span"
                );

            const metadata =
                document.createElement(
                    "span"
                );

            link.classList.add(
                "app-post-attachment"
            );

            preview.classList.add(
                "app-post-attachment-preview"
            );

            body.classList.add(
                "app-post-attachment-body"
            );

            label.classList.add(
                "app-post-attachment-label"
            );

            metadata.classList.add(
                "app-post-attachment-metadata"
            );

            link.href =
                attachment.url;

            if (attachment.type !== "") {
                link.dataset.attachmentType =
                    attachment.type;
            }

            if (attachment.preview !== "") {
                const image =
                    document.createElement(
                        "img"
                    );

                image.classList.add(
                    "app-post-attachment-preview-image"
                );

                image.src =
                    attachment.preview;

                image.alt =
                    attachment.label;

                preview.append(
                    image
                );
            }

            preview.hidden =
                attachment.preview === "";

            global.Builder.text(
                label,
                attachment.label
            );

            global.Builder.text(
                metadata,
                attachment.metadata
            );

            label.hidden =
                attachment.label === "";

            metadata.hidden =
                attachment.metadata === "";

            body.append(
                label,
                metadata
            );

            link.append(
                preview,
                body
            );

            return link;
        }


        render() {
            const post =
                document.createElement(
                    "article"
                );

            const header =
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

            const author =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            const timestamp =
                document.createElement(
                    "time"
                );

            const status =
                document.createElement(
                    "span"
                );

            const menu =
                document.createElement(
                    "div"
                );

            const categories =
                document.createElement(
                    "div"
                );

            const content =
                document.createElement(
                    "div"
                );

            const attachments =
                document.createElement(
                    "div"
                );

            const actions =
                document.createElement(
                    "div"
                );

            const comments =
                document.createElement(
                    "div"
                );

            post.classList.add(
                "app-post"
            );

            header.classList.add(
                "app-post-header"
            );

            avatar.classList.add(
                "app-post-avatar"
            );

            identity.classList.add(
                "app-post-identity"
            );

            author.classList.add(
                "app-post-author"
            );

            title.classList.add(
                "app-post-author-title"
            );

            timestamp.classList.add(
                "app-post-timestamp"
            );

            status.classList.add(
                "app-post-status"
            );

            menu.classList.add(
                "app-post-menu"
            );

            categories.classList.add(
                "app-post-categories"
            );

            content.classList.add(
                "app-post-content"
            );

            attachments.classList.add(
                "app-post-attachments"
            );

            actions.classList.add(
                "app-post-actions"
            );

            comments.classList.add(
                "app-post-comments"
            );

            avatar.setAttribute(
                "data-post-region",
                "avatar"
            );

            author.setAttribute(
                "data-post-region",
                "author"
            );

            title.setAttribute(
                "data-post-region",
                "title"
            );

            timestamp.setAttribute(
                "data-post-region",
                "timestamp"
            );

            status.setAttribute(
                "data-post-region",
                "status"
            );

            menu.setAttribute(
                "data-post-region",
                "menu"
            );

            categories.setAttribute(
                "data-post-region",
                "categories"
            );

            content.setAttribute(
                "data-post-region",
                "content"
            );

            attachments.setAttribute(
                "data-post-region",
                "attachments"
            );

            actions.setAttribute(
                "data-post-region",
                "actions"
            );

            comments.setAttribute(
                "data-post-region",
                "comments"
            );

            identity.append(
                author,
                title
            );

            header.append(
                avatar,
                identity,
                timestamp,
                status,
                menu
            );

            if (!global.Builder.has("collapse")) {
                throw new Error(
                    "Post comments require the Collapse component."
                );
            }

            this.destroyCommentsCollapseComponent();

            this.commentsCollapseComponent =
                global.Builder.create(
                    "collapse",
                    {
                        content:
                            comments,
                        collapsed:
                            this.config("commentsVisible") !== true,
                    }
                );

            const commentsCollapseElement =
                this.commentsCollapseComponent.element();

            if (!(commentsCollapseElement instanceof HTMLElement)) {
                throw new Error(
                    "Post Comments Collapse component did not render an HTMLElement."
                );
            }

            post.append(
                header,
                categories,
                content,
                attachments,
                actions,
                commentsCollapseElement
            );

            this.update(
                post
            );

            return post;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Post update requires an HTMLElement."
                );
            }

            const author =
                normalizeAuthor(
                    this.config("author")
                );

            const timestamp =
                this.config(
                    "timestamp"
                );

            const content =
                this.config(
                    "content"
                );

            const categories =
                normalizeCategories(
                    this.config(
                        "categories"
                    )
                );

            const status =
                this.config(
                    "status"
                );

            const attachments =
                normalizeAttachments(
                    this.config(
                        "attachments"
                    )
                );

            const editControlVisible =
                this.config(
                    "editControlVisible"
                );

            const deleteControlVisible =
                this.config(
                    "deleteControlVisible"
                );

            const archiveControlVisible =
                this.config(
                    "archiveControlVisible"
                );

            const likeControlVisible =
                this.config(
                    "likeControlVisible"
                );

            const shareControlVisible =
                this.config(
                    "shareControlVisible"
                );

            const commentsControlVisible =
                this.config(
                    "commentsControlVisible"
                );

            const liked =
                this.config(
                    "liked"
                );

            const shared =
                this.config(
                    "shared"
                );

            const likeCount =
                this.config(
                    "likeCount"
                );

            const shareCount =
                this.config(
                    "shareCount"
                );

            const commentCount =
                this.config(
                    "commentCount"
                );

            const commentsVisible =
                this.config(
                    "commentsVisible"
                );

            const comments =
                this.config(
                    "comments"
                );

            const commentsConfig =
                this.config(
                    "commentsConfig"
                );

            const onEdit =
                this.config(
                    "onEdit"
                );

            const onDelete =
                this.config(
                    "onDelete"
                );

            const onArchive =
                this.config(
                    "onArchive"
                );

            const onLike =
                this.config(
                    "onLike"
                );

            const onShare =
                this.config(
                    "onShare"
                );

            const onViewComments =
                this.config(
                    "onViewComments"
                );

            if (typeof timestamp !== "string") {
                throw new TypeError(
                    "Post timestamp must be a string."
                );
            }

            const timestampDate =
                timestamp === ""
                    ? null
                    : new Date(
                        timestamp
                    );

            if (
                timestampDate !== null
                && Number.isNaN(
                    timestampDate.getTime()
                )
            ) {
                throw new TypeError(
                    "Post timestamp must be a valid datetime string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Post content must be a string."
                );
            }

            if (typeof status !== "string") {
                throw new TypeError(
                    "Post status must be a string."
                );
            }

            [
                [
                    "editControlVisible",
                    editControlVisible,
                ],
                [
                    "deleteControlVisible",
                    deleteControlVisible,
                ],
                [
                    "archiveControlVisible",
                    archiveControlVisible,
                ],
                [
                    "likeControlVisible",
                    likeControlVisible,
                ],
                [
                    "shareControlVisible",
                    shareControlVisible,
                ],
                [
                    "commentsControlVisible",
                    commentsControlVisible,
                ],
                [
                    "liked",
                    liked,
                ],
                [
                    "shared",
                    shared,
                ],
                [
                    "commentsVisible",
                    commentsVisible,
                ],
            ].forEach(function (entry) {
                if (typeof entry[1] !== "boolean") {
                    throw new TypeError(
                        "Post "
                        + entry[0]
                        + " must be a boolean."
                    );
                }
            });

            if (!Array.isArray(comments)) {
                throw new TypeError(
                    "Post comments must be an array."
                );
            }

            if (
                commentsConfig === null
                || typeof commentsConfig !== "object"
                || Array.isArray(commentsConfig)
            ) {
                throw new TypeError(
                    "Post commentsConfig must be an object."
                );
            }

            [
                [
                    "likeCount",
                    likeCount,
                ],
                [
                    "shareCount",
                    shareCount,
                ],
                [
                    "commentCount",
                    commentCount,
                ],
            ].forEach(function (entry) {
                if (
                    entry[1] !== null
                    && (
                        !Number.isInteger(entry[1])
                        || entry[1] < 0
                    )
                ) {
                    throw new TypeError(
                        "Post "
                        + entry[0]
                        + " must be null or a non-negative integer."
                    );
                }
            });

            [
                [
                    "onEdit",
                    onEdit,
                ],
                [
                    "onDelete",
                    onDelete,
                ],
                [
                    "onArchive",
                    onArchive,
                ],
                [
                    "onLike",
                    onLike,
                ],
                [
                    "onShare",
                    onShare,
                ],
                [
                    "onViewComments",
                    onViewComments,
                ],
            ].forEach(function (entry) {
                if (
                    entry[1] !== null
                    && typeof entry[1] !== "function"
                ) {
                    throw new TypeError(
                        "Post "
                        + entry[0]
                        + " must be a function or null."
                    );
                }
            });

            this.config(
                "author",
                author
            );

            this.config(
                "categories",
                categories
            );

            this.config(
                "attachments",
                attachments
            );

            const avatarRegion =
                element.querySelector(
                    '[data-post-region="avatar"]'
                );

            const authorRegion =
                element.querySelector(
                    '[data-post-region="author"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-post-region="title"]'
                );

            const timestampRegion =
                element.querySelector(
                    '[data-post-region="timestamp"]'
                );


            const statusRegion =
                element.querySelector(
                    '[data-post-region="status"]'
                );

            const menuRegion =
                element.querySelector(
                    '[data-post-region="menu"]'
                );

            const categoriesRegion =
                element.querySelector(
                    '[data-post-region="categories"]'
                );

            const contentRegion =
                element.querySelector(
                    '[data-post-region="content"]'
                );

            const attachmentsRegion =
                element.querySelector(
                    '[data-post-region="attachments"]'
                );

            const actionsRegion =
                element.querySelector(
                    '[data-post-region="actions"]'
                );

            const commentsRegion =
                element.querySelector(
                    '[data-post-region="comments"]'
                );

            if (
                !(avatarRegion instanceof HTMLElement)
                || !(authorRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(timestampRegion instanceof HTMLTimeElement)
                || !(statusRegion instanceof HTMLElement)
                || !(menuRegion instanceof HTMLElement)
                || !(categoriesRegion instanceof HTMLElement)
                || !(contentRegion instanceof HTMLElement)
                || !(attachmentsRegion instanceof HTMLElement)
                || !(actionsRegion instanceof HTMLElement)
                || !(commentsRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Post identity regions are missing."
                );
            }

            authorRegion.replaceChildren();

            if (author.href !== "") {
                const link =
                    document.createElement(
                        "a"
                    );

                link.classList.add(
                    "app-post-author-link"
                );

                link.href =
                    author.href;

                global.Builder.text(
                    link,
                    author.name
                );

                authorRegion.append(
                    link
                );
            } else {
                global.Builder.text(
                    authorRegion,
                    author.name
                );
            }

            global.Builder.text(
                titleRegion,
                author.title
            );

            titleRegion.hidden =
                author.title === "";

            avatarRegion.replaceChildren();

            if (!global.Builder.has("avatar")) {
                throw new Error(
                    "Post requires the Avatar component."
                );
            }

            global.Builder.create(
                "avatar",
                {
                    name:
                        author.name,
                    src:
                        author.avatar,
                    href:
                        author.href,
                    size:
                        "medium",
                }
            ).appendTo(
                avatarRegion
            );

            if (timestampDate === null) {
                global.Builder.text(
                    timestampRegion,
                    ""
                );

                timestampRegion.removeAttribute(
                    "datetime"
                );

                timestampRegion.removeAttribute(
                    "title"
                );
            } else {
                timestampRegion.setAttribute(
                    "datetime",
                    timestampDate.toISOString()
                );

                timestampRegion.setAttribute(
                    "title",
                    timestampDate.toLocaleString()
                );

                global.Builder.text(
                    timestampRegion,
                    timestampDate.toLocaleString()
                );

                this.initializeTimeago(
                    timestampRegion
                );
            }

            timestampRegion.hidden =
                timestamp === "";

            global.Builder.text(
                statusRegion,
                status
            );

            statusRegion.dataset.postStatus =
                status
                    .trim()
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]+/g,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        ""
                    );

            statusRegion.hidden =
                status === "";

            categoriesRegion.replaceChildren();

            categories.forEach(
                function (category) {
                    const item =
                        document.createElement(
                            "span"
                        );

                    item.classList.add(
                        "app-post-category"
                    );

                    global.Builder.text(
                        item,
                        category
                    );

                    categoriesRegion.append(
                        item
                    );
                }
            );

            categoriesRegion.hidden =
                categories.length === 0;

            global.Builder.html(
                contentRegion,
                content
            );

            contentRegion.hidden =
                content === "";

            attachmentsRegion.replaceChildren();

            attachments.forEach(
                (attachment) => {
                    attachmentsRegion.append(
                        this.createAttachmentElement(
                            attachment
                        )
                    );
                }
            );

            attachmentsRegion.hidden =
                attachments.length === 0;

            const menuItems =
                [];

            if (
                editControlVisible
                && typeof onEdit === "function"
            ) {
                menuItems.push({
                    label:
                        "Edit",
                    callback:
                        () => {
                            onEdit(
                                this
                            );
                        },
                });
            }

            if (
                deleteControlVisible
                && typeof onDelete === "function"
            ) {
                menuItems.push({
                    label:
                        "Delete",
                    callback:
                        () => {
                            onDelete(
                                this
                            );
                        },
                });
            }

            if (
                archiveControlVisible
                && typeof onArchive === "function"
            ) {
                menuItems.push({
                    label:
                        "Archive",
                    callback:
                        () => {
                            onArchive(
                                this
                            );
                        },
                });
            }

            this.destroyMenuDropdown();

            menuRegion.replaceChildren();

            if (menuItems.length > 0) {
                menuRegion.append(
                    this.createMenuDropdown(
                        menuItems
                    )
                );
            }

            menuRegion.hidden =
                menuItems.length === 0;

            const actionButtons =
                [];

            if (
                likeControlVisible
                && typeof onLike === "function"
            ) {
                actionButtons.push({
                    label:
                        likeCount === null
                            ? "Like"
                            : "Like " + likeCount,
                    icon:
                        liked
                            ? POST_ICONS.likeFilled
                            : POST_ICONS.like,
                    variant:
                        "link",
                    size:
                        "small",
                    callback:
                        () => {
                            this.toggleLiked();

                            onLike(
                                this
                            );
                        },
                });
            }

            if (
                shareControlVisible
                && typeof onShare === "function"
            ) {
                actionButtons.push({
                    label:
                        shareCount === null
                            ? "Share"
                            : "Share " + shareCount,
                    icon:
                        shared
                            ? POST_ICONS.shareFilled
                            : POST_ICONS.share,
                    variant:
                        "link",
                    size:
                        "small",
                    callback:
                        () => {
                            this.toggleShared();

                            onShare(
                                this
                            );
                        },
                });
            }

            if (commentsControlVisible) {
                actionButtons.push({
                    label:
                        commentCount === null
                            ? "Comments"
                            : "Comments " + commentCount,
                    icon:
                        POST_ICONS.comments,
                    variant:
                        "link",
                    size:
                        "small",
                    callback:
                        () => {
                            if (this.config("commentsVisible") === true) {
                                this.hideComments();

                                return;
                            }

                            if (typeof onViewComments === "function") {
                                onViewComments(
                                    this
                                );
                            }

                            this.showComments();
                        },
                });
            }

            this.destroyActionButtonGroup();

            actionsRegion.replaceChildren();

            if (actionButtons.length > 0) {
                actionsRegion.append(
                    this.createActionButtonGroup(
                        actionButtons
                    )
                );
            }

            actionsRegion.hidden =
                actionButtons.length === 0;

            this.destroyCommentsComponent();

            commentsRegion.replaceChildren();

            commentsRegion.append(
                this.createCommentsComponent(
                    comments,
                    commentsConfig
                )
            );

            if (this.commentsCollapseComponent === null) {
                throw new Error(
                    "Post Comments Collapse component is missing."
                );
            }

            this.commentsCollapseComponent.config(
                "collapsed",
                !commentsVisible
            );

            this.commentsCollapseComponent.refresh();

            return this;
        }

        static defaults() {
            return {
                author: {
                    name: "",
                    avatar: "",
                    title: "",
                    href: "",
                },
                timestamp: "",
                content: "",
                categories: [],
                status: "",
                attachments: [],
                editControlVisible: false,
                deleteControlVisible: false,
                archiveControlVisible: false,
                likeControlVisible: false,
                shareControlVisible: false,
                commentsControlVisible: false,
                liked: false,
                shared: false,
                likeCount: null,
                shareCount: null,
                commentCount: null,
                commentsVisible: false,
                comments: [],
                commentsConfig: {},
                onEdit: null,
                onDelete: null,
                onArchive: null,
                onLike: null,
                onShare: null,
                onViewComments: null,
            };
        }
    }

    global.Builder.register(
        "post",
        Post,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

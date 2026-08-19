(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Comment."
        );
    }

    function normalizeAuthor(value) {
        if (
            value === null
            || typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Comment author must be an object."
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


    const COMMENT_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        like: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>',
            "</svg>",
        ].join(""),
        likeFilled: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a10 10 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733q.086.18.138.363c.077.27.113.567.113.856s-.036.586-.113.856c-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.2 3.2 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16H8c-.605 0-1.07-.081-1.466-.218a4.8 4.8 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"/>',
            "</svg>",
        ].join(""),
        dislike: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856s-.036.586-.113.856c-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a10 10 0 0 1-.443-.05 9.36 9.36 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.868-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a9 9 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581s-.027-.414-.075-.581c-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.2 2.2 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.9.9 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1"/>',
            "</svg>",
        ].join(""),
        dislikeFilled: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M6.956 14.534c.065.936.952 1.659 1.908 1.42l.261-.065a1.38 1.38 0 0 0 1.012-.965c.22-.816.533-2.512.062-4.51q.205.03.443.051c.713.065 1.669.071 2.516-.211.518-.173.994-.68 1.2-1.272a1.9 1.9 0 0 0-.234-1.734c.058-.118.103-.242.138-.362.077-.27.113-.568.113-.856 0-.29-.036-.586-.113-.857a2 2 0 0 0-.16-.403c.169-.387.107-.82-.003-1.149a3.2 3.2 0 0 0-.488-.9c.054-.153.076-.313.076-.465a1.86 1.86 0 0 0-.253-.912C13.1.757 12.437.28 11.5.28H8c-.605 0-1.07.08-1.466.217a4.8 4.8 0 0 1-.97.485l-.048.029c-.504.308-.999.61-2.068.723C2.682 1.815 2 2.434 2 3.279v4c0 .851.685 1.433 1.357 1.616.849.232 1.574.787 2.132 1.41.56.626.914 1.28 1.039 1.638.199.575.356 1.54.428 2.591"/>',
            "</svg>",
        ].join(""),
        reply: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.7 8.7 0 0 0-1.921-.306 7 7 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254l-.042-.028a.147.147 0 0 1 0-.252l.042-.028zM7.8 10.386q.103 0 .223.006c.434.02 1.034.086 1.7.271 1.326.368 2.896 1.202 3.94 3.08a.5.5 0 0 0 .933-.305c-.464-3.71-1.886-5.662-3.46-6.66-1.245-.79-2.527-.942-3.336-.971v-.66a1.144 1.144 0 0 0-1.767-.96l-3.994 2.94a1.147 1.147 0 0 0 0 1.946l3.994 2.94a1.144 1.144 0 0 0 1.767-.96z"/>',
            "</svg>",
        ].join(""),
    });

    class Comment extends global.Component {
        constructor(config) {
            super(config);

            this.menuDropdown =
                null;

            this.actionButtonGroup =
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
                    "Comment liked state must be a boolean."
                );
            }

            this.config(
                "liked",
                liked
            );

            if (liked) {
                this.config(
                    "disliked",
                    false
                );
            }

            this.refresh();

            return this;
        }

        setDisliked(disliked) {
            if (typeof disliked !== "boolean") {
                throw new TypeError(
                    "Comment disliked state must be a boolean."
                );
            }

            this.config(
                "disliked",
                disliked
            );

            if (disliked) {
                this.config(
                    "liked",
                    false
                );
            }

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

        dislike() {
            return this.setDisliked(
                true
            );
        }

        undislike() {
            return this.setDisliked(
                false
            );
        }

        toggleLiked() {
            return this.setLiked(
                this.config("liked") !== true
            );
        }

        toggleDisliked() {
            return this.setDisliked(
                this.config("disliked") !== true
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
                    "Comment like count must be null or a non-negative integer."
                );
            }

            this.config(
                "likeCount",
                count
            );

            this.refresh();

            return this;
        }

        setDislikeCount(count) {
            if (
                count !== null
                && (
                    !Number.isInteger(count)
                    || count < 0
                )
            ) {
                throw new TypeError(
                    "Comment dislike count must be null or a non-negative integer."
                );
            }

            this.config(
                "dislikeCount",
                count
            );

            this.refresh();

            return this;
        }

        showReplyControl() {
            return this.setControlVisible(
                "replyControlVisible",
                true
            );
        }

        hideReplyControl() {
            return this.setControlVisible(
                "replyControlVisible",
                false
            );
        }

        toggleReplyControl() {
            return this.toggleControlVisible(
                "replyControlVisible"
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

        setControlVisible(
            option,
            visible
        ) {
            const options = [
                "editControlVisible",
                "deleteControlVisible",
                "likeControlVisible",
                "replyControlVisible",
            ];

            if (
                typeof option !== "string"
                || !options.includes(option)
            ) {
                throw new TypeError(
                    "Comment control option is invalid."
                );
            }

            if (typeof visible !== "boolean") {
                throw new TypeError(
                    "Comment control visibility must be a boolean."
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

        createActionButtonGroup(buttons) {
            if (!global.Builder.has("button-group")) {
                throw new Error(
                    "Comment direct actions require the Button Group component."
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
                    "Comment action Button Group did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-comment-action-button-group"
            );

            this.actionButtonGroup =
                group;

            return element;
        }

        createMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Comment overflow actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            COMMENT_ICONS.menu,
                        triggerTitle:
                            "Comment actions",
                        items:
                            items,
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Comment action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-comment-action-dropdown"
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

        beforeDestroy() {
            const element =
                this.element();

            if (
                this.isTimeagoAvailable()
                && element instanceof HTMLElement
            ) {
                const timestamp =
                    element.querySelector(
                        '[data-comment-region="timestamp"]'
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
        }

        render() {
            const comment =
                document.createElement(
                    "article"
                );

            const avatar =
                document.createElement(
                    "div"
                );

            const main =
                document.createElement(
                    "div"
                );

            const header =
                document.createElement(
                    "div"
                );

            const identity =
                document.createElement(
                    "div"
                );

            const author =
                document.createElement(
                    "span"
                );

            const title =
                document.createElement(
                    "span"
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

            const content =
                document.createElement(
                    "div"
                );

            const actions =
                document.createElement(
                    "div"
                );

            comment.classList.add(
                "app-comment"
            );

            avatar.classList.add(
                "app-comment-avatar"
            );

            main.classList.add(
                "app-comment-main"
            );

            header.classList.add(
                "app-comment-header"
            );

            identity.classList.add(
                "app-comment-identity"
            );

            author.classList.add(
                "app-comment-author"
            );

            title.classList.add(
                "app-comment-author-title"
            );

            timestamp.classList.add(
                "app-comment-timestamp"
            );

            status.classList.add(
                "app-comment-status"
            );

            menu.classList.add(
                "app-comment-menu"
            );

            content.classList.add(
                "app-comment-content"
            );

            actions.classList.add(
                "app-comment-actions"
            );

            avatar.setAttribute(
                "data-comment-region",
                "avatar"
            );

            author.setAttribute(
                "data-comment-region",
                "author"
            );

            title.setAttribute(
                "data-comment-region",
                "title"
            );

            timestamp.setAttribute(
                "data-comment-region",
                "timestamp"
            );

            status.setAttribute(
                "data-comment-region",
                "status"
            );

            menu.setAttribute(
                "data-comment-region",
                "menu"
            );

            content.setAttribute(
                "data-comment-region",
                "content"
            );

            actions.setAttribute(
                "data-comment-region",
                "actions"
            );

            identity.append(
                author,
                title
            );

            header.append(
                identity,
                timestamp,
                status,
                menu
            );

            main.append(
                header,
                content,
                actions
            );

            comment.append(
                avatar,
                main
            );

            this.update(
                comment
            );

            return comment;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Comment update requires an HTMLElement."
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

            const status =
                this.config(
                    "status"
                );

            const editControlVisible =
                this.config(
                    "editControlVisible"
                );

            const deleteControlVisible =
                this.config(
                    "deleteControlVisible"
                );

            const likeControlVisible =
                this.config(
                    "likeControlVisible"
                );

            const replyControlVisible =
                this.config(
                    "replyControlVisible"
                );

            const liked =
                this.config(
                    "liked"
                );

            const disliked =
                this.config(
                    "disliked"
                );

            const likeCount =
                this.config(
                    "likeCount"
                );

            const dislikeCount =
                this.config(
                    "dislikeCount"
                );

            const onEdit =
                this.config("onEdit");

            const onDelete =
                this.config("onDelete");

            const onLike =
                this.config("onLike");

            const onDislike =
                this.config("onDislike");

            const onReply =
                this.config("onReply");

            if (typeof timestamp !== "string") {
                throw new TypeError(
                    "Comment timestamp must be a string."
                );
            }

            const timestampDate =
                timestamp === ""
                    ? null
                    : new Date(timestamp);

            if (
                timestampDate !== null
                && Number.isNaN(
                    timestampDate.getTime()
                )
            ) {
                throw new TypeError(
                    "Comment timestamp must be a valid datetime string."
                );
            }

            if (typeof content !== "string") {
                throw new TypeError(
                    "Comment content must be a string."
                );
            }

            if (typeof status !== "string") {
                throw new TypeError(
                    "Comment status must be a string."
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
                    "likeControlVisible",
                    likeControlVisible,
                ],
                [
                    "replyControlVisible",
                    replyControlVisible,
                ],
                [
                    "liked",
                    liked,
                ],
                [
                    "disliked",
                    disliked,
                ],
            ].forEach(function (entry) {
                if (typeof entry[1] !== "boolean") {
                    throw new TypeError(
                        "Comment "
                        + entry[0]
                        + " must be a boolean."
                    );
                }
            });

            [
                [
                    "likeCount",
                    likeCount,
                ],
                [
                    "dislikeCount",
                    dislikeCount,
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
                        "Comment "
                        + entry[0]
                        + " must be null or a non-negative integer."
                    );
                }
            });

            if (liked && disliked) {
                throw new TypeError(
                    "Comment cannot be liked and disliked at the same time."
                );
            }

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
                    "onLike",
                    onLike,
                ],
                [
                    "onDislike",
                    onDislike,
                ],
                [
                    "onReply",
                    onReply,
                ],
            ].forEach(function (entry) {
                if (
                    entry[1] !== null
                    && typeof entry[1] !== "function"
                ) {
                    throw new TypeError(
                        "Comment "
                        + entry[0]
                        + " must be a function or null."
                    );
                }
            });

            this.config(
                "author",
                author
            );

            const avatarRegion =
                element.querySelector(
                    '[data-comment-region="avatar"]'
                );

            const authorRegion =
                element.querySelector(
                    '[data-comment-region="author"]'
                );

            const titleRegion =
                element.querySelector(
                    '[data-comment-region="title"]'
                );

            const timestampRegion =
                element.querySelector(
                    '[data-comment-region="timestamp"]'
                );

            const statusRegion =
                element.querySelector(
                    '[data-comment-region="status"]'
                );

            const menuRegion =
                element.querySelector(
                    '[data-comment-region="menu"]'
                );

            const contentRegion =
                element.querySelector(
                    '[data-comment-region="content"]'
                );

            const actionsRegion =
                element.querySelector(
                    '[data-comment-region="actions"]'
                );

            if (
                !(avatarRegion instanceof HTMLElement)
                || !(authorRegion instanceof HTMLElement)
                || !(titleRegion instanceof HTMLElement)
                || !(timestampRegion instanceof HTMLElement)
                || !(statusRegion instanceof HTMLElement)
                || !(menuRegion instanceof HTMLElement)
                || !(contentRegion instanceof HTMLElement)
                || !(actionsRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Comment rendered regions are missing."
                );
            }

            authorRegion.replaceChildren();

            if (author.href !== "") {
                const link =
                    document.createElement(
                        "a"
                    );

                link.classList.add(
                    "app-comment-author-link"
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

            global.Builder.text(
                statusRegion,
                status
            );

            titleRegion.hidden =
                author.title === "";

            timestampRegion.hidden =
                timestamp === "";

            statusRegion.hidden =
                status === "";

            avatarRegion.replaceChildren();

            if (!global.Builder.has("avatar")) {
                throw new Error(
                    "Comment requires the Avatar component."
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
                        "small",
                }
            ).appendTo(
                avatarRegion
            );

            global.Builder.html(
                contentRegion,
                content
            );

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
                            ? COMMENT_ICONS.likeFilled
                            : COMMENT_ICONS.like,
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
                likeControlVisible
                && typeof onDislike === "function"
            ) {
                actionButtons.push({
                    label:
                        dislikeCount === null
                            ? "Dislike"
                            : "Dislike " + dislikeCount,
                    icon:
                        disliked
                            ? COMMENT_ICONS.dislikeFilled
                            : COMMENT_ICONS.dislike,
                    variant:
                        "link",
                    size:
                        "small",
                    callback:
                        () => {
                            this.toggleDisliked();

                            onDislike(
                                this
                            );
                        },
                });
            }

            if (
                replyControlVisible
                && typeof onReply === "function"
            ) {
                actionButtons.push({
                    label:
                        "Reply",
                    icon:
                        COMMENT_ICONS.reply,
                    variant:
                        "link",
                    size:
                        "small",
                    callback:
                        () => {
                            onReply(
                                this
                            );
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
                status: "",
                editControlVisible: false,
                deleteControlVisible: false,
                likeControlVisible: false,
                replyControlVisible: false,
                liked: false,
                disliked: false,
                likeCount: null,
                dislikeCount: null,
                onEdit: null,
                onDelete: null,
                onLike: null,
                onDislike: null,
                onReply: null,
            };
        }
    }

    global.Builder.register(
        "comment",
        Comment,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

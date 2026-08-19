(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Comments."
        );
    }

    const COMMENTS_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
    });

    function normalizeActions(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Comments actions must be an array."
            );
        }

        return value.map(function (action) {
            if (
                action === null
                || typeof action !== "object"
                || Array.isArray(action)
            ) {
                throw new TypeError(
                    "Comments action configuration is invalid."
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

            const href =
                typeof action.href === "string"
                    ? action.href
                    : "";

            const callback =
                typeof action.callback === "function"
                    ? action.callback
                    : null;

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "Comments actions require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Comments actions require href or callback."
                );
            }

            return {
                label: label,
                icon: icon,
                href: href,
                disabled:
                    action.disabled === true,
                callback: callback,
            };
        });
    }

    function normalizeComments(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Comments comments must be an array."
            );
        }

        const ids =
            new Set();

        function normalizeComment(comment) {
            if (
                comment === null
                || typeof comment !== "object"
                || Array.isArray(comment)
            ) {
                throw new TypeError(
                    "Comments comment configuration is invalid."
                );
            }

            const id =
                typeof comment.id === "string"
                    ? comment.id.trim()
                    : "";

            if (id === "") {
                throw new TypeError(
                    "Comments entries require a non-empty id."
                );
            }

            if (ids.has(id)) {
                throw new TypeError(
                    "Comments entry ids must be unique."
                );
            }

            ids.add(id);

            const replies =
                comment.replies === undefined
                    ? []
                    : comment.replies;

            if (!Array.isArray(replies)) {
                throw new TypeError(
                    "Comments replies must be an array."
                );
            }

            const replyCount =
                comment.replyCount === undefined
                    ? replies.length
                    : comment.replyCount;

            if (
                !Number.isInteger(replyCount)
                || replyCount < 0
            ) {
                throw new TypeError(
                    "Comments replyCount must be a non-negative integer."
                );
            }

            if (replyCount < replies.length) {
                throw new TypeError(
                    "Comments replyCount cannot be smaller than the loaded replies count."
                );
            }

            const config =
                Object.assign(
                    {},
                    comment
                );

            delete config.id;
            delete config.replies;
            delete config.replyCount;

            return {
                id: id,
                config: config,
                replyCount: replyCount,
                replies:
                    replies.map(
                        normalizeComment
                    ),
            };
        }

        return value.map(
            normalizeComment
        );
    }

    class Comments extends global.Component {
        constructor(config) {
            super(config);

            this.commentComponents =
                [];

            this.actionDropdown =
                null;

            this.expandedReplyIds =
                new Set();

            this.replyButtonComponents =
                [];

        }

        showReplies(id) {
            if (
                typeof id !== "string"
                || id.trim() === ""
            ) {
                throw new TypeError(
                    "Comments comment id must be a non-empty string."
                );
            }

            this.expandedReplyIds.add(
                id
            );

            this.refresh();

            return this;
        }

        hideReplies(id) {
            if (
                typeof id !== "string"
                || id.trim() === ""
            ) {
                throw new TypeError(
                    "Comments comment id must be a non-empty string."
                );
            }

            this.expandedReplyIds.delete(
                id
            );

            this.refresh();

            return this;
        }

        toggleReplies(id) {
            return this.expandedReplyIds.has(
                id
            )
                ? this.hideReplies(id)
                : this.showReplies(id);
        }

        removeComment(id) {
            if (
                typeof id !== "string"
                || id.trim() === ""
            ) {
                throw new TypeError(
                    "Comments comment id must be a non-empty string."
                );
            }

            const cloneTree =
                function (comments) {
                    return comments.map(
                        function (entry) {
                            const clone =
                                Object.assign(
                                    {},
                                    entry
                                );

                            clone.replies =
                                Array.isArray(
                                    entry.replies
                                )
                                    ? cloneTree(
                                        entry.replies
                                    )
                                    : [];

                            return clone;
                        }
                    );
                };

            const nextComments =
                cloneTree(
                    this.config(
                        "comments"
                    )
                );

            if (
                !this.removeCommentEntry(
                    nextComments,
                    id
                )
            ) {
                return this;
            }

            this.config(
                "comments",
                nextComments
            );

            this.refresh();

            return this;
        }
        removeCommentEntry(
            comments,
            id
        ) {
            for (
                let index = 0;
                index < comments.length;
                index += 1
            ) {
                const comment =
                    comments[index];

                if (
                    comment !== null
                    && typeof comment === "object"
                    && !Array.isArray(comment)
                ) {
                    if (comment.id === id) {
                        comments.splice(
                            index,
                            1
                        );

                        return true;
                    }

                    if (
                        Array.isArray(comment.replies)
                        && this.removeCommentEntry(
                            comment.replies,
                            id
                        )
                    ) {
                        return true;
                    }
                }
            }

            return false;
        }

        addComment(
            comment,
            parentId = null
        ) {
            if (
                comment === null
                || typeof comment !== "object"
                || Array.isArray(comment)
            ) {
                throw new TypeError(
                    "Comments new comment must be an object."
                );
            }

            if (
                parentId !== null
                && (
                    typeof parentId !== "string"
                    || parentId.trim() === ""
                )
            ) {
                throw new TypeError(
                    "Comments parent id must be a non-empty string or null."
                );
            }

            const cloneTree =
                function (comments) {
                    return comments.map(
                        function (entry) {
                            const clone =
                                Object.assign(
                                    {},
                                    entry
                                );

                            clone.replies =
                                Array.isArray(
                                    entry.replies
                                )
                                    ? cloneTree(
                                        entry.replies
                                    )
                                    : [];

                            return clone;
                        }
                    );
                };

            const nextComments =
                cloneTree(
                    this.config(
                        "comments"
                    )
                );

            const nextComment =
                cloneTree(
                    [
                        comment,
                    ]
                )[0];

            if (parentId === null) {
                nextComments.push(
                    nextComment
                );
            } else {
                const parent =
                    this.findCommentEntry(
                        nextComments,
                        parentId
                    );

                if (parent === null) {
                    throw new Error(
                        "Comments parent comment was not found."
                    );
                }

                if (!Array.isArray(parent.replies)) {
                    parent.replies =
                        [];
                }

                parent.replies.push(
                    nextComment
                );
            }

            normalizeComments(
                nextComments
            );

            this.config(
                "comments",
                nextComments
            );

            this.refresh();

            return this;
        }

        findCommentEntry(
            comments,
            id
        ) {
            if (!Array.isArray(comments)) {
                return null;
            }

            for (const comment of comments) {
                if (
                    comment !== null
                    && typeof comment === "object"
                    && !Array.isArray(comment)
                ) {
                    if (comment.id === id) {
                        return comment;
                    }

                    const found =
                        this.findCommentEntry(
                            comment.replies,
                            id
                        );

                    if (found !== null) {
                        return found;
                    }
                }
            }

            return null;
        }

        setActions(actions) {
            normalizeActions(
                actions
            );

            this.config(
                "actions",
                actions
            );

            this.refresh();

            return this;
        }

        setEmptyMessage(message) {
            if (typeof message !== "string") {
                throw new TypeError(
                    "Comments empty message must be a string."
                );
            }

            this.config(
                "emptyMessage",
                message
            );

            this.refresh();

            return this;
        }

        setTitle(title) {
            if (typeof title !== "string") {
                throw new TypeError(
                    "Comments title must be a string."
                );
            }

            this.config(
                "title",
                title
            );

            this.refresh();

            return this;
        }

        showTitle() {
            this.config(
                "titleVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideTitle() {
            this.config(
                "titleVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleTitle() {
            return this.config(
                "titleVisible"
            ) === true
                ? this.hideTitle()
                : this.showTitle();
        }

        setComments(comments) {
            normalizeComments(
                comments
            );

            this.config(
                "comments",
                comments
            );

            this.refresh();

            return this;
        }

        clearComments() {
            return this.setComments(
                []
            );
        }

        setMaxIndentDepth(depth) {
            if (
                !Number.isInteger(depth)
                || depth < 0
            ) {
                throw new TypeError(
                    "Comments max indentation depth must be a non-negative integer."
                );
            }

            this.config(
                "maxIndentDepth",
                depth
            );

            this.refresh();

            return this;
        }

        enableIndentation() {
            this.config(
                "indentationEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableIndentation() {
            this.config(
                "indentationEnabled",
                false
            );

            this.refresh();

            return this;
        }

        toggleIndentation() {
            return this.config(
                "indentationEnabled"
            ) === true
                ? this.disableIndentation()
                : this.enableIndentation();
        }

        show() {
            this.config(
                "visible",
                true
            );

            this.refresh();

            return this;
        }

        hide() {
            this.config(
                "visible",
                false
            );

            this.refresh();

            return this;
        }

        toggle() {
            return this.config(
                "visible"
            ) === true
                ? this.hide()
                : this.show();
        }

        render() {
            const root =
                document.createElement(
                    "section"
                );

            const header =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "h3"
                );

            const actions =
                document.createElement(
                    "div"
                );

            const items =
                document.createElement(
                    "div"
                );

            const empty =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-comments"
            );

            header.classList.add(
                "app-comments-header"
            );

            title.classList.add(
                "app-comments-title"
            );

            actions.classList.add(
                "app-comments-actions"
            );

            items.classList.add(
                "app-comments-items"
            );

            empty.classList.add(
                "app-comments-empty"
            );

            title.setAttribute(
                "data-comments-region",
                "title"
            );

            actions.setAttribute(
                "data-comments-region",
                "actions"
            );

            items.setAttribute(
                "data-comments-region",
                "items"
            );

            empty.setAttribute(
                "data-comments-region",
                "empty"
            );

            header.append(
                title,
                actions
            );

            root.append(
                header,
                items,
                empty
            );

            this.update(
                root
            );

            return root;
        }

        createViewRepliesButton(
            entry
        ) {
            if (!global.Builder.has("button")) {
                throw new Error(
                    "Comments reply controls require the Button component."
                );
            }

            const expanded =
                this.expandedReplyIds.has(
                    entry.id
                );

            const button =
                global.Builder.create(
                    "button",
                    {
                        label:
                            expanded
                                ? "Hide replies"
                                : (
                                    "View "
                                    + entry.replyCount
                                    + (
                                        entry.replyCount === 1
                                            ? " reply"
                                            : " replies"
                                    )
                                ),
                        variant:
                            "link",
                        size:
                            "small",
                        callback:
                            () => {
                                if (expanded) {
                                    this.hideReplies(
                                        entry.id
                                    );

                                    return;
                                }

                                const callback =
                                    this.config(
                                        "onViewReply"
                                    );

                                if (
                                    typeof callback
                                    === "function"
                                ) {
                                    callback(
                                        entry.id,
                                        entry.replyCount,
                                        this
                                    );

                                    return;
                                }

                                if (
                                    entry.replies.length
                                    > 0
                                ) {
                                    this.showReplies(
                                        entry.id
                                    );
                                }
                            },
                    }
                );

            const element =
                button.element();

            if (!(element instanceof HTMLButtonElement)) {
                button.destroy();

                throw new Error(
                    "Comments reply Button did not render an HTMLButtonElement."
                );
            }

            element.classList.add(
                "app-comments-view-replies"
            );

            return {
                component: button,
                element: element,
            };
        }

        createCommentTree(
            entry,
            depth
        ) {
            if (!global.Builder.has("comment")) {
                throw new Error(
                    "Comments requires the Comment component."
                );
            }

            const item =
                document.createElement(
                    "div"
                );

            const replies =
                document.createElement(
                    "div"
                );

            const replyControl =
                document.createElement(
                    "div"
                );

            item.classList.add(
                "app-comments-item"
            );

            replies.classList.add(
                "app-comments-replies"
            );

            replyControl.classList.add(
                "app-comments-reply-control"
            );

            item.dataset.commentId =
                entry.id;

            item.dataset.commentDepth =
                String(depth);

            const indentDepth =
                Math.min(
                    depth,
                    this.config(
                        "maxIndentDepth"
                    )
                );

            item.dataset.commentIndentDepth =
                String(
                    indentDepth
                );

            item.style.setProperty(
                "--app-comments-indent-depth",
                String(
                    indentDepth
                )
            );

            const parentIndentDepth =
                Math.min(
                    Math.max(
                        depth - 1,
                        0
                    ),
                    this.config(
                        "maxIndentDepth"
                    )
                );

            item.classList.toggle(
                "is-indented-level",
                depth > 0
                && indentDepth
                    > parentIndentDepth
            );


            const comment =
                global.Builder.create(
                    "comment",
                    entry.config
                );

            comment.appendTo(
                item
            );

            this.commentComponents.push(
                comment
            );

            const expanded =
                this.expandedReplyIds.has(
                    entry.id
                );

            if (expanded) {
                entry.replies.forEach(
                    (reply) => {
                        replies.append(
                            this.createCommentTree(
                                reply,
                                depth + 1
                            )
                        );
                    }
                );
            }

            if (entry.replyCount > 0) {
                const control =
                    this.createViewRepliesButton(
                        entry
                    );

                this.replyButtonComponents.push(
                    control.component
                );

                replyControl.append(
                    control.element
                );
            }

            replies.hidden =
                !expanded
                || entry.replies.length === 0;

            replyControl.hidden =
                entry.replyCount === 0;

            item.append(
                replyControl,
                replies
            );

            return item;
        }

        createActionDropdown(actions) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Comments actions require the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            COMMENTS_ICONS.menu,
                        triggerTitle:
                            "Comments actions",
                        items:
                            actions,
                    }
                );

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Comments action Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-comments-action-dropdown"
            );

            this.actionDropdown =
                dropdown;

            return element;
        }

        destroyComments() {
            this.commentComponents.forEach(
                function (comment) {
                    if (
                        comment
                        && typeof comment.destroy
                            === "function"
                    ) {
                        comment.destroy();
                    }
                }
            );

            this.commentComponents =
                [];

            this.replyButtonComponents.forEach(
                function (button) {
                    if (
                        button
                        && typeof button.destroy
                            === "function"
                    ) {
                        button.destroy();
                    }
                }
            );

            this.replyButtonComponents =
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
            this.destroyComments();
            this.destroyActionDropdown();
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Comments update requires an HTMLElement."
                );
            }

            const comments =
                normalizeComments(
                    this.config("comments")
                );

            const title =
                this.config("title");

            const titleVisible =
                this.config(
                    "titleVisible"
                );

            const actions =
                normalizeActions(
                    this.config("actions")
                );

            const indentationEnabled =
                this.config(
                    "indentationEnabled"
                );

            const maxIndentDepth =
                this.config(
                    "maxIndentDepth"
                );

            const emptyMessage =
                this.config(
                    "emptyMessage"
                );

            const visible =
                this.config("visible");

            const onViewReply =
                this.config(
                    "onViewReply"
                );

            if (typeof title !== "string") {
                throw new TypeError(
                    "Comments title must be a string."
                );
            }

            if (typeof titleVisible !== "boolean") {
                throw new TypeError(
                    "Comments titleVisible must be a boolean."
                );
            }

            if (typeof indentationEnabled !== "boolean") {
                throw new TypeError(
                    "Comments indentationEnabled must be a boolean."
                );
            }

            if (
                !Number.isInteger(maxIndentDepth)
                || maxIndentDepth < 0
            ) {
                throw new TypeError(
                    "Comments maxIndentDepth must be a non-negative integer."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "Comments emptyMessage must be a string."
                );
            }

            if (typeof visible !== "boolean") {
                throw new TypeError(
                    "Comments visible must be a boolean."
                );
            }

            if (
                onViewReply !== null
                && typeof onViewReply !== "function"
            ) {
                throw new TypeError(
                    "Comments onViewReply must be a function or null."
                );
            }

            const titleRegion =
                element.querySelector(
                    '[data-comments-region="title"]'
                );

            const actionsRegion =
                element.querySelector(
                    '[data-comments-region="actions"]'
                );

            const itemsRegion =
                element.querySelector(
                    '[data-comments-region="items"]'
                );

            const emptyRegion =
                element.querySelector(
                    '[data-comments-region="empty"]'
                );

            if (
                !(titleRegion instanceof HTMLElement)
                || !(actionsRegion instanceof HTMLElement)
                || !(itemsRegion instanceof HTMLElement)
                || !(emptyRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Comments rendered regions are missing."
                );
            }

            global.Builder.text(
                titleRegion,
                title
            );

            titleRegion.hidden =
                title === ""
                || !titleVisible;

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

            element.hidden =
                !visible;

            element.classList.toggle(
                "is-indented",
                indentationEnabled
            );

            element.style.setProperty(
                "--app-comments-max-indent-depth",
                String(maxIndentDepth)
            );

            this.destroyComments();

            itemsRegion.replaceChildren();

            comments.forEach(
                (entry) => {
                    itemsRegion.append(
                        this.createCommentTree(
                            entry,
                            0
                        )
                    );
                }
            );

            global.Builder.text(
                emptyRegion,
                emptyMessage
            );

            emptyRegion.hidden =
                comments.length > 0;

            itemsRegion.hidden =
                comments.length === 0;

            return this;
        }

        static defaults() {
            return {
                title: "Comments",
                titleVisible: false,
                comments: [],
                actions: [],
                indentationEnabled: true,
                maxIndentDepth: 4,
                emptyMessage: "No comments yet.",
                visible: true,
                onViewReply: null,
            };
        }
    }

    global.Builder.register(
        "comments",
        Comments,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

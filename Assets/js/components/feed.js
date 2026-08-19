(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Feed."
        );
    }

    function normalizePosts(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Feed posts must be an array."
            );
        }

        return value.map(function (post) {
            if (
                post === null
                || typeof post !== "object"
                || Array.isArray(post)
            ) {
                throw new TypeError(
                    "Feed post configuration is invalid."
                );
            }

            return Object.assign(
                {},
                post
            );
        });
    }

    class Feed extends global.Component {
        constructor(config) {
            super(config);

            this.postComponents = [];
            this.searchQuery = "";

            this.handleSearchInput =
                this.handleSearchInput.bind(this);
        }

        destroyPosts() {
            this.postComponents.forEach(
                function (post) {
                    if (
                        post
                        && typeof post.destroy === "function"
                    ) {
                        post.destroy();
                    }
                }
            );

            this.postComponents = [];

            return this;
        }

        beforeDestroy() {
            const element =
                this.element();

            if (element instanceof Element) {
                const searchInput =
                    element.querySelector(
                        '[data-feed-region="search-input"]'
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

            this.destroyPosts();
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

        render() {
            const feed =
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

            const posts =
                document.createElement(
                    "div"
                );

            const empty =
                document.createElement(
                    "div"
                );

            feed.classList.add(
                "app-feed"
            );

            search.classList.add(
                "app-feed-search"
            );

            searchInput.type =
                "search";

            searchInput.classList.add(
                "app-feed-search-input"
            );

            posts.classList.add(
                "app-feed-posts"
            );

            empty.classList.add(
                "app-feed-empty"
            );

            search.setAttribute(
                "data-feed-region",
                "search"
            );

            searchInput.setAttribute(
                "data-feed-region",
                "search-input"
            );

            posts.setAttribute(
                "data-feed-region",
                "posts"
            );

            empty.setAttribute(
                "data-feed-region",
                "empty"
            );

            searchInput.addEventListener(
                "input",
                this.handleSearchInput
            );

            search.append(
                searchInput
            );

            feed.append(
                search,
                posts,
                empty
            );

            this.update(
                feed
            );

            return feed;
        }

        postMatchesSearch(post) {
            if (this.searchQuery === "") {
                return true;
            }

            const author =
                post.author !== null
                && typeof post.author === "object"
                && !Array.isArray(post.author)
                    ? post.author
                    : {};

            const categories =
                Array.isArray(post.categories)
                    ? post.categories
                    : [];

            const content =
                typeof post.content === "string"
                    ? post.content
                    : "";

            const contentDocument =
                new DOMParser().parseFromString(
                    content,
                    "text/html"
                );

            const searchableText = [
                typeof author.name === "string"
                    ? author.name
                    : "",
                typeof author.title === "string"
                    ? author.title
                    : "",
                contentDocument.body.textContent || "",
                ...categories.filter(
                    function (category) {
                        return typeof category === "string";
                    }
                ),
                typeof post.status === "string"
                    ? post.status
                    : "",
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                this.searchQuery
            );
        }

        setPosts(posts) {
            normalizePosts(
                posts
            );

            this.config(
                "posts",
                posts
            );

            this.refresh();

            return this;
        }

        addPost(post) {
            const normalized =
                normalizePosts(
                    [
                        post,
                    ]
                )[0];

            const posts =
                this.config(
                    "posts"
                ).slice();

            posts.push(
                normalized
            );

            this.config(
                "posts",
                posts
            );

            this.refresh();

            return this;
        }

        removePost(index) {
            if (
                !Number.isInteger(index)
                || index < 0
            ) {
                throw new TypeError(
                    "Feed post index must be a non-negative integer."
                );
            }

            const posts =
                this.config(
                    "posts"
                ).slice();

            if (index >= posts.length) {
                return this;
            }

            posts.splice(
                index,
                1
            );

            this.config(
                "posts",
                posts
            );

            this.refresh();

            return this;
        }

        clearPosts() {
            return this.setPosts(
                []
            );
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Feed update requires an HTMLElement."
                );
            }

            const posts =
                normalizePosts(
                    this.config(
                        "posts"
                    )
                );

            const searchEnabled =
                this.config(
                    "searchEnabled"
                );

            const searchPlaceholder =
                this.config(
                    "searchPlaceholder"
                );

            const emptyMessage =
                this.config(
                    "emptyMessage"
                );

            if (typeof searchEnabled !== "boolean") {
                throw new TypeError(
                    "Feed searchEnabled must be a boolean."
                );
            }

            if (typeof searchPlaceholder !== "string") {
                throw new TypeError(
                    "Feed searchPlaceholder must be a string."
                );
            }

            if (typeof emptyMessage !== "string") {
                throw new TypeError(
                    "Feed emptyMessage must be a string."
                );
            }

            this.config(
                "posts",
                posts
            );

            const searchRegion =
                element.querySelector(
                    '[data-feed-region="search"]'
                );

            const searchInput =
                element.querySelector(
                    '[data-feed-region="search-input"]'
                );

            const postsRegion =
                element.querySelector(
                    '[data-feed-region="posts"]'
                );

            const emptyRegion =
                element.querySelector(
                    '[data-feed-region="empty"]'
                );

            if (
                !(searchRegion instanceof HTMLElement)
                || !(searchInput instanceof HTMLInputElement)
                || !(postsRegion instanceof HTMLElement)
                || !(emptyRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Feed rendered regions are missing."
                );
            }

            searchRegion.hidden =
                !searchEnabled;

            searchInput.placeholder =
                searchPlaceholder;

            searchInput.value =
                this.searchQuery;

            global.Builder.text(
                emptyRegion,
                emptyMessage
            );

            if (!global.Builder.has("post")) {
                throw new Error(
                    "Feed requires the Post component."
                );
            }

            this.destroyPosts();

            postsRegion.replaceChildren();

            const visiblePosts =
                posts.filter(
                    (post) =>
                        this.postMatchesSearch(
                            post
                        )
                );

            visiblePosts.forEach(
                (config) => {
                    const post =
                        global.Builder.create(
                            "post",
                            config
                        );

                    post.appendTo(
                        postsRegion
                    );

                    this.postComponents.push(
                        post
                    );
                }
            );

            postsRegion.hidden =
                visiblePosts.length === 0;

            emptyRegion.hidden =
                visiblePosts.length > 0;

            return this;
        }

        static defaults() {
            return {
                posts: [],
                searchEnabled: true,
                searchPlaceholder:
                    "Search posts…",
                emptyMessage:
                    "No posts are available.",
            };
        }
    }

    global.Builder.register(
        "feed",
        Feed,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);

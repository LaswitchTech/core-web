(function (global) {
    "use strict";

    if (typeof global.Builder !== "function") {
        throw new Error(
            "Core-Web Builder must be loaded before Theme Preview."
        );
    }

    const VCARD_PREVIEW_ICONS = Object.freeze({
        email: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>',
            '<path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/>',
            "</svg>",
        ].join(""),
        phone: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>',
            "</svg>",
        ].join(""),
        address: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>',
            '<path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>',
            "</svg>",
        ].join(""),
        status: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/>',
            '<path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>',
            "</svg>",
        ].join(""),
    });

    const TABS_PREVIEW_ICONS = Object.freeze({
        overview: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M0 0h6v6H0zm10 0h6v6h-6zM0 10h6v6H0zm10 0h6v6h-6z"/>',
            "</svg>",
        ].join(""),
    });

    const DROPDOWN_PREVIEW_ICONS = Object.freeze({
        menu: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
            "</svg>",
        ].join(""),
        edit: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1-2-2 1-1a.5.5 0 0 1 .707 0zM13.5 4.207l-2-2L4 9.707V11.5h1.793z"/>',
            '<path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>',
            "</svg>",
        ].join(""),
    });

    const STEPPER_PREVIEW_ICONS = Object.freeze({
        account: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>',
            "</svg>",
        ].join(""),
        install: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M.5 9.9a.5.5 0 0 1 .5.5V12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.6a.5.5 0 0 1 1 0V12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-1.6a.5.5 0 0 1 .5-.5"/>',
            '<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>',
            "</svg>",
        ].join(""),
        next: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path fill-rule="evenodd" d="M6.646 3.646a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L10.293 8 6.646 4.354a.5.5 0 0 1 0-.708"/>',
            "</svg>",
        ].join(""),
        previous: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path fill-rule="evenodd" d="M9.354 3.646a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L5.707 8l3.647-3.646a.5.5 0 0 0 0-.708"/>',
            "</svg>",
        ].join(""),
    });

    const ALERT_PREVIEW_ICONS = Object.freeze({
        info: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>',
            "</svg>",
        ].join(""),
    });

    function createGroup(
        mount,
        id,
        title,
        description
    ) {
        const group =
            document.createElement(
                "section"
            );

        const heading =
            document.createElement(
                "h2"
            );

        const text =
            document.createElement(
                "p"
            );

        const content =
            document.createElement(
                "div"
            );

        group.classList.add(
            "dev-theme-preview-group"
        );

        group.id =
            "dev-preview-group-"
            + id;

        heading.classList.add(
            "dev-theme-preview-group-title"
        );

        text.classList.add(
            "dev-theme-preview-group-description"
        );

        content.classList.add(
            "dev-theme-preview-group-content"
        );

        global.Builder.text(
            heading,
            title
        );

        global.Builder.text(
            text,
            description
        );

        group.append(
            heading,
            text,
            content
        );

        mount.append(
            group
        );

        return content;
    }

    function createSection(
        mount,
        title,
        description,
        metadataVisible = true
    ) {
        const section =
            document.createElement(
                "section"
            );

        const headingRow =
            document.createElement(
                "div"
            );

        const heading =
            document.createElement(
                "h2"
            );

        const controls =
            document.createElement(
                "div"
            );

        const text =
            document.createElement(
                "p"
            );

        const examples =
            document.createElement(
                "div"
            );

        section.classList.add(
            "dev-theme-preview-section"
        );

        section.id =
            "dev-preview-"
            + title
                .toLowerCase()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-|-$/g,
                    ""
                );

        headingRow.classList.add(
            "dev-theme-preview-section-heading"
        );

        controls.classList.add(
            "dev-theme-preview-section-controls"
        );

        heading.classList.add(
            "dev-theme-preview-section-title"
        );

        text.classList.add(
            "dev-theme-preview-section-description"
        );

        examples.classList.add(
            "dev-theme-preview-examples"
        );

        global.Builder.text(
            heading,
            title
        );

        global.Builder.text(
            text,
            description
        );

        heading.hidden =
            metadataVisible !== true;

        text.hidden =
            metadataVisible !== true;

        headingRow.append(
            heading,
            controls
        );

        section.append(
            headingRow,
            text,
            examples
        );

        mount.append(
            section
        );

        return examples;
    }

    function appendSourceExample(
        examples,
        title,
        filename,
        language,
        source
    ) {
        if (
            !(examples instanceof Element)
            || !global.Builder.has(
                "code-block"
            )
        ) {
            return null;
        }

        const codeBlock =
            global.Builder.create(
                "code-block",
                {
                    title:
                        title,
                    filename:
                        filename,
                    language:
                        language,
                    code:
                        source,
                    lineNumbers:
                        true,
                    wrap:
                        true,
                    copyControlVisible:
                        true,
                    syntaxHighlighting:
                        true,
                }
            );

        codeBlock.appendTo(
            examples
        );

        return codeBlock;
    }

    function createToggleControl(
        examples,
        label,
        initialEnabled,
        callback
    ) {
        const section =
            examples.closest(
                ".dev-theme-preview-section"
            );

        if (!(section instanceof Element)) {
            return null;
        }

        const controls =
            section.querySelector(
                ".dev-theme-preview-section-controls"
            );

        if (!(controls instanceof Element)) {
            return null;
        }

        let enabled =
            initialEnabled === true;

        const button =
            global.Builder.create(
                "button",
                {
                    label:
                        label
                        + ": "
                        + (
                            enabled
                                ? "On"
                                : "Off"
                        ),
                    variant:
                        enabled
                            ? "primary"
                            : "secondary",
                    size:
                        "small",
                }
            );

        button.appendTo(
            controls
        );

        const element =
            button.element();

        if (!(element instanceof HTMLButtonElement)) {
            return button;
        }

        element.addEventListener(
            "click",
            function () {
                enabled = !enabled;

                button.config(
                    "label",
                    label
                    + ": "
                    + (
                        enabled
                            ? "On"
                            : "Off"
                    )
                );

                button.config(
                    "variant",
                    enabled
                        ? "primary"
                        : "secondary"
                );

                button.refresh();

                callback(
                    enabled
                );
            }
        );

        return button;
    }

    async function fetchDevSource(
        descriptor
    ) {
        if (
            descriptor === null
            || typeof descriptor !== "object"
            || Array.isArray(descriptor)
            || typeof descriptor.file !== "string"
            || descriptor.file === ""
        ) {
            throw new TypeError(
                "Developer source descriptor is invalid."
            );
        }

        const params =
            new URLSearchParams();

        params.set(
            "file",
            descriptor.file
        );

        if (
            typeof descriptor.startMarker === "string"
            && descriptor.startMarker !== ""
            && typeof descriptor.endMarker === "string"
            && descriptor.endMarker !== ""
        ) {
            params.set(
                "startMarker",
                descriptor.startMarker
            );

            params.set(
                "endMarker",
                descriptor.endMarker
            );
        }

        if (
            Number.isInteger(
                descriptor.startLine
            )
            && Number.isInteger(
                descriptor.endLine
            )
        ) {
            params.set(
                "startLine",
                String(
                    descriptor.startLine
                )
            );

            params.set(
                "endLine",
                String(
                    descriptor.endLine
                )
            );
        }

        const response =
            await fetch(
                "/admin/dev/source?"
                + params.toString(),
                {
                    headers: {
                        "X-Requested-With":
                            "XMLHttpRequest",
                    },
                }
            );

        const payload =
            await response.json();

        if (
            !response.ok
            || payload === null
            || typeof payload !== "object"
            || payload.success !== true
            || typeof payload.source !== "string"
        ) {
            throw new Error(
                payload !== null
                && typeof payload === "object"
                && typeof payload.message === "string"
                && payload.message !== ""
                    ? payload.message
                    : "Developer source could not be loaded."
            );
        }

        return payload.source;
    }

    function formatHtmlSource(
        element
    ) {
        if (!(element instanceof Element)) {
            throw new TypeError(
                "HTML source formatting requires an Element."
            );
        }

        const voidElements =
            new Set([
                "area",
                "base",
                "br",
                "col",
                "embed",
                "hr",
                "img",
                "input",
                "link",
                "meta",
                "param",
                "source",
                "track",
                "wbr",
            ]);

        const whitespaceSensitiveElements =
            new Set([
                "pre",
                "code",
                "textarea",
            ]);

        const indentation =
            function (level) {
                return "    ".repeat(
                    level
                );
            };

        const escapeText =
            function (value) {
                return value
                    .replace(
                        /&/g,
                        "&amp;"
                    )
                    .replace(
                        /</g,
                        "&lt;"
                    )
                    .replace(
                        />/g,
                        "&gt;"
                    );
            };

        const serializeNode =
            function (
                node,
                level
            ) {
                if (
                    node.nodeType
                    === Node.TEXT_NODE
                ) {
                    const value =
                        node.textContent
                        ?? "";

                    const normalized =
                        value
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();

                    if (normalized === "") {
                        return [];
                    }

                    return [
                        indentation(level)
                        + escapeText(
                            normalized
                        ),
                    ];
                }

                if (
                    node.nodeType
                    === Node.COMMENT_NODE
                ) {
                    return [
                        indentation(level)
                        + "<!--"
                        + node.data
                        + "-->",
                    ];
                }

                if (!(node instanceof Element)) {
                    return [];
                }

                const tagName =
                    node.localName
                        .toLowerCase();

                const shallowClone =
                    node.cloneNode(
                        false
                    );

                const serializedOpening =
                    shallowClone.outerHTML;

                const closingBracket =
                    serializedOpening.indexOf(
                        ">"
                    );

                const openingTag =
                    serializedOpening.slice(
                        0,
                        closingBracket + 1
                    );

                if (
                    voidElements.has(
                        tagName
                    )
                ) {
                    return [
                        indentation(level)
                        + openingTag,
                    ];
                }

                if (
                    whitespaceSensitiveElements.has(
                        tagName
                    )
                ) {
                    return [
                        indentation(level)
                        + openingTag
                        + node.innerHTML
                        + "</"
                        + tagName
                        + ">",
                    ];
                }

                const childNodes =
                    Array.from(
                        node.childNodes
                    );

                if (childNodes.length === 0) {
                    return [
                        indentation(level)
                        + openingTag
                        + "</"
                        + tagName
                        + ">",
                    ];
                }

                if (
                    childNodes.length === 1
                    && childNodes[0].nodeType
                        === Node.TEXT_NODE
                ) {
                    const text =
                        (
                            childNodes[0]
                                .textContent
                            ?? ""
                        )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();

                    return [
                        indentation(level)
                        + openingTag
                        + escapeText(
                            text
                        )
                        + "</"
                        + tagName
                        + ">",
                    ];
                }

                const lines = [
                    indentation(level)
                    + openingTag,
                ];

                childNodes.forEach(
                    function (childNode) {
                        lines.push(
                            ...serializeNode(
                                childNode,
                                level + 1
                            )
                        );
                    }
                );

                lines.push(
                    indentation(level)
                    + "</"
                    + tagName
                    + ">"
                );

                return lines;
            };

        const lines = [];

        Array.from(
            element.childNodes
        ).forEach(
            function (node) {
                lines.push(
                    ...serializeNode(
                        node,
                        0
                    )
                );
            }
        );

        return lines.join(
            "\n"
        );
    }

    async function resolveSourceContent(
        source
    ) {
        if (source instanceof Element) {
            return formatHtmlSource(
                source
            );
        }

        if (typeof source === "string") {
            return source;
        }

        if (
            source !== null
            && typeof source === "object"
            && !Array.isArray(source)
        ) {
            return fetchDevSource(
                source
            );
        }

        throw new TypeError(
            "Developer source content is invalid."
        );
    }

    function createSourceModal(
        title,
        sources
    ) {
        if (
            !global.Builder.has("modal")
            || !global.Builder.has("tabs")
            || !global.Builder.has("code-block")
        ) {
            return null;
        }

        if (
            sources === null
            || typeof sources !== "object"
            || Array.isArray(sources)
        ) {
            throw new TypeError(
                "Source modal sources must be an object."
            );
        }

        const createSourceBlock =
            function (
                filename,
                language
            ) {
                return global.Builder.create(
                    "code-block",
                    {
                        filename:
                            filename,
                        language:
                            language,
                        code:
                            "",
                    }
                );
            };

        const htmlBlock =
            createSourceBlock(
                sources.html.filename,
                "html"
            );

        const javascriptBlock =
            createSourceBlock(
                sources.javascript.filename,
                "javascript"
            );

        const cssBlock =
            createSourceBlock(
                sources.css.filename,
                "css"
            );

        const tabs =
            global.Builder.create(
                "tabs",
                {
                    tabs: [
                        {
                            id:
                                "html",
                            label:
                                "HTML",
                            content:
                                htmlBlock.element(),
                        },
                        {
                            id:
                                "javascript",
                            label:
                                "JavaScript",
                            content:
                                javascriptBlock.element(),
                        },
                        {
                            id:
                                "css",
                            label:
                                "CSS",
                            content:
                                cssBlock.element(),
                        },
                    ],
                    selectedTab:
                        "html",
                }
            );

        const modal =
            global.Builder.create(
                "modal",
                {
                    title:
                        title,
                    body:
                        tabs.element(),
                    size:
                        "xlarge",
                    closeControlVisible:
                        true,
                    fullscreenControlVisible:
                        true,
                    closeOnEscape:
                        true,
                    closeOnBackdrop:
                        true,
                }
            );

        modal.appendTo(
            document.body
        );

        const modalElement =
            modal.element();

        if (modalElement instanceof HTMLElement) {
            modalElement.classList.add(
                "dev-source-modal"
            );
        }

        return {
            open:
                async function () {
                    const resolvedSources =
                        await Promise.all([
                            resolveSourceContent(
                                sources.html.source
                            ),
                            resolveSourceContent(
                                sources.javascript.source
                            ),
                            resolveSourceContent(
                                sources.css.source
                            ),
                        ]);

                    htmlBlock.config(
                        "code",
                        resolvedSources[0]
                    );

                    htmlBlock.refresh();

                    javascriptBlock.config(
                        "code",
                        resolvedSources[1]
                    );

                    javascriptBlock.refresh();

                    cssBlock.config(
                        "code",
                        resolvedSources[2]
                    );

                    cssBlock.refresh();

                    modal.open();
                },
        };
    }

    function createPreviewCard(
        mount,
        title,
        subtitle,
        content,
        sourceModal,
        footerStart = null
    ) {
        if (!(mount instanceof Element)) {
            throw new TypeError(
                "Preview Card mount must be an Element."
            );
        }

        if (typeof title !== "string") {
            throw new TypeError(
                "Preview Card title must be a string."
            );
        }

        if (typeof subtitle !== "string") {
            throw new TypeError(
                "Preview Card subtitle must be a string."
            );
        }

        if (!(content instanceof Element)) {
            throw new TypeError(
                "Preview Card content must be an Element."
            );
        }

        if (
            !global.Builder.has("card")
            || !global.Builder.has("button")
        ) {
            return null;
        }

        const sourceButton =
            global.Builder.create(
                "button",
                {
                    label:
                        "",
                    icon:
                        [
                            '<svg xmlns="http://www.w3.org/2000/svg"',
                            ' viewBox="0 0 16 16">',
                            '<path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0"/>',
                            "</svg>",
                        ].join(""),
                    title:
                        "View Source",
                    variant:
                        "secondary",
                    size:
                        "small",
                    callback:
                        function () {
                            if (
                                sourceModal !== null
                                && typeof sourceModal.open
                                    === "function"
                            ) {
                                sourceModal.open();
                            }
                        },
                }
            );

        const footer =
            document.createElement(
                "div"
            );

        const footerEnd =
            document.createElement(
                "div"
            );

        footer.classList.add(
            "dev-theme-preview-card-footer"
        );

        footerEnd.classList.add(
            "dev-theme-preview-card-footer-end"
        );

        if (footerStart instanceof Element) {
            footer.append(
                footerStart
            );
        }

        footerEnd.append(
            sourceButton.element()
        );

        footer.append(
            footerEnd
        );

        const card =
            global.Builder.create(
                "card",
                {
                    title:
                        title,
                    subtitle:
                        subtitle,
                    content:
                        content,
                    footer:
                        footer,
                }
            );

        card.appendTo(
            mount
        );

        return card;
    }

    function initializeThemePreview() {
        const mount =
            document.getElementById(
                "dev-theme-preview"
            );

        if (!(mount instanceof Element)) {
            return;
        }

        const componentsGroup =
            createGroup(
                mount,
                "components",
                "Components",
                "Reusable Builder components and their supported states and controls."
            );

        const widgetsGroup =
            createGroup(
                mount,
                "widgets",
                "Widgets",
                "Larger composed and application-style interface examples built from reusable components."
            );

        const contentGroup =
            createGroup(
                mount,
                "content",
                "Typography / Basic Content",
                "Baseline rendered HTML including typography, links, lists, code, quotations, tables, and related content."
            );

        const utilitiesGroup =
            createGroup(
                mount,
                "utilities",
                "CSS Utilities",
                "Reusable framework utility classes for layout, spacing, alignment, sizing, visibility, and related presentation."
            );

        const bootstrapProbe =
            document.createElement(
                "div"
            );

        bootstrapProbe.classList.add(
            "d-none"
        );

        document.body.append(
            bootstrapProbe
        );

        const bootstrapAvailable =
            global.getComputedStyle(
                bootstrapProbe
            ).display === "none";

        bootstrapProbe.remove();

        if (bootstrapAvailable) {
            const bootstrapUtilitiesExamples =
                createSection(
                    utilitiesGroup,
                    "Bootstrap Utilities",
                    "Optional Bootstrap utility classes available when the Bootstrap plugin is enabled."
                );

            const bootstrapUtilitiesContent =
                document.createElement(
                    "div"
                );

            bootstrapUtilitiesContent.classList.add(
                "dev-utilities-preview"
            );

            bootstrapUtilitiesContent.innerHTML = [
                "<div class=\"dev-utility-example\">",
                "<strong>Spacing</strong>",
                "<div class=\"dev-bootstrap-utility-box p-3\">.p-3</div>",
                "</div>",
                "<div class=\"dev-utility-example\">",
                "<strong>Flexbox and gap</strong>",
                "<div class=\"d-flex gap-2\">",
                "<span class=\"dev-bootstrap-utility-box\">Item One</span>",
                "<span class=\"dev-bootstrap-utility-box\">Item Two</span>",
                "<span class=\"dev-bootstrap-utility-box\">Item Three</span>",
                "</div>",
                "</div>",
                "<div class=\"dev-utility-example\">",
                "<strong>Alignment</strong>",
                "<div class=\"d-flex justify-content-between align-items-center\">",
                "<span class=\"dev-bootstrap-utility-box\">Start</span>",
                "<span class=\"dev-bootstrap-utility-box\">End</span>",
                "</div>",
                "</div>",
                "<div class=\"dev-utility-example\">",
                "<strong>Sizing</strong>",
                "<div class=\"dev-bootstrap-utility-box w-50\">.w-50</div>",
                "</div>",
                "<div class=\"dev-utility-example\">",
                "<strong>Visibility</strong>",
                "<div class=\"dev-bootstrap-utility-box invisible\">Invisible content</div>",
                "<span>Space remains above because .invisible preserves layout.</span>",
                "</div>"
            ].join("");

            bootstrapUtilitiesExamples.append(
                bootstrapUtilitiesContent
            );
        }

        const coreUtilitiesExamples =
            createSection(
                utilitiesGroup,
                "Core-Web Utilities",
                "Utility classes provided directly by the Core-Web kernel."
            );

        const coreUtilitiesContent =
            document.createElement(
                "div"
            );

        coreUtilitiesContent.classList.add(
            "dev-utilities-preview"
        );

        coreUtilitiesContent.innerHTML = [
            "<div class=\"dev-utility-example\">",
            "<strong>.text-app-muted</strong>",
            "<p class=\"text-app-muted\">Muted secondary text using the Core-Web utility class.</p>",
            "</div>",
            "<div class=\"dev-utility-example\">",
            "<strong>.visually-hidden</strong>",
            "<p>The text inside the bordered example below is present in the DOM but visually hidden.</p>",
            "<div class=\"dev-visually-hidden-example\">",
            "<span class=\"visually-hidden\">This text is visually hidden.</span>",
            "<span aria-hidden=\"true\">Visible reference area</span>",
            "</div>",
            "</div>"
        ].join("");

        coreUtilitiesExamples.append(
            coreUtilitiesContent
        );

        const typographyExamples =
            createSection(
                contentGroup,
                "Typography",
                "Baseline heading, paragraph, emphasis, link, and muted-text presentation."
            );

        const typographyContent =
            document.createElement(
                "div"
            );

        typographyContent.classList.add(
            "dev-basic-content-preview"
        );

        typographyContent.innerHTML = [
            "<h1>Heading 1</h1>",
            "<h2>Heading 2</h2>",
            "<h3>Heading 3</h3>",
            "<h4>Heading 4</h4>",
            "<h5>Heading 5</h5>",
            "<h6>Heading 6</h6>",
            "<p>This is a standard paragraph used to validate baseline body typography and spacing.</p>",
            "<p><strong>Strong text</strong>, <em>emphasized text</em>, <small>small text</small>, and <a href=\"#dev-preview-typography\">an example link</a>.</p>",
            "<p class=\"text-app-muted\">This paragraph uses the Core-Web text-app-muted utility.</p>"
        ].join("");

        typographyExamples.append(
            typographyContent
        );

        const basicContentExamples =
            createSection(
                contentGroup,
                "Basic Content",
                "Lists, quotations, inline code, preformatted content, horizontal rules, and native tables."
            );

        const basicContent =
            document.createElement(
                "div"
            );

        basicContent.classList.add(
            "dev-basic-content-preview"
        );

        basicContent.innerHTML = [
            "<h3>Unordered list</h3>",
            "<ul>",
            "<li>First list item</li>",
            "<li>Second list item</li>",
            "<li>Third list item</li>",
            "</ul>",
            "<h3>Ordered list</h3>",
            "<ol>",
            "<li>First ordered item</li>",
            "<li>Second ordered item</li>",
            "<li>Third ordered item</li>",
            "</ol>",
            "<h3>Blockquote</h3>",
            "<blockquote><p>This is an example quotation used to validate default content presentation.</p></blockquote>",
            "<h3>Inline code</h3>",
            "<p>Use <code>Builder.create()</code> to create a registered Builder component.</p>",
            "<h3>Preformatted content</h3>",
            "<pre><code>const example = true;\\nconsole.log(example);</code></pre>",
            "<hr>",
            "<h3>Native table</h3>",
            "<table>",
            "<thead><tr><th>Column One</th><th>Column Two</th></tr></thead>",
            "<tbody>",
            "<tr><td>Alpha</td><td>Enabled</td></tr>",
            "<tr><td>Bravo</td><td>Disabled</td></tr>",
            "</tbody>",
            "</table>"
        ].join("");

        basicContentExamples.append(
            basicContent
        );

        const alertExamples =
            createSection(
                componentsGroup,
                "Alert",
                "Inline alerts with semantic colors, optional title, icon, content, and dismiss behavior.",
                false
            );

        if (
            global.Builder.has("alert")
            && global.Builder.has("card")
            && global.Builder.has("button")
        ) {
            const alertPreviewContent =
                document.createElement(
                    "div"
                );

            alertPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Alert START
            [
                "primary",
                "secondary",
                "success",
                "danger",
                "warning",
                "info",
                "light",
                "dark",
            ].forEach(function (color) {
                global.Builder.create(
                    "alert",
                    {
                        title:
                            color.charAt(0)
                                .toUpperCase()
                            + color.slice(1)
                            + " Alert",
                        content:
                            "<p>This is the "
                            + color
                            + " semantic Alert example.</p>",
                        color:
                            color,
                        dismissible:
                            color === "primary",
                        onDismiss:
                            color === "primary"
                                ? function () {}
                                : null,
                        icon:
                            color === "info"
                                ? ALERT_PREVIEW_ICONS.info
                                : "",
                }
            ).appendTo(
                alertPreviewContent
            );
            });

            // DEV SOURCE: Alert END

            const alertSourceModal =
                createSourceModal(
                    "Alert Source",
                    {
                        html: {
                            filename:
                                "alert.html",
                            source:
                                alertPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Alert START",
                                endMarker:
                                    "// DEV SOURCE: Alert END",
                            },
                        },
                        css: {
                            filename:
                                "alert.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/alert.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                alertExamples,
                "Alert",
                "Inline alerts with semantic colors, optional title, icon, content, and dismiss behavior.",
                alertPreviewContent,
                alertSourceModal
            );
        }

        const toastExamples =
            createSection(
                componentsGroup,
                "Toast",
                "Transient notification with semantic color, optional icon, dismiss control, and automatic dismissal.",
                false
            );

        if (global.Builder.has("toast")) {
            const toastPreviewContent =
                document.createElement(
                    "div"
                );

            toastPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Toast START
            global.Builder.create(
                "toast",
                {
                    title:
                        "Example Toast",
                    content:
                        "<p>This persistent example allows the Toast presentation and dismiss behavior to be reviewed.</p>",
                    color:
                        "info",
                    icon:
                        ALERT_PREVIEW_ICONS.info,
                    dismissible:
                        true,
                    persistent:
                        true,
                }
            ).appendTo(
                toastPreviewContent
            );

            global.Builder.create(
                "toast",
                {
                    title:
                        "Auto-dismiss Toast",
                    content:
                        "<p>This Toast demonstrates the automatic-dismiss timer and progress indicator.</p>",
                    color:
                        "success",
                    dismissible:
                        true,
                    persistent:
                        false,
                    delay:
                        15000,
                }
            ).appendTo(
                toastPreviewContent
            );

            // DEV SOURCE: Toast END

        const toastSourceModal =
            createSourceModal(
                "Toast Source",
                {
                    html: {
                        filename:
                            "toast.html",
                        source:
                            toastPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Toast START",
                            endMarker:
                                "// DEV SOURCE: Toast END",
                        },
                    },
                    css: {
                        filename:
                            "toast.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/toast.less",
                        },
                    },
                }
            );

            createPreviewCard(
                toastExamples,
                "Toast",
                "Transient notification with semantic color, optional icon, dismiss control, and automatic dismissal.",
                toastPreviewContent,
                toastSourceModal
            );
        }

        const toastAreaExamples =
            createSection(
                widgetsGroup,
                "Toast Area",
                "Viewport-positioned Toast collection with configurable placement, stacking, and collection controls.",
                false
            );

        if (
            global.Builder.has("toast-area")
            && global.Builder.has("button")
        ) {
            const toastAreaPreviewContent =
                document.createElement(
                    "div"
                );

            toastAreaPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const toastAreaPreviewControls =
                document.createElement(
                    "div"
                );

            toastAreaPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Toast Area START
            const toastArea =
                global.Builder.create(
                    "toast-area",
                    {
                        position:
                            "bottom-right",
                    }
                );

            toastArea.appendTo(
                document.body
            );

            const toastAreaViewport =
                document.createElement(
                    "div"
                );

            toastAreaViewport.classList.add(
                "dev-toast-area-viewport"
            );

            [
                "top-left",
                "top-center",
                "top-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
            ].forEach(function (position) {
                const positionButton =
                    global.Builder.create(
                        "button",
                        {
                            label:
                                position
                                    .split("-")
                                    .map(
                                        function (part) {
                                            return part
                                                .charAt(0)
                                                .toUpperCase()
                                                + part.slice(1);
                                        }
                                    )
                                    .join(" "),
                            variant:
                                position === "bottom-right"
                                    ? "primary"
                                    : "secondary",
                        size:
                            "small",
                        callback:
                            function () {
                                toastArea.setPosition(
                                    position
                                );

                                    toastAreaViewport
                                        .querySelectorAll(
                                            ".app-button"
                                        )
                                        .forEach(
                                            function (button) {
                                                button.classList.remove(
                                                    "app-button-primary"
                                                );

                                                button.classList.add(
                                                    "app-button-secondary"
                                                );
                                            }
                                        );

                                    const element =
                                        positionButton.element();

                                    if (
                                        element
                                        instanceof HTMLButtonElement
                                    ) {
                                        element.classList.remove(
                                            "app-button-secondary"
                                        );

                                        element.classList.add(
                                            "app-button-primary"
                                        );
                                    }
                                },
                        }
                    );

                const element =
                    positionButton.element();

                if (
                    element
                    instanceof HTMLButtonElement
                ) {
                    element.setAttribute(
                        "data-toast-area-preview-position",
                        position
                    );
                }

                positionButton.appendTo(
                    toastAreaViewport
                );
            });

            toastAreaPreviewContent.append(
                toastAreaViewport
            );

            global.Builder.create(
                "button",
                {
                    label:
                        "Add Toast",
                    variant:
                        "primary",
                    size:
                        "small",
                    callback:
                        function () {
                            toastArea.addToast({
                                title:
                                    "Toast Area Example",
                                content:
                                    "<p>This Toast was added through Toast Area.</p>",
                                color:
                                    "success",
                                dismissible:
                                    true,
                                delay:
                                    10000,
                                persistent:
                                    false,
                            });
                        },
                }
            ).appendTo(
                toastAreaPreviewControls
            );

            global.Builder.create(
                "button",
                {
                    label:
                        "Clear Toasts",
                    variant:
                        "secondary",
                    size:
                        "small",
                    callback:
                        function () {
                            toastArea.clearToasts();
                        },
                }
            ).appendTo(
                toastAreaPreviewControls
            );

            global.devToastArea =
                toastArea;

            // DEV SOURCE: Toast Area END

            const toastAreaSourceModal =
                createSourceModal(
                    "Toast Area Source",
                    {
                        html: {
                            filename:
                                "toast-area.html",
                            source:
                                toastAreaPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Toast Area START",
                                endMarker:
                                    "// DEV SOURCE: Toast Area END",
                            },
                        },
                        css: {
                            filename:
                                "toast-area.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/toast-area.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                toastAreaExamples,
                "Toast Area",
                "Viewport-positioned Toast collection with configurable placement, stacking, and collection controls.",
                toastAreaPreviewContent,
                toastAreaSourceModal,
                toastAreaPreviewControls
            );
        }

        const modalExamples =
            createSection(
                componentsGroup,
                "Modal",
                "Dialog component with semantic colors, configurable sizes, fullscreen, close, overflow actions, backdrop closing, and keyboard accessibility.",
                false
            );

        if (
            global.Builder.has("modal")
            && global.Builder.has("button")
        ) {
            const modalPreviewContent =
                document.createElement(
                    "div"
                );

            modalPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Modal START
            [
                {
                    size:
                        "small",
                    color:
                        "primary",
                    footer:
                        "default",
                    okLabel:
                        "Install",
                },
                {
                    size:
                        "medium",
                    color:
                        "success",
                },
                {
                    size:
                        "large",
                    color:
                        "warning",
                },
                {
                    size:
                        "xlarge",
                    color:
                        "danger",
                },
            ].forEach(function (example) {
                const modal =
                    global.Builder.create(
                        "modal",
                        {
                            title:
                                example.size
                                    .charAt(0)
                                    .toUpperCase()
                                + example.size.slice(1)
                                + " Modal",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            body:
                                example.size === "xlarge"
                                    ? [
                                        "<p>This xlarge Modal includes enough content to demonstrate the scrollable Modal body.</p>",
                                        "<h3>Modal body scrolling</h3>",
                                        "<p>The Modal body is constrained to a maximum height so longer content remains contained within the dialog instead of expanding beyond the viewport.</p>",
                                        "<p>When this content exceeds the available body height, the body becomes vertically scrollable while the header and footer remain visible.</p>",
                                        "<h3>Header and footer</h3>",
                                        "<p>The Modal header contains the title, optional icon, fullscreen control, close control, and overflow action menu.</p>",
                                        "<p>The footer remains outside the scrolling body so important actions or contextual information can stay visible while the body content is reviewed.</p>",
                                        "<h3>Responsive behavior</h3>",
                                        "<p>The Modal remains constrained by the viewport and should continue to behave predictably across different screen sizes.</p>",
                                        "<p>Long content should never force the entire dialog beyond the available viewport height.</p>",
                                        "<h3>Fullscreen behavior</h3>",
                                        "<p>The fullscreen control expands the Modal to use the full viewport while preserving the same header, body, and footer structure.</p>",
                                        "<p>In fullscreen mode, the body can use the remaining available height instead of retaining the normal 75-percent viewport-height limit.</p>",
                                        "<h3>Accessibility</h3>",
                                        "<p>Keyboard focus remains inside the open Modal, Escape can close it when enabled, and focus returns to the element that opened the Modal.</p>",
                                        "<p>The body scrollbar must remain keyboard-accessible without interfering with the Modal controls.</p>",
                                        "<h3>Additional content</h3>",
                                        "<p>This additional section intentionally increases the content height so the preview consistently exercises vertical overflow.</p>",
                                        "<p>The scrollbar should appear inside the Modal body while the colored header and footer remain stationary.</p>",
                                        "<h3>Final section</h3>",
                                        "<p>This final section confirms that content near the bottom of a long Modal remains reachable through normal body scrolling.</p>",
                                        "<p>If this paragraph is visible after scrolling, the overflow behavior is working as intended.</p>",
                                    ].join("")
                                    : (
                                        "<p>This example demonstrates the "
                                        + example.size
                                        + " Modal size and "
                                        + example.color
                                        + " semantic color.</p><p>Use the header controls, Escape key, or backdrop to close the Modal.</p>"
                                    ),
                            footer:
                                typeof example.footer === "string"
                                    ? example.footer
                                    : "",
                            okLabel:
                                typeof example.okLabel === "string"
                                    ? example.okLabel
                                    : "Ok",
                            size:
                                example.size,
                            color:
                                example.color,
                            fullscreenControlVisible:
                                true,
                            closeControlVisible:
                                true,
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                {
                                    label:
                                        "Inspect",
                                    callback:
                                        function () {},
                                },
                                {
                                    label:
                                        "Another action",
                                    callback:
                                        function () {},
                                },
                            ],
                            closeOnEscape:
                                true,
                            closeOnBackdrop:
                                true,
                        }
                    );

                modal.appendTo(
                    document.body
                );

                global.Builder.create(
                    "button",
                    {
                        label:
                            "Open "
                            + example.size
                                .charAt(0)
                                .toUpperCase()
                            + example.size.slice(1)
                            + " Modal",
                        variant:
                            example.color,
                        size:
                            "small",
                        callback:
                            function () {
                                modal.open();
                            },
                    }
                ).appendTo(
                    modalPreviewContent
                );
            });

            // DEV SOURCE: Modal END

            const modalSourceModal =
                createSourceModal(
                    "Modal Source",
                    {
                        html: {
                            filename:
                                "modal.html",
                            source:
                                modalPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Modal START",
                                endMarker:
                                    "// DEV SOURCE: Modal END",
                            },
                        },
                        css: {
                            filename:
                                "modal.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/modal.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                modalExamples,
                "Modal",
                "Dialog component with semantic colors, configurable sizes, fullscreen, close, overflow actions, backdrop closing, and keyboard accessibility.",
                modalPreviewContent,
                modalSourceModal
            );
        }

        const offcanvasExamples =
            createSection(
                componentsGroup,
                "Offcanvas",
                "Sliding overlay panel with configurable placement, size, semantic color, backdrop, close control, and keyboard accessibility.",
                false
            );

        if (
            global.Builder.has("offcanvas")
            && global.Builder.has("button")
        ) {
            const offcanvasPreviewContent =
                document.createElement(
                    "div"
                );

            offcanvasPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Offcanvas START
            [
                {
                    placement:
                        "left",
                    size:
                        "small",
                    color:
                        "primary",
                },
                {
                    placement:
                        "right",
                    size:
                        "medium",
                    color:
                        "success",
                },
                {
                    placement:
                        "top",
                    size:
                        "medium",
                    color:
                        "warning",
                },
                {
                    placement:
                        "bottom",
                    size:
                        "large",
                    color:
                        "danger",
                },
            ].forEach(function (example) {
                const label =
                    example.placement
                        .charAt(0)
                        .toUpperCase()
                    + example.placement.slice(1);

                const offcanvas =
                    global.Builder.create(
                        "offcanvas",
                        {
                            title:
                                label
                                + " Offcanvas",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            body:
                                "<p>This Offcanvas demonstrates the "
                                + example.placement
                                + " placement, "
                                + example.size
                                + " size, and "
                                + example.color
                                + " semantic color.</p><p>Use the close control, Escape key, or backdrop to close the panel.</p>",
                            footer:
                                "<span>Offcanvas footer example</span>",
                            placement:
                                example.placement,
                            size:
                                example.size,
                            color:
                                example.color,
                            backdrop:
                                true,
                            fullscreenControlVisible:
                                true,
                            closeControlVisible:
                                true,
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                 {
                                    label:
                                         "Inspect",
                                    callback:
                                        function () {},
                                 },
                                 {
                                    label:
                                         "Another action",
                                    callback:
                                        function () {},
                                 },
                             ],
                            closeOnEscape:
                                true,
                            closeOnBackdrop:
                                true,
                        }
                    );

                offcanvas.appendTo(
                    document.body
                );

                global.Builder.create(
                    "button",
                    {
                        label:
                            "Open "
                            + label
                            + " Offcanvas",
                        variant:
                            example.color,
                        size:
                            "small",
                        callback:
                            function () {
                                offcanvas.open();
                            },
                    }
                ).appendTo(
                    offcanvasPreviewContent
                );
            });

            // DEV SOURCE: Offcanvas END

            const offcanvasSourceModal =
                createSourceModal(
                    "Offcanvas Source",
                    {
                        html: {
                            filename:
                                "offcanvas.html",
                            source:
                                offcanvasPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Offcanvas START",
                                endMarker:
                                    "// DEV SOURCE: Offcanvas END",
                            },
                        },
                        css: {
                            filename:
                                "offcanvas.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/offcanvas.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                offcanvasExamples,
                "Offcanvas",
                "Sliding overlay panel with configurable placement, size, semantic color, backdrop, close control, and keyboard accessibility.",
                offcanvasPreviewContent,
                offcanvasSourceModal
            );
        }

        const codeBlockExamples =
            createSection(
                componentsGroup,
                "Code Block",
                "Card-style source code presentation with filename metadata, copy control, line numbers, wrapping, overflow actions, and optional syntax highlighting.",
                false
            );

        const calloutExamples =
            createSection(
                componentsGroup,
                "Callout",
                "Inline contextual emphasis with semantic colors, optional icon, overflow actions, and sortable move handles.",
                false
            );

        if (global.Builder.has("callout")) {
            const calloutPreviewContent =
                document.createElement(
                    "div"
                );

            calloutPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const calloutPreviewControls =
                document.createElement(
                    "div"
                );

            calloutPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Callout START
            const calloutOne =
                global.Builder.create(
                    "callout",
                    {
                        title:
                            "Information",
                        content:
                            "<p>This Callout demonstrates the primary semantic presentation and optional icon.</p>",
                        icon:
                            ALERT_PREVIEW_ICONS.info,
                        color:
                            "primary",
                        controlMenuEnabled:
                            true,
                        controlMenuItems: [
                            {
                                label:
                                    "Inspect",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Dismiss",
                                callback:
                                    function () {},
                            },
                        ],
                    }
                );

            const calloutTwo =
                global.Builder.create(
                    "callout",
                    {
                        title:
                            "Success",
                        content:
                            "<p>This Callout uses the success semantic color.</p>",
                        color:
                            "success",
                    }
                );

            const calloutThree =
                global.Builder.create(
                    "callout",
                    {
                        title:
                            "Warning",
                        content:
                            "<p>This Callout uses the warning semantic color.</p>",
                        color:
                            "warning",
                    }
                );

            const calloutFour =
                global.Builder.create(
                    "callout",
                    {
                        title:
                            "Danger",
                        content:
                            "<p>This Callout uses the danger semantic color.</p>",
                        color:
                            "danger",
                    }
                );

            calloutOne.appendTo(
                calloutPreviewContent
            );

            calloutTwo.appendTo(
                calloutPreviewContent
            );

            calloutThree.appendTo(
                calloutPreviewContent
            );

            calloutFour.appendTo(
                calloutPreviewContent
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                let calloutSortable =
                    null;

                const calloutSortableToggle =
                    createToggleControl(
                        calloutExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                            if (
                                calloutSortable !== null
                                && typeof calloutSortable.destroy
                                    === "function"
                            ) {
                                calloutSortable.destroy();

                                calloutSortable =
                                    null;
                            }

                            if (!enabled) {
                                calloutOne.hideMoveHandle();
                                calloutTwo.hideMoveHandle();
                                calloutThree.hideMoveHandle();
                                calloutFour.hideMoveHandle();

                                return;
                            }

                            calloutOne.showMoveHandle();
                            calloutTwo.showMoveHandle();
                            calloutThree.showMoveHandle();
                            calloutFour.showMoveHandle();

                            calloutSortable =
                                global.Sortable.create(
                                    calloutPreviewContent,
                                    {
                                        draggable:
                                            ".app-callout",
                                        handle:
                                            ".app-callout-move-handle",
                                        animation:
                                            150,
                                    }
                                );
                        }
                    );

                if (
                    calloutSortableToggle !== null
                    && typeof calloutSortableToggle.element
                        === "function"
                ) {
                    calloutPreviewControls.append(
                        calloutSortableToggle.element()
                    );
                }
            }

            // DEV SOURCE: Callout END

            const calloutSourceModal =
                createSourceModal(
                    "Callout Source",
                    {
                        html: {
                            filename:
                                "callout.html",
                            source:
                                calloutPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Callout START",
                                endMarker:
                                    "// DEV SOURCE: Callout END",
                            },
                        },
                        css: {
                            filename:
                                "callout.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/callout.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                calloutExamples,
                "Callout",
                "Inline contextual emphasis with semantic colors, optional icon, overflow actions, and sortable move handles.",
                calloutPreviewContent,
                calloutSourceModal,
                calloutPreviewControls
            );
        }

        if (global.Builder.has("code-block")) {
            const codeBlockPreviewContent =
                document.createElement(
                    "div"
                );

            codeBlockPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Code Block START
            global.Builder.create(
                "code-block",
                {
                    title:
                        "JavaScript Example",
                    filename:
                        "example.js",
                    language:
                        "javascript",
                    code:
                        [
                            "function greet(name) {",
                            '    return "Hello, " + name + "!";',
                            "}",
                            "",
                            'console.log(greet("Core-Web"));',
                        ].join("\n"),
                    copyControlVisible:
                        true,
                    controlMenuEnabled:
                        true,
                    controlMenuItems: [
                        {
                            label:
                                "Open file",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Download",
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                codeBlockPreviewContent
            );

            global.Builder.create(
                "code-block",
                {
                    title:
                        "Wrapped Code with Line Numbers",
                    filename:
                        "configuration.php",
                    language:
                        "php",
                    code:
                        [
                            "<?php",
                            "",
                            "$configuration = [",
                            '    "description" => "This intentionally long line demonstrates how the Code Block component wraps source code while preserving readable line numbering and formatting across the available container width.",',
                            '    "enabled" => true,',
                            '    "environment" => "development",',
                            "];",
                            "",
                            "return $configuration;",
                            "// End of configuration.",
                        ].join("\n"),
                    lineNumbers:
                        true,
                    highlightedLines: [
                        3,
                        4,
                        5,
                        6,
                    ],
                    wrap:
                        true,
                    copyControlVisible:
                        true,
                }
            ).appendTo(
                codeBlockPreviewContent
            );

            global.Builder.create(
                "code-block",
                {
                    title:
                        "Python Example",
                    filename:
                        "example.py",
                    language:
                        "python",
                    code:
                        [
                            "def greet(name):",
                            '    message = f"Hello, {name}!"',
                            "    return message",
                            "",
                            'for name in ["Alex", "Jamie", "Taylor"]:',
                            "    print(greet(name))",
                        ].join("\n"),
                    lineNumbers:
                        true,
                    copyControlVisible:
                        true,
                }
            ).appendTo(
                codeBlockPreviewContent
            );

            // DEV SOURCE: Code Block END

            const codeBlockSourceModal =
                createSourceModal(
                    "Code Block Source",
                    {
                        html: {
                            filename:
                                "code-block.html",
                            source:
                                codeBlockPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Code Block START",
                                endMarker:
                                    "// DEV SOURCE: Code Block END",
                            },
                        },
                        css: {
                            filename:
                                "code-block.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/code-block.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                codeBlockExamples,
                "Code Block",
                "Card-style source code presentation with filename metadata, copy control, line numbers, wrapping, overflow actions, and optional syntax highlighting.",
                codeBlockPreviewContent,
                codeBlockSourceModal
            );
        }

        const timelineExamples =
            createSection(
                widgetsGroup,
                "Timeline",
                "Vertical and horizontal activity timelines with search, type filters, sorting, automatic date separators, past and now indicators, load-more support, and reusable Timeline Item entries.",
                false
            );

        if (global.Builder.has("timeline")) {
            const timelinePreviewContent =
                document.createElement(
                    "div"
                );

            timelinePreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Timeline START
            const timelineExample =
                global.Builder.create(
                    "timeline",
                    {
                    direction:
                        "descending",
                    searchEnabled:
                        true,
                    searchPlaceholder:
                        "Search activity…",
                    controlMenuEnabled:
                        true,
                    controlMenuItems: [
                        {
                            label:
                                "Refresh timeline",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Export activity",
                            callback:
                                function () {},
                        },
                    ],
                    filters: [
                        {
                            value:
                                "",
                            label:
                                "All",
                        },
                        {
                            value:
                                "lead",
                            label:
                                "Lead",
                        },
                        {
                            value:
                                "vcard",
                            label:
                                "vCard",
                        },
                        {
                            value:
                                "task",
                            label:
                                "Task",
                        },
                    ],
                    items: [
                        {
                            id:
                                "timeline-lead-1",
                            type:
                                "lead",
                            title:
                                "Lead created",
                            content:
                                "<p>A new lead was created and assigned for follow-up.</p>",
                            color:
                                "primary",
                            user: {
                                name:
                                    "Alex Morgan",
                                href:
                                    "/admin/dev/preview",
                                src:
                                    "https://picsum.photos/200/200",
                            },
                            timestamp:
                                "2026-08-19T14:30:00-04:00",
                            actions: [
                                {
                                    label:
                                        "Edit",
                                    variant:
                                        "primary",
                                    callback:
                                        function () {},
                                },
                            ],
                        },
                        {
                            id:
                                "timeline-vcard-1",
                            type:
                                "vcard",
                            title:
                                "Contact updated",
                            content:
                                "<p>Phone and email information were updated.</p>",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            color:
                                "success",
                            user: {
                                name:
                                    "Jamie Rivera",
                            },
                            timestamp:
                                "2026-08-19T11:15:00-04:00",
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                {
                                    label:
                                        "Inspect",
                                    callback:
                                        function () {},
                                },
                                {
                                    label:
                                        "Edit",
                                    callback:
                                        function () {},
                                },
                            ],
                        },
                        {
                            id:
                                "timeline-task-1",
                            type:
                                "task",
                            title:
                                "Follow-up completed",
                            content:
                                "<p>The scheduled follow-up task was completed.</p>",
                            color:
                                "warning",
                            user: {
                                name:
                                    "Taylor Chen",
                            },
                            timestamp:
                                "2026-08-18T16:45:00-04:00",
                        },
                        {
                            id:
                                "timeline-lead-2",
                            type:
                                "lead",
                            title:
                                "Lead qualified",
                            content:
                                "<p>The lead was reviewed and marked as qualified.</p>",
                            color:
                                "info",
                            user: {
                                name:
                                    "Morgan Patel",
                            },
                            timestamp:
                                "2026-08-18T09:20:00-04:00",
                        },
                    ],
                    startVisible:
                        true,
                    endVisible:
                        true,
                    onLoadMore:
                        async function (timeline) {
                            const items =
                                timeline.config(
                                    "items"
                                );

                            if (
                                items.some(
                                    function (item) {
                                        return item.id
                                            === "timeline-task-loaded";
                                    }
                                )
                            ) {
                                return;
                            }

                            timeline.config(
                                "items",
                                items.concat([
                                    {
                                        id:
                                            "timeline-task-loaded",
                                        type:
                                            "task",
                                        title:
                                            "Older task loaded",
                                        content:
                                            "<p>This older Timeline Item was added through the Load More callback.</p>",
                                        color:
                                            "secondary",
                                        user: {
                                            name:
                                                "Jordan Smith",
                                        },
                                        timestamp:
                                            "2026-08-17T14:00:00-04:00",
                                    },
                                ])
                            );
                        },
                }
            );

            timelineExample.appendTo(
                timelinePreviewContent
            );

            global.Builder.create(
                "timeline",
                {
                    layout:
                        "horizontal",
                    direction:
                        "descending",
                    searchEnabled:
                        true,
                    searchPlaceholder:
                        "Search horizontal timeline…",
                    filters: [
                        {
                            value:
                                "",
                            label:
                                "All",
                        },
                        {
                            value:
                                "lead",
                            label:
                                "Lead",
                        },
                        {
                            value:
                                "vcard",
                            label:
                                "vCard",
                        },
                        {
                            value:
                                "task",
                            label:
                                "Task",
                        },
                    ],
                    items: [
                        {
                            id:
                                "horizontal-lead-1",
                            type:
                                "lead",
                            title:
                                "Lead created",
                            content:
                                "<p>A new lead was added to the horizontal activity history.</p>",
                            color:
                                "primary",
                            user: {
                                name:
                                    "Alex Morgan",
                            },
                            timestamp:
                                "2026-08-19T14:30:00-04:00",
                            actions: [
                                {
                                    label:
                                        "Edit",
                                    variant:
                                        "primary",
                                    callback:
                                        function () {},
                                },
                            ],
                        },
                        {
                            id:
                                "horizontal-vcard-1",
                            type:
                                "vcard",
                            title:
                                "Contact updated",
                            content:
                                "<p>The associated contact information was updated.</p>",
                            icon:
                                ALERT_PREVIEW_ICONS.info,
                            color:
                                "success",
                            user: {
                                name:
                                    "Jamie Rivera",
                            },
                            timestamp:
                                "2026-08-19T11:15:00-04:00",
                            controlMenuEnabled:
                                true,
                            controlMenuItems: [
                                {
                                    label:
                                        "Inspect",
                                    callback:
                                        function () {},
                                },
                                {
                                    label:
                                        "Edit",
                                    callback:
                                        function () {},
                                },
                            ],
                        },
                        {
                            id:
                                "horizontal-task-1",
                            type:
                                "task",
                            title:
                                "Task completed",
                            content:
                                "<p>The scheduled follow-up task was completed.</p>",
                            color:
                                "warning",
                            user: {
                                name:
                                    "Taylor Chen",
                            },
                            timestamp:
                                "2026-08-18T16:45:00-04:00",
                        },
                        {
                            id:
                                "horizontal-lead-2",
                            type:
                                "lead",
                            title:
                                "Lead qualified",
                            content:
                                "<p>The lead was reviewed and marked as qualified.</p>",
                            color:
                                "info",
                            user: {
                                name:
                                    "Morgan Patel",
                            },
                            timestamp:
                                "2026-08-18T09:20:00-04:00",
                        },
                    ],
                    startVisible:
                        true,
                    endVisible:
                        true,
                    onLoadMore:
                        async function () {},
                }
            ).appendTo(
                timelinePreviewContent
            );

            // DEV SOURCE: Timeline END

            const timelineSourceModal =
                createSourceModal(
                    "Timeline Source",
                    {
                        html: {
                            filename:
                                "timeline.html",
                            source:
                                timelinePreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Timeline START",
                                endMarker:
                                    "// DEV SOURCE: Timeline END",
                            },
                        },
                        css: {
                            filename:
                                "timeline.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/timeline.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                timelineExamples,
                "Timeline",
                "Vertical and horizontal activity timelines with search, type filters, sorting, automatic date separators, past and now indicators, load-more support, and reusable Timeline Item entries.",
                timelinePreviewContent,
                timelineSourceModal
            );
        }

        const timelineItemExamples =
            createSection(
                componentsGroup,
                "Timeline Item",
                "Individual timeline event with semantic indicator, user metadata, relative timestamp, content, custom icon, and optional overflow actions.",
                false
            );

        if (global.Builder.has("timeline-item")) {
            const timelineItemPreviewContent =
                document.createElement(
                    "div"
                );

            timelineItemPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Timeline Item START
            global.Builder.create(
                "timeline-item",
                {
                    id:
                        "timeline-item-lead",
                    type:
                        "lead",
                    title:
                        "Lead created",
                    content:
                        "<p>A new lead was created and added to the activity history.</p>",
                    color:
                        "primary",
                    user: {
                        name:
                            "Alex Morgan",
                        href:
                            "/admin/dev/preview",
                        src:
                            "https://picsum.photos/200/200",
                    },
                    timestamp:
                        "2026-08-19T14:30:00-04:00",
                    actions: [
                        {
                            label:
                                "Edit",
                            variant:
                                "primary",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Delete",
                            variant:
                                "danger",
                            callback:
                                function () {},
                        },
                    ],
                    controlMenuEnabled:
                        true,
                    controlMenuItems: [
                        {
                            label:
                                "Inspect",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Edit",
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                timelineItemPreviewContent
            );

            global.Builder.create(
                "timeline-item",
                {
                    id:
                        "timeline-item-vcard",
                    type:
                        "vcard",
                    title:
                        "Contact updated",
                    content:
                        "<p>Contact information was updated for the associated vCard.</p>",
                    icon:
                        ALERT_PREVIEW_ICONS.info,
                    color:
                        "success",
                    user: {
                        name:
                            "Jamie Rivera",
                    },
                    timestamp:
                        "2026-08-18T11:15:00-04:00",
                }
            ).appendTo(
                timelineItemPreviewContent
            );

            global.Builder.create(
                "timeline-item",
                {
                    id:
                        "timeline-item-task",
                    type:
                        "task",
                    title:
                        "Task completed",
                    content:
                        "<p>The follow-up task was marked as completed.</p>",
                    color:
                        "warning",
                    timestamp:
                        "2026-08-17T09:45:00-04:00",
                }
            ).appendTo(
                timelineItemPreviewContent
            );

            // DEV SOURCE: Timeline Item END

            const timelineItemSourceModal =
                createSourceModal(
                    "Timeline Item Source",
                    {
                        html: {
                            filename:
                                "timeline-item.html",
                            source:
                                timelineItemPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Timeline Item START",
                                endMarker:
                                    "// DEV SOURCE: Timeline Item END",
                            },
                        },
                        css: {
                            filename:
                                "timeline-item.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/timeline-item.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                timelineItemExamples,
                "Timeline Item",
                "Individual timeline event with semantic indicator, user metadata, relative timestamp, content, custom icon, and optional overflow actions.",
                timelineItemPreviewContent,
                timelineItemSourceModal
            );
        }

        const stepperExamples =
            createSection(
                componentsGroup,
                "Stepper",
                "Multi-step workflow navigation with horizontal and vertical layouts, semantic states, icons or custom numbers, per-step content, configurable Previous/Next controls, and async transition callbacks.",
                false
            );

        if (global.Builder.has("stepper")) {
            const stepperPreviewContent =
                document.createElement(
                    "div"
                );

            stepperPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Stepper START
            global.Builder.create(
                "stepper",
                {
                    layout:
                        "horizontal",
                    currentStep:
                        "payment",
                    steps: [
                        {
                            id:
                                "account",
                            label:
                                "Account",
                            description:
                                "Create your account.",
                            icon:
                                STEPPER_PREVIEW_ICONS.account,
                            content:
                                "<h3>Account</h3><p>Create the account that will be used for this setup.</p>",
                            state:
                                "complete",
                            next: {
                                label:
                                    "Continue",
                                icon:
                                    STEPPER_PREVIEW_ICONS.next,
                                variant:
                                    "primary",
                            },
                        },
                        {
                            id:
                                "shipping",
                            label:
                                "Shipping",
                            description:
                                "Enter shipping information.",
                            number:
                                "2",
                            content:
                                "<h3>Shipping</h3><p>Enter the shipping address and delivery preferences.</p>",
                            state:
                                "complete",
                            previous: {
                                label:
                                    "Back",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                            next: {
                                label:
                                    "Continue",
                                icon:
                                    STEPPER_PREVIEW_ICONS.next,
                            },
                        },
                        {
                            id:
                                "payment",
                            label:
                                "Payment",
                            description:
                                "Choose a payment method.",
                            number:
                                "3",
                            content:
                                "<h3>Payment</h3><p>Select and confirm the payment method for this example workflow.</p>",
                            state:
                                "current",
                            previous: {
                                label:
                                    "Shipping",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                            next: {
                                label:
                                    "Review Order",
                                icon:
                                    STEPPER_PREVIEW_ICONS.next,
                                variant:
                                    "success",
                            },
                        },
                        {
                            id:
                                "review",
                            label:
                                "Review",
                            description:
                                "Review and confirm.",
                            number:
                                "4",
                            content:
                                "<h3>Review</h3><p>Review the configured values before completing the workflow.</p>",
                            state:
                                "incomplete",
                            previous: {
                                label:
                                    "Payment",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                        },
                    ],
                    previousControlVisible:
                        true,
                    nextControlVisible:
                        true,
                }
            ).appendTo(
                stepperPreviewContent
            );

            global.Builder.create(
                "stepper",
                {
                    layout:
                        "vertical",
                    currentStep:
                        "profile",
                    steps: [
                        {
                            id:
                                "details",
                            label:
                                "Requirements",
                            description:
                                "Review installation requirements.",
                            number:
                                "1",
                            content:
                                "<h3>Requirements</h3><p>Review the environment requirements before starting the installation.</p>",
                            state:
                                "complete",
                            next: {
                                label:
                                    "Continue",
                                icon:
                                    STEPPER_PREVIEW_ICONS.next,
                            },
                        },
                        {
                            id:
                                "profile",
                            label:
                                "Configuration",
                            description:
                                "Configure installation options.",
                            number:
                                "2",
                            content:
                                "<h3>Configuration</h3><p>Configure the settings that will be used during installation.</p>",
                            state:
                                "current",
                            previous: {
                                label:
                                    "Requirements",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                            next: {
                                label:
                                    "Start Installation",
                                icon:
                                    STEPPER_PREVIEW_ICONS.install,
                                variant:
                                    "success",
                                callback:
                                    async function () {
                                        await new Promise(
                                            function (resolve) {
                                                global.setTimeout(
                                                    resolve,
                                                    500
                                                );
                                            }
                                        );

                                        return true;
                                    },
                            },
                        },
                        {
                            id:
                                "verification",
                            label:
                                "Installation",
                            description:
                                "Install the configured application.",
                            icon:
                                STEPPER_PREVIEW_ICONS.install,
                            content:
                                "<h3>Installation</h3><p>The installation callback completed successfully and navigation advanced to this step.</p>",
                            state:
                                "error",
                            previous: {
                                label:
                                    "Configuration",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                            next: {
                                label:
                                    "Continue",
                                icon:
                                    STEPPER_PREVIEW_ICONS.next,
                            },
                        },
                        {
                            id:
                                "security",
                            label:
                                "Disabled Step",
                            description:
                                "This step cannot be selected.",
                            number:
                                "4",
                            content:
                                "<h3>Disabled</h3><p>This content should never become active while the step remains disabled.</p>",
                            state:
                                "disabled",
                            disabled:
                                true,
                        },
                        {
                            id:
                                "finish",
                            label:
                                "Complete",
                            description:
                                "Finish the installation.",
                            number:
                                "5",
                            content:
                                "<h3>Installation Complete</h3><p>The example installation workflow has reached its final step.</p>",
                            state:
                                "incomplete",
                            previous: {
                                label:
                                    "Back",
                                icon:
                                    STEPPER_PREVIEW_ICONS.previous,
                            },
                        },
                    ],
                    previousControlVisible:
                        true,
                    nextControlVisible:
                        true,
                }
             ).appendTo(
                stepperPreviewContent
            );

             // DEV SOURCE: Stepper END

            const stepperSourceModal =
                createSourceModal(
                    "Stepper Source",
                    {
                        html: {
                            filename:
                                "stepper.html",
                            source:
                                stepperPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Stepper START",
                                endMarker:
                                    "// DEV SOURCE: Stepper END",
                            },
                        },
                        css: {
                            filename:
                                "stepper.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/stepper.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                stepperExamples,
                "Stepper",
                "Multi-step workflow navigation with horizontal and vertical layouts, semantic states, icons or custom numbers, per-step content, configurable Previous/Next controls, and async transition callbacks.",
                stepperPreviewContent,
                stepperSourceModal
            );
        }

        const tableOfContentExamples =
            createSection(
                componentsGroup,
                "Table of Content",
                "Floating page navigation with nested entries, persisted open state, and optional Scrollspy tracking.",
                false
            );

        // DEV SECTION: Avatar START
        const avatarExamples =
            createSection(
                componentsGroup,
                "Avatar",
                "Reusable profile image with initials fallback, standardized sizes, optional link, and broken-image fallback.",
                false
            );

        if (global.Builder.has("avatar")) {
            const avatarPreviewContent =
                document.createElement(
                    "div"
                );

            avatarPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Avatar START
            global.Builder.create(
                "avatar",
                {
                    name:
                        "Alex Morgan",
                    size:
                        "small",
                }
            ).appendTo(
                avatarPreviewContent
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Jamie Rivera",
                    size:
                        "medium",
                    href:
                        "/admin/dev/preview",
                }
            ).appendTo(
                avatarPreviewContent
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Taylor Chen",
                    src:
                        "https://picsum.photos/200/200",
                    size:
                        "large",
                }
            ).appendTo(
                avatarPreviewContent
            );

            global.Builder.create(
                "avatar",
                {
                    name:
                        "Morgan Lee",
                    src:
                        "/this-avatar-does-not-exist.png",
                    size:
                        "medium",
                }
            ).appendTo(
                avatarPreviewContent
            );

            // DEV SOURCE: Avatar END

            const avatarSourceModal =
                createSourceModal(
                    "Avatar Source",
                    {
                        html: {
                            filename:
                                "avatar.html",
                            source:
                                avatarPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Avatar START",
                                endMarker:
                                    "// DEV SOURCE: Avatar END",
                            },
                        },
                        css: {
                            filename:
                                "avatar.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/avatar.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                avatarExamples,
                "Avatar",
                "Reusable profile image with initials fallback, standardized sizes, optional link, and broken-image fallback.",
                avatarPreviewContent,
                avatarSourceModal
            );
        }
        // DEV SECTION: Avatar END

        // DEV SECTION: Badge START
        const badgeExamples =
            createSection(
                componentsGroup,
                "Badge",
                "Status and summary badge examples.",
                false
            );

        if (global.Builder.has("badge")) {
            const badgePreviewContent =
                document.createElement(
                    "div"
                );

            badgePreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const badgePreviewControls =
                document.createElement(
                    "div"
                );

            badgePreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Badge START
            const badgeOne =
                global.Builder.create(
                    "badge",
                    {
                        value: "42",
                        label: "Primary Badge",
                        color: "primary",
                        tooltip:
                            "Primary badge example",
                    }
                );

            const badgeTwo =
                global.Builder.create(
                    "badge",
                    {
                        value: "17",
                        label: "Success Badge",
                        color: "success",
                        tooltip:
                            "Success badge example",
                    }
                );

            badgeOne.appendTo(
                badgePreviewContent
            );

            badgeTwo.appendTo(
                badgePreviewContent
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                let badgeSortable =
                    null;

                const badgeSortableToggle =
                    createToggleControl(
                        badgeExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                        if (
                            badgeSortable !== null
                            && typeof badgeSortable.destroy
                                === "function"
                        ) {
                            badgeSortable.destroy();
                            badgeSortable = null;
                        }

                        if (!enabled) {
                            badgeOne.hideMoveHandle();
                            badgeTwo.hideMoveHandle();
                            return;
                        }

                        badgeOne.showMoveHandle();
                        badgeTwo.showMoveHandle();

                        badgeSortable =
                            global.Sortable.create(
                                badgePreviewContent,
                                {
                                    draggable:
                                        ".app-badge",
                                    handle:
                                        ".app-badge-move-handle",
                                    animation: 150,
                                }
                            );
                    }
                );

                if (
                    badgeSortableToggle !== null
                    && typeof badgeSortableToggle.element
                        === "function"
                ) {
                    badgePreviewControls.append(
                        badgeSortableToggle.element()
                    );
                }
            }

            // DEV SOURCE: Badge END

            const badgeSourceModal =
                createSourceModal(
                    "Badge Source",
                    {
                        html: {
                            filename:
                                "badge.html",
                            source:
                                badgePreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Badge START",
                                endMarker:
                                    "// DEV SOURCE: Badge END",
                            },
                        },
                        css: {
                            filename:
                                "badge.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/badge.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                badgeExamples,
                "Badge",
                "Status and summary badge examples.",
                badgePreviewContent,
                badgeSourceModal,
                badgePreviewControls
            );
        }
        // DEV SECTION: Badge END

        // DEV SECTION: Card START
        const cardExamples =
            createSection(
                componentsGroup,
                "Card",
                "Card layout and interactive control examples.",
                false
            );

        if (global.Builder.has("card")) {
            const cardPreviewContent =
                document.createElement(
                    "div"
                );

            cardPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const cardPreviewControls =
                document.createElement(
                    "div"
                );

            cardPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Card START
            const cardOne =
                global.Builder.create(
                    "card",
                    {
                        title: "Example Card One",
                        content:
                            "<p>Theme preview card content.</p>",
                        footer:
                            "Example footer",
                        controlMenuEnabled: true,
                        controlMenuItems: [
                            {
                                label:
                                    "Inspect",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Remove",
                                callback:
                                    function () {},
                            },
                        ],
                        collapseControlVisible: true,
                        fullscreenControlVisible: true,
                        closeControlVisible: true,
                    }
                );

            const cardTwo =
                global.Builder.create(
                    "card",
                    {
                        title: "Example Card Two",
                        content:
                            "<p>Second card for sortable testing.</p>",
                        footer:
                            "Example footer",
                                                controlMenuEnabled: true,
                        controlMenuItems: [
                            {
                                label:
                                    "Edit",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Archive",
                                callback:
                                    function () {},
                            },
                        ],
                        collapseControlVisible: true,

                        fullscreenControlVisible: true,
                        closeControlVisible: true,
                    }
                );

            cardOne.appendTo(
                cardPreviewContent
            );

            cardTwo.appendTo(
                cardPreviewContent
            );

            let cardElementFooterClickCount =
                0;

            const cardElementFooterButton =
                global.Builder.create(
                    "button",
                    {
                        label:
                            "Footer Button",
                        variant:
                            "primary",
                        size:
                            "small",
                        callback:
                            function () {
                                cardElementFooterClickCount +=
                                    1;

                                cardElementFooterButton.config(
                                    "label",
                                    "Clicked "
                                    + cardElementFooterClickCount
                                );

                                cardElementFooterButton.refresh();
                            },
                    }
                );

            const cardElementBody =
                document.createElement(
                    "div"
                );

            cardElementBody.innerHTML =
                "<p>This Card body was supplied as a DOM Element instead of an HTML string.</p>";

            const cardElementExample =
                global.Builder.create(
                    "card",
                    {
                        title:
                            "Element Content Card",
                        content:
                            cardElementBody,
                        footer:
                            cardElementFooterButton.element(),
                    }
                );

            cardElementExample.appendTo(
                cardPreviewContent
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                let cardSortable =
                    null;

                const cardSortableToggle =
                    createToggleControl(
                        cardExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                        if (
                            cardSortable !== null
                            && typeof cardSortable.destroy
                                === "function"
                        ) {
                            cardSortable.destroy();
                            cardSortable = null;
                        }

                        if (!enabled) {
                            cardOne.hideMoveHandle();
                            cardTwo.hideMoveHandle();
                            return;
                        }

                        cardOne.showMoveHandle();
                        cardTwo.showMoveHandle();

                        cardSortable =
                            global.Sortable.create(
                                cardPreviewContent,
                                {
                                    draggable:
                                        ".app-card",
                                    handle:
                                        ".app-card-move-handle",
                                    animation: 150,
                                }
                            );
                    }
                );

                if (
                    cardSortableToggle !== null
                    && typeof cardSortableToggle.element
                        === "function"
                ) {
                    cardPreviewControls.append(
                        cardSortableToggle.element()
                    );
                }
            }

            // DEV SOURCE: Card END

            const cardSourceModal =
                createSourceModal(
                    "Card Source",
                    {
                        html: {
                            filename:
                                "card.html",
                            source:
                                cardPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Card START",
                                endMarker:
                                    "// DEV SOURCE: Card END",
                            },
                        },
                        css: {
                            filename:
                                "card.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/card.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                cardExamples,
                "Card",
                "Card layout and interactive control examples.",
                cardPreviewContent,
                cardSourceModal,
                cardPreviewControls
            );
        }
        // DEV SECTION: Card END

        // DEV SECTION: Collapse START
        const collapseExamples =
            createSection(
                componentsGroup,
                "Collapse",
                "Reusable content region with programmatic collapse, expand, and toggle behavior.",
                false
            );

        if (
            global.Builder.has("collapse")
            && global.Builder.has("button")
        ) {
            const collapsePreviewContent =
                document.createElement(
                    "div"
                );

            collapsePreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const collapsePreviewControls =
                document.createElement(
                    "div"
                );

            collapsePreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Collapse START
            const collapseExample =
                global.Builder.create(
                    "collapse",
                    {
                        content:
                            "<p>This content is controlled by the reusable Collapse component.</p><p>The trigger remains external so any component can control the collapsed state.</p>",
                        collapsed:
                            false,
                    }
                );

            global.Builder.create(
                "button",
                {
                    label:
                        "Toggle Collapse",
                    variant:
                        "primary",
                    size:
                        "small",
                    callback:
                        function () {
                            collapseExample.toggle();
                        },
                }
            ).appendTo(
                collapsePreviewControls
            );

            collapseExample.appendTo(
                collapsePreviewContent
            );

            // DEV SOURCE: Collapse END

            const collapseSourceModal =
                createSourceModal(
                    "Collapse Source",
                    {
                        html: {
                            filename:
                                "collapse.html",
                            source:
                                collapsePreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Collapse START",
                                endMarker:
                                    "// DEV SOURCE: Collapse END",
                            },
                        },
                        css: {
                            filename:
                                "collapse.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/collapse.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                collapseExamples,
                "Collapse",
                "Reusable content region with programmatic collapse, expand, and toggle behavior.",
                collapsePreviewContent,
                collapseSourceModal,
                collapsePreviewControls
            );
        }
        // DEV SECTION: Collapse END

        // DEV SECTION: Dropdown START
        const dropdownExamples =
            createSection(
                componentsGroup,
                "Dropdown",
                "Reusable action dropdown with label, icon, links, callbacks, and disabled items.",
                false
            );

        if (global.Builder.has("dropdown")) {
            const dropdownPreviewContent =
                document.createElement(
                    "div"
                );

            dropdownPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Dropdown START
            global.Builder.create(
                "dropdown",
                {
                    triggerLabel:
                        "Actions",
                    triggerIcon:
                        DROPDOWN_PREVIEW_ICONS.menu,
                    triggerTitle:
                        "Actions",
                    items: [
                        {
                            label:
                                "Edit",
                            icon:
                                DROPDOWN_PREVIEW_ICONS.edit,
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Open Preview",
                            href:
                                "/admin/dev/preview",
                        },
                        {
                            label:
                                "Disabled",
                            disabled:
                                true,
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                dropdownPreviewContent
            );

            global.Builder.create(
                "dropdown",
                {
                    triggerIcon:
                        DROPDOWN_PREVIEW_ICONS.menu,
                    triggerTitle:
                        "More actions",
                    items: [
                        {
                            label:
                                "Edit",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Remove",
                            callback:
                                function () {},
                        },
                    ],
                }
            ).appendTo(
                dropdownPreviewContent
            );

            // DEV SOURCE: Dropdown END

            const dropdownSourceModal =
                createSourceModal(
                    "Dropdown Source",
                    {
                        html: {
                            filename:
                                "dropdown.html",
                            source:
                                dropdownPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Dropdown START",
                                endMarker:
                                    "// DEV SOURCE: Dropdown END",
                            },
                        },
                        css: {
                            filename:
                                "dropdown.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/dropdown.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                dropdownExamples,
                "Dropdown",
                "Reusable action dropdown with label, icon, links, callbacks, and disabled items.",
                dropdownPreviewContent,
                dropdownSourceModal
            );
        }
        // DEV SECTION: Dropdown END

        // DEV SECTION: Form Field START
        const fieldExamples =
            createSection(
                componentsGroup,
                "Form Field",
                "Form field label, description, and validation structure.",
                false
            );

        if (global.Builder.has("form-field")) {
            const fieldPreviewContent =
                document.createElement(
                    "div"
                );

            fieldPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Form Field START
            global.Builder.create(
                "form-field",
                {
                    controlId:
                        "dev-preview-field",
                    label:
                        "Example Field",
                    description:
                        "Example field description.",
                    error: "",
                    required: true,
                }
            ).appendTo(
                fieldPreviewContent
            );

            // DEV SOURCE: Form Field END

            const fieldSourceModal =
                createSourceModal(
                    "Form Field Source",
                    {
                        html: {
                            filename:
                                "form-field.html",
                            source:
                                fieldPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Form Field START",
                                endMarker:
                                    "// DEV SOURCE: Form Field END",
                            },
                        },
                        css: {
                            filename:
                                "form-field.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/form-field.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                fieldExamples,
                "Form Field",
                "Form field label, description, and validation structure.",
                fieldPreviewContent,
                fieldSourceModal
            );
        }
        // DEV SECTION: Form Field END

        // DEV SECTION: Input START
        const inputExamples =
            createSection(
                componentsGroup,
                "Input",
                "Input controls and input-group behavior.",
                false
            );

        if (global.Builder.has("input")) {
            const inputPreviewContent =
                document.createElement(
                    "div"
                );

            inputPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Input START
            global.Builder.create(
                "input",
                {
                    type: "text",
                    name:
                        "dev-preview-input",
                    value:
                        "Example value",
                    label:
                        "Text Input",
                    placeholder:
                        "Example placeholder",
                    clearActionEnabled: true,
                }
            ).appendTo(
                inputPreviewContent
            );

            // DEV SOURCE: Input END

            const inputSourceModal =
                createSourceModal(
                    "Input Source",
                    {
                        html: {
                            filename:
                                "input.html",
                            source:
                                inputPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Input START",
                                endMarker:
                                    "// DEV SOURCE: Input END",
                            },
                        },
                        css: {
                            filename:
                                "input.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/input.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                inputExamples,
                "Input",
                "Input controls and input-group behavior.",
                inputPreviewContent,
                inputSourceModal
            );
        }
        // DEV SECTION: Input END

        // DEV SECTION: Select START
        const selectExamples =
            createSection(
                componentsGroup,
                "Select",
                "Native Select and optional Select2 integration.",
                false
            );

        if (global.Builder.has("select")) {
            const selectPreviewContent =
                document.createElement(
                    "div"
                );

            selectPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const selectPreviewControls =
                document.createElement(
                    "div"
                );

            selectPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Select START
            const selectExample =
                global.Builder.create(
                    "select",
                    {
                        name:
                            "dev-preview-select",
                        label:
                            "Example Select",
                        options: [
                            {
                                value: "one",
                                label: "Option One",
                            },
                            {
                                value: "two",
                                label: "Option Two",
                            },
                            {
                                value: "three",
                                label: "Option Three",
                            },
                        ],
                        value: "one",
                        select2Enabled: false,
                    }
                );

            selectExample.appendTo(
                selectPreviewContent
            );

            if (
                global.jQuery
                && global.jQuery.fn
                && typeof global.jQuery.fn.select2
                    === "function"
            ) {
                const select2Toggle =
                    createToggleControl(
                        selectExamples,
                        "Select2",
                        false,
                        function (enabled) {
                            selectExample.config(
                                "select2Enabled",
                                enabled
                            );

                            selectExample.refresh();
                        }
                    );

                if (
                    select2Toggle !== null
                    && typeof select2Toggle.element
                        === "function"
                ) {
                    selectPreviewControls.append(
                        select2Toggle.element()
                    );
                }
            }

            // DEV SOURCE: Select END

            const selectSourceModal =
                createSourceModal(
                    "Select Source",
                    {
                        html: {
                            filename:
                                "select.html",
                            source:
                                selectPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Select START",
                                endMarker:
                                    "// DEV SOURCE: Select END",
                            },
                        },
                        css: {
                            filename:
                                "select.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/select.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                selectExamples,
                "Select",
                "Native Select and optional Select2 integration.",
                selectPreviewContent,
                selectSourceModal,
                selectPreviewControls
            );
        }
        // DEV SECTION: Select END

        // DEV SECTION: vCard START
        const vcardExamples =
            createSection(
                componentsGroup,
                "vCard",
                "Contact and organization identity card examples.",
                false
            );

        if (global.Builder.has("vcard")) {
            const vcardPreviewContent =
                document.createElement(
                    "div"
                );

            vcardPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const vcardPreviewControls =
                document.createElement(
                    "div"
                );

            vcardPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: vCard START
            const vcardConfigs = [
                {
                    name: "Alex Morgan",
                    organization: "Core-Web",
                    title: "Developer",
                    tags: [
                        "Administrator",
                        "Engineering",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "alex@example.com",
                            href: "mailto:alex@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2026",
                            href: "tel:+15550102026",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "123 Example Street, Montreal, QC",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Status",
                            value: "Active · Full-time",
                        },
                    ],
                    links: [
                        {
                            label: "Website",
                            href: "https://example.com",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Jamie Rivera",
                    organization: "Example Inc.",
                    title: "Operations Manager",
                    tags: [
                        "Manager",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "jamie@example.com",
                            href: "mailto:jamie@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2027",
                            href: "tel:+15550102027",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "456 Example Avenue, Toronto, ON",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Department",
                            value: "Operations · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Taylor Chen",
                    organization: "Core-Web",
                    title: "Designer",
                    tags: [
                        "Design",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "taylor@example.com",
                            href: "mailto:taylor@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2028",
                            href: "tel:+15550102028",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "789 Example Road, Vancouver, BC",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Work",
                            value: "UI/UX · Remote",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Morgan Patel",
                    organization: "Example Inc.",
                    title: "Account Manager",
                    tags: [
                        "Sales",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "morgan@example.com",
                            href: "mailto:morgan@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2029",
                            href: "tel:+15550102029",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "101 Example Boulevard, Ottawa, ON",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Department",
                            value: "Accounts · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Jordan Smith",
                    organization: "Core-Web",
                    title: "Support Specialist",
                    tags: [
                        "Support",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "jordan@example.com",
                            href: "mailto:jordan@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2030",
                            href: "tel:+15550102030",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "202 Example Lane, Calgary, AB",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Support",
                            value: "Tier 2 · Online",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Remove",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
                {
                    name: "Casey Williams",
                    organization: "Example Inc.",
                    title: "Project Coordinator",
                    tags: [
                        "Projects",
                    ],
                    metadata: [
                        {
                            icon: VCARD_PREVIEW_ICONS.email,
                            label: "Email",
                            value: "casey@example.com",
                            href: "mailto:casey@example.com",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.phone,
                            label: "Phone",
                            value: "+1 555 010 2031",
                            href: "tel:+15550102031",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.address,
                            label: "Address",
                            value: "303 Example Drive, Halifax, NS",
                        },
                        {
                            icon: VCARD_PREVIEW_ICONS.status,
                            label: "Role",
                            value: "Coordinator · Active",
                        },
                    ],
                    menuActions: [
                        {
                            label: "Edit",
                            callback: function () {},
                        },
                        {
                            label: "Archive",
                            callback: function () {},
                        },
                    ],
                    actions: [
                        {
                            label: "Profile",
                            href: "/admin/dev/preview",
                            color: "primary",
                        },
                        {
                            label: "Message",
                            callback: function () {},
                            color: "info",
                        },
                    ],
                },
            ];

            const vcardGrid =
                global.Builder.create(
                    "vcard-grid",
                    {
                        items:
                            vcardConfigs,
                        searchEnabled:
                            true,
                        sortableEnabled:
                            false,
                        searchPlaceholder:
                            "Search contacts…",
                        emptyMessage:
                            "No matching contacts.",
                    }
                );

            vcardGrid.appendTo(
                vcardPreviewContent
            );


            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                const vcardSortableToggle =
                    createToggleControl(
                        vcardExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                            vcardGrid.config(
                                "sortableEnabled",
                                enabled
                            );

                            vcardGrid.refresh();
                        }
                    );

                if (
                    vcardSortableToggle !== null
                    && typeof vcardSortableToggle.element
                        === "function"
                ) {
                    vcardPreviewControls.append(
                        vcardSortableToggle.element()
                    );
                }
            }
            // DEV SOURCE: vCard END

            const vcardSourceModal =
                createSourceModal(
                    "vCard Source",
                    {
                        html: {
                            filename:
                                "vcard.html",
                            source:
                                vcardPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: vCard START",
                                endMarker:
                                    "// DEV SOURCE: vCard END",
                            },
                        },
                        css: {
                            filename:
                                "vcard-grid.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/vcard-grid.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                vcardExamples,
                "vCard",
                "Contact and organization identity card examples.",
                vcardPreviewContent,
                vcardSourceModal,
                vcardPreviewControls
            );
        }
        // DEV SECTION: vCard END

        // DEV SECTION: List START
        const listExamples =
            createSection(
                componentsGroup,
                "List",
                "Searchable and sortable list with optional actions.",
                false
            );

        if (global.Builder.has("list")) {
            const listPreviewContent =
                document.createElement(
                    "div"
                );

            listPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const listPreviewControls =
                document.createElement(
                    "div"
                );

            listPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: List START
            const listExample =
                global.Builder.create(
                    "list",
                    {
                        searchEnabled: true,
                        sortableEnabled: false,
                        items: [
                            {
                                id: "alpha",
                                title: "Alpha",
                                description:
                                    "First example list item.",
                                metadata: [
                                    "Example",
                                    "Enabled",
                                ],
                                actions: [
                                    {
                                        label: "Inspect",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id: "bravo",
                                title: "Bravo",
                                description:
                                    "Second example list item.",
                                metadata: [
                                    "Example",
                                ],
                                actions: [
                                    {
                                        label: "Edit",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label: "Remove",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                        ],
                    }
                );

            listExample.appendTo(
                listPreviewContent
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                const listSortableToggle =
                    createToggleControl(
                        listExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                            listExample.config(
                                "sortableEnabled",
                                enabled
                            );

                            listExample.refresh();
                        }
                    );

                if (
                    listSortableToggle !== null
                    && typeof listSortableToggle.element
                        === "function"
                ) {
                    listPreviewControls.append(
                        listSortableToggle.element()
                    );
                }
            }

            // DEV SOURCE: List END

            const listSourceModal =
                createSourceModal(
                    "List Source",
                    {
                        html: {
                            filename:
                                "list.html",
                            source:
                                listPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: List START",
                                endMarker:
                                    "// DEV SOURCE: List END",
                            },
                        },
                        css: {
                            filename:
                                "list.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/list.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                listExamples,
                "List",
                "Searchable and sortable list with optional actions.",
                listPreviewContent,
                listSourceModal,
                listPreviewControls
            );
        }
        // DEV SECTION: List END

        // DEV SECTION: Table START
        const tableExamples =
            createSection(
                componentsGroup,
                "Table",
                "Structured tabular data with optional DataTables enhancement.",
                false
            );

        if (global.Builder.has("table")) {
            const tablePreviewContent =
                document.createElement(
                    "div"
                );

            tablePreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const tablePreviewControls =
                document.createElement(
                    "div"
                );

            tablePreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Table START
            const tableExample =
                global.Builder.create(
                    "table",
                    {
                        caption:
                            "Example Table",
                        columns: [
                            {
                                key: "name",
                                label: "Name",
                            },
                            {
                                key: "status",
                                label: "Status",
                            },
                        ],
                        rows: [
                            {
                                name: "Alpha",
                                status: "Enabled",
                            },
                            {
                                name: "Bravo",
                                status: "Disabled",
                            },
                        ],
                        actions: [
                            {
                                id: "inspect",
                                label: "Inspect",
                                handler:
                                    function () {},
                                visible:
                                    function (
                                        row
                                    ) {
                                        return row.name
                                            === "Alpha";
                                    },
                            },
                            {
                                id: "edit",
                                label: "Edit",
                                handler:
                                    function () {},
                            },
                            {
                                id: "remove",
                                label: "Remove",
                                handler:
                                    function () {},
                                disabled:
                                    function (
                                        row,
                                        rowIndex,
                                        table,
                                        context
                                    ) {
                                        return !context
                                            .selectedRowIndexes
                                            .includes(
                                                rowIndex
                                            );
                                    },
                            },
                        ],
                        selectable: true,
                        multiSelect: true,
                        dataTableEnabled: false,
                    }
                );

            tableExample.appendTo(
                tablePreviewContent
            );

            if (
                typeof global.DataTable === "function"
                || (
                    global.jQuery
                    && global.jQuery.fn
                    && typeof global.jQuery.fn.dataTable
                        === "function"
                )
            ) {
                const tableDataTablesToggle =
                    createToggleControl(
                        tableExamples,
                        "DataTables",
                        false,
                        function (enabled) {
                            tableExample.config(
                                "dataTableEnabled",
                                enabled
                            );

                            tableExample.refresh();
                        }
                    );

                if (
                    tableDataTablesToggle !== null
                    && typeof tableDataTablesToggle.element
                        === "function"
                ) {
                    tablePreviewControls.append(
                        tableDataTablesToggle.element()
                    );
                }
            }

            // DEV SOURCE: Table END

            const tableSourceModal =
                createSourceModal(
                    "Table Source",
                    {
                        html: {
                            filename:
                                "table.html",
                            source:
                                tablePreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Table START",
                                endMarker:
                                    "// DEV SOURCE: Table END",
                            },
                        },
                        css: {
                            filename:
                                "table.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/table.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                tableExamples,
                "Table",
                "Structured tabular data with optional DataTables enhancement.",
                tablePreviewContent,
                tableSourceModal,
                tablePreviewControls
            );
        }
        // DEV SECTION: Table END

        // DEV SECTION: Tabs START
        const tabsExamples =
            createSection(
                componentsGroup,
                "Tabs",
                "Tabbed content with programmatic selection, disabled tabs, icons, and keyboard navigation.",
                false
            );

        if (global.Builder.has("tabs")) {
            const tabsPreviewContent =
                document.createElement(
                    "div"
                );

            tabsPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const tabsPreviewControls =
                document.createElement(
                    "div"
                );

            tabsPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Tabs START
            const tabsExample =
                global.Builder.create(
                    "tabs",
                    {
                        selectedTab:
                            "overview",
                        actions: [
                            {
                                label:
                                    "Refresh",
                                callback:
                                    function () {},
                            },
                            {
                                label:
                                    "Settings",
                                callback:
                                    function () {},
                            },
                        ],
                        tabs: [
                            {
                                id:
                                    "overview",
                                label:
                                    "Overview",
                                icon:
                                    TABS_PREVIEW_ICONS.overview,
                                content:
                                    "<p>Overview tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Edit overview",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label:
                                            "Export overview",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "details",
                                label:
                                    "Details",
                                content:
                                    "<p>Details tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Edit details",
                                        callback:
                                            function () {},
                                    },
                                    {
                                        label:
                                            "Copy details",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "activity",
                                label:
                                    "Activity",
                                content:
                                    "<p>Activity tab content.</p>",
                                panelActions: [
                                    {
                                        label:
                                            "Clear activity",
                                        callback:
                                            function () {},
                                    },
                                ],
                            },
                            {
                                id:
                                    "disabled",
                                label:
                                    "Disabled",
                                content:
                                    "<p>This content should not be selectable while the tab is disabled.</p>",
                                disabled:
                                    true,
                            },
                        ],
                    }
                );

            tabsExample.appendTo(
                tabsPreviewContent
            );

            if (
                typeof global.Sortable === "function"
                || (
                    global.Sortable !== null
                    && typeof global.Sortable === "object"
                    && typeof global.Sortable.create === "function"
                )
            ) {
                const tabsSortableToggle =
                    createToggleControl(
                        tabsExamples,
                        "Sortable",
                        false,
                        function (enabled) {
                            if (enabled) {
                                tabsExample.enableSortable();

                                return;
                            }

                            tabsExample.disableSortable();
                        }
                    );

                if (
                    tabsSortableToggle !== null
                    && typeof tabsSortableToggle.element
                        === "function"
                ) {
                    tabsPreviewControls.append(
                        tabsSortableToggle.element()
                    );
                }
            }

            global.Builder.create(
                "tabs",
                {
                    presentation:
                        "pills",
                    selectedTab:
                        "overview",
                    actions: [
                        {
                            label:
                                "Refresh",
                            callback:
                                function () {},
                        },
                        {
                            label:
                                "Settings",
                            callback:
                                function () {},
                        },
                    ],
                    tabs: [
                        {
                            id:
                                "overview",
                            label:
                                "Overview",
                            icon:
                                TABS_PREVIEW_ICONS.overview,
                            content:
                                "<p>Pill-style overview content.</p>",
                        },
                        {
                            id:
                                "details",
                            label:
                                "Details",
                            content:
                                "<p>Pill-style details content.</p>",
                        },
                        {
                            id:
                                "activity",
                            label:
                                "Activity",
                            content:
                                "<p>Pill-style activity content.</p>",
                        },
                        {
                            id:
                                "disabled",
                            label:
                                "Disabled",
                            content:
                                "<p>This pill should remain disabled.</p>",
                            disabled:
                                true,
                        },
                    ],
                }
            ).appendTo(
                tabsPreviewContent
            );

            global.devTabsExample =
                tabsExample;

            // DEV SOURCE: Tabs END

            const tabsSourceModal =
                createSourceModal(
                    "Tabs Source",
                    {
                        html: {
                            filename:
                                "tabs.html",
                            source:
                                tabsPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Tabs START",
                                endMarker:
                                    "// DEV SOURCE: Tabs END",
                            },
                        },
                        css: {
                            filename:
                                "tabs.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/tabs.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                tabsExamples,
                "Tabs",
                "Tabbed content with programmatic selection, disabled tabs, icons, and keyboard navigation.",
                tabsPreviewContent,
                tabsSourceModal,
                tabsPreviewControls
            );
        }
        // DEV SECTION: Tabs END

        // DEV SECTION: Post START

        const postExamples =
            createSection(
                componentsGroup,
                "Post",
                "Social-style post with author identity, categories, attachments, actions, and optional comments.",
                false
            );

        if (global.Builder.has("post")) {
            const postPreviewContent =
                document.createElement(
                    "div"
                );

            postPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Post START

            global.Builder.create(
                "post",
                {
                    author: {
                        name:
                            "Alex Morgan",
                        title:
                            "Developer",
                        href:
                            "/admin/dev/preview",
                    },
                    timestamp:
                        "2026-08-17T10:30:00-04:00",
                    content:
                        "<p>This Post example exercises identity, relative time, categories, attachments, overflow actions, and direct social actions.</p><p>It also provides enough content to evaluate spacing between the different Post regions.</p>",
                    categories: [
                        "Announcement",
                        "Engineering",
                    ],
                    status:
                        "Published",
                    attachments: [
                        {
                            type:
                                "image",
                            label:
                                "Preview image",
                            url:
                                "/admin/dev/preview",
                            preview:
                                "https://picsum.photos/800/450",
                            metadata:
                                "Image · 800 × 450",
                        },
                        {
                            type:
                                "file",
                            label:
                                "Project notes.pdf",
                            url:
                                "/admin/dev/preview",
                            metadata:
                                "PDF · 2.4 MB",
                        },
                    ],
                    editControlVisible:
                        true,
                    deleteControlVisible:
                        true,
                    archiveControlVisible:
                        true,
                    likeControlVisible:
                        true,
                    shareControlVisible:
                        true,
                    commentsControlVisible:
                        true,
                    liked:
                        true,
                    shared:
                        false,
                    likeCount:
                        12,
                    shareCount:
                        4,
                    commentCount:
                        3,
                    onEdit:
                        function () {},
                    onDelete:
                        function () {},
                    onArchive:
                        function () {},
                    onLike:
                        function () {},
                    onShare:
                        function () {},
                    onViewComments:
                        function () {},
                }
            ).appendTo(
                postPreviewContent
            );

            global.Builder.create(
                "post",
                {
                    author: {
                        name:
                            "Jamie Rivera",
                        title:
                            "Operations Manager",
                    },
                    timestamp:
                        "2026-08-17T11:15:00-04:00",
                    content:
                        "<p>This Post demonstrates the embedded Comments component.</p>",
                    categories: [
                        "Discussion",
                    ],
                    status:
                        "Draft",
                    commentsControlVisible:
                        true,
                    commentCount:
                        2,
                    onViewComments:
                        function () {},
                    commentsVisible:
                        false,
                    commentsConfig: {
                        title:
                            "Discussion",
                        titleVisible:
                            true,
                        indentationEnabled:
                            true,
                        maxIndentDepth:
                            3,
                    },
                    comments: [
                        {
                            id:
                                "post-comment-one",
                            author: {
                                name:
                                    "Taylor Chen",
                                title:
                                    "Designer",
                            },
                            timestamp:
                                "2026-08-17T11:20:00-04:00",
                            content:
                                "<p>The embedded Comments layout looks good here.</p>",
                            likeControlVisible:
                                true,
                            replyControlVisible:
                                true,
                            likeCount:
                                2,
                            onLike:
                                function () {},
                            onDislike:
                                function () {},
                            onReply:
                                function () {},
                            replies: [
                                {
                                    id:
                                        "post-comment-reply-one",
                                    author: {
                                        name:
                                            "Alex Morgan",
                                        title:
                                            "Developer",
                                    },
                                    timestamp:
                                        "2026-08-17T11:25:00-04:00",
                                    content:
                                        "<p>This reply verifies nested Comments inside a Post.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                },
                            ],
                        },
                    ],
                }
            ).appendTo(
                postPreviewContent
            );

            // DEV SOURCE: Post END

            const postSourceModal =
                createSourceModal(
                    "Post Source",
                    {
                        html: {
                            filename:
                                "post.html",
                            source:
                                postPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Post START",
                                endMarker:
                                    "// DEV SOURCE: Post END",
                            },
                        },
                        css: {
                            filename:
                                "post.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/post.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                postExamples,
                "Post",
                "Social-style post with author identity, categories, attachments, actions, and optional comments.",
                postPreviewContent,
                postSourceModal
            );
        }
        // DEV SECTION: Post END

        // DEV SECTION: Feed START
        const feedExamples =
            createSection(
                widgetsGroup,
                "Feed",
                "Searchable collection of Post components filtered by author, content, categories, and status.",
                false
            );

        if (global.Builder.has("feed")) {
            const feedPreviewContent =
                document.createElement(
                    "div"
                );

            feedPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            // DEV SOURCE: Feed START
            global.Builder.create(
                "feed",
                {
                    searchEnabled:
                        true,
                    searchPlaceholder:
                        "Search feed…",
                    emptyMessage:
                        "No matching posts.",
                    posts: [
                        {
                            author: {
                                name:
                                    "Alex Morgan",
                                title:
                                    "Developer",
                                href:
                                    "/admin/dev/preview",
                            },
                            timestamp:
                                "2026-08-17T09:15:00-04:00",
                            content:
                                "<p>The engineering team completed the new Builder feed component.</p>",
                            categories: [
                                "Engineering",
                                "Announcement",
                            ],
                            status:
                                "Published",
                            likeControlVisible:
                                true,
                            shareControlVisible:
                                true,
                            commentsControlVisible:
                                true,
                            likeCount:
                                8,
                            shareCount:
                                2,
                            commentCount:
                                4,
                            commentsVisible:
                                false,
                            comments: [
                                {
                                    id:
                                        "c-001",
                                    author: {
                                        name:
                                            "Jamie Rivera",
                                        title:
                                            "Operations Manager",
                                    },
                                    timestamp:
                                        "2026-08-17T09:25:00-04:00",
                                    content:
                                        "<p>Nice work. This should make activity streams much easier to build.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    likeCount:
                                        3,
                                    dislikeCount:
                                        0,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                    replies: [
                                        {
                                            id:
                                                "c-002",
                                            author: {
                                                name:
                                                    "Taylor Chen",
                                                title:
                                                    "Designer",
                                            },
                                            timestamp:
                                                "2026-08-17T09:32:00-04:00",
                                            content:
                                                "<p>The Feed layout works nicely with the existing Post presentation.</p>",
                                            likeControlVisible:
                                                true,
                                            replyControlVisible:
                                                true,
                                            likeCount:
                                                1,
                                            dislikeCount:
                                                0,
                                            onLike:
                                                function () {},
                                            onDislike:
                                                function () {},
                                            onReply:
                                                function () {},
                                        },
                                    ],
                                },
                                {
                                    id:
                                        "c-003",
                                    author: {
                                        name:
                                            "Morgan Lee",
                                        title:
                                            "Product Manager",
                                    },
                                    timestamp:
                                        "2026-08-17T09:41:00-04:00",
                                    content:
                                        "<p>Search across the different post fields is especially useful.</p>",
                                    likeControlVisible:
                                        true,
                                    replyControlVisible:
                                        true,
                                    likeCount:
                                        2,
                                    dislikeCount:
                                        0,
                                    onLike:
                                        function () {},
                                    onDislike:
                                        function () {},
                                    onReply:
                                        function () {},
                                    replies: [
                                        {
                                            id:
                                                "c-004",
                                            author: {
                                                name:
                                                    "Casey Smith",
                                                title:
                                                    "QA Engineer",
                                            },
                                            timestamp:
                                                "2026-08-17T09:48:00-04:00",
                                            content:
                                                "<p>I tested the empty state and several search combinations successfully.</p>",
                                            likeControlVisible:
                                                true,
                                            replyControlVisible:
                                                true,
                                            likeCount:
                                                1,
                                            dislikeCount:
                                                0,
                                            onLike:
                                                function () {},
                                            onDislike:
                                                function () {},
                                            onReply:
                                                function () {},
                                        },
                                    ],
                                },
                            ],
                            onLike:
                                function () {},
                            onShare:
                                function () {},
                            onViewComments:
                                function () {},
                        },
                        {
                            author: {
                                name:
                                    "Jamie Rivera",
                                title:
                                    "Operations Manager",
                            },
                            timestamp:
                                "2026-08-17T10:45:00-04:00",
                            content:
                                "<p>Operations notes for the upcoming deployment window are ready for internal review.</p>",
                            categories: [
                                "Operations",
                                "Internal",
                            ],
                            status:
                                "Draft",
                            commentsControlVisible:
                                true,
                            commentCount:
                                1,
                            onViewComments:
                                function () {},
                        },
                        {
                            author: {
                                name:
                                    "Taylor Chen",
                                title:
                                    "Designer",
                            },
                            timestamp:
                                "2026-08-17T12:30:00-04:00",
                            content:
                                "<p>The interface accessibility review is scheduled for the next design session.</p>",
                            categories: [
                                "Design",
                                "Accessibility",
                            ],
                            status:
                                "Scheduled",
                        },
                    ],
                }
            ).appendTo(
                feedPreviewContent
            );

            // DEV SOURCE: Feed END

            const feedSourceModal =
                createSourceModal(
                    "Feed Source",
                    {
                        html: {
                            filename:
                                "feed.html",
                            source:
                                feedPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Feed START",
                                endMarker:
                                    "// DEV SOURCE: Feed END",
                            },
                        },
                        css: {
                            filename:
                                "feed.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/feed.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                feedExamples,
                "Feed",
                "Searchable collection of Post components filtered by author, content, categories, and status.",
                feedPreviewContent,
                feedSourceModal
            );
        }
        // DEV SECTION: Feed END

        // DEV SECTION: Comment START
        const commentExamples =
            createSection(
                componentsGroup,
                "Comment",
                "Social-style comment with author, timestamp, action, and optional replies.",
                false
            );

        const commentPreviewContent =
            document.createElement(
                "div"
            );

        commentPreviewContent.classList.add(
            "dev-theme-preview-card-content"
        );

        // DEV SOURCE: Comment START
        if (global.Builder.has("comment")) {
            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Alex Morgan",
                        title:
                            "Developer",
                        href:
                            "/admin/dev/preview",
                    },
                    timestamp:
                        "2026-08-13T11:45:00-04:00",
                    content:
                        "<p>This comment demonstrates the complete Comment control set, including overflow and direct actions.</p>",
                    status:
                        "Approved",
                    editControlVisible:
                        true,
                    deleteControlVisible:
                        true,
                    likeControlVisible:
                        true,
                    replyControlVisible:
                        true,
                    onEdit:
                        function () {},
                    onDelete:
                        function () {},
                    onLike:
                        function () {},
                    onReply:
                        function () {},
                }
            ).appendTo(
                commentPreviewContent
            );

            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Jamie Rivera",
                        title:
                            "Operations Manager",
                    },
                    timestamp:
                        "2026-08-12T13:30:00-04:00",
                    content:
                        "<p>This example has no status and no actions, validating the minimal Comment presentation.</p>",
                }
            ).appendTo(
                commentPreviewContent
            );

            global.Builder.create(
                "comment",
                {
                    author: {
                        name:
                            "Taylor Chen",
                        title:
                            "Designer",
                    },
                    timestamp:
                        "2026-08-13T13:30:00-04:00",
                    content:
                        "<p>This comment exposes Like and Reply without the overflow Edit/Delete menu.</p>",
                    status:
                        "Visible",
                    likeControlVisible:
                        true,
                    replyControlVisible:
                        true,
                    onLike:
                        function () {},
                    onDislike:
                        function () {},
                    onReply:
                        function () {},
                }
            ).appendTo(
                commentPreviewContent
            );

            const commentControlExample =
                global.Builder.create(
                    "comment",
                    {
                        author: {
                            name:
                                "Morgan Patel",
                            title:
                                "Account Manager",
                        },
                        timestamp:
                            "2026-08-13T13:44:00-04:00",
                        content:
                            "<p>This comment exposes only the Edit and Delete overflow actions.</p>",
                        editControlVisible:
                            true,
                        deleteControlVisible:
                            true,
                        likeControlVisible:
                            true,
                        replyControlVisible:
                            true,
                        liked:
                            true,
                        disliked:
                            false,
                        likeCount:
                            12,
                        dislikeCount:
                            3,
                        onEdit:
                            function () {},
                        onDelete:
                            function () {},
                        onLike:
                            function () {},
                        onDislike:
                            function () {},
                        onReply:
                            function () {},
                    }
                );

            commentControlExample.appendTo(
                commentPreviewContent
            );
        }
        // DEV SOURCE: Comment END

        const commentSourceModal =
            createSourceModal(
                "Comment Source",
                {
                    html: {
                        filename:
                            "comment.html",
                        source:
                            commentPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Comment START",
                            endMarker:
                                "// DEV SOURCE: Comment END",
                        },
                    },
                    css: {
                        filename:
                            "comment.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/comment.less",
                        },
                    },
                }
            );

        createPreviewCard(
            commentExamples,
            "Comment",
            "Social-style comment with author, timestamp, action, and optional replies.",
            commentPreviewContent,
            commentSourceModal
        );
        // DEV SECTION: Comment END
        // DEV SECTION: Comments START
        const commentsExamples =
            createSection(
                componentsGroup,
                "Comments",
                "Nested discussion collection with configurable indentation, reply depth, empty state, and section-level actions.",
                false
            );

        const commentsPreviewContent =
            document.createElement(
                "div"
            );

        commentsPreviewContent.classList.add(
            "dev-theme-preview-card-content"
        );

        const commentsPreviewControls =
            document.createElement(
                "div"
            );

        commentsPreviewControls.classList.add(
            "dev-theme-preview-card-controls"
        );

        // DEV SOURCE: Comments START
        if (global.Builder.has("comments")) {
            const commentsExample =
                global.Builder.create(
                    "comments",
                    {
                        title:
                            "Discussion",
                        titleVisible:
                            true,
                        indentationEnabled:
                            true,
                        replyDepth:
                            3,
                        emptyStateVisible:
                            true,
                        actions:
                            [
                                {
                                    label:
                                        "New Comment",
                                    variant:
                                        "primary",
                                    callback:
                                        function () {},
                                },
                                {
                                    label:
                                        "Refresh",
                                    variant:
                                        "secondary",
                                    callback:
                                        function () {},
                                },
                            ],
                    }
                );

            commentsExample.appendTo(
                commentsPreviewContent
            );

            const commentsIndentationToggle =
                createToggleControl(
                    commentsExamples,
                    "Indentation",
                    true,
                    function (enabled) {
                        if (enabled) {
                            commentsExample.enableIndentation();

                            return;
                        }

                        commentsExample.disableIndentation();
                    }
                );

            if (
                commentsIndentationToggle !== null
                && typeof commentsIndentationToggle.element
                    === "function"
            ) {
                commentsPreviewControls.append(
                    commentsIndentationToggle.element()
                );
            }
        }
        // DEV SOURCE: Comments END

        const commentsSourceModal =
            createSourceModal(
                "Comments Source",
                {
                    html: {
                        filename:
                            "comments.html",
                        source:
                            commentsPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Comments START",
                            endMarker:
                                "// DEV SOURCE: Comments END",
                        },
                    },
                    css: {
                        filename:
                            "comments.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/comments.less",
                        },
                    },
                }
            );

        if (global.Builder.has("comments")) {
            createPreviewCard(
                commentsExamples,
                "Comments",
                "Nested discussion collection with configurable indentation, reply depth, empty state, and section-level actions.",
                commentsPreviewContent,
                commentsSourceModal,
                commentsPreviewControls
            );
        }
        // DEV SECTION: Comments END
        // DEV SECTION: Progress Bar START
        const progressBarExamples =
            createSection(
                componentsGroup,
                "Progress Bar",
                "Determinate and indeterminate progress with labels, percentages, ranges, and semantic colors.",
                false
            );

        const progressBarPreviewContent =
            document.createElement(
                "div"
            );

        progressBarPreviewContent.classList.add(
            "dev-theme-preview-card-content"
        );

        // DEV SOURCE: Progress Bar START
        if (global.Builder.has("progress-bar")) {
            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Upload progress",
                    min:
                        0,
                    max:
                        100,
                    value:
                        65,
                    percentageVisible:
                        true,
                    color:
                        "primary",
                }
            ).appendTo(
                progressBarPreviewContent
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Completed",
                    min:
                        0,
                    max:
                        100,
                    value:
                        100,
                    percentageVisible:
                        true,
                    color:
                        "success",
                }
            ).appendTo(
                progressBarPreviewContent
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Custom range",
                    min:
                        20,
                    max:
                        80,
                    value:
                        35,
                    percentageVisible:
                        true,
                    color:
                        "warning",
                }
            ).appendTo(
                progressBarPreviewContent
            );

            global.Builder.create(
                "progress-bar",
                {
                    label:
                        "Processing",
                    indeterminate:
                        true,
                    percentageVisible:
                        true,
                    color:
                        "info",
                }
            ).appendTo(
                progressBarPreviewContent
            );
        }
        // DEV SOURCE: Progress Bar END

        const progressBarSourceModal =
            createSourceModal(
                "Progress Bar Source",
                {
                    html: {
                        filename:
                            "progress-bar.html",
                        source:
                            progressBarPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Progress Bar START",
                            endMarker:
                                "// DEV SOURCE: Progress Bar END",
                        },
                    },
                    css: {
                        filename:
                            "progress-bar.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/progress-bar.less",
                        },
                    },
                }
            );

        if (global.Builder.has("progress-bar")) {
            createPreviewCard(
                progressBarExamples,
                "Progress Bar",
                "Determinate and indeterminate progress with labels, percentages, ranges, and semantic colors.",
                progressBarPreviewContent,
                progressBarSourceModal
            );
        }
        // DEV SECTION: Progress Bar END
        // DEV SECTION: Button Group START
        const buttonGroupExamples =
            createSection(
                componentsGroup,
                "Button Group",
                "Grouped Builder buttons with spaced, attached, horizontal, vertical, and equal-width layouts.",
                false
            );

        const buttonGroupPreviewContent =
            document.createElement(
                "div"
            );

        buttonGroupPreviewContent.classList.add(
            "dev-theme-preview-card-content"
        );

        // DEV SOURCE: Button Group START
        if (global.Builder.has("button-group")) {
            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Save",
                            variant: "primary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Duplicate",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Delete",
                            variant: "danger",
                            callback:
                                function () {},
                        },
                    ],
                    orientation:
                        "horizontal",
                    presentation:
                        "spaced",
                    equalWidth:
                        false,
                    wrap:
                        true,
                }
            ).appendTo(
                buttonGroupPreviewContent
            );

            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Left",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Center",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Right",
                            variant: "secondary",
                            callback:
                                function () {},
                        },
                    ],
                    orientation:
                        "horizontal",
                    presentation:
                        "attached",
                    equalWidth:
                        true,
                    wrap:
                        false,
                }
            ).appendTo(
                buttonGroupPreviewContent
            );

            global.Builder.create(
                "button-group",
                {
                    buttons: [
                        {
                            label: "Profile",
                            variant: "primary",
                            callback:
                                function () {},
                        },
                        {
                            label: "Message",
                            variant: "info",
                            callback:
                                function () {},
                        },
                        {
                            label: "Disabled",
                            variant: "secondary",
                            disabled: true,
                            callback:
                                function () {},
                        },
                    ],
                    orientation:
                        "vertical",
                    presentation:
                        "attached",
                    equalWidth:
                        false,
                    wrap:
                        false,
                }
            ).appendTo(
                buttonGroupPreviewContent
            );
        }
        // DEV SOURCE: Button Group END

        const buttonGroupSourceModal =
            createSourceModal(
                "Button Group Source",
                {
                    html: {
                        filename:
                            "button-group.html",
                        source:
                            buttonGroupPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Button Group START",
                            endMarker:
                                "// DEV SOURCE: Button Group END",
                        },
                    },
                    css: {
                        filename:
                            "button-group.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/button-group.less",
                        },
                    },
                }
            );

        if (global.Builder.has("button-group")) {
            createPreviewCard(
                buttonGroupExamples,
                "Button Group",
                "Grouped Builder buttons with spaced, attached, horizontal, vertical, and equal-width layouts.",
                buttonGroupPreviewContent,
                buttonGroupSourceModal
            );
        }
        // DEV SECTION: Button Group END
        // DEV SECTION: Button START
        const buttonExamples =
            createSection(
                componentsGroup,
                "Button",
                "Button variants and states.",
                false
            );

        const buttonPreviewContent =
            document.createElement(
                "div"
            );

        buttonPreviewContent.classList.add(
            "dev-theme-preview-card-content"
        );

        // DEV SOURCE: Button START
        if (global.Builder.has("button")) {
            [
                "primary",
                "secondary",
                "success",
                "danger",
                "warning",
                "info",
                "light",
                "dark",
            ].forEach(function (variant) {
                global.Builder.create(
                    "button",
                    {
                        label:
                            variant.charAt(0)
                                .toUpperCase()
                            + variant.slice(1),
                        variant: variant,
                        size: "medium",
                    }
                ).appendTo(
                    buttonPreviewContent
                );
            });
        }
        // DEV SOURCE: Button END

        const buttonSourceModal =
            createSourceModal(
                "Button Source",
                {
                    html: {
                        filename:
                            "button.html",
                        source:
                            buttonPreviewContent,
                    },
                    javascript: {
                        filename:
                            "preview.js",
                        source: {
                            file:
                                "dev:Assets/js/preview.js",
                            startMarker:
                                "// DEV SOURCE: Button START",
                            endMarker:
                                "// DEV SOURCE: Button END",
                        },
                    },
                    css: {
                        filename:
                            "button.less",
                        source: {
                            file:
                                "kernel:Assets/less/components/button.less",
                        },
                    },
                }
            );

        if (global.Builder.has("button")) {
            createPreviewCard(
                buttonExamples,
                "Button",
                "Button variants and states.",
                buttonPreviewContent,
                buttonSourceModal
            );
        }
        // DEV SECTION: Button END

        // DEV SECTION: Table of Content START
        if (global.Builder.has("table-of-content")) {
            const tableOfContentPreviewContent =
                document.createElement(
                    "div"
                );

            tableOfContentPreviewContent.classList.add(
                "dev-theme-preview-card-content"
            );

            const tableOfContentPreviewControls =
                document.createElement(
                    "div"
                );

            tableOfContentPreviewControls.classList.add(
                "dev-theme-preview-card-controls"
            );

            // DEV SOURCE: Table of Content START
            const tableOfContentEntries =
                Array.from(
                    mount.querySelectorAll(
                        ".dev-theme-preview-group"
                    )
                ).map(
                    function (group) {
                        if (
                            !(group instanceof HTMLElement)
                            || group.id === ""
                        ) {
                            return null;
                        }

                        const heading =
                            group.querySelector(
                                ":scope > .dev-theme-preview-group-title"
                            );

                        const content =
                            group.querySelector(
                                ":scope > .dev-theme-preview-group-content"
                            );

                        if (
                            !(heading instanceof HTMLElement)
                            || !(content instanceof HTMLElement)
                        ) {
                            return null;
                        }

                        const children =
                            Array.from(
                                content.querySelectorAll(
                                    ":scope > .dev-theme-preview-section"
                                )
                            ).map(
                                function (section) {
                                    if (
                                        !(section instanceof HTMLElement)
                                        || section.id === ""
                                    ) {
                                        return null;
                                    }

                                    const sectionHeading =
                                        section.querySelector(
                                            ".dev-theme-preview-section-title"
                                        );

                                    if (
                                        !(sectionHeading instanceof HTMLElement)
                                    ) {
                                        return null;
                                    }

                                    return {
                                        label:
                                            sectionHeading.textContent.trim(),
                                        href:
                                            "#"
                                            + section.id,
                                    };
                                }
                            ).filter(
                                function (entry) {
                                    return entry !== null;
                                }
                            );

                        return {
                            label:
                                heading.textContent.trim(),
                            href:
                                "#"
                                + group.id,
                            children:
                                children,
                        };
                    }
                ).filter(
                    function (entry) {
                        return entry !== null;
                    }
                );

            const tableOfContentExample =
                global.Builder.create(
                    "table-of-content",
                    {
                        title:
                            "Table of Content",
                        triggerTitle:
                            "Open component table of content",
                        persistenceKey:
                            "core-web.dev-preview.table-of-content",
                        scrollspyEnabled:
                            true,
                        entries:
                            tableOfContentEntries,
                    }
                );

            tableOfContentExample.appendTo(
                tableOfContentPreviewContent
            );

            const tableOfContentScrollspyToggle =
                createToggleControl(
                    tableOfContentExamples,
                    "Scrollspy",
                    true,
                    function (enabled) {
                        if (enabled) {
                            tableOfContentExample.enableScrollspy();

                            return;
                        }

                        tableOfContentExample.disableScrollspy();
                    }
                );

            if (
                tableOfContentScrollspyToggle !== null
                && typeof tableOfContentScrollspyToggle.element
                    === "function"
            ) {
                tableOfContentPreviewControls.append(
                    tableOfContentScrollspyToggle.element()
                );
            }

            global.devTableOfContent =
                tableOfContentExample;

            // DEV SOURCE: Table of Content END

            const tableOfContentSourceModal =
                createSourceModal(
                    "Table of Content Source",
                    {
                        html: {
                            filename:
                                "table-of-content.html",
                            source:
                                tableOfContentPreviewContent,
                        },
                        javascript: {
                            filename:
                                "preview.js",
                            source: {
                                file:
                                    "dev:Assets/js/preview.js",
                                startMarker:
                                    "// DEV SOURCE: Table of Content START",
                                endMarker:
                                    "// DEV SOURCE: Table of Content END",
                            },
                        },
                        css: {
                            filename:
                                "table-of-content.less",
                            source: {
                                file:
                                    "kernel:Assets/less/components/table-of-content.less",
                            },
                        },
                    }
                );

            createPreviewCard(
                tableOfContentExamples,
                "Table of Content",
                "Floating page navigation with nested entries, persisted open state, and optional Scrollspy tracking.",
                tableOfContentPreviewContent,
                tableOfContentSourceModal,
                tableOfContentPreviewControls
            );
        }
        // DEV SECTION: Table of Content END
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeThemePreview,
            { once: true }
        );
    } else {
        initializeThemePreview();
    }

})(globalThis);

(function (global) {
     "use strict";

    if (
        typeof global.Component !== "function"
         || typeof global.Builder !== "function"
     ) {
        throw new Error(
             "Core-Web Component and Builder must be loaded before Code Block."
         );
     }

    const CODE_BLOCK_ICONS = Object.freeze({
        copy: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' fill="currentColor"',
            ' class="app-icon"',
            ' viewBox="0 0 16 16">',
            '<path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>',
            "</svg>",
        ].join(""),
        clearSelection: [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ' fill="currentColor"',
            ' class="app-icon"',
            ' viewBox="0 0 16 16">',
            '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>',
            '<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>',
            "</svg>",
        ].join(""),
        menu: [
             '<svg xmlns="http://www.w3.org/2000/svg"',
             ' viewBox="0 0 16 16">',
             '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
             "</svg>",
         ].join(""),
      });

    function normalizeLineNumbers(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Code Block line lists must be arrays."
            );
        }

        return Array.from(
            new Set(
                value.map(function (line) {
                    const number =
                        Number(line);

                    if (
                        !Number.isInteger(number)
                        || number < 1
                    ) {
                        throw new TypeError(
                            "Code Block line numbers must be positive integers."
                        );
                    }

                    return number;
                })
            )
        ).sort(function (left, right) {
            return left - right;
        });
    }

    function normalizeControlMenuItems(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Code Block controlMenuItems must be an array."
            );
        }

        return value.map(function (item) {
            if (
                item === null
                || typeof item !== "object"
                || Array.isArray(item)
            ) {
                throw new TypeError(
                    "Code Block control menu item configuration is invalid."
                );
            }

            const label =
                typeof item.label === "string"
                    ? item.label
                    : "";

            const icon =
                typeof item.icon === "string"
                    ? item.icon
                    : "";

            const href =
                typeof item.href === "string"
                    ? item.href
                    : "";

            const callback =
                typeof item.callback === "function"
                    ? item.callback
                    : null;

            if (
                label === ""
                && icon === ""
            ) {
                throw new TypeError(
                    "Code Block control menu items require a label or icon."
                );
            }

            if (
                href === ""
                && callback === null
            ) {
                throw new TypeError(
                    "Code Block control menu items require href or callback."
                );
            }

            return {
                label: label,
                icon: icon,
                href: href,
                disabled:
                    item.disabled === true,
                callback: callback,
            };
        });
    }

    function createControlButton(
        action,
        label
     ) {
        const button =
            document.createElement(
                 "button"
             );

        button.type =
             "button";

        button.classList.add(
             "app-code-block-control"
         );

        button.setAttribute(
             "data-code-block-action",
            action
         );

        button.setAttribute(
             "aria-label",
            label
         );

        button.setAttribute(
             "title",
            label
         );

        return button;
     }

    class CodeBlock extends global.Component {
        constructor(config) {
            super(config);

            this.controlMenuDropdown =
                null;

            this.handleClick =
                this.handleClick.bind(this);

            this.handlePointerDown =
                this.handlePointerDown.bind(this);

            this.handlePointerMove =
                this.handlePointerMove.bind(this);

            this.handlePointerUp =
                this.handlePointerUp.bind(this);

            this.lineDragActive =
                false;

            this.lineDragStart =
                null;

            this.lineDragBaseSelection =
                [];

            this.lineDragSelecting =
                true;
        }

        isPrismAvailable(language) {
            return (
                typeof global.Prism === "object"
                && global.Prism !== null
                && typeof global.Prism.tokenize
                    === "function"
                && global.Prism.languages !== undefined
                && typeof language === "string"
                && language !== ""
                && global.Prism.languages[language] !== undefined
            );
        }

        applyPrismHighlighting(
            code,
            language,
            linesRegion
        ) {
            if (
                !this.isPrismAvailable(
                    language
                )
            ) {
                return false;
            }

            const lineContents =
                Array.from(
                    linesRegion.querySelectorAll(
                        ".app-code-block-line-content"
                    )
                );

            if (lineContents.length === 0) {
                return false;
            }

            lineContents.forEach(
                function (content) {
                    content.replaceChildren();
                }
            );

            const grammar =
                global.Prism.languages[
                    language
                ];

            const tokens =
                global.Prism.tokenize(
                    code,
                    grammar
                );

            let lineIndex =
                0;

            const appendText =
                function (
                    text,
                    classes
                ) {
                    const parts =
                        String(text).split(
                            "\n"
                        );

                    parts.forEach(
                        function (
                            part,
                            index
                        ) {
                            if (
                                part !== ""
                                && lineIndex
                                    < lineContents.length
                            ) {
                                if (classes.length === 0) {
                                    lineContents[
                                        lineIndex
                                    ].append(
                                        document.createTextNode(
                                            part
                                        )
                                    );
                                } else {
                                    const span =
                                        document.createElement(
                                            "span"
                                        );

                                    span.classList.add(
                                        ...classes
                                    );

                                    global.Builder.text(
                                        span,
                                        part
                                    );

                                    lineContents[
                                        lineIndex
                                    ].append(
                                        span
                                    );
                                }
                            }

                            if (
                                index
                                < parts.length - 1
                            ) {
                                lineIndex += 1;
                            }
                        }
                    );
                };

            const renderToken =
                function (
                    token,
                    inheritedClasses
                ) {
                    if (typeof token === "string") {
                        appendText(
                            token,
                            inheritedClasses
                        );

                        return;
                    }

                    if (Array.isArray(token)) {
                        token.forEach(
                            function (child) {
                                renderToken(
                                    child,
                                    inheritedClasses
                                );
                            }
                        );

                        return;
                    }

                    if (
                        token === null
                        || typeof token !== "object"
                    ) {
                        return;
                    }

                    const classes =
                        inheritedClasses.concat(
                            [
                                "token",
                                token.type,
                            ]
                        );

                    if (typeof token.alias === "string") {
                        classes.push(
                            token.alias
                        );
                    } else if (
                        Array.isArray(
                            token.alias
                        )
                    ) {
                        token.alias.forEach(
                            function (alias) {
                                if (
                                    typeof alias === "string"
                                    && alias !== ""
                                ) {
                                    classes.push(
                                        alias
                                    );
                                }
                            }
                        );
                    }

                    renderToken(
                        token.content,
                        classes
                    );
                };

            renderToken(
                tokens,
                []
            );

            return true;
        }

        createControlMenuDropdown(items) {
            if (!global.Builder.has("dropdown")) {
                throw new Error(
                    "Code Block control menu requires the Dropdown component."
                );
            }

            const dropdown =
                global.Builder.create(
                    "dropdown",
                    {
                        triggerIcon:
                            CODE_BLOCK_ICONS.menu,
                        triggerTitle:
                            "Code Block controls",
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

            const element =
                dropdown.element();

            if (!(element instanceof HTMLElement)) {
                dropdown.destroy();

                throw new Error(
                    "Code Block control Dropdown did not render an HTMLElement."
                );
            }

            element.classList.add(
                "app-code-block-control-dropdown"
            );

            this.controlMenuDropdown =
                dropdown;

            return element;
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
            const element =
                this.element();

            if (element instanceof HTMLElement) {
                element.removeEventListener(
                    "click",
                    this.handleClick
                );

                element.removeEventListener(
                    "pointerdown",
                    this.handlePointerDown
                );
            }

            this.destroyControlMenuDropdown();

            document.removeEventListener(
                "pointermove",
                this.handlePointerMove
            );

            document.removeEventListener(
                "pointerup",
                this.handlePointerUp
            );

            document.removeEventListener(
                "pointercancel",
                this.handlePointerUp
            );
        }

        enableSyntaxHighlighting() {
            this.config(
                "syntaxHighlighting",
                true
            );

            this.refresh();

            return this;
        }

        disableSyntaxHighlighting() {
            this.config(
                "syntaxHighlighting",
                false
            );

            this.refresh();

            return this;
        }

        toggleSyntaxHighlighting() {
            return this.config(
                "syntaxHighlighting"
            ) === true
                ? this.disableSyntaxHighlighting()
                : this.enableSyntaxHighlighting();
        }

        enableWrap() {
            this.config(
                "wrap",
                true
            );

            this.refresh();

            return this;
        }

        setSelectedLines(lines) {
            this.config(
                "selectedLines",
                normalizeLineNumbers(
                    lines
                )
            );

            this.refresh();

            return this;
        }

        clearSelectedLines() {
            this.config(
                "selectedLines",
                []
            );

            this.refresh();

            return this;
        }

        enableLineSelection() {
            this.config(
                "lineSelectionEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableLineSelection() {
            this.config(
                "lineSelectionEnabled",
                false
            );

            this.refresh();

            return this;
        }

        setHighlightedLines(lines) {
            this.config(
                "highlightedLines",
                normalizeLineNumbers(
                    lines
                )
            );

            this.refresh();

            return this;
        }

        clearHighlightedLines() {
            this.config(
                "highlightedLines",
                []
            );

            this.refresh();

            return this;
        }

        disableWrap() {
            this.config(
                "wrap",
                false
            );

            this.refresh();

            return this;
        }

        toggleWrap() {
            return this.config(
                "wrap"
            ) === true
                ? this.disableWrap()
                : this.enableWrap();
        }


        showLineNumbers() {
            this.config(
                "lineNumbers",
                true
            );

            this.refresh();

            return this;
        }

        hideLineNumbers() {
            this.config(
                "lineNumbers",
                false
            );

            this.refresh();

            return this;
        }

        toggleLineNumbers() {
            return this.config(
                "lineNumbers"
            ) === true
                ? this.hideLineNumbers()
                : this.showLineNumbers();
        }

        enableControlMenu() {
            this.config(
                "controlMenuEnabled",
                true
            );

            this.refresh();

            return this;
        }

        disableControlMenu() {
            this.config(
                "controlMenuEnabled",
                false
            );

            this.refresh();

            return this;
        }

        toggleControlMenu() {
            this.config(
                "controlMenuEnabled",
                this.config("controlMenuEnabled") !== true
            );

            this.refresh();

            return this;
        }

        openControlMenu() {
            this.config(
                "controlMenuOpen",
                true
            );

            if (
                this.controlMenuDropdown !== null
                && typeof this.controlMenuDropdown.open
                    === "function"
            ) {
                this.controlMenuDropdown.open();

                return this;
            }

            this.refresh();

            return this;
        }

        closeControlMenu() {
            this.config(
                "controlMenuOpen",
                false
            );

            this.refresh();

            return this;
        }

        toggleControlMenuOpen() {
            return this.config(
                "controlMenuOpen"
            ) === true
                ? this.closeControlMenu()
                : this.openControlMenu();
        }

        showCopyControl() {
            this.config(
                "copyControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideCopyControl() {
            this.config(
                "copyControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleCopyControl() {
            return this.config(
                "copyControlVisible"
            ) === true
                ? this.hideCopyControl()
                : this.showCopyControl();
        }

        async copy() {
            const code =
                this.config(
                     "code"
                  );

            const selectedLines =
                normalizeLineNumbers(
                    this.config(
                        "selectedLines"
                    )
                );

            const sourceLines =
                code.split("\n");

            const copiedCode =
                selectedLines.length === 0
                    ? code
                    : selectedLines
                        .filter(
                            function (lineNumber) {
                                return lineNumber
                                    <= sourceLines.length;
                            }
                        )
                        .map(
                            function (lineNumber) {
                                return sourceLines[
                                    lineNumber - 1
                                ];
                            }
                        )
                        .join("\n");

            await navigator.clipboard.writeText(
                copiedCode
            );

            const callback =
                this.config(
                     "onCopy"
                  );

            if (typeof callback === "function") {
                callback(
                    copiedCode,
                    this
                );
            }

            return this;
        }

        applyLineDragSelection(lineNumber) {
            if (
                this.lineDragActive !== true
                || !Number.isInteger(
                    this.lineDragStart
                )
                || !Number.isInteger(
                    lineNumber
                )
            ) {
                return this;
            }

            const first =
                Math.min(
                    this.lineDragStart,
                    lineNumber
                );

            const last =
                Math.max(
                    this.lineDragStart,
                    lineNumber
                );

            const selected =
                new Set(
                    this.lineDragBaseSelection
                );

            for (
                let current = first;
                current <= last;
                current += 1
            ) {
                if (this.lineDragSelecting) {
                    selected.add(
                        current
                    );

                    continue;
                }

                selected.delete(
                    current
                );
            }

            const selectedLines =
                Array.from(
                    selected
                ).sort(
                    function (left, right) {
                        return left - right;
                    }
                );

            this.config(
                "selectedLines",
                selectedLines
            );

            const element =
                this.element();

            if (!(element instanceof HTMLElement)) {
                return this;
            }

            element.querySelectorAll(
                "[data-code-block-line]"
            ).forEach(
                function (row) {
                    if (!(row instanceof HTMLElement)) {
                        return;
                    }

                    const rowNumber =
                        Number(
                            row.getAttribute(
                                "data-code-block-line"
                            )
                        );

                    row.classList.toggle(
                        "is-selected",
                        selected.has(
                            rowNumber
                        )
                    );
                }
            );

            const selectionIndicator =
                element.querySelector(
                    '[data-code-block-region="selection-indicator"]'
                );

            const clearSelectionControl =
                element.querySelector(
                    '[data-code-block-action="clear-selection"]'
                );

            if (
                selectionIndicator instanceof HTMLElement
                && clearSelectionControl
                    instanceof HTMLButtonElement
            ) {
                const count =
                    selectedLines.length;

                global.Builder.text(
                    selectionIndicator,
                    count === 1
                        ? "1 selected line"
                        : count
                            + " selected lines"
                );

                selectionIndicator.hidden =
                    count === 0;

                clearSelectionControl.hidden =
                    count === 0;
            }

            return this;
        }

        handlePointerDown(event) {
            if (
                event.button !== 0
                || this.config(
                    "lineSelectionEnabled"
                ) !== true
            ) {
                return;
            }

            if (!(event.target instanceof Element)) {
                return;
            }

            const number =
                event.target.closest(
                    ".app-code-block-line-number"
                );

            if (
                !(number instanceof HTMLElement)
                || !this.element()?.contains(
                    number
                )
            ) {
                return;
            }

            const line =
                number.closest(
                    "[data-code-block-line]"
                );

            if (!(line instanceof HTMLElement)) {
                return;
            }

            const lineNumber =
                Number(
                    line.getAttribute(
                        "data-code-block-line"
                    )
                );

            if (!Number.isInteger(lineNumber)) {
                return;
            }

            event.preventDefault();

            this.lineDragActive =
                true;

            this.lineDragStart =
                lineNumber;

            this.lineDragBaseSelection =
                normalizeLineNumbers(
                    this.config(
                        "selectedLines"
                    )
                );

            this.lineDragSelecting =
                !this.lineDragBaseSelection.includes(
                    lineNumber
                );

            this.applyLineDragSelection(
                lineNumber
            );
        }

        handlePointerMove(event) {
            if (this.lineDragActive !== true) {
                return;
            }

            const target =
                document.elementFromPoint(
                    event.clientX,
                    event.clientY
                );

            if (!(target instanceof Element)) {
                return;
            }

            const number =
                target.closest(
                    ".app-code-block-line-number"
                );

            if (
                !(number instanceof HTMLElement)
                || !this.element()?.contains(
                    number
                )
            ) {
                return;
            }

            const line =
                number.closest(
                    "[data-code-block-line]"
                );

            if (!(line instanceof HTMLElement)) {
                return;
            }

            const lineNumber =
                Number(
                    line.getAttribute(
                        "data-code-block-line"
                    )
                );

            if (!Number.isInteger(lineNumber)) {
                return;
            }

            this.applyLineDragSelection(
                lineNumber
            );
        }

        handlePointerUp() {
            if (this.lineDragActive !== true) {
                return;
            }

            this.lineDragActive =
                false;

            this.lineDragStart =
                null;

            this.lineDragBaseSelection =
                [];

            this.lineDragSelecting =
                true;
        }

        handleClick(event) {
            if (!(event.target instanceof Element)) {
                return;
            }

            if (
                event.target.closest(
                    ".app-code-block-line-number"
                ) !== null
            ) {
                return;
            }

            const line =
                event.target.closest(
                    "[data-code-block-line]"
                );

            if (
                line instanceof HTMLElement
                && this.element()?.contains(
                    line
                )
                && this.config(
                    "lineSelectionEnabled"
                ) === true
            ) {
                const lineNumber =
                    Number(
                        line.getAttribute(
                            "data-code-block-line"
                        )
                    );

                const selectedLines =
                    normalizeLineNumbers(
                        this.config(
                            "selectedLines"
                        )
                    );

                const index =
                    selectedLines.indexOf(
                        lineNumber
                    );

                if (index === -1) {
                    selectedLines.push(
                        lineNumber
                    );
                } else {
                    selectedLines.splice(
                        index,
                        1
                    );
                }

                this.config(
                    "selectedLines",
                    selectedLines
                );

                this.refresh();

                return;
            }

            const control =
                event.target.closest(
                     "[data-code-block-action]"
                );

            if (
                 !(control instanceof HTMLButtonElement)
                 || !this.element()?.contains(
                    control
                 )
             ) {
                return;
            }

            const action =
                control.getAttribute(
                    "data-code-block-action"
                );

            if (action === "clear-selection") {
                this.clearSelectedLines();

                return;
            }

            if (action === "copy") {
                this.copy();
            }
        }

        static defaults() {
            return {
                code: "",
                language: "",
                title: "",
                filename: "",
                lineNumbers: false,
                wrap: false,
                syntaxHighlighting: true,
                highlightedLines: [],
                selectedLines: [],
                lineSelectionEnabled: true,
                copyControlVisible: true,
                controlMenuEnabled: false,
                controlMenuOpen: false,
                controlMenuItems: [],
                onCopy: null,
             };
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

            const identity =
                document.createElement(
                     "div"
                 );

            const title =
                document.createElement(
                     "span"
                 );

            const filename =
                document.createElement(
                     "span"
                 );

            const controls =
                document.createElement(
                     "div"
                 );

            const selectionIndicator =
                document.createElement(
                    "span"
                );

            const clearSelectionControl =
                createControlButton(
                    "clear-selection",
                    "Clear line selection"
                );

            const copyControl =
                createControlButton(
                    "copy",
                    "Copy code"
                );

            const controlMenuRegion =
                document.createElement(
                     "div"
                );

            const body =
                document.createElement(
                     "div"
                );

            const pre =
                document.createElement(
                     "pre"
                );

            const lines =
                document.createElement(
                    "code"
                );

            root.classList.add(
                 "app-code-block"
             );

            header.classList.add(
                 "app-code-block-header"
             );

            identity.classList.add(
                 "app-code-block-identity"
             );

            title.classList.add(
                 "app-code-block-title"
             );

            filename.classList.add(
                 "app-code-block-filename"
             );

            controls.classList.add(
                 "app-code-block-controls"
             );

            controlMenuRegion.classList.add(
                 "app-code-block-control-menu-region"
             );

            selectionIndicator.classList.add(
                "app-code-block-selection-indicator"
            );

            selectionIndicator.setAttribute(
                "data-code-block-region",
                "selection-indicator"
            );

            body.classList.add(
                 "app-code-block-body"
             );

            pre.classList.add(
                 "app-code-block-pre"
             );

            lines.classList.add(
                "app-code-block-code"
            );

            lines.setAttribute(
                "data-code-block-region",
                "lines"
            );

            title.setAttribute(
                 "data-code-block-region",
                 "title"
             );

            filename.setAttribute(
                 "data-code-block-region",
                 "filename"
             );

            controlMenuRegion.setAttribute(
                 "data-code-block-region",
                 "control-menu"
             );

            copyControl.innerHTML =
                CODE_BLOCK_ICONS.copy;

            clearSelectionControl.innerHTML =
                CODE_BLOCK_ICONS.clearSelection;

            identity.append(
                title,
                filename
             );

            controls.append(
                selectionIndicator,
                clearSelectionControl,
                copyControl,
                controlMenuRegion
            );

            header.append(
                identity,
                controls
             );

            pre.append(
                lines
            );

            body.append(
                pre
             );

            root.append(
                header,
                body
              );

            root.addEventListener(
                  "click",
                this.handleClick
              );

            root.addEventListener(
                "pointerdown",
                this.handlePointerDown
            );

            document.addEventListener(
                "pointermove",
                this.handlePointerMove
            );

            document.addEventListener(
                "pointerup",
                this.handlePointerUp
            );

            document.addEventListener(
                "pointercancel",
                this.handlePointerUp
            );

            this.update(
                root
             );

            return root;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                     "Code Block update requires an HTMLElement."
                 );
              }

            const code =
                this.config(
                      "code"
                  );

            const language =
                this.config(
                      "language"
                  );

            const title =
                this.config(
                      "title"
                  );

            const filename =
                this.config(
                    "filename"
                );

            const lineNumbers =
                this.config(
                    "lineNumbers"
                );

            const wrap =
                this.config(
                    "wrap"
                );

            const syntaxHighlighting =
                this.config(
                    "syntaxHighlighting"
                );

            const highlightedLines =
                normalizeLineNumbers(
                    this.config(
                        "highlightedLines"
                    )
                );

            const selectedLines =
                normalizeLineNumbers(
                    this.config(
                        "selectedLines"
                    )
                );

            const lineSelectionEnabled =
                this.config(
                    "lineSelectionEnabled"
                );

            const copyControlVisible =
                this.config(
                    "copyControlVisible"
                );

            const controlMenuEnabled =
                this.config(
                    "controlMenuEnabled"
                );

            const controlMenuOpen =
                this.config(
                    "controlMenuOpen"
                );

            const onCopy =
                this.config(
                    "onCopy"
                );

            if (typeof code !== "string") {
                throw new TypeError(
                    "Code Block code must be a string."
                );
            }

            if (typeof filename !== "string") {
                throw new TypeError(
                    "Code Block filename must be a string."
                );
            }

            if (typeof lineNumbers !== "boolean") {
                throw new TypeError(
                    "Code Block lineNumbers must be a boolean."
                );
            }

            if (typeof wrap !== "boolean") {
                throw new TypeError(
                    "Code Block wrap must be a boolean."
                );
            }

            if (typeof syntaxHighlighting !== "boolean") {
                throw new TypeError(
                    "Code Block syntaxHighlighting must be a boolean."
                );
            }

            if (typeof copyControlVisible !== "boolean") {
                throw new TypeError(
                    "Code Block copyControlVisible must be a boolean."
                );
            }

            if (typeof lineSelectionEnabled !== "boolean") {
                throw new TypeError(
                    "Code Block lineSelectionEnabled must be a boolean."
                );
            }

            if (typeof controlMenuEnabled !== "boolean") {
                throw new TypeError(
                    "Code Block controlMenuEnabled must be a boolean."
                );
            }

            if (typeof controlMenuOpen !== "boolean") {
                throw new TypeError(
                    "Code Block controlMenuOpen must be a boolean."
                );
            }

            if (
                onCopy !== null
                && typeof onCopy !== "function"
            ) {
                throw new TypeError(
                    "Code Block onCopy must be a function or null."
                );
            }

            if (typeof language !== "string") {
                throw new TypeError(
                      "Code Block language must be a string."
                  );
              }

            if (typeof title !== "string") {
                throw new TypeError(
                      "Code Block title must be a string."
                  );
              }


            this.config(
                "highlightedLines",
                highlightedLines
            );

            this.config(
                "selectedLines",
                selectedLines
            );

            const titleRegion =
                element.querySelector(
                      '[data-code-block-region="title"]'
                  );

            const filenameRegion =
                element.querySelector(
                      '[data-code-block-region="filename"]'
                  );

            const linesRegion =
                element.querySelector(
                    '[data-code-block-region="lines"]'
                );

            const controlMenuRegion =
                element.querySelector(
                    '[data-code-block-region="control-menu"]'
                );

            const selectionIndicator =
                element.querySelector(
                    '[data-code-block-region="selection-indicator"]'
                );

            const clearSelectionControl =
                element.querySelector(
                    '[data-code-block-action="clear-selection"]'
                );

            const copyControl =
                element.querySelector(
                    '[data-code-block-action="copy"]'
                );

             if (
                  !(titleRegion instanceof HTMLElement)
                  || !(filenameRegion instanceof HTMLElement)
                  || !(linesRegion instanceof HTMLElement)
                  || !(controlMenuRegion instanceof HTMLElement)
                  || !(selectionIndicator instanceof HTMLElement)
                  || !(clearSelectionControl instanceof HTMLButtonElement)
                  || !(copyControl instanceof HTMLButtonElement)
              ) {
                throw new Error(
                      "Code Block rendered regions are missing."
                  );
              }

            global.Builder.text(
                titleRegion,
                title
              );

            global.Builder.text(
                filenameRegion,
                filename
              );

            const sourceLines =
                code.split("\n");

            linesRegion.replaceChildren();

            sourceLines.forEach(
                function (
                    line,
                    index
                ) {
                    const lineNumber =
                        index + 1;

                    const row =
                        document.createElement(
                            "span"
                        );

                    const number =
                        document.createElement(
                            "span"
                        );

                    const content =
                        document.createElement(
                            "span"
                        );

                    row.classList.add(
                        "app-code-block-line"
                    );

                    number.classList.add(
                        "app-code-block-line-number"
                    );

                    content.classList.add(
                        "app-code-block-line-content"
                    );

                    row.setAttribute(
                        "data-code-block-line",
                        String(lineNumber)
                    );

                    number.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    global.Builder.text(
                        number,
                        String(lineNumber)
                    );

                    global.Builder.text(
                        content,
                        line
                    );

                    number.hidden =
                        !lineNumbers;

                    row.classList.toggle(
                        "is-highlighted",
                        highlightedLines.includes(
                            lineNumber
                        )
                    );

                    row.classList.toggle(
                        "is-selected",
                        selectedLines.includes(
                            lineNumber
                        )
                    );

                    row.classList.toggle(
                        "is-selectable",
                        lineSelectionEnabled
                    );

                    row.append(
                        number,
                        content
                    );

                    linesRegion.append(
                        row
                    );
                }
            );

            if (
                syntaxHighlighting
                && this.isPrismAvailable(
                    language
                )
            ) {
                this.applyPrismHighlighting(
                    code,
                    language,
                    linesRegion
                );
            }

            titleRegion.hidden =
                title === "";

            filenameRegion.hidden =
                filename === "";

            if (language === "") {
                linesRegion.removeAttribute(
                      "data-code-language"
                  );

                linesRegion.className =
                      "app-code-block-code";
              } else {
                linesRegion.setAttribute(
                      "data-code-language",
                    language
                  );

                linesRegion.className =
                      "app-code-block-code language-"
                        + language;
              }

            element.classList.toggle(
                "has-line-numbers",
                lineNumbers
            );

            element.classList.toggle(
                "is-wrapping",
                wrap
            );

            const controlMenuItems =
                normalizeControlMenuItems(
                    this.config(
                        "controlMenuItems"
                    )
                );

            this.config(
                "controlMenuItems",
                controlMenuItems
            );

            const controlMenuVisible =
                controlMenuEnabled
                && controlMenuItems.length > 0;

            this.destroyControlMenuDropdown();

            controlMenuRegion.replaceChildren();

            if (controlMenuVisible) {
                controlMenuRegion.append(
                    this.createControlMenuDropdown(
                        controlMenuItems
                    )
                );
            }

            controlMenuRegion.hidden =
                !controlMenuVisible;

            const selectedLineCount =
                selectedLines.length;

            global.Builder.text(
                selectionIndicator,
                selectedLineCount === 1
                    ? "1 selected line"
                    : selectedLineCount
                        + " selected lines"
            );

            selectionIndicator.hidden =
                selectedLineCount === 0;

            clearSelectionControl.hidden =
                selectedLineCount === 0;

            copyControl.hidden =
                !copyControlVisible;

            return this;
          }
      }

    global.Builder.register(
         "code-block",
        CodeBlock,
         {
            provider: "kernel",
            priority: 0,
         }
     );

})(globalThis);

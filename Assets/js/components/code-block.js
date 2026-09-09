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
             ' viewBox="0 0 16 16">',
             '<path d="M4 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1V9h1V2H6v1H4z"/>',
             '<path d="M1 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/>',
             "</svg>",
         ].join(""),
        menu: [
             '<svg xmlns="http://www.w3.org/2000/svg"',
             ' viewBox="0 0 16 16">',
             '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>',
             "</svg>",
         ].join(""),
     });

    function renderIcon(
        element,
        value
     ) {
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
                sourcePath.getAttribute(
                      "d"
                  );

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

            const fillRule =
                sourcePath.getAttribute(
                      "fill-rule"
                  );

            if (
                fillRule === "evenodd"
                  || fillRule === "nonzero"
              ) {
                path.setAttribute(
                      "fill-rule",
                    fillRule
                  );
              }

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
         }

        static defaults() {
            return {
                code: "",
                language: "",
                title: "",
                filename: "",
                lineNumbers: false,
                wrap: false,
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

            const code =
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

            body.classList.add(
                 "app-code-block-body"
             );

            pre.classList.add(
                 "app-code-block-pre"
             );

            code.classList.add(
                 "app-code-block-code"
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

            code.setAttribute(
                 "data-code-block-region",
                 "code"
             );

            renderIcon(
                copyControl,
                CODE_BLOCK_ICONS.copy
             );

            identity.append(
                title,
                filename
             );

            controls.append(
                copyControl,
                controlMenuRegion
             );

            header.append(
                identity,
                controls
             );

            pre.append(
                code
             );

            body.append(
                pre
             );

            root.append(
                header,
                body
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

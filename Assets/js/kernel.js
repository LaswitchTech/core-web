(function (global) {
    "use strict";

    if (typeof global.Builder !== "undefined") {
        throw new Error("Core-Web Builder is already defined.");
    }

    if (typeof global.Component !== "undefined") {
        throw new Error("Core-Web Component is already defined.");
    }

    const initializeIdentity = Symbol("Component.initializeIdentity");
    const bindElement = Symbol("Component.bindElement");
    const executeRender = Symbol("Component.executeRender");
    const releaseInstance = Symbol("Builder.releaseInstance");

    const safeHtmlElements = new Set([
        "A",
        "ABBR",
        "B",
        "BLOCKQUOTE",
        "BR",
        "CODE",
        "DD",
        "DEL",
        "DIV",
        "DL",
        "DT",
        "EM",
        "FIGCAPTION",
        "FIGURE",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "HR",
        "I",
        "KBD",
        "LI",
        "MARK",
        "OL",
        "P",
        "PRE",
        "Q",
        "S",
        "SAMP",
        "SMALL",
        "SPAN",
        "STRONG",
        "SUB",
        "SUP",
        "TABLE",
        "TBODY",
        "TD",
        "TFOOT",
        "TH",
        "THEAD",
        "TR",
        "U",
        "UL",
        "VAR",
    ]);

    const safeHtmlAttributes = new Set([
        "CLASS",
        "COLSPAN",
        "DATETIME",
        "DIR",
        "HIDDEN",
        "LANG",
        "OPEN",
        "ROLE",
        "ROWSPAN",
        "SCOPE",
        "START",
        "TABINDEX",
        "TITLE",
        "TYPE",
        "VALUE",
    ]);

    const safeHtmlUrlAttributes = new Set([
        "CITE",
        "HREF",
    ]);

    function isSafeHtmlElement(name) {
        if (typeof name !== "string") {
            return false;
        }

        const normalized = name.trim().toUpperCase();

        if (normalized === "") {
            return false;
        }

        return safeHtmlElements.has(normalized);
    }

    function isSafeHtmlAttribute(name) {
        if (typeof name !== "string") {
            return false;
        }

        const normalized = name.trim().toUpperCase();

        if (normalized === "") {
            return false;
        }

        if (safeHtmlAttributes.has(normalized)) {
            return true;
        }

        const lowercase = normalized.toLowerCase();

        return (
            /^aria-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lowercase)
            || /^data-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lowercase)
        );
    }

    function isSafeHtmlUrl(value) {
        if (typeof value !== "string") {
            return false;
        }

        const normalized = value.trim();

        if (normalized === "") {
            return false;
        }

        if (normalized.startsWith("//")) {
            return false;
        }

        if (
            normalized.startsWith("#")
            || normalized.startsWith("/")
            || normalized.startsWith("./")
            || normalized.startsWith("../")
            || normalized.startsWith("?")
        ) {
            return true;
        }

        const compact = normalized.replace(
            /[\u0000-\u0020\u007F-\u009F]/g,
            ""
        );

        if (
            /^(?:javascript|vbscript|data|file|filesystem|blob):/i.test(
                compact
            )
        ) {
            return false;
        }

        return /^(?:https?|mailto|tel):/i.test(compact);
    }

    function isSafeHtmlUrlAttribute(elementName, attributeName, value) {
        if (
            typeof elementName !== "string"
            || typeof attributeName !== "string"
        ) {
            return false;
        }

        const normalizedElement =
            elementName.trim().toUpperCase();

        const normalizedAttribute =
            attributeName.trim().toUpperCase();

        if (
            normalizedElement === ""
            || normalizedAttribute === ""
            || !safeHtmlUrlAttributes.has(
                normalizedAttribute
            )
        ) {
            return false;
        }

        if (
            normalizedAttribute === "HREF"
            && normalizedElement !== "A"
        ) {
            return false;
        }

        if (
            normalizedAttribute === "CITE"
            && normalizedElement !== "BLOCKQUOTE"
            && normalizedElement !== "Q"
            && normalizedElement !== "DEL"
        ) {
            return false;
        }

        return isSafeHtmlUrl(value);
    }

    function isSafeHtmlElementAttribute(
        elementName,
        attributeName,
        value
    ) {
        if (
            !isSafeHtmlElement(elementName)
            || typeof attributeName !== "string"
        ) {
            return false;
        }

        const normalizedAttribute =
            attributeName.trim().toUpperCase();

        if (normalizedAttribute === "") {
            return false;
        }

        if (isSafeHtmlAttribute(normalizedAttribute)) {
            return true;
        }

        return isSafeHtmlUrlAttribute(
            elementName,
            normalizedAttribute,
            value
        );
    }

    function sanitizeHtmlElementAttributes(element) {
        if (
            typeof Element === "undefined"
            || !(element instanceof Element)
        ) {
            throw new TypeError(
                "HTML attribute sanitization requires an Element."
            );
        }

        const elementName = element.tagName;

        for (const attribute of Array.from(element.attributes)) {
            if (
                isSafeHtmlElementAttribute(
                    elementName,
                    attribute.name,
                    attribute.value
                )
            ) {
                continue;
            }

            element.removeAttribute(attribute.name);
        }

        return element;
    }

    function sanitizeHtmlNode(node) {
        if (typeof Node === "undefined" || !(node instanceof Node)) {
            throw new TypeError(
                "HTML sanitization requires a Node."
            );
        }

        if (node.nodeType === Node.TEXT_NODE) {
            return node;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            node.remove();

            return null;
        }

        if (!isSafeHtmlElement(node.tagName)) {
            node.remove();

            return null;
        }

        sanitizeHtmlElementAttributes(node);

        for (const child of Array.from(node.childNodes)) {
            sanitizeHtmlNode(child);
        }

        return node;
    }

    function sanitizeHtmlFragment(fragment) {
        if (
            typeof DocumentFragment === "undefined"
            || !(fragment instanceof DocumentFragment)
        ) {
            throw new TypeError(
                "HTML sanitization requires a DocumentFragment."
            );
        }

        for (const child of Array.from(fragment.childNodes)) {
            sanitizeHtmlNode(child);
        }

        return fragment;
    }

    function parseSafeHtmlFragment(value) {
        if (typeof value !== "string") {
            throw new TypeError(
                "Component HTML content must be a string."
            );
        }

        if (
            typeof document === "undefined"
            || typeof document.createElement !== "function"
        ) {
            throw new Error(
                "Component HTML rendering requires a browser document."
            );
        }

        const template =
            document.createElement("template");

        if (
            typeof HTMLTemplateElement === "undefined"
            || !(template instanceof HTMLTemplateElement)
            || !(template.content instanceof DocumentFragment)
        ) {
            throw new Error(
                "Component HTML rendering requires template element support."
            );
        }

        template.innerHTML = value;

        return sanitizeHtmlFragment(
            template.content
        );
    }

    function isPlainObject(value) {
        if (value === null || typeof value !== "object") {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);

        if (prototype === null) {
            return true;
        }

        return Object.getPrototypeOf(prototype) === null;
    }

    function resolveMountTarget(target) {
        if (
            typeof Element !== "undefined"
            && target instanceof Element
        ) {
            return target;
        }

        if (typeof target === "string" && target.trim() !== "") {
            if (
                typeof document === "undefined"
                || typeof document.querySelector !== "function"
            ) {
                throw new Error(
                    "Component mounting requires a browser document."
                );
            }

            const element = document.querySelector(target.trim());

            if (element === null) {
                throw new Error(
                    `Component mount target "${target.trim()}" was not found.`
                );
            }

            return element;
        }

        throw new TypeError(
            "Component mount target must be an Element or non-empty selector."
        );
    }

    function coerceAttributeValue(value) {
        if (typeof value !== "string") {
            throw new TypeError("Component attribute values must be strings.");
        }

        const normalized = value.trim();

        if (normalized === "true") {
            return true;
        }

        if (normalized === "false") {
            return false;
        }

        if (normalized === "null") {
            return null;
        }

        if (
            normalized !== ""
            && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)
        ) {
            return Number(normalized);
        }

        return value;
    }

    function extractElementConfig(element) {
        if (typeof Element === "undefined" || !(element instanceof Element)) {
            throw new TypeError(
                "Component configuration extraction requires an Element."
            );
        }

        const config = {};

        for (const attribute of Array.from(element.attributes)) {
            config[attribute.name] = coerceAttributeValue(attribute.value);
        }

        return config;
    }

    function setElementText(element, value) {
        if (typeof Element === "undefined" || !(element instanceof Element)) {
            throw new TypeError(
                "Component text rendering requires an Element."
            );
        }

        if (
            value !== null
            && typeof value !== "string"
            && typeof value !== "number"
            && typeof value !== "boolean"
            && typeof value !== "bigint"
        ) {
            throw new TypeError(
                "Component text content must be a primitive value or null."
            );
        }

        element.textContent =
            value === null ? "" : String(value);

        return element;
    }

    function setElementHtml(element, value) {
        if (
            typeof Element === "undefined"
            || !(element instanceof Element)
        ) {
            throw new TypeError(
                "Component HTML rendering requires an Element."
            );
        }

        const fragment =
            parseSafeHtmlFragment(value);

        element.replaceChildren(fragment);

        return element;
    }

    class Component {
        #id = null;
        #slug = null;
        #config = null;
        #element = null;
        #rendered = false;
        #mounted = false;
        #children = [];
        #destroyed = false;

        static defaults() {
            return {};
        }

        constructor(config = {}) {
            if (!isPlainObject(config)) {
                throw new TypeError("Component configuration must be a plain object.");
            }

            const defaults = this.constructor.defaults();

            if (!isPlainObject(defaults)) {
                throw new TypeError("Component defaults must be a plain object.");
            }

            this.#config = {
                ...defaults,
                ...config,
            };
        }

        [initializeIdentity](id, slug) {
            if (this.#id !== null || this.#slug !== null) {
                throw new Error("Component identity has already been initialized.");
            }

            if (typeof id !== "string" || id.trim() === "") {
                throw new TypeError("Component ID must be a non-empty string.");
            }

            if (typeof slug !== "string" || slug.trim() === "") {
                throw new TypeError("Component slug must be a non-empty string.");
            }

            this.#id = id.trim();
            this.#slug = slug.trim();

            return this;
        }

        [bindElement](element) {
            if (typeof Element === "undefined" || !(element instanceof Element)) {
                throw new TypeError("Component render() must return a single Element.");
            }

            if (this.#element !== null && this.#element !== element) {
                throw new Error("Component element has already been bound.");
            }

            if (this.#id !== null) {
                element.id = this.#id;
            }

            if (this.#slug !== null) {
                element.setAttribute("data-builder-component", this.#slug);
            }

            this.#element = element;

            return this;
        }

        [executeRender]() {
            if (this.#rendered) {
                throw new Error("Component has already been rendered.");
            }

            this.beforeRender();

            const element = this.render();

            this[bindElement](element);

            this.#rendered = true;

            this.afterRender();

            return element;
        }

        id() {
            return this.#id;
        }

        slug() {
            return this.#slug;
        }

        element() {
            return this.#element;
        }

        mounted() {
            return this.#mounted;
        }

        destroyed() {
            return this.#destroyed;
        }

        rendered() {
            return this.#rendered;
        }

        children() {
            return [...this.#children];
        }

        append(child) {
            if (!(child instanceof Component)) {
                throw new TypeError("Component children must extend Component.");
            }

            if (child === this) {
                throw new Error("A component cannot be its own child.");
            }

            if (this.#children.includes(child)) {
                throw new Error("Component child is already attached.");
            }

            this.#children.push(child);

            return this;
        }

        prepend(child) {
            if (!(child instanceof Component)) {
                throw new TypeError("Component children must extend Component.");
            }

            if (child === this) {
                throw new Error("A component cannot be its own child.");
            }

            if (this.#children.includes(child)) {
                throw new Error("Component child is already attached.");
            }

            this.#children.unshift(child);

            return this;
        }

        remove(child) {
            if (!(child instanceof Component)) {
                throw new TypeError("Component children must extend Component.");
            }

            const index = this.#children.indexOf(child);

            if (index === -1) {
                return false;
            }

            this.#children.splice(index, 1);

            return true;
        }

        clear() {
            const removed = this.#children.length;

            this.#children = [];

            return removed;
        }

        appendTo(target) {
            if (this.#destroyed) {
                throw new Error("Component has been destroyed.");
            }

            if (this.#element === null) {
                throw new Error("Component must be rendered before mounting.");
            }

            if (this.#mounted) {
                throw new Error("Component is already mounted.");
            }

            const mountTarget = resolveMountTarget(target);

            this.beforeMount();

            mountTarget.append(this.#element);
            this.#mounted = true;

            this.afterMount();

            return this;
        }

        prependTo(target) {
            if (this.#destroyed) {
                throw new Error("Component has been destroyed.");
            }

            if (this.#element === null) {
                throw new Error("Component must be rendered before mounting.");
            }

            if (this.#mounted) {
                throw new Error("Component is already mounted.");
            }

            const mountTarget = resolveMountTarget(target);

            this.beforeMount();

            mountTarget.prepend(this.#element);
            this.#mounted = true;

            this.afterMount();

            return this;
        }

        replace(target) {
            if (this.#destroyed) {
                throw new Error("Component has been destroyed.");
            }

            if (this.#element === null) {
                throw new Error("Component must be rendered before mounting.");
            }

            if (this.#mounted) {
                throw new Error("Component is already mounted.");
            }

            const mountTarget = resolveMountTarget(target);

            if (mountTarget === this.#element) {
                throw new Error("Component cannot replace its own element.");
            }

            this.beforeMount();

            mountTarget.replaceWith(this.#element);
            this.#mounted = true;

            this.afterMount();

            return this;
        }

        unmount() {
            if (this.#destroyed) {
                throw new Error("Component has been destroyed.");
            }

            if (!this.#mounted) {
                throw new Error("Component is not mounted.");
            }

            this.beforeUnmount();

            this.#element.remove();

            this.#mounted = false;

            this.afterUnmount();

            return this;
        }

        destroy() {
            if (this.#destroyed) {
                return false;
            }

            this.beforeDestroy();

            if (this.#mounted) {
                this.beforeUnmount();

                this.#element.remove();
                this.#mounted = false;

                this.afterUnmount();
            }

            if (this.#id !== null) {
                Builder[releaseInstance](this.#id, this);
            }

            this.#destroyed = true;

            this.afterDestroy();

            return true;
        }

        onCreate() {
        }

        beforeRender() {
        }

        afterRender() {
        }

        render() {
            throw new Error(
                `${this.constructor.name}.render() must return a single Element.`
            );
        }

        update(element) {
            if (typeof Element === "undefined" || !(element instanceof Element)) {
                throw new TypeError(
                    "Component update() requires the rendered Element."
                );
            }

            throw new Error(
                `${this.constructor.name}.update() must update the existing Element.`
            );
        }

        refresh() {
            if (this.#destroyed) {
                throw new Error("Component has been destroyed.");
            }

            if (!this.#rendered || this.#element === null) {
                throw new Error("Component must be rendered before refreshing.");
            }

            this.beforeRender();

            this.update(this.#element);

            this.afterRender();

            return this;
        }

        beforeMount() {
        }

        afterMount() {
        }

        beforeUnmount() {
        }

        afterUnmount() {
        }

        beforeDestroy() {
        }

        afterDestroy() {
        }

        config(key, value) {
            if (arguments.length === 1 && typeof key === "string") {
                return this.#config[key];
            }

            if (
                arguments.length === 1
                && isPlainObject(key)
            ) {
                this.#config = {
                    ...this.#config,
                    ...key,
                };

                return this;
            }

            if (arguments.length === 2 && typeof key === "string") {
                this.#config[key] = value;

                return this;
            }

            throw new TypeError(
                "config() expects a string key, a key/value pair, or a plain object."
            );
        }
    }

    class Builder {
        static #definitions = new Map();
        static #metadata = new Map();
        static #instances = new Map();
        static #counter = 0;
        static #registrationCounter = 0;

        static [releaseInstance](id, component) {
            if (typeof id !== "string" || id.trim() === "") {
                return false;
            }

            const normalizedId = id.trim();
            const stored = this.#instances.get(normalizedId);

            if (typeof stored === "undefined" || stored !== component) {
                return false;
            }

            this.#instances.delete(normalizedId);

            return true;
        }

        static #normalizeSlug(slug) {
            if (typeof slug !== "string") {
                throw new TypeError("Component slug must be a string.");
            }

            const normalized = slug.trim();

            if (
                normalized === ""
                || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(normalized)
            ) {
                throw new TypeError(
                    "Component slug must use lowercase letters, numbers, and single hyphens."
                );
            }

            return normalized;
        }

        static #normalizeProvider(provider) {
            if (typeof provider !== "string") {
                throw new TypeError("Component provider must be a string.");
            }

            const normalized = provider.trim().toLowerCase();

            if (
                normalized !== "kernel"
                && normalized !== "application"
                && normalized !== "plugin"
            ) {
                throw new TypeError(
                    'Component provider must be "kernel", "application", or "plugin".'
                );
            }

            return normalized;
        }

        static #providerRank(provider) {
            const normalizedProvider =
                this.#normalizeProvider(provider);

            switch (normalizedProvider) {
                case "kernel":
                    return 100;

                case "plugin":
                    return 200;

                case "application":
                    return 300;

                default:
                    throw new Error(
                        "Unsupported normalized component provider."
                    );
            }
        }

        static #shouldOverride(current, incoming) {
            if (!isPlainObject(current) || !isPlainObject(incoming)) {
                throw new TypeError(
                    "Component override metadata must use plain objects."
                );
            }

            const currentPriority =
                this.#normalizePriority(current.priority);

            const incomingPriority =
                this.#normalizePriority(incoming.priority);

            if (incomingPriority !== currentPriority) {
                return incomingPriority > currentPriority;
            }

            const currentProviderRank =
                this.#providerRank(current.provider);

            const incomingProviderRank =
                this.#providerRank(incoming.provider);

            if (incomingProviderRank !== currentProviderRank) {
                return incomingProviderRank > currentProviderRank;
            }

            const currentOrder =
                this.#normalizePriority(current.order);

            const incomingOrder =
                this.#normalizePriority(incoming.order);

            return incomingOrder > currentOrder;
        }

        static #normalizePriority(priority) {
            if (
                typeof priority !== "number"
                || !Number.isSafeInteger(priority)
            ) {
                throw new TypeError(
                    "Component priority must be a safe integer."
                );
            }

            return priority;
        }

        static #normalizeRegistrationOptions(options = {}) {
            if (!isPlainObject(options)) {
                throw new TypeError(
                    "Component registration options must be a plain object."
                );
            }

            const provider = this.#normalizeProvider(
                options.provider ?? "application"
            );

            const priority = this.#normalizePriority(
                options.priority ?? 0
            );

            return {
                provider,
                priority,
            };
        }

        static #tagName(slug) {
            return `builder-${this.#normalizeSlug(slug)}`;
        }

        static #supportsCustomElements() {
            return (
                typeof global.HTMLElement === "function"
                && typeof global.customElements !== "undefined"
                && global.customElements !== null
                && typeof global.customElements.define === "function"
                && typeof global.customElements.get === "function"
            );
        }

        static #customElementsRegistry() {
            if (!this.#supportsCustomElements()) {
                throw new Error(
                    "Builder custom elements require browser Custom Elements support."
                );
            }

            return global.customElements;
        }

        static #defineCustomElement(slug) {
            const normalizedSlug = this.#normalizeSlug(slug);
            const tagName = this.#tagName(normalizedSlug);
            const registry = this.#customElementsRegistry();

            if (typeof registry.get(tagName) !== "undefined") {
                throw new Error(
                    `Custom element "${tagName}" is already defined.`
                );
            }

            const BuilderClass = this;

            class BuilderElement extends global.HTMLElement {
                #component = null;

                connectedCallback() {
                    if (this.#component !== null) {
                        return;
                    }

                    const config = extractElementConfig(this);
                    const component = BuilderClass.create(
                        normalizedSlug,
                        config
                    );

                    component.replace(this);
                    this.#component = component;
                }
            }

            registry.define(tagName, BuilderElement);

            return BuilderElement;
        }

        static #nextId(slug) {
            const normalizedSlug = this.#normalizeSlug(slug);

            this.#counter += 1;

            return `builder-${normalizedSlug}-${this.#counter}`;
        }

        static has(slug) {
            try {
                return this.#definitions.has(this.#normalizeSlug(slug));
            } catch (error) {
                if (error instanceof TypeError) {
                    return false;
                }

                throw error;
            }
        }

        static get(slug) {
            try {
                return this.#definitions.get(this.#normalizeSlug(slug));
            } catch (error) {
                if (error instanceof TypeError) {
                    return undefined;
                }

                throw error;
            }
        }

        static metadata(slug) {
            try {
                const normalizedSlug = this.#normalizeSlug(slug);

                const metadata = this.#metadata.get(normalizedSlug);

                return typeof metadata === "undefined"
                    ? undefined
                    : { ...metadata };
            } catch (error) {
                if (error instanceof TypeError) {
                    return undefined;
                }

                throw error;
            }
        }

        static text(element, value) {
            return setElementText(element, value);
        }

        static html(element, value) {
            return setElementHtml(element, value);
        }

        static tagName(slug) {
            try {
                return this.#tagName(slug);
            } catch (error) {
                if (error instanceof TypeError) {
                    return undefined;
                }

                throw error;
            }
        }

        static register(slug, ComponentClass, options = {}) {
            const normalizedSlug = this.#normalizeSlug(slug);

            if (typeof ComponentClass !== "function") {
                throw new TypeError("Component registration requires a class constructor.");
            }

            if (
                ComponentClass !== Component
                && !(ComponentClass.prototype instanceof Component)
            ) {
                throw new TypeError(
                    "Registered component classes must extend Component."
                );
            }

            const normalizedOptions =
                this.#normalizeRegistrationOptions(options);

            const registrationOrder =
                this.#registrationCounter + 1;

            const incomingMetadata = {
                provider: normalizedOptions.provider,
                priority: normalizedOptions.priority,
                order: registrationOrder,
            };

            if (this.#definitions.has(normalizedSlug)) {
                const currentMetadata =
                    this.#metadata.get(normalizedSlug);

                if (
                    typeof currentMetadata === "undefined"
                    || !this.#shouldOverride(
                        currentMetadata,
                        incomingMetadata
                    )
                ) {
                    return this;
                }

                const currentDefinition =
                    this.#definitions.get(normalizedSlug);

                this.#definitions.set(
                    normalizedSlug,
                    ComponentClass
                );

                this.#metadata.set(
                    normalizedSlug,
                    incomingMetadata
                );

                try {
                    if (this.#supportsCustomElements()) {
                        const registry =
                            this.#customElementsRegistry();

                        const tagName =
                            this.#tagName(normalizedSlug);

                        if (
                            typeof registry.get(tagName)
                            === "undefined"
                        ) {
                            this.#defineCustomElement(
                                normalizedSlug
                            );
                        }
                    }
                } catch (error) {
                    this.#definitions.set(
                        normalizedSlug,
                        currentDefinition
                    );

                    this.#metadata.set(
                        normalizedSlug,
                        currentMetadata
                    );

                    throw error;
                }

                this.#registrationCounter =
                    registrationOrder;

                return this;
            }

            this.#definitions.set(
                normalizedSlug,
                ComponentClass
            );

            this.#metadata.set(
                normalizedSlug,
                incomingMetadata
            );

            try {
                if (this.#supportsCustomElements()) {
                    this.#defineCustomElement(
                        normalizedSlug
                    );
                }
            } catch (error) {
                this.#definitions.delete(
                    normalizedSlug
                );

                this.#metadata.delete(
                    normalizedSlug
                );

                throw error;
            }

            this.#registrationCounter =
                registrationOrder;

            return this;
        }

        static create(slug, config = {}) {
            const normalizedSlug = this.#normalizeSlug(slug);
            const ComponentClass = this.#definitions.get(normalizedSlug);

            if (typeof ComponentClass === "undefined") {
                throw new Error(
                    `Component "${normalizedSlug}" is not registered.`
                );
            }

            const component = new ComponentClass(config);
            const id = this.#nextId(normalizedSlug);

            component[initializeIdentity](id, normalizedSlug);
            component.onCreate();
            component[executeRender]();

            this.#instances.set(id, component);

            return component;
        }

        static select(id) {
            if (typeof id !== "string" || id.trim() === "") {
                return undefined;
            }

            return this.#instances.get(id.trim());
        }

        static destroy(id) {
            const component = this.select(id);

            if (typeof component === "undefined") {
                return false;
            }

            return component.destroy();
        }
    }

    global.Component = Component;
    global.Builder = Builder;

})(globalThis);

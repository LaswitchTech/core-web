(function (global) {
    "use strict";

    if (
        typeof global.Component !== "function"
        || typeof global.Builder !== "function"
    ) {
        throw new Error(
            "Core-Web Component and Builder must be loaded before Stepper."
        );
    }

    function normalizeLayout(value) {
        return value === "vertical"
            ? "vertical"
            : "horizontal";
    }

    const STEPPER_STATES =
        Object.freeze([
            "current",
            "complete",
            "incomplete",
            "disabled",
            "error",
        ]);

    function normalizeState(value) {
        return STEPPER_STATES.includes(
            value
        )
            ? value
        : "incomplete";
    }

    function normalizeStepControl(value) {
        if (
            value === null
            || value === undefined
        ) {
            return {
                label: "",
                icon: "",
                variant: "",
                callback: null,
            };
        }

        if (
            typeof value !== "object"
            || Array.isArray(value)
        ) {
            throw new TypeError(
                "Stepper step controls must be objects or null."
            );
        }

        const callback =
            value.callback === null
            || value.callback === undefined
                ? null
                : value.callback;

        if (
            callback !== null
            && typeof callback !== "function"
        ) {
            throw new TypeError(
                "Stepper step control callback must be a function or null."
            );
        }

        return {
            label:
                typeof value.label === "string"
                    ? value.label
                    : "",
            icon:
                typeof value.icon === "string"
                    ? value.icon
                    : "",
            variant:
                typeof value.variant === "string"
                    ? value.variant
                    : "",
            callback:
                callback,
        };
    }

    function normalizeSteps(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                "Stepper steps must be an array."
            );
        }

        return value.map(function (step) {
            if (
                step === null
                || typeof step !== "object"
                || Array.isArray(step)
            ) {
                throw new TypeError(
                    "Stepper step configuration is invalid."
                );
            }

            const id =
                typeof step.id === "string"
                    ? step.id
                    : "";

            const label =
                typeof step.label === "string"
                    ? step.label
                    : "";

            const description =
                typeof step.description === "string"
                    ? step.description
                    : "";

            const content =
                typeof step.content === "string"
                    ? step.content
                    : "";

            const icon =
                typeof step.icon === "string"
                    ? step.icon
                    : "";

            const number =
                typeof step.number === "number"
                    && Number.isFinite(step.number)
                    ? String(step.number)
                    : typeof step.number === "string"
                        ? step.number
                        : "";

            if (id === "") {
                throw new TypeError(
                    "Stepper steps require an id."
                );
            }

            if (label === "") {
                throw new TypeError(
                    "Stepper steps require a label."
                );
            }

            return {
                id: id,
                label: label,
                description: description,
                content: content,
                icon: icon,
                number: number,
                state:
                    normalizeState(
                        step.state
                    ),
                disabled:
                    step.disabled === true,
                previous:
                    normalizeStepControl(
                        step.previous
                    ),
                next:
                    normalizeStepControl(
                        step.next
                    ),
            };
        });
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

    class Stepper extends global.Component {
        constructor(config) {
            super(config);

            this.previousButton =
                null;

            this.nextButton =
                null;

            this.transitioning =
                false;
        }

        destroyPreviousButton() {
            if (
                this.previousButton !== null
                && typeof this.previousButton.destroy
                    === "function"
            ) {
                this.previousButton.destroy();
            }

            this.previousButton =
                null;

            return this;
        }

        destroyNextButton() {
            if (
                this.nextButton !== null
                && typeof this.nextButton.destroy
                    === "function"
            ) {
                this.nextButton.destroy();
            }

            this.nextButton =
                null;

            return this;
        }

        beforeDestroy() {
            this.destroyPreviousButton();
            this.destroyNextButton();
        }

        getSteps() {
            return normalizeSteps(
                this.config(
                    "steps"
                )
            );
        }

        getCurrentIndex() {
            const steps =
                this.getSteps();

            const currentStep =
                this.config(
                    "currentStep"
                );

            return steps.findIndex(
                function (step) {
                    return step.id
                        === currentStep;
                }
            );
        }

        getCurrentStep() {
            const steps =
                this.getSteps();

            const index =
                this.getCurrentIndex();

            return index >= 0
                ? steps[index]
                : null;
        }

        async goToStep(stepId) {
            if (
                typeof stepId !== "string"
                || stepId === ""
                || this.transitioning === true
            ) {
                return false;
            }

            const steps =
                this.getSteps();

            const targetStep =
                steps.find(
                    function (step) {
                        return step.id
                            === stepId;
                    }
                );

            if (
                targetStep === undefined
                || targetStep.disabled === true
                || targetStep.state === "disabled"
            ) {
                return false;
            }

            const currentStep =
                this.getCurrentStep();

            if (
                currentStep !== null
                && currentStep.id === targetStep.id
            ) {
                return true;
            }

            const beforeChange =
                this.config(
                    "onBeforeChange"
                );

            const onChange =
                this.config(
                    "onChange"
                );

            if (
                beforeChange !== null
                && typeof beforeChange !== "function"
            ) {
                throw new TypeError(
                    "Stepper onBeforeChange must be a function or null."
                );
            }

            if (
                onChange !== null
                && typeof onChange !== "function"
            ) {
                throw new TypeError(
                    "Stepper onChange must be a function or null."
                );
            }

            this.transitioning =
                true;

            try {
                if (
                    typeof beforeChange === "function"
                    && await beforeChange(
                        currentStep,
                        targetStep,
                        this
                    ) === false
                ) {
                    return false;
                }

                this.config(
                    "currentStep",
                    targetStep.id
                );

                this.refresh();

                if (typeof onChange === "function") {
                    await onChange(
                        currentStep,
                        targetStep,
                        this
                    );
                }

                return true;
            } finally {
                this.transitioning =
                    false;
            }
        }

        async previous() {
            const steps =
                this.getSteps();

            const currentIndex =
                this.getCurrentIndex();

            for (
                let index = currentIndex - 1;
                index >= 0;
                index -= 1
            ) {
                if (
                    steps[index].disabled !== true
                    && steps[index].state !== "disabled"
                ) {
                    const currentStep =
                        steps[currentIndex];

                    const targetStep =
                        steps[index];

                    const callback =
                        currentStep.previous.callback;

                    if (
                        typeof callback === "function"
                        && await callback(
                            currentStep,
                            targetStep,
                            this
                        ) === false
                    ) {
                        return false;
                    }

                    return this.goToStep(
                        targetStep.id
                    );
                }
            }

            return Promise.resolve(
                false
            );
        }

        async next() {
            const steps =
                this.getSteps();

            const currentIndex =
                this.getCurrentIndex();

            for (
                let index = currentIndex + 1;
                index < steps.length;
                index += 1
            ) {
                if (
                    steps[index].disabled !== true
                    && steps[index].state !== "disabled"
                ) {
                    const currentStep =
                        steps[currentIndex];

                    const targetStep =
                        steps[index];

                    const callback =
                        currentStep.next.callback;

                    if (
                        typeof callback === "function"
                        && await callback(
                            currentStep,
                            targetStep,
                            this
                        ) === false
                    ) {
                        return false;
                    }

                    return this.goToStep(
                        targetStep.id
                    );
                }
            }

            return Promise.resolve(
                false
            );
        }

        static defaults() {
            return {
                steps: [],
                currentStep: "",
                layout: "horizontal",
                previousControlVisible: true,
                nextControlVisible: true,
                previousLabel: "Previous",
                nextLabel: "Next",
                onBeforeChange: null,
                onChange: null,
            };
        }

        render() {
            const root =
                document.createElement(
                    "div"
                );

            const steps =
                document.createElement(
                    "div"
                );

            const content =
                document.createElement(
                    "div"
                );

            const controls =
                document.createElement(
                    "div"
                );

            const previous =
                document.createElement(
                    "div"
                );

            const next =
                document.createElement(
                    "div"
                );

            root.classList.add(
                "app-stepper"
            );

            steps.classList.add(
                "app-stepper-steps"
            );

            controls.classList.add(
                "app-stepper-controls"
            );

            content.classList.add(
                "app-stepper-content"
            );

            content.setAttribute(
                "data-stepper-region",
                "content"
            );

            previous.classList.add(
                "app-stepper-control",
                "app-stepper-control-previous"
            );

            next.classList.add(
                "app-stepper-control",
                "app-stepper-control-next"
            );

            steps.setAttribute(
                "data-stepper-region",
                "steps"
            );

            previous.setAttribute(
                "data-stepper-region",
                "previous"
            );

            next.setAttribute(
                "data-stepper-region",
                "next"
            );

            controls.append(
                previous,
                next
            );

            root.append(
                steps,
                content,
                controls
            );

            this.update(
                root
            );

            return root;
        }

        createStepElement(
            step,
            index,
            currentStep
        ) {
            const item =
                document.createElement(
                    "div"
                );

            const button =
                document.createElement(
                    "button"
                );

            const indicator =
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

            const description =
                document.createElement(
                    "span"
                );

            const disabled =
                step.disabled === true
                || step.state === "disabled";

            const state =
                disabled
                    ? "disabled"
                    : step.id === currentStep
                        ? "current"
                        : step.state === "current"
                            ? "incomplete"
                            : step.state;

            item.classList.add(
                "app-stepper-step"
            );

            button.classList.add(
                "app-stepper-step-button"
            );

            indicator.classList.add(
                "app-stepper-step-indicator"
            );

            content.classList.add(
                "app-stepper-step-content"
            );

            label.classList.add(
                "app-stepper-step-label"
            );

            description.classList.add(
                "app-stepper-step-description"
            );

            item.setAttribute(
                "data-stepper-step-id",
                step.id
            );

            item.setAttribute(
                "data-stepper-step-state",
                state
            );

            button.type =
                "button";

            button.disabled =
                disabled;

            if (step.icon !== "") {
                renderIcon(
                    indicator,
                    step.icon
                );
            } else {
                global.Builder.text(
                    indicator,
                    step.number !== ""
                        ? step.number
                        : String(index + 1)
                );
            }

            global.Builder.text(
                label,
                step.label
            );

            global.Builder.text(
                description,
                step.description
            );

            description.hidden =
                step.description === "";

            if (state === "current") {
                button.setAttribute(
                    "aria-current",
                    "step"
                );
            }

            button.addEventListener(
                "click",
                () => {
                    this.goToStep(
                        step.id
                    );
                }
            );

            content.append(
                label,
                description
            );

            button.append(
                indicator,
                content
            );

            item.append(
                button
            );

            return item;
        }

        update(element) {
            if (!(element instanceof HTMLElement)) {
                throw new TypeError(
                    "Stepper update requires an HTMLElement."
                );
            }

            const steps =
                normalizeSteps(
                    this.config(
                        "steps"
                    )
                );

            const layout =
                normalizeLayout(
                    this.config(
                        "layout"
                    )
                );

            const currentStep =
                this.config(
                    "currentStep"
                );

            const previousControlVisible =
                this.config(
                    "previousControlVisible"
                );

            const nextControlVisible =
                this.config(
                    "nextControlVisible"
                );

            const previousLabel =
                this.config(
                    "previousLabel"
                );

            const nextLabel =
                this.config(
                    "nextLabel"
                );

            if (typeof currentStep !== "string") {
                throw new TypeError(
                    "Stepper currentStep must be a string."
                );
            }

            let resolvedCurrentStep =
                currentStep;

            if (resolvedCurrentStep === "") {
                const configuredCurrent =
                    steps.find(
                        function (step) {
                            return (
                                step.state === "current"
                                && step.disabled !== true
                            );
                        }
                    );

                if (configuredCurrent !== undefined) {
                    resolvedCurrentStep =
                        configuredCurrent.id;

                    this.config(
                        "currentStep",
                        resolvedCurrentStep
                    );
                }
            }

            if (
                typeof previousControlVisible !== "boolean"
                || typeof nextControlVisible !== "boolean"
            ) {
                throw new TypeError(
                    "Stepper control visibility values must be booleans."
                );
            }

            if (
                typeof previousLabel !== "string"
                || typeof nextLabel !== "string"
            ) {
                throw new TypeError(
                    "Stepper control labels must be strings."
                );
            }

            const stepsRegion =
                element.querySelector(
                    '[data-stepper-region="steps"]'
                );

            const contentRegion =
                element.querySelector(
                    '[data-stepper-region="content"]'
                );

            const previousRegion =
                element.querySelector(
                    '[data-stepper-region="previous"]'
                );

            const nextRegion =
                element.querySelector(
                    '[data-stepper-region="next"]'
                );

            if (
                !(stepsRegion instanceof HTMLElement)
                || !(contentRegion instanceof HTMLElement)
                || !(previousRegion instanceof HTMLElement)
                || !(nextRegion instanceof HTMLElement)
            ) {
                throw new Error(
                    "Stepper rendered regions are missing."
                );
            }

            this.config(
                "steps",
                steps
            );

            this.config(
                "layout",
                layout
            );

            element.setAttribute(
                "data-stepper-layout",
                layout
            );

            const activeStep =
                steps.find(
                    function (step) {
                        return step.id
                            === resolvedCurrentStep;
                    }
                )
                || null;

            const activeContent =
                activeStep !== null
                    ? activeStep.content
                    : "";

            global.Builder.html(
                contentRegion,
                activeContent
            );

            contentRegion.hidden =
                activeContent === "";

            this.destroyPreviousButton();
            this.destroyNextButton();

            previousRegion.replaceChildren();
            nextRegion.replaceChildren();

            if (previousControlVisible) {
                if (!global.Builder.has("button")) {
                    throw new Error(
                        "Stepper Previous control requires the Button component."
                    );
                }

                const currentIndex =
                    steps.findIndex(
                        function (step) {
                            return step.id
                                === resolvedCurrentStep;
                        }
                    );

                const previousAvailable =
                    steps
                        .slice(
                            0,
                            Math.max(
                                currentIndex,
                                0
                            )
                        )
                        .some(
                            function (step) {
                                return (
                                    step.disabled !== true
                                    && step.state !== "disabled"
                                );
                            }
                        );

                const previousButton =
                    global.Builder.create(
                        "button",
                        {
                            label:
                                activeStep !== null
                                && activeStep.previous.label !== ""
                                    ? activeStep.previous.label
                                    : previousLabel,
                            icon:
                                activeStep !== null
                                    ? activeStep.previous.icon
                                    : "",
                            variant:
                                activeStep !== null
                                && activeStep.previous.variant !== ""
                                    ? activeStep.previous.variant
                                    : "secondary",
                            size:
                                "small",
                            disabled:
                                !previousAvailable,
                            callback:
                                () => {
                                    this.previous();
                                },
                        }
                    );

                previousButton.appendTo(
                    previousRegion
                );

                this.previousButton =
                    previousButton;
            }

            previousRegion.hidden =
                !previousControlVisible;

            if (nextControlVisible) {
                if (!global.Builder.has("button")) {
                    throw new Error(
                        "Stepper Next control requires the Button component."
                    );
                }

                const currentIndex =
                    steps.findIndex(
                        function (step) {
                            return step.id
                                === resolvedCurrentStep;
                        }
                    );

                const nextAvailable =
                    currentIndex >= 0
                    && steps
                        .slice(
                            currentIndex + 1
                        )
                        .some(
                            function (step) {
                                return (
                                    step.disabled !== true
                                    && step.state !== "disabled"
                                );
                            }
                        );

                const nextButton =
                    global.Builder.create(
                        "button",
                        {
                            label:
                                activeStep !== null
                                && activeStep.next.label !== ""
                                    ? activeStep.next.label
                                    : nextLabel,
                            icon:
                                activeStep !== null
                                    ? activeStep.next.icon
                                    : "",
                            variant:
                                activeStep !== null
                                && activeStep.next.variant !== ""
                                    ? activeStep.next.variant
                                    : "primary",
                            size:
                                "small",
                            disabled:
                                !nextAvailable,
                            callback:
                                () => {
                                    this.next();
                                },
                        }
                    );

                nextButton.appendTo(
                    nextRegion
                );

                this.nextButton =
                    nextButton;
            }

            nextRegion.hidden =
                !nextControlVisible;

            const controlsRegion =
                previousRegion.parentElement;

            if (!(controlsRegion instanceof HTMLElement)) {
                throw new Error(
                    "Stepper controls region is missing."
                );
            }

            controlsRegion.hidden =
                !previousControlVisible
                && !nextControlVisible;

            stepsRegion.replaceChildren();

            steps.forEach(
                (step, index) => {
                    stepsRegion.append(
                        this.createStepElement(
                            step,
                            index,
                            resolvedCurrentStep
                        )
                    );
                }
            );

            return this;
        }

        showPreviousControl() {
            this.config(
                "previousControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hidePreviousControl() {
            this.config(
                "previousControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        togglePreviousControl() {
            return this.config(
                "previousControlVisible"
            ) === true
                ? this.hidePreviousControl()
                : this.showPreviousControl();
        }

        showNextControl() {
            this.config(
                "nextControlVisible",
                true
            );

            this.refresh();

            return this;
        }

        hideNextControl() {
            this.config(
                "nextControlVisible",
                false
            );

            this.refresh();

            return this;
        }

        toggleNextControl() {
            return this.config(
                "nextControlVisible"
            ) === true
                ? this.hideNextControl()
                : this.showNextControl();
        }
    }

    global.Builder.register(
        "stepper",
        Stepper,
        {
            provider: "kernel",
            priority: 0,
        }
    );

})(globalThis);
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectDynamic = injectDynamic;
exports.injectIntoReactApp = injectIntoReactApp;
exports.injectIntoVueApp = injectIntoVueApp;
exports.injectIntoAngularApp = injectIntoAngularApp;
// Dynamic injection for non-static sites
function injectDynamic(options) {
    const { payload, techniques, selector, interval = 5000, observe = true } = options;
    // Initial injection
    injectCurrentContent();
    if (observe) {
        // Watch for DOM changes
        const observer = new MutationObserver(() => {
            injectCurrentContent();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    else if (interval > 0) {
        // Periodic re-injection
        setInterval(injectCurrentContent, interval);
    }
    function injectCurrentContent() {
        const html = document.documentElement.outerHTML;
        const poisoned = (0, index_1.inject)(html, {
            payload,
            techniques
        });
        // Replace content if changed
        if (poisoned !== html) {
            document.documentElement.innerHTML = poisoned;
        }
    }
}
// For React/Vue/Angular apps
function injectIntoReactApp(options) {
    // Wait for React to finish rendering
    const waitForReact = () => {
        if (document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
            injectDynamic(options);
        }
        else {
            setTimeout(waitForReact, 100);
        }
    };
    waitForReact();
}
// For Vue apps
function injectIntoVueApp(options) {
    const waitForVue = () => {
        if (document.querySelector('#app') || document.querySelector('[data-v-]')) {
            injectDynamic(options);
        }
        else {
            setTimeout(waitForVue, 100);
        }
    };
    waitForVue();
}
// For Angular apps
function injectIntoAngularApp(options) {
    const waitForAngular = () => {
        if (document.querySelector('[ng-version]') || document.querySelector('app-root')) {
            injectDynamic(options);
        }
        else {
            setTimeout(waitForAngular, 100);
        }
    };
    waitForAngular();
}
// Import the inject function
const index_1 = require("./index");

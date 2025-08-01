"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const eleventyPlugin = function (eleventyConfig, pluginOptions) {
    eleventyConfig.addTransform("poison", async (content, outputPath) => {
        if (outputPath && outputPath.endsWith(".html")) {
            const payloads = (0, utils_1.loadPayloads)(pluginOptions.payloads);
            const processedPayload = (0, utils_1.processPayloads)(payloads, pluginOptions.variables, pluginOptions.entropy);
            return (0, utils_1.inject)(content, {
                payload: processedPayload.text,
                techniques: processedPayload.techniques,
                selector: pluginOptions.selector
            });
        }
        return content;
    });
};
// Export the plugin function as the default export for Eleventy
module.exports = eleventyPlugin;
// Export utility functions for direct use (e.g., by the CLI)
module.exports.inject = utils_1.inject;
module.exports.processPayloads = utils_1.processPayloads;
module.exports.loadPayloads = utils_1.loadPayloads;
module.exports.substituteVariables = substituteVariables;
module.exports.addEntropy = addEntropy;
module.exports.selectWeightedPayload = selectWeightedPayload;

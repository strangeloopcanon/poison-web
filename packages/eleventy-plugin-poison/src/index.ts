import { inject, processPayloads, loadPayloads, substituteVariables, addEntropy, selectWeightedPayload } from './utils';

const eleventyPlugin = function(eleventyConfig: any, pluginOptions: any) {
  eleventyConfig.addTransform("poison", async (content: string, outputPath: string) => {
    if (outputPath && outputPath.endsWith(".html")) {
      const payloads = loadPayloads(pluginOptions.payloads);
      const processedPayload = processPayloads(payloads, pluginOptions.variables, pluginOptions.entropy);
      return inject(content, {
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
module.exports.inject = inject;
module.exports.processPayloads = processPayloads;
module.exports.loadPayloads = loadPayloads;
module.exports.substituteVariables = substituteVariables;
module.exports.addEntropy = addEntropy;
module.exports.selectWeightedPayload = selectWeightedPayload;

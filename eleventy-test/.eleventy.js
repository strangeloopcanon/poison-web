module.exports = function(eleventyConfig) {
  const poisonPlugin = require("eleventy-plugin-poison");
  const path = require('path');

  eleventyConfig.addPlugin(poisonPlugin, {
    payloads: path.resolve(__dirname, 'payloads.yaml'),
    variables: {},
    entropy: 0,
    selector: 'body'
  });

  eleventyConfig.addPassthroughCopy("src/static");

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
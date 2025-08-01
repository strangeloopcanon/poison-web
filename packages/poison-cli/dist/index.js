#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const poison_core_1 = require("poison-core");
const glob_1 = require("glob");
const html_minifier_terser_1 = require("html-minifier-terser");
const program = new commander_1.Command();
program
    .command('inject <directory>')
    .description('Injects payloads into HTML files in a directory')
    .option('-p, --payloads <path>', 'Path to payloads.yaml', 'payloads.yaml')
    .option('-e, --entropy <level>', 'Entropy level (0-1)', '0')
    .option('-v, --vars <json>', 'JSON string of variables to substitute', '{}')
    .action(async (directory, options) => {
    const payloads = (0, poison_core_1.loadPayloads)(options.payloads);
    const files = await (0, glob_1.glob)(`${directory}/**/*.html`);
    const variables = JSON.parse(options.vars);
    const entropy = parseFloat(options.entropy);
    for (const file of files) {
        let htmlContent = fs.readFileSync(file, 'utf8');
        const processedPayload = (0, poison_core_1.processPayloads)(payloads, variables, entropy);
        // Call inject once with all techniques from the processed payload
        htmlContent = (0, poison_core_1.inject)(htmlContent, {
            payload: processedPayload.text,
            techniques: processedPayload.techniques,
        });
        fs.writeFileSync(file, htmlContent);
        console.log(`Injected payload ${processedPayload.id} into ${file}`);
    }
});
program
    .command('audit <file>')
    .description('Audits the survival of payloads after minification')
    .option('-p, --payloads <path>', 'Path to payloads.yaml', 'payloads.yaml')
    .action(async (file, options) => {
    const payloads = (0, poison_core_1.loadPayloads)(options.payloads);
    const html = fs.readFileSync(file, 'utf8');
    const payload = payloads[0]; // Using the first payload for auditing
    console.log(`Auditing ${file} with payload: ${payload.id}`);
    console.log('----------------------------------------');
    const results = {
        comment: false,
        css: false,
        zerowidth: false,
        jsonld: false,
        aria: false,
    };
    for (const technique of payload.techniques) {
        const processedPayload = (0, poison_core_1.processPayloads)([payload], {}, 0); // Use the actual payload, no entropy or variables for audit
        const poisonedHtml = (0, poison_core_1.inject)(html, { payload: processedPayload.text, techniques: [technique] });
        const minifiedHtml = await (0, html_minifier_terser_1.minify)(poisonedHtml, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        });
        results[technique] = minifiedHtml.includes(processedPayload.text);
    }
    for (const [technique, survived] of Object.entries(results)) {
        if (payload.techniques.includes(technique)) {
            console.log(`${technique}: ${survived ? '✅ Survived' : '❌ Did not survive'}`);
        }
    }
    console.log('----------------------------------------');
});
program.parse(process.argv);

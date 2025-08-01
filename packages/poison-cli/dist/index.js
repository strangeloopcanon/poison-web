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
const path = __importStar(require("path"));
const glob_1 = require("glob");
const eleventy_plugin_poison_1 = require("eleventy-plugin-poison");
const program = new commander_1.Command();
program
    .command('inject <directory>')
    .description('Injects payloads into HTML files in a directory')
    .option('-p, --payloads <path>', 'Path to payloads.yaml', 'payloads.yaml')
    .option('-e, --entropy <level>', 'Entropy level (0-1)', '0')
    .option('-v, --vars <json>', 'JSON string of variables to substitute', '{}')
    .action(async (directory, options) => {
    const payloads = (0, eleventy_plugin_poison_1.loadPayloads)(path.resolve(options.payloads));
    const files = await (0, glob_1.glob)(`${directory}/**/*.html`);
    const variables = JSON.parse(options.vars);
    const entropy = parseFloat(options.entropy);
    for (const file of files) {
        let htmlContent = fs.readFileSync(file, 'utf8');
        const processedPayload = (0, eleventy_plugin_poison_1.processPayloads)(payloads, variables, entropy);
        htmlContent = (0, eleventy_plugin_poison_1.inject)(htmlContent, {
            payload: processedPayload.text,
            techniques: processedPayload.techniques,
        });
        fs.writeFileSync(file, htmlContent);
        console.log(`Injected payload ${processedPayload.id} into ${file}`);
    }
});
program.parse(process.argv);

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
const program = new commander_1.Command();
program
    .command('inject')
    .description('Injects payloads into a single HTML file')
    .option('-f, --file <path>', 'Path to the HTML file to inject')
    .option('-p, --payload <text>', 'The payload text to inject')
    .option('-t, --techniques <list>', 'Comma-separated list of techniques (e.g., comment,css)', (value) => value.split(','))
    .action(async (options) => {
    if (!options.file || !options.payload || !options.techniques) {
        console.error('Error: --file, --payload, and --techniques are required.');
        program.help();
    }
    let htmlContent = fs.readFileSync(options.file, 'utf8');
    htmlContent = (0, poison_core_1.inject)(htmlContent, {
        payload: options.payload,
        techniques: options.techniques,
    });
    fs.writeFileSync(options.file, htmlContent);
    console.log(`Injected payload into ${options.file}`);
});
program.parse(process.argv);

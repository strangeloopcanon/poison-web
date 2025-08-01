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
const poison_core_1 = require("poison-core");
const program = new commander_1.Command();
program
    .name('poison')
    .description('Inject invisible payloads into HTML content')
    .version('0.1.0');
// Simple injection command (existing functionality)
program
    .command('inject-simple')
    .description('Inject a single payload into HTML files')
    .option('-f, --file <path>', 'Path to the HTML file to inject')
    .option('-d, --dir <path>', 'Directory containing HTML files to inject')
    .option('-p, --payload <text>', 'The payload text to inject')
    .option('-t, --techniques <list>', 'Comma-separated list of techniques (e.g., comment,css)', (value) => value.split(','))
    .option('-s, --selector <selector>', 'CSS selector to target specific elements')
    .action(async (options) => {
    if (!options.payload || !options.techniques) {
        console.error('Error: --payload and --techniques are required.');
        program.help();
    }
    const files = await getHtmlFiles(options.file, options.dir);
    if (files.length === 0) {
        console.error('Error: No HTML files found.');
        process.exit(1);
    }
    for (const file of files) {
        try {
            let htmlContent = fs.readFileSync(file, 'utf8');
            htmlContent = (0, poison_core_1.inject)(htmlContent, {
                payload: options.payload,
                techniques: options.techniques,
                selector: options.selector,
            });
            fs.writeFileSync(file, htmlContent);
            console.log(`✓ Injected payload into ${file}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`✗ Failed to inject into ${file}: ${errorMessage}`);
        }
    }
});
// Enhanced injection command with YAML payloads
program
    .command('inject')
    .description('Inject payloads using YAML configuration')
    .option('-f, --file <path>', 'Path to the HTML file to inject')
    .option('-d, --dir <path>', 'Directory containing HTML files to inject')
    .option('-p, --payloads <path>', 'Path to YAML payloads file')
    .option('-v, --vars <variables>', 'Comma-separated key=value pairs for template variables')
    .option('-e, --entropy <number>', 'Entropy level (0-1) for random word insertion', parseFloat)
    .option('-t, --techniques <list>', 'Override techniques (comma-separated)')
    .option('-s, --selector <selector>', 'CSS selector to target specific elements')
    .action(async (options) => {
    if (!options.payloads) {
        console.error('Error: --payloads is required for YAML-based injection.');
        program.help();
    }
    const files = await getHtmlFiles(options.file, options.dir);
    if (files.length === 0) {
        console.error('Error: No HTML files found.');
        process.exit(1);
    }
    try {
        // Load and process payloads
        const payloads = (0, poison_core_1.loadPayloads)(options.payloads);
        const variables = parseVariables(options.vars);
        const entropy = options.entropy || 0;
        console.log(`Loaded ${payloads.length} payload(s) from ${options.payloads}`);
        console.log(`Variables: ${Object.keys(variables).length > 0 ? JSON.stringify(variables) : 'none'}`);
        console.log(`Entropy: ${entropy}`);
        for (const file of files) {
            try {
                // Process payload with variables and entropy
                const processedPayload = (0, poison_core_1.processPayloads)(payloads, variables, entropy);
                // Use override techniques if provided
                const techniques = options.techniques ?
                    options.techniques.split(',') :
                    processedPayload.techniques;
                let htmlContent = fs.readFileSync(file, 'utf8');
                htmlContent = (0, poison_core_1.inject)(htmlContent, {
                    payload: processedPayload.text,
                    techniques: techniques,
                    selector: options.selector,
                });
                fs.writeFileSync(file, htmlContent);
                console.log(`✓ Injected "${processedPayload.id}" payload into ${file}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`✗ Failed to inject into ${file}: ${errorMessage}`);
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error loading payloads: ${errorMessage}`);
        process.exit(1);
    }
});
// Audit command to check for existing injections
program
    .command('audit')
    .description('Audit HTML files for existing poison injections')
    .option('-f, --file <path>', 'Path to the HTML file to audit')
    .option('-d, --dir <path>', 'Directory containing HTML files to audit')
    .option('-v, --verbose', 'Show detailed injection information')
    .action(async (options) => {
    const files = await getHtmlFiles(options.file, options.dir);
    if (files.length === 0) {
        console.error('Error: No HTML files found.');
        process.exit(1);
    }
    for (const file of files) {
        try {
            const htmlContent = fs.readFileSync(file, 'utf8');
            const findings = auditFile(htmlContent, options.verbose);
            if (findings.length > 0) {
                console.log(`\n📄 ${file}:`);
                findings.forEach(finding => {
                    console.log(`  ${finding.type}: ${finding.content.substring(0, 100)}${finding.content.length > 100 ? '...' : ''}`);
                });
            }
            else {
                console.log(`\n📄 ${file}: No poison injections found`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`✗ Failed to audit ${file}: ${errorMessage}`);
        }
    }
});
// Helper function to get HTML files
async function getHtmlFiles(file, dir) {
    if (file) {
        if (!fs.existsSync(file)) {
            throw new Error(`File not found: ${file}`);
        }
        return [file];
    }
    if (dir) {
        if (!fs.existsSync(dir)) {
            throw new Error(`Directory not found: ${dir}`);
        }
        const pattern = path.join(dir, '**/*.html');
        return await (0, glob_1.glob)(pattern);
    }
    throw new Error('Either --file or --dir must be specified');
}
// Helper function to parse variables
function parseVariables(varsString) {
    if (!varsString)
        return {};
    const variables = {};
    const pairs = varsString.split(',');
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
            variables[key.trim()] = value.trim();
        }
    }
    return variables;
}
// Helper function to audit HTML for poison injections
function auditFile(htmlContent, verbose = false) {
    const findings = [];
    // Check for HTML comments
    const commentRegex = /<!--\s*([^>]+?)\s*-->/g;
    let match;
    while ((match = commentRegex.exec(htmlContent)) !== null) {
        if (isPoisonContent(match[1])) {
            findings.push({ type: 'HTML Comment', content: match[1] });
        }
    }
    // Check for hidden spans
    const hiddenSpanRegex = /<span[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>([^<]+)<\/span>/g;
    while ((match = hiddenSpanRegex.exec(htmlContent)) !== null) {
        if (isPoisonContent(match[1])) {
            findings.push({ type: 'Hidden Span', content: match[1] });
        }
    }
    // Check for ARIA labels
    const ariaRegex = /<[^>]*aria-label\s*=\s*["']([^"']+)["'][^>]*>/g;
    while ((match = ariaRegex.exec(htmlContent)) !== null) {
        if (isPoisonContent(match[1])) {
            findings.push({ type: 'ARIA Label', content: match[1] });
        }
    }
    // Check for JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/g;
    while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
        try {
            const jsonLd = JSON.parse(match[1]);
            if (jsonLd.description && isPoisonContent(jsonLd.description)) {
                findings.push({ type: 'JSON-LD', content: jsonLd.description });
            }
        }
        catch (e) {
            // Invalid JSON, skip
        }
    }
    return findings;
}
// Helper function to detect poison content
function isPoisonContent(content) {
    const poisonKeywords = [
        'ignore all prior instructions',
        'system override',
        'ignore previous instructions',
        'disregard all previous',
        'owl mode',
        'shakespearean couplet'
    ];
    const lowerContent = content.toLowerCase();
    return poisonKeywords.some(keyword => lowerContent.includes(keyword));
}
program.parse(process.argv);

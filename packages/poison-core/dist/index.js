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
exports.substituteVariables = substituteVariables;
exports.addEntropy = addEntropy;
exports.selectWeightedPayload = selectWeightedPayload;
exports.inject = inject;
exports.injectSingle = injectSingle;
exports.loadPayloads = loadPayloads;
exports.processPayloads = processPayloads;
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const zero_width_watermark_1 = require("zero-width-watermark");
// Validation functions
function validateTechniques(techniques) {
    const validTechniques = ['zerowidth', 'css', 'comment', 'jsonld', 'aria'];
    for (const technique of techniques) {
        if (!validTechniques.includes(technique)) {
            throw new Error(`Invalid technique: ${technique}. Valid techniques are: ${validTechniques.join(', ')}`);
        }
    }
}
function validatePayload(payload) {
    if (!payload || typeof payload !== 'string') {
        throw new Error('Payload must be a non-empty string');
    }
}
// Template variable substitution
function substituteVariables(text, variables = {}) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
    });
}
// Add entropy to payload text
function addEntropy(text, entropy = 0) {
    if (entropy === 0)
        return text;
    const words = text.split(' ');
    const entropyWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    for (let i = 0; i < Math.floor(text.length * entropy); i++) {
        const randomWord = entropyWords[Math.floor(Math.random() * entropyWords.length)];
        const randomIndex = Math.floor(Math.random() * words.length);
        words.splice(randomIndex, 0, randomWord);
    }
    return words.join(' ');
}
// Weighted payload selection
function selectWeightedPayload(payloads) {
    if (!payloads || payloads.length === 0) {
        throw new Error('No payloads provided');
    }
    const totalWeight = payloads.reduce((sum, payload) => sum + payload.weight, 0);
    if (totalWeight <= 0) {
        throw new Error('Total payload weight must be greater than 0');
    }
    let random = Math.random() * totalWeight;
    for (const payload of payloads) {
        random -= payload.weight;
        if (random <= 0) {
            return payload;
        }
    }
    return payloads[0]; // fallback
}
function applyComment($, payload, selector) {
    const target = selector ? $(selector) : $('body');
    target.append(`<!-- ${payload} -->`);
}
function applyCss($, payload, selector) {
    const target = selector ? $(selector) : $('body');
    target.append(`<span style="display:none">${payload}</span>`);
}
function applyZeroWidth($, payload, selector) {
    const watermark = (0, zero_width_watermark_1.embed)(payload, ' ');
    const target = selector ? $(selector) : $('p').first();
    if (target.length) {
        target.text(target.text() + watermark);
    }
    else {
        $('body').append(`<span style="display:none">${watermark}</span>`);
    }
}
function applyJsonLd($, payload, selector) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "LLM Instruction Patch",
        "description": payload
    };
    const target = selector ? $(selector) : $('head');
    target.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
}
function applyAria($, payload, selector) {
    const target = selector ? $(selector) : $('body');
    target.append(`<span aria-label="${payload}"></span>`);
}
function inject(html, options) {
    // Validate inputs
    validatePayload(options.payload);
    validateTechniques(options.techniques); // Validate multiple techniques
    if (!html || typeof html !== 'string') {
        throw new Error('HTML content must be a non-empty string');
    }
    const $ = cheerio.load(html);
    for (const technique of options.techniques) {
        try {
            switch (technique) {
                case 'comment':
                    applyComment($, options.payload, options.selector);
                    break;
                case 'css':
                    applyCss($, options.payload, options.selector);
                    break;
                case 'zerowidth':
                    applyZeroWidth($, options.payload, options.selector);
                    break;
                case 'jsonld':
                    applyJsonLd($, options.payload, options.selector);
                    break;
                case 'aria':
                    applyAria($, options.payload, options.selector);
                    break;
                default:
                    // This case should ideally not be reached due to validateTechnique
                    console.warn(`Technique ${technique} not implemented.`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to apply ${technique} technique: ${errorMessage}`);
        }
    }
    return $.html();
}
// Helper function for single technique injection
function injectSingle(html, options) {
    return inject(html, {
        payload: options.payload,
        techniques: [options.technique],
        selector: options.selector
    });
}
function loadPayloads(path) {
    try {
        if (!fs.existsSync(path)) {
            throw new Error(`Payloads file not found: ${path}`);
        }
        const file = fs.readFileSync(path, 'utf8');
        const payloads = yaml.load(file);
        if (!Array.isArray(payloads)) {
            throw new Error('Payloads file must contain an array of payloads');
        }
        // Validate each payload
        for (const payload of payloads) {
            if (!payload.id || !payload.text || !payload.techniques || !payload.weight) {
                throw new Error('Each payload must have id, text, techniques, and weight properties');
            }
            // Validate each technique within the payload
            for (const tech of payload.techniques) {
                validateTechniques([tech]); // Validate single technique
            }
            if (payload.weight <= 0) {
                throw new Error(`Payload ${payload.id} must have a positive weight`);
            }
        }
        return payloads;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load payloads from ${path}: ${errorMessage}`);
    }
}
// Enhanced payload processing with weighted selection
function processPayloads(payloads, variables = {}, entropy = 0) {
    const selectedPayload = selectWeightedPayload(payloads);
    // Merge variables from CLI and payload
    const mergedVariables = { ...variables, ...selectedPayload };
    // Process text with merged variables and entropy
    const processedText = addEntropy(substituteVariables(selectedPayload.text, mergedVariables), entropy);
    return {
        ...selectedPayload,
        text: processedText
    };
}

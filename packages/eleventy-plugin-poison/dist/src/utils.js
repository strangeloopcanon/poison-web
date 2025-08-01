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
exports.inject = inject;
exports.substituteVariables = substituteVariables;
exports.addEntropy = addEntropy;
exports.selectWeightedPayload = selectWeightedPayload;
exports.processPayloads = processPayloads;
exports.loadPayloads = loadPayloads;
const jsdom_1 = require("jsdom");
const zero_width_watermark_1 = require("zero-width-watermark");
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
function applyComment(dom, payload, selector) {
    const document = dom.window.document;
    const target = selector ? document.querySelector(selector) : document.body;
    if (target) {
        target.appendChild(document.createComment(payload));
    }
}
function applyCss(dom, payload, selector) {
    const document = dom.window.document;
    const target = selector ? document.querySelector(selector) : document.body;
    if (target) {
        const span = document.createElement('span');
        span.style.display = 'none';
        span.textContent = payload;
        target.appendChild(span);
    }
}
function applyZeroWidth(dom, payload, selector) {
    const document = dom.window.document;
    const watermark = (0, zero_width_watermark_1.embed)(payload, ' ');
    const target = selector ? document.querySelector(selector) : document.querySelector('p');
    if (target) {
        target.textContent = (target.textContent || '') + watermark;
    }
    else if (document.body) {
        const span = document.createElement('span');
        span.style.display = 'none';
        span.textContent = watermark;
        document.body.appendChild(span);
    }
}
function applyJsonLd(dom, payload, selector) {
    const document = dom.window.document;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "LLM Instruction Patch",
        "description": payload
    };
    const target = selector ? document.querySelector(selector) : document.head;
    if (target) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        target.appendChild(script);
    }
}
function applyAria(dom, payload, selector) {
    const document = dom.window.document;
    const target = selector ? document.querySelector(selector) : document.body;
    if (target) {
        const span = document.createElement('span');
        span.setAttribute('aria-label', payload);
        target.appendChild(span);
    }
}
function inject(html, options) {
    const dom = new jsdom_1.JSDOM(html);
    for (const technique of options.techniques) {
        switch (technique) {
            case 'comment':
                applyComment(dom, options.payload, options.selector);
                break;
            case 'css':
                applyCss(dom, options.payload, options.selector);
                break;
            case 'zerowidth':
                applyZeroWidth(dom, options.payload, options.selector);
                break;
            case 'jsonld':
                applyJsonLd(dom, options.payload, options.selector);
                break;
            case 'aria':
                applyAria(dom, options.payload, options.selector);
                break;
        }
    }
    return dom.serialize();
}
function substituteVariables(text, variables = {}) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
    });
}
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
function processPayloads(payloads, variables = {}, entropy = 0) {
    const selectedPayload = selectWeightedPayload(payloads);
    const mergedVariables = Object.assign(Object.assign({}, variables), selectedPayload);
    const processedText = addEntropy(substituteVariables(selectedPayload.text, mergedVariables), entropy);
    return Object.assign(Object.assign({}, selectedPayload), { text: processedText });
}
function loadPayloads(path) {
    const file = fs.readFileSync(path, 'utf8');
    return yaml.load(file);
}

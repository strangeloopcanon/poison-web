"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.substituteVariables = substituteVariables;
exports.addEntropy = addEntropy;
exports.injectLightweight = injectLightweight;
exports.selectWeightedPayload = selectWeightedPayload;
exports.processPayloads = processPayloads;
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
// Lightweight HTML injection without Cheerio
function injectLightweight(html, options) {
    let result = html;
    for (const technique of options.techniques) {
        switch (technique) {
            case 'comment':
                result = result.replace('</body>', `<!-- ${options.payload} --></body>`);
                break;
            case 'css':
                result = result.replace('</body>', `<span style="display:none">${options.payload}</span></body>`);
                break;
            case 'jsonld':
                result = result.replace('</head>', `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Dataset","name":"LLM Instruction Patch","description":"${options.payload}"}</script></head>`);
                break;
            case 'aria':
                result = result.replace('</body>', `<span aria-label="${options.payload}"></span></body>`);
                break;
            case 'zerowidth':
                // Simple zero-width injection (basic version)
                const watermark = encodeURIComponent(options.payload).replace(/%/g, '\u200b');
                result = result.replace('</body>', `<span style="display:none">${watermark}</span></body>`);
                break;
        }
    }
    return result;
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
    return payloads[0];
}
// Enhanced payload processing
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

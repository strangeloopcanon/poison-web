"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe('inject', () => {
    const html = '<!DOCTYPE html><html><head></head><body><p>Hello</p><div id="target"></div></body></html>';
    const payload = 'test payload';
    it('should inject a comment into the body by default', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['comment'] });
        expect(poisonedHtml).toContain(`<body><p>Hello</p><div id="target"></div><!-- ${payload} --></body>`);
    });
    it('should inject a comment into a specific element', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['comment'], selector: '#target' });
        expect(poisonedHtml).toContain(`<div id="target"><!-- ${payload} --></div>`);
    });
    it('should inject a hidden span into the body by default', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['css'] });
        expect(poisonedHtml).toContain(`<span style="display:none">${payload}</span>`);
    });
    it('should inject a hidden span into a specific element', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['css'], selector: '#target' });
        expect(poisonedHtml).toContain(`<div id="target"><span style="display:none">${payload}</span></div>`);
    });
    it('should inject a zero-width watermark into the first <p> by default', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['zerowidth'] });
        expect(poisonedHtml).not.toBe(html);
    });
    it('should inject a zero-width watermark into a specific element', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['zerowidth'], selector: '#target' });
        expect(poisonedHtml).not.toBe(html);
    });
    it('should inject a JSON-LD script into the head by default', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['jsonld'] });
        expect(poisonedHtml).toContain('<script type="application/ld+json">');
        expect(poisonedHtml).toContain(`"description":"${payload}"`);
    });
    it('should inject an ARIA label into the body by default', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['aria'] });
        expect(poisonedHtml).toContain(`<span aria-label="${payload}"></span>`);
    });
    it('should inject an ARIA label into a specific element', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['aria'], selector: '#target' });
        expect(poisonedHtml).toContain(`<div id="target"><span aria-label="${payload}"></span></div>`);
    });
    it('should inject multiple techniques', () => {
        const poisonedHtml = (0, index_1.inject)(html, { payload, techniques: ['comment', 'css'] });
        expect(poisonedHtml).toContain(`<!-- ${payload} -->`);
        expect(poisonedHtml).toContain(`<span style="display:none">${payload}</span>`);
    });
    it('should throw an error for an invalid technique', () => {
        expect(() => {
            (0, index_1.inject)(html, { payload, techniques: ['invalid'] });
        }).toThrow('Invalid technique: invalid');
    });
    it('should throw an error for an empty payload', () => {
        expect(() => {
            (0, index_1.inject)(html, { payload: '', techniques: ['comment'] });
        }).toThrow('Payload must be a non-empty string');
    });
    it('should throw an error for empty HTML', () => {
        expect(() => {
            (0, index_1.inject)('', { payload, techniques: ['comment'] });
        }).toThrow('HTML content must be a non-empty string');
    });
});
describe('injectSingle', () => {
    const html = '<!DOCTYPE html><html><head></head><body><p>Hello</p></body></html>';
    const payload = 'test payload';
    it('should inject a single technique', () => {
        const poisonedHtml = (0, index_1.injectSingle)(html, { payload, technique: 'comment' });
        expect(poisonedHtml).toContain(`<!-- ${payload} -->`);
    });
    it('should work with selector', () => {
        const poisonedHtml = (0, index_1.injectSingle)(html, { payload, technique: 'css', selector: 'p' });
        expect(poisonedHtml).toContain(`<p>Hello<span style="display:none">${payload}</span></p>`);
    });
});

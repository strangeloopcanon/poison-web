import { JSDOM } from 'jsdom';
import { embed } from 'zero-width-watermark';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type Technique = 'zerowidth' | 'css' | 'comment' | 'jsonld' | 'aria';

export interface Payload {
  id: string;
  text: string;
  techniques: Technique[];
  weight: number;
  [key: string]: any;
}

export interface InjectOptions {
  payload: string;
  techniques: Technique[];
  selector?: string;
}

function applyComment(dom: JSDOM, payload: string, selector?: string): void {
  const document = dom.window.document;
  const target = selector ? document.querySelector(selector) : document.body;
  if (target) {
    target.appendChild(document.createComment(payload));
  }
}

function applyCss(dom: JSDOM, payload: string, selector?: string): void {
  const document = dom.window.document;
  const target = selector ? document.querySelector(selector) : document.body;
  if (target) {
    const span = document.createElement('span');
    span.style.display = 'none';
    span.textContent = payload;
    target.appendChild(span);
  }
}

function applyZeroWidth(dom: JSDOM, payload: string, selector?: string): void {
  const document = dom.window.document;
  const watermark = embed(payload, ' ');
  const target = selector ? document.querySelector(selector) : document.querySelector('p');
  if (target) {
    target.textContent = (target.textContent || '') + watermark;
  } else if (document.body) {
    const span = document.createElement('span');
    span.style.display = 'none';
    span.textContent = watermark;
    document.body.appendChild(span);
  }
}

function applyJsonLd(dom: JSDOM, payload: string, selector?: string): void {
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

function applyAria(dom: JSDOM, payload: string, selector?: string): void {
  const document = dom.window.document;
  const target = selector ? document.querySelector(selector) : document.body;
  if (target) {
    const span = document.createElement('span');
    span.setAttribute('aria-label', payload);
    target.appendChild(span);
  }
}

export function inject(html: string, options: InjectOptions): string {
  const dom = new JSDOM(html);
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

export function substituteVariables(text: string, variables: Record<string, string> = {}): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

export function addEntropy(text: string, entropy: number = 0): string {
  if (entropy === 0) return text;
  
  const words = text.split(' ');
  const entropyWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
  for (let i = 0; i < Math.floor(text.length * entropy); i++) {
    const randomWord = entropyWords[Math.floor(Math.random() * entropyWords.length)];
    const randomIndex = Math.floor(Math.random() * words.length);
    words.splice(randomIndex, 0, randomWord);
  }
  
  return words.join(' ');
}

export function selectWeightedPayload(payloads: Payload[]): Payload {
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

export function processPayloads(payloads: Payload[], variables: Record<string, string> = {}, entropy: number = 0): Payload {
  const selectedPayload = selectWeightedPayload(payloads);
  
  const mergedVariables = { ...variables, ...selectedPayload };

  const processedText = addEntropy(substituteVariables(selectedPayload.text, mergedVariables), entropy);
  
  return {
    ...selectedPayload,
    text: processedText
  };
}

export function loadPayloads(path: string): Payload[] {
  const file = fs.readFileSync(path, 'utf8');
  return yaml.load(file) as Payload[];
}
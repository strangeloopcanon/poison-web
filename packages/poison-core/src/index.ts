import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { embed } from 'zero-width-watermark';

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

// Helper for single technique injection
export interface SingleInjectOptions {
  payload: string;
  technique: Technique;
  selector?: string;
}

// Dynamic injection interfaces
export interface DynamicInjectOptions {
  payload: string;
  techniques: Technique[];
  selector?: string;
  interval?: number; // Re-injection interval in ms
  observe?: boolean; // Use MutationObserver
}

// Validation functions
function validateTechniques(techniques: Technique[]): void {
  const validTechniques: Technique[] = ['zerowidth', 'css', 'comment', 'jsonld', 'aria'];
  for (const technique of techniques) {
    if (!validTechniques.includes(technique)) {
      throw new Error(`Invalid technique: ${technique}. Valid techniques are: ${validTechniques.join(', ')}`);
    }
  }
}

function validatePayload(payload: string): void {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Payload must be a non-empty string');
  }
}

// Template variable substitution
export function substituteVariables(text: string, variables: Record<string, string> = {}): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

// Add entropy to payload text
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

// Weighted payload selection
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

function applyComment($: cheerio.CheerioAPI, payload: string, selector?: string): void {
  const target = selector ? $(selector) : $('body');
  target.append(`<!-- ${payload} -->`);
}

function applyCss($: cheerio.CheerioAPI, payload: string, selector?: string): void {
  const target = selector ? $(selector) : $('body');
  target.append(`<span style="display:none">${payload}</span>`);
}

function applyZeroWidth($: cheerio.CheerioAPI, payload: string, selector?: string): void {
  const watermark = embed(payload, ' ');
  const target = selector ? $(selector) : $('p').first();
  if (target.length) {
    target.text(target.text() + watermark);
  } else {
    $('body').append(`<span style="display:none">${watermark}</span>`);
  }
}

function applyJsonLd($: cheerio.CheerioAPI, payload: string, selector?: string): void {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "LLM Instruction Patch",
    "description": payload
  };
  const target = selector ? $(selector) : $('head');
  target.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
}

function applyAria($: cheerio.CheerioAPI, payload: string, selector?: string): void {
  const target = selector ? $(selector) : $('body');
  target.append(`<span aria-label="${payload}"></span>`);
}

export function inject(html: string, options: InjectOptions): string {
  // Validate inputs
  validatePayload(options.payload);
  validateTechniques(options.techniques);
  
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
          console.warn(`Technique ${technique} not implemented.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to apply ${technique} technique: ${errorMessage}`);
    }
  }
  return $.html();
}

// Helper function for single technique injection
export function injectSingle(html: string, options: SingleInjectOptions): string {
  return inject(html, {
    payload: options.payload,
    techniques: [options.technique],
    selector: options.selector
  });
}

// Dynamic injection for non-static sites
export function injectDynamic(options: DynamicInjectOptions): void {
  const { payload, techniques, selector, interval = 5000, observe = true } = options;
  
  // Initial injection
  injectCurrentContent();
  
  if (observe) {
    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      injectCurrentContent();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else if (interval > 0) {
    // Periodic re-injection
    setInterval(injectCurrentContent, interval);
  }
  
  function injectCurrentContent() {
    const html = document.documentElement.outerHTML;
    const poisoned = inject(html, {
      payload,
      techniques
    });
    
    // Replace content if changed
    if (poisoned !== html) {
      document.documentElement.innerHTML = poisoned;
    }
  }
}

// For React/Vue/Angular apps
export function injectIntoReactApp(options: DynamicInjectOptions): void {
  // Wait for React to finish rendering
  const waitForReact = () => {
    if (document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForReact, 100);
    }
  };
  
  waitForReact();
}

// For Vue apps
export function injectIntoVueApp(options: DynamicInjectOptions): void {
  const waitForVue = () => {
    if (document.querySelector('#app') || document.querySelector('[data-v-]')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForVue, 100);
    }
  };
  
  waitForVue();
}

// For Angular apps
export function injectIntoAngularApp(options: DynamicInjectOptions): void {
  const waitForAngular = () => {
    if (document.querySelector('[ng-version]') || document.querySelector('app-root')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForAngular, 100);
    }
  };
  
  waitForAngular();
}

export function loadPayloads(path: string): Payload[] {
  try {
    if (!fs.existsSync(path)) {
      throw new Error(`Payloads file not found: ${path}`);
    }
    
    const file = fs.readFileSync(path, 'utf8');
    const payloads = yaml.load(file) as Payload[];
    
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load payloads from ${path}: ${errorMessage}`);
  }
}

// Enhanced payload processing with weighted selection
export function processPayloads(payloads: Payload[], variables: Record<string, string> = {}, entropy: number = 0): Payload {
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

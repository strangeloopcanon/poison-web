#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { inject, loadPayloads, processPayloads, Technique } from 'poison-core';
import { glob } from 'glob';
import { minify } from 'html-minifier-terser';

const program = new Command();

program
  .command('inject <directory>')
  .description('Injects payloads into HTML files in a directory')
  .option('-p, --payloads <path>', 'Path to payloads.yaml', 'payloads.yaml')
  .option('-e, --entropy <level>', 'Entropy level (0-1)', '0')
  .option('-v, --vars <json>', 'JSON string of variables to substitute', '{}')
  .action(async (directory, options) => {
    const payloads = loadPayloads(options.payloads);
    const files = await glob(`${directory}/**/*.html`);
    const variables = JSON.parse(options.vars);
    const entropy = parseFloat(options.entropy);

    for (const file of files) {
      let htmlContent = fs.readFileSync(file, 'utf8');
      const processedPayload = processPayloads(payloads, variables, entropy);

      // Call inject once with all techniques from the processed payload
      htmlContent = inject(htmlContent, {
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
    const payloads = loadPayloads(options.payloads);
    const html = fs.readFileSync(file, 'utf8');
    const payload = payloads[0]; // Using the first payload for auditing

    console.log(`Auditing ${file} with payload: ${payload.id}`);
    console.log('----------------------------------------');

    const results: Record<Technique, boolean> = {
      comment: false,
      css: false,
      zerowidth: false,
      jsonld: false,
      aria: false,
    };

    for (const technique of payload.techniques) {
      const processedPayload = processPayloads([payload], {}, 0); // Use the actual payload, no entropy or variables for audit
      const poisonedHtml = inject(html, { payload: processedPayload.text, techniques: [technique] });
      const minifiedHtml = await minify(poisonedHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      });

      results[technique] = minifiedHtml.includes(processedPayload.text);
    }

    for (const [technique, survived] of Object.entries(results)) {
      if (payload.techniques.includes(technique as Technique)) {
        console.log(`${technique}: ${survived ? '✅ Survived' : '❌ Did not survive'}`);
      }
    }

    console.log('----------------------------------------');
  });

program.parse(process.argv);
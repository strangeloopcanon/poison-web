#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { inject, processPayloads, loadPayloads } from 'eleventy-plugin-poison';

const program = new Command();

program
  .command('inject <directory>')
  .description('Injects payloads into HTML files in a directory')
  .option('-p, --payloads <path>', 'Path to payloads.yaml', 'payloads.yaml')
  .option('-e, --entropy <level>', 'Entropy level (0-1)', '0')
  .option('-v, --vars <json>', 'JSON string of variables to substitute', '{}')
  .action(async (directory, options) => {
    const payloads = loadPayloads(path.resolve(options.payloads));
    const files = await glob(`${directory}/**/*.html`);
    const variables = JSON.parse(options.vars);
    const entropy = parseFloat(options.entropy);

    for (const file of files) {
      let htmlContent = fs.readFileSync(file, 'utf8');
      const processedPayload = processPayloads(payloads, variables, entropy);

      htmlContent = inject(htmlContent, {
        payload: processedPayload.text,
        techniques: processedPayload.techniques,
      });
      
      fs.writeFileSync(file, htmlContent);
      console.log(`Injected payload ${processedPayload.id} into ${file}`);
    }
  });

program.parse(process.argv);
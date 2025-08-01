#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { inject } from 'poison-core';

const program = new Command();

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
    htmlContent = inject(htmlContent, {
      payload: options.payload,
      techniques: options.techniques,
    });
    fs.writeFileSync(options.file, htmlContent);
    console.log(`Injected payload into ${options.file}`);
  });

program.parse(process.argv);
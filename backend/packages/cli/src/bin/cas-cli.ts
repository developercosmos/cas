#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { createCommand } from '../commands/create.js';
import { buildCommand } from '../commands/build.js';
import { serveCommand } from '../commands/serve.js';
import { testCommand } from '../commands/test.js';
import { packageCommand } from '../commands/package.js';
import { validateCommand } from '../commands/validate.js';
import { analyzeCommand } from '../commands/analyze.js';
import { devCommand } from '../commands/dev.js';

const packageJson = {
  name: '@cas/cli',
  version: '1.0.0',
  description: 'CAS Plugin CLI - Comprehensive tooling for plugin development'
};

// Configure CLI
program
  .name('cas-cli')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command');

// Global options
program
  .option('--verbose', 'Enable verbose output', false)
  .option('--no-color', 'Disable colored output', false)
  .option('--config <path>', 'Path to configuration file', 'cas.config.js');

// Add commands
program.addCommand(createCommand);
program.addCommand(buildCommand);
program.addCommand(serveCommand);
program.addCommand(testCommand);
program.addCommand(packageCommand);
program.addCommand(validateCommand);
program.addCommand(analyzeCommand);
program.addCommand(devCommand);

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(str)
});

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (process.argv.includes('--verbose')) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  if (process.argv.includes('--verbose')) {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
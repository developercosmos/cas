import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Packager } from '../core/packager.js';
import { ConfigLoader } from '../utils/config-loader.js';
import { ManifestValidator } from '../utils/manifest-validator.js';
import { IntegrityChecker } from '../utils/integrity-checker.js';

export const packageCommand = new Command('package')
  .description('Package CAS plugin into distributable format')
  .option('-f, --format <format>', 'Package format (zip, tar)', 'zip')
  .option('-o, --output <path>', 'Output path for package')
  .option('--no-sign', 'Skip package signing')
  .option('--no-compress', 'Skip compression')
  .option('--include-dev', 'Include development dependencies')
  .option('--exclude-tests', 'Exclude test files', true)
  .option('--checksum', 'Generate integrity checksum')
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('📦 Packaging CAS Plugin...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const spinner = ora('Validating plugin manifest...').start();

      // Validate plugin manifest
      const manifestValidator = new ManifestValidator();
      const manifestPath = config.paths?.manifest || 'plugin.json';
      const manifestValidation = await manifestValidator.validate(manifestPath);

      if (!manifestValidation.valid) {
        spinner.fail('Plugin manifest validation failed');
        console.error(chalk.red('❌ Manifest errors:'));
        manifestValidation.errors.forEach(error => {
          console.error(chalk.red(`  • ${error.message}`));
        });
        process.exit(1);
      }

      spinner.succeed('Plugin manifest validated');

      // Initialize packager
      const packager = new Packager(config);

      spinner.start('Building plugin...');

      // Build plugin first
      const buildResult = await packager.build();

      if (!buildResult.success) {
        spinner.fail('Build failed');
        console.error(chalk.red('❌ Build errors:'));
        buildResult.errors.forEach(error => {
          console.error(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      spinner.succeed('Build completed');

      spinner.start('Creating package...');

      // Package the plugin
      const packageOptions = {
        format: options.format,
        outputPath: options.output,
        sign: options.sign,
        compress: options.compress,
        includeDev: options.includeDev,
        excludeTests: options.excludeTests,
        generateChecksum: options.checksum
      };

      const packageResult = await packager.package(packageOptions);

      spinner.succeed('Package created');

      // Generate integrity checksum if requested
      if (options.checksum) {
        spinner.start('Generating integrity checksum...');
        const integrityChecker = new IntegrityChecker();
        const checksum = await integrityChecker.generateChecksum(packageResult.outputPath);
        spinner.succeed('Integrity checksum generated');

        console.log(chalk.green('\n🔒 Integrity Information:'));
        console.log(`   Checksum: ${checksum}`);
        console.log(`   Algorithm: SHA-256`);
      }

      // Display package information
      console.log(chalk.green('\n✅ Plugin packaged successfully!'));
      console.log(chalk.cyan('\n📦 Package Information:'));
      console.log(`   Format: ${options.format.toUpperCase()}`);
      console.log(`   Path: ${packageResult.outputPath}`);
      console.log(`   Size: ${formatBytes(packageResult.size)}`);
      console.log(`   Files: ${packageResult.fileCount}`);
      console.log(`   Created: ${new Date().toISOString()}`);

      if (packageResult.manifest) {
        console.log(chalk.cyan('\n📋 Plugin Manifest:'));
        console.log(`   ID: ${packageResult.manifest.id}`);
        console.log(`   Name: ${packageResult.manifest.name}`);
        console.log(`   Version: ${packageResult.manifest.version}`);
        console.log(`   Type: ${config.pluginType}`);
        console.log(`   Dependencies: ${packageResult.manifest.dependencies.length}`);
      }

      // Show installation instructions
      console.log(chalk.cyan('\n🚀 Installation:'));
      console.log(`   cas-cli install ${packageResult.outputPath}`);

      // Show validation for signing
      if (options.sign) {
        console.log(chalk.cyan('\n🔐 Package is signed and ready for distribution.'));
      } else {
        console.log(chalk.yellow('\n⚠️  Package is unsigned. Consider signing for production distribution.'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Packaging failed:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
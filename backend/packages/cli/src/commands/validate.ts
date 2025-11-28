import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PluginValidator } from '../core/plugin-validator.js';
import { ConfigLoader } from '../utils/config-loader.js';
import { ManifestValidator } from '../utils/manifest-validator.js';
import { SecurityValidator } from '../utils/security-validator.js';

export const validateCommand = new Command('validate')
  .description('Validate CAS plugin structure and configuration')
  .option('--strict', 'Enable strict validation mode', false)
  .option('--skip-manifest', 'Skip manifest validation', false)
  .option('--skip-deps', 'Skip dependency validation', false)
  .option('--skip-security', 'Skip security validation', false)
  .option('--check-compatibility', 'Check CAS version compatibility', true)
  .option('--output <format>', 'Output format (table, json, yaml)', 'table')
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('🔍 Validating CAS Plugin...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const spinner = ora('Running validations...').start();

      const results = {
        manifest: null,
        structure: null,
        dependencies: null,
        security: null,
        compatibility: null,
        overall: false
      };

      // Validate manifest
      if (!options.skipManifest) {
        spinner.text = 'Validating plugin manifest...';
        const manifestValidator = new ManifestValidator();
        results.manifest = await manifestValidator.validate(
          config.paths?.manifest || 'plugin.json',
          { strict: options.strict }
        );
      }

      // Validate plugin structure
      spinner.text = 'Validating plugin structure...';
      const pluginValidator = new PluginValidator(config);
      results.structure = await pluginValidator.validateStructure();

      // Validate dependencies
      if (!options.skipDeps) {
        spinner.text = 'Validating dependencies...';
        results.dependencies = await pluginValidator.validateDependencies();
      }

      // Validate security
      if (!options.skipSecurity) {
        spinner.text = 'Running security validation...';
        const securityValidator = new SecurityValidator();
        results.security = await securityValidator.validate();
      }

      // Check compatibility
      if (options.checkCompatibility) {
        spinner.text = 'Checking CAS compatibility...';
        results.compatibility = await pluginValidator.checkCompatibility();
      }

      // Calculate overall result
      results.overall = Object.values(results).every(result =>
        result === null || result.valid === true
      );

      spinner.succeed('Validation completed');

      // Display results
      displayValidationResults(results, options);

      // Exit with appropriate code
      process.exit(results.overall ? 0 : 1);

    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function displayValidationResults(results, options) {
  console.log('\n' + chalk.blueBright('🔍 Validation Results:'));

  // Overall status
  if (results.overall) {
    console.log(chalk.green('\n✅ All validations passed!'));
  } else {
    console.log(chalk.red('\n❌ Some validations failed!'));
  }

  // Display individual validation results
  const validations = [
    {
      name: 'Plugin Manifest',
      result: results.manifest,
      skipped: results.manifest === null
    },
    {
      name: 'Plugin Structure',
      result: results.structure,
      skipped: results.structure === null
    },
    {
      name: 'Dependencies',
      result: results.dependencies,
      skipped: results.dependencies === null
    },
    {
      name: 'Security',
      result: results.security,
      skipped: results.security === null
    },
    {
      name: 'Compatibility',
      result: results.compatibility,
      skipped: results.compatibility === null
    }
  ];

  validations.forEach(validation => {
    if (validation.skipped) {
      console.log(chalk.gray(`\n⏭️  ${validation.name}: Skipped`));
      return;
    }

    const status = validation.result.valid ?
      chalk.green('✅ PASS') :
      chalk.red('❌ FAIL');

    console.log(`\n${status} ${validation.name}`);

    // Show errors
    if (validation.result.errors && validation.result.errors.length > 0) {
      console.log(chalk.red('  Errors:'));
      validation.result.errors.forEach(error => {
        console.log(chalk.red(`    • ${error.message}`));
        if (error.path) {
          console.log(chalk.gray(`      Path: ${error.path}`));
        }
      });
    }

    // Show warnings
    if (validation.result.warnings && validation.result.warnings.length > 0) {
      console.log(chalk.yellow('  Warnings:'));
      validation.result.warnings.forEach(warning => {
        console.log(chalk.yellow(`    • ${warning.message}`));
        if (warning.path) {
          console.log(chalk.gray(`      Path: ${warning.path}`));
        }
      });
    }
  });

  // Additional information
  if (results.manifest?.valid && results.manifest.manifest) {
    const manifest = results.manifest.manifest;
    console.log(chalk.cyan('\n📋 Plugin Information:'));
    console.log(`   ID: ${manifest.id}`);
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Author: ${manifest.author}`);
    console.log(`   Dependencies: ${manifest.dependencies.length}`);
  }

  // JSON/YAML output if requested
  if (options.output !== 'table') {
    console.log(chalk.cyan(`\n📊 ${options.output.toUpperCase()} Output:`));

    if (options.output === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else if (options.output === 'yaml') {
      // Simple YAML-like output (in a real implementation, you'd use a YAML library)
      console.log('validation:');
      console.log(`  overall: ${results.overall}`);
      Object.entries(results).forEach(([key, value]) => {
        if (value !== null) {
          console.log(`  ${key}:`);
          console.log(`    valid: ${value.valid}`);
          if (value.errors && value.errors.length > 0) {
            console.log(`    errors: ${JSON.stringify(value.errors, null, 6)}`);
          }
        }
      });
    }
  }

  // Recommendations
  if (!results.overall) {
    console.log(chalk.cyan('\n💡 Recommendations:'));
    console.log('   • Fix all errors before publishing the plugin');
    console.log('   • Run "cas-cli build" to ensure the plugin builds successfully');
    console.log('   • Run "cas-cli test" to ensure all tests pass');
    console.log('   • Use "cas-cli package --sign" for production distribution');
  }
}
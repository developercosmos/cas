import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { TestRunner } from '../core/test-runner.js';
import { ConfigLoader } from '../utils/config-loader.js';

export const testCommand = new Command('test')
  .description('Run tests for CAS plugin')
  .argument('[pattern]', 'Test file pattern', '**/*.test.{js,ts,jsx,tsx}')
  .option('-w, --watch', 'Run tests in watch mode', false)
  .option('-c, --coverage', 'Generate coverage report', false)
  .option('--coverage-threshold <threshold>', 'Coverage threshold percentage', '80')
  .option('-t, --testNamePattern <pattern>', 'Run tests matching pattern')
  .option('--testPathPattern <pattern>', 'Run tests in files matching pattern')
  .option('--verbose', 'Verbose test output', false)
  .option('--ci', 'Run in CI mode', false)
  .option('--reporter <reporter>', 'Test reporter (default, jest, vitest)', 'default')
  .action(async (pattern, options) => {
    try {
      console.log(chalk.blueBright('🧪 Running CAS Plugin Tests...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const spinner = ora('Initializing test runner...').start();

      const testRunner = new TestRunner(config);

      const testConfig = {
        ...config.test,
        coverage: options.coverage,
        coverageThreshold: {
          statements: parseFloat(options.coverageThreshold),
          branches: parseFloat(options.coverageThreshold),
          functions: parseFloat(options.coverageThreshold),
          lines: parseFloat(options.coverageThreshold)
        },
        watch: options.watch,
        testNamePattern: options.testNamePattern,
        testPathPattern: options.testPathPattern || pattern,
        verbose: options.verbose,
        ci: options.ci,
        reporter: options.reporter
      };

      spinner.succeed('Test runner initialized');

      const testResult = await testRunner.run(testConfig);

      // Display results
      displayTestResults(testResult, options);

      // Exit with appropriate code
      process.exit(testResult.success ? 0 : 1);

    } catch (error) {
      console.error(chalk.red('❌ Test execution failed:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function displayTestResults(result, options) {
  console.log('\n' + chalk.blueBright('📊 Test Results:'));

  if (result.success) {
    console.log(chalk.green(`\n✅ All tests passed!`));

    console.log(chalk.cyan(`\n📈 Statistics:`));
    console.log(`   Tests: ${result.numPassedTests} passed, ${result.numFailedTests} failed, ${result.numPendingTests} pending`);
    console.log(`   Duration: ${result.perfStats?.end || 0}ms`);
    console.log(`   Snapshots: ${result.numPassedSnapshots || 0} total`);

    if (options.coverage && result.coverageMap) {
      console.log(chalk.cyan(`\n📋 Coverage Report:`));
      console.log(`   Statements: ${result.coverageMap.statements?.pct || 0}%`);
      console.log(`   Branches: ${result.coverageMap.branches?.pct || 0}%`);
      console.log(`   Functions: ${result.coverageMap.functions?.pct || 0}%`);
      console.log(`   Lines: ${result.coverageMap.lines?.pct || 0}%`);

      const overallCoverage = Math.min(
        result.coverageMap.statements?.pct || 0,
        result.coverageMap.branches?.pct || 0,
        result.coverageMap.functions?.pct || 0,
        result.coverageMap.lines?.pct || 0
      );

      if (overallCoverage >= parseFloat(options.coverageThreshold)) {
        console.log(chalk.green(`\n✅ Coverage threshold (${options.coverageThreshold}%) met!`));
      } else {
        console.log(chalk.red(`\n❌ Coverage threshold (${options.coverageThreshold}%) not met!`));
      }
    }

  } else {
    console.log(chalk.red(`\n❌ Tests failed!`));

    console.log(chalk.cyan(`\n📈 Statistics:`));
    console.log(`   Tests: ${result.numPassedTests} passed, ${result.numFailedTests} failed, ${result.numPendingTests} pending`);
    console.log(`   Duration: ${result.perfStats?.end || 0}ms`);

    if (result.testResults && result.testResults.length > 0) {
      console.log(chalk.red(`\n🚨 Failed Tests:`));
      result.testResults
        .filter(testResult => testResult.numFailingTests > 0)
        .forEach(testResult => {
          console.log(chalk.red(`   ${testResult.name}`));
          testResult.testResults
            .filter(test => test.status === 'failed')
            .forEach(test => {
              console.log(chalk.red(`     ✖ ${test.title}`));
              if (test.failureMessages && test.failureMessages.length > 0) {
                test.failureMessages.forEach(message => {
                  console.log(chalk.gray(`       ${message}`));
                });
              }
            });
        });
    }
  }

  // Watch mode message
  if (options.watch) {
    console.log(chalk.cyan('\n👀 Watch mode active. Press Ctrl+C to exit.'));
  }
}
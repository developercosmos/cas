import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BuildEngine } from '../core/build-engine.js';
import { ConfigLoader } from '../utils/config-loader.js';
import { BundleAnalyzer } from '../utils/bundle-analyzer.js';
import { BuildResult } from '../types/index.js';

export const buildCommand = new Command('build')
  .description('Build CAS plugin for production')
  .option('-w, --watch', 'Enable watch mode', false)
  .option('-t, --target <target>', 'Build target (esm, cjs, umd)', 'esm')
  .option('-m, --minify', 'Minify output', true)
  .option('-s, --sourcemap', 'Generate source maps', true)
  .option('-a, --analyze', 'Analyze bundle size', false)
  .option('--mode <mode>', 'Build mode (development, production)', 'production')
  .option('--clean', 'Clean output directory before build', true)
  .option('--reporter <type>', 'Build reporter type (console, json)', 'console')
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('🔨 Building CAS Plugin...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const buildEngine = new BuildEngine(config);
      const spinner = ora('Initializing build...').start();

      // Override config with command line options
      const buildConfig = {
        ...config.build,
        output: {
          ...config.build?.output,
          format: options.target,
          sourcemap: options.sourcemap,
          clean: options.clean
        },
        optimization: {
          ...config.build?.optimization,
          minify: options.minify,
          bundleAnalysis: options.analyze
        }
      };

      let buildResult: BuildResult;
      let totalDuration = 0;

      if (options.watch) {
        spinner.text = 'Starting watch mode...';
        spinner.succeed();

        console.log(chalk.green('👀 Watching for changes...'));
        console.log(chalk.gray('Press Ctrl+C to stop'));

        await buildEngine.watch(buildConfig, (result: BuildResult) => {
          handleBuildResult(result, options.reporter);
        });

      } else {
        // Production build
        spinner.text = 'Compiling TypeScript...';
        const startTime = Date.now();

        buildResult = await buildEngine.build(buildConfig, {
          mode: options.mode,
          reporter: options.reporter
        });

        totalDuration = Date.now() - startTime;
        spinner.succeed('Build completed');

        // Handle build result
        handleBuildResult(buildResult, options.reporter, totalDuration);

        // Bundle analysis if requested
        if (options.analyze) {
          const analyzer = new BundleAnalyzer();
          const analysisSpinner = ora('Analyzing bundle...').start();

          try {
            const report = await analyzer.analyze(buildResult.stats);
            analyzer.displayReport(report);
            analysisSpinner.succeed('Bundle analysis completed');
          } catch (error) {
            analysisSpinner.fail('Bundle analysis failed');
            console.warn(chalk.yellow('Warning:'), error.message);
          }
        }

        // Exit with appropriate code
        process.exit(buildResult.success ? 0 : 1);
      }

    } catch (error) {
      console.error(chalk.red('❌ Build failed:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

function handleBuildResult(result: BuildResult, reporter: string, duration?: number) {
  if (result.success) {
    console.log(chalk.green('\n✅ Build successful!'));

    if (duration) {
      console.log(chalk.cyan(`⏱️  Build time: ${duration}ms`));
    }

    console.log(chalk.cyan(`📦 Bundle size: ${formatBytes(result.size)}`));
    console.log(chalk.cyan(`🧩 Chunks: ${result.stats.chunks}`));
    console.log(chalk.cyan(`📚 Modules: ${result.stats.modules}`));

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow('  •'), warning);
      });
    }

    if (reporter === 'json') {
      console.log(chalk.cyan('\n📊 Build Report:'));
      console.log(JSON.stringify(result, null, 2));
    }

  } else {
    console.log(chalk.red('\n❌ Build failed!'));

    if (duration) {
      console.log(chalk.cyan(`⏱️  Build time: ${duration}ms`));
    }

    console.log(chalk.red('\n🚨 Errors:'));
    result.errors.forEach(error => {
      console.log(chalk.red('  •'), error);
    });

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow('  •'), warning);
      });
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
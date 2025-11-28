import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { BundleAnalyzer } from '../utils/bundle-analyzer.js';
import { DependencyAnalyzer } from '../utils/dependency-analyzer.js';
import { PerformanceAnalyzer } from '../utils/performance-analyzer.js';
import { ConfigLoader } from '../utils/config-loader.js';

export const analyzeCommand = new Command('analyze')
  .description('Analyze CAS plugin bundle and dependencies')
  .option('--bundle', 'Analyze bundle composition and size', true)
  .option('--dependencies', 'Analyze dependency graph', true)
  .option('--performance', 'Analyze performance metrics', false)
  .option('--security', 'Analyze security aspects', false)
  .option('--output <format>', 'Output format (console, json, html)', 'console')
  .option('--open', 'Open HTML report in browser', false)
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('📊 Analyzing CAS Plugin...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const results = {
        bundle: null,
        dependencies: null,
        performance: null,
        security: null
      };

      let spinner;

      // Analyze bundle
      if (options.bundle) {
        spinner = ora('Analyzing bundle composition...').start();
        const bundleAnalyzer = new BundleAnalyzer();
        results.bundle = await bundleAnalyzer.analyzeBundle();
        spinner.succeed('Bundle analysis completed');
      }

      // Analyze dependencies
      if (options.dependencies) {
        spinner = ora('Analyzing dependencies...').start();
        const depAnalyzer = new DependencyAnalyzer();
        results.dependencies = await depAnalyzer.analyzeDependencies();
        spinner.succeed('Dependency analysis completed');
      }

      // Analyze performance
      if (options.performance) {
        spinner = ora('Analyzing performance metrics...').start();
        const perfAnalyzer = new PerformanceAnalyzer();
        results.performance = await perfAnalyzer.analyzePerformance();
        spinner.succeed('Performance analysis completed');
      }

      // Analyze security
      if (options.security) {
        spinner = ora('Analyzing security aspects...').start();
        const securityAnalyzer = new DependencyAnalyzer(); // Reuse for security analysis
        results.security = await securityAnalyzer.analyzeSecurity();
        spinner.succeed('Security analysis completed');
      }

      // Display results
      await displayAnalysisResults(results, options);

    } catch (error) {
      console.error(chalk.red('❌ Analysis failed:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

async function displayAnalysisResults(results, options) {
  console.log('\n' + chalk.blueBright('📊 Analysis Results:'));

  // Bundle Analysis
  if (results.bundle) {
    console.log(chalk.cyan('\n📦 Bundle Analysis:'));
    console.log(`   Total Size: ${formatBytes(results.bundle.totalSize)}`);
    console.log(`   Chunks: ${results.bundle.chunks.length}`);
    console.log(`   Modules: ${results.bundle.modules.length}`);
    console.log(`   Assets: ${results.bundle.assets.length}`);

    if (results.bundle.chunks.length > 0) {
      console.log(chalk.cyan('\n   Largest Chunks:'));
      results.bundle.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .forEach((chunk, index) => {
          console.log(`     ${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`);
        });
    }

    if (results.bundle.modules.length > 0) {
      console.log(chalk.cyan('\n   Largest Modules:'));
      results.bundle.modules
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .forEach((module, index) => {
          console.log(`     ${index + 1}. ${module.name}: ${formatBytes(module.size)}`);
        });
    }

    // Bundle optimization suggestions
    if (results.bundle.suggestions && results.bundle.suggestions.length > 0) {
      console.log(chalk.cyan('\n   Optimization Suggestions:'));
      results.bundle.suggestions.forEach(suggestion => {
        console.log(chalk.yellow(`     💡 ${suggestion}`));
      });
    }
  }

  // Dependency Analysis
  if (results.dependencies) {
    console.log(chalk.cyan('\n🔗 Dependency Analysis:'));
    console.log(`   Total Dependencies: ${results.dependencies.total}`);
    console.log(`   Production: ${results.dependencies.production}`);
    console.log(`   Development: ${results.dependencies.development}`);
    console.log(`   Peer: ${results.dependencies.peer}`);

    if (results.dependencies.largest && results.dependencies.largest.length > 0) {
      console.log(chalk.cyan('\n   Largest Dependencies:'));
      results.dependencies.largest.slice(0, 5).forEach((dep, index) => {
        console.log(`     ${index + 1}. ${dep.name}: ${formatBytes(dep.size)}`);
      });
    }

    if (results.dependencies.duplicates && results.dependencies.duplicates.length > 0) {
      console.log(chalk.yellow('\n   Duplicate Dependencies:'));
      results.dependencies.duplicates.forEach(dup => {
        console.log(chalk.yellow(`     ⚠️  ${dup.name}: ${dup.versions.join(', ')}`));
      });
    }

    if (results.dependencies.outdated && results.dependencies.outdated.length > 0) {
      console.log(chalk.yellow('\n   Outdated Dependencies:'));
      results.dependencies.outdated.slice(0, 5).forEach(dep => {
        console.log(chalk.yellow(`     ⚠️  ${dep.name}: ${dep.current} → ${dep.latest}`));
      });
    }
  }

  // Performance Analysis
  if (results.performance) {
    console.log(chalk.cyan('\n⚡ Performance Analysis:'));
    console.log(`   Build Time: ${results.performance.buildTime}ms`);
    console.log(`   Bundle Time: ${results.performance.bundleTime}ms`);
    console.log(`   Hot Reload Time: ${results.performance.hotReloadTime || 'N/A'}ms`);

    if (results.performance.metrics) {
      console.log(chalk.cyan('\n   Performance Metrics:'));
      Object.entries(results.performance.metrics).forEach(([metric, value]) => {
        console.log(`     ${metric}: ${value}`);
      });
    }

    if (results.performance.recommendations && results.performance.recommendations.length > 0) {
      console.log(chalk.cyan('\n   Performance Recommendations:'));
      results.performance.recommendations.forEach(rec => {
        console.log(chalk.yellow(`     💡 ${rec}`));
      });
    }
  }

  // Security Analysis
  if (results.security) {
    console.log(chalk.cyan('\n🔒 Security Analysis:'));
    console.log(`   Vulnerabilities: ${results.security.vulnerabilities.total}`);

    if (results.security.vulnerabilities.critical > 0) {
      console.log(chalk.red(`   Critical: ${results.security.vulnerabilities.critical}`));
    }
    if (results.security.vulnerabilities.high > 0) {
      console.log(chalk.red(`   High: ${results.security.vulnerabilities.high}`));
    }
    if (results.security.vulnerabilities.medium > 0) {
      console.log(chalk.yellow(`   Medium: ${results.security.vulnerabilities.medium}`));
    }
    if (results.security.vulnerabilities.low > 0) {
      console.log(chalk.yellow(`   Low: ${results.security.vulnerabilities.low}`));
    }

    if (results.security.issues && results.security.issues.length > 0) {
      console.log(chalk.cyan('\n   Security Issues:'));
      results.security.issues.forEach(issue => {
        const severity = issue.severity === 'critical' || issue.severity === 'high' ?
          chalk.red(issue.severity.toUpperCase()) :
          chalk.yellow(issue.severity.toUpperCase());
        console.log(chalk.red(`     ${severity} ${issue.package}: ${issue.title}`));
      });
    }
  }

  // Generate reports
  if (options.output === 'json') {
    console.log(chalk.cyan('\n📊 JSON Report:'));
    console.log(JSON.stringify(results, null, 2));
  } else if (options.output === 'html') {
    const bundleAnalyzer = new BundleAnalyzer();
    const htmlPath = await bundleAnalyzer.generateHtmlReport(results);
    console.log(chalk.cyan('\n📄 HTML Report Generated:'));
    console.log(`   Path: ${htmlPath}`);

    if (options.open) {
      const { default: open } = await import('open');
      await open(htmlPath);
      console.log(chalk.green('   Report opened in browser'));
    }
  }

  console.log(chalk.green('\n✅ Analysis completed!'));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
import fs from 'fs-extra';
import path from 'path';
import { BuildConfig, BuildResult, PluginContext, PluginType } from '../types/index.js';
import { TypeScriptCompiler } from '../compilers/typescript-compiler.js';
import { WebpackBundler } from '../bundlers/webpack-bundler.js';
import { RollupBundler } from '../bundlers/rollup-bundler.js';
import { EsbuildBundler } from '../bundlers/esbuild-bundler.js';
import { ViteBundler } from '../bundlers/vite-bundler.js';
import { AssetProcessor } from '../processors/asset-processor.js';
import { Logger } from '../utils/logger.js';

export class BuildEngine {
  private logger: Logger;
  private tsCompiler: TypeScriptCompiler;
  private assetProcessor: AssetProcessor;

  constructor(private config: PluginContext) {
    this.logger = new Logger('BuildEngine');
    this.tsCompiler = new TypeScriptCompiler(config);
    this.assetProcessor = new AssetProcessor(config);
  }

  async build(buildConfig: BuildConfig, options: {
    mode?: 'development' | 'production';
    reporter?: 'console' | 'json';
  } = {}): Promise<BuildResult> {
    const startTime = Date.now();
    const result: BuildResult = {
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
      size: 0,
      stats: {
        chunks: 0,
        modules: 0,
        assets: 0,
        entrypoints: [],
        dependencies: []
      }
    };

    try {
      this.logger.info('Starting build process...');

      // Clean output directory if requested
      if (buildConfig.output.clean) {
        await this.cleanOutput(buildConfig);
      }

      // Compile TypeScript
      this.logger.info('Compiling TypeScript...');
      const tsResult = await this.tsCompiler.compile(buildConfig.typescript || {});
      if (!tsResult.success) {
        result.errors.push(...tsResult.errors);
        return result;
      }
      result.warnings.push(...tsResult.warnings);

      // Bundle based on configuration
      const bundler = this.getBundler(buildConfig.bundler);
      this.logger.info(`Bundling with ${buildConfig.bundler}...`);

      const bundleResult = await bundler.bundle(buildConfig, {
        mode: options.mode || 'production'
      });

      if (!bundleResult.success) {
        result.errors.push(...bundleResult.errors);
        return result;
      }

      result.warnings.push(...bundleResult.warnings);
      result.stats = bundleResult.stats;

      // Process assets
      if (this.config.pluginType !== 'api') {
        this.logger.info('Processing assets...');
        const assetResult = await this.assetProcessor.process(buildConfig);
        if (!assetResult.success) {
          result.errors.push(...assetResult.errors);
          return result;
        }
        result.warnings.push(...assetResult.warnings);
        result.stats.assets += assetResult.assetCount;
      }

      // Calculate total size
      result.size = await this.calculateBuildSize(buildConfig.output);

      // Success
      result.success = true;
      result.duration = Date.now() - startTime;

      this.logger.info(`Build completed successfully in ${result.duration}ms`);

    } catch (error) {
      result.errors.push(`Build failed: ${error.message}`);
      result.duration = Date.now() - startTime;
      this.logger.error(`Build failed: ${error.message}`);
    }

    return result;
  }

  async watch(buildConfig: BuildConfig, callback: (result: BuildResult) => void): Promise<void> {
    this.logger.info('Starting watch mode...');

    const bundler = this.getBundler(buildConfig.bundler);

    // Set up file watchers
    const watchers = [];

    // TypeScript watcher
    const tsWatcher = await this.tsCompiler.watch(buildConfig.typescript || {}, (result) => {
      if (!result.success) {
        callback({
          success: false,
          errors: result.errors,
          warnings: result.warnings,
          duration: 0,
          size: 0,
          stats: { chunks: 0, modules: 0, assets: 0, entrypoints: [], dependencies: [] }
        });
      }
    });
    watchers.push(tsWatcher);

    // Bundle watcher
    const bundleWatcher = await bundler.watch(buildConfig, callback);
    watchers.push(bundleWatcher);

    // Asset watcher (for UI plugins)
    if (this.config.pluginType !== 'api') {
      const assetWatcher = await this.assetProcessor.watch(buildConfig, callback);
      watchers.push(assetWatcher);
    }

    // Handle process termination
    const cleanup = () => {
      this.logger.info('Stopping watch mode...');
      watchers.forEach(watcher => watcher.close());
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  private getBundler(type: BuildConfig['bundler']) {
    switch (type) {
      case 'webpack':
        return new WebpackBundler(this.config);
      case 'rollup':
        return new RollupBundler(this.config);
      case 'esbuild':
        return new EsbuildBundler(this.config);
      case 'vite':
        return new ViteBundler(this.config);
      default:
        throw new Error(`Unsupported bundler: ${type}`);
    }
  }

  private async cleanOutput(buildConfig: BuildConfig): Promise<void> {
    const outputDir = path.resolve(this.config.rootPath, buildConfig.output.outDir || 'dist');
    if (await fs.pathExists(outputDir)) {
      await fs.remove(outputDir);
      this.logger.info(`Cleaned output directory: ${outputDir}`);
    }
  }

  private async calculateBuildSize(outputConfig: BuildConfig['output']): Promise<number> {
    const outputDir = path.resolve(this.config.rootPath, outputConfig.outDir || 'dist');
    let totalSize = 0;

    if (await fs.pathExists(outputDir)) {
      const files = await this.getAllFiles(outputDir);
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
    }

    return totalSize;
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
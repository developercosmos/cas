import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';
import { PluginContext, PackageConfig } from '../types/index.js';
import { BuildEngine } from './build-engine.js';
import { Logger } from '../utils/logger.js';

export interface PackageOptions {
  format: 'zip' | 'tar';
  outputPath?: string;
  sign?: boolean;
  compress?: boolean;
  includeDev?: boolean;
  excludeTests?: boolean;
  generateChecksum?: boolean;
}

export interface PackageResult {
  success: boolean;
  outputPath: string;
  size: number;
  fileCount: number;
  manifest?: any;
  checksum?: string;
  errors: string[];
  warnings: string[];
}

export class Packager {
  private logger: Logger;
  private buildEngine: BuildEngine;

  constructor(private config: PluginContext) {
    this.logger = new Logger('Packager');
    this.buildEngine = new BuildEngine(config);
  }

  async build(): Promise<{ success: boolean; errors: string[] }> {
    try {
      this.logger.info('Building plugin for packaging...');

      const buildConfig = {
        targets: this.config.build?.targets || [],
        bundler: this.config.build?.bundler || 'webpack',
        optimization: {
          minify: true,
          treeshake: true,
          codeSplitting: false, // Single bundle for packaging
          bundleAnalysis: false,
          compression: true
        },
        output: {
          format: 'esm',
          preserveModules: false,
          sourcemap: false, // No sourcemaps in production package
          clean: true
        },
        typescript: this.config.build?.typescript,
        css: this.config.build?.css
      };

      const buildResult = await this.buildEngine.build(buildConfig);

      return {
        success: buildResult.success,
        errors: buildResult.errors
      };
    } catch (error) {
      this.logger.error(`Build failed: ${error.message}`);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  async package(options: PackageOptions): Promise<PackageResult> {
    const result: PackageResult = {
      success: false,
      outputPath: '',
      size: 0,
      fileCount: 0,
      errors: [],
      warnings: []
    };

    try {
      this.logger.info('Creating plugin package...');

      // Determine output path
      const outputPath = options.outputPath || this.getDefaultOutputPath(options.format);
      result.outputPath = outputPath;

      // Create package
      if (options.format === 'zip') {
        await this.createZipPackage(outputPath, options, result);
      } else {
        await this.createTarPackage(outputPath, options, result);
      }

      // Get package size
      const stats = await fs.stat(outputPath);
      result.size = stats.size;

      // Sign package if requested
      if (options.sign) {
        await this.signPackage(outputPath, result);
      }

      // Generate checksum if requested
      if (options.generateChecksum) {
        result.checksum = await this.generateChecksum(outputPath);
      }

      result.success = true;
      this.logger.info(`Package created successfully: ${outputPath}`);

    } catch (error) {
      result.errors.push(`Packaging failed: ${error.message}`);
      this.logger.error(`Packaging failed: ${error.message}`);
    }

    return result;
  }

  private async createZipPackage(
    outputPath: string,
    options: PackageOptions,
    result: PackageResult
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: options.compress ? 9 : 0 }
      });

      output.on('close', async () => {
        result.fileCount = archive.pointer();
        resolve();
      });

      archive.on('error', (error) => {
        reject(error);
      });

      archive.pipe(output);

      // Add built files
      const distPath = path.join(this.config.rootPath, 'dist');
      if (await fs.pathExists(distPath)) {
        archive.directory(distPath, false);
      }

      // Add manifest
      const manifestPath = path.join(this.config.rootPath, 'plugin.json');
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        result.manifest = manifest;
        archive.file(manifestPath, { name: 'plugin.json' });
      }

      // Add README if exists
      const readmePath = path.join(this.config.rootPath, 'README.md');
      if (await fs.pathExists(readmePath)) {
        archive.file(readmePath, { name: 'README.md' });
      }

      // Add license if exists
      const licensePath = path.join(this.config.rootPath, 'LICENSE');
      if (await fs.pathExists(licensePath)) {
        archive.file(licensePath, { name: 'LICENSE' });
      }

      // Add package.json if it exists
      const packagePath = path.join(this.config.rootPath, 'package.json');
      if (await fs.pathExists(packagePath) && !options.includeDev) {
        // Create a production-only package.json
        const packageJson = await fs.readJson(packagePath);
        const productionPackage = {
          ...packageJson,
          devDependencies: undefined,
          scripts: undefined
        };
        archive.append(JSON.stringify(productionPackage, null, 2), { name: 'package.json' });
      }

      // Add assets if they exist and aren't already in dist
      const assetsPath = path.join(this.config.rootPath, 'assets');
      if (await fs.pathExists(assetsPath)) {
        archive.directory(assetsPath, 'assets');
      }

      archive.finalize();
    });
  }

  private async createTarPackage(
    outputPath: string,
    options: PackageOptions,
    result: PackageResult
  ): Promise<void> {
    // For tar packaging, we'd use tar or similar
    // For simplicity, we'll implement a basic tar creation
    this.logger.warn('Tar packaging not fully implemented yet');

    // Fall back to zip for now
    await this.createZipPackage(
      outputPath.replace(/\.tar(\.gz)?$/, '.zip'),
      options,
      result
    );
  }

  private getDefaultOutputPath(format: string): string {
    const manifest = this.config.manifest;
    const name = manifest.id || 'cas-plugin';
    const version = manifest.version || '1.0.0';
    return path.join(this.config.rootPath, `${name}-${version}.${format}`);
  }

  private async signPackage(outputPath: string, result: PackageResult): Promise<void> {
    try {
      // This is a placeholder for package signing
      // In a real implementation, you would use proper signing mechanisms
      const privateKey = process.env.CAS_PRIVATE_KEY;
      if (!privateKey) {
        result.warnings.push('No private key found for signing');
        return;
      }

      const fileContent = await fs.readFile(outputPath);
      const signature = crypto.sign('RSA-SHA256', fileContent, privateKey);

      const signaturePath = outputPath.replace(/\.(zip|tar)/, '.signature');
      await fs.writeFile(signaturePath, signature);

      result.warnings.push('Package signed with RSA-SHA256');
    } catch (error) {
      result.warnings.push(`Package signing failed: ${error.message}`);
    }
  }

  private async generateChecksum(outputPath: string): Promise<string> {
    const fileContent = await fs.readFile(outputPath);
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  }
}
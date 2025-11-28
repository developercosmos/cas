import fs from 'fs-extra';
import path from 'path';
import { CasConfig, PluginContext, PluginManifest } from '../types/index.js';
import { Logger } from './logger.js';

export class ConfigLoader {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ConfigLoader');
  }

  async load(rootPath: string): Promise<PluginContext> {
    try {
      this.logger.info(`Loading configuration from ${rootPath}`);

      // Load plugin manifest
      const manifest = await this.loadManifest(rootPath);

      // Load CAS configuration
      const casConfig = await this.loadCasConfig(rootPath);

      // Load package.json for additional metadata
      const packageJson = await this.loadPackageJson(rootPath);

      // Create plugin context
      const context: PluginContext = {
        rootPath,
        configPath: path.join(rootPath, 'cas.config.js'),
        manifest,
        config: casConfig,
        environment: 'development' // Default to development
      };

      this.logger.info(`Configuration loaded successfully for plugin: ${manifest.id}`);
      return context;

    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  private async loadManifest(rootPath: string): Promise<PluginManifest> {
    const manifestPath = path.join(rootPath, 'plugin.json');

    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Plugin manifest not found at ${manifestPath}`);
    }

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Validate required fields
      this.validateManifest(manifest);

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load plugin manifest: ${error.message}`);
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'entry', 'dependencies'];
    const missingFields = requiredFields.filter(field => !manifest[field as keyof PluginManifest]);

    if (missingFields.length > 0) {
      throw new Error(`Plugin manifest is missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Plugin ID must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate version format (basic semver)
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Plugin version must follow semantic versioning (x.y.z)');
    }
  }

  private async loadCasConfig(rootPath: string): Promise<CasConfig> {
    const configPath = path.join(rootPath, 'cas.config.js');

    if (!await fs.pathExists(configPath)) {
      // Return default configuration
      return this.getDefaultConfig(rootPath);
    }

    try {
      // Clear require cache to allow for config changes
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      return config;
    } catch (error) {
      this.logger.warn(`Failed to load cas.config.js, using defaults: ${error.message}`);
      return this.getDefaultConfig(rootPath);
    }
  }

  private async loadPackageJson(rootPath: string): Promise<any> {
    const packagePath = path.join(rootPath, 'package.json');

    if (!await fs.pathExists(packagePath)) {
      return {};
    }

    try {
      return await fs.readJson(packagePath);
    } catch (error) {
      this.logger.warn(`Failed to load package.json: ${error.message}`);
      return {};
    }
  }

  private getDefaultConfig(rootPath: string): CasConfig {
    // Try to detect plugin type from package.json or structure
    const pluginType = this.detectPluginType(rootPath);

    return {
      pluginType,
      build: {
        targets: pluginType === 'api' ? [{ environment: 'node' }] : [{ environment: 'browser' }],
        bundler: pluginType === 'ui' ? 'vite' : 'webpack',
        optimization: {
          minify: true,
          treeshake: true,
          codeSplitting: pluginType !== 'library',
          bundleAnalysis: false,
          compression: true
        },
        output: {
          format: pluginType === 'library' ? 'esm' : 'esm',
          preserveModules: pluginType === 'library',
          sourcemap: true,
          clean: true
        },
        typescript: {
          strict: true,
          declaration: pluginType === 'library',
          target: 'ES2020',
          module: 'ESNext',
          lib: pluginType === 'api' ? ['ES2020'] : ['ES2020', 'DOM', 'DOM.Iterable']
        },
        css: pluginType === 'ui' || pluginType === 'fullstack' ? {
          preprocessors: ['less'],
          modules: true,
          postcss: true,
          autoprefixer: true
        } : undefined
      },
      serve: {
        port: 3000,
        host: 'localhost',
        hot: true,
        open: true,
        proxy: pluginType === 'fullstack' ? [{
          context: ['/api'],
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }] : undefined
      },
      test: {
        framework: 'jest',
        coverage: true,
        coverageThreshold: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        },
        testMatch: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
        setupFiles: []
      },
      package: {
        include: ['dist', 'plugin.json', 'README.md'],
        exclude: ['src', 'node_modules', '**/*.test.*', '**/*.spec.*'],
        signature: false,
        compression: true,
        format: 'zip'
      },
      paths: {
        src: path.join(rootPath, 'src'),
        dist: path.join(rootPath, 'dist'),
        tests: path.join(rootPath, 'tests'),
        assets: path.join(rootPath, 'assets'),
        public: path.join(rootPath, 'public')
      }
    };
  }

  private detectPluginType(rootPath: string): 'ui' | 'api' | 'fullstack' | 'library' {
    // Check for UI indicators
    const uiIndicators = [
      'src/index.tsx',
      'src/components',
      'src/App.tsx',
      'package.json',
      'tsconfig.json'
    ];

    // Check for API indicators
    const apiIndicators = [
      'src/server.ts',
      'src/index.ts',
      'src/routes',
      'src/middleware'
    ];

    // Check for library indicators
    const libraryIndicators = [
      'src/index.ts',
      'package.json'
    ];

    // Simple heuristic based on file structure
    if (fs.existsSync(path.join(rootPath, 'src/index.tsx')) ||
        fs.existsSync(path.join(rootPath, 'src/components'))) {
      // Check if it's fullstack (both UI and API components)
      if (fs.existsSync(path.join(rootPath, 'src/server.ts')) ||
          fs.existsSync(path.join(rootPath, 'src/api'))) {
        return 'fullstack';
      }
      return 'ui';
    }

    if (fs.existsSync(path.join(rootPath, 'src/server.ts')) ||
        fs.existsSync(path.join(rootPath, 'src/routes'))) {
      return 'api';
    }

    // Default to library
    return 'library';
  }

  async createDefaultConfig(rootPath: string): Promise<void> {
    const configPath = path.join(rootPath, 'cas.config.js');

    if (await fs.pathExists(configPath)) {
      this.logger.warn('cas.config.js already exists, skipping creation');
      return;
    }

    const pluginType = this.detectPluginType(rootPath);
    const defaultConfig = this.getDefaultConfig(rootPath);

    const configContent = `// CAS Plugin Configuration
// This file configures the build process for your plugin

export default ${JSON.stringify(defaultConfig, null, 2)};
`;

    await fs.writeFile(configPath, configContent);
    this.logger.info(`Created default cas.config.js for ${pluginType} plugin`);
  }
}
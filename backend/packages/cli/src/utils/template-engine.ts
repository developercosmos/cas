import fs from 'fs-extra';
import path from 'path';
import { TemplateConfig, PluginContext } from '../types/index.js';
import { Logger } from './logger.js';

export class TemplateEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TemplateEngine');
  }

  async create(
    template: { name: string; path: string; type: string },
    targetPath: string,
    config: any
  ): Promise<void> {
    try {
      this.logger.info(`Creating plugin from template: ${template.name}`);

      // Ensure target directory exists
      await fs.ensureDir(targetPath);

      // Copy template files
      if (await fs.pathExists(template.path)) {
        await this.copyTemplate(template.path, targetPath, config);
      } else {
        // Use built-in template
        await this.createBuiltinTemplate(template.type, targetPath, config);
      }

      // Process template variables
      await this.processTemplateFiles(targetPath, config);

      // Generate additional files
      await this.generateAdditionalFiles(targetPath, config);

      this.logger.success(`Plugin created successfully at ${targetPath}`);

    } catch (error) {
      this.logger.error(`Failed to create plugin: ${error.message}`);
      throw error;
    }
  }

  private async copyTemplate(templatePath: string, targetPath: string, config: any): Promise<void> {
    await fs.copy(templatePath, targetPath, {
      filter: (src) => {
        // Skip node_modules and other unwanted files
        const relativePath = path.relative(templatePath, src);
        return !relativePath.includes('node_modules') &&
               !relativePath.includes('.git') &&
               !relativePath.startsWith('.');
      }
    });
  }

  private async createBuiltinTemplate(type: string, targetPath: string, config: any): Promise<void> {
    const templateContent = this.getBuiltinTemplateContent(type, config);

    for (const file of templateContent) {
      const filePath = path.join(targetPath, file.path);
      const dirPath = path.dirname(filePath);

      await fs.ensureDir(dirPath);
      await fs.writeFile(filePath, this.processTemplateString(file.content, config));
    }
  }

  private async processTemplateFiles(targetPath: string, config: any): Promise<void> {
    const files = await this.getAllFiles(targetPath);

    for (const file of files) {
      if (this.isTemplateFile(file)) {
        const content = await fs.readFile(file, 'utf-8');
        const processedContent = this.processTemplateString(content, config);
        await fs.writeFile(file, processedContent);
      }
    }
  }

  private async generateAdditionalFiles(targetPath: string, config: any): Promise<void> {
    // Generate package.json
    const packageJson = this.generatePackageJson(config);
    await fs.writeJson(
      path.join(targetPath, 'package.json'),
      packageJson,
      { spaces: 2 }
    );

    // Generate plugin.json manifest
    const manifest = this.generateManifest(config);
    await fs.writeJson(
      path.join(targetPath, 'plugin.json'),
      manifest,
      { spaces: 2 }
    );

    // Generate tsconfig.json
    const tsconfig = this.generateTsconfig(config);
    await fs.writeJson(
      path.join(targetPath, 'tsconfig.json'),
      tsconfig,
      { spaces: 2 }
    );

    // Generate cas.config.js
    const casConfig = this.generateCasConfig(config);
    await fs.writeFile(
      path.join(targetPath, 'cas.config.js'),
      casConfig
    );

    // Generate .gitignore
    const gitignore = this.generateGitignore();
    await fs.writeFile(
      path.join(targetPath, '.gitignore'),
      gitignore
    );

    // Generate README.md
    const readme = this.generateReadme(config);
    await fs.writeFile(
      path.join(targetPath, 'README.md'),
      readme
    );
  }

  private processTemplateString(content: string, config: any): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return config[key] || match;
    });
  }

  private isTemplateFile(filePath: string): boolean {
    return filePath.endsWith('.template') ||
           filePath.includes('.template.') ||
           ['package.json', 'plugin.json', 'tsconfig.json', 'README.md'].includes(path.basename(filePath));
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

  private getBuiltinTemplateContent(type: string, config: any) {
    const baseFiles = [];

    switch (type) {
      case 'ui':
        return [
          ...baseFiles,
          {
            path: 'src/index.tsx',
            content: this.getUIIndexTemplate(),
            type: 'source'
          },
          {
            path: 'src/components/PluginComponent.tsx',
            content: this.getUIComponentTemplate(),
            type: 'source'
          },
          {
            path: 'src/styles/plugin.module.css',
            content: this.getUIStylesTemplate(),
            type: 'asset'
          },
          {
            path: 'src/types/index.ts',
            content: this.getUITypesTemplate(),
            type: 'source'
          }
        ];

      case 'api':
        return [
          ...baseFiles,
          {
            path: 'src/index.ts',
            content: this.getAPIIndexTemplate(),
            type: 'source'
          },
          {
            path: 'src/routes/index.ts',
            content: this.getAPIRoutesTemplate(),
            type: 'source'
          },
          {
            path: 'src/services/PluginService.ts',
            content: this.getAPIServiceTemplate(),
            type: 'source'
          },
          {
            path: 'src/types/index.ts',
            content: this.getAPITypesTemplate(),
            type: 'source'
          }
        ];

      case 'fullstack':
        return [
          ...baseFiles,
          {
            path: 'src/client/index.tsx',
            content: this.getFullstackClientTemplate(),
            type: 'source'
          },
          {
            path: 'src/server/index.ts',
            content: this.getFullstackServerTemplate(),
            type: 'source'
          },
          {
            path: 'src/shared/types.ts',
            content: this.getFullstackTypesTemplate(),
            type: 'source'
          },
          {
            path: 'src/components/PluginComponent.tsx',
            content: this.getUIComponentTemplate(),
            type: 'source'
          },
          {
            path: 'src/routes/index.ts',
            content: this.getAPIRoutesTemplate(),
            type: 'source'
          }
        ];

      case 'library':
        return [
          ...baseFiles,
          {
            path: 'src/index.ts',
            content: this.getLibraryIndexTemplate(),
            type: 'source'
          },
          {
            path: 'src/components/Component.tsx',
            content: this.getLibraryComponentTemplate(),
            type: 'source'
          },
          {
            path: 'src/types/index.ts',
            content: this.getLibraryTypesTemplate(),
            type: 'source'
          }
        ];

      default:
        return baseFiles;
    }
  }

  private generatePackageJson(config: any) {
    const basePackage = {
      name: config.id,
      version: config.version,
      description: config.description,
      author: config.author,
      license: config.license || 'MIT',
      keywords: ['cas', 'plugin', config.type],
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      files: ['dist', 'plugin.json', 'README.md'],
      scripts: {
        dev: 'cas-cli dev',
        build: 'cas-cli build',
        test: 'cas-cli test',
        package: 'cas-cli package',
        validate: 'cas-cli validate',
        'type-check': 'tsc --noEmit',
        clean: 'rm -rf dist'
      }
    };

    // Add dependencies based on type
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {
      '@cas/cli': '^1.0.0',
      'typescript': '^5.0.0'
    };

    switch (config.type) {
      case 'ui':
      case 'fullstack':
        Object.assign(dependencies, {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@cas/ui-components': '^1.0.0',
          '@cas/types': '^1.0.0'
        });
        Object.assign(devDependencies, {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        });
        break;
      case 'api':
        Object.assign(dependencies, {
          '@cas/core-api': '^1.0.0',
          '@cas/types': '^1.0.0'
        });
        break;
      case 'library':
        Object.assign(dependencies, {
          '@cas/types': '^1.0.0'
        });
        Object.assign(devDependencies, {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        });
        break;
    }

    // Add testing dependencies if requested
    if (config.testing) {
      Object.assign(devDependencies, {
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0',
        '@testing-library/react': '^13.0.0',
        '@testing-library/jest-dom': '^6.0.0'
      });
    }

    basePackage.dependencies = dependencies;
    basePackage.devDependencies = devDependencies;

    return basePackage;
  }

  private generateManifest(config: any) {
    return {
      id: config.id,
      name: config.name,
      version: config.version,
      description: config.description,
      author: config.author,
      entry: 'dist/index.js',
      dependencies: [
        { name: '@cas/types', version: '^1.0.0', type: 'core' }
      ],
      permissions: this.getDefaultPermissions(config.type),
      casVersion: '>=1.0.0',
      metadata: {
        category: this.getCategoryFromType(config.type),
        tags: [config.type, 'cas-plugin'],
        repository: config.repository,
        homepage: config.homepage,
        license: config.license || 'MIT'
      },
      compatibility: {
        minCasVersion: '1.0.0',
        maxCasVersion: null
      }
    };
  }

  private generateTsconfig(config: any) {
    const baseConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: config.type === 'api' ? ['ES2020'] : ['ES2020', 'DOM', 'DOM.Iterable'],
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: config.type === 'library',
        declarationMap: config.type === 'library',
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        jsx: config.type !== 'api' ? 'react-jsx' : undefined,
        types: ['@cas/types']
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.*', '**/*.spec.*']
    };

    if (config.type === 'library') {
      baseConfig.include.push('tests/**/*');
    }

    return baseConfig;
  }

  private generateCasConfig(config: any) {
    return `// CAS Plugin Configuration
export default {
  pluginType: '${config.type}',
  build: {
    targets: [${config.type === 'api' ? "{ environment: 'node' }" : "{ environment: 'browser' }"}],
    bundler: ${this.getDefaultBundler(config.type)},
    optimization: {
      minify: true,
      treeshake: true,
      codeSplitting: ${config.type !== 'library'},
      bundleAnalysis: false,
      compression: true
    },
    output: {
      format: '${config.type === 'library' ? 'esm' : 'esm'}',
      preserveModules: ${config.type === 'library'},
      sourcemap: true,
      clean: true
    }
  },
  serve: {
    port: 3000,
    host: 'localhost',
    hot: true,
    open: true
  },
  test: {
    framework: 'jest',
    coverage: true,
    coverageThreshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  package: {
    include: ['dist', 'plugin.json', 'README.md'],
    exclude: ['src', 'node_modules', '**/*.test.*'],
    signature: false,
    compression: true,
    format: 'zip'
  }
};`;
  }

  private generateGitignore() {
    return `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Plugin packages
plugin.zip
plugin.tar.gz
*.signature

# Test outputs
test-results.json
junit.xml
`;
  }

  private generateReadme(config: any) {
    return `# ${config.name}

${config.description}

## CAS Plugin

This is a CAS plugin built with the ${config.type} template.

## Installation

\`\`\`bash
cas-cli install ${config.id}.zip
\`\`\`

## Development

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Getting Started

\`\`\`bash
# Install dependencies
${config.packageManager} install

# Start development server
${config.packageManager} run dev

# Build for production
${config.packageManager} run build

# Run tests
${config.packageManager} run test

# Package for distribution
${config.packageManager} run package
\`\`\`

## Project Structure

\`\`\`
├── src/
│   ├── index.ts${config.type !== 'api' ? 'x' : ''}    # Main entry point
│   ├── components/          # React components (UI plugins)
│   ├── services/           # Business logic
│   └── types/              # TypeScript definitions
├── tests/                  # Test files
├── assets/                 # Static assets
├── package.json
├── plugin.json            # Plugin manifest
├── tsconfig.json
└── README.md
\`\`\`

## Usage

Once installed, this plugin can be used within the CAS platform.

## License

${config.license || 'MIT'}

## Author

${config.author}
`;
  }

  // Template content methods
  private getUIIndexTemplate() {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { PluginComponent } from './components/PluginComponent';
import './styles/plugin.module.css';

// Plugin entry point
export function initialize(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<PluginComponent />);
}

export { PluginComponent };
`;
  }

  private getUIComponentTemplate() {
    return `import React from 'react';
import styles from './PluginComponent.module.css';

export const PluginComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>CAS Plugin Component</h1>
      <p>Your plugin is working correctly!</p>
    </div>
  );
};
`;
  }

  private getUIStylesTemplate() {
    return `.container {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 10px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
}

p {
  color: #666;
  line-height: 1.5;
}
`;
  }

  private getUITypesTemplate() {
    return `export interface PluginConfig {
  name: string;
  enabled: boolean;
}

export interface PluginState {
  initialized: boolean;
  config: PluginConfig;
}
`;
  }

  private getAPIIndexTemplate() {
    return `import { initializeRoutes } from './routes';
import { PluginService } from './services/PluginService';

// Plugin service instance
export const pluginService = new PluginService();

// Initialize plugin
export async function initialize() {
  await pluginService.initialize();
  initializeRoutes();
}

export { pluginService };
`;
  }

  private getAPIRoutesTemplate() {
    return `import { Router } from 'express';
import { pluginService } from '../index';

export function initializeRoutes(router: Router = Router()) {
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', plugin: '{{name}}' });
  });

  router.get('/config', (req, res) => {
    res.json(pluginService.getConfig());
  });

  return router;
}
`;
  }

  private getAPIServiceTemplate() {
    return `export class PluginService {
  private initialized = false;
  private config = {};

  async initialize(): Promise<void> {
    // Initialize your plugin here
    this.initialized = true;
    console.log('Plugin initialized');
  }

  getConfig() {
    return {
      initialized: this.initialized,
      config: this.config
    };
  }
}
`;
  }

  private getAPITypesTemplate() {
    return `export interface PluginConfig {
  [key: string]: any;
}

export interface HealthResponse {
  status: string;
  plugin: string;
}
`;
  }

  private getFullstackClientTemplate() {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { PluginComponent } from '../components/PluginComponent';
import '../styles/plugin.module.css';

export function initialize(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<PluginComponent />);
}
`;
  }

  private getFullstackServerTemplate() {
    return `import express from 'express';
import { initializeRoutes } from './routes';

const app = express();

app.use(express.json());

// Initialize plugin routes
initializeRoutes(app);

export { app };
`;
  }

  private getFullstackTypesTemplate() {
    return `export interface SharedConfig {
  apiEndpoint: string;
  features: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
`;
  }

  private getLibraryIndexTemplate() {
    return `export { Component } from './components/Component';
export type { ComponentProps } from './components/Component';

// Re-export any additional utilities or types
export * from './types';
`;
  }

  private getLibraryComponentTemplate() {
    return `import React from 'react';

export interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
`;
  }

  private getLibraryTypesTemplate() {
    return `export interface LibraryConfig {
  debug?: boolean;
  theme?: 'light' | 'dark';
}

export interface BaseComponentProps {
  id?: string;
  testId?: string;
}
`;
  }

  private getDefaultPermissions(type: string): string[] {
    const basePermissions = ['storage.read'];

    switch (type) {
      case 'ui':
        return [...basePermissions, 'dom.access', 'events.listen'];
      case 'api':
        return [...basePermissions, 'storage.write', 'api.request', 'events.emit'];
      case 'fullstack':
        return [...basePermissions, 'storage.write', 'api.request', 'dom.access', 'events.emit', 'events.listen'];
      case 'library':
        return basePermissions;
      default:
        return basePermissions;
    }
  }

  private getCategoryFromType(type: string): string {
    switch (type) {
      case 'ui': return 'ui';
      case 'api': return 'api';
      case 'fullstack': return 'fullstack';
      case 'library': return 'library';
      default: return 'utility';
    }
  }

  private getDefaultBundler(type: string): string {
    switch (type) {
      case 'ui': return 'vite';
      case 'api': return 'webpack';
      case 'fullstack': return 'webpack';
      case 'library': return 'rollup';
      default: return 'webpack';
    }
  }
}
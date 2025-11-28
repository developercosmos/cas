// Main entry point for the @cas/cli package
export { ConfigLoader } from './utils/config-loader.js';
export { Logger } from './utils/logger.js';
export { TemplateEngine } from './utils/template-engine.js';
export { BuildEngine } from './core/build-engine.js';
export { DevServer } from './core/dev-server.js';
export { TestRunner } from './core/test-runner.js';
export { Packager } from './core/packager.js';

// Export types for external use
export type {
  CasConfig,
  BuildConfig,
  ServeConfig,
  TestConfig,
  PackageConfig,
  PluginManifest,
  PluginContext,
  BuildResult,
  ValidationResult,
  TemplateConfig
} from './types/index.js';

// Re-export bundlers
export { WebpackBundler } from './bundlers/webpack-bundler.js';

// CLI version
export const version = '1.0.0';

// Default configuration factory
export function createDefaultConfig(pluginType: 'ui' | 'api' | 'fullstack' | 'library'): CasConfig {
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
        format: 'esm',
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
      },
      testMatch: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
      setupFiles: []
    },
    package: {
      include: ['dist', 'plugin.json', 'README.md'],
      exclude: ['src', 'node_modules', '**/*.test.*'],
      signature: false,
      compression: true,
      format: 'zip'
    }
  };
}
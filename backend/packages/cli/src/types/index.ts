export interface CasConfig {
  // Build configuration
  build?: BuildConfig;

  // Development server configuration
  serve?: ServeConfig;

  // Testing configuration
  test?: TestConfig;

  // Packaging configuration
  package?: PackageConfig;

  // Plugin type
  pluginType: PluginType;

  // Paths
  paths?: PathConfig;
}

export interface BuildConfig {
  // Target environments
  targets: Target[];

  // Bundler configuration
  bundler: 'webpack' | 'rollup' | 'esbuild' | 'vite';

  // Optimization settings
  optimization: OptimizationConfig;

  // Output configuration
  output: OutputConfig;

  // TypeScript configuration
  typescript?: TypeScriptConfig;

  // CSS processing
  css?: CssConfig;
}

export interface ServeConfig {
  port: number;
  host: string;
  hot: boolean;
  open: boolean;
  proxy?: ProxyConfig[];
}

export interface TestConfig {
  framework: 'jest' | 'vitest' | 'mocha';
  coverage: boolean;
  coverageThreshold: CoverageThreshold;
  testMatch: string[];
  setupFiles: string[];
}

export interface PackageConfig {
  include: string[];
  exclude: string[];
  signature: boolean;
  compression: boolean;
  format: 'zip' | 'tar';
}

export interface PathConfig {
  src: string;
  dist: string;
  tests: string;
  assets: string;
  public: string;
}

export interface Target {
  environment: 'node' | 'browser';
  version?: string;
  platform?: string;
}

export interface OptimizationConfig {
  minify: boolean;
  treeshake: boolean;
  codeSplitting: boolean;
  bundleAnalysis: boolean;
  compression: boolean;
}

export interface OutputConfig {
  format: 'esm' | 'cjs' | 'umd' | 'system';
  preserveModules: boolean;
  sourcemap: boolean;
  clean: boolean;
}

export interface TypeScriptConfig {
  strict: boolean;
  declaration: boolean;
  target: string;
  module: string;
  lib: string[];
  paths?: Record<string, string[]>;
}

export interface CssConfig {
  preprocessors: string[];
  modules: boolean;
  postcss: boolean;
  autoprefixer: boolean;
}

export interface ProxyConfig {
  context: string[];
  target: string;
  changeOrigin: boolean;
  secure: boolean;
}

export interface CoverageThreshold {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export type PluginType = 'ui' | 'api' | 'fullstack' | 'library';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  entry: string;
  dependencies: PluginDependency[];
  permissions: string[];
  casVersion: string;
  metadata: PluginMetadata;
  compatibility: PluginCompatibility;
}

export interface PluginDependency {
  name: string;
  version: string;
  type: 'core' | 'peer' | 'external';
}

export interface PluginMetadata {
  category: string;
  tags: string[];
  repository?: string;
  homepage?: string;
  license: string;
  keywords: string[];
}

export interface PluginCompatibility {
  minCasVersion: string;
  maxCasVersion?: string;
}

export interface BuildResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  size: number;
  stats: BuildStats;
}

export interface BuildStats {
  chunks: number;
  modules: number;
  assets: number;
  entrypoints: string[];
  dependencies: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

export interface TemplateConfig {
  name: string;
  description: string;
  type: PluginType;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'asset' | 'test';
}

export interface PluginContext {
  rootPath: string;
  configPath: string;
  manifest: PluginManifest;
  config: CasConfig;
  environment: 'development' | 'production' | 'test';
}
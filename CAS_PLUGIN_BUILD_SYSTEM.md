# CAS Plugin Build System - Comprehensive Guide

## Overview

The CAS (Centralized Application System) plugin build system is a comprehensive, production-ready toolchain designed to enable rapid development, testing, and distribution of portable zip-based plugins. This build system supports multiple plugin types, modern development workflows, and enterprise-grade security features.

## Architecture

### Core Components

#### 1. @cas/cli - The Command Line Interface
- **Location**: `/backend/packages/cli/`
- **Purpose**: Primary tool for plugin development lifecycle
- **Key Features**:
  - Interactive plugin scaffolding
  - Multi-target builds (Node.js, Browser)
  - Hot development server with HMR
  - Comprehensive testing integration
  - Package creation and signing
  - Bundle analysis and optimization

#### 2. Plugin Types
The build system supports four distinct plugin types:

##### UI Plugins
- **Framework**: React 18+ with TypeScript
- **Build Target**: Browser (ES2020)
- **Features**:
  - Hot reload development
  - CSS/LESS preprocessing
  - Component isolation
  - Bundle optimization
- **Entry Point**: `src/index.tsx`

##### API Plugins
- **Framework**: Node.js with Express.js
- **Build Target**: Node.js (ES2020)
- **Features**:
  - Server-side TypeScript compilation
  - API route generation
  - Service layer support
  - Production optimization
- **Entry Point**: `src/index.ts`

##### Full-Stack Plugins
- **Framework**: React + Express.js
- **Build Target**: Dual (Browser + Node.js)
- **Features**:
  - Client-server separation
  - API proxying
  - Shared types
  - Coordinated development
- **Entry Points**: `src/client/index.tsx`, `src/server/index.ts`

##### Library Plugins
- **Framework**: TypeScript + React (peer)
- **Build Target**: UMD/ESM
- **Features**:
  - Multiple output formats
  - Tree-shaking support
  - Type declarations
  - External dependencies
- **Entry Point**: `src/index.ts`

#### 3. Build Pipeline

```
Source Files → TypeScript → Bundler → Optimization → Output
     ↓              ↓           ↓           ↓          ↓
  .ts/.tsx → Type Checking → Webpack/Vite → Minify → .js/.css
```

### Key Technologies

#### Bundlers
- **Webpack**: Full-featured, mature, plugin ecosystem
- **Vite**: Fast development, modern tooling
- **Rollup**: Library-focused, tree-shaking
- **esbuild**: Ultra-fast, minimal configuration

#### Compilers
- **TypeScript**: Static typing, modern JS features
- **Babel**: Browser compatibility, transforms
- **PostCSS**: CSS processing, autoprefixer

#### Testing Frameworks
- **Jest**: Industry standard, comprehensive features
- **Vitest**: Fast, Vite-integrated
- **Mocha**: Flexible, plugin ecosystem

#### Development Tools
- **ESLint**: Code quality, consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks, pre-commit checks

## Plugin Development Workflow

### 1. Scaffolding

```bash
# Create new UI plugin
cas-cli create my-plugin --type ui

# Interactive creation with all options
cas-cli create my-plugin
```

**Generated Structure**:
```
my-plugin/
├── src/
│   ├── index.tsx
│   ├── components/
│   ├── services/
│   ├── types/
│   └── styles/
├── tests/
├── assets/
├── package.json
├── plugin.json
├── tsconfig.json
├── cas.config.js
└── README.md
```

### 2. Development

```bash
# Start development environment
cas-cli dev

# Development server only
cas-cli serve --port 8080

# Build watch mode only
cas-cli dev --build-only
```

**Features**:
- ✅ Hot Module Replacement (HMR)
- ✅ Fast refresh
- ✅ Error overlay
- ✅ Source maps
- ✅ API proxying (full-stack)

### 3. Testing

```bash
# Run all tests
cas-cli test

# Watch mode
cas-cli test --watch

# Coverage report
cas-cli test --coverage

# Specific test files
cas-cli test "**/*.spec.ts"
```

**Testing Strategy**:
- Unit tests with Jest/Vitest
- Integration tests for API endpoints
- Component testing with React Testing Library
- End-to-end tests (Playwright)
- Coverage thresholds enforced

### 4. Building

```bash
# Production build
cas-cli build

# Development build with analysis
cas-cli build --mode development --analyze

# Multiple targets
cas-cli build --target esm --target cjs
```

**Build Optimizations**:
- Tree shaking eliminates unused code
- Code splitting reduces bundle size
- Minification reduces download size
- Compression for production
- Bundle analysis identifies bottlenecks

### 5. Validation

```bash
# Full validation
cas-cli validate

# Strict mode
cas-cli validate --strict

# Specific checks
cas-cli validate --skip-security --output json
```

**Validation Checks**:
- ✅ Plugin manifest schema
- ✅ TypeScript compilation
- ✅ Dependency resolution
- ✅ Security scanning
- ✅ CAS compatibility

### 6. Packaging

```bash
# Create distributable package
cas-cli package

# Signed package with checksum
cas-cli package --sign --checksum

# Custom output format
cas-cli package --format tar --output ./dist/my-plugin.tar.gz
```

**Package Features**:
- Zip/TAR compression
- Plugin manifest inclusion
- Integrity checksums (SHA-256)
- Digital signatures (RSA)
- Asset optimization

## Configuration System

### cas.config.js

The build system uses a centralized configuration file:

```javascript
export default {
  pluginType: 'ui', // ui, api, fullstack, library

  build: {
    targets: [{ environment: 'browser' }],
    bundler: 'vite',
    optimization: {
      minify: true,
      treeshake: true,
      codeSplitting: true,
      bundleAnalysis: false,
      compression: true
    },
    output: {
      format: 'esm',
      preserveModules: false,
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
  }
};
```

### Plugin Manifest (plugin.json)

Standard plugin metadata:

```json
{
  "id": "cas-plugin-example",
  "name": "CAS Plugin Example",
  "version": "1.0.0",
  "description": "Example plugin demonstrating features",
  "author": "Developer Name",
  "entry": "dist/index.js",
  "dependencies": [
    {
      "name": "@cas/ui-components",
      "version": "^1.0.0",
      "type": "core"
    }
  ],
  "permissions": [
    "storage.read",
    "dom.access",
    "events.emit"
  ],
  "casVersion": ">=1.0.0"
}
```

## Advanced Features

### 1. Bundle Analysis

```bash
# Generate detailed bundle analysis
cas-cli analyze --bundle --output html --open
```

**Analysis Includes**:
- Bundle size breakdown
- Largest modules identification
- Duplicate dependency detection
- Optimization suggestions
- Performance metrics

### 2. Dependency Management

- **Core Dependencies**: CAS platform libraries
- **Peer Dependencies**: Shared across plugins
- **External Dependencies**: NPM packages
- **Dev Dependencies**: Build-time only

### 3. Security Features

- **Plugin Signing**: RSA digital signatures
- **Integrity Verification**: SHA-256 checksums
- **Permission System**: Granular access control
- **Dependency Scanning**: Vulnerability detection
- **Code Analysis**: Security pattern detection

### 4. Performance Optimizations

#### Build Performance
- **Incremental Compilation**: Only changed files
- **Parallel Processing**: Multi-core utilization
- **Memory Caching**: Build artifact caching
- **File Watching**: Efficient change detection

#### Runtime Performance
- **Code Splitting**: Lazy loading
- **Tree Shaking**: Dead code elimination
- **Bundle Compression**: Gzip/Brotli
- **Asset Optimization**: Image minification

#### Development Experience
- **Fast Refresh**: Component hot reloading
- **Error Overlay**: In-browser error display
- **Source Maps**: Debugging support
- **Type Checking**: Real-time feedback

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Plugin CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: cas-cli test --coverage --ci

      - name: Build plugin
        run: cas-cli build

      - name: Validate plugin
        run: cas-cli validate --strict

      - name: Package plugin
        if: github.ref == 'refs/heads/main'
        run: cas-cli package --sign --checksum

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: plugin-package
          path: "*.zip"
```

### Quality Gates

- **Build Success**: All compilations must pass
- **Test Coverage**: Minimum 80% coverage required
- **Validation**: Strict plugin validation
- **Security**: No high-severity vulnerabilities
- **Performance**: Bundle size limits enforced

## Plugin Distribution

### Package Structure

```
my-plugin-v1.0.0.zip
├── plugin.json          # Manifest
├── dist/
│   ├── index.js         # Main bundle
│   ├── index.js.map     # Source map
│   └── assets/          # Static assets
├── package.json         # Dependencies
├── README.md           # Documentation
└── LICENSE             # License file
```

### Installation Process

1. **Download**: Plugin package from registry
2. **Verify**: Check signature and integrity
3. **Extract**: Unzip to plugins directory
4. **Validate**: Load and verify manifest
5. **Install**: Install dependencies
6. **Initialize**: Register with platform

### Version Management

- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Compatibility**: Range-based version matching
- **Updates**: Automatic security updates
- **Rollbacks**: Version downgrade support

## Best Practices

### Development
1. **TypeScript**: Use strict mode throughout
2. **Testing**: Aim for 90%+ coverage
3. **Code Style**: Consistent ESLint/Prettier
4. **Documentation**: Comprehensive README and JSDoc
5. **Error Handling**: Graceful error boundaries

### Performance
1. **Bundle Size**: Keep initial load < 1MB
2. **Code Splitting**: Lazy load heavy components
3. **Asset Optimization**: Compress images and fonts
4. **Caching**: Implement proper cache headers
5. **Monitoring**: Track bundle size over time

### Security
1. **Dependencies**: Regular vulnerability scanning
2. **Permissions**: Principle of least privilege
3. **Data Validation**: Input sanitization
4. **Authentication**: Secure API integration
5. **Updates**: Timely security patches

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check TypeScript configuration
cas-cli type-check

# Validate dependencies
cas-cli validate --skip-manifest

# Verbose build output
cas-cli build --verbose
```

#### Development Server Issues
```bash
# Check port availability
cas-cli serve --port 3001

# Clean rebuild
cas-cli build --clean
cas-cli dev
```

#### Test Failures
```bash
# Debug test output
cas-cli test --verbose

# Update snapshots
cas-cli test --updateSnapshot

# Run specific failing tests
cas-cli test "**/failing-test.test.ts"
```

### Performance Issues

#### Slow Builds
- Enable incremental compilation
- Exclude unnecessary files
- Use esbuild for faster builds
- Optimize TypeScript configuration

#### Large Bundles
- Analyze bundle composition
- Implement code splitting
- Remove unused dependencies
- Use tree shaking

#### Memory Usage
- Limit parallel processes
- Optimize webpack configuration
- Use lighter alternatives
- Monitor memory leaks

## Future Enhancements

### Planned Features
- **Plugin Marketplace**: Centralized distribution
- **Visual Builder**: Drag-and-drop plugin creation
- **Performance Monitoring**: Runtime metrics collection
- **A/B Testing**: Plugin feature experimentation
- **Hot Updates**: Zero-downtime plugin updates

### Tooling Improvements
- **VS Code Extension**: IDE integration
- **CLI Enhancements**: Additional commands and options
- **Template Library**: Pre-built plugin templates
- **Documentation Generator**: Auto-generated docs
- **Migration Tools**: Version upgrade assistance

## Conclusion

The CAS plugin build system provides a comprehensive, enterprise-grade solution for plugin development and distribution. With support for multiple plugin types, modern development workflows, and robust security features, it enables rapid development while maintaining code quality and security standards.

The system is designed to scale with growing plugin ecosystems, providing the tools and processes necessary for successful plugin development at any scale.

For additional information, see the [CLI documentation](/backend/packages/cli/README.md) and [plugin examples](/examples/).
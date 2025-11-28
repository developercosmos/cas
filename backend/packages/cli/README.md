# @cas/cli

The comprehensive CLI tool for developing, building, and packaging CAS plugins.

## Features

- **Plugin Scaffolding**: Create new plugins with interactive templates
- **Multi-Target Builds**: Support for UI, API, full-stack, and library plugins
- **Hot Development**: Fast development server with hot reload
- **Multiple Bundlers**: Webpack, Rollup, esbuild, and Vite support
- **Comprehensive Testing**: Jest, Vitest, and Mocha integration
- **Package Management**: Create distributable zip packages with integrity verification
- **Validation**: Plugin manifest and structure validation
- **Bundle Analysis**: Analyze bundle size and composition
- **TypeScript Support**: Full TypeScript compilation and type checking

## Installation

```bash
npm install -g @cas/cli
```

## Quick Start

### Create a New Plugin

```bash
# Create a UI plugin
cas-cli create my-ui-plugin --type ui

# Create an API plugin
cas-cli create my-api-plugin --type api

# Create a full-stack plugin
cas-cli create my-fullstack-plugin --type fullstack

# Create a library plugin
cas-cli create my-library-plugin --type library
```

### Development Workflow

```bash
cd my-plugin

# Start development server with hot reload
cas-cli dev

# Build for production
cas-cli build

# Run tests
cas-cli test

# Package for distribution
cas-cli package

# Validate plugin
cas-cli validate
```

## Commands

### `create`

Create a new CAS plugin from a template.

```bash
cas-cli create <name> [options]
```

**Options:**
- `-t, --type <type>`: Plugin type (ui, api, fullstack, library)
- `-f, --force`: Force creation even if directory exists
- `--template <template>`: Use specific template
- `--skip-git`: Skip Git repository initialization
- `--skip-install`: Skip dependency installation

**Examples:**
```bash
# Interactive UI plugin creation
cas-cli create my-plugin --type ui

# Force creation with existing directory
cas-cli create my-plugin --force

# Use custom template
cas-cli create my-plugin --template ./my-template
```

### `dev`

Start development environment with hot reload.

```bash
cas-cli dev [options]
```

**Options:**
- `-p, --port <port>`: Server port (default: 3000)
- `-h, --host <host>`: Server host (default: localhost)
- `--build-only`: Only build in watch mode
- `--serve-only`: Only start server without building

**Examples:**
```bash
# Default development mode
cas-cli dev

# Custom port
cas-cli dev --port 8080

# Build-only mode
cas-cli dev --build-only
```

### `build`

Build plugin for production.

```bash
cas-cli build [options]
```

**Options:**
- `-w, --watch`: Enable watch mode
- `-t, --target <target>`: Build target (esm, cjs, umd)
- `-m, --minify`: Minify output (default: true)
- `-s, --sourcemap`: Generate source maps (default: true)
- `-a, --analyze`: Analyze bundle size
- `--mode <mode>`: Build mode (development, production)
- `--clean`: Clean output directory before build

**Examples:**
```bash
# Production build
cas-cli build

# Development build with watch
cas-cli build --watch --mode development

# Build with bundle analysis
cas-cli build --analyze
```

### `serve`

Start development server only.

```bash
cas-cli serve [options]
```

**Options:**
- `-p, --port <port>`: Server port (default: 3000)
- `-h, --host <host>`: Server host (default: localhost)
- `--https`: Enable HTTPS
- `--open`: Open browser automatically
- `--hot`: Enable hot module replacement
- `--cors`: Enable CORS
- `--proxy <target>`: Proxy API requests to target

### `test`

Run plugin tests.

```bash
cas-cli test [pattern] [options]
```

**Options:**
- `-w, --watch`: Run tests in watch mode
- `-c, --coverage`: Generate coverage report
- `--coverage-threshold <threshold>`: Coverage threshold percentage
- `-t, --testNamePattern <pattern>`: Run tests matching pattern
- `--testPathPattern <pattern>`: Run tests in files matching pattern
- `--verbose`: Verbose test output
- `--ci`: Run in CI mode
- `--reporter <reporter>`: Test reporter (default, jest, vitest)

**Examples:**
```bash
# Run all tests
cas-cli test

# Run tests with coverage
cas-cli test --coverage

# Run tests in watch mode
cas-cli test --watch

# Run specific test pattern
cas-cli test "**/*.spec.ts"
```

### `package`

Package plugin into distributable format.

```bash
cas-cli package [options]
```

**Options:**
- `-f, --format <format>`: Package format (zip, tar)
- `-o, --output <path>`: Output path for package
- `--no-sign`: Skip package signing
- `--no-compress`: Skip compression
- `--include-dev`: Include development dependencies
- `--exclude-tests`: Exclude test files (default: true)
- `--checksum`: Generate integrity checksum

**Examples:**
```bash
# Create signed zip package
cas-cli package --sign --checksum

# Create tar package with dev dependencies
cas-cli package --format tar --include-dev

# Custom output path
cas-cli package --output ./dist/my-plugin.zip
```

### `validate`

Validate plugin structure and configuration.

```bash
cas-cli validate [options]
```

**Options:**
- `--strict`: Enable strict validation mode
- `--skip-manifest`: Skip manifest validation
- `--skip-deps`: Skip dependency validation
- `--skip-security`: Skip security validation
- `--check-compatibility`: Check CAS version compatibility
- `--output <format>`: Output format (table, json, yaml)

**Examples:**
```bash
# Full validation
cas-cli validate

# Strict mode
cas-cli validate --strict

# Skip security checks
cas-cli validate --skip-security

# JSON output
cas-cli validate --output json
```

### `analyze`

Analyze plugin bundle and dependencies.

```bash
cas-cli analyze [options]
```

**Options:**
- `--bundle`: Analyze bundle composition and size
- `--dependencies`: Analyze dependency graph
- `--performance`: Analyze performance metrics
- `--security`: Analyze security aspects
- `--output <format>`: Output format (console, json, html)
- `--open`: Open HTML report in browser

**Examples:**
```bash
# Full analysis
cas-cli analyze

# Bundle only
cas-cli analyze --bundle

# HTML report with browser opening
cas-cli analyze --output html --open
```

## Configuration

Create a `cas.config.js` file in your plugin root:

```javascript
export default {
  pluginType: 'ui', // ui, api, fullstack, library

  build: {
    targets: [{ environment: 'browser' }],
    bundler: 'vite', // webpack, rollup, esbuild, vite
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
    },
    typescript: {
      strict: true,
      declaration: false,
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020', 'DOM', 'DOM.Iterable']
    }
  },

  serve: {
    port: 3000,
    host: 'localhost',
    hot: true,
    open: true,
    proxy: [{
      context: ['/api'],
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }]
  },

  test: {
    framework: 'jest', // jest, vitest, mocha
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
  },

  paths: {
    src: './src',
    dist: './dist',
    tests: './tests',
    assets: './assets',
    public: './public'
  }
};
```

## Plugin Types

### UI Plugin
- React-based frontend components
- Hot reload development server
- CSS/LESS preprocessing
- Bundle optimization for browser

### API Plugin
- Node.js backend services
- Express.js integration
- TypeScript compilation
- Production-ready builds

### Full-Stack Plugin
- Both frontend and backend components
- Automatic API proxying
- Separate build configurations
- Development coordination

### Library Plugin
- Reusable components and utilities
- Multiple output formats
- Type declarations
- Tree-shaking support

## Plugin Manifest

Create a `plugin.json` file:

```json
{
  "id": "cas-plugin-example",
  "name": "CAS Plugin Example",
  "version": "1.0.0",
  "description": "Example CAS plugin demonstrating features",
  "author": "Your Name",
  "entry": "dist/index.js",
  "dependencies": [
    {
      "name": "@cas/types",
      "version": "^1.0.0",
      "type": "core"
    },
    {
      "name": "@cas/ui-components",
      "version": "^1.0.0",
      "type": "core"
    }
  ],
  "permissions": [
    "storage.read",
    "storage.write",
    "dom.access",
    "events.emit",
    "events.listen"
  ],
  "casVersion": ">=1.0.0",
  "metadata": {
    "category": "utility",
    "tags": ["example", "demo"],
    "repository": "https://github.com/user/plugin",
    "homepage": "https://example.com",
    "license": "MIT"
  },
  "compatibility": {
    "minCasVersion": "1.0.0",
    "maxCasVersion": null
  }
}
```

## Development

### Project Structure

```
my-plugin/
├── src/
│   ├── index.tsx          # Main entry point
│   ├── components/        # React components
│   ├── services/          # Business logic
│   ├── types/            # TypeScript definitions
│   └── styles/           # CSS/LESS files
├── tests/                # Test files
├── assets/               # Static assets
├── dist/                 # Build output
├── package.json
├── plugin.json          # Plugin manifest
├── tsconfig.json
├── cas.config.js        # CAS configuration
└── README.md
```

### Adding Dependencies

```bash
# Add runtime dependency
npm install lodash

# Add development dependency
npm install --save-dev jest

# Add CAS core dependency
npm install @cas/ui-components
```

### Testing

Create test files with `.test.ts` or `.spec.ts` suffix:

```typescript
// tests/Component.test.ts
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../src/components/MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
```

## Advanced Usage

### Custom Templates

Create your own plugin templates:

1. Create a template directory
2. Include `plugin.json.template`
3. Use `{{variable}}` for template variables
4. Use with `cas-cli create --template ./my-template`

### Bundle Optimization

```javascript
// cas.config.js
export default {
  build: {
    bundler: 'webpack',
    optimization: {
      minify: true,
      treeshake: true,
      codeSplitting: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  }
};
```

### Environment Variables

Use environment variables in your code:

```typescript
// Access CAS-provided variables
const pluginId = process.env.CAS_PLUGIN_ID;
const pluginVersion = process.env.CAS_PLUGIN_VERSION;
```

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
- Check `tsconfig.json` configuration
- Ensure all dependencies are installed
- Verify import paths are correct

**Development server not working:**
- Check port conflicts with `-p` option
- Verify `cas.config.js` syntax
- Check for syntax errors in your code

**Package creation fails:**
- Ensure `plugin.json` is valid
- Check build completed successfully
- Verify file permissions

### Getting Help

- Use `--verbose` flag for detailed output
- Check log files in your plugin directory
- Validate your configuration with `cas-cli validate --strict`

## Contributing

To contribute to @cas/cli:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://cas-platform.com/docs/cli
- Issues: https://github.com/cas-platform/cli/issues
- Community: https://github.com/cas-platform/discussions
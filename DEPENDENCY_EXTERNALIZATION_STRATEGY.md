# CAS Plugin System Dependency Externalization Strategy

## Executive Summary

This document outlines a comprehensive strategy to externalize dependencies from the CAS plugin system, enabling portable zip-based plugins that can be developed, distributed, and installed independently of the core application.

## Current State Analysis

### Current Plugin Structure
- **Tightly Coupled**: Plugins directly import from main application (`import { Button } from '../base-ui/styled-components'`)
- **Monolithic Dependencies**: All UI components, services, and types are bundled with the main app
- **No Version Isolation**: Plugins share the same dependency versions as the core app
- **Limited Portability**: Plugins cannot be distributed independently

### Existing Dependencies Identified
```typescript
// Current imports in PluginManager.tsx
import { Button, Input, Textarea } from '../base-ui/styled-components';
import { PluginMetadata, PluginInstallRequest } from '../../types';
import { PluginAdminService } from '../../services/PluginAdminService';
```

## Proposed Architecture

### 1. Core Package Structure

```
@cas/
├── core-api/                    # Core APIs and services
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── plugin-system/
│   │   ├── auth/
│   │   ├── storage/
│   │   └── events/
│   └── dist/
├── ui-components/               # Reusable UI components
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── themes/
│   └── dist/
├── types/                       # Shared TypeScript definitions
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── plugin.ts
│   │   ├── auth.ts
│   │   └── ui.ts
│   └── dist/
└── plugin-runtime/              # Plugin execution environment
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   ├── sandbox/
    │   ├── loader/
    │   └── registry/
    └── dist/
```

## Package Implementation Details

### 1. @cas/types Package

**File: packages/cas-types/package.json**
```json
{
  "name": "@cas/types",
  "version": "1.0.0",
  "description": "CAS Platform Type Definitions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**File: packages/cas-types/src/index.ts**
```typescript
// Core plugin types
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  status: 'active' | 'disabled' | 'error';
  createdAt: string;
  updatedAt: string;
  config?: Record<string, any>;
  isSystem?: boolean;
  routes?: Record<string, string>;
  dependencies?: PluginDependency[];
}

export interface PluginDependency {
  name: string;
  version: string;
  type: 'core' | 'peer' | 'optional';
  package?: string; // For npm packages
  url?: string;     // for CDN or custom URLs
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  dependencies?: PluginDependency[];
  casVersion?: string; // Minimum CAS version required
}

// Plugin context and runtime types
export interface PluginContext {
  registerComponent: (name: string, component: React.ComponentType<any>) => void;
  registerRoute: (path: string, component: React.ComponentType<any>) => void;
  registerService: (name: string, service: any) => void;
  storage: SandboxedStorage;
  events: EventEmitter;
  api: PluginAPI;
  ui: PluginUIService;
  config: PluginConfigService;
}

export interface PluginAPI {
  request: <T = any>(endpoint: string, options?: RequestOptions) => Promise<T>;
  get: <T = any>(endpoint: string, params?: Record<string, any>) => Promise<T>;
  post: <T = any>(endpoint: string, data?: any) => Promise<T>;
  put: <T = any>(endpoint: string, data?: any) => Promise<T>;
  delete: <T = any>(endpoint: string) => Promise<T>;
}

export interface PluginUIService {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showModal: (component: React.ComponentType<any>, props?: any) => void;
  hideModal: () => void;
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

export interface PluginConfigService {
  get: <T = any>(key: string, defaultValue?: T) => T;
  set: (key: string, value: any) => Promise<void>;
  getAll: () => Record<string, any>;
  validate: (schema: any) => boolean;
}

// UI Component types
export interface UIComponentProps {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  testId?: string;
}

export interface ButtonProps extends UIComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (event: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  fullWidth?: boolean;
}

export interface InputProps extends UIComponentProps {
  type?: string;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  fullWidth?: boolean;
  autoComplete?: string;
}

// Event and storage types
export interface EventEmitter {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  once: (event: string, handler: (...args: any[]) => void) => void;
}

export interface SandboxedStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

export interface PluginInstallRequest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  source?: 'url' | 'file' | 'registry';
  sourceUrl?: string;
  dependencies?: PluginDependency[];
}

export interface PluginValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: PluginValidationError[];
  warnings: PluginValidationError[];
}
```

### 2. @cas/ui-components Package

**File: packages/cas-ui-components/package.json**
```json
{
  "name": "@cas/ui-components",
  "version": "1.0.0",
  "description": "CAS Platform UI Components",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc && npm run build:styles",
    "build:styles": "lessc src/styles/index.less dist/index.css",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@cas/types": "^1.0.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "less": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

**File: packages/cas-ui-components/src/index.ts**
```typescript
// Re-export all components
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Textarea } from './components/Textarea';
export { Modal } from './components/Modal';
export { Tabs } from './components/Tabs';
export { Tooltip } from './components/Tooltip';
export { Checkbox } from './components/Checkbox';
export { Switch } from './components/Switch';

// Re-export hooks
export { useTheme } from './hooks/useTheme';
export { useNotification } from './hooks/useNotification';

// Re-export styles
export './styles/index.css';

// Export component types
export type { ButtonProps } from './components/Button';
export type { InputProps } from './components/Input';
export type { TextareaProps } from './components/Textarea';
```

### 3. @cas/core-api Package

**File: packages/cas-core-api/package.json**
```json
{
  "name": "@cas/core-api",
  "version": "1.0.0",
  "description": "CAS Platform Core API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "jest"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "dependencies": {
    "@cas/types": "^1.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**File: packages/cas-core-api/src/index.ts**
```typescript
// Re-export all services
export { PluginAdminService } from './services/PluginAdminService';
export { PluginDocumentationService } from './services/PluginDocumentationService';
export { AuthService } from './services/AuthService';
export { StorageService } from './services/StorageService';
export { EventService } from './services/EventService';

// Re-export plugin system
export { PluginManager } from './plugin-system/PluginManager';
export { PluginLoader } from './plugin-system/PluginLoader';
export { PluginRegistry } from './plugin-system/PluginRegistry';
export { PluginSandbox } from './plugin-system/PluginSandbox';

// Re-export utilities
export * from './utils/validation';
export * from './utils/logger';
export * from './utils/error-handling';
```

### 4. @cas/plugin-runtime Package

**File: packages/cas-plugin-runtime/package.json**
```json
{
  "name": "@cas/plugin-runtime",
  "version": "1.0.0",
  "description": "CAS Plugin Runtime Environment",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "dependencies": {
    "@cas/types": "^1.0.0",
    "@cas/core-api": "^1.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Migration Strategy

### Phase 1: Package Creation and Setup

1. **Create package structure**
```bash
mkdir -p packages/cas-types packages/cas-ui-components packages/cas-core-api packages/cas-plugin-runtime
```

2. **Set up workspace configuration**
```json
// package.json (root)
{
  "name": "cas-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "frontend",
    "backend"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces --parallel",
    "clean": "npm run clean --workspaces",
    "publish": "npm run build && npm publish --workspaces"
  },
  "devDependencies": {
    "lerna": "^7.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Phase 2: Extract Types

1. **Move existing types to @cas/types**
2. **Update imports in frontend components**
3. **Set up build pipeline**

### Phase 3: Extract UI Components

1. **Extract Button component**
```typescript
// packages/cas-ui-components/src/components/Button.tsx
import React from 'react';
import { ButtonProps } from '@cas/types';
import styled from '@emotion/styled';

const StyledButton = styled.button<ButtonProps>`
  /* Existing button styles */
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};
```

2. **Extract Input component**
3. **Extract remaining components**
4. **Create theme system**

### Phase 4: Extract Core Services

1. **Extract PluginAdminService**
```typescript
// packages/cas-core-api/src/services/PluginAdminService.ts
import { PluginMetadata, PluginInstallRequest } from '@cas/types';

export class PluginAdminService {
  private static baseUrl = '/api/admin/plugins';

  static async listPlugins(): Promise<{ success: boolean; data: PluginMetadata[] }> {
    // Extracted implementation
  }

  static async installPlugin(plugin: PluginInstallRequest): Promise<{ success: boolean; message: string }> {
    // Extracted implementation
  }
}
```

### Phase 5: Plugin Runtime Development

1. **Create plugin sandbox environment**
2. **Implement dependency injection**
3. **Set up plugin loader**

## Plugin Development Guidelines

### 1. Plugin Structure

```
my-plugin/
├── package.json
├── plugin.json               # Plugin manifest
├── src/
│   ├── index.ts             # Entry point
│   ├── components/          # Plugin components
│   ├── services/            # Plugin services
│   └── types/               # Plugin-specific types
├── dist/                    # Build output
├── assets/                  # Static assets
└── docs/                    # Documentation
```

### 2. Plugin Manifest

```json
// plugin.json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for CAS Platform",
  "author": "Developer Name",
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
    },
    {
      "name": "lodash",
      "version": "^4.17.21",
      "type": "peer"
    }
  ],
  "permissions": ["storage.read", "storage.write", "api.request"],
  "casVersion": ">=1.0.0"
}
```

### 3. Plugin Entry Point

```typescript
// src/index.ts
import React from 'react';
import { PluginContext, PluginManifest } from '@cas/types';
import { Button, Input } from '@cas/ui-components';
import { PluginAdminService } from '@cas/core-api';

const MyPluginComponent: React.FC = () => {
  const [data, setData] = React.useState('');

  return (
    <div>
      <h2>My Awesome Plugin</h2>
      <Input
        value={data}
        onChange={setData}
        placeholder="Enter some data"
      />
      <Button onClick={() => console.log('Button clicked')}>
        Click Me
      </Button>
    </div>
  );
};

export default {
  id: 'my-awesome-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  initialize: async (context: PluginContext) => {
    // Register plugin component
    context.registerComponent('MyPlugin', MyPluginComponent);

    // Register plugin route
    context.registerRoute('/my-plugin', MyPluginComponent);

    // Register plugin service
    context.registerService('myPluginService', {
      doSomething: () => console.log('Doing something...')
    });
  },
  render: MyPluginComponent,
  dispose: async () => {
    // Cleanup resources
  }
} as Plugin;
```

## Version Management Strategy

### 1. Semantic Versioning

- **Major (X.0.0)**: Breaking changes
- **Minor (X.Y.0)**: New features, backward compatible
- **Patch (X.Y.Z)**: Bug fixes, backward compatible

### 2. Compatibility Matrix

| Core Version | UI Components | Types | Plugin Runtime |
|-------------|---------------|-------|----------------|
| 1.0.x | 1.0.x | 1.0.x | 1.0.x |
| 1.1.x | 1.0-1.1.x | 1.0-1.1.x | 1.0-1.1.x |
| 2.0.x | 2.0.x | 2.0.x | 2.0.x |

### 3. Dependency Resolution

```typescript
// Plugin dependency resolver
export class DependencyResolver {
  static resolve(
    plugin: PluginManifest,
    availablePackages: Record<string, string>
  ): { success: boolean; resolved: Record<string, string>; conflicts: string[] } {
    const resolved: Record<string, string> = {};
    const conflicts: string[] = [];

    for (const dep of plugin.dependencies || []) {
      const availableVersion = availablePackages[dep.name];

      if (!availableVersion) {
        conflicts.push(`Missing dependency: ${dep.name}`);
        continue;
      }

      if (!this.isCompatible(availableVersion, dep.version)) {
        conflicts.push(
          `Version conflict: ${dep.name} requires ${dep.version}, but ${availableVersion} is available`
        );
        continue;
      }

      resolved[dep.name] = availableVersion;
    }

    return {
      success: conflicts.length === 0,
      resolved,
      conflicts
    };
  }

  private static isCompatible(available: string, required: string): boolean {
    // Implement semver compatibility check
    return true; // Simplified for example
  }
}
```

## Build and Bundle Optimization

### 1. Tree Shaking Configuration

```javascript
// vite.config.js for packages
export default {
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
};
```

### 2. Bundle Size Analysis

```bash
# Analyze bundle sizes
npm run build -- --analyze
npx webpack-bundle-analyzer dist/stats.json
```

### 3. Code Splitting Strategy

```typescript
// Dynamic imports for lazy loading
const LazyPluginComponent = React.lazy(() => import('./components/PluginComponent'));

// Usage with Suspense
<Suspense fallback={<Loading />}>
  <LazyPluginComponent />
</Suspense>
```

## Testing Strategy

### 1. Unit Testing

```typescript
// packages/cas-ui-components/src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

```typescript
// Integration test for plugin loading
import { PluginLoader } from '@cas/plugin-runtime';
import { PluginContext } from '@cas/types';

describe('Plugin Loading', () => {
  it('loads plugin with dependencies', async () => {
    const loader = new PluginLoader();
    const context = createMockPluginContext();

    const plugin = await loader.loadPlugin('./my-plugin.zip');
    await plugin.initialize(context);

    expect(context.getComponents()).toContain('MyPlugin');
  });
});
```

### 3. E2E Testing

```typescript
// E2E test for plugin installation
import { test, expect } from '@playwright/test';

test('plugin installation workflow', async ({ page }) => {
  await page.goto('/admin/plugins');
  await page.click('[data-testid="install-plugin-button"]');
  await page.fill('[data-testid="plugin-url"]', 'https://example.com/my-plugin.zip');
  await page.click('[data-testid="install-button"]');

  await expect(page.locator('[data-testid="plugin-list"]')).toContainText('My Awesome Plugin');
});
```

## Security Considerations

### 1. Plugin Sandboxing

```typescript
// Plugin sandbox implementation
export class PluginSandbox {
  private vm: NodeVM;

  constructor(pluginId: string) {
    this.vm = new NodeVM({
      console: 'inherit',
      sandbox: this.createSandboxContext(pluginId),
      require: {
        external: ['@cas/types', '@cas/ui-components', '@cas/core-api'],
        builtin: ['events', 'util']
      }
    });
  }

  async execute(code: string): Promise<any> {
    return this.vm.run(code);
  }

  private createSandboxContext(pluginId: string) {
    return {
      // Whitelisted APIs and modules
      console,
      setTimeout,
      clearTimeout,
      pluginId
    };
  }
}
```

### 2. Permission System

```typescript
// Permission validation
export class PermissionValidator {
  private static permissions = {
    'storage.read': ['localStorage', 'sessionStorage'],
    'storage.write': ['localStorage', 'sessionStorage'],
    'api.request': ['fetch', 'XMLHttpRequest'],
    'dom.access': ['document', 'window']
  };

  static validate(pluginPermissions: string[], requestedAction: string): boolean {
    // Check if plugin has permission for requested action
    return pluginPermissions.includes(requestedAction);
  }
}
```

## Deployment and Distribution

### 1. Package Registry

```bash
# Set up private npm registry
npm config set @cas:registry https://registry.cas-platform.com/

# Publish packages
npm publish --access restricted
```

### 2. Plugin Distribution

```typescript
// Plugin marketplace integration
export class PluginMarketplace {
  static async downloadPlugin(pluginId: string): Promise<ArrayBuffer> {
    const response = await fetch(`/api/marketplace/plugins/${pluginId}/download`);
    return response.arrayBuffer();
  }

  static async verifyPluginSignature(pluginData: ArrayBuffer): Promise<boolean> {
    // Verify plugin signature and integrity
    return true;
  }
}
```

### 3. Version Management

```typescript
// Plugin version manager
export class PluginVersionManager {
  static async checkUpdates(plugin: PluginManifest): Promise<PluginManifest | null> {
    // Check for newer versions
    return null;
  }

  static async updatePlugin(pluginId: string, newVersion: string): Promise<boolean> {
    // Update plugin to new version
    return true;
  }
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up workspace configuration
- [ ] Create @cas/types package
- [ ] Create @cas/ui-components package
- [ ] Create @cas/core-api package
- [ ] Create @cas/plugin-runtime package

### Phase 2: Migration (Weeks 3-4)
- [ ] Extract types from frontend
- [ ] Extract UI components
- [ ] Extract core services
- [ ] Update frontend imports

### Phase 3: Plugin Runtime (Weeks 5-6)
- [ ] Implement plugin sandbox
- [ ] Create dependency injection system
- [ ] Build plugin loader
- [ ] Set up plugin registry

### Phase 4: Testing & Documentation (Weeks 7-8)
- [ ] Write comprehensive tests
- [ ] Create plugin development documentation
- [ ] Set up CI/CD pipeline
- [ ] Performance testing and optimization

### Phase 5: Migration Support (Weeks 9-10)
- [ ] Create migration scripts for existing plugins
- [ ] Backward compatibility layer
- [ ] Gradual rollout strategy
- [ ] Monitoring and logging

## Conclusion

This dependency externalization strategy will transform the CAS plugin system into a truly modular, extensible platform. By separating concerns into well-defined packages, we enable:

1. **Independent Plugin Development**: Plugins can be developed without access to core source code
2. **Version Isolation**: Different plugins can use different compatible versions
3. **Distribution**: Plugins can be distributed as zip files with clear dependencies
4. **Maintainability**: Core updates don't break existing plugins
5. **Security**: Sandboxed execution environment with permission controls
6. **Performance**: Optimized bundles with tree-shaking and code splitting

The migration should be done incrementally to minimize disruption to existing functionality while building toward the long-term vision of a portable, extensible plugin ecosystem.
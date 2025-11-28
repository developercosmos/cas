# CAS Plugin System Externalization Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the dependency externalization strategy for your CAS plugin system. It includes practical examples, migration scripts, and best practices for creating portable zip-based plugins.

## Quick Start

### 1. Set Up Package Structure

```bash
# Run the setup script
chmod +x scripts/setup-packages.sh
./scripts/setup-packages.sh

# Install dependencies
npm install

# Build all packages
npm run build
```

### 2. Migrate Existing Plugin

```bash
# Use the migration script
node scripts/migrate-plugin.js backend/src/plugins/ldap

# Or migrate frontend components
node scripts/migrate-plugin.js frontend/src/components/PluginManager
```

### 3. Create New Plugin

```bash
# Copy the template
cp -r templates/plugin-template my-new-plugin
cd my-new-plugin

# Customize and build
npm install
npm run build
npm run package
```

## Detailed Implementation

### Phase 1: Package Creation (Week 1)

#### 1.1 Execute Setup Script

The setup script creates the complete package structure:

```bash
./scripts/setup-packages.sh
```

**What it creates:**
- `packages/cas-types/` - Type definitions
- `packages/cas-ui-components/` - UI components
- `packages/cas-core-api/` - Core services
- `packages/cas-plugin-runtime/` - Plugin runtime

#### 1.2 Configure Workspace

Your root `package.json` will be updated with workspace configuration:

```json
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
    "clean": "npm run clean --workspaces"
  }
}
```

#### 1.3 Build Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@cas/types

# Development mode with watch
npm run dev --workspace=@cas/ui-components
```

### Phase 2: Content Migration (Week 2)

#### 2.1 Extract Types

Copy your existing type definitions to the new packages:

```bash
# Copy existing types
cp frontend/src/types/index.ts packages/cas-types/src/plugin.ts

# Copy UI component types
cp frontend/src/components/base-ui/styled-components.tsx packages/cas-ui-components/src/

# Copy service types
cp frontend/src/services/*.ts packages/cas-core-api/src/services/
```

#### 2.2 Update Type Definitions

Update the extracted types to use proper imports:

```typescript
// packages/cas-types/src/plugin.ts
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
  package?: string;
  url?: string;
}
```

#### 2.3 Extract UI Components

Migrate your UI components to use the new package structure:

```typescript
// packages/cas-ui-components/src/components/Button.tsx
import React from 'react';
import styled from '@emotion/styled';
import { ButtonProps } from '@cas/types';

const StyledButton = styled.button<ButtonProps>`
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.variant === 'primary' ? '#fff' : '#000'};
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};
```

#### 2.4 Update Frontend Imports

Replace internal imports with externalized package imports:

```typescript
// Before
import { Button, Input } from '../base-ui/styled-components';
import { PluginMetadata } from '../../types';

// After
import { Button, Input } from '@cas/ui-components';
import { PluginMetadata } from '@cas/types';
```

### Phase 3: Plugin Runtime Implementation (Week 3)

#### 3.1 Plugin Sandbox Implementation

```typescript
// packages/cas-plugin-runtime/src/sandbox/PluginSandbox.ts
import { NodeVM } from 'vm2';
import { PluginContext, EventEmitter } from '@cas/types';

export class PluginSandbox {
  private vm: NodeVM;
  private context: PluginContext;

  constructor(pluginId: string) {
    this.context = this.createPluginContext(pluginId);

    this.vm = new NodeVM({
      console: 'inherit',
      sandbox: this.context,
      require: {
        external: ['@cas/types', '@cas/ui-components', '@cas/core-api'],
        builtin: ['events', 'util', 'buffer']
      },
      timeout: 30000
    });
  }

  async execute(pluginCode: string): Promise<any> {
    try {
      const plugin = await this.vm.run(pluginCode);
      return plugin;
    } catch (error) {
      console.error(`Plugin execution failed:`, error);
      throw error;
    }
  }

  private createPluginContext(pluginId: string): PluginContext {
    return {
      registerComponent: (name: string, component: any) => {
        console.log(`Component registered: ${name} for plugin: ${pluginId}`);
      },
      registerRoute: (path: string, component: any) => {
        console.log(`Route registered: ${path} for plugin: ${pluginId}`);
      },
      storage: new PluginStorage(pluginId),
      events: new EventEmitter(),
      ui: new PluginUIService(),
      api: new PluginAPIService(),
      config: new PluginConfigService(pluginId)
    };
  }
}
```

#### 3.2 Plugin Loader

```typescript
// packages/cas-plugin-runtime/src/loader/PluginLoader.ts
import { Plugin, PluginManifest } from '@cas/types';
import { PluginSandbox } from '../sandbox/PluginSandbox';
import JSZip from 'jszip';

export class PluginLoader {
  private sandboxes: Map<string, PluginSandbox> = new Map();

  async loadFromZip(zipData: ArrayBuffer): Promise<Plugin> {
    try {
      const zip = await JSZip.loadAsync(zipData);

      // Extract manifest
      const manifestFile = zip.file('plugin.json');
      if (!manifestFile) {
        throw new Error('plugin.json not found in plugin package');
      }

      const manifest = JSON.parse(await manifestFile.async('text')) as PluginManifest;

      // Extract main plugin code
      const entryFile = zip.file(manifest.entry);
      if (!entryFile) {
        throw new Error(`Entry file not found: ${manifest.entry}`);
      }

      const pluginCode = await entryFile.async('text');

      // Create sandbox and execute plugin
      const sandbox = new PluginSandbox(manifest.id);
      const plugin = await sandbox.execute(pluginCode);

      this.sandboxes.set(manifest.id, sandbox);

      return plugin;

    } catch (error) {
      console.error('Failed to load plugin from zip:', error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const sandbox = this.sandboxes.get(pluginId);
    if (sandbox) {
      await sandbox.dispose();
      this.sandboxes.delete(pluginId);
    }
  }
}
```

### Phase 4: Frontend Integration (Week 4)

#### 4.1 Update Frontend Dependencies

```bash
cd frontend
npm install @cas/types @cas/ui-components @cas/core-api
```

#### 4.2 Update Component Imports

Update your React components to use externalized packages:

```typescript
// frontend/src/components/PluginManager/PluginManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Textarea,
  Modal,
  Tabs
} from '@cas/ui-components';
import {
  PluginMetadata,
  PluginInstallRequest,
  PluginContext
} from '@cas/types';
import {
  PluginAdminService,
  PluginDocumentationService
} from '@cas/core-api';
```

#### 4.3 Plugin Context Provider

Create a plugin context provider for the React application:

```typescript
// frontend/src/contexts/PluginContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { Plugin, PluginContext } from '@cas/types';
import { PluginManager } from '@cas/plugin-runtime';

interface PluginState {
  plugins: Map<string, Plugin>;
  loading: boolean;
  error: string | null;
}

interface PluginProviderProps {
  children: React.ReactNode;
}

const PluginContext = createContext<{
  state: PluginState;
  installPlugin: (zipData: ArrayBuffer) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
} | null>(null);

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
  const [state, setState] = useState<PluginState>({
    plugins: new Map(),
    loading: false,
    error: null
  });

  const pluginManager = new PluginManager();

  const installPlugin = async (zipData: ArrayBuffer) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const plugin = await pluginManager.installPlugin(zipData);
      setState(prev => ({
        ...prev,
        plugins: new Map(prev.plugins).set(plugin.id, plugin),
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      }));
    }
  };

  // ... other methods (uninstall, enable, disable)

  return (
    <PluginContext.Provider value={{ state, installPlugin, uninstallPlugin, enablePlugin, disablePlugin }}>
      {children}
    </PluginContext.Provider>
  );
};

export const usePlugin = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugin must be used within PluginProvider');
  }
  return context;
};
```

## Migration Examples

### Example 1: Migrating LDAP Plugin

#### Before Migration

```typescript
// backend/src/plugins/ldap/index.ts
import { PluginAdminService } from '../../services/PluginAdminService';
import { PluginMetadata } from '../../types';
import { Button } from '../components/Button';

// Direct imports from main application
```

#### After Migration

```typescript
// plugins/ldap-plugin/src/index.ts
import { Plugin, PluginContext, PluginMetadata } from '@cas/types';
import { Button, Input, Modal } from '@cas/ui-components';
import { PluginAdminService } from '@cas/core-api';

export default {
  id: 'ldap-auth',
  name: 'LDAP Authentication',
  version: '1.0.0',

  initialize: async (context: PluginContext) => {
    context.registerComponent('LDAPConfig', LDAPConfigComponent);
    context.registerRoute('/ldap-config', LDAPConfigComponent);
  },

  render: LDAPConfigComponent,

  dispose: async () => {
    console.log('LDAP plugin disposed');
  }
} as Plugin;
```

### Example 2: Migrating Frontend Component

#### Before Migration

```typescript
// frontend/src/components/PluginManager/PluginManager.tsx
import { Button, Input } from '../base-ui/styled-components';
import { PluginMetadata } from '../../types';
import { PluginAdminService } from '../../services/PluginAdminService';
```

#### After Migration

```typescript
// frontend/src/components/PluginManager/PluginManager.tsx
import { Button, Input } from '@cas/ui-components';
import { PluginMetadata } from '@cas/types';
import { PluginAdminService } from '@cas/core-api';
```

## Best Practices

### 1. Version Management

- Use semantic versioning for all packages
- Maintain compatibility matrix in documentation
- Use peer dependencies for React and other shared libraries

### 2. Build Optimization

- Enable tree-shaking in bundle configuration
- Use code splitting for large components
- Implement lazy loading for plugin components

```typescript
// Lazy loading example
const LazyPluginComponent = React.lazy(() => import('./PluginComponent'));

function PluginWrapper() {
  return (
    <React.Suspense fallback={<Loading />}>
      <LazyPluginComponent />
    </React.Suspense>
  );
}
```

### 3. Security

- Always run plugins in sandboxed environment
- Validate plugin manifests before installation
- Implement permission system for plugin access

```typescript
// Permission validation
export const validatePluginPermissions = (
  plugin: PluginManifest,
  requestedPermissions: string[]
): boolean => {
  return requestedPermissions.every(perm =>
    plugin.permissions.includes(perm)
  );
};
```

### 4. Error Handling

- Implement comprehensive error boundaries
- Provide meaningful error messages
- Create fallback UI for failed plugin loads

```typescript
// Error boundary for plugins
class PluginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Plugin error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plugin-error">
          <h3>Plugin Error</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// packages/cas-ui-components/src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests

```typescript
// Integration test for plugin loading
import { PluginLoader } from '@cas/plugin-runtime';
import { Plugin } from '@cas/types';

describe('Plugin Integration', () => {
  it('loads and initializes plugin correctly', async () => {
    const loader = new PluginLoader();

    // Mock plugin zip data
    const pluginZip = createMockPluginZip();

    const plugin = await loader.loadFromZip(pluginZip);

    expect(plugin.id).toBe('test-plugin');
    expect(typeof plugin.initialize).toBe('function');
    expect(typeof plugin.dispose).toBe('function');

    await plugin.initialize(createMockContext());
    expect(plugin.render).toBeDefined();
  });
});
```

### 3. E2E Tests

```typescript
// E2E test for plugin installation
import { test, expect } from '@playwright/test';

test('plugin installation workflow', async ({ page }) => {
  await page.goto('/admin/plugins');

  // Upload plugin
  await page.setInputFiles('input[type="file"]', 'test-plugin.zip');
  await page.click('[data-testid="install-button"]');

  // Verify plugin appears in list
  await expect(page.locator('[data-testid="plugin-list"]')).toContainText('Test Plugin');

  // Enable plugin
  await page.click('[data-testid="enable-plugin"]');
  await expect(page.locator('[data-testid="plugin-status"]')).toContainText('Active');
});
```

## Deployment

### 1. Build Pipeline

```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Publish packages
        run: npm run publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 2. Version Release

```bash
# Release new version
npm version patch
npm run build
npm publish --workspaces

# Tag and push
git tag v1.0.1
git push origin v1.0.1
```

### 3. Plugin Distribution

```typescript
// Plugin marketplace client
export class PluginMarketplace {
  static async downloadPlugin(pluginId: string): Promise<ArrayBuffer> {
    const response = await fetch(`/api/marketplace/plugins/${pluginId}/download`);
    return response.arrayBuffer();
  }

  static async uploadPlugin(pluginData: ArrayBuffer): Promise<void> {
    const formData = new FormData();
    formData.append('plugin', new Blob([pluginData]), 'plugin.zip');

    await fetch('/api/marketplace/plugins/upload', {
      method: 'POST',
      body: formData
    });
  }
}
```

## Monitoring and Debugging

### 1. Plugin Health Monitoring

```typescript
// Plugin health monitoring
export class PluginHealthMonitor {
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();

  startHealthCheck(pluginId: string, interval = 30000): void {
    const check = setInterval(() => {
      this.checkPluginHealth(pluginId);
    }, interval);

    this.healthChecks.set(pluginId, check);
  }

  private async checkPluginHealth(pluginId: string): Promise<void> {
    try {
      // Check if plugin is responsive
      const response = await fetch(`/api/plugins/${pluginId}/health`);

      if (!response.ok) {
        console.warn(`Plugin ${pluginId} health check failed`);
        // Notify admin or attempt restart
      }
    } catch (error) {
      console.error(`Plugin ${pluginId} health check error:`, error);
    }
  }
}
```

### 2. Debug Console

```typescript
// Debug console for plugin developers
export class PluginDebugConsole {
  static log(pluginId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    console.group(`[${pluginId}] ${level.toUpperCase()}`);
    console.log(message);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();

    // Send to logging service
    this.sendToLogService({
      pluginId,
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  private static async sendToLogData(logData: any): Promise<void> {
    // Implementation for sending logs to central service
  }
}
```

## Conclusion

This implementation guide provides a comprehensive roadmap for externalizing dependencies in your CAS plugin system. By following these steps and best practices, you'll create a modular, secure, and maintainable plugin ecosystem that supports:

- **Portable Plugins**: Distribute plugins as zip files with all dependencies
- **Type Safety**: Full TypeScript support across all packages
- **Security**: Sandboxed plugin execution with permission controls
- **Performance**: Optimized bundles with tree-shaking and code splitting
- **Maintainability**: Clear separation of concerns and version management

The migration should be performed incrementally to minimize disruption while building toward the long-term vision of a truly extensible plugin platform.
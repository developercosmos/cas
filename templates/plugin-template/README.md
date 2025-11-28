# CAS Plugin Template

This template demonstrates how to create a CAS plugin using the externalized dependency architecture.

## Project Structure

```
my-plugin/
├── package.json              # Plugin dependencies and metadata
├── plugin.json              # Plugin manifest for CAS runtime
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── index.ts            # Plugin entry point
│   ├── components/         # React components
│   │   └── MyPlugin.tsx
│   ├── services/           # Plugin-specific services
│   │   └── MyPluginService.ts
│   ├── types/              # Plugin-specific types
│   │   └── index.ts
│   └── styles/             # Plugin styles
│       └── styles.css
├── dist/                   # Build output (generated)
├── assets/                 # Static assets
├── docs/                   # Documentation
└── tests/                  # Test files
```

## Key Features

- **External Dependencies**: Uses `@cas/types`, `@cas/ui-components`, and `@cas/core-api`
- **Type Safety**: Full TypeScript support with CAS type definitions
- **UI Components**: Pre-built components from CAS UI library
- **Service Integration**: Uses CAS core services for plugin management
- **Sandboxed Execution**: Runs in secure CAS plugin sandbox
- **Hot Reload**: Development mode with hot reloading

## Quick Start

1. **Clone this template**:
   ```bash
   cp -r templates/plugin-template my-new-plugin
   cd my-new-plugin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update plugin metadata**:
   - Edit `package.json` with your plugin details
   - Edit `plugin.json` with CAS runtime configuration

4. **Develop your plugin**:
   ```bash
   npm run dev
   ```

5. **Build for distribution**:
   ```bash
   npm run build
   ```

6. **Package as zip**:
   ```bash
   npm run package
   ```

## Dependencies

### CAS Core Dependencies

- `@cas/types`: TypeScript definitions and interfaces
- `@cas/ui-components`: Reusable UI components
- `@cas/core-api`: Core services and utilities

### Peer Dependencies

- `react`: ^18.2.0
- `react-dom`: ^18.2.0

## Development

### Available Scripts

- `npm run dev`: Start development with hot reload
- `npm run build`: Build plugin for production
- `npm run type-check`: Type checking only
- `npm run test`: Run tests
- `npm run package`: Package plugin as zip file
- `npm run clean`: Clean build artifacts

### Adding Components

```typescript
import React from 'react';
import { Button, Input, Modal } from '@cas/ui-components';
import { PluginContext } from '@cas/types';

interface MyComponentProps {
  context: PluginContext;
}

export const MyComponent: React.FC<MyComponentProps> = ({ context }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <Input placeholder="Enter something..." />
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <h2>Plugin Modal</h2>
          <p>This is a modal using CAS UI components!</p>
        </Modal>
      )}
    </div>
  );
};
```

### Using CAS Services

```typescript
import { PluginAdminService } from '@cas/core-api';
import { PluginMetadata } from '@cas/types';

export class MyPluginService {
  static async getPluginList(): Promise<PluginMetadata[]> {
    const response = await PluginAdminService.listPlugins();
    return response.data;
  }

  static async installPlugin(pluginData: any): Promise<boolean> {
    const response = await PluginAdminService.installPlugin(pluginData);
    return response.success;
  }
}
```

### Plugin Context Usage

```typescript
import { PluginContext, ButtonProps } from '@cas/types';

export default {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',

  initialize: async (context: PluginContext) => {
    // Register components
    context.registerComponent('MyComponent', MyComponent);

    // Register routes
    context.registerRoute('/my-plugin', MyComponent);

    // Register services
    context.registerService('myPluginService', MyPluginService);

    // Use storage
    await context.storage.set('initialized', true);

    // Listen to events
    context.events.on('user-login', (user) => {
      console.log('User logged in:', user);
    });

    // Show notification
    context.ui.showNotification('Plugin initialized!', 'success');
  },

  render: MyComponent,

  dispose: async () => {
    // Cleanup resources
    console.log('Plugin disposed');
  }
};
```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const mockContext = createMockPluginContext();
    render(<MyComponent context={mockContext} />);

    expect(screen.getByPlaceholderText('Enter something...')).toBeInTheDocument();
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
  });

  it('opens modal on button click', () => {
    const mockContext = createMockPluginContext();
    render(<MyComponent context={mockContext} />);

    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('Plugin Modal')).toBeInTheDocument();
  });
});
```

## Plugin Manifest (plugin.json)

The `plugin.json` file defines how the plugin integrates with CAS:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample CAS plugin",
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
    },
    {
      "name": "lodash",
      "version": "^4.17.21",
      "type": "peer"
    }
  ],
  "permissions": [
    "storage.read",
    "storage.write",
    "api.request",
    "dom.access"
  ],
  "casVersion": ">=1.0.0"
}
```

## Best Practices

1. **Use CAS Components**: Always prefer `@cas/ui-components` over custom UI
2. **Type Safety**: Leverage `@cas/types` for all type definitions
3. **Error Handling**: Use CAS error handling patterns
4. **Performance**: Implement code splitting for large components
5. **Security**: Follow CAS security guidelines and permissions
6. **Testing**: Write comprehensive tests for all components
7. **Documentation**: Document all public APIs and components

## Deployment

### Manual Installation

1. Build the plugin: `npm run build`
2. Create zip file: `npm run package`
3. Upload to CAS platform via Plugin Manager

### Automated Deployment

```bash
# CI/CD pipeline
npm ci
npm run type-check
npm run test
npm run build
npm run package

# Upload to CAS registry
cas-cli publish dist/plugin.zip
```

## Support

- 📖 [CAS Plugin Development Guide](../DEPENDENCY_EXTERNALIZATION_STRATEGY.md)
- 🎨 [UI Components Documentation](../../packages/cas-ui-components/README.md)
- ⚙️ [Core API Documentation](../../packages/cas-core-api/README.md)
- 📝 [Type Definitions](../../packages/cas-types/README.md)

## Contributing

1. Fork the template
2. Create a feature branch
3. Implement your plugin
4. Test thoroughly
5. Submit a pull request

## License

This plugin template follows the same license as the CAS platform.
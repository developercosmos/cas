#!/bin/bash

# CAS Plugin System Package Setup Script
# This script creates the externalized package structure for the CAS plugin system

set -e

echo "🚀 Setting up CAS Plugin System Packages..."

# Create packages directory structure
echo "📁 Creating package directories..."
mkdir -p packages/cas-types/src
mkdir -p packages/cas-ui-components/src/{components,hooks,styles}
mkdir -p packages/cas-core-api/src/{services,plugin-system,utils}
mkdir -p packages/cas-plugin-runtime/src/{sandbox,loader,registry}

# Create package.json files
echo "📦 Creating package.json files..."

# @cas/types package.json
cat > packages/cas-types/package.json << 'EOF'
{
  "name": "@cas/types",
  "version": "1.0.0",
  "description": "CAS Platform Type Definitions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "keywords": ["cas", "types", "plugin"],
  "author": "CAS Platform Team",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
EOF

# @cas/ui-components package.json
cat > packages/cas-ui-components/package.json << 'EOF'
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
    "type-check": "tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "keywords": ["cas", "ui", "components", "react"],
  "author": "CAS Platform Team",
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@cas/types": "^1.0.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "less": "^4.2.0",
    "typescript": "^5.2.2",
    "@storybook/react": "^7.0.0",
    "@storybook/react-vite": "^7.0.0"
  }
}
EOF

# @cas/core-api package.json
cat > packages/cas-core-api/package.json << 'EOF'
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
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "keywords": ["cas", "api", "core", "services"],
  "author": "CAS Platform Team",
  "license": "MIT",
  "dependencies": {
    "@cas/types": "^1.0.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.2.2",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
EOF

# @cas/plugin-runtime package.json
cat > packages/cas-plugin-runtime/package.json << 'EOF'
{
  "name": "@cas/plugin-runtime",
  "version": "1.0.0",
  "description": "CAS Plugin Runtime Environment",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "restricted"
  },
  "keywords": ["cas", "plugin", "runtime", "sandbox"],
  "author": "CAS Platform Team",
  "license": "MIT",
  "dependencies": {
    "@cas/types": "^1.0.0",
    "@cas/core-api": "^1.0.0",
    "vm2": "^3.9.19"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.2.2",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
EOF

# Create TypeScript configuration files
echo "⚙️  Creating TypeScript configurations..."

# Shared TypeScript config
cat > packages/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create package-specific tsconfig files
for package in cas-types cas-ui-components cas-core-api cas-plugin-runtime; do
  cat > packages/$package/tsconfig.json << EOF
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
EOF
done

# Create basic source files
echo "📝 Creating basic source files..."

# @cas/types index.ts
cat > packages/cas-types/src/index.ts << 'EOF'
// Re-export all types
export * from './plugin';
export * from './ui';
export * from './auth';
export * from './storage';
export * from './events';
EOF

# Create type definition files
touch packages/cas-types/src/plugin.ts
touch packages/cas-types/src/ui.ts
touch packages/cas-types/src/auth.ts
touch packages/cas-types/src/storage.ts
touch packages/cas-types/src/events.ts

# @cas/ui-components index.ts
cat > packages/cas-ui-components/src/index.ts << 'EOF'
// Re-export all components
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Textarea } from './components/Textarea';

// Re-export hooks
export { useTheme } from './hooks/useTheme';

// Re-export styles
export './styles/index.css';
EOF

# Create component files
touch packages/cas-ui-components/src/components/Button.tsx
touch packages/cas-ui-components/src/components/Input.tsx
touch packages/cas-ui-components/src/components/Textarea.tsx
touch packages/cas-ui-components/src/hooks/useTheme.ts
touch packages/cas-ui-components/src/styles/index.less

# @cas/core-api index.ts
cat > packages/cas-core-api/src/index.ts << 'EOF'
// Re-export all services
export { PluginAdminService } from './services/PluginAdminService';
export { PluginDocumentationService } from './services/PluginDocumentationService';
export { AuthService } from './services/AuthService';

// Re-export utilities
export * from './utils/validation';
export * from './utils/logger';
EOF

# Create service files
touch packages/cas-core-api/src/services/PluginAdminService.ts
touch packages/cas-core-api/src/services/PluginDocumentationService.ts
touch packages/cas-core-api/src/services/AuthService.ts
touch packages/cas-core-api/src/utils/validation.ts
touch packages/cas-core-api/src/utils/logger.ts

# @cas/plugin-runtime index.ts
cat > packages/cas-plugin-runtime/src/index.ts << 'EOF'
// Re-export runtime components
export { PluginManager } from './PluginManager';
export { PluginLoader } from './loader/PluginLoader';
export { PluginSandbox } from './sandbox/PluginSandbox';
export { PluginRegistry } from './registry/PluginRegistry';
EOF

# Create runtime files
touch packages/cas-plugin-runtime/src/PluginManager.ts
touch packages/cas-plugin-runtime/src/loader/PluginLoader.ts
touch packages/cas-plugin-runtime/src/sandbox/PluginSandbox.ts
touch packages/cas-plugin-runtime/src/registry/PluginRegistry.ts

# Update root package.json
echo "🔄 Updating root package.json..."
if [ ! -f package.json ]; then
  cat > package.json << 'EOF'
{
  "name": "cas-platform",
  "version": "1.0.0",
  "private": true,
  "description": "CAS Platform with Externalized Plugin System",
  "workspaces": [
    "packages/*",
    "frontend",
    "backend"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces --parallel",
    "clean": "npm run clean --workspaces",
    "type-check": "npm run type-check --workspaces",
    "test": "npm run test --workspaces",
    "setup": "npm install && npm run build --workspaces",
    "publish": "npm run build && npm publish --workspaces"
  },
  "devDependencies": {
    "lerna": "^7.0.0",
    "typescript": "^5.2.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF
else
  # Add workspaces if not present
  if ! grep -q '"workspaces"' package.json; then
    # Add workspaces to existing package.json
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.workspaces = ['packages/*', 'frontend', 'backend'];
      if (!pkg.scripts) pkg.scripts = {};
      pkg.scripts.build = 'npm run build --workspaces';
      pkg.scripts.dev = 'npm run dev --workspaces --parallel';
      pkg.scripts.clean = 'npm run clean --workspaces';
      pkg.scripts.typeCheck = 'npm run type-check --workspaces';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
  fi
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ CAS Plugin System Packages Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Review the created package structure in packages/"
echo "2. Copy existing types to packages/cas-types/src/"
echo "3. Copy existing UI components to packages/cas-ui-components/src/"
echo "4. Copy existing services to packages/cas-core-api/src/"
echo "5. Update frontend imports to use @cas/* packages"
echo "6. Run 'npm run build' to build all packages"
echo ""
echo "Package structure created:"
echo "📦 @cas/types - Type definitions"
echo "🎨 @cas/ui-components - UI components"
echo "⚙️  @cas/core-api - Core services and APIs"
echo "🚀 @cas/plugin-runtime - Plugin execution environment"
echo ""
echo "💡 Check DEPENDENCY_EXTERNALIZATION_STRATEGY.md for detailed implementation guide"
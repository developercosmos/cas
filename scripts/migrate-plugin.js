#!/usr/bin/env node

/**
 * CAS Plugin Migration Script
 * Migrates existing plugins to use externalized dependencies
 */

const fs = require('fs');
const path = require('path');

class PluginMigrator {
  constructor(pluginPath) {
    this.pluginPath = pluginPath;
    this.backupPath = `${pluginPath}.backup`;
    this.migrationLog = [];
  }

  log(message) {
    console.log(`📝 ${message}`);
    this.migrationLog.push(message);
  }

  async backup() {
    this.log('Creating backup of original plugin...');
    if (fs.existsSync(this.backupPath)) {
      fs.rmSync(this.backupPath, { recursive: true });
    }
    fs.cpSync(this.pluginPath, this.backupPath, { recursive: true });
    this.log(`Backup created at: ${this.backupPath}`);
  }

  async updatePackageJson() {
    this.log('Updating package.json...');

    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    let packageJson = {};

    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      // Create new package.json
      packageJson = {
        name: 'cas-plugin',
        version: '1.0.0',
        private: true
      };
    }

    // Add CAS dependencies
    if (!packageJson.dependencies) packageJson.dependencies = {};

    packageJson.dependencies['@cas/types'] = '^1.0.0';
    packageJson.dependencies['@cas/ui-components'] = '^1.0.0';
    packageJson.dependencies['@cas/core-api'] = '^1.0.0';

    // Add peer dependencies for React
    if (!packageJson.peerDependencies) packageJson.peerDependencies = {};
    packageJson.peerDependencies['react'] = '^18.2.0';
    packageJson.peerDependencies['react-dom'] = '^18.2.0';

    // Add build scripts
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts.build = 'tsc';
    packageJson.scripts.dev = 'tsc --watch';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('Updated package.json with CAS dependencies');
  }

  async createPluginManifest() {
    this.log('Creating plugin manifest...');

    const manifest = {
      id: this.getPluginId(),
      name: this.getPluginName(),
      version: '1.0.0',
      description: this.getPluginDescription(),
      author: this.getPluginAuthor(),
      entry: 'dist/index.js',
      dependencies: [
        {
          name: '@cas/types',
          version: '^1.0.0',
          type: 'core'
        },
        {
          name: '@cas/ui-components',
          version: '^1.0.0',
          type: 'core'
        },
        {
          name: '@cas/core-api',
          version: '^1.0.0',
          type: 'core'
        }
      ],
      permissions: this.inferPermissions(),
      casVersion: '>=1.0.0'
    };

    const manifestPath = path.join(this.pluginPath, 'plugin.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    this.log(`Created plugin manifest at: ${manifestPath}`);
  }

  async updateTypeScriptConfig() {
    this.log('Updating TypeScript configuration...');

    const tsConfigPath = path.join(this.pluginPath, 'tsconfig.json');
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: false,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        types: ['@cas/types']
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.test.tsx']
    };

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    this.log('Updated TypeScript configuration');
  }

  async migrateSourceFiles() {
    this.log('Migrating source files...');

    const srcPath = path.join(this.pluginPath, 'src');
    if (!fs.existsSync(srcPath)) {
      this.log('No src directory found, creating one...');
      fs.mkdirSync(srcPath, { recursive: true });
      return;
    }

    // Find all TypeScript/JavaScript files
    const files = this.getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);

    for (const file of files) {
      await this.migrateFile(file);
    }

    this.log(`Migrated ${files.length} source files`);
  }

  async migrateFile(filePath) {
    const relativePath = path.relative(this.pluginPath, filePath);
    this.log(`Migrating: ${relativePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Update imports to use CAS packages
    content = this.updateImports(content);

    // Update component usage
    content = this.updateComponentUsage(content);

    // Update service usage
    content = this.updateServiceUsage(content);

    // Update type usage
    content = this.updateTypeUsage(content);

    fs.writeFileSync(filePath, content);
  }

  updateImports(content) {
    // Import mapping for CAS dependencies
    const importMappings = {
      // Type imports
      "from ['\"]\\.{1,2}/.*types['\"]": "from '@cas/types'",
      "from ['\"]\\.{1,2}/.*types/index['\"]": "from '@cas/types'",

      // UI component imports
      "from ['\"]\\.{1,2}/.*base-ui.*styled-components['\"]": "from '@cas/ui-components'",
      "from ['\"]\\.{1,2}/.*components.*Button['\"]": "from '@cas/ui-components'",
      "from ['\"]\\.{1,2}/.*components.*Input['\"]": "from '@cas/ui-components'",
      "from ['\"]\\.{1,2}/.*components.*Textarea['\"]": "from '@cas/ui-components'",

      // Service imports
      "from ['\"]\\.{1,2}/.*services.*PluginAdminService['\"]": "from '@cas/core-api'",
      "from ['\"]\\.{1,2}/.*services.*PluginDocumentationService['\"]": "from '@cas/core-api'",
      "from ['\"]\\.{1,2}/.*services.*AuthService['\"]": "from '@cas/core-api'",

      // Common imports
      "import { PluginMetadata }": "import { PluginMetadata } from '@cas/types'",
      "import { PluginInstallRequest }": "import { PluginInstallRequest } from '@cas/types'",
    };

    for (const [pattern, replacement] of Object.entries(importMappings)) {
      const regex = new RegExp(pattern, 'g');
      content = content.replace(regex, replacement);
    }

    return content;
  }

  updateComponentUsage(content) {
    // Add Button import if not present and Button is used
    if (content.includes('<Button') && !content.includes('import.*Button.*from')) {
      if (content.includes('import React')) {
        content = content.replace(
          /import React/,
          "import React"
        );
        content = content.replace(
          /import React/,
          "import { Button } from '@cas/ui-components';\nimport React"
        );
      } else {
        content = `import { Button } from '@cas/ui-components';\n${content}`;
      }
    }

    // Similar updates for other components
    if (content.includes('<Input') && !content.includes('import.*Input.*from')) {
      if (content.includes('import { Button }')) {
        content = content.replace(
          'import { Button }',
          "import { Button, Input }"
        );
      } else {
        content = `import { Input } from '@cas/ui-components';\n${content}`;
      }
    }

    return content;
  }

  updateServiceUsage(content) {
    // Add service imports if services are used
    if (content.includes('PluginAdminService') && !content.includes('import.*PluginAdminService.*from')) {
      content = `import { PluginAdminService } from '@cas/core-api';\n${content}`;
    }

    if (content.includes('PluginDocumentationService') && !content.includes('import.*PluginDocumentationService.*from')) {
      content = `import { PluginDocumentationService } from '@cas/core-api';\n${content}`;
    }

    return content;
  }

  updateTypeUsage(content) {
    // Add type imports if types are used
    const types = ['PluginMetadata', 'PluginInstallRequest', 'PluginContext', 'User', 'AuthState'];

    for (const type of types) {
      if (content.includes(type) && !content.includes(`import.*${type}.*from`)) {
        content = `import { ${type} } from '@cas/types';\n${content}`;
        break; // Only add import once
      }
    }

    return content;
  }

  getAllFiles(dir, extensions) {
    const files = [];

    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => file.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  getPluginId() {
    // Try to extract plugin ID from package.json or use directory name
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.name || path.basename(this.pluginPath);
    }
    return path.basename(this.pluginPath);
  }

  getPluginName() {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.description || this.getPluginId();
    }
    return this.getPluginId();
  }

  getPluginDescription() {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.description || 'CAS Platform plugin';
    }
    return 'CAS Platform plugin';
  }

  getPluginAuthor() {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.author || 'Unknown';
    }
    return 'Unknown';
  }

  inferPermissions() {
    // Analyze source files to infer required permissions
    const srcPath = path.join(this.pluginPath, 'src');
    if (!fs.existsSync(srcPath)) {
      return ['storage.read', 'storage.write'];
    }

    const files = this.getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);
    const permissions = new Set();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('localStorage') || content.includes('sessionStorage')) {
        permissions.add('storage.read');
        permissions.add('storage.write');
      }

      if (content.includes('fetch') || content.includes('axios')) {
        permissions.add('api.request');
      }

      if (content.includes('document') || content.includes('window')) {
        permissions.add('dom.access');
      }
    }

    return Array.from(permissions).length > 0 ? Array.from(permissions) : ['storage.read', 'storage.write'];
  }

  async run() {
    try {
      this.log(`Starting migration for plugin at: ${this.pluginPath}`);

      if (!fs.existsSync(this.pluginPath)) {
        throw new Error(`Plugin path does not exist: ${this.pluginPath}`);
      }

      await this.backup();
      await this.updatePackageJson();
      await this.createPluginManifest();
      await this.updateTypeScriptConfig();
      await this.migrateSourceFiles();

      // Create migration report
      const reportPath = path.join(this.pluginPath, 'migration-report.json');
      const report = {
        timestamp: new Date().toISOString(),
        pluginPath: this.pluginPath,
        backupPath: this.backupPath,
        changes: this.migrationLog,
        success: true
      };

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      this.log('✅ Migration completed successfully!');
      this.log(`📊 Migration report saved to: ${reportPath}`);
      this.log('');
      this.log('Next steps:');
      this.log('1. Run `npm install` to install new dependencies');
      this.log('2. Run `npm run build` to compile the plugin');
      this.log('3. Test the plugin with the new externalized dependencies');
      this.log('4. If issues occur, restore from backup and manually fix');

    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node migrate-plugin.js <plugin-path>');
    console.log('');
    console.log('Example: node migrate-plugin.js ./my-plugin');
    console.log('         node migrate-plugin.js ./plugins/ldap-plugin');
    process.exit(1);
  }

  const pluginPath = args[0];
  const migrator = new PluginMigrator(pluginPath);
  migrator.run();
}

module.exports = PluginMigrator;
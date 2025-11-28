import React from 'react';
import { Plugin, PluginContext, PluginManifest } from '@cas/types';
import { Button, Input, Modal, Tabs } from '@cas/ui-components';
import { PluginAdminService } from '@cas/core-api';
import { MyPluginComponent } from './components/MyPlugin';
import { MyPluginService } from './services/MyPluginService';
import './styles/styles.css';

// Plugin metadata
const pluginManifest: PluginManifest = {
  id: 'cas-plugin-template',
  name: 'CAS Plugin Template',
  version: '1.0.0',
  description: 'Template plugin demonstrating CAS externalized dependencies',
  author: 'CAS Platform Team',
  permissions: ['storage.read', 'storage.write', 'api.request', 'dom.access'],
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
  ]
};

// Plugin initialization function
const initializePlugin = async (context: PluginContext): Promise<void> => {
  console.log('🚀 Initializing CAS Plugin Template...');

  try {
    // Register the main component
    context.registerComponent('TemplatePlugin', MyPluginComponent);

    // Register routes
    context.registerRoute('/plugin-template', MyPluginComponent);

    // Register service
    context.registerService('templateService', MyPluginService);

    // Initialize plugin storage
    await context.storage.set('initialized', true);
    await context.storage.set('version', pluginManifest.version);
    await context.storage.set('initializedAt', new Date().toISOString());

    // Set up event listeners
    context.events.on('cas:theme-changed', (theme) => {
      console.log('🎨 Theme changed:', theme);
      MyPluginService.updateTheme(theme);
    });

    context.events.on('cas:user-login', (user) => {
      console.log('👤 User logged in:', user.username);
      MyPluginService.trackUserActivity(user);
    });

    // Show initialization notification
    context.ui.showNotification(
      'Plugin Template initialized successfully!',
      'success'
    );

    console.log('✅ CAS Plugin Template initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize plugin:', error);
    context.ui.showNotification(
      `Plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
    throw error;
  }
};

// Plugin dispose function
const disposePlugin = async (): Promise<void> => {
  console.log('🧹 Disposing CAS Plugin Template...');

  try {
    // Cleanup resources
    await MyPluginService.cleanup();

    // Clear any timers or intervals
    MyPluginService.clearTimers();

    console.log('✅ CAS Plugin Template disposed successfully');

  } catch (error) {
    console.error('❌ Failed to dispose plugin:', error);
  }
};

// Main plugin export
const plugin: Plugin = {
  id: pluginManifest.id,
  name: pluginManifest.name,
  version: pluginManifest.version,
  manifest: pluginManifest,
  initialize: initializePlugin,
  render: MyPluginComponent,
  dispose: disposePlugin
};

// Export for different environments
export default plugin;

// Export components for external usage (if needed)
export { MyPluginComponent } from './components/MyPlugin';
export { MyPluginService } from './services/MyPluginService';

// Development mode exports
if (process.env.NODE_ENV === 'development') {
  // Make plugin available in global scope for debugging
  (globalThis as any).__CAS_PLUGIN_TEMPLATE__ = plugin;
}
import { Router } from 'express';
import { createRoutes } from './routes.js';
import { NavigationService } from './NavigationService.js';
import type { Plugin, PluginContext, PluginMetadata } from './types.js';

class MenuNavigationPlugin implements Plugin {
  readonly id = 'menu-navigation';
  readonly name = 'Menu Navigation System';
  readonly version = '1.0.0';
  
  readonly metadata: PluginMetadata = {
    description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
    author: 'CAS Development Team',
    license: 'MIT',
    keywords: ['navigation', 'menu', 'ui', 'accessibility', 'keyboard'],
    permissions: [
      'navigation:view',
      'navigation:configure',
      'navigation:manage'
    ],
    category: 'user-interface',
    isSystem: true,
    casVersion: '>=1.0.0',
    nodeVersion: '>=18.0.0',
    configSchema: {
      enableKeyboardShortcut: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable Ctrl+K keyboard shortcut'
      },
      keyboardShortcut: {
        type: 'string',
        required: false,
        default: 'Ctrl+K',
        description: 'Keyboard shortcut to open navigation'
      },
      maxItemsPerCategory: {
        type: 'number',
        required: false,
        default: 50,
        description: 'Maximum items to display per category'
      }
    }
  };

  private context?: PluginContext;
  private navigationService?: NavigationService;
  private router?: Router;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const { logger, services } = context;

    logger.info(`Initializing ${this.name} v${this.version}`);

    this.navigationService = new NavigationService(services.database);

    await this.createDatabaseSchema(services.database);
    await this.registerPluginInDatabase(services.database);

    this.router = createRoutes(
      this.navigationService,
      services.auth.getCurrentUser
    );

    logger.info(`${this.name} initialized successfully`);
  }

  private async createDatabaseSchema(db: any): Promise<void> {
    // Tables will be created via migration
  }

  private async registerPluginInDatabase(db: any): Promise<void> {
    // Basic registration - will be expanded
  }

  async activate(): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    const { logger } = this.context;
    logger.info(`Activating ${this.name}`);

    await this.navigationService?.initializeDefaultModules();

    logger.info(`${this.name} activated successfully`);
  }

  async deactivate(): Promise<void> {
    if (!this.context) return;

    const { logger } = this.context;
    logger.info(`Deactivating ${this.name}`);
    logger.info(`${this.name} deactivated successfully`);
  }

  async uninstall(): Promise<void> {
    if (!this.context) return;

    const { logger } = this.context;
    logger.info(`Uninstalling ${this.name}`);
    logger.info(`${this.name} uninstalled successfully`);
  }

  getRouter(): Router {
    if (!this.router) {
      throw new Error('Plugin not initialized');
    }
    return this.router;
  }

  getService(): NavigationService {
    if (!this.navigationService) {
      throw new Error('Plugin not initialized');
    }
    return this.navigationService;
  }
}

export const plugin = new MenuNavigationPlugin();

export default {
  id: plugin.id,
  name: plugin.name,
  version: plugin.version,
  description: plugin.metadata.description,
  author: plugin.metadata.author,
  entry: '/src/plugins/navigation/index.ts',
  status: 'enabled' as const,
  isSystem: true,
  routes: null,
  plugin
};

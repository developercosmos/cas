import { Router } from 'express';
import { Pool } from 'pg';
import { createRoutes } from './routes.js';
import { NavigationService } from './NavigationService.js';
import type { PluginContext, PluginMetadata } from './types.js';

interface Plugin {
  id: string;
  name: string;
  version: string;
  metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  uninstall(): Promise<void>;
  getRouter(): Router;
}

class MenuNavigationPlugin implements Plugin {
  readonly id = 'menu-navigation';
  readonly name = 'Menu Navigation System';
  readonly version = '1.0.0';
  
  readonly metadata: PluginMetadata = {
    description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
    author: 'CAS Development Team',
    license: 'MIT',
    keywords: ['navigation', 'menu', 'ui', 'accessibility', 'keyboard', 'search', 'filter'],
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
      },
      searchEnabled: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable search functionality'
      },
      sortOptions: {
        type: 'string',
        required: false,
        default: ['name', 'plugin', 'sortOrder'],
        description: 'Available sort options'
      },
      theme: {
        type: 'string',
        required: false,
        default: 'auto',
        description: 'Theme preference (auto, light, dark)'
      }
    }
  };

  private context?: PluginContext;
  private navigationService?: NavigationService;
  private router?: Router;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const { logger, services } = context;

    console.log(`Initializing ${this.name} v${this.version}`);

    this.navigationService = new NavigationService(services.database);

    await this.createDatabaseSchema(services.database);
    await this.registerPluginInDatabase(services.database);

    this.router = createRoutes(
      this.navigationService,
      services.auth.getCurrentUser
    );

    console.log(`${this.name} initialized successfully`);
  }

  private async createDatabaseSchema(db: any): Promise<void> {
    try {
      const fs = await import('fs');
      const migrationPath = new URL('./database/migrations/20251129_create_navigation_tables.sql', import.meta.url);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await db.execute(migrationSQL);
      console.log('Navigation database schema created successfully');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('Navigation database schema already exists');
      } else {
        console.error('Error creating navigation schema:', error);
        throw error;
      }
    }
  }

  private async registerPluginInDatabase(db: any): Promise<void> {
    try {
      await db.execute(`
        INSERT INTO plugin.plugin_configurations (
          Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, Category, 
          IsSystem, PluginStatus, PluginEntry, Permissions, CreatedAt, UpdatedAt
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        ) ON CONFLICT (PluginId) DO UPDATE SET
          PluginName = $2, PluginVersion = $3, PluginDescription = $4, PluginAuthor = $5,
          Category = $6, IsSystem = $7, PluginStatus = $8, PluginEntry = $9,
          Permissions = $10, UpdatedAt = NOW()
      `, [
        this.id, this.name, this.version, this.metadata.description,
        this.metadata.author, this.metadata.category, this.metadata.isSystem,
        'enabled', '/src/plugins/navigation/index.ts', 
        JSON.stringify(this.metadata.permissions)
      ]);

      const apiEndpoints = [
        {
          endpoint: '/api/plugins/menu-navigation/modules',
          method: 'GET',
          description: 'Get user-accessible navigation modules',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Returns list of modules current user can access based on permissions.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/search',
          method: 'GET',
          description: 'Search navigation modules',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Search modules by name, description, or plugin ID.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/config',
          method: 'GET',
          description: 'Get navigation configuration',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Returns current navigation system configuration.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/config',
          method: 'PUT',
          description: 'Update navigation configuration',
          requiresAuth: true,
          permissions: ['navigation:configure'],
          documentation: 'Update navigation system configuration.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/modules',
          method: 'POST',
          description: 'Add navigation module',
          requiresAuth: true,
          permissions: ['navigation:manage'],
          documentation: 'Add new navigation module to system.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/status',
          method: 'GET',
          description: 'Plugin health check and statistics',
          requiresAuth: false,
          permissions: [],
          documentation: 'Returns plugin status, statistics, and health information.'
        }
      ];

      for (const api of apiEndpoints) {
        await db.execute(`
          INSERT INTO plugin.plugin_api_registry (
            id, pluginId, apiEndpoint, httpMethod, description,
            requiresAuth, requiredPermissions, documentation, isActive, createdAt, updatedAt
          ) VALUES (
            gen_random_uuid(), 
            (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
            $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
          ) ON CONFLICT (pluginId, apiEndpoint, httpMethod) DO UPDATE SET
            description = $4, requiredPermissions = $6, documentation = $7,
            isActive = true, updatedAt = NOW()
        `, [
          this.id, api.endpoint, api.method, api.description,
          api.requiresAuth, JSON.stringify(api.permissions), api.documentation
        ]);
      }

    } catch (error) {
      console.error('Failed to register navigation plugin:', error);
      throw error;
    }
  }

  async activate(): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    const { logger } = this.context;
    console.log(`Activating ${this.name}`);

    await this.navigationService?.initializeDefaultModules();

    console.log(`${this.name} activated successfully`);
  }

  async deactivate(): Promise<void> {
    if (!this.context) return;

    const { logger } = this.context;
    console.log(`Deactivating ${this.name}`);
    console.log(`${this.name} deactivated successfully`);
  }

  async uninstall(): Promise<void> {
    if (!this.context) return;

    const { logger, services } = this.context;
    console.log(`Uninstalling ${this.name}`);

    const db = services.database;
    try {
      await db.execute('DELETE FROM plugin.plugin_api_registry WHERE pluginId = $1', [this.id]);
      await db.execute('DELETE FROM plugin.plugin_configurations WHERE pluginId = $1', [this.id]);

      console.log(`${this.name} uninstalled successfully`);
    } catch (error) {
      console.error(`Failed to uninstall ${this.name}:`, error);
      throw error;
    }
  }

  getRouter(): Router {
    if (!this.router) {
      this.router = createRoutes(
        new NavigationService(new Pool()),
        (req: any, res: any, next: any) => {
          const token = req.headers.authorization?.replace('Bearer ', '');
          if (token) {
            req.user = {
              id: 'test-user',
              username: 'testuser',
              permissions: ['navigation:view', 'plugin.admin', 'user_access.admin']
            };
          }
          next();
        }
      );
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

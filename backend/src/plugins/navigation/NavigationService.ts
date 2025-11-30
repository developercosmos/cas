import { DatabaseService } from '../../services/DatabaseService.js';
import type { NavigationModule, NavigationConfig } from './types';

export class NavigationService {
  // Always use DatabaseService directly for consistency
  private db = DatabaseService;

  async initializeDefaultModules(): Promise<void> {
    try {
      // Add sample navigation modules
      const defaultModules = [
        {
          name: 'Plugin Manager',
          description: 'Manage system plugins and configurations',
          pluginId: 'plugin-manager',
          requiresAuth: true,
          requiredPermissions: ['plugin.admin'],
          route: '/admin/plugins',
          sortOrder: 10,
          isActive: true
        },
        {
          name: 'User Management',
          description: 'Manage users and access control',
          pluginId: 'user-access-management',
          requiresAuth: true,
          requiredPermissions: ['user_access.admin'],
          route: '/admin/users',
          sortOrder: 20,
          isActive: true
        },
        {
          name: 'LDAP Configuration',
          description: 'Configure LDAP authentication',
          pluginId: 'ldap-auth',
          requiresAuth: true,
          requiredPermissions: ['ldap.configure'],
          route: '/admin/ldap',
          sortOrder: 30,
          isActive: true
        },
        {
          name: 'LDAP Test',
          description: 'Test LDAP connection and browse directory',
          pluginId: 'ldap-auth',
          requiresAuth: true,
          requiredPermissions: ['ldap.test'],
          route: '/admin/ldap/test',
          sortOrder: 32,
          isActive: true
        },
        {
          name: 'LDAP Manage Users',
          description: 'Manage LDAP user import and synchronization',
          pluginId: 'ldap-auth',
          requiresAuth: true,
          requiredPermissions: ['ldap.manage_users'],
          route: '/admin/ldap/users',
          sortOrder: 34,
          isActive: true
        },
        {
          name: 'Dashboard',
          description: 'Main application dashboard',
          pluginId: 'system',
          requiresAuth: true,
          requiredPermissions: [],
          route: '/dashboard',
          sortOrder: 1,
          isActive: true
        },
        {
          name: 'Documentation',
          description: 'System documentation and guides',
          pluginId: 'system',
          requiresAuth: true,
          requiredPermissions: [],
          route: '/docs',
          sortOrder: 5,
          isActive: true
        }
      ];

      for (const module of defaultModules) {
        await this.db.execute(`
          INSERT INTO plugin.navigation_modules (
            name, description, pluginId, requiresAuth, requiredPermissions,
            route, sortOrder, isActive, createdAt, updatedAt
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          ) ON CONFLICT (name) DO UPDATE SET
            description = $2, sortOrder = $7, isActive = $8, updatedAt = NOW()
        `, [
          module.name, module.description, module.pluginId, module.requiresAuth,
          module.requiredPermissions, module.route, module.sortOrder, module.isActive
        ]);
      }

      // Initialize default configuration
      const defaultConfig = {
        enableKeyboardShortcut: true,
        keyboardShortcut: 'Ctrl+K',
        maxItemsPerCategory: 50,
        searchEnabled: true,
        sortOptions: ['name', 'plugin', 'sortOrder'],
        theme: 'auto'
      };

      await this.db.execute(`
        INSERT INTO plugin.navigation_config (configKey, configValue, createdAt, updatedAt)
        VALUES ('settings', $1, NOW(), NOW())
        ON CONFLICT (configKey) DO UPDATE SET
          configValue = $1, updatedAt = NOW()
      `, [defaultConfig]);

    } catch (error) {
      console.error('Error initializing default navigation modules:', error);
    }
  }

  async getUserAccessibleModules(userId?: string): Promise<NavigationModule[]> {
    try {
      // If user ID provided, filter by permissions
      if (userId) {
        // Get user permissions via User Access Management plugin
        const userPermissions = await this.getUserPermissions(userId);

        const query = `
          SELECT id, name, description, pluginId, requiresAuth, requiredPermissions,
                 route, sortOrder, icon, isActive, createdAt, updatedAt
          FROM plugin.navigation_modules
          WHERE isActive = true
            AND (requiresAuth = false OR requiredPermissions && $1)
          ORDER BY sortOrder ASC, name ASC
        `;

        const result = await this.db.query(query, [userPermissions]);
        return result || [];
      } else {
        // Return all public modules
        const query = `
          SELECT id, name, description, pluginId, requiresAuth, requiredPermissions,
                 route, sortOrder, icon, isActive, createdAt, updatedAt
          FROM plugin.navigation_modules
          WHERE isActive = true AND requiresAuth = false
          ORDER BY sortOrder ASC, name ASC
        `;

        const result = await this.db.query(query);
        return result || [];
      }
    } catch (error) {
      console.error('Error getting user accessible modules:', error);
      return [];
    }
  }

  async searchModules(query: string, userId?: string): Promise<NavigationModule[]> {
    try {
      const searchQuery = `%${query}%`;

      if (userId) {
        const userPermissions = await this.getUserPermissions(userId);

        const dbQuery = `
          SELECT id, name, description, pluginId, requiresAuth, requiredPermissions,
                 route, sortOrder, icon, isActive, createdAt, updatedAt
          FROM plugin.navigation_modules
          WHERE isActive = true
            AND (requiresAuth = false OR requiredPermissions && $1)
            AND (name ILIKE $2 OR description ILIKE $2 OR pluginId ILIKE $2)
          ORDER BY sortOrder ASC, name ASC
        `;

        const result = await this.db.query(dbQuery, [userPermissions, searchQuery]);
        return result || [];
      } else {
        const dbQuery = `
          SELECT id, name, description, pluginId, requiresAuth, requiredPermissions,
                 route, sortOrder, icon, isActive, createdAt, updatedAt
          FROM plugin.navigation_modules
          WHERE isActive = true
            AND requiresAuth = false
            AND (name ILIKE $1 OR description ILIKE $1 OR pluginId ILIKE $1)
          ORDER BY sortOrder ASC, name ASC
        `;

        const result = await this.db.query(dbQuery, [searchQuery]);
        return result || [];
      }
    } catch (error) {
      console.error('Error searching modules:', error);
      return [];
    }
  }

  async getConfiguration(): Promise<NavigationConfig | null> {
    try {
      const config = await this.db.queryOne(`
        SELECT configValue
        FROM plugin.navigation_config
        WHERE configKey = 'settings'
      `);

      if (config) {
        return config.configValue as NavigationConfig;
      }

      // Return default configuration
      return {
        enableKeyboardShortcut: true,
        keyboardShortcut: 'Ctrl+K',
        maxItemsPerCategory: 50,
        searchEnabled: true,
        sortOptions: ['name', 'plugin', 'sortOrder'],
        theme: 'auto'
      };
    } catch (error) {
      console.error('Error getting navigation configuration:', error);
      return null;
    }
  }

  async updateConfiguration(config: Partial<NavigationConfig>): Promise<boolean> {
    try {
      // Get existing config
      const existingConfig = await this.getConfiguration();
      
      if (existingConfig) {
        // Merge with existing config
        const updatedConfig = { ...existingConfig, ...config };
        
        await this.db.execute(`
          UPDATE plugin.navigation_config
          SET configValue = $1, updatedAt = NOW()
          WHERE configKey = 'settings'
        `, [updatedConfig]);
      } else {
        // Create new config
        await this.db.execute(`
          INSERT INTO plugin.navigation_config (configKey, configValue, createdAt, updatedAt)
          VALUES ('settings', $1, NOW(), NOW())
        `, [config]);
      }

      return true;
    } catch (error) {
      console.error('Error updating navigation configuration:', error);
      return false;
    }
  }

  async addModule(module: Omit<NavigationModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      await this.db.execute(`
        INSERT INTO plugin.navigation_modules (
          name, description, pluginId, requiresAuth, requiredPermissions,
          route, sortOrder, icon, isActive, createdAt, updatedAt
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        module.name, module.description, module.pluginId, module.requiresAuth,
        module.requiredPermissions, module.route, module.sortOrder, module.icon,
        module.isActive
      ]);

      return true;
    } catch (error) {
      console.error('Error adding navigation module:', error);
      return false;
    }
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Try to call User Access Management plugin API
      const result = await this.db.queryOne(`
        SELECT * FROM plugin.plugin_api_registry 
        WHERE pluginId = 'user-access-management' 
        AND apiEndpoint = '/api/user-access/users/:userId/permissions' 
        AND httpMethod = 'GET' 
        AND isActive = true
      `);

      if (result) {
        // For now, return basic permissions plus LDAP permissions for testing
        // In a real implementation, this would make an HTTP call
        return ['navigation:view', 'ldap.configure', 'ldap.test', 'ldap.manage_users']; // Default permissions
      }

      return ['navigation:view', 'ldap.configure', 'ldap.test', 'ldap.manage_users']; // Default permissions for logged-in users
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return ['navigation:view']; // Fallback permission
    }
  }
}

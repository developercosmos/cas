import { PluginMetadata, PluginConfig, PluginInstallRequest, PluginOperationResponse } from '../types/plugin';

import { DatabaseService } from './DatabaseService.js';

export class PluginService {
  private plugins: Map<string, PluginMetadata> = new Map();
  private configs: Map<string, PluginConfig> = new Map();

  constructor() {
    this.initializeDefaultPlugins();
  }

  private initializeDefaultPlugins(): void {
    const defaultPlugin: PluginMetadata = {
      id: 'text-block',
      name: 'Text Block',
      version: '1.0.0',
      description: 'A simple text block plugin',
      author: 'System',
      permissions: ['storage.read', 'storage.write'],
      entry: 'TextBlockPlugin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.plugins.set(defaultPlugin.id, defaultPlugin);
    
    const defaultConfig: PluginConfig = {
      id: 'text-block-config',
      pluginId: defaultPlugin.id,
      config: { maxBlocks: 10, fontSize: '14px' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.configs.set(defaultConfig.id, defaultConfig);
  }

  async listPlugins(): Promise<PluginMetadata[]> {
    return Array.from(this.plugins.values());
  }

  async getPlugin(id: string): Promise<PluginMetadata | null> {
    return this.plugins.get(id) || null;
  }

  async installPlugin(request: PluginInstallRequest): Promise<PluginOperationResponse> {
    try {
      if (this.plugins.has(request.id)) {
        return {
          success: false,
          message: 'Plugin with this ID already exists'
        };
      }

      const plugin: PluginMetadata = {
        ...request,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.plugins.set(request.id, plugin);

      const config: PluginConfig = {
        id: `${request.id}-config`,
        pluginId: request.id,
        config: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.configs.set(config.id, config);

      return {
        success: true,
        message: 'Plugin installed successfully',
        plugin
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async uninstallPlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      this.plugins.delete(id);
      
      const configId = `${id}-config`;
      this.configs.delete(configId);

      return {
        success: true,
        message: 'Plugin uninstalled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to uninstall plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async enablePlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      plugin.status = 'active';
      plugin.updatedAt = new Date();
      this.plugins.set(id, plugin);

      const config = this.configs.get(`${id}-config`);
      if (config) {
        config.isActive = true;
        config.updatedAt = new Date();
        this.configs.set(`${id}-config`, config);
      }

      return {
        success: true,
        message: 'Plugin enabled successfully',
        plugin
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to enable plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disablePlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      plugin.status = 'disabled';
      plugin.updatedAt = new Date();
      this.plugins.set(id, plugin);

      const config = this.configs.get(`${id}-config`);
      if (config) {
        config.isActive = false;
        config.updatedAt = new Date();
        this.configs.set(`${id}-config`, config);
      }

      return {
        success: true,
        message: 'Plugin disabled successfully',
        plugin
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to disable plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async updatePluginConfig(id: string, config: Record<string, any>): Promise<PluginOperationResponse> {
    try {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      const configId = `${id}-config`;
      const existingConfig = this.configs.get(configId);
      
      if (!existingConfig) {
        const newConfig: PluginConfig = {
          id: configId,
          pluginId: id,
          config,
          isActive: plugin.status === 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.configs.set(configId, newConfig);
      } else {
        existingConfig.config = { ...existingConfig.config, ...config };
        existingConfig.updatedAt = new Date();
        this.configs.set(configId, existingConfig);
      }

      return {
        success: true,
        message: 'Plugin configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update plugin configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getPluginConfig(id: string): Promise<PluginConfig | null> {
    return this.configs.get(`${id}-config`) || null;
  }

  // Constitution: Load LDAP plugin dynamically
  private async loadLdapPlugin(): Promise<void> {
    try {
      // Constitution: LDAP plugin registered statically
      const plugin: any = {
        id: 'ldap-auth',
        name: 'LDAP Authentication',
        version: '1.0.0',
        description: 'LDAP authentication plugin',
        author: 'System',
        entry: 'index.js',
        status: 'active',
        permissions: ['authenticate', 'configure', 'test', 'import'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (plugin && plugin.status === 'active') {
        this.plugins.set(plugin.id, plugin);
        
        // Constitution: Create default LDAP config if not exists
        const configExists = await DatabaseService.queryOne(
          'SELECT id FROM plugin.plugin_configurations WHERE pluginid = $1',
          [plugin.id]
        );
        
        if (!configExists) {
          await DatabaseService.execute(
            `INSERT INTO plugin.plugin_configurations 
               (pluginid, pluginname, pluginversion, plugindescription, pluginauthor, pluginentry, pluginstatus, issystem, createdat, updatedat)
               VALUES ($1, $2, $3, $4, $5, $6, 'enabled', true, NOW(), NOW())`,
            [plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, plugin.entry]
          );
        }
        
        console.log(`🔌 Loaded LDAP plugin: ${plugin.name} v${plugin.version}`);
      }
    } catch (error) {
      console.error('❌ Failed to load LDAP plugin:', error);
    }
  }

  // Constitution: Get plugin for authentication
  async getAuthPlugin(pluginId: string): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    return plugin;
  }
}

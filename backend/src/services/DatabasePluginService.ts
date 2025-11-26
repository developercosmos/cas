import { PluginMetadata, PluginConfig, PluginInstallRequest, PluginOperationResponse } from '../types/plugin';
import { DatabaseService } from './DatabaseService.js';
import { PluginConfiguration } from '../types/database';

export class DatabasePluginService {
  static async listPlugins(): Promise<PluginMetadata[]> {
    try {
      const plugins = await DatabaseService.query<any>(
        `SELECT 
           id,
           pluginid,
           pluginname,
           pluginversion,
           plugindescription,
           pluginauthor,
           pluginentry,
           pluginstatus,
           issystem,
           createdat,
           updatedat
         FROM plugin.plugin_configurations 
         ORDER BY createdat DESC`
      );

      return plugins.map(plugin => ({
        id: plugin.pluginid,
        name: plugin.pluginname,
        version: plugin.pluginversion,
        description: plugin.plugindescription || undefined,
        author: plugin.pluginauthor || undefined,
        permissions: ['storage.read', 'storage.write'], // Default permissions
        entry: plugin.pluginentry,
        status: plugin.pluginstatus as 'active' | 'disabled' | 'error',
        createdAt: plugin.createdat,
        updatedAt: plugin.updatedat,
        isSystem: plugin.issystem || false
      }));
    } catch (error) {
      throw new Error(`Failed to list plugins: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPlugin(id: string): Promise<PluginMetadata | null> {
    try {
      const plugin = await DatabaseService.queryOne<any>(
        `SELECT 
           id,
           pluginid,
           pluginname,
           pluginversion,
           plugindescription,
           pluginauthor,
           pluginentry,
           pluginstatus,
           issystem,
           createdat,
           updatedat
          FROM plugin.plugin_configurations 
          WHERE pluginid = $1`,
         [id]
      );

      if (!plugin) {
        return null;
      }

      return {
        id: plugin.Id,
        name: plugin.PluginName,
        version: plugin.PluginVersion,
        description: plugin.PluginDescription || undefined,
        author: plugin.PluginAuthor || undefined,
        permissions: ['storage.read', 'storage.write'], // Default permissions
        entry: plugin.PluginEntry,
        status: plugin.PluginStatus as 'active' | 'disabled' | 'error',
        createdAt: plugin.CreatedAt,
        updatedAt: plugin.UpdatedAt,
        isSystem: plugin.IsSystem || false
      };
    } catch (error) {
      throw new Error(`Failed to get plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async installPlugin(request: PluginInstallRequest): Promise<PluginOperationResponse> {
    try {
      // Check if plugin already exists
      const existingPlugin = await DatabaseService.queryOne<{ count: number }>(
        'SELECT COUNT(*)::integer as count FROM plugin.plugin_configurations WHERE PluginId = $1',
        [request.id]
      );

      if (existingPlugin?.count && existingPlugin.count > 0) {
        return {
          success: false,
          message: 'Plugin with this ID already exists'
        };
      }

      // Insert new plugin configuration
      const newPlugin = await DatabaseService.queryOne<PluginConfiguration>(
        `INSERT INTO plugin.plugin_configurations 
           (PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, IsSystem, CreatedAt, UpdatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', FALSE, NOW(), NOW())
         RETURNING Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, CreatedAt, UpdatedAt`,
        [
          request.id,
          request.name,
          request.version,
          request.description || null,
          request.author || null,
          request.entry
        ]
      );

      if (!newPlugin) {
        return {
          success: false,
          message: 'Failed to install plugin'
        };
      }

      const pluginMetadata: PluginMetadata = {
        id: newPlugin.PluginId,
        name: newPlugin.PluginName,
        version: newPlugin.PluginVersion,
        description: newPlugin.PluginDescription || undefined,
        author: newPlugin.PluginAuthor || undefined,
        permissions: request.permissions,
        entry: newPlugin.PluginEntry,
        status: 'active',
        createdAt: newPlugin.CreatedAt,
        updatedAt: newPlugin.UpdatedAt
      };

      return {
        success: true,
        message: 'Plugin installed successfully',
        plugin: pluginMetadata
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async uninstallPlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const plugin = await DatabaseService.queryOne<PluginConfiguration>(
        'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1 AND IsSystem = FALSE',
        [id]
      );

      if (!plugin) {
        return {
          success: false,
          message: 'Plugin not found or cannot un-install system plugin'
        };
      }

      // Delete plugin configuration (cascade will delete related data)
      await DatabaseService.execute(
        'DELETE FROM plugin.plugin_configurations WHERE PluginId = $1',
        [id]
      );

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

  static async enablePlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const result = await DatabaseService.queryOne<PluginConfiguration>(
        `UPDATE plugin.plugin_configurations 
         SET PluginStatus = 'active', UpdatedAt = NOW()
         WHERE PluginId = $1
         RETURNING Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, CreatedAt, UpdatedAt`,
        [id]
      );

      if (!result) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      const pluginMetadata: PluginMetadata = {
        id: result.PluginId,
        name: result.PluginName,
        version: result.PluginVersion,
        description: result.PluginDescription || undefined,
        author: result.PluginAuthor || undefined,
        permissions: ['storage.read', 'storage.write'],
        entry: result.PluginEntry,
        status: 'active',
        createdAt: result.CreatedAt,
        updatedAt: result.UpdatedAt
      };

      return {
        success: true,
        message: 'Plugin enabled successfully',
        plugin: pluginMetadata
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to enable plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async disablePlugin(id: string): Promise<PluginOperationResponse> {
    try {
      const result = await DatabaseService.queryOne<PluginConfiguration>(
        `UPDATE plugin.plugin_configurations 
         SET PluginStatus = 'disabled', UpdatedAt = NOW()
         WHERE PluginId = $1
         RETURNING Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, CreatedAt, UpdatedAt`,
        [id]
      );

      if (!result) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      const pluginMetadata: PluginMetadata = {
        id: result.PluginId,
        name: result.PluginName,
        version: result.PluginVersion,
        description: result.PluginDescription || undefined,
        author: result.PluginAuthor || undefined,
        permissions: ['storage.read', 'storage.write'],
        entry: result.PluginEntry,
        status: 'disabled',
        createdAt: result.CreatedAt,
        updatedAt: result.UpdatedAt
      };

      return {
        success: true,
        message: 'Plugin disabled successfully',
        plugin: pluginMetadata
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to disable plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async updatePluginConfig(id: string, config: Record<string, any>): Promise<PluginOperationResponse> {
    try {
      const result = await DatabaseService.queryOne<PluginConfiguration>(
        'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1',
        [id]
      );

      if (!result) {
        return {
          success: false,
          message: 'Plugin not found'
        };
      }

      // Update plugin configuration
      await DatabaseService.execute(
        `UPDATE plugin.plugin_configurations 
         SET Config = $1, UpdatedAt = NOW()
         WHERE PluginId = $2`,
        [JSON.stringify(config), id]
      );

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

  static async getPluginConfig(id: string): Promise<PluginConfig | null> {
    try {
      const config = await DatabaseService.queryOne<{
        Config: Record<string, any>;
        IsActive: boolean;
      }>(
        `SELECT Config, IsActive FROM plugin.plugin_configurations WHERE PluginId = $1`,
        [id]
      );

      if (!config) {
        return null;
      }

      return {
        id: `${id}-config`,
        pluginId: id,
        config: typeof config.Config === 'string' ? JSON.parse(config.Config) : config.Config,
        isActive: config.IsActive,
        createdAt: new Date(), // Would need to be stored properly
        updatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get plugin configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

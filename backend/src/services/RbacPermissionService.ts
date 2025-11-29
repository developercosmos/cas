/**
 * RBAC Permission Management Service
 * Provides comprehensive Role-Based Access Control for plugin permissions
 */

import { DatabaseService } from './DatabaseService.js';
import { RbacPermission } from '../types/plugin.js';

export interface UserPermission {
  userId: string;
  pluginId: string;
  permissionName: string;
  resourceType: string;
  resourceId?: string;
  isGranted: boolean;
  grantedAt: Date;
  grantedBy?: string;
}

export interface PermissionCheck {
  userId: string;
  permission: string;
  resourceId?: string;
  pluginId?: string;
}

export class RbacPermissionService {
  /**
   * Get all permissions for a specific user and plugin
   */
  async getPluginPermissions(pluginId: string, userId: string): Promise<RbacPermission[]> {
    try {
      const query = `
        SELECT DISTINCT 
          rp.PermissionName as permissionname,
          rp.ResourceType as resourcetype,
          rp.ResourceId as resourceid,
          rp.Description as description,
          rp.IsSystemLevel as issystemlevel
        FROM plugin.plugin_rbac_permissions rp
        WHERE rp.PluginId = (
          SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1
        )
        ORDER BY rp.ResourceType, rp.PermissionName
      `;
      
      const result = await DatabaseService.query<any>(query, [pluginId]);
      
      return result.map(row => ({
        name: row.permissionname || '',
        resourceType: (row.resourcetype as 'field' | 'object' | 'data' | 'action') || 'action',
        resourceId: row.resourceid || undefined,
        description: row.description || '',
        isSystemLevel: row.issystemlevel || false
      }));
    } catch (error) {
      console.error('Error getting plugin permissions:', error);
      throw new Error(`Failed to get permissions for plugin ${pluginId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's granted permissions for a plugin
   */
  async getUserPermissions(pluginId: string, userId: string): Promise<UserPermission[]> {
    try {
      const query = `
        SELECT 
          u.Username as userId,
          pc.PluginId as pluginId,
          upp.PermissionName,
          upp.ResourceType,
          upp.ResourceId,
          upp.IsGranted,
          upp.GrantedAt,
          ub.Username as grantedBy
        FROM plugin.user_plugin_permissions upp
        JOIN auth.users u ON upp.UserId = u.Id
        JOIN plugin.plugin_configurations pc ON upp.PluginId = pc.Id
        LEFT JOIN auth.users ub ON upp.GrantedBy = ub.Id
        WHERE pc.PluginId = $1 AND u.Id = $2
        ORDER BY upp.PermissionName
      `;
      
      const result = await DatabaseService.query<UserPermission>(query, [pluginId, userId]);
      return result;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw new Error(`Failed to get user permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Grant a permission to a user for a plugin
   */
  async grantPluginPermission(pluginId: string, userId: string, permissionName: string, grantedBy?: string): Promise<void> {
    try {
      const client = await DatabaseService.getClient();
      
      // First get the plugin and permission details
      const pluginQuery = `SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1`;
      const pluginResult = await client.query(pluginQuery, [pluginId]);
      
      if (pluginResult.rows.length === 0) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      const pluginInternalId = pluginResult.rows[0].id;
      
      // Check if permission exists
      const permissionQuery = `
        SELECT PermissionName, ResourceType, ResourceId 
        FROM plugin.plugin_rbac_permissions 
        WHERE PluginId = $1 AND PermissionName = $2
      `;
      const permissionResult = await client.query(permissionQuery, [pluginInternalId, permissionName]);
      
      if (permissionResult.rows.length === 0) {
        throw new Error(`Permission ${permissionName} not found for plugin ${pluginId}`);
      }
      
      const permission = permissionResult.rows[0];
      
      // Grant the permission (INSERT ... ON CONFLICT ... UPDATE)
      const upsertQuery = `
        INSERT INTO plugin.user_plugin_permissions 
        (UserId, PluginId, PermissionName, ResourceType, ResourceId, IsGranted, GrantedAt, GrantedBy)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        ON CONFLICT (UserId, PluginId, PermissionName, ResourceType, ResourceId)
        DO UPDATE SET 
          IsGranted = $6,
          GrantedAt = NOW(),
          GrantedBy = $7
      `;
      
      await client.query(upsertQuery, [
        userId,
        pluginInternalId,
        permissionName,
        permission.resourcetype,
        permission.resourceid,
        true,
        grantedBy
      ]);
      
      client.release();
      
      console.log(`✅ Granted permission ${permissionName} to user ${userId} for plugin ${pluginId}`);
    } catch (error) {
      console.error('Error granting permission:', error);
      throw new Error(`Failed to grant permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revoke a permission from a user for a plugin
   */
  async revokePluginPermission(pluginId: string, userId: string, permissionName: string): Promise<void> {
    try {
      const query = `
        UPDATE plugin.user_plugin_permissions 
        SET IsGranted = false, GrantedAt = NOW()
        WHERE PluginId = (
          SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1
        ) AND UserId = $2 AND PermissionName = $3
      `;
      
      const result = await DatabaseService.query(query, [pluginId, userId, permissionName]);
      
      if (result.length === 0) {
        throw new Error(`Permission ${permissionName} not found for user ${userId} and plugin ${pluginId}`);
      }
      
      console.log(`✅ Revoked permission ${permissionName} from user ${userId} for plugin ${pluginId}`);
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw new Error(`Failed to revoke permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(userId: string, permission: string, resourceId?: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as has_permission
        FROM plugin.user_plugin_permissions upp
        JOIN plugin.plugin_configurations pc ON upp.PluginId = pc.Id
        JOIN auth.users u ON upp.UserId = u.Id
        WHERE u.Id = $1 
          AND upp.PermissionName = $2
          AND upp.IsGranted = true
          AND ($3::text IS NULL OR upp.ResourceId = $3)
      `;
      
      const result = await DatabaseService.query<{has_permission: number}>(query, [userId, permission, resourceId]);
      
      return result.length > 0 && result[0].has_permission > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false; // Fail safe: deny permission on error
    }
  }

  /**
   * Check if user is admin (has system-level permissions)
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as is_admin
        FROM plugin.user_plugin_permissions upp
        JOIN plugin.plugin_configurations pc ON upp.PluginId = pc.Id
        WHERE upp.UserId = $1 
          AND upp.IsSystemLevel = true
          AND upp.IsGranted = true
      `;
      
      const result = await DatabaseService.query<{is_admin: number}>(query, [userId]);
      
      return result.length > 0 && result[0].is_admin > 0;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all available permissions for a plugin (for management UI)
   */
  async getAvailablePermissions(pluginId: string): Promise<RbacPermission[]> {
    try {
      const query = `
        SELECT 
          PermissionName as permissionname,
          ResourceId as resourceid,
          ResourceType as resourcetype,
          Description as description,
          IsSystemLevel as issystemlevel
        FROM plugin.plugin_rbac_permissions
        WHERE PluginId = (
          SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1
        )
        ORDER BY ResourceType, PermissionName
      `;
      
      const result = await DatabaseService.query<any>(query, [pluginId]);
      
      return result.map(row => ({
        name: row.permissionname || '',
        resourceType: (row.resourcetype as 'field' | 'object' | 'data' | 'action') || 'action',
        resourceId: row.resourceid || undefined,
        description: row.description || '',
        isSystemLevel: row.issystemlevel || false
      }));
    } catch (error) {
      console.error('Error getting available permissions:', error);
      throw new Error(`Failed to get available permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Bulk grant permissions to a user
   */
  async bulkGrantPermissions(pluginId: string, userId: string, permissions: string[], grantedBy?: string): Promise<void> {
    try {
      const client = await DatabaseService.getClient();
      await client.query('BEGIN');
      
      try {
        for (const permissionName of permissions) {
          await this.grantPluginPermission(pluginId, userId, permissionName, grantedBy);
        }
        
        await client.query('COMMIT');
        console.log(`✅ Bulk granted ${permissions.length} permissions to user ${userId} for plugin ${pluginId}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error bulk granting permissions:', error);
      throw new Error(`Failed to bulk grant permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Bulk revoke permissions from a user
   */
  async bulkRevokePermissions(pluginId: string, userId: string, permissions: string[]): Promise<void> {
    try {
      const client = await DatabaseService.getClient();
      await client.query('BEGIN');
      
      try {
        for (const permissionName of permissions) {
          await this.revokePluginPermission(pluginId, userId, permissionName);
        }
        
        await client.query('COMMIT');
        console.log(`✅ Bulk revoked ${permissions.length} permissions from user ${userId} for plugin ${pluginId}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error bulk revoking permissions:', error);
      throw new Error(`Failed to bulk revoke permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

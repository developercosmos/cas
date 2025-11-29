/**
 * User Access Service
 * Core business logic for User Access Management Plugin
 * Follows CAS Constitution and Plugin Development Standards
 */

const DatabaseService = require('../../../services/DatabaseService');

class UserAccessService {
  /**
   * Initialize default roles from configuration
   */
  static async initializeDefaultRoles() {
    try {
      const config = require('../config.json');
      const defaultRoles = config.configuration?.defaultRoles || [];
      
      for (const roleData of defaultRoles) {
        const existingRole = await this.getRoleByName(roleData.name);
        if (!existingRole) {
          await this.createRole({
            name: roleData.name,
            description: roleData.description,
            level: roleData.level || 10,
            isActive: true,
            isSystem: roleData.isSystem || false
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize default roles:', error);
    }
  }

  /**
   * Initialize default permissions from configuration
   */
  static async initializeDefaultPermissions() {
    try {
      const config = require('../config.json');
      const apis = config.apis || [];
      
      for (const api of apis) {
        if (api.method === 'POST' && api.endpoint.includes('/api/user-access')) {
          const permissionName = this.extractPermissionFromEndpoint(api.endpoint, api.method);
          const existingPermission = await this.getPermissionByName(permissionName);
          
          if (!existingPermission) {
            await this.createPermission({
              name: permissionName,
              description: api.description,
              resource: 'user_access_management',
              action: this.extractActionFromEndpoint(api.endpoint, api.method),
              category: 'user_access'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize default permissions:', error);
    }
  }

  /**
   * Get roles with pagination and filtering
   */
  static async getRoles(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive = true,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = options;

    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (isActive !== null) {
        whereClause += ` AND r.IsActive = $${paramIndex++}`;
        params.push(isActive);
      }

      if (search && search.trim()) {
        whereClause += ` AND (r.Name ILIKE $${paramIndex++} OR r.Description ILIKE $${paramIndex++})`;
        params.push(`%${search}%`, `%${search}%`);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM plugin.uam_md_roles r
        ${whereClause}
      `;
      const countResult = await DatabaseService.query(countQuery, params);
      const total = parseInt(countResult[0]?.total || '0');

      // Data query
      const dataQuery = `
        SELECT 
          r.Id,
          r.Name,
          r.Description,
          r.IsSystem,
          r.Level,
          r.IsActive,
          r.CreatedAt,
          r.UpdatedAt,
          r.CreatedBy,
          r.UpdatedBy,
          r.Version,
          (SELECT COUNT(*) FROM plugin.uam_tx_user_roles ur 
           WHERE ur.RoleId = r.Id AND ur.IsActive = TRUE) as UserCount
        FROM plugin.uam_md_roles r
        ${whereClause}
        ORDER BY r.${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const roles = await DatabaseService.query(dataQuery, params);

      return {
        roles: roles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id) {
    try {
      const query = `
        SELECT 
          r.Id,
          r.Name,
          r.Description,
          r.IsSystem,
          r.Level,
          r.IsActive,
          r.CreatedAt,
          r.UpdatedAt,
          r.CreatedBy,
          r.UpdatedBy,
          r.Version
        FROM plugin.uam_md_roles r
        WHERE r.Id = $1
      `;
      
      const result = await DatabaseService.query(query, [id]);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting role by ID:', error);
      throw error;
    }
  }

  /**
   * Get role with permissions
   */
  static async getRoleWithPermissions(id) {
    try {
      const roleQuery = `
        SELECT 
          r.Id,
          r.Name,
          r.Description,
          r.IsSystem,
          r.Level,
          r.IsActive,
          r.CreatedAt,
          r.UpdatedAt,
          r.CreatedBy,
          r.UpdatedBy,
          r.Version
        FROM plugin.uam_md_roles r
        WHERE r.Id = $1
      `;
      
      const role = await DatabaseService.query(roleQuery, [id]);
      
      if (!role[0]) {
        return null;
      }

      const permissionsQuery = `
        SELECT 
          p.Id,
          p.Name,
          p.Description,
          p.Resource,
          p.Action,
          p.Category,
          p.IsSystem,
          p.IsActive,
          rp.GrantedAt,
          rp.GrantedBy
        FROM plugin.uam_md_permissions p
        INNER JOIN plugin.uam_md_role_permissions rp ON p.Id = rp.PermissionId
        WHERE rp.RoleId = $1 AND p.IsActive = TRUE
        ORDER BY p.Category, p.Name
      `;
      
      const permissions = await DatabaseService.query(permissionsQuery, [id]);

      return {
        ...role[0],
        permissions
      };
    } catch (error) {
      console.error('Error getting role with permissions:', error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(name) {
    try {
      const query = `
        SELECT * FROM plugin.uam_md_roles r 
        WHERE r.Name = $1 AND r.IsActive = TRUE
      `;
      
      const result = await DatabaseService.query(query, [name]);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting role by name:', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  static async createRole(roleData) {
    try {
      const query = `
        INSERT INTO plugin.uam_md_roles (
          Name, Description, IsSystem, Level, IsActive, CreatedBy, CreatedAt
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const params = [
        roleData.name,
        roleData.description || '',
        roleData.isSystem || false,
        roleData.level || 10,
        roleData.isActive !== undefined ? roleData.isActive : true,
        roleData.createdBy
      ];

      const result = await DatabaseService.query(query, params);
      return result[0];
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  static async updateRole(id, updateData) {
    try {
      const fields = [];
      const params = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        fields.push(`Name = $${paramIndex++}`);
        params.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        fields.push(`Description = $${paramIndex++}`);
        params.push(updateData.description);
      }
      if (updateData.level !== undefined) {
        fields.push(`Level = $${paramIndex++}`);
        params.push(updateData.level);
      }
      if (updateData.isActive !== undefined) {
        fields.push(`IsActive = $${paramIndex++}`);
        params.push(updateData.isActive);
      }
      
      fields.push(`UpdatedAt = $${paramIndex++}`);
      fields.push(`Version = Version + 1`);
      
      if (updateData.updatedBy) {
        fields.push(`UpdatedBy = $${paramIndex++}`);
        params.push(updateData.updatedBy);
      }

      params.push(new Date());
      params.push(id);

      const query = `
        UPDATE plugin.uam_md_roles 
        SET ${fields.join(', ')} 
        WHERE Id = $${paramIndex}
        RETURNING *
      `;

      const result = await DatabaseService.query(query, params);
      return result[0];
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(id) {
    try {
      const client = await DatabaseService.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Delete role permissions
        await client.query(
          'DELETE FROM plugin.uam_md_role_permissions WHERE RoleId = $1',
          [id]
        );
        
        // Deactivate user role assignments
        await client.query(
          'UPDATE plugin.uam_tx_user_roles SET IsActive = FALSE WHERE RoleId = $1',
          [id]
        );
        
        // Delete role
        await client.query(
          'DELETE FROM plugin.uam_md_roles WHERE Id = $1',
          [id]
        );
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get permissions with pagination and filtering
   */
  static async getPermissions(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      resource = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = options;

    try {
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE p.IsActive = TRUE';
      const params = [];
      let paramIndex = 1;

      if (search && search.trim()) {
        whereClause += ` AND (p.Name ILIKE $${paramIndex++} OR p.Description ILIKE $${paramIndex++})`;
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category && category.trim()) {
        whereClause += ` AND p.Category = $${paramIndex++}`;
        params.push(category);
      }

      if (resource && resource.trim()) {
        whereClause += ` AND p.Resource ILIKE $${paramIndex++}`;
        params.push(`%${resource}%`);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM plugin.uam_md_permissions p
        ${whereClause}
      `;
      const countResult = await DatabaseService.query(countQuery, params);
      const total = parseInt(countResult[0]?.total || '0');

      // Data query
      const dataQuery = `
        SELECT 
          p.Id,
          p.Name,
          p.Description,
          p.Resource,
          p.Action,
          p.Category,
          p.IsSystem,
          p.IsActive,
          p.CreatedAt,
          p.UpdatedAt,
          p.Version
        FROM plugin.uam_md_permissions p
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const permissions = await DatabaseService.query(dataQuery, params);

      return {
        permissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   */
  static async getPermissionById(id) {
    try {
      const query = `
        SELECT * FROM plugin.uam_md_permissions p 
        WHERE p.Id = $1
      `;
      
      const result = await DatabaseService.query(query, [id]);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting permission by ID:', error);
      throw error;
    }
  }

  /**
   * Get permission by name
   */
  static async getPermissionByName(name) {
    try {
      const query = `
        SELECT * FROM plugin.uam_md_permissions p 
        WHERE p.Name = $1 AND p.IsActive = TRUE
      `;
      
      const result = await DatabaseService.query(query, [name]);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting permission by name:', error);
      throw error;
    }
  }

  /**
   * Create new permission
   */
  static async createPermission(permissionData) {
    try {
      const query = `
        INSERT INTO plugin.uam_md_permissions (
          Name, Description, Resource, Action, Category, IsSystem, IsActive, CreatedAt
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const params = [
        permissionData.name,
        permissionData.description || '',
        permissionData.resource,
        permissionData.action,
        permissionData.category || 'general',
        permissionData.isSystem || false,
        true,
        new Date()
      ];

      const result = await DatabaseService.query(query, params);
      return result[0];
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissionsToRole(roleId, permissionIds, grantedBy) {
    try {
      const client = await DatabaseService.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Get existing permissions
        const existingQuery = `
          SELECT PermissionId FROM plugin.uam_md_role_permissions WHERE RoleId = $1
        `;
        const existingResult = await client.query(existingQuery, [roleId]);
        const existingPermissionIds = existingResult.map(row => row.permissionid);
        
        // Determine permissions to add
        const permissionsToAdd = permissionIds.filter(id => !existingPermissionIds.includes(id));
        
        // Add new permissions
        for (const permissionId of permissionsToAdd) {
          await client.query(`
            INSERT INTO plugin.uam_md_role_permissions (RoleId, PermissionId, GrantedBy, GrantedAt)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (RoleId, PermissionId) DO NOTHING
          `, [roleId, permissionId, grantedBy, new Date()]);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error assigning permissions to role:', error);
      throw error;
    }
  }

  /**
   * Update role permissions
   */
  static async updateRolePermissions(roleId, permissionIds, grantedBy) {
    try {
      const client = await DatabaseService.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Delete existing permissions
        await client.query(
          'DELETE FROM plugin.uam_md_role_permissions WHERE RoleId = $1',
          [roleId]
        );
        
        // Add new permissions
        for (const permissionId of permissionIds) {
          await client.query(`
            INSERT INTO plugin.uam_md_role_permissions (RoleId, PermissionId, GrantedBy, GrantedAt)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (RoleId, PermissionId) DO NOTHING
          `, [roleId, permissionId, grantedBy, new Date()]);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId) {
    try {
      const query = `
        SELECT 
          ur.Id,
          ur.UserId,
          ur.RoleId,
          ur.AssignedBy,
          ur.AssignedAt,
          ur.ExpiresAt,
          ur.IsActive,
          ur.Reason,
          r.Name as RoleName,
          r.Description as RoleDescription,
          r.Level as RoleLevel,
          r.IsSystem as RoleIsSystem
        FROM plugin.uam_tx_user_roles ur
        INNER JOIN plugin.uam_md_roles r ON ur.RoleId = r.Id
        WHERE ur.UserId = $1 AND ur.IsActive = TRUE
        ORDER BY r.Level DESC, ur.AssignedAt DESC
      `;
      
      return await DatabaseService.query(query, [userId]);
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(assignmentData) {
    try {
      const query = `
        INSERT INTO plugin.uam_tx_user_roles (
          UserId, RoleId, AssignedBy, AssignedAt, ExpiresAt, Reason
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (UserId, RoleId, IsActive) 
        DO UPDATE SET 
          IsActive = TRUE,
          AssignedAt = $4,
          ExpiresAt = $5,
          Reason = $6
        RETURNING *
      `;
      
      const params = [
        assignmentData.userId,
        assignmentData.roleId,
        assignmentData.assignedBy,
        new Date(),
        assignmentData.expiresAt || null,
        assignmentData.reason || ''
      ];

      const result = await DatabaseService.query(query, params);
      return result[0];
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId, roleId) {
    try {
      const query = `
        UPDATE plugin.uam_tx_user_roles 
        SET IsActive = FALSE 
        WHERE UserId = $1 AND RoleId = $2
        RETURNING *
      `;
      
      const result = await DatabaseService.query(query, [userId, roleId]);
      return result[0] || null;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Get user effective permissions
   */
  static async getUserEffectivePermissions(userId) {
    try {
      const query = `
        SELECT DISTINCT
          p.Id,
          p.Name,
          p.Description,
          p.Resource,
          p.Action,
          p.Category,
          r.Name as RoleName,
          rp.GrantedAt
        FROM plugin.uam_tx_user_roles ur
        INNER JOIN plugin.uam_md_roles r ON ur.RoleId = r.Id
        INNER JOIN plugin.uam_md_role_permissions rp ON ur.RoleId = rp.RoleId
        INNER JOIN plugin.uam_md_permissions p ON rp.PermissionId = p.Id
        WHERE ur.UserId = $1 
          AND ur.IsActive = TRUE 
          AND (ur.ExpiresAt IS NULL OR ur.ExpiresAt > NOW())
          AND r.IsActive = TRUE 
          AND p.IsActive = TRUE
        ORDER BY p.Category, p.Name
      `;
      
      return await DatabaseService.query(query, [userId]);
    } catch (error) {
      console.error('Error getting user effective permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId, permissionName, resourceId = null) {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1
          FROM plugin.uam_has_permission($1, $2, $3)
        ) as has_permission
      `;
      
      const result = await DatabaseService.query(query, [userId, permissionName, resourceId]);
      return result[0]?.has_permission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Utility methods
   */
  static extractPermissionFromEndpoint(endpoint, method) {
    if (method === 'POST') {
      if (endpoint.includes('/roles')) return 'user_access.roles.create';
      if (endpoint.includes('/permissions')) return 'user_access.permissions.create';
      if (endpoint.includes('/users/') && endpoint.includes('/roles')) return 'user_access.roles.assign';
    }
    return '';
  }

  static extractActionFromEndpoint(endpoint, method) {
    if (endpoint.includes('/roles')) return 'create';
    if (endpoint.includes('/permissions')) return 'create';
    if (endpoint.includes('/users/') && endpoint.includes('/roles')) return 'assign';
    return 'general';
  }
}

module.exports = UserAccessService;

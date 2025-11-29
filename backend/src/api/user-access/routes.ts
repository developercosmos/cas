/**
 * User Access Management API Routes
 * Role-Based Access Control (RBAC) Endpoints
 * Follows CAS Constitution and Plugin Development Standards
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
// Import User Access Management plugin routes
// Note: Routes will be dynamically loaded in plugins/routes.ts

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Note: User Access Management plugin routes will be loaded dynamically

// Additional custom routes for plugin management
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    plugin: 'user-access-management',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get plugin configuration
router.get('/config', (req, res) => {
  try {
    // Static plugin configuration
    const config = {
      id: "user-access-management",
      name: "User Access Management",
      version: "1.0.0",
      description: "Comprehensive User Access Rights and Authorization Management System",
      category: "system",
      isSystem: true,
      enabled: true,
      configuration: {
        maxRolesPerUser: 10,
        sessionTimeout: 3600,
        permissionCache: {
          enabled: true,
          ttl: 300
        },
        audit: {
          enabled: true,
          retentionDays: 90
        },
        security: {
          requireAdminApproval: true,
          selfRoleAssignment: false,
          roleHierarchy: true
        }
      }
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load plugin configuration'
    });
  }
});

// Get plugin documentation
router.get('/docs', (req, res) => {
  try {
    // Return comprehensive API documentation
    res.json({
      success: true,
      data: {
        title: 'User Access Management Plugin Documentation',
        description: 'Comprehensive Role-Based Access Control (RBAC) System',
        version: '1.0.0',
        file: '/src/api/user-access/docs.md',
        endpoints: {
          roles: {
            list: 'GET /api/user-access/roles - List roles with pagination',
            create: 'POST /api/user-access/roles - Create new role',
            get: 'GET /api/user-access/roles/:id - Get role details',
            update: 'PUT /api/user-access/roles/:id - Update role',
            delete: 'DELETE /api/user-access/roles/:id - Delete role',
            permissions: {
              list: 'GET /api/user-access/roles/:id/permissions - Get role permissions',
              add: 'POST /api/user-access/roles/:id/permissions - Add permission',
              remove: 'DELETE /api/user-access/roles/:id/permissions/:id - Remove permission'
            }
          },
          users: {
            roles: 'GET /api/user-access/users/:id/roles - Get user roles',
            assign: 'POST /api/user-access/users/:id/roles - Assign role',
            unassign: 'DELETE /api/user-access/users/:id/roles/:id - Remove role',
            permissions: 'GET /api/user-access/users/:id/permissions - Get user effective permissions'
          },
          permissions: {
            list: 'GET /api/user-access/permissions - List all permissions',
            create: 'POST /api/user-access/permissions - Create new permission'
          },
          audit: {
            list: 'GET /api/user-access/audit - Get audit log'
          },
          system: {
            health: 'GET /api/user-access/health - Health check',
            config: 'GET /api/user-access/config - Plugin configuration',
            docs: 'GET /api/user-access/docs - API documentation'
          }
        },
        authentication: 'JWT Bearer token required',
        permissions: [
          'user_access.admin',
          'user_access.roles.create',
          'user_access.roles.edit',
          'user_access.roles.delete',
          'user_access.roles.assign',
          'user_access.users.manage',
          'user_access.permissions.create',
          'user_access.permissions.view',
          'user_access.audit.view'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load documentation'
    });
  }
});

export default router;

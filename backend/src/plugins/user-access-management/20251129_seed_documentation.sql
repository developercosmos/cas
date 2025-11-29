-- Seed documentation for User Access Management plugin
-- This migration adds plugin documentation to the central documentation system

-- Insert plugin documentation
INSERT INTO plugin.plugin_documentation (
    id,
    plugin_id,
    title,
    content,
    content_format,
    document_type,
    language,
    version,
    created_at,
    updated_at
) VALUES (
    'uam-docs-001',
    'user-access-management',
    'User Access Management API Documentation',
    '# 🔐 User Access Management Plugin API Documentation

## Overview

The User Access Management (UAM) plugin provides comprehensive Role-Based Access Control (RBAC) capabilities for the CAS platform. This API allows administrators to manage roles, permissions, and user access rights.

**Base URL**: `/api/user-access`  
**Authentication**: Required (JWT Bearer Token)  
**Content-Type**: `application/json`

## 🎭 Role Management APIs

### GET /api/user-access/roles

List all roles with pagination and filtering capabilities.

**Parameters**:
| Query Param | Type | Default | Description |
|-------------|--------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 20 | Number of roles per page |
| search | string | null | Search term for role names |
| isActive | boolean | true | Filter by active status |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Manager",
      "description": "Limited admin access",
      "isSystem": false,
      "level": 50,
      "isActive": true,
      "userCount": 5,
      "createdAt": "2025-11-29T04:00:00.000Z",
      "updatedAt": "2025-11-29T04:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### POST /api/user-access/roles

Create a new role.

**Required Permissions**: `user_access.roles.create`

**Request Body**:
```json
{
  "name": "Manager",
  "description": "Limited admin access",
  "level": 50,
  "isActive": true,
  "permissions": ["user_access.users.manage", "storage.read"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Manager",
    "description": "Limited admin access",
    "level": 50,
    "isActive": true,
    "isSystem": false,
    "createdAt": "2025-11-29T04:00:00.000Z",
    "updatedAt": "2025-11-29T04:00:00.000Z"
  }
}
```

### GET /api/user-access/roles/:id

Get details of a specific role.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Manager",
    "description": "Limited admin access",
    "level": 50,
    "isActive": true,
    "isSystem": false,
    "createdAt": "2025-11-29T04:00:00.000Z",
    "updatedAt": "2025-11-29T04:00:00.000Z",
    "permissions": [...]
  }
}
```

### PUT /api/user-access/roles/:id

Update an existing role.

**Required Permissions**: `user_access.roles.edit`

### DELETE /api/user-access/roles/:id

Delete a role.

**Required Permissions**: `user_access.roles.delete`

**Restrictions**: System roles cannot be deleted.

## 👥 User Management APIs

### GET /api/user-access/users/:id/roles

Get roles assigned to a specific user.

### POST /api/user-access/users/:id/roles

Assign a role to a user.

**Required Permissions**: `user_access.users.manage`

### DELETE /api/user-access/users/:id/roles/:roleId

Remove a role from a user.

**Required Permissions**: `user_access.users.manage`

## 📋 Permission Management APIs

### GET /api/user-access/permissions

List all available permissions in the system.

### POST /api/user-access/permissions

Create a new permission.

**Required Permissions**: `user_access.permissions.create`

## 📊 Audit Log APIs

### GET /api/user-access/audit

Get comprehensive audit log of all access management activities.

**Required Permissions**: `user_access.audit.view`

## 🔧 System APIs

### GET /api/user-access/health

Health check endpoint for the plugin.

### GET /api/user-access/config

Get plugin configuration.

## 🔐 Security & Authentication

### Authentication

All API endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Required Permissions

Each endpoint requires specific permissions:

| Endpoint | Permission Required |
|-----------|-------------------|
| POST /roles | `user_access.roles.create` |
| PUT /roles/:id | `user_access.roles.edit` |
| DELETE /roles/:id | `user_access.roles.delete` |
| POST /roles/:id/permissions | `user_access.roles.assign` |
| POST /users/:id/roles | `user_access.users.manage` |
| POST /permissions | `user_access.permissions.create` |
| GET /audit | `user_access.audit.view` |
| Full admin access | `user_access.admin` (bypasses all permission checks) |

## 📝 Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## 🔌 Integration Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/user-access/roles', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Role',
    description: 'Custom role description',
    level: 25,
    isActive: true
  })
});

const result = await response.json();
```

### cURL

```bash
curl -X GET "http://localhost:4000/api/user-access/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📞 Support

- **API Documentation**: GET `/api/user-access/docs`
- **Plugin Configuration**: GET `/api/user-access/config`
- **Health Status**: GET `/api/user-access/health`
- **Version**: 1.0.0

',
    'markdown',
    'API_DOCUMENTATION',
    'en',
    '1.0.0',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    content_format = EXCLUDED.content_format,
    document_type = EXCLUDED.document_type,
    language = EXCLUDED.language,
    version = EXCLUDED.version,
    updated_at = NOW();

-- Insert plugin README documentation
INSERT INTO plugin.plugin_documentation (
    id,
    plugin_id,
    title,
    content,
    content_format,
    document_type,
    language,
    version,
    created_at,
    updated_at
) VALUES (
    'uam-readme-002',
    'user-access-management',
    'User Access Management Plugin - README',
    '# 🔐 User Access Management Plugin

**Comprehensive Role-Based Access Control (RBAC) System for CAS Platform**

## 📋 Overview

The User Access Management plugin provides enterprise-grade access control capabilities for CAS platform. It enables administrators to create roles, manage permissions, and control user access through a sophisticated RBAC system.

**Version**: 1.0.0  
**Category**: System Plugin  
**License**: MIT

## ✨ Key Features

### 🎭 Role Management
- **Custom Roles**: Create unlimited custom roles with specific access levels
- **System Roles**: Pre-configured system roles (admin, manager, user)
- **Role Hierarchy**: Access level system (0-100) for structured permissions
- **Lifecycle Management**: Create, update, activate/deactivate roles
- **User Tracking**: See how many users are assigned to each role

### 📋 Permission Management
- **Granular Control**: Fine-grained permissions by resource and action
- **Permission Categories**: Organized by system module (storage, plugin, system, etc.)
- **Dynamic Assignment**: Add/remove permissions from roles
- **Permission Inheritance**: Roles inherit permissions automatically

### 👥 User Access Control
- **Multi-Role Assignment**: Users can have multiple roles simultaneously
- **Effective Permissions**: Consolidated view of all user permissions
- **Role Expiration**: Time-based role assignments
- **Assignment History**: Complete audit trail of all changes

### 📊 Audit & Reporting
- **Comprehensive Logging**: All access management actions tracked
- **Advanced Filtering**: Filter by date, user, action, entity type
- **Export Capabilities**: CSV export for compliance reporting
- **Real-time Updates**: Live monitoring of system changes

## 🚀 Installation & Setup

### Prerequisites
- **CAS Platform**: Version 1.0.0 or higher
- **Node.js**: Version 18.0.0 or higher
- **PostgreSQL**: Version 13.0 or higher
- **Admin Access**: Platform administrator privileges

## 🔌 API Reference

### Base URL
```
http://localhost:4000/api/user-access
```

### Authentication
```
Authorization: Bearer <jwt_token>
```

## 🌐 Access Methods

### 1. Plugin Manager
1. Login to CAS Platform (admin/admin)
2. Navigate to **Plugin Manager**
3. Find **User Access Management** in System plugins
4. Click **🔐 Manage Access** button

### 2. Direct Access
1. Navigate to `/user-access-management` (requires login)
2. **Keyboard Shortcut**: Press `Ctrl+Shift+U`

## 📞 Support

- **API Status**: GET `/api/user-access/health`
- **Plugin Config**: GET `/api/user-access/config`
- **Source Code**: Available in CAS plugin repository

## 📄 License

This plugin is released under MIT License.

---

## 🎉 Getting Started

1. **Install**: Plugin auto-registers with CAS platform
2. **Configure**: Access via Plugin Manager
3. **Create Roles**: Define your access hierarchy
4. **Assign Permissions**: Configure role capabilities
5. **Manage Users**: Assign roles to users
6. **Monitor Activity**: Use audit log for compliance

🔐 **Secure Your CAS Platform Today!**',
    'markdown',
    'README',
    'en',
    '1.0.0',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    content_format = EXCLUDED.content_format,
    document_type = EXCLUDED.document_type,
    language = EXCLUDED.language,
    version = EXCLUDED.version,
    updated_at = NOW();

-- Insert plugin configuration documentation
INSERT INTO plugin.plugin_documentation (
    id,
    plugin_id,
    title,
    content,
    content_format,
    document_type,
    language,
    version,
    created_at,
    updated_at
) VALUES (
    'uam-config-003',
    'user-access-management',
    'User Access Management - Configuration',
    '# 🔐 User Access Management Plugin Configuration

## Plugin Settings

```json
{
  "id": "user-access-management",
  "name": "User Access Management",
  "version": "1.0.0",
  "description": "Comprehensive User Access Rights and Authorization Management System",
  "category": "system",
  "isSystem": true,
  "enabled": true,
  "configuration": {
    "maxRolesPerUser": 10,
    "sessionTimeout": 3600,
    "permissionCache": {
      "enabled": true,
      "ttl": 300
    },
    "audit": {
      "enabled": true,
      "retentionDays": 90
    },
    "security": {
      "requireAdminApproval": true,
      "selfRoleAssignment": false,
      "roleHierarchy": true
    }
  }
}
```

## Configuration Options

- **maxRolesPerUser**: Maximum number of roles a user can have (default: 10)
- **sessionTimeout**: Session timeout in seconds (default: 3600)
- **permissionCache**: Permission caching settings
- **audit**: Audit logging configuration
- **security**: Security settings and restrictions

## Default Roles

- **admin**: System administrator with full access (Level 100)
- **manager**: Manager with limited administrative access (Level 50)
- **user**: Standard user with basic access (Level 10)',
    'markdown',
    'CONFIGURATION',
    'en',
    '1.0.0',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    content_format = EXCLUDED.content_format,
    document_type = EXCLUDED.document_type,
    language = EXCLUDED.language,
    version = EXCLUDED.version,
    updated_at = NOW();

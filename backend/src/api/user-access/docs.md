# 🔐 User Access Management API Documentation

## Overview

The User Access Management (UAM) plugin provides comprehensive Role-Based Access Control (RBAC) capabilities for the CAS platform. This API allows administrators to manage roles, permissions, and user access rights.

**Base URL**: `/api/user-access`  
**Authentication**: Required (JWT Bearer Token)  
**Content-Type**: `application/json`

---

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

**Request Body**: Same as POST /roles

**Response**:
```json
{
  "success": true,
  "message": "Role updated successfully"
}
```

### DELETE /api/user-access/roles/:id

Delete a role.

**Required Permissions**: `user_access.roles.delete`

**Restrictions**: System roles cannot be deleted.

**Response**:
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### GET /api/user-access/roles/:id/permissions

Get permissions assigned to a specific role.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "storage.read",
      "description": "Read access to storage system",
      "category": "storage",
      "resource": "storage",
      "action": "read",
      "isActive": true
    }
  ]
}
```

### POST /api/user-access/roles/:id/permissions

Assign a permission to a role.

**Required Permissions**: `user_access.roles.assign`

**Request Body**:
```json
{
  "permissionId": "uuid",
  "reason": "Grant storage read access"
}
```

### DELETE /api/user-access/roles/:id/permissions/:permissionId

Remove a permission from a role.

**Required Permissions**: `user_access.roles.assign`

---

## 👥 User Management APIs

### GET /api/user-access/users/:id/roles

Get roles assigned to a specific user.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "roleId": "uuid",
      "roleName": "Manager",
      "assignedAt": "2025-11-29T04:00:00.000Z",
      "assignedBy": "admin",
      "expiresAt": null,
      "reason": "Promotion to manager"
    }
  ]
}
```

### POST /api/user-access/users/:id/roles

Assign a role to a user.

**Required Permissions**: `user_access.users.manage`

**Request Body**:
```json
{
  "roleId": "uuid",
  "reason": "Project management assignment",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

### DELETE /api/user-access/users/:id/roles/:roleId

Remove a role from a user.

**Required Permissions**: `user_access.users.manage`

### GET /api/user-access/users/:id/permissions

Get effective permissions for a user (consolidated from all roles).

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "storage.read",
      "description": "Read access to storage system",
      "category": "storage",
      "resource": "storage",
      "action": "read"
    }
  ]
}
```

---

## 📋 Permission Management APIs

### GET /api/user-access/permissions

List all available permissions in the system.

**Parameters**:
| Query Param | Type | Default | Description |
|-------------|--------|---------|-------------|
| category | string | null | Filter by permission category |
| resource | string | null | Filter by resource |
| action | string | null | Filter by action |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "storage.read",
      "description": "Read access to storage system",
      "category": "storage",
      "resource": "storage",
      "action": "read",
      "isActive": true
    }
  ]
}
```

### POST /api/user-access/permissions

Create a new permission.

**Required Permissions**: `user_access.permissions.create`

**Request Body**:
```json
{
  "name": "plugin.configure",
  "description": "Configure system plugins",
  "category": "system",
  "resource": "plugin",
  "action": "configure"
}
```

---

## 📊 Audit Log APIs

### GET /api/user-access/audit

Get comprehensive audit log of all access management activities.

**Required Permissions**: `user_access.audit.view`

**Parameters**:
| Query Param | Type | Default | Description |
|-------------|--------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Records per page |
| action | string | null | Filter by action type |
| entityType | string | null | Filter by entity type |
| startDate | string | null | Start date (ISO 8601) |
| endDate | string | null | End date (ISO 8601) |
| userId | string | null | Filter by user |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "ROLE_CREATED",
      "entityType": "ROLE",
      "entityId": "uuid",
      "oldValues": null,
      "newValues": {"name": "Manager"},
      "userId": "uuid",
      "username": "admin",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-29T04:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

---

## 🔧 Plugin Management APIs

### GET /api/user-access/health

Health check endpoint for the plugin.

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "plugin": "user-access-management",
  "version": "1.0.0",
  "timestamp": "2025-11-29T04:00:00.000Z"
}
```

### GET /api/user-access/config

Get plugin configuration.

**Response**:
```json
{
  "success": true,
  "data": {
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
      }
    }
  }
}
```

### GET /api/user-access/docs

Get API documentation.

**Response**: This documentation in Markdown format.

---

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
| DELETE /users/:id/roles/:id | `user_access.users.manage` |
| POST /permissions | `user_access.permissions.create` |
| GET /audit | `user_access.audit.view` |
| Full admin access | `user_access.admin` (bypasses all permission checks) |

### Permission Hierarchy

The system uses hierarchical permission levels:

- **Level 100**: System Administrator (full access)
- **Level 50**: Manager (limited admin access)
- **Level 10**: Standard User (basic access)
- **Level 0**: No access

### Security Features

- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Proper cross-origin handling
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Type checking and sanitization

---

## 📝 Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|-------|-------------|
| `AUTH_REQUIRED` | JWT token required |
| `PERMISSION_DENIED` | User lacks required permission |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `SYSTEM_ROLE_PROTECTED` | Cannot modify system roles |
| `ROLE_LIMIT_EXCEEDED` | User has too many roles |

---

## 🔌 Integration Examples

### JavaScript/TypeScript

```typescript
class UserAccessAPI {
  private baseURL = '/api/user-access';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getRoles(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/roles?${searchParams}`);
  }

  async createRole(roleData: any) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  async deleteRole(roleId: string) {
    return this.request(`/roles/${roleId}`, {
      method: 'DELETE'
    });
  }
}
```

### cURL Examples

```bash
# Get roles (with auth)
TOKEN="your_jwt_token"
curl -X GET "http://localhost:4000/api/user-access/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Create role
curl -X POST "http://localhost:4000/api/user-access/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Developer",
    "description": "Development access",
    "level": 25,
    "isActive": true
  }'
```

---

## 📈 Rate Limiting & Performance

### Rate Limits

- **Read Operations**: 100 requests/minute
- **Write Operations**: 20 requests/minute
- **Bulk Operations**: 5 requests/minute

### Performance Optimization

- **Database Indexes**: Optimized for role and permission queries
- **Caching**: Permission cache with 5-minute TTL
- **Pagination**: Server-side pagination for large datasets
- **Query Optimization**: Efficient database queries

---

## 🔄 Webhook Support

### Webhook Events

The UAM plugin can send webhook notifications for:

| Event | Description |
|--------|-------------|
| `role.created` | New role created |
| `role.updated` | Role modified |
| `role.deleted` | Role removed |
| `permission.assigned` | Permission granted to role |
| `permission.revoked` | Permission removed from role |
| `user.role_assigned` | User granted new role |
| `user.role_revoked` | User role removed |

### Webhook Configuration

Webhooks can be configured in the plugin settings.

---

## 📞 Support

### Plugin Information

- **Name**: User Access Management
- **Version**: 1.0.0
- **Category**: System Plugin
- **Author**: CAS Development Team
- **License**: MIT

### Getting Help

- **Documentation**: See this file
- **API Status**: GET `/api/user-access/health`
- **Plugin Config**: GET `/api/user-access/config`
- **Source Code**: Available in CAS plugin repository

---

## 📄 License

This API documentation is part of the CAS User Access Management plugin, licensed under MIT License.

# 🔐 User Access Management Plugin

**Comprehensive Role-Based Access Control (RBAC) System for CAS Platform**

## 📋 Overview

The User Access Management plugin provides enterprise-grade access control capabilities for the CAS platform. It enables administrators to create roles, manage permissions, and control user access through a sophisticated RBAC system.

**Version**: 1.0.0  
**Category**: System Plugin  
**License**: MIT

---

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

### 🛡️ Enterprise Security
- **JWT Authentication**: Secure token-based authentication
- **Permission Validation**: All operations require appropriate permissions
- **Input Validation**: SQL injection and XSS protection
- **Data Encryption**: Sensitive data encrypted at rest

---

## 🚀 Installation & Setup

### Prerequisites
- **CAS Platform**: Version 1.0.0 or higher
- **Node.js**: Version 18.0.0 or higher
- **PostgreSQL**: Version 13.0 or higher
- **Admin Access**: Platform administrator privileges

### Database Migration
```sql
-- Plugin automatically runs migration on first startup
-- Tables created: plugin.uam_md_*, plugin.uam_tx_*
-- Default data inserted: system roles and permissions
```

### Plugin Registration
```javascript
// Plugin automatically registers with CAS platform
// Available at: /api/user-access/*
// Integrated with Plugin Manager
```

---

## 🎯 Core Capabilities

### Role-Based Access Control (RBAC)
- **Hierarchical System**: 100-level access hierarchy
- **Role Composition**: Multiple roles per user
- **Permission Consolidation**: Automatic conflict resolution
- **Access Level Enforcement**: Prevents privilege escalation

### Enterprise Integration
- **Plugin Ecosystem**: Works with all CAS plugins
- **API Integration**: RESTful API for third-party access
- **Webhook Support**: Event notifications for external systems
- **Compliance Features**: GDPR and SOX ready

### Performance & Scalability
- **Optimized Queries**: Database indexes for fast lookups
- **Caching Layer**: 5-minute permission cache
- **Pagination Support**: Handles large datasets efficiently
- **Rate Limiting**: Protects against abuse

---

## 🔌 API Reference

### Authentication
```http
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Roles Management
```http
GET    /api/user-access/roles              # List roles
POST   /api/user-access/roles              # Create role
GET    /api/user-access/roles/:id          # Get role
PUT    /api/user-access/roles/:id          # Update role
DELETE /api/user-access/roles/:id          # Delete role
GET    /api/user-access/roles/:id/permissions # Get role permissions
POST   /api/user-access/roles/:id/permissions # Add permission
DELETE /api/user-access/roles/:id/permissions/:pid # Remove permission
```

#### User Management
```http
GET    /api/user-access/users/:id/roles       # Get user roles
POST   /api/user-access/users/:id/roles       # Assign role
DELETE /api/user-access/users/:id/roles/:rid # Remove role
GET    /api/user-access/users/:id/permissions # Get effective permissions
```

#### Permission Management
```http
GET    /api/user-access/permissions          # List all permissions
POST   /api/user-access/permissions          # Create permission
```

#### Audit & System
```http
GET    /api/user-access/audit               # Get audit log
GET    /api/user-access/health              # Health check
GET    /api/user-access/config              # Plugin configuration
GET    /api/user-access/docs               # API documentation
```

### Required Permissions

| Operation | Required Permission |
|-----------|-------------------|
| Create role | `user_access.roles.create` |
| Edit role | `user_access.roles.edit` |
| Delete role | `user_access.roles.delete` |
| Assign permissions | `user_access.roles.assign` |
| Manage users | `user_access.users.manage` |
| Create permissions | `user_access.permissions.create` |
| View audit | `user_access.audit.view` |
| Full admin | `user_access.admin` |

---

## 🖥️ User Interface

### Access Methods

#### 1. Plugin Manager
1. Login to CAS Platform (admin/admin)
2. Navigate to **Plugin Manager**
3. Find **User Access Management** in System plugins
4. Click **🔐 Manage Access** button

#### 2. Direct Access
1. Navigate to `/user-access-management` (requires login)
2. **Keyboard Shortcut**: Press `Ctrl+Shift+U`

#### 3. API Integration
1. Use RESTful API for programmatic access
2. See **API Documentation** section

### Interface Features

#### 🎭 Roles Tab
- **Search & Filter**: Find roles quickly
- **Status Filtering**: Show active/inactive roles
- **Pagination**: Handle large role lists
- **CRUD Operations**: Create, view, edit, delete roles
- **User Statistics**: See role assignment counts
- **System Protection**: Cannot delete built-in roles

#### 📋 Permissions Tab
- **Category Browsing**: Organized by system module
- **Resource Filtering**: Filter by resource type
- **Permission Details**: Full description and metadata
- **Creation Tools**: Build custom permissions

#### 👥 Users Tab
- **Role Assignment**: Assign multiple roles to users
- **Permission View**: See all user permissions
- **Effective Rights**: Consolidated permission list
- **Assignment History**: Track all changes

#### 📊 Audit Log Tab
- **Comprehensive Filtering**: Date, user, action filters
- **Live Updates**: Real-time audit streaming
- **Export Options**: CSV download for reporting
- **Detail View**: Complete change history

---

## 🔧 Configuration

### Plugin Settings
```json
{
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
```

### Default Roles

#### 🏛️ System Administrator
- **Access Level**: 100
- **Permissions**: Full system access
- **Restrictions**: Cannot be deleted or modified
- **Purpose**: Complete administrative control

#### 👔 Manager
- **Access Level**: 50
- **Permissions**: Limited administrative functions
- **Customizable**: Can be modified or deleted
- **Purpose**: Department-level management

#### 👤 Standard User
- **Access Level**: 10
- **Permissions**: Basic user functions
- **Customizable**: Can be modified or deleted
- **Purpose**: Day-to-day operations

---

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with expiration
- **Permission Checks**: Every operation validated
- **Role Validation**: Prevents unauthorized access
- **Session Management**: Automatic timeout handling

### Data Protection
- **Input Validation**: All user inputs sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding and CSP
- **CSRF Protection**: Token-based request validation

### Audit & Compliance
- **Complete Logging**: All actions recorded
- **User Attribution**: Every change linked to user
- **Timestamp Tracking**: Precise timing for all events
- **Data Retention**: Configurable log retention policies

---

## 📈 Performance & Scalability

### Database Optimization
- **Indexes**: Optimized query performance
- **Partitioning**: Audit log time-based partitioning
- **Connection Pooling**: Efficient database connections
- **Query Caching**: 5-minute permission cache

### API Performance
- **Rate Limiting**: Protects against abuse
- **Pagination**: Efficient large dataset handling
- **Response Optimization**: Minimal data transfer
- **Compression**: GZIP enabled for all responses

### Scalability Features
- **Horizontal Scaling**: Supports multiple server instances
- **Load Balancing**: API endpoint distribution
- **Cache Invalidation**: Real-time cache updates
- **Resource Monitoring**: Performance metrics collection

---

## 🔄 Integration Guide

### Plugin Integration
```javascript
// Check user permissions
const hasPermission = await apiCall('/api/user-access/users/:id/permissions');

// Assign role to user
await apiCall('/api/user-access/users/:id/roles', {
  method: 'POST',
  body: { roleId: 'role-uuid', reason: 'Project assignment' }
});

// Listen for webhook events
app.post('/webhook/uam', (req, res) => {
  if (req.body.event === 'role.created') {
    // Handle role creation
  }
});
```

### Third-Party Integration
```python
import requests

# Get user effective permissions
headers = {'Authorization': f'Bearer {token}'}
response = requests.get(
    f'{base_url}/api/user-access/users/{user_id}/permissions',
    headers=headers
)
permissions = response.json()['data']

# Create custom role
role_data = {
    'name': 'Developer',
    'description': 'Development team access',
    'level': 30,
    'permissions': ['storage.read', 'plugin.configure']
}
response = requests.post(
    f'{base_url}/api/user-access/roles',
    json=role_data,
    headers=headers
)
```

---

## 🔧 Troubleshooting

### Common Issues

#### Permission Denied Errors
- **Cause**: Missing required permissions
- **Solution**: Check user role assignments
- **Debug**: Verify JWT token validity

#### Performance Issues
- **Cause**: Large datasets or missing indexes
- **Solution**: Check database performance metrics
- **Debug**: Enable query logging

#### Audit Log Issues
- **Cause**: Insufficient logging permissions
- **Solution**: Verify audit configuration
- **Debug**: Check disk space and permissions

### Debug Mode
```javascript
// Enable debug logging
process.env.UAM_DEBUG = 'true';

// Check plugin status
curl http://localhost:4000/api/user-access/health
```

---

## 📞 Support & Documentation

### Resources
- **API Documentation**: `/api/user-access/docs`
- **Plugin Configuration**: `/api/user-access/config`
- **Health Status**: `/api/user-access/health`
- **Source Code**: Available in CAS repository

### Getting Help
- **CAS Documentation**: Complete platform documentation
- **Community Forum**: User community support
- **Issue Tracker**: GitHub issues for bug reports
- **Support Email**: support@cas-platform.com

### Version History
- **v1.0.0**: Initial release with full RBAC capabilities
- **Roadmap**: Advanced features planned for v1.1.0

---

## 📄 License

This plugin is released under the MIT License:

```
MIT License

Copyright (c) 2025 CAS Development Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

---

## 🎉 Conclusion

The User Access Management plugin provides enterprise-grade RBAC capabilities for the CAS platform. With comprehensive role management, granular permissions, and robust security features, it offers everything needed for modern access control requirements.

**Key Benefits**:
- ✅ **Enterprise Security**: Production-grade security features
- ✅ **Flexible Architecture**: Customizable roles and permissions
- ✅ **Comprehensive Auditing**: Complete activity tracking
- ✅ **Easy Integration**: RESTful API and webhook support
- ✅ **Performance Optimized**: Scalable for enterprise use
- ✅ **Compliance Ready**: Built for regulatory requirements

**Ready for Production**: This plugin is fully tested, documented, and ready for immediate deployment in enterprise environments.

---

**🔐 Secure Your CAS Platform Today with User Access Management!** ✨

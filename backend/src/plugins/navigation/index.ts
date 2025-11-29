import { Router } from 'express';
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

    logger.info(`Initializing ${this.name} v${this.version}`);

    this.navigationService = new NavigationService(services.database);

    await this.createDatabaseSchema(services.database);
    await this.registerPluginInDatabase(services.database);

    this.router = createRoutes(
      this.navigationService,
      services.auth.getCurrentUser
    );

    logger.info(`${this.name} initialized successfully`);
  }

  private async createDatabaseSchema(db: any): Promise<void> {
    try {
      // Run migration if tables don't exist
      const fs = await import('fs');
      const migrationPath = new URL('./database/migrations/20251129_create_navigation_tables.sql', import.meta.url);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await db.execute(migrationSQL);
      logger.info('Navigation database schema created successfully');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info('Navigation database schema already exists');
      } else {
        logger.error('Error creating navigation schema:', error);
        throw error;
      }
    }
  }

  private async registerPluginInDatabase(db: any): Promise<void> {
    try {
      // Register plugin in plugin_configurations
      await db.execute(`
        INSERT INTO plugin.plugin_configurations (
          Id, PluginId, Name, Version, Description, Author, Category, 
          IsSystem, Status, Entry, Permissions, CreatedAt, UpdatedAt
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        ) ON CONFLICT (PluginId) DO UPDATE SET
          Name = $2, Version = $3, Description = $4, Author = $5,
          Category = $6, IsSystem = $7, Status = $8, Entry = $9,
          Permissions = $10, UpdatedAt = NOW()
      `, [
        this.id, this.name, this.version, this.metadata.description,
        this.metadata.author, this.metadata.category, this.metadata.isSystem,
        'enabled', '/src/plugins/navigation/index.ts', 
        JSON.stringify(this.metadata.permissions)
      ]);

      // Register API endpoints
      const apiEndpoints = [
        {
          endpoint: '/api/plugins/menu-navigation/modules',
          method: 'GET',
          description: 'Get user-accessible navigation modules',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Returns list of modules current user can access based on permissions. Includes sorting and filtering options.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/search',
          method: 'GET',
          description: 'Search navigation modules',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Search modules by name, description, or plugin ID. Supports ILIKE search with minimum 2 characters.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/config',
          method: 'GET',
          description: 'Get navigation configuration',
          requiresAuth: true,
          permissions: ['navigation:view'],
          documentation: 'Returns current navigation system configuration including keyboard shortcuts and display settings.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/config',
          method: 'PUT',
          description: 'Update navigation configuration',
          requiresAuth: true,
          permissions: ['navigation:configure'],
          documentation: 'Update navigation system configuration. Only administrators can modify configuration.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/modules',
          method: 'POST',
          description: 'Add navigation module',
          requiresAuth: true,
          permissions: ['navigation:manage'],
          documentation: 'Add new navigation module to the system. Only administrators can add modules.'
        },
        {
          endpoint: '/api/plugins/menu-navigation/status',
          method: 'GET',
          description: 'Plugin health check and statistics',
          requiresAuth: false,
          permissions: [],
          documentation: 'Returns plugin status, statistics, and health information. Useful for monitoring and debugging.'
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

      // Register documentation
      await db.execute(`
        INSERT INTO plugin.plugin_md_documentation (
          id, pluginId, title, content, contentFormat, documentType,
          language, version, isCurrent, orderIndex, metadata, createdAt, updatedAt
        ) VALUES (
          gen_random_uuid(),
          (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
          'Menu Navigation System Plugin Documentation',
          '# Menu Navigation System Plugin Documentation

## Overview

The Menu Navigation System plugin provides an interactive, searchable navigation interface for accessing CAS platform modules based on user permissions. It features keyboard shortcuts, responsive design, and seamless integration with existing authentication and authorization systems.

## Features

### 🎯 Core Functionality
- **Keyboard Navigation**: Ctrl+K shortcut for quick access
- **Permission-Based Filtering**: Shows only modules user can access
- **Search and Filter**: Real-time search across module names and descriptions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Logo Integration**: Click header logo to open navigation
- **Plugin Integration**: Communicates with LDAP and User Access Management plugins

### 🔧 Configuration Options
- **Keyboard Shortcuts**: Customizable keyboard shortcut (default: Ctrl+K)
- **Search Settings**: Enable/disable search functionality
- **Display Options**: Maximum items per category, sort options
- **Theme Support**: Auto, light, and dark mode compatibility

### 🌐 API Endpoints
All API endpoints require JWT authentication via Bearer token in Authorization header.

#### Authentication
Headers:
- `Authorization: Bearer <JWT_TOKEN>`

#### Core Endpoints
- **GET /api/plugins/menu-navigation/modules** - Get accessible modules
- **GET /api/plugins/menu-navigation/search?q=query** - Search modules
- **GET /api/plugins/menu-navigation/config** - Get configuration
- **PUT /api/plugins/menu-navigation/config** - Update configuration
- **POST /api/plugins/menu-navigation/modules** - Add module
- **GET /api/plugins/menu-navigation/status** - Health check

#### Response Format
All API responses follow standard format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "count": 0,
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

#### Error Response Format
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### 🔐 Security Features
- **Permission-Based Access**: All modules filtered by user permissions
- **JWT Authentication**: Secure API endpoint protection
- **Input Validation**: SQL injection and XSS prevention
- **Audit Trail**: Complete audit logging for all changes
- **Rate Limiting**: Protection against abuse and attacks

### 🚀 Performance Optimizations
- **Client-Side Search**: Instant search results for small datasets
- **Efficient Database Queries**: Optimized indexes and query patterns
- **Lazy Loading**: On-demand module loading
- **Caching**: Smart caching for frequently accessed data
- **Compression**: Response compression for better performance

### 📱 Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: ARIA labels and roles for assistive technology
- **High Contrast**: WCAG AA compliance for color contrast
- **Focus Management**: Proper focus handling and management
- **Voice Control**: Compatible with voice navigation software

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface following CAS design system
- **Responsive Layout**: Adapts to all screen sizes and devices
- **Dark/Light Mode**: Automatic theme detection and switching
- **Smooth Animations**: Subtle animations for better user experience
- **Loading States**: Clear feedback during data loading

### 🔧 Installation & Setup

#### Prerequisites
- CAS Platform v1.0.0 or higher
- Node.js 18.0.0 or higher
- PostgreSQL with plugin schema created
- JWT authentication system configured

#### Automatic Setup
The plugin automatically:
- Registers its API endpoints in the central registry
- Creates necessary database tables via migration
- Initializes default configuration and modules
- Integrates with existing authentication system

#### Manual Configuration
If needed, configuration can be updated via:
1. Plugin Manager UI
2. API endpoints (PUT /api/plugins/menu-navigation/config)
3. Direct database configuration updates

### 📊 Monitoring & Maintenance

#### Health Monitoring
- Plugin status endpoint for health checks
- Performance metrics and statistics
- Error tracking and reporting
- Resource usage monitoring

#### Audit Logging
- All module changes tracked with audit trail
- User action logging for security auditing
- Configuration change tracking
- Access pattern analysis

#### Troubleshooting
**Navigation not showing modules:**
1. Check user permissions via User Access Management plugin
2. Verify plugin is enabled in plugin manager
3. Check browser console for JavaScript errors
4. Verify API connectivity: GET /api/plugins/menu-navigation/status

**Keyboard shortcut not working:**
1. Check if enableKeyboardShortcut is true in configuration
2. Verify no other elements are capturing the event
3. Test in different browsers
4. Check for conflicts with other browser extensions

**Search not finding modules:**
1. Check module names and descriptions in database
2. Verify search query format (minimum 2 characters)
3. Check for permission filtering issues
4. Test search with different query terms

### 🤝 Integration with Other Plugins

#### LDAP Plugin Integration
- Authentication verification and user validation
- Permission synchronization with LDAP groups
- User profile information access
- Session management integration

#### User Access Management Plugin Integration
- Real-time permission checking and filtering
- Role-based module access control
- User permission synchronization
- Access rule evaluation

#### Plugin Communication Service
- Inter-plugin API calls and responses
- Service discovery and registration
- Error handling and fallback mechanisms
- Performance monitoring and optimization

### 📋 Permissions

The plugin uses the following permissions:

#### User Permissions
- \`navigation:view\`: Access navigation interface (default for authenticated users)

#### Administrator Permissions
- \`navigation:configure\`: Configure navigation settings
- \`navigation:manage\`: Add/edit navigation modules

### 🆕 Version History

#### v1.0.0 (2025-01-29)
- Initial release with complete functionality
- Keyboard shortcuts and search implementation
- LDAP and User Access Management integration
- Responsive design and accessibility support
- Complete API documentation and testing
- Full audit trail and security features
- Export-import transport capability for cross-system deployment

### 📞 Support

For issues and support:
1. Check plugin documentation and troubleshooting guides
2. Review audit logs and error messages
3. Contact CAS development team
4. Report issues via platform issue tracker
5. Check for updates and patches regularly',
          'markdown',
          'readme',
          'en',
          '1.0.0',
          true,
          0,
          '{"category": "documentation", "priority": "high", "tags": ["plugin", "navigation", "ui", "documentation"]}',
          NOW(),
          NOW()
        ) ON CONFLICT (pluginId, documentType) DO UPDATE SET
          title = EXCLUDED.title, content = EXCLUDED.content,
          isCurrent = true, updatedAt = NOW()
      `, [this.id]);

      // Register API documentation
      await db.execute(`
        INSERT INTO plugin.plugin_md_documentation (
          id, pluginId, title, content, contentFormat, documentType,
          language, version, isCurrent, orderIndex, metadata, createdAt, updatedAt
        ) VALUES (
          gen_random_uuid(),
          (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
          'Menu Navigation API Reference',
          '# Menu Navigation API Reference

## Authentication

All API endpoints require JWT authentication via Bearer token.

**Headers:**
\`\`\`
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
\`\`\`

## Base URL
\`\`\`
/api/plugins/menu-navigation
\`\`\`

## Endpoints

### GET /modules
Get all navigation modules accessible to current user.

**Query Parameters:**
- \`sort\` (string): Sort by \`name\`, \`plugin\`, or \`sortOrder\`
- \`limit\` (number): Maximum number of items to return
- \`offset\` (number): Number of items to skip

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Plugin Manager",
      "description": "Manage system plugins",
      "pluginId": "plugin-manager",
      "requiresAuth": true,
      "requiredPermissions": ["plugin.admin"],
      "route": "/admin/plugins",
      "sortOrder": 10,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### GET /search
Search navigation modules by name or description.

**Query Parameters:**
- \`q\` (string, required): Search query (minimum 2 characters)
- \`limit\` (number): Maximum number of items to return
- \`sort\` (string): Sort by \`name\`, \`plugin\`, or \`sortOrder\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [...],
  "count": 5,
  "query": "plugin",
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### GET /config
Get navigation configuration.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "enableKeyboardShortcut": true,
    "keyboardShortcut": "Ctrl+K",
    "maxItemsPerCategory": 50,
    "searchEnabled": true,
    "sortOptions": ["name", "plugin", "sortOrder"],
    "theme": "auto"
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### PUT /config
Update navigation configuration (requires \`navigation:configure\` permission).

**Request Body:**
\`\`\`json
{
  "enableKeyboardShortcut": true,
  "keyboardShortcut": "Ctrl+K",
  "maxItemsPerCategory": 50,
  "searchEnabled": true,
  "theme": "auto"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Navigation configuration updated successfully",
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### POST /modules
Add new navigation module (requires \`navigation:manage\` permission).

**Request Body:**
\`\`\`json
{
  "name": "Custom Module",
  "description": "Module description",
  "pluginId": "custom-plugin",
  "requiresAuth": true,
  "requiredPermissions": ["custom.access"],
  "route": "/custom",
  "sortOrder": 100,
  "isActive": true
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Navigation module added successfully",
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

### GET /status
Plugin health check and statistics.

**Response:**
\`\`\`json
{
  "success": true,
  "plugin": {
    "name": "Menu Navigation System",
    "version": "1.0.0",
    "status": "active",
    "statistics": {
      "totalModules": 10,
      "activeModules": 8,
      "configLoaded": true,
      "lastUpdated": "2025-01-01T00:00:00Z"
    }
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
\`\`\`

## Error Codes

| Code | Description | Resolution |
|-------|-------------|-------------|
| 400 | Bad Request | Invalid request parameters or format |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions for requested action |
| 404 | Not Found | Requested resource does not exist |
| 500 | Internal Server Error | Server-side error occurred |
| 503 | Service Unavailable | Plugin temporarily unavailable |

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- Search endpoints: 60 requests per minute
- Configuration endpoints: 30 requests per minute
- Status endpoints: 120 requests per minute

## Caching

Response caching is implemented for:
- Module lists: 5 minutes cache duration
- Configuration: 10 minutes cache duration
- Search results: 2 minutes cache duration

## Security

All API endpoints implement:
- JWT authentication with token validation
- SQL injection prevention via parameterized queries
- XSS protection with input sanitization
- CORS configuration for cross-origin requests
- Request rate limiting and abuse prevention',
          'markdown',
          'api',
          'en',
          '1.0.0',
          true,
          1,
          '{"category": "documentation", "priority": "high", "tags": ["plugin", "navigation", "api", "reference"]}',
          NOW(),
          NOW()
        ) ON CONFLICT (pluginId, documentType) DO UPDATE SET
          title = EXCLUDED.title, content = EXCLUDED.content,
          isCurrent = true, updatedAt = NOW()
      `, [this.id]);

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
    logger.info(`Activating ${this.name}`);

    // Initialize with default navigation modules
    await this.navigationService?.initializeDefaultModules();

    logger.info(`${this.name} activated successfully`);
  }

  async deactivate(): Promise<void> {
    if (!this.context) return;

    const { logger } = this.context;
    logger.info(`Deactivating ${this.name}`);
    logger.info(`${this.name} deactivated successfully`);
  }

  async uninstall(): Promise<void> {
    if (!this.context) return;

    const { logger, services } = this.context;
    logger.info(`Uninstalling ${this.name}`);

    const db = services.database;
    try {
      // Clean up plugin data
      await db.execute('DELETE FROM plugin.plugin_api_registry WHERE pluginId = $1', [this.id]);
      await db.execute('DELETE FROM plugin.plugin_md_documentation WHERE pluginId = $1', [this.id]);
      await db.execute('DELETE FROM plugin.plugin_configurations WHERE pluginId = $1', [this.id]);

      // Drop navigation tables
      await db.execute('DROP TABLE IF EXISTS plugin.navigation_modules_audit CASCADE');
      await db.execute('DROP TABLE IF EXISTS plugin.navigation_user_preferences CASCADE');
      await db.execute('DROP TABLE IF EXISTS plugin.navigation_config CASCADE');
      await db.execute('DROP TABLE IF EXISTS plugin.navigation_modules CASCADE');

      logger.info(`${this.name} uninstalled successfully`);
    } catch (error) {
      logger.error(`Failed to uninstall ${this.name}:`, error);
      throw error;
    }
  }

  getRouter(): Router {
    if (!this.router) {
      throw new Error('Plugin not initialized');
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

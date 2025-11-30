-- Migration: Add Menu Navigation Plugin with Full Documentation
-- Version: 1.0.0
-- Date: 2025-11-30
-- Description: Creates menu-navigation plugin configuration, API registry, RBAC permissions, and detailed documentation

-- ============================================================================
-- PART 1: Plugin Configuration
-- ============================================================================

-- Insert menu-navigation plugin configuration
INSERT INTO plugin.plugin_configurations (
  Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, 
  PluginEntry, PluginStatus, IsSystem, Category, CreatedAt, UpdatedAt
)
VALUES (
  gen_random_uuid(),
  'menu-navigation',
  'Menu Navigation System',
  '1.0.0',
  'Interactive menu navigation system with keyboard shortcuts, search functionality, and role-based access control for seamless application navigation',
  'CAS Development Team',
  '/src/plugins/navigation/index.ts',
  'active',
  true,
  'system',
  NOW(),
  NOW()
)
ON CONFLICT (PluginId) DO UPDATE SET
  PluginName = EXCLUDED.PluginName,
  PluginVersion = EXCLUDED.PluginVersion,
  PluginDescription = EXCLUDED.PluginDescription,
  PluginAuthor = EXCLUDED.PluginAuthor,
  PluginStatus = EXCLUDED.PluginStatus,
  IsSystem = EXCLUDED.IsSystem,
  Category = EXCLUDED.Category,
  UpdatedAt = NOW();

-- Register API endpoints for menu-navigation plugin
INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/modules',
  'GET',
  'Get user-accessible navigation modules',
  ARRAY['navigation:view'],
  false,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/search',
  'GET',
  'Search navigation modules',
  ARRAY['navigation:view'],
  false,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/config',
  'GET',
  'Get navigation configuration',
  ARRAY['navigation:view'],
  false,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/status',
  'GET',
  'Plugin health check and statistics',
  ARRAY[]::text[],
  true,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

-- Register RBAC permissions for menu-navigation plugin
INSERT INTO plugin.plugin_rbac_permissions (
  id, pluginid, permissionname, resourcetype, resourceid, description, issystemlevel, createdat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'navigation:view',
  'action',
  '*',
  'View navigation modules',
  false,
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, permissionname, resourcetype, resourceid) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (
  id, pluginid, permissionname, resourcetype, resourceid, description, issystemlevel, createdat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'navigation:configure',
  'action',
  '*',
  'Configure navigation system settings',
  true,
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, permissionname, resourcetype, resourceid) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (
  id, pluginid, permissionname, resourcetype, resourceid, description, issystemlevel, createdat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'navigation:manage',
  'action',
  '*',
  'Manage navigation modules',
  true,
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, permissionname, resourcetype, resourceid) DO NOTHING;

-- ============================================================================
-- PART 2: Additional API Endpoints
-- ============================================================================

-- PUT /config - Update navigation configuration
INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/config',
  'PUT',
  'Update navigation configuration settings including keyboard shortcuts, theme, and display options',
  ARRAY['navigation:configure'],
  false,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

-- POST /modules - Add new navigation module
INSERT INTO plugin.plugin_api_registry (
  id, pluginid, apipath, httpmethod, apidescription,
  requiredpermissions, ispublic, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  '/api/plugins/menu-navigation/modules',
  'POST',
  'Add a new navigation module to the system with custom routes and permissions',
  ARRAY['navigation:manage'],
  false,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, apipath, httpmethod) DO UPDATE SET
  apidescription = EXCLUDED.apidescription,
  requiredpermissions = EXCLUDED.requiredpermissions,
  updatedat = NOW();

-- ============================================================================
-- PART 3: Plugin Documentation
-- ============================================================================

-- README Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'readme',
  'Menu Navigation System',
  '# Menu Navigation System

## Overview

The Menu Navigation System is a powerful, accessible navigation plugin for the CAS Dashboard that provides:

- **Keyboard Shortcuts**: Quick access via Ctrl+K (configurable)
- **Real-time Search**: Instant filtering of navigation modules
- **Role-Based Access**: Modules filtered by user permissions
- **Customizable UI**: Configurable themes and display options
- **Plugin Integration**: Automatic registration of plugin navigation items

## Features

### 1. Keyboard Navigation
- Press `Ctrl+K` to open the navigation modal
- Press `Escape` to close
- Use arrow keys to navigate between items
- Press `Enter` to select

### 2. Search Functionality
- Real-time filtering as you type
- Searches module names, descriptions, and plugin IDs
- Minimum 2 characters required for server-side search
- Instant local filtering for immediate feedback

### 3. Access Control
- Modules are filtered based on user permissions
- Integration with User Access Management plugin
- Support for public and authenticated routes
- Per-module permission requirements

### 4. Configuration Options
- Enable/disable keyboard shortcuts
- Custom keyboard shortcut binding
- Theme selection (auto, light, dark)
- Maximum items per category
- Customizable sort options

## Quick Start

1. The plugin is automatically activated on installation
2. Press `Ctrl+K` to open the navigation modal
3. Start typing to search for modules
4. Click or press Enter to navigate

## Requirements

- CAS Dashboard v1.0.0 or higher
- Node.js v18.0.0 or higher
- PostgreSQL database

## License

MIT License - CAS Development Team',
  'markdown',
  'en',
  '1.0.0',
  true,
  1,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 
DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  iscurrent = true,
  updatedat = NOW();

-- API Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'api',
  'API Reference',
  '# Menu Navigation System - API Reference

## Base URL

```
/api/plugins/menu-navigation
```

## Authentication

All endpoints except `/status` require authentication via Bearer token.

```
Authorization: Bearer <token>
```

---

## Endpoints

### GET /modules

Retrieve all navigation modules accessible to the current user.

**Permissions Required:** `navigation:view`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Plugin Manager",
      "description": "Manage system plugins",
      "pluginId": "plugin-manager",
      "route": "/admin/plugins",
      "icon": "settings",
      "sortOrder": 10,
      "requiresAuth": true,
      "requiredPermissions": ["plugin.admin"],
      "isActive": true
    }
  ],
  "count": 5,
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

### GET /search

Search navigation modules by name, description, or plugin ID.

**Permissions Required:** `navigation:view`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (min 2 characters) |

**Example:**
```
GET /api/plugins/menu-navigation/search?q=plugin
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 2,
  "query": "plugin",
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

### GET /config

Retrieve current navigation configuration.

**Permissions Required:** `navigation:view`

**Response:**
```json
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
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

### PUT /config

Update navigation configuration.

**Permissions Required:** `navigation:configure`

**Request Body:**
```json
{
  "enableKeyboardShortcut": true,
  "keyboardShortcut": "Ctrl+K",
  "maxItemsPerCategory": 100,
  "theme": "dark"
}
```

**Allowed Fields:**
- `enableKeyboardShortcut` (boolean)
- `keyboardShortcut` (string)
- `maxItemsPerCategory` (number)
- `searchEnabled` (boolean)
- `sortOptions` (string[])
- `theme` (string: "auto" | "light" | "dark")

**Response:**
```json
{
  "success": true,
  "message": "Navigation configuration updated successfully",
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

### POST /modules

Add a new navigation module.

**Permissions Required:** `navigation:manage`

**Request Body:**
```json
{
  "name": "Custom Module",
  "description": "A custom navigation module",
  "pluginId": "custom-plugin",
  "route": "/custom",
  "icon": "star",
  "sortOrder": 100,
  "requiresAuth": true,
  "requiredPermissions": ["custom.view"],
  "isActive": true
}
```

**Required Fields:**
- `name` (string)
- `description` (string)
- `pluginId` (string)
- `sortOrder` (number)

**Response:**
```json
{
  "success": true,
  "message": "Navigation module added successfully",
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

### GET /status

Get plugin health check and statistics. This endpoint is public.

**Permissions Required:** None (public)

**Response:**
```json
{
  "success": true,
  "plugin": {
    "name": "Menu Navigation System",
    "version": "1.0.0",
    "status": "active",
    "statistics": {
      "totalModules": 5,
      "activeModules": 5,
      "configLoaded": true,
      "lastUpdated": "2025-11-30T10:00:00.000Z"
    }
  },
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-11-30T10:00:00.000Z"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error',
  'markdown',
  'en',
  '1.0.0',
  true,
  2,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 

DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updatedat = NOW();

-- User Guide Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'user_guide',
  'User Guide',
  '# Menu Navigation System - User Guide

## Getting Started

The Menu Navigation System provides a fast and intuitive way to navigate through the CAS Dashboard application.

## Opening the Navigation Menu

### Using Keyboard Shortcut
1. Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac)
2. The navigation modal will appear in the center of the screen

### Using the Navigation Button
1. Look for the navigation icon in the header
2. Click to open the navigation modal

## Searching for Modules

1. Open the navigation modal
2. Start typing in the search box
3. Results will filter in real-time
4. Click on a result to navigate

### Search Tips
- Search by module name (e.g., "Plugin")
- Search by description keywords
- Search by plugin ID (e.g., "ldap")
- Minimum 2 characters for search

## Navigating with Keyboard

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open navigation |
| `Escape` | Close navigation |
| `↑` / `↓` | Navigate items |
| `Enter` | Select item |
| `Tab` | Move focus |

## Sorting Modules

Use the "Sort by" dropdown to change the order:
- **Order**: Default sort order set by administrators
- **Name**: Alphabetical by module name
- **Plugin**: Grouped by plugin ID

## Understanding Module Icons

Each module may display an icon indicating its category:
- ⚙️ Settings and configuration
- 👤 User management
- 🔐 Security and authentication
- 📊 Dashboard and analytics
- 📁 File and document management

## Access Permissions

Some modules may be hidden based on your role:
- You only see modules you have permission to access
- Contact your administrator for additional access
- System modules require admin privileges

## Customization (Administrators)

Administrators can customize the navigation:
1. Navigate to Plugin Manager
2. Find "Menu Navigation System"
3. Click Configure
4. Adjust settings:
   - Enable/disable keyboard shortcuts
   - Change keyboard shortcut binding
   - Set theme preference
   - Configure maximum items displayed

## Troubleshooting

### Navigation not opening?
- Ensure keyboard shortcuts are enabled
- Check if another application is using Ctrl+K
- Try clicking the navigation button instead

### Missing modules?
- Verify you have the required permissions
- Contact your administrator
- Check if the module is active

### Search not working?
- Type at least 2 characters
- Check your network connection
- Refresh the page and try again',
  'markdown',
  'en',
  '1.0.0',
  true,
  3,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 

DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updatedat = NOW();

-- Installation Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'installation',
  'Installation Guide',
  '# Menu Navigation System - Installation Guide

## Prerequisites

- CAS Dashboard v1.0.0 or higher
- Node.js v18.0.0 or higher
- PostgreSQL 14 or higher
- Existing CAS database setup

## Automatic Installation

The Menu Navigation System is a core plugin and is automatically installed with CAS Dashboard.

## Manual Installation

If you need to reinstall or update the plugin:

### Step 1: Run Database Migration

```bash
cd /var/www/cas
psql -h localhost -U dashboard_user -d dashboard_db \
  -f database/migrations/20251130_add_menu_navigation_plugin.sql
```

### Step 2: Restart Backend

```bash
./restart.sh
```

### Step 3: Verify Installation

```bash
curl http://localhost:4000/api/plugins/menu-navigation/status
```

Expected response:
```json
{
  "success": true,
  "plugin": {
    "name": "Menu Navigation System",
    "version": "1.0.0",
    "status": "active"
  }
}
```

## Configuration

### Database Tables

The plugin creates the following tables:

1. **plugin.navigation_modules** - Stores navigation module definitions
2. **plugin.navigation_config** - Stores plugin configuration

### Default Modules

The following default modules are created:
- Dashboard
- Documentation  
- Plugin Manager
- User Management
- LDAP Configuration

### Environment Variables

No additional environment variables are required.

## Upgrading

To upgrade from a previous version:

1. Backup your database
2. Run the latest migration
3. Restart the backend
4. Clear browser cache

## Uninstallation

To remove the plugin:

```sql
-- Remove plugin data
DELETE FROM plugin.navigation_modules;
DELETE FROM plugin.navigation_config;

-- Remove plugin configuration
DELETE FROM plugin.plugin_api_registry 
WHERE pluginid = (SELECT id FROM plugin.plugin_configurations WHERE pluginid = ''menu-navigation'');

DELETE FROM plugin.plugin_rbac_permissions 
WHERE pluginid = (SELECT id FROM plugin.plugin_configurations WHERE pluginid = ''menu-navigation'');

DELETE FROM plugin.plugin_md_documentation 
WHERE pluginid = (SELECT id FROM plugin.plugin_configurations WHERE pluginid = ''menu-navigation'');

DELETE FROM plugin.plugin_configurations WHERE pluginid = ''menu-navigation'';
```

**Warning:** This will permanently delete all navigation data.',
  'markdown',
  'en',
  '1.0.0',
  true,
  4,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 

DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updatedat = NOW();

-- Changelog Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'changelog',
  'Changelog',
  '# Menu Navigation System - Changelog

## [1.0.0] - 2025-11-30

### Added
- Initial release of Menu Navigation System
- Keyboard shortcut support (Ctrl+K)
- Real-time search functionality
- Role-based access control integration
- Configurable theme support (auto, light, dark)
- Module sorting options (name, plugin, order)
- Plugin status and health check endpoint
- Comprehensive API documentation
- User guide documentation
- Installation guide

### Features
- `/modules` - Get accessible navigation modules
- `/search` - Search modules by query
- `/config` - Get/update configuration
- `/status` - Plugin health check

### Security
- Integration with User Access Management plugin
- Permission-based module filtering
- Secure API endpoints with authentication

### Technical
- TypeScript implementation
- PostgreSQL database storage
- Express.js routing
- React frontend components

---

## Future Roadmap

### [1.1.0] - Planned
- Favorites/pinned modules
- Recent navigation history
- Custom module icons
- Drag-and-drop reordering
- Module categories/groups

### [1.2.0] - Planned
- Multi-language support
- Voice navigation (accessibility)
- Custom themes
- Analytics integration
- Mobile-optimized view',
  'markdown',
  'en',
  '1.0.0',
  true,
  5,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 

DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updatedat = NOW();

-- Examples Documentation
INSERT INTO plugin.plugin_md_documentation (
  id, pluginid, documenttype, title, content, contentformat, 
  language, version, iscurrent, orderindex, createdat, updatedat
)
SELECT
  gen_random_uuid(),
  pc.Id,
  'examples',
  'Code Examples',
  '# Menu Navigation System - Code Examples

## Frontend Integration

### Using the Navigation Modal

```tsx
import { NavigationModal } from ''@/components/NavigationManager/NavigationModal'';

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ''k'') {
        e.preventDefault();
        setIsNavOpen(true);
      }
    };
    
    window.addEventListener(''keydown'', handleKeyDown);
    return () => window.removeEventListener(''keydown'', handleKeyDown);
  }, []);

  return (
    <>
      <NavigationModal 
        isOpen={isNavOpen} 
        onClose={() => setIsNavOpen(false)} 
      />
      {/* Rest of your app */}
    </>
  );
}
```

### Using the Navigation API Service

```tsx
import { NavigationApiService } from ''@/services/NavigationService'';

// Get all modules
const response = await NavigationApiService.getModules();
if (response.success) {
  console.log(''Modules:'', response.data);
}

// Search modules
const searchResponse = await NavigationApiService.searchModules(''plugin'');
if (searchResponse.success) {
  console.log(''Search results:'', searchResponse.data);
}

// Get configuration
const configResponse = await NavigationApiService.getConfig();
if (configResponse.success) {
  console.log(''Config:'', configResponse.data);
}
```

## Backend Integration

### Adding a Custom Module Programmatically

```typescript
import { NavigationService } from ''./NavigationService'';

const navigationService = new NavigationService(db);

await navigationService.addModule({
  name: ''My Custom Module'',
  description: ''A custom navigation module'',
  pluginId: ''my-plugin'',
  route: ''/my-module'',
  icon: ''custom-icon'',
  sortOrder: 50,
  requiresAuth: true,
  requiredPermissions: [''my-plugin.view''],
  isActive: true
});
```

### Creating a Plugin with Navigation

```typescript
// In your plugin''s index.ts
export default {
  id: ''my-plugin'',
  name: ''My Plugin'',
  version: ''1.0.0'',
  
  async activate(context) {
    // Register navigation module
    await context.services.navigation.addModule({
      name: ''My Plugin Dashboard'',
      description: ''Access My Plugin features'',
      pluginId: this.id,
      route: ''/plugins/my-plugin'',
      sortOrder: 100,
      requiresAuth: true,
      requiredPermissions: [''my-plugin.access'']
    });
  },
  
  async deactivate(context) {
    // Optionally remove navigation module
    await context.services.navigation.removeModule(this.id);
  }
};
```

## API Examples

### cURL Examples

**Get Modules:**
```bash
curl -X GET "http://localhost:4000/api/plugins/menu-navigation/modules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Search Modules:**
```bash
curl -X GET "http://localhost:4000/api/plugins/menu-navigation/search?q=plugin" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Update Configuration:**
```bash
curl -X PUT "http://localhost:4000/api/plugins/menu-navigation/config" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d ''{"theme": "dark", "maxItemsPerCategory": 100}''
```

**Add Module:**
```bash
curl -X POST "http://localhost:4000/api/plugins/menu-navigation/modules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d ''{
    "name": "Custom Module",
    "description": "My custom module",
    "pluginId": "custom",
    "route": "/custom",
    "sortOrder": 99
  }''
```

## Database Examples

### Query Active Modules

```sql
SELECT name, description, route, sortOrder
FROM plugin.navigation_modules
WHERE isActive = true
ORDER BY sortOrder ASC;
```

### Get Configuration

```sql
SELECT configValue
FROM plugin.navigation_config
WHERE configKey = ''settings'';
```

### Add Module via SQL

```sql
INSERT INTO plugin.navigation_modules (
  name, description, pluginId, route, sortOrder, isActive, createdAt, updatedAt
) VALUES (
  ''Custom Module'',
  ''A custom navigation module'',
  ''custom-plugin'',
  ''/custom'',
  50,
  true,
  NOW(),
  NOW()
);
```',
  'markdown',
  'en',
  '1.0.0',
  true,
  6,
  NOW(),
  NOW()
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'menu-navigation'
ON CONFLICT (pluginid, documenttype, language, version) 

DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updatedat = NOW();

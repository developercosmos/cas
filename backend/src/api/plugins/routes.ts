import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { requireSystemPluginAdmin } from '../../middleware/admin.js';
import { PluginService } from '../../services/PluginService.js';
import { PluginDocumentationService } from '../../services/PluginDocumentationService.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { RbacPermissionService } from '../../services/RbacPermissionService.js';
import { PluginCommunicationService } from '../../services/PluginCommunicationService.js';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const pluginService = new PluginService();
const rbacService = new RbacPermissionService();
const communicationService = new PluginCommunicationService();

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
}

const pluginRegistry = new Map<string, PluginManifest>([
  ['core.text-block', {
    id: 'core.text-block',
    name: 'Text Block',
    version: '1.0.0',
    description: 'Basic text editing block',
    author: 'Dashboard Team',
    permissions: ['storage.read', 'storage.write'],
  }],
]);

router.get('/', async (req, res) => {
  try {
    // Load LDAP plugin dynamically
    const ldapPlugin = await pluginService.getAuthPlugin('ldap-auth');

    // Load plugin configurations from database to get current status
    const pluginConfigs = await DatabaseService.query<any>(
      'SELECT pluginid, pluginname, pluginversion, plugindescription, pluginauthor, pluginstatus, Category, IsSystem FROM plugin.plugin_configurations ORDER BY pluginid'
    );

    // Build plugins array from database
    const plugins = pluginConfigs.map(config => {
      const basePlugin = {
        id: config.pluginid,
        name: config.pluginname,
        version: config.pluginversion,
        description: config.plugindescription,
        author: config.pluginauthor,
        status: config.pluginstatus || 'disabled',
        category: config.category || 'application',
        isSystem: config.issystem || false
      };

      // Add plugin-specific metadata
      if (config.pluginid === 'core.text-block') {
        return {
          ...basePlugin,
          permissions: ['storage.read', 'storage.write']
        };
      } else if (config.pluginid === 'ldap-auth') {
        return {
          ...basePlugin,
          permissions: ['auth.ldap'],
          isSystem: true,
          routes: ldapPlugin ? {
            configure: '/api/plugins/ldap/configure',
            test: '/api/plugins/ldap/test',
            import: '/api/plugins/ldap/import',
            authenticate: '/api/plugins/ldap/authenticate'
          } : null
        };
      } else if (config.pluginid === 'rag-retrieval') {
        return {
          ...basePlugin,
          permissions: ['document:upload', 'chat:create', 'collection:manage', 'rag:configure'],
          isSystem: true,
          icon: '🧠',
          capabilities: {
            multilingual: true,
            languages: ['English', 'Bahasa Indonesia', '100+ languages'],
            vectorSearch: true,
            semanticSearch: true,
            chatInterface: true,
            documentProcessing: true
          },
          routes: {
            status: '/api/plugins/rag/status',
            configure: '/api/plugins/rag/configure',
            test: '/api/plugins/rag/test',
            aiStatus: '/api/plugins/rag/ai/status',
            aiTest: '/api/plugins/rag/ai/test',
            collections: '/api/plugins/rag/collections',
            documents: '/api/plugins/rag/documents',
            sessions: '/api/plugins/rag/sessions',
            chat: '/api/plugins/rag/chat'
          }
        };
      } else if (config.pluginid === 'user-access-management') {
        return {
          ...basePlugin,
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
          ],
          isSystem: true,
          icon: '🔐',
          capabilities: {
            rbac: true,
            roleManagement: true,
            userManagement: true,
            permissionManagement: true,
            auditLogging: true,
            multiRoleAssignment: true,
            permissionHierarchy: true,
            userAccessReporting: true,
            enterpriseCompliance: true
          },
          routes: {
            manage: '/api/user-access',
            roles: '/api/user-access/roles',
            permissions: '/api/user-access/permissions',
            users: '/api/user-access/users',
            audit: '/api/user-access/audit'
          }
        };
      }

      return basePlugin;
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });

    res.json({
      success: true,
      data: plugins
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plugins'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Constitution: Load LDAP plugin routes
try {
  const { plugin: ldapPlugin } = await import('../../plugins/ldap/index.js');
  if (ldapPlugin && ldapPlugin.routes) {
    router.use('/ldap', ldapPlugin.routes);
    console.log('🔌 LDAP plugin routes registered: /api/plugins/ldap');
  }
} catch (error) {
  console.error('❌ Failed to register LDAP plugin routes:', error);
}

// Constitution: Load User Access Management plugin routes
// Note: User Access Management routes will be registered separately
console.log('🔐 User Access Management plugin available: /api/user-access');

router.get('/:id', (req, res) => {
  const plugin = pluginRegistry.get(req.params.id);
  if (!plugin) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.json(plugin);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Plugin status endpoint - proxies to specific plugin status routes
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Map plugin IDs to their status endpoints
    const statusRouteMap: Record<string, string | null> = {
      'ldap-auth': '/api/plugins/ldap/status',
      'rag-retrieval': '/api/plugins/rag/status',
      'core.text-block': null // Text block doesn't have a status endpoint
    };

    const statusRoute = statusRouteMap[id];
    
    if (!statusRoute) {
      // For plugins without status endpoints, return basic info
      return res.json({
        success: true,
        plugin: {
          id,
          status: 'active',
          message: 'Plugin does not have detailed status endpoint'
        }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    // Forward the request to the actual plugin status endpoint
    const token = req.headers.authorization;
    
    const fetch = (await import('node-fetch')).default;
    const baseURL = `http://localhost:${process.env.PORT || 4000}`;
    const response = await fetch(`${baseURL}${statusRoute}`, {
      headers: {
        'Authorization': token || ''
      }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });

    const data = await response.json();
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error(`Error getting status for plugin ${id}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plugin status'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Enable/disable plugin endpoints - saves to database
router.post('/:id/enable', authenticate, requireSystemPluginAdmin, async (req, res) => {
  const pluginId = req.params.id;
  
  try {
    // Update plugin status in database
    const result = await DatabaseService.query<any>(
      'UPDATE plugin.plugin_configurations SET pluginstatus = $1, updatedat = NOW() WHERE pluginid = $2 RETURNING pluginid, pluginname, pluginversion, pluginstatus',
      ['active', pluginId]
    );

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Plugin not found' 
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    const plugin = result[0];
    console.log(`✅ Plugin enabled in database: ${pluginId} -> active`);
    
    res.json({ 
      success: true, 
      message: `Plugin ${plugin.pluginname} enabled successfully`,
      plugin: {
        id: plugin.pluginid,
        name: plugin.pluginname,
        version: plugin.pluginversion,
        status: plugin.pluginstatus
      }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    console.error(`❌ Error enabling plugin ${pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable plugin'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.post('/:id/disable', authenticate, requireSystemPluginAdmin, async (req, res) => {
  const pluginId = req.params.id;
  
  try {
    // Update plugin status in database
    const result = await DatabaseService.query<any>(
      'UPDATE plugin.plugin_configurations SET pluginstatus = $1, updatedat = NOW() WHERE pluginid = $2 RETURNING pluginid, pluginname, pluginversion, pluginstatus',
      ['disabled', pluginId]
    );

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Plugin not found' 
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    const plugin = result[0];
    console.log(`⚠️ Plugin disabled in database: ${pluginId} -> disabled`);
    
    res.json({ 
      success: true, 
      message: `Plugin ${plugin.pluginname} disabled successfully`,
      plugin: {
        id: plugin.pluginid,
        name: plugin.pluginname,
        version: plugin.pluginversion,
        status: plugin.pluginstatus
      }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    console.error(`❌ Error disabling plugin ${pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable plugin'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.post('/', (req, res) => {
  try {
    const manifest: PluginManifest = req.body;
    
    if (!manifest.id || !manifest.name || !manifest.version) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      return res.status(400).json({ error: 'Invalid plugin manifest' });
    }

    if (pluginRegistry.has(manifest.id)) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      return res.status(409).json({ error: 'Plugin already exists' });
    }

    pluginRegistry.set(manifest.id, manifest);
    res.status(201).json(manifest);
  } catch (error) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    res.status(500).json({ error: 'Failed to register plugin' });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.delete('/:id', (req, res) => {
  const deleted = pluginRegistry.delete(req.params.id);
  if (!deleted) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.status(204).send();
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Helper function to get plugin source directory
function getPluginSourceDir(pluginId: string): string | null {
  // Map plugin IDs to their source directories
  const pluginDirMap: Record<string, string> = {
    'ldap-auth': 'ldap-portable',
    'rag-retrieval': 'rag',
    'core.text-block': 'text-block'
  };
  
  const dirName = pluginDirMap[pluginId];
  if (!dirName) return null;
  
  const pluginDir = path.join(__dirname, '../../plugins', dirName);
  if (fs.existsSync(pluginDir)) {
    return pluginDir;
  }
  
  // Also check for portable version
  const portableDir = path.join(__dirname, '../../plugins', `${dirName}-portable`);
  if (fs.existsSync(portableDir)) {
    return portableDir;
  }
  
  return null;
}

// Helper to get frontend components for a plugin from main frontend
function getPluginFrontendComponents(pluginId: string): string[] {
  const componentMap: Record<string, string[]> = {
    'ldap-auth': ['LdapConfig', 'LdapTreeBrowser', 'LdapUserManager'],
    'rag-retrieval': ['RagChat', 'RagCollections', 'RagDocuments', 'RagConfig'],
    'core.text-block': ['TextBlock']
  };
  return componentMap[pluginId] || [];
}

// Helper to get frontend services for a plugin
function getPluginFrontendServices(pluginId: string): string[] {
  const serviceMap: Record<string, string[]> = {
    'ldap-auth': ['LdapService.ts'],
    'rag-retrieval': ['RagService.ts'],
    'core.text-block': []
  };
  return serviceMap[pluginId] || [];
}

// Helper to generate frontend package.json for plugin
function generatePluginFrontendPackageJson(pluginId: string, manifest: any): string {
  return JSON.stringify({
    name: `@cas/plugin-${pluginId}-frontend`,
    version: manifest.version,
    description: `Frontend components for ${manifest.name}`,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc && vite build',
      dev: 'vite'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    },
    peerDependencies: {
      '@cas/ui-components': '^1.0.0'
    },
    devDependencies: {
      typescript: '^5.0.0',
      vite: '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0'
    }
  }, null, 2);
}

// Helper function to add directory to archive recursively
function addDirectoryToArchive(archive: archiver.Archiver, dirPath: string, zipPath: string, excludePatterns: string[] = []) {
  if (!fs.existsSync(dirPath)) return;
  
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.join(zipPath, entry.name);
    
    // Check exclusions
    const shouldExclude = excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(entry.name);
      }
      return entry.name === pattern;
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
    
    if (shouldExclude) continue;
    
    if (entry.isDirectory()) {
      addDirectoryToArchive(archive, fullPath, relativePath, excludePatterns);
    } else {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.file(fullPath, { name: relativePath });
    }
  }
}

// Export plugin as ZIP package with RUNNABLE CODE (following PORTABLE_PLUGIN_SYSTEM_IMPLEMENTATION_GUIDE.md)
router.get('/:id/export', authenticate, async (req: AuthRequest, res) => {
  const pluginId = req.params.id;
  
  try {
    console.log(`📦 Exporting plugin as ZIP with runnable code: ${pluginId}`);
    
    // Get plugin configuration from database
    const pluginConfig = await DatabaseService.queryOne<any>(
      `SELECT * FROM plugin.plugin_configurations WHERE pluginid = $1`,
      [pluginId]
    );
    
    if (!pluginConfig) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    // Get plugin source directory
    const pluginSourceDir = getPluginSourceDir(pluginId);
    
    // Get plugin documentation from database
    const docs = await PluginDocumentationService.getByPluginId(pluginId, 'en', true);
    
    // Get plugin-specific data based on plugin type
    let pluginData: any = {};
    
    if (pluginId === 'ldap-auth') {
      try {
        const ldapConfigs = await DatabaseService.query<any>(
          `SELECT serverurl, basedn, binddn, searchfilter, searchattribute, groupattribute, issecure, port, isactive 
           FROM plugin.ldap_configurations`
        );
        pluginData.configurations = ldapConfigs;
      } catch (e) {
        pluginData.configurations = [];
      }
    } else if (pluginId === 'rag-retrieval') {
      try {
        const ragConfigs = await DatabaseService.query<any>(
          `SELECT id, name, provider, model, embedding_model, chunk_size, chunk_overlap, isactive 
           FROM plugin.rag_configurations`
        );
        pluginData.configurations = ragConfigs;
      } catch (e) {
        pluginData.configurations = [];
      }
      
      try {
        const collections = await DatabaseService.query<any>(
          `SELECT name, description, embedding_model, document_count, createdat 
           FROM plugin.rag_tx_collections`
        );
        pluginData.collections = collections;
      } catch (e) {
        pluginData.collections = [];
      }
    }
    
    // Build plugin.json manifest
    const pluginManifest = {
      id: pluginConfig.pluginid,
      name: pluginConfig.pluginname,
      version: pluginConfig.pluginversion,
      description: pluginConfig.plugindescription,
      author: pluginConfig.pluginauthor,
      license: 'MIT',
      entry: 'backend/dist/index.js',
      status: pluginConfig.pluginstatus,
      isSystem: pluginConfig.issystem || false,
      category: pluginId === 'ldap-auth' ? 'authentication' : 
                pluginId === 'rag-retrieval' ? 'ai' : 'utility',
      permissions: pluginConfig.permissions || [],
      compatibility: {
        casVersion: '>=1.0.0',
        nodeVersion: '>=18.0.0',
        dependencies: {
          '@cas/core-api': '^1.0.0'
        }
      },
      endpoints: pluginId === 'ldap-auth' ? {
        status: '/api/plugins/ldap/status',
        configure: '/api/plugins/ldap/configure',
        test: '/api/plugins/ldap/test',
        import: '/api/plugins/ldap/import'
      } : pluginId === 'rag-retrieval' ? {
        status: '/api/plugins/rag/status',
        configure: '/api/plugins/rag/configure',
        collections: '/api/plugins/rag/collections',
        chat: '/api/plugins/rag/chat'
      } : {},
      database: {
        schema: 'plugin',
        migrations: ['001_setup.sql']
      }
    };
    
    // Create ZIP archive
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    const archive = archiver('zip', { zlib: { level: 9 } });
    const filename = `${pluginId}-v${pluginConfig.pluginversion}-${Date.now()}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    archive.pipe(res);
    
    // 1. Add plugin.json manifest
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    archive.append(JSON.stringify(pluginManifest, null, 2), { name: 'plugin.json' });
    
    // 2. Add backend source code (TypeScript) - for development/modification
    if (pluginSourceDir) {
      const backendSrcDir = path.join(pluginSourceDir, 'backend', 'src');
      if (fs.existsSync(backendSrcDir)) {
        addDirectoryToArchive(archive, backendSrcDir, 'backend/src', ['*.test.ts', 'tests']);
        console.log(`  📁 Added backend/src from ${backendSrcDir}`);
      }
      
      // Add backend dist (compiled JS) - for immediate execution
      const backendDistDir = path.join(pluginSourceDir, 'backend', 'dist');
      if (fs.existsSync(backendDistDir)) {
        addDirectoryToArchive(archive, backendDistDir, 'backend/dist', []);
        console.log(`  📁 Added backend/dist from ${backendDistDir}`);
      }
      
      // Add backend package.json
      const backendPackageJson = path.join(pluginSourceDir, 'backend', 'package.json');
      if (fs.existsSync(backendPackageJson)) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.file(backendPackageJson, { name: 'backend/package.json' });
      }
      
      // Add backend tsconfig.json
      const backendTsconfig = path.join(pluginSourceDir, 'backend', 'tsconfig.json');
      if (fs.existsSync(backendTsconfig)) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.file(backendTsconfig, { name: 'backend/tsconfig.json' });
      }
      
      // Add migrations
      const migrationsDir = path.join(pluginSourceDir, 'backend', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        addDirectoryToArchive(archive, migrationsDir, 'backend/migrations', []);
        console.log(`  📁 Added backend/migrations from ${migrationsDir}`);
      }
      
      // Add frontend if exists in plugin directory
      const frontendDir = path.join(pluginSourceDir, 'frontend');
      if (fs.existsSync(frontendDir)) {
        addDirectoryToArchive(archive, frontendDir, 'frontend', ['node_modules', 'dist']);
        console.log(`  📁 Added frontend from ${frontendDir}`);
      }
      
      // Add tests
      const testsDir = path.join(pluginSourceDir, 'tests');
      if (fs.existsSync(testsDir)) {
        addDirectoryToArchive(archive, testsDir, 'tests', []);
        console.log(`  📁 Added tests from ${testsDir}`);
      }
      
      // Add plugin's own plugin.json if different
      const pluginJsonPath = path.join(pluginSourceDir, 'plugin.json');
      if (fs.existsSync(pluginJsonPath)) {
        const sourceManifest = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
        // Merge with database config
        Object.assign(pluginManifest, sourceManifest);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(JSON.stringify(pluginManifest, null, 2), { name: 'plugin.json' });
      }
    }
    
    // Also check for frontend components in main frontend directory
    const mainFrontendComponents = getPluginFrontendComponents(pluginId);
    if (mainFrontendComponents.length > 0) {
      const frontendRoot = path.join(__dirname, '../../../../frontend');
      for (const component of mainFrontendComponents) {
        const componentDir = path.join(frontendRoot, 'src', 'components', component);
        if (fs.existsSync(componentDir)) {
          addDirectoryToArchive(archive, componentDir, `frontend/src/components/${component}`, []);
          console.log(`  📁 Added frontend component: ${component}`);
        }
      }
      
      // Add related services
      const services = getPluginFrontendServices(pluginId);
      for (const service of services) {
        const servicePath = path.join(frontendRoot, 'src', 'services', service);
        if (fs.existsSync(servicePath)) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
          archive.file(servicePath, { name: `frontend/src/services/${service}` });
          console.log(`  📄 Added frontend service: ${service}`);
        }
      }
      
      // Add frontend package.json template for the plugin
      const frontendPackageJson = generatePluginFrontendPackageJson(pluginId, pluginManifest);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(frontendPackageJson, { name: 'frontend/package.json' });
    }
    
    if (!pluginSourceDir) {
      // No source directory found - create embedded runnable code
      console.log(`  ⚠️ No source directory found for ${pluginId}, creating embedded code`);
      
      // Create a minimal plugin entry point
      const embeddedCode = generateEmbeddedPluginCode(pluginId, pluginManifest);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(embeddedCode.indexJs, { name: 'backend/dist/index.js' });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(embeddedCode.routesJs, { name: 'backend/dist/routes.js' });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(embeddedCode.packageJson, { name: 'backend/package.json' });
      
      // Add migration SQL
      if (embeddedCode.migrationSql) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(embeddedCode.migrationSql, { name: 'backend/migrations/001_setup.sql' });
      }
      
      // Add embedded frontend components
      if (mainFrontendComponents.length === 0) {
        const embeddedFrontend = generateEmbeddedFrontendCode(pluginId, pluginManifest);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(embeddedFrontend.indexTsx, { name: 'frontend/src/index.tsx' });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(embeddedFrontend.componentTsx, { name: `frontend/src/components/${pluginManifest.name.replace(/\s+/g, '')}Plugin.tsx` });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(embeddedFrontend.stylesCss, { name: `frontend/src/components/${pluginManifest.name.replace(/\s+/g, '')}Plugin.module.css` });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(embeddedFrontend.packageJson, { name: 'frontend/package.json' });
      }
    }
    
    // 3. Add documentation files from database
    if (docs.length > 0) {
      for (const doc of docs) {
        const docFilename = `docs/${doc.documentType}.${doc.contentFormat === 'markdown' ? 'md' : 'html'}`;
        const docContent = doc.contentFormat === 'markdown' 
          ? `# ${doc.title}\n\n${doc.content}`
          : doc.content;
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        archive.append(docContent, { name: docFilename });
      }
      
      const docsIndex = docs.map(doc => ({
        type: doc.documentType,
        title: doc.title,
        format: doc.contentFormat,
        language: doc.language,
        version: doc.version
      }));
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(JSON.stringify(docsIndex, null, 2), { name: 'docs/index.json' });
    }
    
    // 4. Add plugin data export (configurations, not sensitive data)
    if (Object.keys(pluginData).length > 0) {
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      archive.append(JSON.stringify(pluginData, null, 2), { name: 'data/export.json' });
    }
    
    // 5. Add export metadata
    const exportMetadata = {
      exportVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: (req.user as any)?.email || 'system',
      includesSourceCode: !!pluginSourceDir,
      includesCompiledCode: true,
      sourceSystem: {
        casVersion: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    archive.append(JSON.stringify(exportMetadata, null, 2), { name: 'metadata.json' });
    
    // 6. Add README for the plugin
    const readme = generatePluginReadme(pluginManifest);
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    archive.append(readme, { name: 'README.md' });
    
    // 7. Generate checksum for integrity
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    const checksumData = JSON.stringify({ pluginManifest, exportMetadata });
    const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    archive.append(checksum, { name: 'checksum.sha256' });
    
    archive.finalize();
    
    console.log(`✅ Plugin exported as ZIP with runnable code: ${pluginId}`);
    
  } catch (error) {
    console.error(`❌ Error exporting plugin ${pluginId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export plugin'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Helper to generate embedded plugin code when source is not available
function generateEmbeddedPluginCode(pluginId: string, manifest: any): {
  indexJs: string;
  routesJs: string;
  packageJson: string;
  migrationSql?: string;
} {
  const pluginName = manifest.name || pluginId;
  
  // Generate index.js (plugin entry point with lifecycle methods)
  const indexJs = `// ${pluginName} - Auto-generated Plugin Entry Point
// Version: ${manifest.version}
// Generated: ${new Date().toISOString()}

export default class ${pluginId.replace(/[^a-zA-Z0-9]/g, '')}Plugin {
  constructor() {
    this.id = '${pluginId}';
    this.name = '${pluginName}';
    this.version = '${manifest.version}';
    this.isInitialized = false;
  }

  async initialize(context) {
    console.log(\`🔌 Initializing plugin: \${this.name}\`);
    this.context = context;
    this.db = context.database;
    this.logger = context.logger || console;
    this.isInitialized = true;
    return { success: true };
  }

  async activate() {
    console.log(\`✅ Activating plugin: \${this.name}\`);
    return { success: true, message: 'Plugin activated' };
  }

  async deactivate() {
    console.log(\`⏸️ Deactivating plugin: \${this.name}\`);
    return { success: true, message: 'Plugin deactivated' };
  }

  async uninstall() {
    console.log(\`🗑️ Uninstalling plugin: \${this.name}\`);
    return { success: true, message: 'Plugin uninstalled' };
  }

  getRoutes() {
    return require('./routes.js').default;
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      initialized: this.isInitialized,
      status: 'active'
    };
  }
}

module.exports = ${pluginId.replace(/[^a-zA-Z0-9]/g, '')}Plugin;
module.exports.default = ${pluginId.replace(/[^a-zA-Z0-9]/g, '')}Plugin;
`;

  // Generate routes.js
  const routesJs = `// ${pluginName} - Routes
// Auto-generated

const express = require('express');
const router = express.Router();

// Status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    plugin: '${pluginId}',
    version: '${manifest.version}',
    status: 'active',
    endpoints: ${JSON.stringify(manifest.endpoints || {}, null, 2)}
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
  });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Configuration endpoint  
router.get('/configure', (req, res) => {
  res.json({
    success: true,
    plugin: '${pluginId}',
    configSchema: ${JSON.stringify(manifest.configSchema || {}, null, 2)}
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
  });
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

module.exports = router;
module.exports.default = router;
`;

  // Generate package.json
  const packageJson = JSON.stringify({
    name: `@cas/plugin-${pluginId}`,
    version: manifest.version,
    description: manifest.description,
    main: 'dist/index.js',
    type: 'commonjs',
    dependencies: {
      express: '^4.18.0'
    },
    peerDependencies: {
      '@cas/core-api': '^1.0.0'
    }
  }, null, 2);

  // Generate migration SQL based on plugin type
  let migrationSql: string | undefined;
  
  if (pluginId === 'ldap-auth') {
    migrationSql = `-- LDAP Plugin Migration
-- Version: ${manifest.version}

CREATE TABLE IF NOT EXISTS plugin.ldap_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serverurl VARCHAR(500) NOT NULL,
  basedn VARCHAR(500) NOT NULL,
  binddn VARCHAR(500) NOT NULL,
  bindpassword TEXT,
  searchfilter VARCHAR(500) DEFAULT '(objectClass=person)',
  searchattribute VARCHAR(100) DEFAULT 'uid',
  groupattribute VARCHAR(100) DEFAULT 'memberOf',
  issecure BOOLEAN DEFAULT FALSE,
  port INTEGER DEFAULT 389,
  isactive BOOLEAN DEFAULT TRUE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin.ldap_user_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldapdn VARCHAR(500),
  username VARCHAR(255),
  email VARCHAR(255),
  importstatus VARCHAR(50) DEFAULT 'pending',
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
  } else if (pluginId === 'rag-retrieval') {
    migrationSql = `-- RAG Plugin Migration
-- Version: ${manifest.version}

CREATE TABLE IF NOT EXISTS plugin.rag_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(255),
  embedding_model VARCHAR(255),
  api_key TEXT,
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  isactive BOOLEAN DEFAULT TRUE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin.rag_tx_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  embedding_model VARCHAR(255),
  document_count INTEGER DEFAULT 0,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
  }

  return { indexJs, routesJs, packageJson, migrationSql };
}

// Helper to generate README
function generatePluginReadme(manifest: any): string {
  return `# ${manifest.name}

**Version:** ${manifest.version}  
**Author:** ${manifest.author}  
**License:** ${manifest.license}  

## Description

${manifest.description}

## Installation

1. Import this plugin ZIP file through the CAS Plugin Manager
2. The system will automatically:
   - Extract the plugin files
   - Run database migrations
   - Register API endpoints
   - Activate the plugin

## Endpoints

${Object.entries(manifest.endpoints || {}).map(([name, path]) => `- **${name}**: \`${path}\``).join('\n')}

## Permissions Required

${(manifest.permissions || []).map((p: string) => `- \`${p}\``).join('\n')}

## Compatibility

- CAS Version: ${manifest.compatibility?.casVersion || '>=1.0.0'}
- Node.js: ${manifest.compatibility?.nodeVersion || '>=18.0.0'}

## Directory Structure

\`\`\`
${manifest.id}/
├── plugin.json          # Plugin manifest
├── backend/
│   ├── src/            # TypeScript source code
│   ├── dist/           # Compiled JavaScript (runnable)
│   ├── migrations/     # Database migrations
│   └── package.json    # Dependencies
├── frontend/           # Frontend components (if any)
├── docs/               # Documentation
├── tests/              # Test files
└── README.md           # This file
\`\`\`

## Development

To modify this plugin:

1. Edit files in \`backend/src/\`
2. Run \`npm run build\` to compile
3. Test changes locally
4. Export the updated plugin

---

*Exported from CAS Plugin System*
`;
}

// Helper to generate embedded frontend code when source is not available
function generateEmbeddedFrontendCode(pluginId: string, manifest: any): {
  indexTsx: string;
  componentTsx: string;
  stylesCss: string;
  packageJson: string;
} {
  const pluginName = manifest.name || pluginId;
  const componentName = pluginName.replace(/\s+/g, '') + 'Plugin';
  
  const indexTsx = `// ${pluginName} - Frontend Entry Point
// Version: ${manifest.version}
// Generated: ${new Date().toISOString()}

export { default as ${componentName} } from './components/${componentName}';
`;

  const componentTsx = `// ${pluginName} - Main Component
import React, { useState, useEffect } from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  pluginId?: string;
  onStatusChange?: (status: string) => void;
}

const ${componentName}: React.FC<${componentName}Props> = ({ 
  pluginId = '${pluginId}',
  onStatusChange 
}) => {
  const [status, setStatus] = useState<string>('loading');
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPluginStatus();
  }, [pluginId]);

  const loadPluginStatus = async () => {
    try {
      const response = await fetch(\`/api/plugins/\${pluginId}/status\`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.status || 'active');
        setConfig(data.config);
        onStatusChange?.(data.status);
      }
    } catch (err) {
      setError('Failed to load plugin status');
      setStatus('error');
    }
  };

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>${pluginName}</h2>
        <span className={\`\${styles.status} \${styles[status]}\`}>
          {status}
        </span>
      </div>
      
      <div className={styles.content}>
        <p>${manifest.description || 'Plugin component'}</p>
        
        {config && (
          <div className={styles.config}>
            <h4>Configuration</h4>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <button onClick={loadPluginStatus} className={styles.button}>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default ${componentName};
`;

  const stylesCss = `/* ${pluginName} - Styles */
.container {
  padding: 1.5rem;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e9ecef);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e9ecef);
}

.header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status.active {
  background: #d1fae5;
  color: #059669;
}

.status.loading {
  background: #e0e7ff;
  color: #4f46e5;
}

.status.error {
  background: #fee2e2;
  color: #dc2626;
}

.content {
  margin-bottom: 1rem;
}

.config {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-primary, #ffffff);
  border-radius: 4px;
  border: 1px solid var(--border-color, #e9ecef);
}

.config h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.config pre {
  margin: 0;
  font-size: 0.75rem;
  overflow-x: auto;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.button {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.button:hover {
  background: var(--primary-hover, #2563eb);
}

.error {
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.error h3 {
  margin: 0 0 0.5rem 0;
}

.error p {
  margin: 0;
}
`;

  const packageJson = generatePluginFrontendPackageJson(pluginId, manifest);

  return { indexTsx, componentTsx, stylesCss, packageJson };
}

// Import plugin from ZIP package (following PORTABLE_PLUGIN_SYSTEM_IMPLEMENTATION_GUIDE.md)
router.post('/import', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log(`📥 Importing plugin package...`);
    
    let importPackage: any;
    let pluginManifest: any;
    let pluginDataExport: any = {};
    let documentationFiles: any[] = [];
    
    // Check if this is a ZIP file (base64 encoded) or JSON
    if (req.body.zipData) {
      // ZIP file import
      console.log('📦 Processing ZIP package...');
      
      const zipBuffer = Buffer.from(req.body.zipData, 'base64');
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      
      // Extract plugin.json manifest
      const manifestEntry = zipEntries.find(e => e.entryName === 'plugin.json');
      if (!manifestEntry) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plugin package: missing plugin.json manifest'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        });
      }
      pluginManifest = JSON.parse(manifestEntry.getData().toString('utf8'));
      
      // Extract metadata.json
      const metadataEntry = zipEntries.find(e => e.entryName === 'metadata.json');
      const metadata = metadataEntry ? JSON.parse(metadataEntry.getData().toString('utf8')) : {};
      
      // Extract data/export.json if exists
      const dataEntry = zipEntries.find(e => e.entryName === 'data/export.json');
      if (dataEntry) {
        pluginDataExport = JSON.parse(dataEntry.getData().toString('utf8'));
      }
      
      // Extract documentation files
      const docsIndexEntry = zipEntries.find(e => e.entryName === 'docs/index.json');
      if (docsIndexEntry) {
        const docsIndex = JSON.parse(docsIndexEntry.getData().toString('utf8'));
        for (const docMeta of docsIndex) {
          const docFilename = `docs/${docMeta.type}.${docMeta.format === 'markdown' ? 'md' : 'html'}`;
          const docEntry = zipEntries.find(e => e.entryName === docFilename);
          if (docEntry) {
            documentationFiles.push({
              documentType: docMeta.type,
              title: docMeta.title,
              content: docEntry.getData().toString('utf8'),
              contentFormat: docMeta.format,
              language: docMeta.language || 'en',
              version: docMeta.version || '1.0.0'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
            });
          }
        }
      }
      
      // Verify checksum
      const checksumEntry = zipEntries.find(e => e.entryName === 'checksum.sha256');
      if (checksumEntry) {
        const expectedChecksum = checksumEntry.getData().toString('utf8').trim();
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
        const checksumData = JSON.stringify({ pluginManifest, exportMetadata: metadata });
        const actualChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
        if (expectedChecksum !== actualChecksum) {
          console.warn('⚠️ Checksum mismatch - package may have been modified');
        }
      }
      
      // Build importPackage from ZIP contents
      importPackage = {
        plugin: pluginManifest,
        documentation: documentationFiles,
        data: pluginDataExport,
        metadata
      };
      
      console.log(`📦 ZIP extracted: ${pluginManifest.name} v${pluginManifest.version}`);
      
    } else if (req.body.plugin) {
      // JSON import (backward compatibility)
      importPackage = req.body;
      pluginManifest = importPackage.plugin;
      pluginDataExport = importPackage.data || {};
      documentationFiles = importPackage.documentation || [];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid plugin package: provide zipData (base64) or plugin object'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    // Validate plugin manifest
    if (!pluginManifest || !pluginManifest.id || !pluginManifest.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plugin package: missing plugin id or name'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    const pluginId = pluginManifest.id;
    const pluginData = pluginManifest;
    
    // Check if plugin already exists
    const existingPlugin = await DatabaseService.queryOne<any>(
      'SELECT id FROM plugin.plugin_configurations WHERE pluginid = $1',
      [pluginId]
    );
    
    if (existingPlugin) {
      // Update existing plugin
      await DatabaseService.execute(
        `UPDATE plugin.plugin_configurations 
         SET pluginname = $2, pluginversion = $3, plugindescription = $4, 
             pluginauthor = $5, pluginstatus = $6, updatedat = NOW()
         WHERE pluginid = $1`,
        [
          pluginId,
          pluginData.name,
          pluginData.version,
          pluginData.description,
          pluginData.author,
          pluginData.status || 'disabled'
        ]
      );
      console.log(`📝 Updated existing plugin: ${pluginId}`);
    } else {
      // Insert new plugin
      await DatabaseService.execute(
        `INSERT INTO plugin.plugin_configurations 
         (pluginid, pluginname, pluginversion, plugindescription, pluginauthor, pluginstatus, issystem, createdat, updatedat)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          pluginId,
          pluginData.name,
          pluginData.version,
          pluginData.description,
          pluginData.author,
          pluginData.status || 'disabled',
          pluginData.isSystem || false
        ]
      );
      console.log(`✨ Created new plugin: ${pluginId}`);
    }
    
    // Get the plugin configuration ID for documentation
    const pluginConfig = await DatabaseService.queryOne<any>(
      'SELECT id FROM plugin.plugin_configurations WHERE pluginid = $1',
      [pluginId]
    );
    
    // Import documentation if provided
    if (importPackage.documentation && Array.isArray(importPackage.documentation) && pluginConfig) {
      for (const doc of importPackage.documentation) {
        try {
          // Check if documentation exists
          const existingDoc = await DatabaseService.queryOne<any>(
            `SELECT id FROM plugin.plugin_md_documentation 
             WHERE plugin_config_id = $1 AND document_type = $2 AND language = $3`,
            [pluginConfig.id, doc.documentType, doc.language || 'en']
          );
          
          if (existingDoc) {
            // Update existing documentation
            await DatabaseService.execute(
              `UPDATE plugin.plugin_md_documentation 
               SET title = $2, content = $3, content_format = $4, version = $5, order_index = $6, updated_at = NOW()
               WHERE id = $1`,
              [existingDoc.id, doc.title, doc.content, doc.contentFormat || 'markdown', doc.version || '1.0.0', doc.orderIndex || 0]
            );
          } else {
            // Insert new documentation
            await DatabaseService.execute(
              `INSERT INTO plugin.plugin_md_documentation 
               (plugin_config_id, document_type, title, content, content_format, language, version, is_current, order_index, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW(), NOW())`,
              [
                pluginConfig.id,
                doc.documentType,
                doc.title,
                doc.content,
                doc.contentFormat || 'markdown',
                doc.language || 'en',
                doc.version || '1.0.0',
                doc.orderIndex || 0
              ]
            );
          }
        } catch (docError) {
          console.warn(`⚠️ Failed to import documentation: ${doc.title}`, docError);
        }
      }
      console.log(`📚 Imported ${importPackage.documentation.length} documentation entries`);
    }
    
    // Import plugin-specific data
    if (importPackage.data) {
      if (pluginId === 'ldap-auth' && importPackage.data.configurations) {
        for (const config of importPackage.data.configurations) {
          try {
            // Check if configuration exists
            const existingConfig = await DatabaseService.queryOne<any>(
              'SELECT id FROM plugin.ldap_configurations WHERE serverurl = $1 AND basedn = $2',
              [config.serverurl, config.basedn]
            );
            
            if (!existingConfig) {
              await DatabaseService.execute(
                `INSERT INTO plugin.ldap_configurations 
                 (serverurl, basedn, binddn, searchfilter, searchattribute, groupattribute, issecure, port, isactive, createdat, updatedat)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())`,
                [
                  config.serverurl,
                  config.basedn,
                  config.binddn || '',
                  config.searchfilter || '(objectClass=person)',
                  config.searchattribute || 'uid',
                  config.groupattribute || 'memberOf',
                  config.issecure || false,
                  config.port || 389
                ]
              );
            }
          } catch (configError) {
            console.warn(`⚠️ Failed to import LDAP config:`, configError);
          }
        }
        console.log(`🔐 Imported LDAP configurations`);
      }
    }
    
    console.log(`✅ Plugin imported successfully: ${pluginId}`);
    
    res.json({
      success: true,
      message: `Plugin ${pluginData.name} imported successfully`,
      plugin: {
        id: pluginId,
        name: pluginData.name,
        version: pluginData.version,
        status: pluginData.status || 'disabled'
      }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
    
  } catch (error) {
    console.error('❌ Error importing plugin:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import plugin'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Public documentation routes (no authentication required)
router.get('/:id/docs', async (req, res) => {
  console.log(`📚 Documentation request - Method: ${req.method}, URL: ${req.url}, Plugin ID: ${req.params.id}`);

  try {
    const { id } = req.params;
    const { language = 'en', includeVersions = 'false' } = req.query;

    // Get documentation from database using plugin string ID (e.g., 'core.text-block')
    // The PluginDocumentationService will handle UUID resolution internally
    const docs = await PluginDocumentationService.getByPluginId(
      id, // Use the plugin string ID directly
      language as string,
      includeVersions === 'true'
    );

    console.log(`✅ Found ${docs.length} documentation entries for plugin ${id}`);

    res.json({
      success: true,
      data: docs
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    console.error(`❌ Error getting documentation for plugin ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.get('/:id/docs/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    const { language = 'en' } = req.query;

    // Get plugin UUID from plugin_configurations table
    const pluginConfig = await DatabaseService.queryOne<{ id: string }>(
      'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1',
      [id]
    );

    if (!pluginConfig) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    const doc = await PluginDocumentationService.getByType(
      pluginConfig.id,
      type as any,
      language as string
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    res.json({
      success: true,
      data: doc
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});


router.post('/:id/docs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { documentType, title, content, contentFormat, language, version, isCurrent, orderIndex, metadata } = req.body;
    
    if (!documentType || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Document type, title, and content are required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    // Get plugin configuration to validate plugin exists
    const pluginConfig = await DatabaseService.queryOne(
      'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1',
      [id]
    );
    
    if (!pluginConfig) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    const doc = await PluginDocumentationService.create({
      pluginId: pluginConfig.id,
      documentType,
      title,
      content,
      contentFormat,
      language,
      version,
      isCurrent,
      orderIndex,
      metadata
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
    
    res.status(201).json({
      success: true,
      data: doc
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.put('/:id/docs/:docId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    const { title, content, contentFormat, version, isCurrent, orderIndex, metadata } = req.body;
    
    const doc = await PluginDocumentationService.update(docId, {
      title,
      content,
      contentFormat,
      version,
      isCurrent,
      orderIndex,
      metadata
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
    
    res.json({
      success: true,
      data: doc
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.post('/:id/docs/:docId/current', authenticate, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    
    const doc = await PluginDocumentationService.setCurrent(docId);
    
    res.json({
      success: true,
      data: doc
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set current documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.delete('/:id/docs/:docId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    
    const deleted = await PluginDocumentationService.delete(docId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.get('/:id/docs/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { q: query, language = 'en' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }
    
    const docs = await PluginDocumentationService.search(
      id,
      query as string,
      language as string
    );
    
    res.json({
      success: true,
      data: docs
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search documentation'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

router.get('/docs/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const summary = await PluginDocumentationService.getPluginDocumentationSummary(language as string);
    
    res.json({
      success: true,
      data: summary
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation summary'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// RBAC Management endpoints

// Get available permissions for a plugin
router.get('/:id/permissions', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  
  try {
    const permissions = await rbacService.getAvailablePermissions(pluginId);
    
    res.json({
      success: true,
      data: permissions
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get permissions'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Get user permissions for a plugin
router.get('/:id/user-permissions', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  const { userId } = req.query;
  
  try {
    // If userId not provided, use current user's permissions
    const targetUserId = userId ? String(userId) : req.user?.id;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
      });
    }

    const permissions = await rbacService.getUserPermissions(pluginId, targetUserId);
    
    res.json({
      success: true,
      data: permissions
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user permissions'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Grant permission to user
router.post('/:id/grant-permission', authenticate, requireSystemPluginAdmin, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  const { userId, permissionName } = req.body;
  
  if (!userId || !permissionName) {
    return res.status(400).json({
      success: false,
      error: 'User ID and permission name required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }

  try {
    await rbacService.grantPluginPermission(pluginId, userId, permissionName, req.user?.id);
    
    res.json({
      success: true,
      message: `Permission ${permissionName} granted to user ${userId}`
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grant permission'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Revoke permission from user
router.post('/:id/revoke-permission', authenticate, requireSystemPluginAdmin, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  const { userId, permissionName } = req.body;
  
  if (!userId || !permissionName) {
    return res.status(400).json({
      success: false,
      error: 'User ID and permission name required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }

  try {
    await rbacService.revokePluginPermission(pluginId, userId, permissionName);
    
    res.json({
      success: true,
      message: `Permission ${permissionName} revoked from user ${userId}`
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke permission'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// API Registry endpoints

// Get available APIs for a plugin
router.get('/:id/apis', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  
  try {
    const apis = await communicationService.getAvailableApis(pluginId);
    
    res.json({
      success: true,
      data: apis
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get APIs'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Communication endpoint for plugins to call other plugins
router.post('/communicate', authenticate, async (req: AuthRequest, res) => {
  const { fromPluginId, toPluginId, apiPath, method, data } = req.body;
  
  if (!fromPluginId || !toPluginId || !apiPath || !method) {
    return res.status(400).json({
      success: false,
      error: 'From plugin ID, to plugin ID, API path, and method required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }

  try {
    const result = await communicationService.callPluginApi({
      fromPluginId,
      toPluginId,
      userId: req.user?.id || '',
      apiPath,
      method,
      data
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to call plugin API'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Get communication history for a plugin
router.get('/:id/communication-history', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  const { limit = 50 } = req.query;
  
  try {
    const history = await communicationService.getCommunicationHistory(
      pluginId, 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: history
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get communication history'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Get communication statistics
router.get('/communication-stats', authenticate, async (req: AuthRequest, res) => {
  const { pluginId } = req.query;
  
  try {
    const stats = await communicationService.getCommunicationStats(
      pluginId ? String(pluginId) : undefined
    );
    
    res.json({
      success: true,
      data: stats
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get communication stats'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// RBAC endpoints for application plugins to expose detailed permissions

// Get field permissions for a plugin
router.get('/:id/rbac/fields', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  
  try {
    const allPermissions = await rbacService.getAvailablePermissions(pluginId);
    const fieldPermissions = allPermissions.filter(p => p.resourceType === 'field');
    
    res.json({
      success: true,
      data: fieldPermissions
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get field permissions'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Get object permissions for a plugin
router.get('/:id/rbac/objects', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  
  try {
    const allPermissions = await rbacService.getAvailablePermissions(pluginId);
    const objectPermissions = allPermissions.filter(p => p.resourceType === 'object');
    
    res.json({
      success: true,
      data: objectPermissions
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get object permissions'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Get data permissions for a plugin
router.get('/:id/rbac/data', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  
  try {
    const allPermissions = await rbacService.getAvailablePermissions(pluginId);
    const dataPermissions = allPermissions.filter(p => p.resourceType === 'data');
    
    res.json({
      success: true,
      data: dataPermissions
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get data permissions'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

// Check specific permission for current user
router.post('/:id/rbac/check', authenticate, async (req: AuthRequest, res) => {
  const { id: pluginId } = req.params;
  const { permission, resourceId } = req.body;
  
  if (!permission) {
    return res.status(400).json({
      success: false,
      error: 'Permission name required'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }

  try {
    const hasPermission = await rbacService.checkPermission(
      req.user?.id || '',
      permission,
      resourceId
    );
    
    res.json({
      success: true,
      data: {
        hasPermission,
        permission,
        resourceId,
        userId: req.user?.id
      }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check permission'
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
    });
  }
    // Add menu navigation plugin to plugin array
    plugins.push({
      id: 'menu-navigation',
      name: 'Menu Navigation System',
      version: '1.0.0',
      description: 'Interactive menu navigation system with keyboard shortcuts and user access control',
      author: 'CAS Development Team',
      status: 'active',
      category: 'user-interface',
      isSystem: true,
      icon: '🧪',
      permissions: ['navigation:view', 'navigation:configure', 'navigation:manage'],
      routes: {
        status: '/api/plugins/menu-navigation/status',
        modules: '/api/plugins/menu-navigation/modules',
        search: '/api/plugins/menu-navigation/search',
        config: '/api/plugins/menu-navigation/config',
        addModule: '/api/plugins/menu-navigation/modules'
      }
    });
});

export default router;

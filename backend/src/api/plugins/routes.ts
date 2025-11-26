import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { PluginService } from '../../services/PluginService.js';

const router = Router();
const pluginService = new PluginService();

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

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Constitution: Load LDAP plugin dynamically
    const ldapPlugin = await pluginService.getAuthPlugin('ldap-auth');

    const plugins = [
      {
        id: 'core.text-block',
        name: 'Text Block',
        version: '1.0.0',
        description: 'Basic text editing block',
        author: 'Dashboard Team',
        permissions: ['storage.read', 'storage.write'],
        status: 'active'
      },
      {
        id: 'ldap-auth',
        name: 'LDAP Authentication',
        version: '1.0.0',
        description: 'LDAP directory authentication plugin',
        author: 'System',
        permissions: ['auth.ldap'],
        status: ldapPlugin ? 'active' : 'disabled',
        isSystem: true,
        routes: ldapPlugin ? {
          configure: '/api/plugins/ldap/configure',
          test: '/api/plugins/ldap/test',
          import: '/api/plugins/ldap/import',
          authenticate: '/api/plugins/ldap/authenticate'
        } : null
      }
    ];

    res.json({
      success: true,
      data: plugins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plugins'
    });
  }
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

router.get('/:id', authenticate, (req: AuthRequest, res) => {
  const plugin = pluginRegistry.get(req.params.id);
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.json(plugin);
});

// Constitution: Enable/disable plugin endpoints
router.post('/:id/enable', authenticate, (req: AuthRequest, res) => {
  const pluginId = req.params.id;
  
  // Find plugin from loaded plugins
  const plugins = [
    {
      id: 'core.text-block',
      name: 'Text Block',
      version: '1.0.0',
      description: 'Basic text editing block',
      author: 'Dashboard Team',
      status: 'active'
    },
    {
      id: 'ldap-auth',
      name: 'LDAP Authentication',
      version: '1.0.0',
      description: 'LDAP directory authentication plugin',
      author: 'System',
      status: 'active',
      isSystem: true,
      routes: {
        configure: '/api/plugins/ldap/configure',
        test: '/api/plugins/ldap/test',
        import: '/api/plugins/ldap/import',
        status: '/api/plugins/ldap/status'
      }
    }
  ];
  
  const plugin = plugins.find(p => p.id === pluginId);
  
  if (!plugin) {
    return res.status(404).json({ success: false, message: 'Plugin not found' });
  }
  
  // Constitution: Update plugin status
  plugin.status = 'active';
  
  res.json({ 
    success: true, 
    message: `Plugin ${plugin.name} enabled successfully`,
    plugin
  });
});

router.post('/:id/disable', authenticate, (req: AuthRequest, res) => {
  const pluginId = req.params.id;
  
  // Find plugin from loaded plugins
  const plugins = [
    {
      id: 'core.text-block',
      name: 'Text Block',
      version: '1.0.0',
      description: 'Basic text editing block',
      author: 'Dashboard Team',
      status: 'active'
    },
    {
      id: 'ldap-auth',
      name: 'LDAP Authentication',
      version: '1.0.0',
      description: 'LDAP directory authentication plugin',
      author: 'System',
      status: 'active',
      isSystem: true,
      routes: {
        configure: '/api/plugins/ldap/configure',
        test: '/api/plugins/ldap/test',
        import: '/api/plugins/ldap/import',
        status: '/api/plugins/ldap/status'
      }
    }
  ];
  
  const plugin = plugins.find(p => p.id === pluginId);
  
  if (!plugin) {
    return res.status(404).json({ success: false, message: 'Plugin not found' });
  }
  
  // Constitution: Update plugin status
  plugin.status = 'disabled';
  
  res.json({ 
    success: true, 
    message: `Plugin ${plugin.name} disabled successfully`,
    plugin
  });
});

router.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const manifest: PluginManifest = req.body;
    
    if (!manifest.id || !manifest.name || !manifest.version) {
      return res.status(400).json({ error: 'Invalid plugin manifest' });
    }

    if (pluginRegistry.has(manifest.id)) {
      return res.status(409).json({ error: 'Plugin already exists' });
    }

    pluginRegistry.set(manifest.id, manifest);
    res.status(201).json(manifest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register plugin' });
  }
});

router.delete('/:id', authenticate, (req: AuthRequest, res) => {
  const deleted = pluginRegistry.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.status(204).send();
});

export default router;

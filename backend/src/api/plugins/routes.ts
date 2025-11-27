import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { PluginService } from '../../services/PluginService.js';
import { PluginDocumentationService } from '../../services/PluginDocumentationService.js';
import { DatabaseService } from '../../services/DatabaseService.js';

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

// Constitution: Plugin status storage (persists across requests)
const pluginStatusMap = new Map<string, string>([
  ['core.text-block', 'active'],
  ['ldap-auth', 'disabled'],
  ['rag-retrieval', 'active']
]);

router.get('/', async (req, res) => {
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
        status: pluginStatusMap.get('core.text-block') || 'active'
      },
      {
        id: 'ldap-auth',
        name: 'LDAP Authentication',
        version: '1.0.0',
        description: 'LDAP directory authentication plugin',
        author: 'System',
        permissions: ['auth.ldap'],
        status: pluginStatusMap.get('ldap-auth') || 'disabled',
        isSystem: true,
        routes: ldapPlugin ? {
          configure: '/api/plugins/ldap/configure',
          test: '/api/plugins/ldap/test',
          import: '/api/plugins/ldap/import',
          authenticate: '/api/plugins/ldap/authenticate'
        } : null
      },
      {
        id: 'rag-retrieval',
        name: 'RAG Document Intelligence',
        version: '1.0.0',
        description: 'Retrieval-Augmented Generation for document analysis and intelligent chat (English & Bahasa Indonesia)',
        author: 'System',
        permissions: ['document:upload', 'chat:create', 'collection:manage', 'rag:configure'],
        status: pluginStatusMap.get('rag-retrieval') || 'active',
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

router.get('/:id', (req, res) => {
  const plugin = pluginRegistry.get(req.params.id);
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.json(plugin);
});

// Constitution: Enable/disable plugin endpoints
router.post('/:id/enable', async (req, res) => {
  const pluginId = req.params.id;
  
  // Constitution: Plugin metadata for response
  const pluginMeta = {
    'core.text-block': { name: 'Text Block', version: '1.0.0' },
    'ldap-auth': { name: 'LDAP Authentication', version: '1.0.0' },
    'rag-retrieval': { name: 'RAG Document Intelligence', version: '1.0.0' }
  };
  
  const meta = pluginMeta[pluginId as keyof typeof pluginMeta];
  
  if (!meta) {
    return res.status(404).json({ success: false, message: 'Plugin not found' });
  }
  
  // Constitution: Update plugin status in persistent map
  pluginStatusMap.set(pluginId, 'active');
  
  console.log(`✅ Plugin enabled: ${pluginId} -> active`);
  console.log(`📊 Current status map:`, Array.from(pluginStatusMap.entries()));
  
  res.json({ 
    success: true, 
    message: `Plugin ${meta.name} enabled successfully`,
    plugin: {
      id: pluginId,
      name: meta.name,
      version: meta.version,
      status: 'active'
    }
  });
});

router.post('/:id/disable', async (req, res) => {
  const pluginId = req.params.id;
  
  // Constitution: Plugin metadata for response
  const pluginMeta = {
    'core.text-block': { name: 'Text Block', version: '1.0.0' },
    'ldap-auth': { name: 'LDAP Authentication', version: '1.0.0' },
    'rag-retrieval': { name: 'RAG Document Intelligence', version: '1.0.0' }
  };
  
  const meta = pluginMeta[pluginId as keyof typeof pluginMeta];
  
  if (!meta) {
    return res.status(404).json({ success: false, message: 'Plugin not found' });
  }
  
  // Constitution: Update plugin status in persistent map
  pluginStatusMap.set(pluginId, 'disabled');
  
  console.log(`⚠️ Plugin disabled: ${pluginId} -> disabled`);
  console.log(`📊 Current status map:`, Array.from(pluginStatusMap.entries()));
  
  res.json({ 
    success: true, 
    message: `Plugin ${meta.name} disabled successfully`,
    plugin: {
      id: pluginId,
      name: meta.name,
      version: meta.version,
      status: 'disabled'
    }
  });
});

router.post('/', (req, res) => {
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

router.delete('/:id', (req, res) => {
  const deleted = pluginRegistry.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  res.status(204).send();
});

// Public documentation routes (no authentication required)
router.get('/:id/docs', async (req, res) => {
  console.log(`📚 Documentation request - Method: ${req.method}, URL: ${req.url}, Plugin ID: ${req.params.id}`);

  try {
    const { id } = req.params;
    const { language = 'en', includeVersions = 'false' } = req.query;

    // Get plugin configuration UUID from plugin ID
    const pluginConfig = await DatabaseService.queryOne<{ id: string }>(
      'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1',
      [id]
    );

    // If plugin doesn't have configuration entry, return empty array
    // This allows the frontend to handle it gracefully and show fallback documentation
    if (!pluginConfig) {
      console.log(`⚠️ Plugin ${id} not found in plugin_configurations, returning empty docs`);
      return res.json({
        success: true,
        data: []
      });
    }

    // Get documentation from database
    const docs = await PluginDocumentationService.getByPluginId(
      pluginConfig.id,
      language as string,
      includeVersions === 'true'
    );

    console.log(`✅ Found ${docs.length} documentation entries for plugin ${id}`);

    res.json({
      success: true,
      data: docs
    });
  } catch (error) {
    console.error(`❌ Error getting documentation for plugin ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation'
    });
  }
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
      });
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation'
    });
  }
});


router.post('/:id/docs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { documentType, title, content, contentFormat, language, version, isCurrent, orderIndex, metadata } = req.body;
    
    if (!documentType || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Document type, title, and content are required'
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
    });
    
    res.status(201).json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create documentation'
    });
  }
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
    });
    
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update documentation'
    });
  }
});

router.post('/:id/docs/:docId/current', authenticate, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    
    const doc = await PluginDocumentationService.setCurrent(docId);
    
    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set current documentation'
    });
  }
});

router.delete('/:id/docs/:docId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    
    const deleted = await PluginDocumentationService.delete(docId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete documentation'
    });
  }
});

router.get('/:id/docs/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { q: query, language = 'en' } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
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
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search documentation'
    });
  }
});

router.get('/docs/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const { language = 'en' } = req.query;
    
    const summary = await PluginDocumentationService.getPluginDocumentationSummary(language as string);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get documentation summary'
    });
  }
});

export default router;

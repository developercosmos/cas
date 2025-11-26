import { Router, Request, Response } from 'express';
import { DatabasePluginService } from '../../../services/DatabasePluginService.js';
import { authenticate, AuthRequest } from '../../../middleware/auth.js';
import { requireAdmin } from '../../../middleware/admin.js';
import { PluginInstallRequest } from '../../../types/plugin';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/plugins - List all plugins
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const plugins = await DatabasePluginService.listPlugins();
    res.json({
      success: true,
      data: plugins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plugins',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/admin/plugins/:id - Get specific plugin
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plugin = await DatabasePluginService.getPlugin(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: 'Plugin not found'
      });
    }

    const config = await DatabasePluginService.getPluginConfig(id);
    
    res.json({
      success: true,
      data: {
        ...plugin,
        config: config?.config || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plugin',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/admin/plugins/install - Install a new plugin
router.post('/install', async (req: AuthRequest, res: Response) => {
  try {
    const installRequest: PluginInstallRequest = req.body;
    
    // Validate required fields
    if (!installRequest.id || !installRequest.name || !installRequest.version) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: id, name, version'
      });
    }

    const result = await DatabasePluginService.installPlugin(installRequest);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to install plugin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/plugins/:id - Uninstall a plugin
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await DatabasePluginService.uninstallPlugin(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to uninstall plugin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/plugins/:id/enable - Enable a plugin
router.post('/:id/enable', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await DatabasePluginService.enablePlugin(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to enable plugin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/plugins/:id/disable - Disable a plugin
router.post('/:id/disable', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await DatabasePluginService.disablePlugin(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disable plugin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/plugins/:id/config - Update plugin configuration
router.put('/:id/config', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration object'
      });
    }

    const result = await DatabasePluginService.updatePluginConfig(id, config);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update plugin configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

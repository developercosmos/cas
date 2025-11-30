import { Router, Request, Response } from 'express';
import type { NavigationService } from './NavigationService';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    permissions: string[];
  };
}

export function createRoutes(
  navigationService: NavigationService,
  authMiddleware: any
): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/plugins/navigation/modules
   * Get all navigation modules accessible to current user
   */
  router.get('/modules', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const modules = await navigationService.getUserAccessibleModules(userId);

      res.json({
        success: true,
        data: modules,
        count: modules.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting navigation modules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve navigation modules',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/plugins/navigation/search
   * Search navigation modules
   */
  router.get('/search', async (req: AuthRequest, res: Response) => {
    try {
      const { q: query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate search query
      if (query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
          timestamp: new Date().toISOString()
        });
      }

      const userId = req.user?.id;
      const modules = await navigationService.searchModules(query, userId);

      res.json({
        success: true,
        data: modules,
        count: modules.length,
        query,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching navigation modules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search navigation modules',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/plugins/navigation/config
   * Get navigation configuration
   */
  router.get('/config', async (req: AuthRequest, res: Response) => {
    try {
      const config = await navigationService.getConfiguration();

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Navigation configuration not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting navigation configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve navigation configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/plugins/navigation/config
   * Update navigation configuration
   */
  router.put('/config', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.permissions?.includes('navigation:configure')) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to configure navigation',
          timestamp: new Date().toISOString()
        });
      }

      const config = req.body;

      if (!config || typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration object',
          timestamp: new Date().toISOString()
        });
      }

      // Validate configuration fields
      const allowedFields = [
        'enableKeyboardShortcut',
        'keyboardShortcut',
        'maxItemsPerCategory',
        'searchEnabled',
        'sortOptions',
        'theme'
      ];

      const invalidFields = Object.keys(config).filter(
        field => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid configuration fields: ${invalidFields.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }

      const success = await navigationService.updateConfiguration(config);

      if (success) {
        res.json({
          success: true,
          message: 'Navigation configuration updated successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update navigation configuration',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating navigation configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update navigation configuration',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/plugins/navigation/modules
   * Add new navigation module
   */
  router.post('/modules', async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.permissions?.includes('navigation:manage')) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to manage navigation modules',
          timestamp: new Date().toISOString()
        });
      }

      const module = req.body;

      const requiredFields = ['name', 'description', 'pluginId', 'sortOrder'];
      for (const field of requiredFields) {
        if (module[field] === undefined || module[field] === null) {
          return res.status(400).json({
            success: false,
            error: `Required field missing: ${field}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Add module directly to database (via service)
      const success = await (navigationService as any).addModule({
        ...module,
        isActive: module.isActive !== false, // Default to active
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (success) {
        res.status(201).json({
          success: true,
          message: 'Navigation module added successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to add navigation module',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error adding navigation module:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add navigation module',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/plugins/navigation/status
   * Plugin health check and statistics
   */
  router.get('/status', async (req: AuthRequest, res: Response) => {
    try {
      // Get statistics from database
      const totalModulesResult = await navigationService.db.queryOne(
        'SELECT COUNT(*) as count FROM plugin.navigation_modules'
      );

      const activeModulesResult = await navigationService.db.queryOne(
        'SELECT COUNT(*) as count FROM plugin.navigation_modules WHERE isActive = true'
      );

      const config = await navigationService.getConfiguration();

      res.json({
        success: true,
        plugin: {
          name: 'Menu Navigation System',
          version: '1.0.0',
          status: 'active',
          statistics: {
            totalModules: parseInt(totalModulesResult?.count || '0'),
            activeModules: parseInt(activeModulesResult?.count || '0'),
            configLoaded: !!config,
            lastUpdated: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting navigation status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve navigation status',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

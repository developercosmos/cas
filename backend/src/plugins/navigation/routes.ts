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
        count: modules.length
      });
    } catch (error) {
      console.error('Error getting navigation modules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve navigation modules'
      });
    }
  });

  return router;
}

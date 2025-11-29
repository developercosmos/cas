import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { DatabaseService } from '../services/DatabaseService.js';

const ADMIN_USERS = process.env.ADMIN_USERS?.split(',') || ['admin'];

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!ADMIN_USERS.includes(req.user.username)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Middleware to require admin access for system plugin operations
 * Regular users can manage application plugins, but only admins can manage system plugins
 */
export const requireSystemPluginAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isAdmin = ADMIN_USERS.includes(req.user.username);
  const pluginId = req.params.id || req.body.pluginId;
  
  // If plugin ID is provided, check if it's a system plugin
  if (pluginId) {
    checkSystemPluginAccess(pluginId, isAdmin, req, res, next);
  } else {
    // For operations without specific plugin ID (like listing all plugins),
    // proceed - route handler will filter based on access level
    next();
  }
};

/**
 * Check if user has access to manage a specific plugin
 */
async function checkSystemPluginAccess(
  pluginId: string, 
  isAdmin: boolean, 
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Get plugin category from database
    const query = `
      SELECT Category, IsSystem 
      FROM plugin.plugin_configurations 
      WHERE PluginId = $1
    `;
    
    const result = await DatabaseService.query(query, [pluginId]);
    
    if (result.length === 0) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    
    const plugin = result[0];
    const isSystemPlugin = plugin.category === 'system' || plugin.issystem;
    
    // If it's a system plugin and user is not admin, deny access
    if (isSystemPlugin && !isAdmin) {
      res.status(403).json({ 
        error: 'Admin access required for system plugins',
        pluginId,
        category: plugin.category,
        requiresAdmin: true
      });
      return;
    }
    
    // User has appropriate access level
    next();
  } catch (error) {
    console.error('Error checking plugin access:', error);
    res.status(500).json({ error: 'Failed to verify plugin access' });
  }
}

/**
 * Middleware to check if user has specific plugin permission
 */
export const requirePluginPermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const pluginId = req.params.id;
    
    if (!pluginId) {
      return res.status(400).json({ error: 'Plugin ID required' });
    }

    try {
      // Check if user has required permission
      const query = `
        SELECT COUNT(*) as has_permission
        FROM plugin.user_plugin_permissions upp
        JOIN plugin.plugin_configurations pc ON upp.PluginId = pc.Id
        JOIN auth.users u ON upp.UserId = u.Id
        WHERE u.Id = (SELECT Id FROM auth.users WHERE Username = $1)
          AND pc.PluginId = $2
          AND upp.PermissionName = $3
          AND upp.IsGranted = true
      `;
      
      const result = await DatabaseService.query(query, [req.user.username, pluginId, permission]);
      
      if (result.length === 0 || result[0].has_permission === 0) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          requiredPermission: permission,
          pluginId
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Error checking plugin permission:', error);
      res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
}

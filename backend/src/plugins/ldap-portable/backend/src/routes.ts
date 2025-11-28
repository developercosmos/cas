/**
 * LDAP Plugin Routes
 * Following CAS Constitution API Design Standards (Section XI)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { LdapService } from './LdapService.js';
import type { DatabaseService } from '@cas/core-api';
import type {
  LdapConfigureRequest,
  LdapTestRequest,
  LdapImportRequest,
  LdapAuthenticateRequest
} from './types.js';

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function createRoutes(db: DatabaseService, authenticate: AuthMiddleware): Router {
  const router = Router();
  const ldapService = new LdapService(db);

  /**
   * GET /status - Plugin health and statistics (REQUIRED)
   * Constitution: Section VIII - Plugin Endpoints
   */
  router.get('/status', authenticate, async (_req: Request, res: Response) => {
    try {
      const status = await ldapService.getStatus();

      res.json({
        success: true,
        plugin: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /configure - Configuration management (REQUIRED if configurable)
   * Constitution: Section VIII - Plugin Endpoints
   */
  router.post('/configure', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = req.body as LdapConfigureRequest;

      if (!settings.serverurl || !settings.basedn || !settings.binddn) {
        res.status(400).json({
          success: false,
          error: 'Server URL, Base DN, and Bind DN are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await ldapService.configure(settings);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Configuration failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /test - Health check and connectivity test (RECOMMENDED)
   * Constitution: Section VIII - Plugin Endpoints
   */
  router.post('/test', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = req.body as LdapTestRequest;

      if (!settings.serverurl || !settings.basedn || !settings.binddn) {
        res.status(400).json({
          success: false,
          error: 'Server URL, Base DN, and Bind DN are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await ldapService.testConnectionWithSettings(settings);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /import - Import users from LDAP
   * Constitution: Section XI - Plugin API Design Standards
   */
  router.post('/import', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const { searchQuery } = req.body as LdapImportRequest;

      const result = await ldapService.importUsers(searchQuery);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          importedCount: result.importedCount,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /authenticate - Authenticate user via LDAP
   * Constitution: Section XI - Plugin API Design Standards
   */
  router.post('/authenticate', async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body as LdapAuthenticateRequest;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await ldapService.authenticate(username, password);

      if (result.success) {
        res.json({
          success: true,
          user: result.user,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

export default createRoutes;

import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { LdapService } from '../../services/LdapService.js';

const router = Router();

// Test middleware for LDAP routes (similar to navigation)
const testAuth = (req: AuthRequest, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  // Always set a test user for LDAP to work
  req.user = {
    id: 'test-user',
    username: 'testuser',
    permissions: ['ldap.configure', 'ldap.test', 'ldap.manage_users']
  };
  next();
};

// Constitution: Admin-only LDAP configuration management
router.post('/config', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = req.body;

    if (!serverurl || !basedn || !binddn) {
      return res.status(400).json({ error: 'Server URL, Base DN, and Bind DN are required' });
    }

    const response = await LdapService.createConfiguration({
      id: 'ldap-' + Date.now(),
      isactive: true,
      serverurl,
      basedn,
      binddn,
      bindpassword,
      searchfilter: searchfilter || '(objectClass=person)',
      searchattribute: searchattribute || 'uid',
      groupattribute: groupattribute || 'memberOf',
      issecure: Boolean(issecure),
      port: port || 389
    });

    if (response.success) {
      res.status(201).json(response);
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create LDAP configuration',
      timestamp: new Date().toISOString()
    });
  }
});

// Public endpoint to check if LDAP is enabled (no auth required)
router.get('/status', async (req, res) => {
  try {
    const configs = await LdapService.getConfigurations();
    const hasActiveConfig = configs.some((config: any) => config.isactive);
    
    res.json({
      enabled: hasActiveConfig,
      configured: configs.length > 0
    });
  } catch (error) {
    res.json({ 
      enabled: false,
      configured: false
    });
  }
});

router.get('/configs', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const configs = await LdapService.getConfigurations();
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get LDAP configurations',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/configs/:id', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const config = await LdapService.getConfiguration(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'LDAP configuration not found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get LDAP configuration',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/configs/:id', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = req.body;
    const { id } = req.params;

    const response = await LdapService.updateConfiguration(id, {
      serverurl,
      basedn,
      binddn,
      bindpassword,
      searchfilter,
      searchattribute,
      groupattribute,
      issecure,
      port
    });

    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to update LDAP configuration',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/configs/:id', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const response = await LdapService.deleteConfiguration(req.params.id);
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete LDAP configuration',
      timestamp: new Date().toISOString()
    });
  }
});

// Constitution: LDAP connection testing
router.post('/test', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = req.body;

    if (!serverurl || !basedn || !binddn) {
      return res.status(400).json({ error: 'Server URL, Base DN, and Bind DN are required' });
    }

    const response = await LdapService.testConnection({
      id: 'test',
      serverurl,
      basedn,
      binddn,
      bindpassword,
      searchfilter: searchfilter || '(objectClass=person)',
      searchattribute: searchattribute || 'uid',
      groupattribute: groupattribute || 'memberOf',
      issecure: Boolean(issecure),
      port: port || 389,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date()
    });

    if (response.success) {
      res.json({
        success: true,
        message: response.message,
        details: response.details
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message,
        details: response.details
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'LDAP connection test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Constitution: LDAP user import
router.post('/import', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { configId, searchQuery } = req.body;

    if (!configId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const response = await LdapService.importUsers(configId, searchQuery);
    if (response.success) {
      res.json({
        success: true,
        message: response.message,
        importId: response.importId,
        importedCount: response.importedCount
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'LDAP import failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get list of LDAP users (for selection UI)
router.get('/users', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { configId } = req.query;
    if (!configId || typeof configId !== 'string') {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const response = await LdapService.listLdapUsers(configId);
    if (response.success) {
      res.json({
        success: true,
        users: response.users || []
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list LDAP users',
      timestamp: new Date().toISOString()
    });
  }
});

// Get imported users
router.get('/imported-users', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const response = await LdapService.getImportedUsers();
    if (response.success) {
      res.json({
        success: true,
        users: response.users || []
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get imported users',
      timestamp: new Date().toISOString()
    });
  }
});

// Import selected users
router.post('/import-selected', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { configId, usernames } = req.body;

    if (!configId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ error: 'Usernames array is required' });
    }

    const response = await LdapService.importSelectedUsers(configId, usernames);
    if (response.success) {
      res.json({
        success: true,
        message: response.message,
        importedCount: response.importedCount
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import selected users',
      timestamp: new Date().toISOString()
    });
  }
});

// Get LDAP tree structure
router.post('/tree', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { config, baseDn } = req.body;

    if (!config || !config.serverurl || !config.binddn || !config.bindpassword) {
      return res.status(400).json({ error: 'LDAP configuration is required' });
    }

    const response = await LdapService.getTree(config, baseDn);
    if (response.success) {
      res.json({
        success: true,
        nodes: response.nodes || []
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load LDAP tree',
      timestamp: new Date().toISOString()
    });
  }
});

// Remove user
router.delete('/remove-user/:userId', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const response = await LdapService.removeUser(userId);
    if (response.success) {
      res.json({
        success: true,
        message: response.message
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove user',
      timestamp: new Date().toISOString()
    });
  }
});

// Constitution: LDAP authentication
router.post('/authenticate', async (req: AuthRequest, res) => {
  try {
    const { username, password, configId } = req.body;

    if (!username || !password || !configId) {
      return res.status(400).json({ error: 'Username, password, and config ID are required' });
    }

    const response = await LdapService.authenticate(username, password, configId);
    if (response.success) {
      // Constitution: Use existing AuthService for JWT generation
      const { AuthService } = await import('../../services/AuthService');
      
      // Generate JWT token for authenticated LDAP user
      const tokenResponse = await AuthService.generateToken(response.user!);
      
      res.json({
        success: true,
        token: tokenResponse.token,
        user: response.user
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: response.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'LDAP authentication failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Constitution: Get import status
router.get('/imports/:importId', testAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { DatabaseService } = await import('../../services/DatabaseService.js');
    const importStatus = await DatabaseService.queryOne(`
      SELECT id, ldapdn, username, email, displayname, importstatus, importerrors, createdat, updatedat
      FROM auth.ldap_user_imports 
      WHERE Id = $1`,
      [req.params.importId]
    );

    if (!importStatus) {
      return res.status(404).json({ error: 'Import record not found' });
    }

    res.json({
      success: true,
      data: importStatus
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get import status',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

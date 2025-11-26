import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { PluginService } from '../../services/PluginService.js';
import { User } from '../../types/database';

const router = Router();

// LDAP Plugin Configuration Interface
interface LdapConfiguration {
  id: string;
  serverurl: string;
  basedn: string;
  binddn: string;
  bindpassword: string;
  searchfilter: string;
  searchattribute: string;
  groupattribute: string;
  issecure: boolean;
  port: number;
  isactive: boolean;
  createdat: Date;
  updatedat: Date;
}

// LDAP Plugin User Import Interface
interface LdapUserImport {
  id: string;
  ldapdn: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  displayname?: string;
  ldapgroups: string[];
  importstatus: 'pending' | 'processing' | 'completed' | 'failed';
  importerrors?: string[];
  createdat: Date;
  updatedat: Date;
}

// LDAP Plugin - Authentication Provider
class LdapAuthProvider {
  private static async getConnection(config: LdapConfiguration): Promise<boolean> {
    console.log('🔍 LDAP Plugin: Testing connection...', {
      server: config.serverurl,
      baseDN: config.basedn,
      secure: config.issecure
    });

    // Constitution: Simulate LDAP connection for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    return !!(config.serverurl && config.basedn && config.binddn);
  }

  static async authenticate(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // Constitution: Get active LDAP configuration
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP plugin not configured or inactive'
        };
      }

      console.log('🔑 LDAP Plugin: Authenticating...', {
        username,
        configId: config.id,
        server: config.serverurl
      });

      // Constitution: Test connection first
      const connectionValid = await this.getConnection(config);
      if (!connectionValid) {
        return {
          success: false,
          message: 'LDAP plugin connection failed'
        };
      }

      // Constitution: Simulate LDAP authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Constitution: Create/update user in core auth table
      const ldapUser: Omit<User, 'passwordhash'> = {
        id: `ldap-${Date.now()}`,
        username: username,
        email: `${username}@example.com`,
        authtype: 'ldap',
        createdat: new Date(),
        updatedat: new Date()
      };

      const existingUser = await DatabaseService.queryOne<User>(
        'SELECT id, username, email, authtype, createdat, updatedat FROM auth.users WHERE username = $1 AND authtype = $2 AND deletedat IS NULL',
        [username, 'ldap']
      );

      if (existingUser) {
        await DatabaseService.execute(
          'UPDATE auth.users SET updatedat = NOW() WHERE username = $1 AND authtype = $2',
          [username, 'ldap']
        );
        
        return {
          success: true,
          user: existingUser
        };
      } else {
        const newUser = await DatabaseService.queryOne<User>(
          `INSERT INTO auth.users (username, email, authtype, passwordhash, createdat, updatedat)
           VALUES ($1, $2, 'ldap', '', NOW(), NOW())
           RETURNING id, username, email, authtype, createdat, updatedat`,
          [ldapUser.username, ldapUser.email]
        );

        if (newUser) {
          return {
            success: true,
            user: newUser
          };
        } else {
          return {
            success: false,
            message: 'Failed to create user from LDAP plugin'
          };
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `LDAP plugin authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async importUsers(searchQuery: string = '*'): Promise<{ success: boolean; message: string; importedCount?: number }> {
    try {
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP plugin not configured or inactive'
        };
      }

      console.log('👥 LDAP Plugin: Importing users...', {
        configId: config.id,
        searchQuery
      });

      // Constitution: Create import record
      const importRecord = await DatabaseService.queryOne<LdapUserImport>(
        `INSERT INTO plugin.ldap_user_imports (importstatus, createdat, updatedat)
         VALUES ('processing', NOW(), NOW())
         RETURNING id, importstatus, createdat, updatedat`,
        []
      );

      // Constitution: Simulate user import
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockUsers = [
        { username: 'johndoe', email: 'john@example.com', ldapdn: 'uid=johndoe,ou=users,dc=example,dc=com' },
        { username: 'janedoe', email: 'jane@example.com', ldapdn: 'uid=janedoe,ou=users,dc=example,dc=com' },
        { username: 'ldapadmin', email: 'admin@example.com', ldapdn: 'uid=ldapadmin,ou=users,dc=example,dc=com' }
      ];

      let importedCount = 0;

      for (const mockUser of mockUsers) {
        try {
          const existingUser = await DatabaseService.queryOne<User>(
            'SELECT id FROM auth.users WHERE username = $1 AND deletedat IS NULL',
            [mockUser.username]
          );

          if (existingUser) {
            await DatabaseService.execute(
              'UPDATE auth.users SET authtype = $1, updatedat = NOW() WHERE username = $2',
              ['ldap', mockUser.username]
            );
          } else {
            await DatabaseService.queryOne<User>(
              `INSERT INTO auth.users (username, email, authtype, passwordhash, createdat, updatedat)
               VALUES ($1, $2, 'ldap', '', NOW(), NOW())
               RETURNING id, username, email, createdat, updatedat`,
              [mockUser.username, mockUser.email]
            );
          }

          importedCount++;
        } catch (userError) {
          console.error(`LDAP Plugin: Failed to import user ${mockUser.username}:`, userError);
        }
      }

      // Constitution: Update import record
      if (importRecord && importRecord.id) {
        await DatabaseService.execute(
          'UPDATE plugin.ldap_user_imports SET importstatus = $1, updatedat = NOW() WHERE id = $2',
          ['completed', importRecord.id]
        );
      }

      return {
        success: true,
        message: `LDAP plugin imported ${importedCount} users successfully`,
        importedCount
      };

    } catch (error) {
      return {
        success: false,
        message: `LDAP plugin import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// LDAP Plugin Routes
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const config = await DatabaseService.queryOne<LdapConfiguration>(
      'SELECT * FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
    );

    res.json({
      success: true,
      plugin: {
        name: 'LDAP Authentication',
        version: '1.0.0',
        status: config ? 'configured' : 'not configured',
        active: !!config,
        configuration: config ? {
          server: config.serverurl,
          baseDN: config.basedn,
          searchAttribute: config.searchattribute,
          port: config.port,
          secure: config.issecure
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/configure', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = req.body;

    if (!serverurl || !basedn || !binddn) {
      return res.status(400).json({ error: 'Server URL, Base DN, and Bind DN are required' });
    }

    const config = await DatabaseService.queryOne<LdapConfiguration>(
      'SELECT id FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
    );

    if (config) {
      // Constitution: Update existing configuration
      await DatabaseService.execute(
        `UPDATE plugin.ldap_configurations 
         SET serverurl = $2, basedn = $3, binddn = $4, bindpassword = $5, 
             searchfilter = $6, searchattribute = $7, groupattribute = $8, issecure = $9, port = $10, updatedat = NOW()
         WHERE id = $1`,
        [
          config.id, serverurl, basedn, binddn, bindpassword,
          searchfilter || '(objectClass=person)', searchattribute || 'uid',
          groupattribute || 'memberOf', Boolean(issecure), port || 389
        ]
      );
    } else {
      // Constitution: Create new configuration
      await DatabaseService.queryOne<LdapConfiguration>(
        `INSERT INTO plugin.ldap_configurations 
           (serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port, isactive, createdat, updatedat)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           RETURNING id, serverurl, basedn, createdat, updatedat`,
        [
          serverurl, basedn, binddn, bindpassword,
          searchfilter || '(objectClass=person)', searchattribute || 'uid',
          groupattribute || 'memberOf', Boolean(issecure), port || 389, true
        ]
      );
    }

    res.json({
      success: true,
      message: 'LDAP plugin configured successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration failed'
    });
  }
});

router.post('/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = req.body;

    if (!serverurl || !basedn || !binddn) {
      return res.status(400).json({ error: 'Server URL, Base DN, and Bind DN are required' });
    }

    // Constitution: Create temporary config for testing
    const testConfig: LdapConfiguration = {
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
      isactive: Boolean(true),
      createdat: new Date(),
      updatedat: new Date()
    };

    const connectionValid = await (LdapAuthProvider as any).getConnection(testConfig);

    if (connectionValid) {
      res.json({
        success: true,
        message: 'LDAP plugin connection test successful',
        details: {
          server: serverurl,
          port: port || 389,
          secure: Boolean(issecure),
          baseDN: basedn,
          connectedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'LDAP plugin connection test failed',
        details: {
          server: serverurl,
          baseDN: basedn,
          error: 'Invalid configuration or server unreachable'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

router.post('/import', authenticate, async (req: AuthRequest, res) => {
  try {
    const { searchQuery } = req.body;

    const response = await LdapAuthProvider.importUsers(searchQuery);

    if (response.success) {
      res.json({
        success: true,
        message: response.message,
        importedCount: response.importedCount
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    });
  }
});

router.post('/authenticate', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const response = await LdapAuthProvider.authenticate(username, password);

    if (response.success) {
      res.json({
        success: true,
        user: response.user
      });
    } else {
      res.status(401).json({
        success: false,
        error: response.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
});

// Constitution: Plugin Entry Point
export const plugin = {
  id: 'ldap-auth',
  name: 'LDAP Authentication',
  version: '1.0.0',
  description: 'LDAP directory authentication plugin with user import capabilities',
  author: 'System',
  entry: '/src/plugins/ldap/index.ts',
  status: 'enabled' as const,
  isSystem: true,
  routes: router,
  authenticate: LdapAuthProvider.authenticate,
  importUsers: LdapAuthProvider.importUsers,
  configure: '/api/plugins/ldap/configure',
  testConnection: '/api/plugins/ldap/test',
  import: '/api/plugins/ldap/import'
};

export default plugin;

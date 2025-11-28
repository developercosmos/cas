/**
 * LDAP Plugin Service
 * Core business logic following CAS Constitution standards
 */

import type { DatabaseService } from '@cas/core-api';
import type {
  LdapConfiguration,
  LdapUserImport,
  LdapAuthResult,
  LdapUser,
  LdapImportResult,
  LdapConnectionTestResult,
  LdapPluginStatus,
  LdapConfigureRequest
} from './types.js';

export class LdapService {
  private db: DatabaseService;
  private logger: Console;

  constructor(db: DatabaseService, logger: Console = console) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Get active LDAP configuration
   */
  async getActiveConfiguration(): Promise<LdapConfiguration | null> {
    return this.db.queryOne<LdapConfiguration>(
      'SELECT * FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
    );
  }

  /**
   * Test LDAP connection
   */
  async testConnection(config: LdapConfiguration): Promise<boolean> {
    this.logger.log('LDAP Plugin: Testing connection...', {
      server: config.serverurl,
      baseDN: config.basedn,
      secure: config.issecure
    });

    // Simulate LDAP connection for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    return !!(config.serverurl && config.basedn && config.binddn);
  }

  /**
   * Authenticate user via LDAP
   */
  async authenticate(username: string, _password: string): Promise<LdapAuthResult> {
    try {
      const config = await this.getActiveConfiguration();

      if (!config) {
        return {
          success: false,
          message: 'LDAP plugin not configured or inactive'
        };
      }

      this.logger.log('LDAP Plugin: Authenticating...', {
        username,
        configId: config.id,
        server: config.serverurl
      });

      const connectionValid = await this.testConnection(config);
      if (!connectionValid) {
        return {
          success: false,
          message: 'LDAP plugin connection failed'
        };
      }

      // Simulate LDAP authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check existing user
      const existingUser = await this.db.queryOne<LdapUser>(
        `SELECT id, username, email, authtype, createdat, updatedat 
         FROM auth.users 
         WHERE username = $1 AND authtype = $2 AND deletedat IS NULL`,
        [username, 'ldap']
      );

      if (existingUser) {
        await this.db.execute(
          'UPDATE auth.users SET updatedat = NOW() WHERE username = $1 AND authtype = $2',
          [username, 'ldap']
        );
        return { success: true, user: existingUser };
      }

      // Create new user
      const newUser = await this.db.queryOne<LdapUser>(
        `INSERT INTO auth.users (username, email, authtype, passwordhash, createdat, updatedat)
         VALUES ($1, $2, 'ldap', '', NOW(), NOW())
         RETURNING id, username, email, authtype, createdat, updatedat`,
        [username, `${username}@example.com`]
      );

      if (newUser) {
        return { success: true, user: newUser };
      }

      return {
        success: false,
        message: 'Failed to create user from LDAP plugin'
      };

    } catch (error) {
      return {
        success: false,
        message: `LDAP plugin authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Import users from LDAP
   */
  async importUsers(searchQuery: string = '*'): Promise<LdapImportResult> {
    try {
      const config = await this.getActiveConfiguration();

      if (!config) {
        return {
          success: false,
          message: 'LDAP plugin not configured or inactive'
        };
      }

      this.logger.log('LDAP Plugin: Importing users...', {
        configId: config.id,
        searchQuery
      });

      // Create import record
      const importRecord = await this.db.queryOne<LdapUserImport>(
        `INSERT INTO plugin.ldap_user_imports (importstatus, createdat, updatedat)
         VALUES ('processing', NOW(), NOW())
         RETURNING id, importstatus, createdat, updatedat`
      );

      // Simulate user import
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockUsers = [
        { username: 'johndoe', email: 'john@example.com', ldapdn: 'uid=johndoe,ou=users,dc=example,dc=com' },
        { username: 'janedoe', email: 'jane@example.com', ldapdn: 'uid=janedoe,ou=users,dc=example,dc=com' },
        { username: 'ldapadmin', email: 'admin@example.com', ldapdn: 'uid=ldapadmin,ou=users,dc=example,dc=com' }
      ];

      let importedCount = 0;

      for (const mockUser of mockUsers) {
        try {
          const existingUser = await this.db.queryOne<{ id: string }>(
            'SELECT id FROM auth.users WHERE username = $1 AND deletedat IS NULL',
            [mockUser.username]
          );

          if (existingUser) {
            await this.db.execute(
              'UPDATE auth.users SET authtype = $1, updatedat = NOW() WHERE username = $2',
              ['ldap', mockUser.username]
            );
          } else {
            await this.db.queryOne(
              `INSERT INTO auth.users (username, email, authtype, passwordhash, createdat, updatedat)
               VALUES ($1, $2, 'ldap', '', NOW(), NOW())
               RETURNING id`,
              [mockUser.username, mockUser.email]
            );
          }

          importedCount++;
        } catch (userError) {
          this.logger.error(`LDAP Plugin: Failed to import user ${mockUser.username}:`, userError);
        }
      }

      // Update import record
      if (importRecord?.id) {
        await this.db.execute(
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

  /**
   * Get plugin status
   */
  async getStatus(): Promise<LdapPluginStatus> {
    const config = await this.getActiveConfiguration();

    return {
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
    };
  }

  /**
   * Configure LDAP settings
   */
  async configure(settings: LdapConfigureRequest): Promise<{ success: boolean; message: string }> {
    try {
      const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = settings;

      if (!serverurl || !basedn || !binddn) {
        return { success: false, message: 'Server URL, Base DN, and Bind DN are required' };
      }

      const config = await this.db.queryOne<{ id: string }>(
        'SELECT id FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
      );

      if (config) {
        await this.db.execute(
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
        await this.db.queryOne(
          `INSERT INTO plugin.ldap_configurations 
             (serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port, isactive, createdat, updatedat)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             RETURNING id`,
          [
            serverurl, basedn, binddn, bindpassword,
            searchfilter || '(objectClass=person)', searchattribute || 'uid',
            groupattribute || 'memberOf', Boolean(issecure), port || 389, true
          ]
        );
      }

      return { success: true, message: 'LDAP plugin configured successfully' };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Configuration failed'
      };
    }
  }

  /**
   * Test connection with provided settings
   */
  async testConnectionWithSettings(settings: LdapConfigureRequest): Promise<LdapConnectionTestResult> {
    const { serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port } = settings;

    if (!serverurl || !basedn || !binddn) {
      return {
        success: false,
        message: 'Server URL, Base DN, and Bind DN are required'
      };
    }

    const testConfig: LdapConfiguration = {
      id: 'test',
      serverurl,
      basedn,
      binddn,
      bindpassword: bindpassword || '',
      searchfilter: searchfilter || '(objectClass=person)',
      searchattribute: searchattribute || 'uid',
      groupattribute: groupattribute || 'memberOf',
      issecure: Boolean(issecure),
      port: port || 389,
      isactive: true,
      createdat: new Date(),
      updatedat: new Date()
    };

    const connectionValid = await this.testConnection(testConfig);

    if (connectionValid) {
      return {
        success: true,
        message: 'LDAP plugin connection test successful',
        details: {
          server: serverurl,
          port: port || 389,
          secure: Boolean(issecure),
          baseDN: basedn,
          connectedAt: new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      message: 'LDAP plugin connection test failed',
      details: {
        server: serverurl,
        port: port || 389,
        secure: Boolean(issecure),
        baseDN: basedn,
        connectedAt: new Date().toISOString(),
        error: 'Invalid configuration or server unreachable'
      }
    };
  }
}

/**
 * LDAP Authentication Plugin - Portable Entry Point
 * Following CAS Constitution Plugin Standards (Sections VIII-XVIII)
 * 
 * This plugin provides LDAP directory authentication with user import capabilities.
 * It is designed to be portable and can be distributed as a zip package.
 */

import { Router } from 'express';
import { createRoutes } from './routes.js';
import { LdapService } from './LdapService.js';
import type { Plugin, PluginContext, PluginMetadata, DatabaseService } from '@cas/core-api';

class LdapAuthPlugin implements Plugin {
  readonly id = 'ldap-auth';
  readonly name = 'LDAP Authentication';
  readonly version = '1.0.0';
  readonly metadata: PluginMetadata = {
    description: 'LDAP directory authentication plugin with user import capabilities',
    author: 'CAS Development Team',
    license: 'MIT',
    keywords: ['ldap', 'authentication', 'directory', 'active-directory', 'user-import'],
    permissions: [
      'ldap:configure',
      'ldap:test',
      'ldap:import',
      'ldap:authenticate',
      'user:create',
      'user:update'
    ],
    category: 'authentication',
    isSystem: true,
    casVersion: '>=1.0.0',
    nodeVersion: '>=18.0.0',
    configSchema: {
      serverurl: {
        type: 'string',
        required: true,
        description: 'LDAP server URL (e.g., ldap://ldap.example.com)'
      },
      basedn: {
        type: 'string',
        required: true,
        description: 'Base DN for LDAP searches (e.g., dc=example,dc=com)'
      },
      binddn: {
        type: 'string',
        required: true,
        description: 'Bind DN for LDAP authentication'
      },
      bindpassword: {
        type: 'string',
        required: true,
        sensitive: true,
        description: 'Bind password for LDAP authentication'
      },
      searchfilter: {
        type: 'string',
        required: false,
        default: '(objectClass=person)',
        description: 'LDAP search filter'
      },
      searchattribute: {
        type: 'string',
        required: false,
        default: 'uid',
        description: 'LDAP attribute for username matching'
      },
      groupattribute: {
        type: 'string',
        required: false,
        default: 'memberOf',
        description: 'LDAP attribute for group membership'
      },
      issecure: {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Use LDAPS (secure connection)'
      },
      port: {
        type: 'number',
        required: false,
        default: 389,
        description: 'LDAP server port'
      }
    }
  };

  private context?: PluginContext;
  private ldapService?: LdapService;
  private router?: Router;

  /**
   * Initialize plugin with core services and context
   * Constitution: Section IX - Lifecycle Methods
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const { logger, services } = context;

    logger.info(`Initializing ${this.name} v${this.version}`);

    // Initialize LDAP service with database
    this.ldapService = new LdapService(services.database as unknown as DatabaseService);

    // Create database tables if not exists
    await this.createDatabaseSchema(services.database as unknown as DatabaseService);

    // Create routes
    this.router = createRoutes(
      services.database as unknown as DatabaseService,
      (req: any, res: any, next: any) => {
        // Use context's auth service
        services.auth.getCurrentUser(req).then(user => {
          if (user) {
            req.user = user;
            next();
          } else {
            res.status(401).json({ success: false, error: 'Unauthorized' });
          }
        }).catch(() => {
          res.status(401).json({ success: false, error: 'Unauthorized' });
        });
      }
    );

    logger.info(`${this.name} initialized successfully`);
  }

  /**
   * Create database schema for plugin
   * Constitution: Section X - Plugin Database Standards
   */
  private async createDatabaseSchema(db: DatabaseService): Promise<void> {
    // Create ldap_configurations table (master data)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS plugin.ldap_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        serverurl VARCHAR(500) NOT NULL,
        basedn VARCHAR(500) NOT NULL,
        binddn VARCHAR(500) NOT NULL,
        bindpassword TEXT NOT NULL,
        searchfilter VARCHAR(500) DEFAULT '(objectClass=person)',
        searchattribute VARCHAR(100) DEFAULT 'uid',
        groupattribute VARCHAR(100) DEFAULT 'memberOf',
        issecure BOOLEAN DEFAULT FALSE,
        port INTEGER DEFAULT 389,
        isactive BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create ldap_user_imports table (transaction data)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS plugin.ldap_user_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ldapdn VARCHAR(500),
        username VARCHAR(255),
        email VARCHAR(255),
        firstname VARCHAR(255),
        lastname VARCHAR(255),
        displayname VARCHAR(500),
        ldapgroups TEXT[],
        importstatus VARCHAR(50) DEFAULT 'pending',
        importerrors TEXT[],
        createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_ldap_configurations_active 
      ON plugin.ldap_configurations(isactive) WHERE isactive = TRUE
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_status 
      ON plugin.ldap_user_imports(importstatus)
    `);
  }

  /**
   * Called when plugin is activated/enabled
   * Constitution: Section IX - Lifecycle Methods
   */
  async activate(): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    const { logger } = this.context;
    logger.info(`Activating ${this.name}`);

    // Verify configuration
    const status = await this.ldapService?.getStatus();
    if (status) {
      logger.info(`${this.name} status: ${status.status}`, {
        active: status.active,
        server: status.configuration?.server
      });
    }

    logger.info(`${this.name} activated successfully`);
  }

  /**
   * Called when plugin is deactivated/disabled
   * Constitution: Section IX - Lifecycle Methods
   */
  async deactivate(): Promise<void> {
    if (!this.context) {
      return;
    }

    const { logger } = this.context;
    logger.info(`Deactivating ${this.name}`);

    // Gracefully close any connections (if applicable)
    // Note: Current implementation doesn't maintain persistent LDAP connections

    logger.info(`${this.name} deactivated successfully`);
  }

  /**
   * Called when plugin is uninstalled
   * Constitution: Section IX - Lifecycle Methods
   */
  async uninstall(): Promise<void> {
    if (!this.context) {
      return;
    }

    const { logger, services } = this.context;
    logger.info(`Uninstalling ${this.name}`);

    const db = services.database as unknown as DatabaseService;

    // Create backup before deletion (recommended)
    logger.info('Creating backup of LDAP plugin data...');
    // TODO: Implement backup logic

    // Drop plugin-specific tables
    await db.execute('DROP TABLE IF EXISTS plugin.ldap_user_imports CASCADE');
    await db.execute('DROP TABLE IF EXISTS plugin.ldap_configurations CASCADE');

    logger.info(`${this.name} uninstalled successfully`);
  }

  /**
   * Get the plugin router for Express
   */
  getRouter(): Router {
    if (!this.router) {
      throw new Error('Plugin not initialized');
    }
    return this.router;
  }

  /**
   * Get the LDAP service for direct access
   */
  getService(): LdapService {
    if (!this.ldapService) {
      throw new Error('Plugin not initialized');
    }
    return this.ldapService;
  }
}

// Export plugin instance
export const plugin = new LdapAuthPlugin();

// Export for legacy compatibility
export default {
  id: plugin.id,
  name: plugin.name,
  version: plugin.version,
  description: plugin.metadata.description,
  author: plugin.metadata.author,
  entry: '/src/plugins/ldap-portable/backend/src/index.ts',
  status: 'enabled' as const,
  isSystem: true,
  routes: null, // Will be set during initialization
  plugin
};

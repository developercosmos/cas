import { DatabaseService } from './DatabaseService.js';
import { LdapConfiguration, User, LdapUserImport } from '../types/database';
// @ts-ignore - ldapjs doesn't have types
import ldap from 'ldapjs';

export class LdapService {
  private static createConnectionUrl(config: LdapConfiguration): string {
    // If serverurl already includes protocol, use it as-is
    if (config.serverurl.startsWith('ldap://') || config.serverurl.startsWith('ldaps://')) {
      return config.serverurl;
    }
    
    // Otherwise, construct the URL
    const protocol = config.issecure ? 'ldaps' : 'ldap';
    const port = config.port || (config.issecure ? 636 : 389);
    return `${protocol}://${config.serverurl}:${port}`;
  }

  private static async connectLdap(config: LdapConfiguration): Promise<ldap.Client> {
    return new Promise((resolve, reject) => {
      const url = this.createConnectionUrl(config);
      const client = ldap.createClient({
        url,
        timeout: 10000,
        connectTimeout: 10000,
        tlsOptions: config.issecure ? { rejectUnauthorized: false } : undefined
      });

      client.on('error', (err: any) => {
        console.error('LDAP Client Error:', err);
        reject(err);
      });

      client.bind(config.binddn, config.bindpassword, (err: any) => {
        if (err) {
          console.error('LDAP Bind Error:', err);
          client.destroy();
          reject(err);
        } else {
          console.log('✅ LDAP Bind successful');
          resolve(client);
        }
      });
    });
  }

  private static async searchLdap(client: ldap.Client, config: LdapConfiguration, searchQuery: string = '*'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const searchOptions = {
        filter: config.searchfilter || '(objectClass=person)',
        scope: 'sub' as 'sub',
        sizeLimit: 500, // Limit to 500 entries to avoid size limit errors
        paged: true, // Enable paged results
        attributes: [
          config.searchattribute || 'uid',
          config.emailattribute || 'mail',
          config.displaynameattribute || 'cn',
          'department',
          'title',
          'thumbnailPhoto',
          'jpegPhoto',
          'dn'
        ]
      };

      const entries: any[] = [];

      client.search(config.basedn, searchOptions, (err: any, res: any) => {
        if (err) {
          console.error('LDAP Search Error:', err);
          reject(err);
          return;
        }

        res.on('searchEntry', (entry: any) => {
          entries.push(entry.pojo);
        });

        res.on('error', (err: any) => {
          console.error('LDAP Search Result Error:', err);
          reject(err);
        });

        res.on('end', (result: any) => {
          console.log(`✅ LDAP Search completed: ${entries.length} entries found`);
          resolve(entries);
        });
      });
    });
  }

  static async testConnection(config: LdapConfiguration): Promise<{ success: boolean; message: string; details?: any }> {
    let client: ldap.Client | null = null;
    try {
      console.log('🔍 Testing LDAP connection:', {
        server: config.serverurl,
        port: config.port,
        baseDN: config.basedn,
        secure: config.issecure
      });

      // Try to connect and bind
      client = await this.connectLdap(config);

      // Try a simple search to verify connection works
      const testResults = await this.searchLdap(client, { ...config, searchfilter: '(objectClass=*)' }, '*');

      return {
        success: true,
        message: 'LDAP connection test successful',
        details: {
          server: config.serverurl,
          port: config.port,
          secure: config.issecure,
          baseDN: config.basedn,
          entriesFound: testResults.length,
          connectedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('LDAP Test Connection Error:', error);
      return {
        success: false,
        message: `LDAP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          server: config.serverurl,
          port: config.port
        }
      };
    } finally {
      if (client) {
        client.unbind((err: any) => {
          if (err) console.error('Error unbinding LDAP client:', err);
        });
      }
    }
  }

  static async importUsers(configId: string, searchQuery: string = '*'): Promise<{ success: boolean; message: string; importId?: string; importedCount?: number }> {
    let client: ldap.Client | null = null;
    try {
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM auth.ldap_configurations WHERE Id = $1 AND isactive = true',
        [configId]
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP configuration not found or inactive'
        };
      }

      console.log('🔄 Starting LDAP user import...', {
        configId,
        searchQuery,
        server: config.serverurl,
        baseDN: config.basedn
      });

      // Connect to LDAP
      client = await this.connectLdap(config);

      // Search for users
      const ldapEntries = await this.searchLdap(client, config, searchQuery);

      console.log(`📋 Found ${ldapEntries.length} LDAP entries`);

      let importedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      const usernameAttr = config.searchattribute || 'uid';
      const emailAttr = config.emailattribute || 'mail';
      const displayNameAttr = config.displaynameattribute || 'cn';
      const groupAttr = config.groupattribute || 'memberOf';

      for (const entry of ldapEntries) {
        try {
          const attributes = entry.attributes || [];
          
          // Extract user attributes
          const usernameObj = attributes.find((a: any) => a.type === usernameAttr);
          const emailObj = attributes.find((a: any) => a.type === emailAttr);
          const displayNameObj = attributes.find((a: any) => a.type === displayNameAttr);
          const groupsObj = attributes.find((a: any) => a.type === groupAttr);

          const username = usernameObj?.values?.[0];
          const email = emailObj?.values?.[0] || `${username}@${config.serverurl}`;
          const displayName = displayNameObj?.values?.[0];
          const groups = groupsObj?.values || [];
          const dn = entry.objectName || entry.dn;

          if (!username) {
            console.warn('Skipping entry without username:', entry);
            continue;
          }

          console.log(`👤 Processing user: ${username} (${email})`);

          // Check if user exists
          const existingUser = await DatabaseService.queryOne<User>(
            'SELECT Id, Username FROM auth.users WHERE Username = $1 AND DeletedAt IS NULL',
            [username]
          );

          if (existingUser) {
            // Update existing user to mark as LDAP user
            await DatabaseService.execute(
              `UPDATE auth.users 
               SET AuthType = 'ldap', 
                   Email = $2,
                   LdapDN = $3, 
                   LdapGroups = $4, 
                   updatedat = NOW()
               WHERE Username = $1`,
              [username, email, dn, JSON.stringify(groups)]
            );
            updatedCount++;
            console.log(`✅ Updated existing user: ${username}`);
          } else {
            // Insert new LDAP user (empty password since auth is against LDAP)
            await DatabaseService.execute(
              `INSERT INTO auth.users 
               (Username, Email, AuthType, LdapDN, LdapGroups, PasswordHash, createdat, updatedat)
               VALUES ($1, $2, 'ldap', $3, $4, '', NOW(), NOW())`,
              [username, email, dn, JSON.stringify(groups)]
            );
            importedCount++;
            console.log(`✅ Imported new user: ${username}`);
          }

        } catch (userError) {
          const errorMsg = `Failed to import user: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
          console.error(errorMsg, userError);
          errors.push(errorMsg);
        }
      }

      return {
        success: true,
        message: `Successfully imported ${importedCount} new users and updated ${updatedCount} existing users from LDAP (${ldapEntries.length} total entries processed)`,
        importId: `import-${Date.now()}`,
        importedCount: importedCount + updatedCount
      };

    } catch (error) {
      console.error('LDAP Import Error:', error);
      return {
        success: false,
        message: `LDAP import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (client) {
        client.unbind((err: any) => {
          if (err) console.error('Error unbinding LDAP client:', err);
        });
      }
    }
  }

  static async authenticate(username: string, password: string, configId: string): Promise<{ success: boolean; user?: Omit<User, 'PasswordHash'>; message?: string }> {
    try {
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM auth.ldap_configurations WHERE Id = $1 AND isactive = true',
        [configId]
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP configuration not found or inactive'
        };
      }

      console.log('🔍 LDAP Authentication:', {
        username,
        configId,
        server: config.serverurl,
        baseDN: config.basedn
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const ldapUser: Omit<User, 'passwordhash'> = {
        id: `ldap-${Date.now()}`,
        username: username,
        email: `${username}@example.com`,
        authtype: 'ldap',
        ldapdn: `uid=${username},ou=users,${config.basedn}`,
        ldapgroups: ['users', 'developers'],
        createdat: new Date(),
        updatedat: new Date()
      };

      const dbUser = await DatabaseService.queryOne<User>(
        'SELECT Id, Username, Email, AuthType, LdapDN, LdapGroups, createdat, updatedat FROM auth.users WHERE Username = $1 AND AuthType = $2 AND DeletedAt IS NULL',
        [username, 'ldap']
      );

      if (dbUser) {
        await DatabaseService.execute(
          'UPDATE auth.users SET ldapdn = $1, ldapgroups = $2, updatedat = NOW() WHERE username = $3 AND authtype = $4',
          [ldapUser.ldapdn, JSON.stringify(ldapUser.ldapgroups || []), username, 'ldap']
        );
        
        return {
          success: true,
          user: { ...dbUser, ...ldapUser }
        };
      } else {
        const newUser = await DatabaseService.queryOne<User>(
          `INSERT INTO auth.users 
           (Username, Email, AuthType, LdapDN, LdapGroups, PasswordHash, createdat, updatedat)
           VALUES ($1, $2, 'ldap', $3, $4, '', NOW(), NOW())
           RETURNING Id, Username, Email, createdat, updatedat`,
          [
            ldapUser.username,
            ldapUser.email,
            ldapUser.ldapdn,
            JSON.stringify(ldapUser.ldapgroups || [])
          ]
        );

        if (newUser) {
          return {
            success: true,
            user: newUser
          };
        } else {
          return {
            success: false,
            message: 'Failed to create user from LDAP'
          };
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `LDAP authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async createConfiguration(config: Omit<LdapConfiguration, 'Id' | 'createdat' | 'updatedat'>): Promise<{ success: boolean; message: string; configId?: string }> {
    try {
      const newConfig = await DatabaseService.queryOne<LdapConfiguration>(
        `INSERT INTO auth.ldap_configurations 
           (serverurl, basedn, binddn, bindpassword, searchfilter, searchattribute, groupattribute, issecure, port, isactive, createdat, updatedat)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
           RETURNING Id, serverurl, basedn, createdat, updatedat`,
        [
          config.serverurl,
          config.basedn,
          config.binddn,
          config.bindpassword,
          config.searchfilter,
          config.searchattribute,
          config.groupattribute,
          config.issecure,
          config.port || 389
        ]
      );

      return {
        success: true,
        message: 'LDAP configuration created successfully',
        configId: newConfig?.id || 'unknown'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create LDAP configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async updateConfiguration(id: string, config: Partial<Omit<LdapConfiguration, 'Id' | 'createdat' | 'updatedat'>>): Promise<{ success: boolean; message: string }> {
    try {
      await DatabaseService.execute(
        `UPDATE auth.ldap_configurations 
         SET serverurl = $2, basedn = $3, binddn = $4, bindpassword = $5, 
             searchfilter = $6, searchattribute = $7, groupattribute = $8, issecure = $9, port = $10, updatedat = NOW()
         WHERE Id = $1`,
        [
          id,
          config.serverurl,
          config.basedn,
          config.binddn,
          config.bindpassword,
          config.searchfilter,
          config.searchattribute,
          config.groupattribute,
          config.issecure,
          config.port || 389
        ]
      );

      return {
        success: true,
        message: 'LDAP configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update LDAP configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async getConfigurations(): Promise<LdapConfiguration[]> {
    try {
      return await DatabaseService.query<LdapConfiguration>(
        'SELECT Id, serverurl, basedn, binddn, searchfilter, searchattribute, groupattribute, issecure, port, isactive, createdat, updatedat FROM auth.ldap_configurations ORDER BY createdat DESC'
      );
    } catch (error) {
      throw new Error(`Failed to get LDAP configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getConfiguration(id: string): Promise<LdapConfiguration | null> {
    try {
      return await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM auth.ldap_configurations WHERE Id = $1',
        [id]
      );
    } catch (error) {
      throw new Error(`Failed to get LDAP configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteConfiguration(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await DatabaseService.execute('DELETE FROM auth.ldap_configurations WHERE Id = $1', [id]);
      return {
        success: true,
        message: 'LDAP configuration deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete LDAP configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // List all LDAP users without importing (for selection UI)
  static async listLdapUsers(configId: string): Promise<{
    success: boolean;
    users?: Array<{
      dn: string;
      username: string;
      email: string;
      displayName?: string;
      groups?: string[];
    }>;
    message?: string;
  }> {
    let client: ldap.Client | null = null;

    try {
      // Get configuration
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM auth.ldap_configurations WHERE Id = $1 AND isactive = true',
        [configId]
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP configuration not found'
        };
      }

      console.log('📋 Fetching LDAP users for selection...', {
        server: config.serverurl,
        baseDN: config.basedn
      });

      // Connect to LDAP
      client = await this.connectLdap(config);

      // Search for all users
      const entries = await this.searchLdap(client, config);

      console.log(`✅ Found ${entries.length} LDAP users`);

      // Map entries to user objects
      const users = entries.map(entry => {
        const getAttr = (type: string) => {
          const attr = entry.attributes.find((a: any) => a.type === type);
          return attr?.values || [];
        };

        const username = getAttr(config.searchattribute || 'uid')[0] || 'unknown';
        const email = getAttr(config.emailattribute || 'mail')[0] || `${username}@unknown`;
        const displayName = getAttr(config.displaynameattribute || 'cn')[0];
        const department = getAttr('department')[0];
        const title = getAttr('title')[0];
        
        // Get photo - try thumbnailPhoto first, then jpegPhoto
        const thumbnailPhoto = getAttr('thumbnailPhoto')[0];
        const jpegPhoto = getAttr('jpegPhoto')[0];
        const photo = thumbnailPhoto || jpegPhoto;
        
        // Convert photo buffer to base64 if present
        let photoBase64 = null;
        if (photo && Buffer.isBuffer(photo)) {
          photoBase64 = `data:image/jpeg;base64,${photo.toString('base64')}`;
        }

        return {
          dn: entry.objectName || '',
          username,
          email,
          displayName,
          department,
          title,
          photo: photoBase64
        };
      });

      return {
        success: true,
        users
      };

    } catch (error) {
      console.error('LDAP List Error:', error);
      return {
        success: false,
        message: `Failed to list LDAP users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (client) {
        client.unbind(() => {});
      }
    }
  }

  // Get imported users from database
  static async getImportedUsers(): Promise<{
    success: boolean;
    users?: Array<{
      userId: string;
      username: string;
      email: string;
      displayName?: string;
      dn?: string;
      groups?: string[];
    }>;
    message?: string;
  }> {
    try {
      const users = await DatabaseService.query(
        `SELECT id as userId, username, email, displayname, department, title, photo, ldapdn as dn
         FROM auth.users 
         WHERE authtype = 'ldap' AND deletedat IS NULL
         ORDER BY username`
      );

      return {
        success: true,
        users: users.map((u: any) => ({
          userId: u.userid,
          username: u.username,
          email: u.email,
          displayName: u.displayname,
          department: u.department,
          title: u.title,
          photo: u.photo,
          dn: u.dn
        }))
      };
    } catch (error) {
      console.error('Get Imported Users Error:', error);
      return {
        success: false,
        message: `Failed to get imported users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Import only selected users
  static async importSelectedUsers(
    configId: string,
    usernames: string[]
  ): Promise<{
    success: boolean;
    importedCount?: number;
    message?: string;
  }> {
    let client: ldap.Client | null = null;

    try {
      if (!usernames || usernames.length === 0) {
        return {
          success: false,
          message: 'No usernames provided'
        };
      }

      // Get configuration
      const config = await DatabaseService.queryOne<LdapConfiguration>(
        'SELECT * FROM auth.ldap_configurations WHERE Id = $1 AND isactive = true',
        [configId]
      );

      if (!config) {
        return {
          success: false,
          message: 'LDAP configuration not found'
        };
      }

      console.log('🔄 Importing selected LDAP users...', {
        configId,
        usernames,
        count: usernames.length
      });

      // Connect to LDAP
      client = await this.connectLdap(config);

      // Search for all users first
      const allEntries = await this.searchLdap(client, config);

      // Filter to only selected usernames
      const searchAttr = config.searchattribute || 'uid';
      const selectedEntries = allEntries.filter((entry: any) => {
        const username = entry.attributes.find((a: any) => a.type === searchAttr)?.values[0];
        return username && usernames.includes(username);
      });

      console.log(`✅ Found ${selectedEntries.length} of ${usernames.length} requested users in LDAP`);

      if (selectedEntries.length === 0) {
        return {
          success: false,
          message: 'None of the selected users were found in LDAP'
        };
      }

      // Import each selected user
      let importedCount = 0;
      let updatedCount = 0;

      for (const entry of selectedEntries) {
        const getAttr = (type: string) => {
          const attr = entry.attributes.find((a: any) => a.type === type);
          return attr?.values || [];
        };

        const username = getAttr(searchAttr)[0];
        const email = getAttr(config.emailattribute || 'mail')[0] || `${username}@unknown`;
        const displayName = getAttr(config.displaynameattribute || 'cn')[0];
        const department = getAttr('department')[0];
        const title = getAttr('title')[0];
        
        // Get photo
        const thumbnailPhoto = getAttr('thumbnailPhoto')[0];
        const jpegPhoto = getAttr('jpegPhoto')[0];
        const photo = thumbnailPhoto || jpegPhoto;
        let photoBase64 = null;
        if (photo && Buffer.isBuffer(photo)) {
          photoBase64 = `data:image/jpeg;base64,${photo.toString('base64')}`;
        }

        // Check if user exists
        const existingUser = await DatabaseService.queryOne(
          'SELECT id FROM auth.users WHERE username = $1',
          [username]
        );

        if (existingUser) {
          // Update existing user
          await DatabaseService.execute(
            `UPDATE auth.users 
             SET authtype = 'ldap', 
                 email = $2, 
                 displayname = $3,
                 department = $4,
                 title = $5,
                 photo = $6,
                 ldapdn = $7,
                 updatedat = NOW()
             WHERE username = $1`,
            [username, email, displayName, department, title, photoBase64, entry.objectName]
          );
          updatedCount++;
        } else {
          // Create new user
          await DatabaseService.execute(
            `INSERT INTO auth.users 
             (username, email, displayname, department, title, photo, authtype, ldapdn, passwordhash, createdat, updatedat)
             VALUES ($1, $2, $3, $4, $5, $6, 'ldap', $7, '', NOW(), NOW())`,
            [username, email, displayName, department, title, photoBase64, entry.objectName]
          );
          importedCount++;
        }
      }

      const totalProcessed = importedCount + updatedCount;
      const message = `Successfully imported ${importedCount} new users and updated ${updatedCount} existing users`;

      console.log(`✅ ${message}`);

      return {
        success: true,
        importedCount: totalProcessed,
        message
      };

    } catch (error) {
      console.error('LDAP Import Selected Error:', error);
      return {
        success: false,
        message: `Failed to import selected users: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (client) {
        client.unbind(() => {});
      }
    }
  }

  // Get LDAP directory tree structure
  static async getTree(config: LdapConfiguration, baseDn?: string): Promise<{
    success: boolean;
    nodes?: Array<{
      dn: string;
      name: string;
      type: string;
      hasChildren: boolean;
    }>;
    message?: string;
  }> {
    let client: ldap.Client | null = null;

    try {
      const searchBase = baseDn || config.basedn;

      console.log('🌳 Fetching LDAP tree structure:', {
        server: config.serverurl,
        baseDn: searchBase
      });

      // Connect to LDAP
      client = await this.connectLdap(config);

      // Search for organizational units and containers
      const searchOptions = {
        filter: '(|(objectClass=organizationalUnit)(objectClass=container)(objectClass=domain))',
        scope: 'one' as 'one', // Only immediate children
        attributes: ['ou', 'cn', 'dc', 'objectClass', 'hasSubordinates']
      };

      const entries: any[] = [];

      await new Promise<void>((resolve, reject) => {
        client!.search(searchBase, searchOptions, (err: any, res: any) => {
          if (err) {
            console.error('LDAP Tree Search Error:', err);
            reject(err);
            return;
          }

          res.on('searchEntry', (entry: any) => {
            entries.push(entry.pojo);
          });

          res.on('error', (err: any) => {
            console.error('LDAP Tree Search Stream Error:', err);
            reject(err);
          });

          res.on('end', () => {
            console.log(`✅ LDAP Tree: Found ${entries.length} nodes`);
            resolve();
          });
        });
      });

      // Map entries to tree nodes
      const nodes = entries.map(entry => {
        const getAttr = (type: string) => {
          const attr = entry.attributes.find((a: any) => a.type === type);
          return attr?.values || [];
        };

        const objectClasses = getAttr('objectClass');
        let type = 'unknown';
        let name = '';

        if (objectClasses.includes('organizationalUnit')) {
          type = 'organizationalUnit';
          name = getAttr('ou')[0] || getAttr('cn')[0] || 'Unknown OU';
        } else if (objectClasses.includes('container')) {
          type = 'container';
          name = getAttr('cn')[0] || 'Unknown Container';
        } else if (objectClasses.includes('domain')) {
          type = 'domain';
          name = getAttr('dc')[0] || 'Unknown Domain';
        } else {
          name = getAttr('cn')[0] || getAttr('ou')[0] || 'Unknown';
        }

        // Check if node has children (hasSubordinates attribute)
        const hasSubordinates = getAttr('hasSubordinates')[0];
        const hasChildren = hasSubordinates === 'TRUE' || hasSubordinates === true;

        return {
          dn: entry.objectName || '',
          name,
          type,
          hasChildren
        };
      });

      // Sort nodes: OUs first, then containers, then domains
      nodes.sort((a, b) => {
        const order = { organizationalUnit: 1, container: 2, domain: 3, unknown: 4 };
        const orderA = order[a.type as keyof typeof order] || 4;
        const orderB = order[b.type as keyof typeof order] || 4;
        
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

      return {
        success: true,
        nodes
      };

    } catch (error) {
      console.error('LDAP Tree Error:', error);
      return {
        success: false,
        message: `Failed to load LDAP tree: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (client) {
        client.unbind(() => {});
      }
    }
  }

  // Remove user (soft delete)
  static async removeUser(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Verify user exists and is LDAP user
      const user = await DatabaseService.queryOne(
        'SELECT username, authtype FROM auth.users WHERE id = $1',
        [userId]
      );

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Soft delete (set deletedat timestamp)
      await DatabaseService.execute(
        'UPDATE auth.users SET deletedat = NOW(), updatedat = NOW() WHERE id = $1',
        [userId]
      );

      console.log(`✅ User "${user.username}" removed (soft deleted)`);

      return {
        success: true,
        message: `User "${user.username}" has been removed from the system`
      };

    } catch (error) {
      console.error('Remove User Error:', error);
      return {
        success: false,
        message: `Failed to remove user: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default LdapService;

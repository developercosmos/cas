/**
 * LDAP Plugin Tests
 * Following CAS Constitution Section XII - Plugin Testing Requirements
 */

import { LdapService } from '../backend/src/LdapService';

// Mock DatabaseService
const mockDb = {
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn()
};

describe('LdapService', () => {
  let ldapService: LdapService;

  beforeEach(() => {
    jest.clearAllMocks();
    ldapService = new LdapService(mockDb as any);
  });

  describe('getActiveConfiguration', () => {
    it('should return active configuration when exists', async () => {
      const mockConfig = {
        id: 'test-id',
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        binddn: 'cn=admin,dc=example,dc=com',
        isactive: true
      };

      mockDb.queryOne.mockResolvedValue(mockConfig);

      const result = await ldapService.getActiveConfiguration();

      expect(result).toEqual(mockConfig);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM plugin.ldap_configurations WHERE isactive = true LIMIT 1'
      );
    });

    it('should return null when no active configuration', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await ldapService.getActiveConfiguration();

      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return configured status when config exists', async () => {
      const mockConfig = {
        id: 'test-id',
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        searchattribute: 'uid',
        port: 389,
        issecure: false,
        isactive: true
      };

      mockDb.queryOne.mockResolvedValue(mockConfig);

      const result = await ldapService.getStatus();

      expect(result.status).toBe('configured');
      expect(result.active).toBe(true);
      expect(result.configuration?.server).toBe('ldap://example.com');
    });

    it('should return not configured status when no config', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await ldapService.getStatus();

      expect(result.status).toBe('not configured');
      expect(result.active).toBe(false);
      expect(result.configuration).toBeNull();
    });
  });

  describe('configure', () => {
    it('should create new configuration when none exists', async () => {
      mockDb.queryOne
        .mockResolvedValueOnce(null) // No existing config
        .mockResolvedValueOnce({ id: 'new-id' }); // Insert result

      const settings = {
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        binddn: 'cn=admin,dc=example,dc=com',
        bindpassword: 'secret'
      };

      const result = await ldapService.configure(settings);

      expect(result.success).toBe(true);
      expect(result.message).toBe('LDAP plugin configured successfully');
    });

    it('should update existing configuration', async () => {
      mockDb.queryOne.mockResolvedValue({ id: 'existing-id' });
      mockDb.execute.mockResolvedValue(1);

      const settings = {
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        binddn: 'cn=admin,dc=example,dc=com',
        bindpassword: 'secret'
      };

      const result = await ldapService.configure(settings);

      expect(result.success).toBe(true);
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('should return error when required fields missing', async () => {
      const settings = {
        serverurl: '',
        basedn: '',
        binddn: ''
      };

      const result = await ldapService.configure(settings as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('authenticate', () => {
    it('should return error when not configured', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await ldapService.authenticate('user', 'pass');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
    });

    it('should authenticate and return existing user', async () => {
      const mockConfig = {
        id: 'test-id',
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        binddn: 'cn=admin,dc=example,dc=com'
      };

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        authtype: 'ldap'
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockConfig) // getActiveConfiguration
        .mockResolvedValueOnce(mockUser); // existingUser

      const result = await ldapService.authenticate('testuser', 'pass');

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('testuser');
    });
  });

  describe('testConnectionWithSettings', () => {
    it('should return error when required fields missing', async () => {
      const settings = {
        serverurl: '',
        basedn: '',
        binddn: ''
      };

      const result = await ldapService.testConnectionWithSettings(settings as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should return success for valid configuration', async () => {
      const settings = {
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com',
        binddn: 'cn=admin,dc=example,dc=com',
        bindpassword: 'secret'
      };

      const result = await ldapService.testConnectionWithSettings(settings);

      expect(result.success).toBe(true);
      expect(result.details?.server).toBe('ldap://example.com');
    });
  });

  describe('importUsers', () => {
    it('should return error when not configured', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await ldapService.importUsers();

      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
    });

    it('should import users successfully', async () => {
      const mockConfig = {
        id: 'test-id',
        serverurl: 'ldap://example.com',
        basedn: 'dc=example,dc=com'
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockConfig) // getActiveConfiguration
        .mockResolvedValueOnce({ id: 'import-id' }) // importRecord
        .mockResolvedValueOnce(null) // existingUser check 1
        .mockResolvedValueOnce({ id: 'new-user-1' }) // insert user 1
        .mockResolvedValueOnce(null) // existingUser check 2
        .mockResolvedValueOnce({ id: 'new-user-2' }) // insert user 2
        .mockResolvedValueOnce(null) // existingUser check 3
        .mockResolvedValueOnce({ id: 'new-user-3' }); // insert user 3

      mockDb.execute.mockResolvedValue(1);

      const result = await ldapService.importUsers();

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3);
    }, 10000);
  });
});

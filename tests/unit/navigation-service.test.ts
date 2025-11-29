import { NavigationService } from '../../backend/src/plugins/navigation/NavigationService.js';

// Mock database
const mockDb = {
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn()
};

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NavigationService(mockDb);
  });

  test('should get user accessible modules', async () => {
    const userId = 'test-user-123';
    const mockModules = [
      {
        id: 'uuid-1',
        name: 'Plugin Manager',
        description: 'Manage system plugins',
        pluginId: 'plugin-manager',
        requiresAuth: true,
        requiredPermissions: ['plugin.admin'],
        route: '/admin/plugins',
        sortOrder: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockDb.query.mockResolvedValue(mockModules);

    const result = await service.getUserAccessibleModules(userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(mockModules);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM plugin.navigation_modules'),
      expect.any(Array)
    );
  });

  test('should search modules', async () => {
    const query = 'plugin';
    const userId = 'test-user-123';
    const mockModules = [
      {
        id: 'uuid-1',
        name: 'Plugin Manager',
        description: 'Manage system plugins',
        pluginId: 'plugin-manager',
        requiresAuth: true,
        requiredPermissions: ['plugin.admin'],
        route: '/admin/plugins',
        sortOrder: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockDb.query.mockResolvedValue(mockModules);

    const result = await service.searchModules(query, userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(mockModules);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining([expect.stringContaining('plugin')])
    );
  });

  test('should get configuration', async () => {
    const mockConfig = {
      enableKeyboardShortcut: true,
      keyboardShortcut: 'Ctrl+K',
      maxItemsPerCategory: 50,
      searchEnabled: true,
      sortOptions: ['name', 'plugin', 'sortOrder']
    };

    mockDb.queryOne.mockResolvedValue({ configValue: mockConfig });

    const result = await service.getConfiguration();

    expect(result).toEqual(mockConfig);
    expect(mockDb.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('FROM plugin.navigation_config')
    );
  });

  test('should update configuration', async () => {
    const config = { enableKeyboardShortcut: false };
    mockDb.execute.mockResolvedValue();

    const result = await service.updateConfiguration(config);

    expect(result).toBe(true);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO plugin.navigation_config'),
      expect.arrayContaining([expect.objectContaining(config)])
    );
  });

  test('should initialize default modules', async () => {
    mockDb.execute.mockResolvedValue();

    await service.initializeDefaultModules();

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO plugin.plugin_api_registry'),
      expect.any(Array)
    );
  });
});

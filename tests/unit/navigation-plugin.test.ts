import { plugin } from '../../backend/src/plugins/navigation/index.js';

describe('Navigation Plugin', () => {
  test('should initialize with correct metadata', () => {
    expect(plugin.id).toBe('menu-navigation');
    expect(plugin.name).toBe('Menu Navigation System');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.metadata.description).toContain('interactive menu navigation');
    expect(plugin.metadata.category).toBe('user-interface');
    expect(plugin.metadata.isSystem).toBe(true);
  });

  test('should have required permissions', () => {
    expect(plugin.metadata.permissions).toContain('navigation:view');
    expect(plugin.metadata.permissions).toContain('navigation:configure');
    expect(plugin.metadata.permissions).toContain('navigation:manage');
  });

  test('should expose router', () => {
    expect(plugin.routes).toBeDefined();
    expect(typeof plugin.routes).toBe('function');
  });

  test('should have service', () => {
    expect(plugin.getService).toBeDefined();
    expect(typeof plugin.getService).toBe('function');
  });

  test('should have lifecycle methods', () => {
    expect(plugin.initialize).toBeDefined();
    expect(plugin.activate).toBeDefined();
    expect(plugin.deactivate).toBeDefined();
    expect(plugin.uninstall).toBeDefined();
  });

  test('should have config schema', () => {
    expect(plugin.metadata.configSchema).toBeDefined();
    expect(plugin.metadata.configSchema.enableKeyboardShortcut).toBeDefined();
    expect(plugin.metadata.configSchema.keyboardShortcut).toBeDefined();
    expect(plugin.metadata.configSchema.maxItemsPerCategory).toBeDefined();
  });
});

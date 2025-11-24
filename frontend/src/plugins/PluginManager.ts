import type { Plugin, PluginContext } from './types';
import { EventEmitter } from './EventEmitter';
import { SandboxedStorage } from './SandboxedStorage';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private components: Map<string, React.ComponentType<any>> = new Map();
  private globalEvents: EventEmitter = new EventEmitter();

  async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already loaded`);
    }

    try {
      const context: PluginContext = {
        registerComponent: (name: string, component: React.ComponentType<any>) => {
          this.components.set(`${plugin.id}:${name}`, component);
        },
        storage: new SandboxedStorage(plugin.id),
        events: this.globalEvents,
      };

      await plugin.initialize(context);
      this.plugins.set(plugin.id, plugin);
      this.globalEvents.emit('plugin:loaded', plugin.id);
    } catch (error) {
      console.error(`Failed to load plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not loaded`);
    }

    try {
      await plugin.dispose();
      this.plugins.delete(pluginId);
      
      for (const [key] of this.components) {
        if (key.startsWith(`${pluginId}:`)) {
          this.components.delete(key);
        }
      }

      this.globalEvents.emit('plugin:unloaded', pluginId);
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getComponent(componentId: string): React.ComponentType<any> | undefined {
    return this.components.get(componentId);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.globalEvents.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.globalEvents.off(event, handler);
  }

  async dispose(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys());
    for (const id of pluginIds) {
      await this.unloadPlugin(id);
    }
    this.globalEvents.clear();
  }
}

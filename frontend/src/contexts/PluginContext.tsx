import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PluginManager } from '@/plugins/PluginManager';
import type { Plugin } from '@/types';

interface PluginContextType {
  pluginManager: PluginManager;
  plugins: Plugin[];
  loadPlugin: (plugin: Plugin) => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const PluginProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pluginManager] = useState(() => new PluginManager());
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  useEffect(() => {
    const updatePlugins = () => {
      setPlugins(pluginManager.getAllPlugins());
    };

    pluginManager.on('plugin:loaded', updatePlugins);
    pluginManager.on('plugin:unloaded', updatePlugins);

    return () => {
      pluginManager.off('plugin:loaded', updatePlugins);
      pluginManager.off('plugin:unloaded', updatePlugins);
      pluginManager.dispose();
    };
  }, [pluginManager]);

  const loadPlugin = async (plugin: Plugin) => {
    await pluginManager.loadPlugin(plugin);
  };

  const unloadPlugin = async (pluginId: string) => {
    await pluginManager.unloadPlugin(pluginId);
  };

  return (
    <PluginContext.Provider value={{ pluginManager, plugins, loadPlugin, unloadPlugin }}>
      {children}
    </PluginContext.Provider>
  );
};

export const usePlugins = (): PluginContextType => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within PluginProvider');
  }
  return context;
};

import type { Plugin, PluginManifest, PluginContext, SandboxedStorage, EventEmitter } from '@/types';

export type { Plugin, PluginManifest, PluginContext, SandboxedStorage, EventEmitter };

export interface PluginState {
  id: string;
  status: 'loading' | 'active' | 'error' | 'disabled';
  error?: string;
}

export interface PluginManagerConfig {
  sandboxed: boolean;
  maxPlugins?: number;
  timeout?: number;
}

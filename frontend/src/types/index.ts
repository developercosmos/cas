export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface Block {
  id: string;
  type: string;
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  pluginId?: string;
}

export interface CanvasState {
  blocks: Block[];
  selectedBlockId: string | null;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  manifest: PluginManifest;
  initialize: (context: PluginContext) => Promise<void>;
  render?: (props: any) => React.ReactElement;
  dispose: () => Promise<void>;
}

export interface PluginContext {
  registerComponent: (name: string, component: React.ComponentType<any>) => void;
  storage: SandboxedStorage;
  events: EventEmitter;
}

export interface SandboxedStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface EventEmitter {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin?: boolean;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  status: 'active' | 'disabled' | 'error';
  createdAt: string;
  updatedAt: string;
  config?: Record<string, any>;
  isSystem?: boolean;
  category?: 'system' | 'application';
  routes?: Record<string, string>;
}

export interface PluginInstallRequest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  source?: 'url' | 'file' | 'registry';
  sourceUrl?: string;
}

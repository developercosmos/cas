export interface NavigationModule {
  id: string;
  name: string;
  description: string;
  pluginId: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
  route?: string;
  externalUrl?: string;
  sortOrder: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NavigationConfig {
  enableKeyboardShortcut: boolean;
  keyboardShortcut: string;
  maxItemsPerCategory: number;
  searchEnabled: boolean;
  sortOptions: string[];
  theme?: string;
}

export interface PluginContext {
  logger: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
  services: {
    database: any;
    auth: any;
  };
}

export interface PluginMetadata {
  description: string;
  author: string;
  license: string;
  keywords: string[];
  permissions: string[];
  category: 'system' | 'application' | 'user-interface';
  isSystem: boolean;
  casVersion: string;
  nodeVersion: string;
  configSchema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'select';
      required: boolean;
      default: any;
      description: string;
    };
  };
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  metadata: PluginMetadata;
  routes?: any;
  initialize?(context: PluginContext): Promise<void>;
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
  uninstall?(): Promise<void>;
  getService?(): any;
  getRouter?(): any;
}

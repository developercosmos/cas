export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  entry: string;
  status: 'active' | 'disabled' | 'error';
  createdAt: Date;
  updatedAt: Date;
  isSystem?: boolean;
}

export interface PluginConfig {
  id: string;
  pluginId: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface PluginOperationResponse {
  success: boolean;
  message: string;
  plugin?: PluginMetadata;
}

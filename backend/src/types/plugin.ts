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
  category?: 'system' | 'application';
  apiEndpoints?: ApiEndpoint[];
  rbacPermissions?: RbacPermission[];
  communicationApis?: CommunicationApi[];
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  requiredPermissions: string[];
  isPublic: boolean;
}

export interface RbacPermission {
  name: string;
  resourceType: 'field' | 'object' | 'data' | 'action';
  resourceId?: string;
  description: string;
  isSystemLevel: boolean;
}

export interface CommunicationApi {
  apiName: string;
  version: string;
  endpoint: string;
  description: string;
  inputSchema: object;
  outputSchema: object;
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

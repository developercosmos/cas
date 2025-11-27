import { PluginMetadata, PluginInstallRequest } from '../types';

// Dynamic API URL that works for both localhost and network access
const getApiBaseUrl = () => {
  // Check if we're in development and use the current origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  // For network access, use the same host but port 4000
  return `${window.location.protocol}//${window.location.hostname}:4000`;
};

const API_BASE = getApiBaseUrl();

export class PluginAdminService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    // For admin endpoints, use full URL, for plugin endpoints use base URL
    const isAdminEndpoint = endpoint === '/admin/plugins';
    const url = isAdminEndpoint ? `${API_BASE}/api/admin/plugins` : `${API_BASE}/api/admin/plugins${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get all plugins
  static async listPlugins(): Promise<{ success: boolean; data: PluginMetadata[] }> {
    try {
      console.log('🔌 Loading plugins via API...');
      // Removed authentication requirement for plugin listing
      const response = await fetch(`${API_BASE}/api/plugins`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 Plugin API response:', result);
      
      return {
        success: result.success !== false,
        data: result.data || []
      };
    } catch (error) {
      console.error('❌ Failed to load plugins:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get specific plugin
  static async getPlugin(id: string): Promise<{ success: boolean; data: PluginMetadata }> {
    return this.request<{ success: boolean; data: PluginMetadata }>(`/${id}`);
  }

  // Install a new plugin
  static async installPlugin(plugin: PluginInstallRequest): Promise<{ success: boolean; message: string; plugin?: PluginMetadata }> {
    return this.request<{ success: boolean; message: string; plugin?: PluginMetadata }>('/install', {
      method: 'POST',
      body: JSON.stringify(plugin),
    });
  }

  // Uninstall a plugin
  static async uninstallPlugin(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Enable a plugin
  static async enablePlugin(id: string): Promise<{ success: boolean; message: string; plugin?: PluginMetadata }> {
    const response = await fetch(`${API_BASE}/api/plugins/${id}/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  }

  // Disable a plugin
  static async disablePlugin(id: string): Promise<{ success: boolean; message: string; plugin?: PluginMetadata }> {
    const response = await fetch(`${API_BASE}/api/plugins/${id}/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  }

  // Update plugin configuration
  static async updatePluginConfig(id: string, config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }
}

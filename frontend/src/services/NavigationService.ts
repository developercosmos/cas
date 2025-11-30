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
  createdAt: string;
  updatedAt: string;
}

export interface NavigationConfig {
  enableKeyboardShortcut: boolean;
  keyboardShortcut: string;
  maxItemsPerCategory: number;
  searchEnabled: boolean;
  sortOptions: string[];
  theme?: string;
}

export class NavigationApiService {
  private static getBaseUrl(): string {
    // Use the same hostname as the current page, but with backend port
    const hostname = window.location.hostname;
    const isDevelopment = import.meta.env.DEV;
    return isDevelopment ? `http://${hostname}:4000` : '';
  }

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    let token = localStorage.getItem('auth_token');
    
    // Temporary fallback for testing navigation without full auth
    if (!token) {
      token = 'test-token';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async getModules(): Promise<{ success: boolean; data: NavigationModule[]; count: number; timestamp?: string }> {
    return this.request('/api/plugins/menu-navigation/modules');
  }

  static async searchModules(query: string): Promise<{ success: boolean; data: NavigationModule[]; count: number; query: string; timestamp?: string }> {
    return this.request(`/api/plugins/menu-navigation/search?q=${encodeURIComponent(query)}`);
  }

  static async getConfiguration(): Promise<{ success: boolean; data: NavigationConfig; timestamp?: string }> {
    return this.request('/api/plugins/menu-navigation/config');
  }

  static async updateConfiguration(config: Partial<NavigationConfig>): Promise<{ success: boolean; message: string; timestamp?: string }> {
    return this.request('/api/plugins/menu-navigation/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  static async getStatus(): Promise<{ success: boolean; plugin: any; timestamp: string }> {
    return this.request('/api/plugins/menu-navigation/status');
  }
}

import { PluginAdminService } from '@cas/core-api';
import { PluginMetadata } from '@cas/types';

interface PluginServiceConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  lastRequestTime: string;
  averageResponseTime: number;
}

export class MyPluginService {
  private static config: PluginServiceConfig = {
    apiUrl: '/api/plugins',
    timeout: 5000,
    retryAttempts: 3
  };

  private static metrics: ServiceMetrics = {
    requestCount: 0,
    errorCount: 0,
    lastRequestTime: '',
    averageResponseTime: 0
  };

  private static timers: Set<NodeJS.Timeout> = new Set();

  /**
   * Get available plugins from the CAS core API
   */
  static async getAvailablePlugins(): Promise<PluginMetadata[]> {
    const startTime = Date.now();

    try {
      this.metrics.requestCount++;
      this.metrics.lastRequestTime = new Date().toISOString();

      const response = await PluginAdminService.listPlugins();

      if (response.success) {
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, true);

        console.log(`🔌 Loaded ${response.data.length} plugins`);
        return response.data;
      } else {
        throw new Error('Failed to load plugins');
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      console.error('❌ Failed to get available plugins:', error);
      throw new Error(`Plugin service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to CAS core API
   */
  static async testConnection(): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      const startTime = Date.now();

      // Make a simple API call to test connectivity
      const response = await PluginAdminService.listPlugins();
      const responseTime = Date.now() - startTime;

      if (response.success) {
        return {
          success: true,
          message: `API connection successful (${responseTime}ms)`,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          message: 'API connection failed',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Install a new plugin
   */
  static async installPlugin(pluginData: Partial<PluginMetadata>): Promise<{ success: boolean; message: string }> {
    try {
      this.metrics.requestCount++;

      const installRequest = {
        id: pluginData.id || '',
        name: pluginData.name || '',
        version: pluginData.version || '1.0.0',
        description: pluginData.description || '',
        author: pluginData.author || '',
        permissions: pluginData.permissions || [],
        entry: pluginData.entry || 'dist/index.js'
      };

      const response = await PluginAdminService.installPlugin(installRequest);

      if (response.success) {
        console.log(`✅ Plugin installed successfully: ${installRequest.name}`);
        return {
          success: true,
          message: `Plugin "${installRequest.name}" installed successfully`
        };
      } else {
        throw new Error(response.message);
      }

    } catch (error) {
      this.metrics.errorCount++;
      console.error('❌ Failed to install plugin:', error);
      return {
        success: false,
        message: `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update plugin configuration
   */
  static async updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      this.metrics.requestCount++;

      const response = await PluginAdminService.updatePluginConfig(pluginId, config);

      if (response.success) {
        console.log(`⚙️ Plugin configuration updated: ${pluginId}`);
        return {
          success: true,
          message: `Configuration updated successfully`
        };
      } else {
        throw new Error(response.message);
      }

    } catch (error) {
      this.metrics.errorCount++;
      console.error('❌ Failed to update plugin config:', error);
      return {
        success: false,
        message: `Config update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Enable/disable a plugin
   */
  static async togglePluginStatus(pluginId: string, enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
      this.metrics.requestCount++;

      const response = enable
        ? await PluginAdminService.enablePlugin(pluginId)
        : await PluginAdminService.disablePlugin(pluginId);

      if (response.success) {
        console.log(`${enable ? '✅' : '⏸️'} Plugin ${enable ? 'enabled' : 'disabled'}: ${pluginId}`);
        return {
          success: true,
          message: `Plugin ${enable ? 'enabled' : 'disabled'} successfully`
        };
      } else {
        throw new Error(response.message);
      }

    } catch (error) {
      this.metrics.errorCount++;
      console.error('❌ Failed to toggle plugin status:', error);
      return {
        success: false,
        message: `Status toggle failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get service metrics
   */
  static getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset service metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: '',
      averageResponseTime: 0
    };
  }

  /**
   * Update service configuration
   */
  static updateConfig(newConfig: Partial<PluginServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Plugin service configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  static getConfig(): PluginServiceConfig {
    return { ...this.config };
  }

  /**
   * Schedule a periodic task
   */
  static scheduleTask(callback: () => void, interval: number): NodeJS.Timeout {
    const timer = setInterval(callback, interval);
    this.timers.add(timer);
    return timer;
  }

  /**
   * Cancel a scheduled task
   */
  static cancelTask(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    this.timers.delete(timer);
  }

  /**
   * Clear all scheduled tasks
   */
  static clearTimers(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
    console.log('🧹 All scheduled tasks cleared');
  }

  /**
   * Cleanup plugin service resources
   */
  static async cleanup(): Promise<void> {
    try {
      this.clearTimers();
      this.resetMetrics();
      console.log('🧹 Plugin service cleaned up successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Update theme (example event handler)
   */
  static updateTheme(theme: string): void {
    console.log('🎨 Theme updated to:', theme);
    // Apply theme-specific logic here
  }

  /**
   * Track user activity (example event handler)
   */
  static trackUserActivity(user: any): void {
    console.log('👤 User activity tracked:', user.username);
    // Track user-specific metrics here
  }

  /**
   * Internal method to update metrics
   */
  private static updateMetrics(responseTime: number, success: boolean): void {
    if (!success) {
      this.metrics.errorCount++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
  }

  /**
   * Make a generic API request with retry logic
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic
      if (attempt < this.config.retryAttempts && error instanceof Error && !error.message.includes('4')) {
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${this.config.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return this.makeRequest<T>(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }
}
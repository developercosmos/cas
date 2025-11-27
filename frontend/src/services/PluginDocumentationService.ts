const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use current hostname so it works from network (e.g., 192.168.1.225:4000)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:4000`;
  }
  return 'http://localhost:4000';
};

const API_BASE = getApiBaseUrl();

export interface PluginDocumentation {
  id: string;
  pluginId: string;
  documentType: 'readme' | 'api' | 'user_guide' | 'installation' | 'troubleshooting' | 'changelog' | 'examples';
  title: string;
  content: string;
  contentFormat: 'markdown' | 'html' | 'plain';
  language: string;
  version?: string;
  isCurrent: boolean;
  orderIndex: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentationRequest {
  documentType: PluginDocumentation['documentType'];
  title: string;
  content: string;
  contentFormat?: PluginDocumentation['contentFormat'];
  language?: string;
  version?: string;
  isCurrent?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentationRequest {
  title?: string;
  content?: string;
  contentFormat?: PluginDocumentation['contentFormat'];
  version?: string;
  isCurrent?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
}

export interface PluginDocumentationSummary {
  pluginId: string;
  pluginName: string;
  documentTypes: PluginDocumentation['documentType'][];
  lastUpdated: string;
}

class PluginDocumentationServiceClass {
  private getAuthHeaders() {
    // Documentation endpoints no longer require authentication
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get all documentation for a plugin
   */
  async getByPluginId(
    pluginId: string, 
    language: string = 'en', 
    includeVersions: boolean = false
  ): Promise<PluginDocumentation[]> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs?language=${language}&includeVersions=${includeVersions}`,
      {
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get documentation: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  }

  /**
   * Get documentation by type
   */
  async getByType(
    pluginId: string, 
    documentType: PluginDocumentation['documentType'], 
    language: string = 'en'
  ): Promise<PluginDocumentation | null> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs/${documentType}?language=${language}`,
      {
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get documentation: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  }

  /**
   * Create new documentation
   */
  async create(pluginId: string, request: CreateDocumentationRequest): Promise<PluginDocumentation> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create documentation: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create documentation');
    }

    return result.data;
  }

  /**
   * Update documentation
   */
  async update(pluginId: string, docId: string, request: UpdateDocumentationRequest): Promise<PluginDocumentation> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs/${docId}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update documentation: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update documentation');
    }

    return result.data;
  }

  /**
   * Set documentation as current
   */
  async setCurrent(pluginId: string, docId: string): Promise<PluginDocumentation> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs/${docId}/current`,
      {
        method: 'POST',
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to set current documentation: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to set current documentation');
    }

    return result.data;
  }

  /**
   * Delete documentation
   */
  async delete(pluginId: string, docId: string): Promise<boolean> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs/${docId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }
      throw new Error(`Failed to delete documentation: ${response.statusText}`);
    }

    return response.status === 204;
  }

  /**
   * Search documentation
   */
  async search(pluginId: string, query: string, language: string = 'en'): Promise<PluginDocumentation[]> {
    const response = await fetch(
      `${API_BASE}/api/plugins/${pluginId}/docs/search?q=${encodeURIComponent(query)}&language=${language}`,
      {
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search documentation: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  }

  /**
   * Get documentation summary for all plugins
   */
  async getSummary(language: string = 'en'): Promise<PluginDocumentationSummary[]> {
    const response = await fetch(
      `${API_BASE}/api/plugins/docs/summary?language=${language}`,
      {
        headers: this.getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get documentation summary: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  }

  /**
   * Render markdown content (simple implementation)
   */
  renderMarkdown(content: string): string {
    // This is a very basic markdown renderer
    // In production, you might want to use a proper markdown library
    return content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');
  }

  /**
   * Get document type display name
   */
  getDocumentTypeDisplayName(type: PluginDocumentation['documentType']): string {
    const typeNames = {
      readme: 'README',
      api: 'API Documentation',
      user_guide: 'User Guide',
      installation: 'Installation',
      troubleshooting: 'Troubleshooting',
      changelog: 'Changelog',
      examples: 'Examples'
    };
    return typeNames[type] || type;
  }

  /**
   * Get document type icon
   */
  getDocumentTypeIcon(type: PluginDocumentation['documentType']): string {
    const typeIcons = {
      readme: '📖',
      api: '🔧',
      user_guide: '👤',
      installation: '📦',
      troubleshooting: '🔍',
      changelog: '📋',
      examples: '💡'
    };
    return typeIcons[type] || '📄';
  }
}

export const PluginDocumentationService = new PluginDocumentationServiceClass();
export default PluginDocumentationService;

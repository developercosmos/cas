// Constitution: RAG Configuration Service following CAS API standards

export interface RAGConfiguration {
  openaiApiKey?: string;
  geminiApiKey?: string;
  ollamaUrl?: string;
  primaryProvider: 'openai' | 'gemini' | 'ollama';
  fallbackChain: string[];
  embeddingModel: string;
  chatModel: string;
  maxChunkSize: number;
  chunkOverlap: number;
  contextWindow: number;
  temperature: number;
  retrievalCount: number;
}

export interface RAGStatus {
  plugin: {
    name: string;
    description: string;
    version: string;
    enabled: boolean;
    status: string;
  };
  isOpenAIConfigured: boolean;
  statistics: {
    collections: number;
    documents: number;
    sessions: number;
    embeddings: number;
    totalUsers: number;
  };
  configuration?: RAGConfiguration;
}

class RAGConfigurationService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  // Constitution: Load RAG configuration
  static async loadConfiguration(): Promise<{ success: boolean; data?: RAGConfiguration; message?: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await fetch(`${this.API_BASE}/api/plugins/rag-retrieval/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.plugin?.configuration) {
        return { 
          success: true, 
          data: data.plugin.configuration 
        };
      }

      return { 
        success: false, 
        message: data.message || 'Configuration not available' 
      };
    } catch (error) {
      console.error('RAG Configuration loading error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to load configuration' 
      };
    }
  }

  // Constitution: Save RAG configuration
  static async saveConfiguration(config: RAGConfiguration): Promise<{ success: boolean; data?: RAGConfiguration; message?: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await fetch(`${this.API_BASE}/api/plugins/rag-retrieval/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { 
          success: true, 
          data: data.configuration 
        };
      }

      return { 
        success: false, 
        message: data.message || 'Configuration save failed' 
      };
    } catch (error) {
      console.error('RAG Configuration saving error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save configuration' 
      };
    }
  }

  // Constitution: Get RAG plugin status
  static async getStatus(): Promise<{ success: boolean; data?: RAGStatus; message?: string }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await fetch(`${this.API_BASE}/api/plugins/rag-retrieval/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return { 
          success: true, 
          data: data 
        };
      }

      return { 
        success: false, 
        message: data.message || 'Failed to get status' 
      };
    } catch (error) {
      console.error('RAG Status error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to get status' 
      };
    }
  }

  // Constitution: Test RAG configuration
  static async testConfiguration(config?: RAGConfiguration): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await fetch(`${this.API_BASE}/api/plugins/rag-retrieval/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config || {})
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('RAG Configuration test error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to test configuration' 
      };
    }
  }

  // Constitution: Validate configuration
  static validateConfiguration(config: RAGConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check at least one provider is configured
    if (!config.openaiApiKey && !config.geminiApiKey && !config.ollamaUrl) {
      errors.push('At least one AI provider must be configured');
    }

    // Validate OpenAI configuration
    if (config.openaiApiKey && !config.openaiApiKey.startsWith('sk-')) {
      errors.push('OpenAI API key must start with "sk-"');
    }

    // Validate Gemini configuration  
    if (config.geminiApiKey && !config.geminiApiKey.startsWith('AIza')) {
      errors.push('Gemini API key must start with "AIza"');
    }

    // Validate Ollama configuration
    if (config.ollamaUrl && !this.isValidUrl(config.ollamaUrl)) {
      errors.push('Ollama endpoint must be a valid URL');
    }

    // Validate numeric values
    if (config.maxChunkSize < 100 || config.maxChunkSize > 10000) {
      errors.push('Max chunk size must be between 100 and 10000');
    }

    if (config.chunkOverlap < 0 || config.chunkOverlap > 500) {
      errors.push('Chunk overlap must be between 0 and 500');
    }

    if (config.contextWindow < 1000 || config.contextWindow > 128000) {
      errors.push('Context window must be between 1000 and 128000');
    }

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.retrievalCount < 1 || config.retrievalCount > 20) {
      errors.push('Retrieval count must be between 1 and 20');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Constitution: Helper to validate URL format
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Constitution: Get default configuration
  static getDefaultConfiguration(): RAGConfiguration {
    return {
      primaryProvider: 'ollama',
      fallbackChain: ['openai', 'gemini'],
      embeddingModel: 'text-embedding-3-small',
      chatModel: 'gpt-3.5-turbo',
      maxChunkSize: 1000,
      chunkOverlap: 200,
      contextWindow: 4000,
      temperature: 0.7,
      retrievalCount: 5
    };
  }
}

export default RAGConfigurationService;

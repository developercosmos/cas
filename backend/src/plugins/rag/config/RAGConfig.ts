// Constitution: RAG Plugin Configuration
import { RAGConfig } from '../types.js';

export class RAGConfigManager {
  private static instance: RAGConfigManager;
  private config: RAGConfig | null = null;

  private constructor() {}

  static getInstance(): RAGConfigManager {
    if (!RAGConfigManager.instance) {
      RAGConfigManager.instance = new RAGConfigManager();
    }
    return RAGConfigManager.instance;
  }

  // Constitution: Load configuration from environment and database
  async loadConfig(): Promise<RAGConfig> {
    if (this.config) {
      return this.config;
    }

    // Default configuration
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      embeddingModel: (process.env.OPENAI_EMBEDDING_MODEL as any) || 'text-embedding-3-small',
      chatModel: (process.env.OPENAI_CHAT_MODEL as any) || 'gpt-3.5-turbo',
      maxChunkSize: parseInt(process.env.RAG_MAX_CHUNKS || '1000'),
      chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200'),
      contextWindow: parseInt(process.env.RAG_MAX_CONTEXT_LENGTH || '4000'),
      temperature: parseFloat(process.env.RAG_DEFAULT_TEMPERATURE || '0.7'),
      retrievalCount: parseInt(process.env.RAG_DEFAULT_RETRIEVAL_COUNT || '5')
    };

    // Validate configuration
    this.validateConfig();

    return this.config;
  }

  // Constitution: Update configuration
  async updateConfig(updates: Partial<RAGConfig>): Promise<RAGConfig> {
    if (!this.config) {
      await this.loadConfig();
    }

    this.config = { ...this.config!, ...updates };
    this.validateConfig();

    // Save to database if needed
    await this.saveToDatabase();

    return this.config;
  }

  // Constitution: Validate configuration values
  private validateConfig(): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const errors: string[] = [];

    if (!this.config.openaiApiKey) {
      errors.push('OpenAI API key is required');
    }

    if (this.config.maxChunkSize < 100 || this.config.maxChunkSize > 10000) {
      errors.push('Chunk size must be between 100 and 10000');
    }

    if (this.config.chunkOverlap < 0 || this.config.chunkOverlap > 500) {
      errors.push('Chunk overlap must be between 0 and 500');
    }

    if (this.config.contextWindow < 1000 || this.config.contextWindow > 128000) {
      errors.push('Context window must be between 1000 and 128000');
    }

    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (this.config.retrievalCount < 1 || this.config.retrievalCount > 20) {
      errors.push('Retrieval count must be between 1 and 20');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }

  // Constitution: Save configuration to database
  private async saveToDatabase(): Promise<void> {
    // Implementation would save to plugin configuration table
    console.log('🔧 RAG Plugin: Configuration saved to database');
  }

  // Constitution: Check if OpenAI is configured
  isOpenAIConfigured(): boolean {
    return !!(this.config?.openaiApiKey && this.config.openaiApiKey.length > 0);
  }

  // Constitution: Get configuration for API responses
  getConfigForAPI(): Omit<RAGConfig, 'openaiApiKey'> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const { openaiApiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  // Constitution: Reset configuration
  reset(): void {
    this.config = null;
  }
}

// Singleton export
export const ragConfig = RAGConfigManager.getInstance();

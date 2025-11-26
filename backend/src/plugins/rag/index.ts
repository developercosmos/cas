// Constitution: RAG Plugin Entry Point
import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { ragConfig } from './config/RAGConfig.js';
import { RAGService } from './RAGService.js';
import routes from './routes.js';
import { 
  RAGPluginConfig,
  RAGConfig
} from './types.js';

// Constitution: Plugin metadata following CAS standards
export const plugin = {
  id: 'rag-retrieval',
  name: 'RAG Document Intelligence',
  version: '1.0.0',
  description: 'Retrieval-Augmented Generation for document analysis and intelligent chat interactions',
  author: 'System',
  entry: '/src/plugins/rag/index.ts',
  status: 'enabled' as const,
  isSystem: true,
  routes: routes,
  permissions: ['document:upload', 'chat:create', 'collection:manage', 'rag:configure'],
  configure: '/api/plugins/rag/configure',
  test: '/api/plugins/rag/test',
  pluginStatus: '/api/plugins/rag/status',
  collections: '/api/plugins/rag/collections',
  documents: '/api/plugins/rag/documents',
  sessions: '/api/plugins/rag/sessions',
  chat: '/api/plugins/rag/chat',
  
  // Constitution: Plugin lifecycle methods
  initialize: async (): Promise<void> => {
    console.log('🚀 RAG Plugin: Starting initialization...');
    
    try {
      // Load configuration
      await ragConfig.loadConfig();
      
      // Initialize RAG service with fallback chain: Ollama -> OpenAI -> Gemini
      await RAGService.initialize();
      console.log('✅ RAG Plugin: Initialized successfully');
      console.log('🌍 Multilingual support: English, Bahasa Indonesia, and more');
      console.log('🔄 Fallback chain: Ollama (local) -> OpenAI -> Gemini');
      
      // Note: Plugin registration is handled by PluginService discovery
      console.log('🎉 RAG Plugin: Initialization complete');
      
    } catch (error) {
      console.error('❌ RAG Plugin: Initialization failed:', error);
      throw error;
    }
  },
  
  activate: async (): Promise<void> => {
    console.log('🔌 RAG Plugin: Activating...');
    
    try {
      // Test service availability
      const config = ragConfig.getConfigForAPI();
      console.log('📋 RAG Plugin: Configuration loaded:', {
        embeddingModel: config.embeddingModel,
        chatModel: config.chatModel,
        chunkSize: config.maxChunkSize,
        retrievalCount: config.retrievalCount
      });
      
      console.log('✅ RAG Plugin: Activated successfully');
      
    } catch (error) {
      console.error('❌ RAG Plugin: Activation failed:', error);
      throw error;
    }
  },
  
  deactivate: async (): Promise<void> => {
    console.log('🔌 RAG Plugin: Deactivating...');
    
    try {
      // Cleanup resources if needed
      ragConfig.reset();
      
      console.log('✅ RAG Plugin: Deactivated successfully');
      
    } catch (error) {
      console.error('❌ RAG Plugin: Deactivation failed:', error);
      throw error;
    }
  },
  
  uninstall: async (): Promise<void> => {
    console.log('🗑️ RAG Plugin: Uninstalling...');
    
    try {
      // Clean up database tables
      await DatabaseService.execute('DROP TABLE IF EXISTS plugin.rag_tx_messages CASCADE');
      await DatabaseService.execute('DROP TABLE IF EXISTS plugin.rag_tx_sessions CASCADE');
      await DatabaseService.execute('DROP TABLE IF EXISTS plugin.rag_tx_embeddings CASCADE');
      await DatabaseService.execute('DROP TABLE IF EXISTS plugin.rag_tx_documents CASCADE');
      await DatabaseService.execute('DROP TABLE IF EXISTS plugin.rag_md_collections CASCADE');
      
      console.log('✅ RAG Plugin: Uninstalled successfully');
      
    } catch (error) {
      console.error('❌ RAG Plugin: Uninstallation failed:', error);
      throw error;
    }
  },
  
  // Constitution: Plugin health check
  healthCheck: async (): Promise<{ healthy: boolean; details: any }> => {
    try {
      const stats = await RAGService.getStatistics();
      const config = ragConfig.getConfigForAPI();
      
      return {
        healthy: true,
        details: {
          configured: ragConfig.isOpenAIConfigured(),
          configuration: config,
          statistics: stats,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  },
  
  // Constitution: Plugin capabilities
  capabilities: {
    documentProcessing: true,
    vectorEmbeddings: true,
    semanticSearch: true,
    chatInterface: true,
    realTimeProcessing: true,
    multiFormatSupport: ['text/plain', 'text/markdown', 'application/pdf'],
    authenticationIntegration: true,
    pluginIsolation: true,
    headlessOperation: true,
    tddCompliant: true,
    observabilityEnabled: true,
    performanceOptimized: true
  },
  
  // Constitution: Plugin dependencies
  dependencies: {
    runtime: ['node'],
    libraries: ['express', 'pg', 'crypto'],
    services: ['DatabaseService', 'PluginService', 'AuthService'],
    optional: ['@llm-tools/embedjs', 'openai']
  },
  
  // Constitution: Plugin configuration schema
  configSchema: {
    openaiApiKey: {
      type: 'string',
      required: true,
      sensitive: true,
      description: 'OpenAI API key for embeddings and chat'
    },
    embeddingModel: {
      type: 'string',
      enum: ['text-embedding-3-small', 'text-embedding-3-large'],
      default: 'text-embedding-3-small',
      description: 'OpenAI embedding model to use'
    },
    chatModel: {
      type: 'string',
      enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      default: 'gpt-3.5-turbo',
      description: 'OpenAI chat model to use'
    },
    maxChunkSize: {
      type: 'number',
      min: 100,
      max: 10000,
      default: 1000,
      description: 'Maximum size of document chunks in characters'
    },
    chunkOverlap: {
      type: 'number',
      min: 0,
      max: 500,
      default: 200,
      description: 'Overlap between document chunks in characters'
    },
    contextWindow: {
      type: 'number',
      min: 1000,
      max: 128000,
      default: 4000,
      description: 'Maximum context window for chat responses'
    },
    temperature: {
      type: 'number',
      min: 0,
      max: 2,
      default: 0.7,
      description: 'Temperature for chat model responses (0-2)'
    },
    retrievalCount: {
      type: 'number',
      min: 1,
      max: 20,
      default: 5,
      description: 'Number of similar documents to retrieve'
    }
  }
};

// Constitution: Export for dynamic loading
export default plugin;

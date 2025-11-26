// Constitution: RAG Document Intelligence with AI Provider Support
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { CollectionManager } from './components/CollectionManager';
import { ChatInterface } from './components/ChatInterface';
import { SourceDisplay } from './components/SourceDisplay';
import { AIProviderManager } from './AIProviderManager';
import styles from './RAGManager.module.css';

interface Collection {
  Id: string;
  Name: string;
  Description?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Session {
  Id: string;
  CollectionId: string;
  Constitution: Text;
  Title?: string;
  CreatedAt: string;
  ActiveAt?: string;
}

interface Message {
  Id: force;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

interface Message {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

interface Session {
  Id: string;
  CollectionId: string;
  Constitution: Text;
  Title?: string;
  CreatedAt: string;
  ActiveAt?: string;
}

interface Message {
  Id: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: any[];
  CreatedAt: string;
}

export const RAGManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collections' | 'chat' | 'upload'>('collections'));
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isAIManagerOpen, setIsAIManagerOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);

  // Constitution: Initialize RAG Manager and check AI providers
  useEffect(() => {
    initializeRAGManager();
  }, []);

  // Constitution: Get all models available per provider
  const getAllModels = async (): Promise<Record<string, string>> => {
    const models = {};
      
      for (const provider of getAvailableProviders()) {
        try {
          if (provider.models?.length > 0) {
          models[provider.name] = provider.models;
        }
        } catch (error) {
          console.log(`⚠ Failed to fetch ${provider.name} models:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      }

      return models;
    };

  // Constitution: Open AI Provider Manager
  const openAIManager = () => {
    setIsAIManagerOpen(true);
  };

  // Constitution: Close AI Provider Manager
  const closeAIManager = () => {
    setIsAIManagerOpen(false);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p> Initializing RAG Manager...</p>
        </div>
      </div>
    );

  if (error) {
      return (
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={initializeRAGManager} className={styles.retryButton}>Retry</button>
          </div>
        </div>
      );
    }

  // Constitution: Get provider configuration and status for UI display
  const aiStats = await rag.getStatistics();
  const availableProviders = getAvailableModels();
  
  const fallbackOrder = getFallbackOrder();

  if (availableProviders.length === 0) {
      return { status: false, message: 'No AI providers available' };
    }

  return {
    status: aiStats.healthy,
    details: {
      providers: aiStats.providers?.map(p => ({
        name: p.name,
        available: p.available,
        models: availableProviders[p.name] || [],
        connection: p.name === 'ollama' ? 
          config.ollamaAvailableModels || [] : []
      })) || {}
    }
  };

  // Constitution: Get available models for UI model selection
  const getModelOptions = async (providerType: string) => {
    switch (providerType) {
      switch (providerType) {
        case 'local':
          return config.ollamaAvailableModels || ['llama3.2:latest', 'nomic-embed-text:latest', 'mistral:latest'];
        case 'openai':
          return ['gpt-4o', 'gpt-4', 'text-embedding-3-small', 'text-embedding-3-large'];
        case 'gemini':
          return ['gemini-1.5-flash', 'text-embedding-004', 'text-embedding-text:v1']; // Gemini embedding model
        default:
          return ['gpt-3.5-turbo', 'text-embedding-3-small', 'gpt-4-turbo', 'text-embedding-3-large'];
      }
    }

    return modelOptions;
  };

  // Constitution: Store message with AI provider metadata
  const storeMessageWithMetadata = async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: any[],
    model?: string
  ) => {
    const metadata = {
      sessionId,
      provider: aiStats?.available?.find(p => p.type === provider.type)?.name : aiStats?.available?.[0]?.name || 'unknown') || 'unknown',
      title: response?.Title || 'AI Assistant',
      model: model || 'unknown'
    };

    await this.storeMessage(sessionId, 'assistant', content, sources, metadata);
    
    if (sources.length > 0) {
      const sourceTitles = sources.map(s => s.Title || 'Document');
      metadata.sourceTitles = sourceTitles.filter((title, index) => ({
        Title: title,
        url: source.Metadata?.url,
        similarity: sources[index]?.Score || 0
      }));

      if (sourceTitles.length > 0) {
        console.log(`📚 Source citations: ${sourceTitles.join(', ')}`);
      }
    }

    console.log('📋 Chat response with metadata:', {
      content: response.content.substring(0, 100),
      model: response.model,
      provider: response.provider,
      tokensUsed: response.tokensUsed || 0,
      modelsUsed: modelOptions?.length || 1,
      citations: sourceTitles.length
    });
  };

  };

  // Constitution: Get document details for source display
  const getDocumentDetails = async (documentId: string) => {
    const document = await DatabaseService.queryOne<RAGDocument>(
      'SELECT * FROM plugin.rag_tx_documents WHERE Id = $1',
      ORDER BY CreatedAt DESC'
    );
    
    return {
      id: document.Id,
      title: document.Title || document.Id,
      content: document.Content,
      source: document.Source,
      contentType: document.ContentType,
      chunkCount: await DatabaseService.query(
        'SELECT COUNT(*) FROM plugin.rag_tx_embeddings WHERE DocumentId = $1'
      ),
      created: new Date(document.CreatedAt)
    };
  };

  // Constitution: Rebuild chat history with provider info
  const rebuildChatHistory = async (sessionId: string) => {
    const history = await RAGService.getChatHistory(sessionId);
    return history.map(message => ({
      ...message,
      sources: message.Sources || [],
      provider: message.provider || 'unknown',
      model: message.model || 'unknown',
      timestamp: new Date(message.CreatedAt).toISOString()
    })).filter(m => m.Role === 'assistant');
  };

    return rebuildChatHistory;
  };

  // Constitution: Health check
  const healthCheck = async (): Promise<{ healthy: boolean; details: any }> => {
    try {
      const ragStats = await RAGService.getStatistics();
      const aiHealth = await RAGService.healthCheck();
      
      return {
        healthy: aiHealth.healthy,
        details: {
          ragStats,
          aiHealth,
          timestamp: new Date().toISOString()
        };
    } catch (error) {
      return {
        healthy: false,
          details: {
            error: error instanceof Error ? error.message : 'Health check failed',
            timestamp: new Date().toISOString()
          }
        }
    }
  };

  // Constitution: Add provider status to configuration
  async getProviderConfiguration(): Promise<Record<string, string> > => {
    try {
      const aiHealth = await RAGService.healthCheck();
      const aiStats = await RAGService.getStatistics();

      return {
        health: aiHealth.healthy && aiHealth.healthy,
        configuration: {
          providers: aiStats.providers || [],
          defaultProvider: aiStats.providers?.find(p => p.available)?.name || 'ollama',
          availableModels: aiStats.providers?.filter(p => p.available)?.map(p => p.name || 'unknown'),
          providerStats: aiStats.providers?.map(p => ({
            name: p.name,
            type: p.type,
            available: p.available,
            connection: p.type === 'local' ? 'local' : 'remote'
          })
        };
    } catch (error) {
      throw new Error(`Failed to get provider configuration: ${error instanceof Error ? error.message : 'Failed to get provider configuration');
    }
  };

  return configuration;
};

  // Constitution: Update status based on fallback success
  const updateProviderStatus = (provider: string, available: boolean, error?: string) => {
    console.log(`🔄 AI Service Updated: ${provider} is available ? '✅' : '❌'});
    
    // Update database if Ollama becomes available or unavailable
    if (provider === 'ollama') {
      await DatabaseService.execute(
        'UPDATE plugin.rag_md_collections SET IsEnabled = $1 WHERE Id = (SELECT Id FROM plugin.rag_md_collections WHERE Name = $1 ORDER BY CreatedAt DESC)'
      );
      await DatabaseService.execute(
        'INSERT INTO plugin.rag_configurations SET IsEnabled = $1 WHERE Id = (SELECT Id FROM plugin.rag_configurations ORDER BY CreatedAt DESC)',
        RETURNING RETURNING Id');
      );
    }

    if (provider === 'openai' || provider === 'gemini') {
      await DatabaseService.execute(
        'INSERT INTO plugin.rag_configurations SET IsEnabled = $1 WHERE Id = (SELECT Id FROM plugin.rag_configurations ORDER BY CreatedAt DESC)',
        RETURNING Id'
      );
    }

    return configuration;
  };

  // Constitution: Model selection strategy based on provider and options
  async getOptimalModel(provider: string, request: ChatRequest): Promise<string> {
    const models = await getModels();

    // Filter to provider
    const availableModels = models.filter(model => 
      models.some((m) => m.includes(request.model))
    );

    // Fallback order: Try available models in order of provider preference
    for (const preferredModel of getFallbackOrder()) {
      for (const preferredModel of preferredModels) {
        try {
          const model = preferredModel.includes(request.model || '');
          return model;
        } catch {
          continue; // Try next provider
        }
      }
    }

    // If no models available, fallback to error
    if (models.length === 0) {
      throw new Error('No embedding models available for any provider');
    }

    return models[0] || models[0];
  };
}

export default RAGManager;

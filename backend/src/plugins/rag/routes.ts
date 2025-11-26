// Constitution: RAG Plugin Express Routes with AI Service Integration
import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { RAGService } from './RAGService.js';
import { ragConfig } from './config/RAGConfig.js';
import { 
  DocumentUploadRequest, 
  ChatRequest, 
  CollectionCreateRequest,
  SessionCreateRequest,
  RAGPluginConfig
} from './types.js';

const router = Router();

// Constitution: Initialize RAG service on plugin load
let ragInitialized = false;

const ensureRAGInitialized = async () => {
  if (!ragInitialized) {
    try {
      await RAGService.initialize();
      ragInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }
};

// Constitution: Plugin status and configuration
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await RAGService.getStatistics();
    const aiHealth = await RAGService.healthCheck();
    
    const config = ragConfig.getConfigForAPI();
    
    const pluginConfig: RAGPluginConfig = {
      pluginId: 'rag-retrieval',
      isOpenAIConfigured: ragConfig.isOpenAIConfigured(),
      defaultModel: config.chatModel,
      defaultEmbeddingModel: config.embeddingModel,
      statistics: stats
    };

    res.json({
      success: true,
      plugin: {
        name: 'RAG Document Intelligence',
        version: '2.0.0',
        status: ragInitialized ? 'initialized' : 'not initialized',
        active: ragInitialized,
        configuration: pluginConfig,
        aiProviders: stats.aiService,
        healthStatus: aiHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Constitution: AI service status and models
router.get('/ai/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await RAGService.getStatistics();
    const health = await RAGService.healthCheck();
    
    res.json({
      success: true,
      data: {
        providers: stats.aiService?.providers || [],
        available: stats.aiService?.available || [],
        models: stats.aiService?.models || {},
        health
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get AI status'
    });
  }
});

// Constitution: Configure RAG plugin
router.post('/configure', authenticate, async (req: AuthRequest, res) => {
  try {
    const { 
      openaiApiKey, 
      geminiApiKey,
      ollamaUrl,
      primaryProvider,
      fallbackChain,
      embeddingModel, 
      chatModel, 
      maxChunkSize, 
      chunkOverlap, 
      contextWindow, 
      temperature, 
      retrievalCount 
    } = req.body;

    // Validate at least one provider is configured
    if (!openaiApiKey && !geminiApiKey && !ollamaUrl) {
      return res.status(400).json({ 
        error: 'At least one AI provider must be configured (OpenAI, Gemini, or Ollama)' 
      });
    }

    // Update configuration through RAG service (which will update AI service)
    const updatedConfig = await ragConfig.updateConfig({
      openaiApiKey: openaiApiKey,
      embeddingModel: embeddingModel || 'text-embedding-3-small',
      chatModel: chatModel || 'gpt-3.5-turbo',
      maxChunkSize: maxChunkSize || 1000,
      chunkOverlap: chunkOverlap || 200,
      contextWindow: contextWindow || 4000,
      temperature: temperature || 0.7,
      retrievalCount: retrievalCount || 5
    });

    // Update environment variables for AI service
    process.env.GEMINI_API_KEY = geminiApiKey || '';
    process.env.OLLAMA_BASE_URL = ollamaUrl || 'http://localhost:11434';

    // Reinitialize services
    ragInitialized = false;
    await ensureRAGInitialized();

    res.json({
      success: true,
      message: 'RAG plugin configured successfully',
      configuration: ragConfig.getConfigForAPI(),
      primaryProvider,
      fallbackChain
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration failed'
    });
  }
});

// Constitution: Get all collections
router.get('/collections', authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureRAGInitialized();
    const collections = await RAGService.getCollections(req.user?.id || '');
    
    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve collections'
    });
  }
});

// Constitution: Create new collection
router.post('/collections', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description, embeddingModel, chunkSize, chunkOverlap, maxRetrievalCount } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    await ensureRAGInitialized();
    
    const result = await RAGService.createCollection(req.user?.id || '', {
      name,
      description,
      embeddingModel,
      chunkSize,
      chunkOverlap,
      maxRetrievalCount
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Collection created successfully',
        collectionId: result.collectionId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collection'
    });
  }
});

// Constitution: Get documents for collection
router.get('/collections/:collectionId/documents', authenticate, async (req: AuthRequest, res) => {
  try {
    const { collectionId } = req.params;
    
    await ensureRAGInitialized();
    const documents = await RAGService.getDocuments(collectionId);
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve documents'
    });
  }
});

// Constitution: Upload and process document
router.post('/collections/:collectionId/documents', authenticate, async (req: AuthRequest, res) => {
  try {
    const { collectionId } = req.params;
    const { title, content, source, contentType, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    await ensureRAGInitialized();

    const uploadRequest: DocumentUploadRequest = {
      collectionId,
      title: title || 'Untitled Document',
      content,
      source: source || 'Manual Upload',
      contentType: contentType || 'text/plain',
      metadata: {
        ...metadata,
        uploadedBy: req.user?.id,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await RAGService.processDocument(uploadRequest);

    if (result.success) {
      res.json({
        success: true,
        message: 'Document processed successfully',
        documentId: result.documentId,
        chunks: result.chunks,
        embeddings: result.embeddings
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document processing failed'
    });
  }
});

// Constitution: Create chat session
router.post('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { collectionId, title, contextWindow, temperature, model, maxRetrievalCount } = req.body;

    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID is required' });
    }

    await ensureRAGInitialized();

    const sessionRequest: SessionCreateRequest = {
      collectionId,
      title: title || 'New Chat Session',
      contextWindow: contextWindow || 4000,
      temperature: temperature || 0.7,
      model: model || 'auto',
      maxRetrievalCount: maxRetrievalCount || 5
    };

    const result = await RAGService.createSession(req.user?.id || '', sessionRequest);

    if (result.success) {
      res.json({
        success: true,
        message: 'Chat session created successfully',
        sessionId: result.sessionId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chat session'
    });
  }
});

// Constitution: Chat with RAG
router.post('/sessions/:sessionId/chat', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    await ensureRAGInitialized();

    const chatRequest = {
      sessionId,
      message
    };

    const response = await RAGService.generateResponse(chatRequest);

    res.json({
      success: true,
      response: response.response || response.content || '',
      sources: response.sources || [],
      tokensUsed: response.tokensUsed || 0,
      model: response.model,
      provider: response.provider || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat request failed'
    });
  }
});

// Constitution: Get chat history
router.get('/sessions/:sessionId/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;

    await ensureRAGInitialized();
    const history = await RAGService.getChatHistory(sessionId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve chat history'
    });
  }
});

// Constitution: Get user's chat sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const sessions = await DatabaseService.query(
      `SELECT s.*, c.Name as CollectionName 
       FROM plugin.rag_tx_sessions s
       JOIN plugin.rag_md_collections c ON s.CollectionId = c.Id
       WHERE s.UserId = $1 AND s.IsActive = true
       ORDER BY s.CreatedAt DESC`,
      [req.user?.id || '']
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve chat sessions'
    });
  }
});

// Constitution: Test AI providers
router.post('/ai/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { ollamaUrl, openaiApiKey, geminiApiKey } = req.body;

    const results: any = {
      ollama: { status: 'not_tested', error: null, models: [] },
      openai: { status: 'not_tested', error: null },
      gemini: { status: 'not_tested', error: null }
    };

    // Test Ollama
    if (ollamaUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${ollamaUrl}/api/version`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data: any = await response.json();
          results.ollama = { 
            status: 'available', 
            version: data.version || 'unknown',
            error: null,
            models: data.models?.map((m: any) => m.name) || []
          };
        } else {
          results.ollama = { status: 'unavailable', error: response.statusText };
        }
      } catch (error) {
        results.ollama = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Test OpenAI
    if (openaiApiKey) {
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 10000);
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openaiApiKey}` },
          signal: controller2.signal
        });
        clearTimeout(timeoutId2);
        results.openai = response.ok ? 
          { status: 'available', error: null } : 
          { status: 'unavailable', error: response.statusText };
      } catch (error) {
        results.openai = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Test Gemini
    if (geminiApiKey) {
      try {
        const controller3 = new AbortController();
        const timeoutId3 = setTimeout(() => controller3.abort(), 10000);
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: { 'x-goog-api-key': geminiApiKey },
          signal: controller3.signal
        });
        clearTimeout(timeoutId3);
        results.gemini = response.ok ? 
          { status: 'available', error: null } : 
          { status: 'unavailable', error: response.statusText };
      } catch (error) {
        results.gemini = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    res.json({
      success: true,
      results,
      testedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI providers test failed'
    });
  }
});

// Constitution: Test RAG configuration
router.post('/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await RAGService.healthCheck();
    
    res.json({
      success: results.healthy,
      message: results.healthy ? 'RAG system is operational' : 'RAG system has issues',
      details: results.details
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'System test failed'
    });
  }
});

export default router;

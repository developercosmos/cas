// Constitution: RAG Service with Unified AI Service
import { DatabaseService } from '../../services/DatabaseService.js';
import { aiService, ChatRequest, ChatResponse, EmbeddingRequest } from '../../services/AIService.js';
import { ragConfig } from './config/RAGConfig.js';
import { 
  RAGCollection, 
  RAGDocument, 
  RAGEmbedding, 
  RAGSession,
  RAGMessage,
  RAGSource,
  DocumentUploadRequest,
  ProcessingResult,
  SessionCreateRequest
} from './types.js';
import crypto from 'crypto';

export class RAGService {
  private static initialized: boolean = false;

  // Constitution: Initialize RAG service with unified AI service
  // Supports multilingual: English, Bahasa Indonesia, and more
  static async initialize(): Promise<void> {
    try {
      console.log('🧠 RAG Plugin: Initializing with unified AI service...');
      console.log('🌍 Multilingual support: English, Bahasa Indonesia');
      
      // Load AI configuration
      const config = await ragConfig.loadConfig();
      
      // Initialize AI service with fallback chain
      // Priority: Ollama (local) -> OpenAI (cloud) -> Gemini (backup)
      await aiService.initialize({
        ollama: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
          availableModels: []
        },
        openai: (config.openaiApiKey || process.env.OPENAI_API_KEY) ? {
          apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || ''
        } : undefined,
        gemini: process.env.GEMINI_API_KEY ? {
          apiKey: process.env.GEMINI_API_KEY
        } : undefined,
        preferences: {
          primaryProvider: 'ollama',
          fallbackChain: ['ollama', 'openai', 'gemini']
        }
      });

      this.initialized = true;
      console.log('✅ RAG Plugin: Initialized successfully with unified AI service');
      
      // Log available providers
      const stats = await aiService.getStatistics();
      console.log('🤖 Available AI providers:', stats.available);
      console.log('🔄 Fallback chain: Ollama -> OpenAI -> Gemini');
      
      if (stats.available.length === 0) {
        console.warn('⚠️ No AI providers available! Please configure at least one:');
        console.warn('   - Ollama: Ensure Docker container is running');
        console.warn('   - OpenAI: Set OPENAI_API_KEY environment variable');
        console.warn('   - Gemini: Set GEMINI_API_KEY environment variable');
      }
      
    } catch (error) {
      console.error('❌ RAG Plugin: Failed to initialize:', error);
      throw error;
    }
  }

  // Constitution: Check if service is initialized
  private static checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('RAG service not initialized. Call initialize() first.');
    }
  }

  // Constitution: Process document with unified AI service
  static async processDocument(request: DocumentUploadRequest): Promise<ProcessingResult> {
    this.checkInitialized();

    try {
      console.log(`📄 RAG Plugin: Processing document for collection ${request.collectionId}`);

      // Create document record
      const document = await DatabaseService.queryOne<RAGDocument>(
        `INSERT INTO plugin.rag_tx_documents 
         (CollectionId, Title, Content, Source, ContentType, ContentHash, Metadata, ProcessingStatus, CreatedAt, UpdatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, 'processing', NOW(), NOW())
         RETURNING Id, Title, Content, Source, CreatedAt, UpdatedAt`,
        [
          request.collectionId,
          request.title || 'Untitled Document',
          request.content,
          request.source,
          request.contentType,
          crypto.createHash('sha256').update(request.content).digest('hex'),
          JSON.stringify(request.metadata || {})
        ]
      );

      if (!document) {
        return { success: false, error: 'Failed to create document record' };
      }

      // Constitution: Split into chunks (same as before)
      const chunks = await this.chunkText(document.Content, {
        chunkSize: 1000,
        overlap: 200
      });

      console.log(`📝 RAG Plugin: Split into ${chunks.length} chunks`);

      // Constitution: Generate embeddings using unified AI service
      const embeddingsResponse = await aiService.generateEmbeddings({
        texts: chunks
      });

      // Constitution: Store embeddings in database
      for (let i = 0; i < embeddingsResponse.embeddings.length; i++) {
        await DatabaseService.execute(
          `INSERT INTO plugin.rag_tx_embeddings (DocumentId, ChunkIndex, Content, Embedding, Metadata, CreatedAt)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            document.Id,
            i,
            chunks[i],
            `[${embeddingsResponse.embeddings[i].join(',')}]`, // Store as PG vector format
            JSON.stringify({
              documentId: document.Id,
              title: document.Title,
              source: document.Source,
              chunkIndex: i,
              provider: embeddingsResponse.provider,
              model: embeddingsResponse.model,
              ...request.metadata
            })
          ]
        );
      }

      // Update document status to completed
      await DatabaseService.execute(
        'UPDATE plugin.rag_tx_documents SET ProcessingStatus = $1, UpdatedAt = NOW() WHERE Id = $2',
        ['completed', document.Id]
      );

      console.log(`✅ RAG Plugin: Document ${document.Id} processed successfully with ${embeddingsResponse.provider}`);

      return { 
        success: true, 
        documentId: document.Id, 
        chunks: chunks.length, 
        embeddings: embeddingsResponse.embeddings.length
      };

    } catch (error) {
      console.error('❌ RAG Plugin: Document processing failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Constitution: Generate response with retrieval-augmented context
  static async generateResponse(request: { sessionId: string; message: string }): Promise<ChatResponse> {
    this.checkInitialized();

    try {
      // Get session details
      const session = await DatabaseService.queryOne<RAGSession>(
        'SELECT * FROM plugin.rag_tx_sessions WHERE Id = $1 AND IsActive = true',
        [request.sessionId]
      );

      if (!session) {
        throw new Error('Session not found or inactive');
      }

      // Constitution: Retrieve relevant documents (using PostgreSQL vector similarity)
      const retrievedDocs = await this.retrieveDocuments(request.message, session.CollectionId, session.MaxRetrievalCount || 5);

      // Format context
      const context = retrievedDocs.map((doc, index) => 
        `Source ${index + 1}:\n${doc.content}`
      ).join('\n\n');

      // Constitution: Generate chat response using unified AI service
      const chatRequest: ChatRequest = {
        message: request.message,
        context: context,
        temperature: session.Temperature,
        model: session.Model || ''
      };

      const response = await aiService.generateChat(chatRequest);

      // Convert retrieved docs to RAGSource format
      const sources: RAGSource[] = retrievedDocs.map(doc => ({
        Id: doc.id,
        Title: doc.title,
        Content: doc.content,
        Score: doc.similarity,
        Metadata: doc.metadata
      }));

      // Store user message
      await this.storeMessage(session.Id, 'user', request.message);

      // Store assistant response
      await this.storeMessage(session.Id, 'assistant', response.content, sources, response.tokensUsed);

      console.log(`✅ RAG Plugin: Response generated using ${response.provider}`);

      const result: any = {
        response: response.content,
        content: response.content,
        sources,
        tokensUsed: response.tokensUsed || 0,
        model: response.model,
        provider: response.provider
      };
      
      return result;

    } catch (error) {
      console.error('❌ RAG Plugin: Response generation failed:', error);
      throw error;
    }
  }

  // Constitution: Retrieve documents with vector similarity (PostgreSQL)
  private static async retrieveDocuments(query: string, collectionId: string, limit: number): Promise<any[]> {
    try {
      // First, get query embedding
      const embeddingsResponse = await aiService.generateEmbeddings({
        texts: [query]
      });

      const embeddingVector = `[${embeddingsResponse.embeddings[0].join(',')}]`;
      
      // Use PostgreSQL vector similarity search (cosine distance)
      const results = await DatabaseService.query(`
        SELECT 
          e.Id,
          d.Title,
          e.Content,
          e.ChunkIndex,
          e.Metadata,
          1 - (e.Embedding <=> $1::vector) as similarity,
          d.Source,
          d.ContentType
        FROM plugin.rag_tx_embeddings e
        JOIN plugin.rag_tx_documents d ON e.DocumentId = d.Id
        WHERE d.CollectionId = $2 AND d.ProcessingStatus = 'completed'
        ORDER BY e.Embedding <=> $1::vector
        LIMIT $3
      `, [embeddingVector, collectionId, limit]);

      return results.map((row: any) => ({
        id: row.Id,
        title: row.Title || 'Untitled',
        content: row.Content || '',
        similarity: parseFloat(row.similarity) || 0,
        source: row.Source || '',
        contentType: row.ContentType || 'text/plain',
        metadata: typeof row.Metadata === 'string' ? JSON.parse(row.Metadata) : row.Metadata
      }));
    } catch (error) {
      console.error('❌ Document retrieval failed:', error);
      return [];
    }
  }

  // Constitution: Store chat message
  private static async storeMessage(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    sources?: RAGSource[],
    tokensUsed?: number
  ): Promise<void> {
    await DatabaseService.execute(
      `INSERT INTO plugin.rag_tx_messages 
       (SessionId, Role, Content, Sources, TokensUsed, Model, CreatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        sessionId,
        role,
        content,
        sources ? JSON.stringify(sources) : null,
        tokensUsed,
        'unified-ai-service'
      ]
    );
  }

  // Constitution: Split text into chunks (same as original)
  private static async chunkText(text: string, options: { chunkSize: number; overlap: number }): Promise<string[]> {
    const { chunkSize, overlap } = options;
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.substring(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  // Constitution: Keep existing methods for collections, sessions, etc.
  static async getCollections(userId: string): Promise<RAGCollection[]> {
    return await DatabaseService.query<RAGCollection>(
      'SELECT * FROM plugin.rag_md_collections ORDER BY CreatedAt DESC'
    );
  }

  static async createCollection(userId: string, request: any): Promise<{ success: boolean; collectionId?: string; error?: string }> {
    try {
      const collection = await DatabaseService.queryOne<RAGCollection>(
        `INSERT INTO plugin.rag_md_collections 
         (Name, Description, EmbeddingModel, ChunkSize, ChunkOverlap, MaxRetrievalCount, CreatedAt, UpdatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING Id, Name, Description, CreatedAt, UpdatedAt`,
        [
          request.name,
          request.description,
          request.embeddingModel || 'text-embedding-3-small',
          request.chunkSize || 1000,
          request.chunkOverlap || 200,
          request.maxRetrievalCount || 5
        ]
      );

      if (collection) {
        return { success: true, collectionId: collection.Id };
      } else {
        return { success: false, error: 'Failed to create collection' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getDocuments(collectionId: string): Promise<RAGDocument[]> {
    return await DatabaseService.query<RAGDocument>(
      'SELECT * FROM plugin.rag_tx_documents WHERE CollectionId = $1 ORDER BY CreatedAt DESC',
      [collectionId]
    );
  }

  static async createSession(userId: string, request: any): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const session = await DatabaseService.queryOne<RAGSession>(
        `INSERT INTO plugin.rag_tx_sessions 
         (CollectionId, UserId, Title, ContextWindow, Temperature, Model, MaxRetrievalCount, IsActive, CreatedAt, UpdatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING Id, Title, Model, CreatedAt`,
        [
          request.collectionId,
          userId,
          request.title || 'New Chat Session',
          request.contextWindow || 4000,
          request.temperature || 0.7,
          request.model || 'auto',
          request.maxRetrievalCount || 5,
          true
        ]
      );

      if (session) {
        return { success: true, sessionId: session.Id };
      } else {
        return { success: false, error: 'Failed to create session' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getChatHistory(sessionId: string): Promise<RAGMessage[]> {
    return await DatabaseService.query<RAGMessage>(
      'SELECT * FROM plugin.rag_tx_messages WHERE SessionId = $1 ORDER BY CreatedAt ASC',
      [sessionId]
    );
  }

  static async getStatistics(): Promise<any> {
    const stats = await DatabaseService.queryOne(
      `SELECT 
         (SELECT COUNT(*) FROM plugin.rag_md_collections) as totalCollections,
         (SELECT COUNT(*) FROM plugin.rag_tx_documents WHERE ProcessingStatus = 'completed') as totalDocuments,
         (SELECT COUNT(*) FROM plugin.rag_tx_sessions) as totalSessions,
         (SELECT COUNT(*) FROM plugin.rag_tx_messages) as totalMessages`
    );

    const aiStats = await aiService.getStatistics();

    return {
      ...stats || {
        totalCollections: 0,
        totalDocuments: 0,
        totalSessions: 0,
        totalMessages: 0
      },
      aiService: {
        available: aiStats.available,
        providers: aiStats.providers,
        models: await aiService.getModels()
      }
    };
  }

  // Constitution: AI service health check
  static async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const ragStats = await this.getStatistics();
      const aiHealth = await aiService.healthCheck();
      
      return {
        healthy: aiHealth.healthy && ragStats.totalCollections >= 0,
        details: {
          ragStats,
          aiHealth,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

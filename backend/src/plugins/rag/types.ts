// Constitution: TypeScript interfaces for RAG plugin

export interface RAGConfig {
  openaiApiKey: string;
  embeddingModel: 'text-embedding-3-small' | 'text-embedding-3-large';
  chatModel: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxChunkSize: number;
  chunkOverlap: number;
  contextWindow: number;
  temperature: number;
  retrievalCount: number;
}

export interface RAGCollection {
  Id: string;
  Name: string;
  Description?: string;
  EmbeddingModel: string;
  ChunkSize: number;
  ChunkOverlap: number;
  MaxRetrievalCount: number;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface RAGDocument {
  Id: string;
  CollectionId: string;
  Title?: string;
  Content: string;
  Source?: string;
  ContentType?: string;
  ContentHash?: string;
  Metadata?: Record<string, any>;
  ProcessingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ErrorMessage?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface RAGEmbedding {
  Id: string;
  DocumentId: string;
  ChunkIndex: number;
  Content: string;
  Embedding: number[]; // Vector representation
  Metadata?: Record<string, any>;
  CreatedAt: Date;
}

export interface RAGSession {
  Id: string;
  CollectionId: string;
  UserId: string;
  Title?: string;
  ContextWindow: number;
  Temperature: number;
  Model: string;
  MaxRetrievalCount: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface RAGMessage {
  Id: string;
  SessionId: string;
  Role: 'user' | 'assistant';
  Content: string;
  Sources?: RAGSource[];
  TokensUsed?: number;
  Model?: string;
  CreatedAt: Date;
}

export interface RAGSource {
  Id: string;
  Title?: string;
  Content: string;
  Score: number;
  Metadata?: Record<string, any>;
}

export interface DocumentUploadRequest {
  collectionId: string;
  title?: string;
  content: string;
  source?: string;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  collectionId?: string;
}

export interface ChatResponse {
  response: string;
  content?: string; // Alias for response
  sources: RAGSource[];
  tokensUsed: number;
  model: string;
  provider?: string;
}

export interface ProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
  chunks?: number;
  embeddings?: number;
}

export interface RetrievalResult {
  sources: RAGSource[];
  totalFound: number;
  query: string;
}

export interface CollectionCreateRequest {
  name: string;
  description?: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  maxRetrievalCount?: number;
}

export interface SessionCreateRequest {
  collectionId: string;
  title?: string;
  contextWindow?: number;
  temperature?: number;
  model?: string;
  maxRetrievalCount?: number;
}

// Plugin metadata following CAS plugin standards
export interface RAGPluginConfig {
  pluginId: string;
  isOpenAIConfigured: boolean;
  defaultModel: string;
  defaultEmbeddingModel: string;
  statistics: {
    totalDocuments: number;
    totalCollections: number;
    totalSessions: number;
    totalMessages: number;
  };
}

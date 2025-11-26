-- RAG Plugin Database Schema
-- Constitution: Follow CAS naming conventions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG Document Collections (Master Data)
CREATE TABLE IF NOT EXISTS plugin.rag_md_collections (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    EmbeddingModel VARCHAR(100) DEFAULT 'text-embedding-3-small',
    ChunkSize INTEGER DEFAULT 1000,
    ChunkOverlap INTEGER DEFAULT 200,
    MaxRetrievalCount INTEGER DEFAULT 5,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RAG Documents (Transaction Data)
CREATE TABLE IF NOT EXISTS plugin.rag_tx_documents (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    CollectionId UUID NOT NULL REFERENCES plugin.rag_md_collections(Id) ON DELETE CASCADE,
    Title VARCHAR(500),
    Content TEXT NOT NULL,
    Source VARCHAR(500),
    ContentType VARCHAR(100),
    ContentHash VARCHAR(64),
    Metadata JSONB,
    ProcessingStatus VARCHAR(20) DEFAULT 'pending' CHECK (ProcessingStatus IN ('pending', 'processing', 'completed', 'failed')),
    ErrorMessage TEXT,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RAG Embeddings (Transaction Data)
CREATE TABLE IF NOT EXISTS plugin.rag_tx_embeddings (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    DocumentId UUID NOT NULL REFERENCES plugin.rag_tx_documents(Id) ON DELETE CASCADE,
    ChunkIndex INTEGER NOT NULL,
    Content TEXT NOT NULL,
    Embedding VECTOR(1536), -- OpenAI embedding dimensions
    Metadata JSONB,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RAG Chat Sessions (Transaction Data)
CREATE TABLE IF NOT EXISTS plugin.rag_tx_sessions (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    CollectionId UUID NOT NULL REFERENCES plugin.rag_md_collections(Id) ON DELETE CASCADE,
    UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
    Title VARCHAR(255),
    ContextWindow INTEGER DEFAULT 4000,
    Temperature DECIMAL(3,2) DEFAULT 0.7,
    Model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RAG Chat Messages (Transaction Data)
CREATE TABLE IF NOT EXISTS plugin.rag_tx_messages (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    SessionId UUID NOT NULL REFERENCES plugin.rag_tx_sessions(Id) ON DELETE CASCADE,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('user', 'assistant')),
    Content TEXT NOT NULL,
    Sources JSONB, -- Retrieved documents as JSON
    TokensUsed INTEGER,
    Model VARCHAR(100),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_rag_documents_collection_id ON plugin.rag_tx_documents(CollectionId);
CREATE INDEX IF NOT EXISTS idx_rag_documents_processing_status ON plugin.rag_tx_documents(ProcessingStatus);
CREATE INDEX IF NOT EXISTS idx_rag_documents_content_hash ON plugin.rag_tx_documents(ContentHash);
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_document_id ON plugin.rag_tx_embeddings(DocumentId);
-- Create vector index for similarity search (requires pgvector extension)
-- Note: Using hnsw for better performance, fallback to basic index if not available
DO $$
BEGIN
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_rag_embeddings_embedding 
        ON plugin.rag_tx_embeddings USING hnsw (Embedding vector_cosine_ops);
    EXCEPTION WHEN undefined_object THEN
        -- Fallback to basic GIN index if HNSW not available
        CREATE INDEX IF NOT EXISTS idx_rag_embeddings_embedding 
        ON plugin.rag_tx_embeddings (Embedding);
    END;
END $$;
CREATE INDEX IF NOT EXISTS idx_rag_sessions_collection_id ON plugin.rag_tx_sessions(CollectionId);
CREATE INDEX IF NOT EXISTS idx_rag_sessions_user_id ON plugin.rag_tx_sessions(UserId);
CREATE INDEX IF NOT EXISTS idx_rag_sessions_active ON plugin.rag_tx_sessions(IsActive);
CREATE INDEX IF NOT EXISTS idx_rag_messages_session_id ON plugin.rag_tx_messages(SessionId);
CREATE INDEX IF NOT EXISTS idx_rag_messages_created_at ON plugin.rag_tx_messages(CreatedAt);

-- Unique constraints  
CREATE UNIQUE INDEX IF NOT EXISTS uc_rag_collections_name ON plugin.rag_md_collections(Name);

-- Insert default collection if none exists
INSERT INTO plugin.rag_md_collections (Name, Description, CreatedAt, UpdatedAt)
SELECT 'Default Collection', 'Default RAG document collection', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM plugin.rag_md_collections);

-- Comments for documentation
COMMENT ON TABLE plugin.rag_md_collections IS 'RAG document collections for organizing documents';
COMMENT ON TABLE plugin.rag_tx_documents IS 'RAG documents with processing status and metadata';
COMMENT ON TABLE plugin.rag_tx_embeddings IS 'RAG embeddings stored as vectors for similarity search';
COMMENT ON TABLE plugin.rag_tx_sessions IS 'RAG chat sessions for maintaining conversation context';
COMMENT ON TABLE plugin.rag_tx_messages IS 'RAG chat messages with sources and token usage';

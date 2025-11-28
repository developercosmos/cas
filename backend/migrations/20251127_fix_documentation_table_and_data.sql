-- Constitution: Fix documentation table name and populate with data
-- Version: 1.0.0
-- Created: 2025-11-27

-- First, check if old table exists and migrate to correct name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin_md_documentation') THEN
        -- Table already exists with correct name
        RAISE NOTICE 'Documentation table already exists with correct name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin_md_documentation') THEN
        -- Rename table with typo to correct name
        ALTER TABLE plugin.plugin_md_documentation RENAME TO plugin.plugin_md_documentation;
        RAISE NOTICE 'Renamed documentation table to correct name';
    ELSE
        -- Create new table with correct name
        CREATE TABLE IF NOT EXISTS plugin.plugin_md_documentation (
            Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
            DocumentType VARCHAR(50) NOT NULL CHECK (DocumentType IN ('readme', 'api', 'user_guide', 'installation', 'troubleshooting', 'changelog', 'examples')),
            Title VARCHAR(255) NOT NULL,
            Content TEXT NOT NULL,
            ContentFormat VARCHAR(20) DEFAULT 'markdown' CHECK (ContentFormat IN ('markdown', 'html', 'plain')),
            Language VARCHAR(10) DEFAULT 'en',
            Version VARCHAR(50),
            IsCurrent BOOLEAN DEFAULT FALSE,
            OrderIndex INTEGER DEFAULT 0,
            Metadata JSONB DEFAULT '{}',
            CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(PluginId, DocumentType, Language, Version)
        );
        RAISE NOTICE 'Created new documentation table';
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plugin_documentation_plugin_id ON plugin.plugin_md_documentation(PluginId);
CREATE INDEX IF NOT EXISTS idx_plugin_documentation_type ON plugin.plugin_md_documentation(DocumentType);
CREATE INDEX IF NOT EXISTS idx_plugin_documentation_language ON plugin.plugin_md_documentation(Language);
CREATE INDEX IF NOT EXISTS idx_plugin_documentation_current ON plugin.plugin_md_documentation(PluginId, DocumentType, IsCurrent);
CREATE INDEX IF NOT EXISTS idx_plugin_documentation_order ON plugin.plugin_md_documentation(PluginId, OrderIndex);

-- Function to set current documentation version
CREATE OR REPLACE FUNCTION plugin.set_current_documentation(
    p_plugin_id UUID,
    p_document_type VARCHAR(50),
    p_language VARCHAR(10) DEFAULT 'en'
)
RETURNS VOID AS $$
BEGIN
    -- Update all documentation of this type and language to not current
    UPDATE plugin.plugin_md_documentation 
    SET IsCurrent = FALSE 
    WHERE PluginId = p_plugin_id 
    AND DocumentType = p_document_type 
    AND Language = p_language;
    
    -- Set the highest version as current
    UPDATE plugin.plugin_md_documentation 
    SET IsCurrent = TRUE 
    WHERE Id = (
        SELECT Id FROM plugin.plugin_md_documentation 
        WHERE PluginId = p_plugin_id 
        AND DocumentType = p_document_type 
        AND Language = p_language
        ORDER BY 
            CASE WHEN Version ~ '^[0-9]+\.[0-9]+\.[0-9]+$' THEN Version
            ELSE '0.0.0'
        END DESC,
        UpdatedAt DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Populate documentation data for plugins
INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata) VALUES
-- RAG Plugin README
((SELECT Id FROM plugin.plugin_configurations WHERE PluginId = 'rag-retrieval'), 'readme', 'RAG Document Intelligence', 
'# RAG Document Intelligence

## Overview

RAG (Retrieval-Augmented Generation) plugin for CAS platform provides intelligent document analysis and chat capabilities with multilingual support.

## 🌍 Multilingual Support

The RAG plugin supports multiple languages:
- **English** (default)
- **Bahasa Indonesia** - Full Indonesian language support
- **And more** - Extensible to additional languages

## 🚀 Key Features

### Document Processing
- **Intelligent Chunking**: Smart document segmentation with overlapping context
- **Multi-format Support**: PDF, Word, HTML, Markdown, and more
- **Context Preservation**: Maintains document relationships across chunks
- **Metadata Extraction**: Automatic title, author, and content extraction

### Vector Search
- **Semantic Search**: Find documents based on meaning, not just keywords
- **Hybrid Search**: Combine vector search with keyword matching
- **Relevance Scoring**: Rank results by semantic similarity
- **Fast Retrieval**: Optimized vector database operations

### AI Integration
- **Multi-provider Support**: OpenAI, Gemini, Ollama (local)
- **Fallback Chain**: Automatic failover between AI providers
- **Cost Optimization**: Use local providers when possible
- **Quality Control**: Select appropriate models per task

### Chat Interface
- **Context-aware Conversations**: Remembers previous interactions
- **Document-grounded Responses**: Answers based on uploaded documents
- **Citation Support**: Shows source documents for answers
- **Session Management**: Organize conversations by topic

## 🔧 Configuration

### AI Providers
1. **OpenAI**: GPT models with API key authentication
2. **Gemini**: Google AI with API key setup
3. **Ollama**: Local models with endpoint configuration

### Processing Settings
- **Chunk Size**: Control document segmentation (100-10,000 tokens)
- **Chunk Overlap**: Maintain context between segments (0-500 tokens)
- **Context Window**: Maximum conversation memory (1,000-128,000 tokens)
- **Temperature**: Control response creativity (0.0-2.0)
- **Retrieval Count**: Number of documents to reference (1-20)

### Fallback Chain
Configure automatic failover:
1. **Primary Provider**: First choice for AI operations
2. **Fallback Options**: Backup providers if primary fails
3. **Retry Logic**: Automatic recovery attempts

## 📚 Usage Examples

### Document Upload
```javascript
const uploadResult = await fetch('/api/plugins/rag/documents', {
  method: 'POST',
  body: formData,
  headers: { 'Authorization': 'Bearer token' }
});
```

### Chat with Documents
```javascript
const chatResponse = await fetch('/api/plugins/rag/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "What are the key points in these documents?",
    collectionId: "collection-uuid",
    sessionId: "session-uuid"
  })
});
```

### Semantic Search
```javascript
const searchResults = await fetch('/api/plugins/rag/search', {
  method: 'POST',
  body: JSON.stringify({
    query: "important concepts and definitions",
    collectionId: "collection-uuid",
    topK: 10
  })
});
```

## 🌐 Internationalization

The plugin supports full internationalization:
- **Indonesian UI**: Complete interface translation
- **Localized Responses**: AI responses in user''s preferred language
- **Cultural Context**: Understands local terminology and references
- **Regional Compliance**: Meets local data processing standards

## 🔍 Search Capabilities

### Advanced Search Features
- **Multi-language Search**: Search in document original language
- **Cross-language Retrieval**: Find content across different languages
- **Contextual Understanding**: Recognize domain-specific terminology
- **Fuzzy Matching**: Handle typos and variations

### Search Optimization
- **Vector Indexing**: Fast semantic search capabilities
- **Metadata Filtering**: Search by document type, date, author
- **Result Ranking**: Intelligent relevance scoring
- **Performance Monitoring**: Track search speed and accuracy

## 🎯 Use Cases

### Academic Research
- **Literature Review**: Search across research papers
- **Citation Management**: Track sources and references
- **Knowledge Synthesis**: Combine insights from multiple documents
- **Study Assistance**: Generate summaries and explanations

### Business Intelligence
- **Document Analysis**: Extract insights from reports and presentations
- **Market Research**: Analyze competitive intelligence documents
- **Compliance Review**: Check documents against regulations
- **Decision Support**: Provide evidence-based recommendations

### Content Creation
- **Research Assistant**: Gather information for writing projects
- **Fact Checking**: Verify claims against source documents
- **Content Planning**: Organize information structure
- **Translation Aid**: Cross-reference information across languages

## 🔒 Security & Privacy

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: User-based permission management
- **Audit Trail**: Complete logging of all operations
- **Data Isolation**: Strict separation between user data

### Compliance Features
- **GDPR Ready**: Meets European data protection standards
- **Data Retention**: Configurable data lifecycle management
- **Privacy Controls**: User control over data usage
- **Secure Processing**: No data leakage to third parties

## 🚀 Getting Started

1. **Install Plugin**: Enable RAG plugin in Plugin Manager
2. **Configure AI**: Set up at least one AI provider
3. **Upload Documents**: Add files to collections
4. **Test Chat**: Start conversations with your documents
5. **Fine-tune**: Adjust settings for optimal performance

## 📞 Support

- **Documentation**: Click "📚 Docs" button for detailed API reference
- **Troubleshooting**: Check configuration and provider status
- **Performance**: Monitor usage statistics and optimize settings
- **Community**: Join discussions for tips and best practices

---

*RAG Plugin v1.0.0 - Your intelligent document companion*', 'markdown', 'en', '1.0.0', TRUE, 1, '{"language": "en", "version": "1.0.0", "features": ["multilingual", "vector-search", "ai-integration", "chat-interface"]}'),

-- RAG Plugin API
((SELECT Id FROM plugin.plugin_configurations WHERE PluginId = 'rag-retrieval'), 'api', 'RAG API Reference', 
'# RAG API Reference

## Base URL
```
/api/plugins/rag
```

## Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description | Required Fields |
|----------|--------|-------------|------------------|
| `/api/plugins/rag/collections` | GET | List all collections | None |
| `/api/plugins/rag/collections` | POST | Create collection | name, description |
| `/api/plugins/rag/collections/{id}` | DELETE | Delete collection | None |
| `/api/plugins/rag/documents` | POST | Upload document | file, collectionId |
| `/api/plugins/rag/documents` | GET | List documents | collectionId? |
| `/api/plugins/rag/documents/{id}` | GET | Get document details | None |
| `/api/plugins/rag/documents/{id}` | DELETE | Delete document | None |
| `/api/plugins/rag/chat` | POST | Chat with documents | message, collectionId |
| `/api/plugins/rag/search` | POST | Semantic search | query, collectionId |
| `/api/plugins/rag/sessions` | POST | Create chat session | collectionId |
| `/api/plugins/rag/sessions/{id}/messages` | GET | Get session history | None |
| `/api/plugins/rag/status` | GET | Plugin status | None |
| `/api/plugins/rag/ai/status` | GET | AI provider status | None |
| `/api/plugins/rag/ai/test` | POST | Test AI provider | provider, testMessage |

### Chat with Documents

**Request:**
```json
POST /api/plugins/rag/chat
{
  "message": "What are the key points in these documents?",
  "collectionId": "collection-uuid",
  "sessionId": "session-uuid",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the documents, the key points are...",
    "sources": [
      {
        "documentId": "doc-uuid",
        "documentTitle": "Document Title",
        "chunkContent": "Relevant snippet...",
        "similarity": 0.95
      }
    ]
  }
}
```

### Document Upload

**Request:**
```
POST /api/plugins/rag/documents
Content-Type: multipart/form-data
file: <document-file>
collectionId: collection-uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "title": "Document Title",
    "processed": true,
    "chunkCount": 25
  }
}
```

## Error Codes

| Status | Meaning | Cause |
|--------|---------|-------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Invalid ID |
| 413 | Payload Too Large | File > 50MB |
| 500 | Internal Error | Server failure |

## Supported Formats

| Format | Extensions | Notes |
|--------|------------|-------|
| Text | `.txt`, `.md` | Direct extraction |
| PDF | `.pdf` | Page detection |
| Word | `.docx` | Metadata extraction |
| HTML | `.html` | Clean extraction |
| CSV | `.csv` | Table data |

## Rate Limits

- **File Upload**: 10 files/minute
- **Chat**: 30 requests/minute  
- **Search**: 100 requests/minute

## Quick Test

```bash
# Test status
curl -X GET "http://localhost:4000/api/plugins/rag/status"

# Test chat
curl -X POST "http://localhost:4000/api/plugins/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","collectionId":"test"}'
```

---

*Last updated: November 27, 2025*
*API version: v1.0.0*', 'markdown', 'en', '1.0.0', TRUE, 2, '{"language": "en", "version": "1.0.0", "endpoints": 15, "features": ["rest-api", "chat", "search", "upload"]}'),

-- LDAP Plugin README
((SELECT Id FROM plugin.plugin_configurations WHERE PluginId = 'ldap-auth'), 'readme', 'LDAP Authentication Plugin', 
'# LDAP Authentication Plugin

## Overview

Secure directory-based authentication system for CAS platform with comprehensive user management and group synchronization.

## Features

### Directory Integration
- **Multiple Directory Services**: Active Directory, OpenLDAP, Apache Directory
- **Secure Authentication**: LDAP/SSL/TLS support
- **User Synchronization**: Automatic user import and updates
- **Group Management**: LDAP group mapping and permissions

### User Management
- **Automatic User Creation**: Import users from directory
- **Profile Synchronization**: Keep user data up-to-date
- **Password Integration**: LDAP-based authentication
- **Account Management**: Enable/disable user accounts

### Security Features
- **Encrypted Connections**: Secure LDAP/SSL communication
- **Access Control**: Role-based permissions
- **Session Management**: Secure user sessions
- **Audit Logging**: Complete access tracking

## Configuration

### Required Settings
- **Server URL**: LDAP directory server address
- **Port**: LDAP service port (default: 389)
- **Base DN**: Directory base for user searches
- **Bind DN**: Service account for directory access
- **Bind Password**: Authentication credentials

### Optional Settings
- **User Search Base**: Specific OU for user searches
- **Search Filter**: LDAP filter for finding users
- **Username Attribute**: LDAP attribute containing username
- **Email Attribute**: LDAP attribute containing email address
- **Display Name Attribute**: LDAP attribute for user display
- **Group Attribute**: LDAP attribute for group membership

## API Reference

### Authentication
```
POST /api/auth/ldap
{
  "username": "user@example.com",
  "password": "password"
}
```

### User Management
```
GET /api/ldap/users
POST /api/ldap/users/{id}/sync
DELETE /api/ldap/users/{id}
```

### Configuration
```
GET /api/ldap/config
POST /api/ldap/config
```

## Error Handling

### Common Issues
- **Connection Failed**: Check server URL and port
- **Authentication Failed**: Verify bind DN and password
- **Search Failed**: Check base DN and search filters
- **Sync Failed**: Verify user permissions

### Troubleshooting
1. **Network Access**: Ensure LDAP port is accessible
2. **SSL Certificate**: Valid certificate for LDAPS
3. **Service Account**: Proper bind credentials
4. **Permissions**: Read access to user directory

## Quick Setup

1. **Install Plugin**: Enable LDAP plugin in Plugin Manager
2. **Configure Directory**: Enter LDAP server details
3. **Test Connection**: Verify directory access
4. **Import Users**: Sync LDAP users to CAS
5. **Set Permissions**: Configure user roles and access

## Support

- **Documentation**: Click "📚 Docs" button for detailed guide
- **Configuration**: Use built-in configuration form
- **User Manager**: Import and manage LDAP users
- **Tree Browser**: Navigate directory structure

---

*LDAP Authentication Plugin v1.0.0*', 'markdown', 'en', '1.0.0', TRUE, 1, '{"language": "en", "version": "1.0.0", "protocols": ["ldap", "ldaps"], "features": ["authentication", "user-sync", "group-management"]}')

-- Set all documentation as current
ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

-- Update created timestamps
UPDATE plugin.plugin_md_documentation 
SET CreatedAt = NOW(), UpdatedAt = NOW() 
WHERE CreatedAt IS NULL OR UpdatedAt IS NULL;

COMMIT;

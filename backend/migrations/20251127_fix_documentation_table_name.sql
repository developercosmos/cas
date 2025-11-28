-- Constitution: Fix documentation table name typo and ensure data integrity
-- Version: 1.0.0
-- Created: 2025-11-27

-- Check if table with typo exists and rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin_md_documentation') THEN
        -- Table with correct name already exists
        RAISE NOTICE 'Documentation table already exists with correct name';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin_md_documentation') THEN
        -- Rename table with typo to correct name
        ALTER TABLE plugin.plugin_md_documentation RENAME TO plugin.plugin_md_documentation;
        RAISE NOTICE 'Renamed documentation table to correct name';
        
        -- Ensure indexes exist with correct name
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_plugin_id ON plugin.plugin_md_documentation(PluginId);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_type ON plugin.plugin_md_documentation(DocumentType);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_language ON plugin.plugin_md_documentation(Language);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_current ON plugin.plugin_md_documentation(PluginId, DocumentType, IsCurrent);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_order ON plugin.plugin_md_documentation(PluginId, OrderIndex);
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
        
        RAISE NOTICE 'Created new documentation table';
    END IF;
END $$;

-- Check if data exists and populate if empty
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin.plugin_md_documentation') THEN
        IF NOT EXISTS (SELECT 1 FROM plugin.plugin_md_documentation LIMIT 1) THEN
            -- Insert initial documentation data
            INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata)
            SELECT 
                pc.Id,
                'readme',
                CASE 
                    WHEN pc.PluginId = 'rag-retrieval' THEN 'RAG Document Intelligence'
                    WHEN pc.PluginId = 'ldap-auth' THEN 'LDAP Authentication Plugin'
                    WHEN pc.PluginId = 'core.text-block' THEN 'Text Block Plugin'
                    ELSE 'Plugin Documentation'
                END,
                CASE 
                    WHEN pc.PluginId = 'rag-retrieval' THEN 
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
- **Context Window**: Maximum AI conversation context
- **Temperature**: Response creativity control
- **Retrieval Count**: Number of relevant documents to fetch

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

*RAG Plugin v1.0.0 - Your intelligent document companion*'
                    WHEN pc.PluginId = 'ldap-auth' THEN 
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

*LDAP Authentication Plugin v1.0.0*'
                    WHEN pc.PluginId = 'core.text-block' THEN 
'# Text Block Plugin

## Overview

Simple text block component for the CAS platform, providing content blocks for various use cases.

## Features

- **Rich Text Editing**: Markdown and plain text support
- **Block Management**: Organize content in structured blocks
- **Version Control**: Track changes and maintain history
- **Export Options**: Multiple output formats
- **Integration**: Works with other CAS components

## Usage

### Creating Text Blocks
```javascript
const block = {
  title: "My Content Block",
  content: "This is the block content",
  type: "text"
};
```

### Managing Blocks
- **Create**: Add new text blocks
- **Edit**: Modify existing content
- **Delete**: Remove unwanted blocks
- **Export**: Download in various formats

## Configuration

- **Default Format**: Choose between markdown and plain text
- **Auto-save**: Automatic content saving
- **History**: Maintain version history
- **Permissions**: Control access levels

## API Reference

### Block Operations
```
GET /api/blocks
POST /api/blocks
PUT /api/blocks/{id}
DELETE /api/blocks/{id}
```

### Content Management
```
POST /api/blocks/{id}/content
GET /api/blocks/{id}/history
```

## Support

- **Documentation**: Click "📚 Docs" button for detailed guide
- **Configuration**: Simple settings interface
- **Integration**: Works with other plugins

---

*Text Block Plugin v1.0.0*'
                    ELSE '# Plugin Documentation

This plugin provides comprehensive documentation management capabilities for the CAS platform.

## Features

- **Markdown Support**: Rich documentation formatting
- **Version Control**: Track documentation changes
- **Multi-language**: Support for international content
- **Search Integration**: Full-text search capabilities
- **API Access**: RESTful documentation endpoints

## Configuration

- **Default Format**: Set preferred documentation format
- **Language Support**: Multiple language options
- **Version Tracking**: Maintain history
- **Export Options**: Various output formats

## Usage

Create and manage documentation through the PluginManager interface.

---

*Documentation Plugin v1.0.0*'
                END,
                'markdown',
                'en',
                '1.0.0',
                TRUE,
                1,
                '{"language": "en", "version": "1.0.0", "features": ["markdown", "version-control", "search"]}'
            FROM plugin.plugin_configurations pc
            WHERE pc.PluginId IN ('rag-retrieval', 'ldap-auth', 'core.text-block');
            
            RAISE NOTICE 'Populated documentation table with initial data';
        END IF;
    END IF;
END $$;

-- Update any existing documentation to set current flag properly
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'plugin' AND table_name = 'plugin.plugin_md_documentation') THEN
        -- Set first version as current for each plugin and type
        UPDATE plugin.plugin_md_documentation 
        SET IsCurrent = TRUE 
        WHERE Id IN (
            SELECT DISTINCT ON (PluginId, DocumentType, Language) Id
            FROM plugin.plugin_md_documentation 
            ORDER BY CreatedAt ASC, Id ASC
        );
    END IF;
END $$;

COMMIT;

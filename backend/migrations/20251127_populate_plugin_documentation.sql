-- Populate plugin documentation with existing plugin docs
-- Constitution: Move all hardcoded documentation to database

-- Text Block Plugin Documentation
INSERT INTO plugin.plugin_md_documentation (Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, IsCurrent, OrderIndex)
SELECT 
    uuid_generate_v4(),
    pc.Id,
    'readme',
    'Text Block Plugin',
    $content$# Text Block Plugin

## Description
A simple text block plugin that allows users to create and edit text content on their dashboard.

## Version
1.0.0

## Author
System

## Status
Active

## Features
- Rich text editing
- Real-time preview
- Customizable formatting options
- Persistent storage

## Installation
This plugin is managed through the CAS plugin system and is automatically available.

## Usage
1. Click "Add Block" on your dashboard
2. Select "Text Block" from the available blocks
3. Start typing your content
4. Use the formatting toolbar to style your text
5. Click "Save" to persist your changes

## Configuration
The text block plugin supports the following configuration options:
- Font size
- Text alignment
- Background color
- Border style

## Support
For support and documentation updates, contact the plugin administrator.

## Changelog
### v1.0.0
- Initial release
- Basic text editing functionality
- Formatting toolbar
- Save/load capabilities$content$,
    'markdown',
    'en',
    TRUE,
    0
FROM plugin.plugin_configurations pc 
WHERE pc.PluginId = 'text-block'
AND NOT EXISTS (
    SELECT 1 FROM plugin.plugin_md_documentation pd 
    WHERE pd.PluginId = pc.Id 
    AND pd.DocumentType = 'readme'
    AND pd.Language = 'en'
) ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

-- Text Block API Documentation
INSERT INTO plugin.plugin_md_documentation (Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, IsCurrent, OrderIndex)
SELECT 
    uuid_generate_v4(),
    pc.Id,
    'api',
    'Text Block API Documentation',
    $content$# Text Block API Documentation

## Overview
The Text Block plugin provides REST API endpoints for managing text content.

## Base URL
```
/api/plugins/text-block
```

## Authentication
All API endpoints require authentication via JWT token.

## Endpoints

### Create Text Block
```
POST /api/plugins/text-block/blocks
```

**Request Body:**
```json
{
  "content": "Your text content",
  "formatting": {
    "fontSize": "14px",
    "align": "left",
    "backgroundColor": "#ffffff"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "block-uuid",
    "content": "Your text content",
    "createdAt": "2025-11-27T10:00:00Z"
  }
}
```

### Get Text Block
```
GET /api/plugins/text-block/blocks/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "block-uuid",
    "content": "Your text content",
    "formatting": {...},
    "createdAt": "2025-11-27T10:00:00Z",
    "updatedAt": "2025-11-27T10:00:00Z"
  }
}
```

### Update Text Block
```
PUT /api/plugins/text-block/blocks/{id}
```

**Request Body:** Same as Create

### Delete Text Block
```
DELETE /api/plugins/text-block/blocks/{id}
```

**Response:**
```json
{
  "success": true
}
```

## Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid token
- `404`: Not Found - Block does not exist
- `500`: Internal Server Error$content$,
    'markdown',
    'en',
    TRUE,
    1
FROM plugin.plugin_configurations pc 
WHERE pc.PluginId = 'text-block'
AND NOT EXISTS (
    SELECT 1 FROM plugin.plugin_md_documentation pd 
    WHERE pd.PluginId = pc.Id 
    AND pd.DocumentType = 'api'
    AND pd.Language = 'en'
) ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

-- LDAP Authentication Plugin Documentation
INSERT INTO plugin.plugin_md_documentation (Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, IsCurrent, OrderIndex)
SELECT 
    uuid_generate_v4(),
    pc.Id,
    'readme',
    'LDAP Authentication Plugin',
    $content$# LDAP Authentication Plugin

## Description
Enterprise-grade LDAP directory authentication plugin that allows users to login using their Active Directory credentials.

## Version
1.0.0

## Author
System

## Status
Active

## Features
- Active Directory integration
- User authentication via LDAP
- Automatic user provisioning
- Group-based permissions
- Secure connection support

## Installation
1. Navigate to Plugin Manager
2. Enable "LDAP Authentication" plugin
3. Configure LDAP connection settings
4. Test connection
5. Save configuration

## Usage
For Users:
1. Check "Use Active Directory Login" on the login page
2. Enter your LDAP username and password
3. Click "Login"

For Administrators:
1. Go to Plugin Manager → LDAP Authentication
2. Configure LDAP server settings
3. Import users from LDAP directory
4. Manage user permissions

## Configuration
Required Settings:
- **Server URL**: LDAP server address
- **Base DN**: Directory base for searches
- **Bind DN**: Service account for authentication
- **Bind Password**: Service account password
- **User Search Base**: Where to find users
- **Search Filter**: LDAP query filter

Optional Settings:
- **Group Attribute**: LDAP group attribute
- **Email Attribute**: LDAP email attribute
- **Connection Timeout**: Connection timeout in seconds
- **Secure Connection**: Use LDAPS (636) or LDAP (389)

## Security
- All passwords are encrypted
- Secure LDAP connections supported
- Audit logging for all authentication attempts
- Session-based authentication with JWT tokens

## Troubleshooting

### Connection Issues
- Verify server URL and port
- Check firewall settings
- Validate service account credentials
- Test network connectivity

### Authentication Failures
- Verify user exists in directory
- Check search base and filter settings
- Validate bind DN permissions
- Review LDAP server logs

### Performance Issues
- Optimize search filters
- Use indexes on LDAP attributes
- Implement connection pooling
- Consider caching strategies

## Support
For LDAP configuration support, contact your system administrator.$content$,
    'markdown',
    'en',
    TRUE,
    0
FROM plugin.plugin_configurations pc 
WHERE pc.PluginId = 'ldap-auth'
AND NOT EXISTS (
    SELECT 1 FROM plugin.plugin_md_documentation pd 
    WHERE pd.PluginId = pc.Id 
    AND pd.DocumentType = 'readme'
    AND pd.Language = 'en'
) ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

-- LDAP Installation Guide
INSERT INTO plugin.plugin_md_documentation (Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, IsCurrent, OrderIndex)
SELECT 
    uuid_generate_v4(),
    pc.Id,
    'installation',
    'LDAP Plugin Installation Guide',
    $content$# LDAP Plugin Installation Guide

## Prerequisites
- Active Directory/LDAP server access
- Service account with read permissions
- Network connectivity to LDAP server
- CAS administrator access

## Step 1: Enable Plugin
1. Login to CAS as administrator
2. Navigate to Plugin Manager
3. Find "LDAP Authentication" plugin
4. Click "Enable"

## Step 2: Configure Connection
1. Click "Configure" on LDAP plugin
2. Fill in server information:
   - **Server URL**: ldap://your-server.com:389
   - **Secure Connection**: Enable if using LDAPS
3. Set base DN: `DC=company,DC=com`
4. Configure bind credentials:
   - **Bind DN**: CN=service-account,OU=Users,DC=company,DC=com
   - **Bind Password**: Service account password

## Step 3: Configure User Mapping
1. Set **Search Base**: Where users are located
2. Configure **Search Filter**: `(objectClass=user)`
3. Set **Username Attribute**: `sAMAccountName`
4. Set **Email Attribute**: `mail`

## Step 4: Test Configuration
1. Click "Test Connection"
2. Verify successful authentication
3. Check user search results
4. Validate group retrieval

## Step 5: Import Users
1. Click "Import Users"
2. Review imported users list
3. Assign appropriate permissions
4. Save changes

## Step 6: Enable LDAP Login
1. Toggle "LDAP Authentication Enabled"
2. Set as default if desired
3. Save configuration
4. Test user login

## Security Considerations
- Use LDAPS (port 636) for secure connections
- Create dedicated service account with minimal permissions
- Regularly rotate service account passwords
- Enable audit logging
- Use network-level security

## Post-Installation
1. Monitor authentication logs
2. Regularly sync user changes
3. Update configuration as needed
4. Test backup authentication method

## Troubleshooting
- **Connection timeouts**: Check network connectivity
- **Authentication failures**: Verify bind credentials
- **User not found**: Check search base and filter
- **Permission errors**: Validate service account rights$content$,
    'markdown',
    'en',
    TRUE,
    1
FROM plugin.plugin_configurations pc 
WHERE pc.PluginId = 'ldap-auth'
AND NOT EXISTS (
    SELECT 1 FROM plugin.plugin_md_documentation pd 
    WHERE pd.PluginId = pc.Id 
    AND pd.DocumentType = 'installation'
    AND pd.Language = 'en'
) ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

-- RAG Retrieval Plugin Documentation
INSERT INTO plugin.plugin_md_documentation (Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, IsCurrent, OrderIndex)
SELECT 
    uuid_generate_v4(),
    pc.Id,
    'readme',
    'RAG Document Intelligence Plugin',
    $content$# RAG Document Intelligence Plugin

## Description
Retrieval-Augmented Generation (RAG) plugin for intelligent document analysis, semantic search, and AI-powered chat interactions with multilingual support.

## Version
1.0.0

## Author
System

## Status
Active

## Features
- **Document Intelligence**: Analyze and understand document content
- **Semantic Search**: Find relevant documents using natural language queries
- **Multilingual Support**: Works with English, Bahasa Indonesia, and 100+ languages
- **AI Chat Interface**: Interactive conversations with document context
- **Vector Storage**: Efficient embeddings for similarity search
- **Collection Management**: Organize documents into logical groups
- **Multiple AI Providers**: Support for Ollama, OpenAI, and Google Gemini

## Installation
1. Ensure Ollama service is running (or configure API keys)
2. Enable "RAG Document Intelligence" plugin in Plugin Manager
3. Configure AI provider settings
4. Create document collections
5. Upload documents for analysis

## Usage

### Document Upload
1. Navigate to RAG Manager
2. Create a new collection
3. Upload documents (PDF, DOC, TXT, etc.)
4. Wait for processing completion
5. Documents are now searchable

### Chat Interface
1. Select a document collection
2. Start a chat session
3. Ask questions about your documents
4. Get AI-powered responses with source citations
5. Continue conversation for follow-up queries

### Semantic Search
1. Use natural language queries
2. Search across multiple document collections
3. Get relevant document excerpts
4. View source documents for full context

## Configuration

### AI Provider Setup
**Ollama (Local):**
- Download required models: `./ollama/setup-models.sh`
- Configure base URL: `http://localhost:11434`
- Select models: `llama2`, `mistral`, `code-llama`

**OpenAI:**
- API Key: Your OpenAI API key
- Model: `gpt-3.5-turbo`, `gpt-4`, etc.
- Embedding Model: `text-embedding-3-small`

**Google Gemini:**
- API Key: Your Google AI API key
- Model: `gemini-pro`, `gemini-pro-vision`

### Collection Settings
- **Chunk Size**: Document processing chunk size (default: 1000)
- **Chunk Overlap**: Overlap between chunks (default: 200)
- **Max Retrieval**: Documents to retrieve (default: 5)
- **Embedding Model**: Model for vector embeddings

## Supported Document Types
- PDF files
- Microsoft Word (.doc, .docx)
- Plain text (.txt)
- Markdown (.md)
- HTML files
- JSON and XML
- CSV data

## Languages Supported
- **Primary**: English, Bahasa Indonesia
- **Secondary**: Spanish, French, German, Italian, Portuguese
- **Extended**: 100+ languages via translation models

## Security & Privacy
- **Local Processing**: Ollama models run locally
- **Data Encryption**: All documents encrypted at rest
- **Access Control**: User-based permissions on collections
- **Audit Logging**: All interactions logged
- **No Data Leakage**: Documents never leave your environment

## Performance Optimization
- **Vector Indexing**: Fast similarity search
- **Caching**: Frequently accessed documents cached
- **Batch Processing**: Efficient document processing
- **Parallel Embeddings**: Multiple documents processed simultaneously

## Troubleshooting

### Common Issues
- **Model Loading**: Ensure Ollama service is running
- **Slow Processing**: Check system resources and model size
- **Poor Results**: Adjust chunk size and overlap settings
- **API Errors**: Validate API keys and network connectivity

### Performance Tips
- Use SSD storage for faster access
- Allocate sufficient RAM for model loading
- Optimize document sizes for processing
- Use appropriate model sizes for your hardware

## API Documentation
See API documentation for detailed endpoint information and integration examples.

## Support
- Check system logs for error details
- Review configuration settings
- Test with sample documents first
- Contact administrator for persistent issues

## Changelog
### v1.0.0
- Initial release with core RAG functionality
- Multilingual support for English and Bahasa Indonesia
- Ollama, OpenAI, and Gemini integration
- Web-based document management interface
- Semantic search capabilities
- Chat interface with source citations$content$,
    'markdown',
    'en',
    TRUE,
    0
FROM plugin.plugin_configurations pc 
WHERE pc.PluginId = 'rag-retrieval'
AND NOT EXISTS (
    SELECT 1 FROM plugin.plugin_md_documentation pd 
    WHERE pd.PluginId = pc.Id 
    AND pd.DocumentType = 'readme'
    AND pd.Language = 'en'
) ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING;

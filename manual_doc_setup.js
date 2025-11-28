// Manual documentation setup for testing
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cas',
  password: 'postgres',
  port: 5432,
});

async function setupDocumentation() {
  try {
    console.log('🔧 Setting up documentation table...');
    
    // Create documentation table
    await pool.query(`
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
    `);
    
    console.log('✅ Documentation table created');
    
    // Get plugin IDs
    const pluginResult = await pool.query(
      'SELECT Id, PluginId FROM plugin.plugin_configurations WHERE PluginId IN ($1, $2, $3)',
      ['rag-retrieval', 'ldap-auth', 'core.text-block']
    );
    
    console.log('🔍 Found plugins:', pluginResult.rows);
    
    // Insert RAG documentation
    if (pluginResult.rows.find(p => p.pluginid === 'rag-retrieval')) {
      const ragPluginId = pluginResult.rows.find(p => p.pluginid === 'rag-retrieval').id;
      
      await pool.query(`
        INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata)
        VALUES ($1, 'readme', 'RAG Document Intelligence', $2, 'markdown', 'en', '1.0.0', TRUE, 1, $3)
        ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING
      `, [ragPluginId, `# RAG Document Intelligence

## Overview

RAG (Retrieval-Augmented Generation) plugin for CAS platform provides intelligent document analysis and chat capabilities with multilingual support.

## Features

### Document Processing
- **Intelligent Chunking**: Smart document segmentation with overlapping context
- **Multi-format Support**: PDF, Word, HTML, Markdown, and more
- **Context Preservation**: Maintains document relationships across chunks
- **Metadata Extraction**: Automatic title, author, and content extraction

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

## Configuration

### AI Providers
1. **OpenAI**: GPT models with API key authentication
2. **Gemini**: Google AI with API key setup
3. **Ollama**: Local models with endpoint configuration

### Processing Settings
- **Chunk Size**: Control document segmentation (100-10,000 tokens)
- **Chunk Overlap**: Maintain context between segments (0-500 tokens)
- **Context Window**: Maximum AI conversation context (1,000-128,000 tokens)
- **Temperature**: Response creativity control (0.0-2.0)
- **Retrieval Count**: Number of documents to reference (1-20)

*RAG Plugin v1.0.0*`, JSON.stringify({"language": "en", "version": "1.0.0", "features": ["multilingual", "document-processing", "ai-integration", "chat-interface"]})]);
      
      console.log('✅ RAG documentation inserted');
    }
    
    // Insert LDAP documentation
    if (pluginResult.rows.find(p => p.pluginid === 'ldap-auth')) {
      const ldapPluginId = pluginResult.rows.find(p => p.pluginid === 'ldap-auth').id;
      
      await pool.query(`
        INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata)
        VALUES ($1, 'readme', 'LDAP Authentication Plugin', $2, 'markdown', 'en', '1.0.0', TRUE, 1, $3)
        ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING
      `, [ldapPluginId, `# LDAP Authentication Plugin

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

*LDAP Authentication Plugin v1.0.0*`, JSON.stringify({"language": "en", "version": "1.0.0", "protocols": ["ldap", "ldaps"], "features": ["authentication", "user-sync", "group-management"]})]);
      
      console.log('✅ LDAP documentation inserted');
    }
    
    // Insert Text Block documentation
    if (pluginResult.rows.find(p => p.pluginid === 'core.text-block')) {
      const textBlockPluginId = pluginResult.rows.find(p => p.pluginid === 'core.text-block').id;
      
      await pool.query(`
        INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata)
        VALUES ($1, 'readme', 'Text Block Plugin', $2, 'markdown', 'en', '1.0.0', TRUE, 1, $3)
        ON CONFLICT (PluginId, DocumentType, Language, Version) DO NOTHING
      `, [textBlockPluginId, `# Text Block Plugin

## Overview

Simple text block component for CAS platform, providing content blocks for various use cases.

## Features

- **Rich Text Editing**: Markdown and plain text support
- **Block Management**: Organize content in structured blocks
- **Version Control**: Track changes and maintain history
- **Export Options**: Multiple output formats
- **Integration**: Works with other CAS components

*Text Block Plugin v1.0.0*`, JSON.stringify({"language": "en", "version": "1.0.0", "features": ["markdown", "block-management", "version-control"]})]);
      
      console.log('✅ Text Block documentation inserted');
    }
    
    console.log('🎉 Documentation setup complete!');
    
  } catch (error) {
    console.error('❌ Documentation setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDocumentation().catch(console.error);

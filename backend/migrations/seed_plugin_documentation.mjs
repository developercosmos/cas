#!/usr/bin/env node

/**
 * Seed Plugin Documentation to Database
 * 
 * This script reads all plugin documentation from .md files
 * and seeds them into the database as the single source of truth.
 * 
 * Usage: node seed_plugin_documentation.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dashboard_user:dashboard_password@localhost:5432/dashboard_db';

const pool = new Pool({
  connectionString: DATABASE_URL
});

// Plugin documentation mapping
const PLUGIN_DOCS = {
  'core.text-block': [
    {
      type: 'readme',
      title: 'Text Block Plugin',
      file: null, // Will generate inline
      content: `# Text Block Plugin

A basic text editing block plugin for the CAS system.

## Overview

The Text Block plugin provides simple text editing capabilities within the Canvas application. It's a core plugin that demonstrates the plugin architecture.

## Features

- **Simple Text Editing**: Basic text input and display
- **Storage Integration**: Read and write permissions for data persistence
- **Lightweight**: Minimal dependencies and fast performance

## Installation

This is a core plugin and comes pre-installed with the CAS system.

## Usage

1. Open the Canvas application
2. Add a new Text Block from the plugin menu
3. Start typing to create content
4. Changes are automatically saved

## Configuration

No configuration required. The plugin works out of the box.

## Permissions

- \`storage.read\` - Read data from storage
- \`storage.write\` - Write data to storage

## Version

Current Version: 1.0.0

## Author

Dashboard Team

## Support

For issues or questions, contact the system administrator.
`
    }
  ],
  'ldap-auth': [
    {
      type: 'readme',
      title: 'LDAP Authentication Plugin',
      file: 'RAG_PLUGIN_DOCUMENTATION.md', // Will use actual file
      content: null
    },
    {
      type: 'user_guide',
      title: 'LDAP User Guide',
      file: 'LDAP_TESTING_GUIDE.md',
      content: null
    },
    {
      type: 'examples',
      title: 'LDAP Examples',
      file: null,
      content: `# LDAP Configuration Examples

## Example 1: Active Directory Configuration

\`\`\`json
{
  "serverUrl": "ldap.company.com",
  "port": 389,
  "baseDn": "dc=company,dc=com",
  "bindDn": "cn=admin,dc=company,dc=com",
  "bindPassword": "your-password",
  "searchAttribute": "sAMAccountName",
  "useSSL": false
}
\`\`\`

## Example 2: OpenLDAP Configuration

\`\`\`json
{
  "serverUrl": "openldap.company.com",
  "port": 389,
  "baseDn": "ou=people,dc=company,dc=com",
  "bindDn": "cn=admin,dc=company,dc=com",
  "bindPassword": "your-password",
  "searchAttribute": "uid",
  "useSSL": false
}
\`\`\`

## Example 3: LDAPS (Secure) Configuration

\`\`\`json
{
  "serverUrl": "ldaps.company.com",
  "port": 636,
  "baseDn": "dc=company,dc=com",
  "bindDn": "cn=admin,dc=company,dc=com",
  "bindPassword": "your-password",
  "searchAttribute": "mail",
  "useSSL": true
}
\`\`\`

## Testing Connection

After configuration, use the "Test LDAP" button to verify:
- Server connectivity
- Bind credentials
- Base DN structure
- Search filter validity

## Common Issues

### Cannot Connect
- Check firewall settings
- Verify server URL and port
- Ensure network access

### Authentication Failed
- Verify bind DN format
- Check bind password
- Confirm user permissions

### No Users Found
- Review base DN
- Check search attribute
- Verify search filter syntax
`
    }
  ],
  'rag-retrieval': [
    {
      type: 'readme',
      title: 'RAG Document Intelligence Plugin',
      file: 'RAG_PLUGIN_DOCUMENTATION.md',
      content: null
    },
    {
      type: 'user_guide',
      title: 'RAG Feature Guide',
      file: 'RAG_FEATURE_GUIDE.md',
      content: null
    },
    {
      type: 'installation',
      title: 'RAG Quick Start',
      file: 'RAG_QUICK_START.md',
      content: null
    },
    {
      type: 'troubleshooting',
      title: 'RAG Testing Guide',
      file: 'RAG_TESTING_GUIDE.md',
      content: null
    },
    {
      type: 'api',
      title: 'RAG API Reference',
      file: null,
      content: `# RAG API Reference

## Collection Management

### List Collections
\`\`\`
GET /api/plugins/rag/collections
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "collections": [
    {
      "id": "uuid",
      "name": "My Documents",
      "description": "Company documents",
      "documentCount": 42,
      "createdAt": "2025-11-27T00:00:00Z"
    }
  ]
}
\`\`\`

### Create Collection
\`\`\`
POST /api/plugins/rag/collections
Content-Type: application/json

{
  "name": "New Collection",
  "description": "Description here"
}
\`\`\`

## Document Management

### Upload Document
\`\`\`
POST /api/plugins/rag/documents
Content-Type: multipart/form-data

{
  "file": <file>,
  "collectionId": "uuid",
  "language": "en"
}
\`\`\`

### Search Documents
\`\`\`
POST /api/plugins/rag/search
Content-Type: application/json

{
  "query": "search term",
  "collectionId": "uuid",
  "limit": 10
}
\`\`\`

## Chat Interface

### Start Chat Session
\`\`\`
POST /api/plugins/rag/sessions
Content-Type: application/json

{
  "collectionId": "uuid",
  "language": "en"
}
\`\`\`

### Send Message
\`\`\`
POST /api/plugins/rag/chat
Content-Type: application/json

{
  "sessionId": "uuid",
  "message": "Your question here",
  "language": "en"
}
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "response": "AI generated response",
  "sources": [
    {
      "document": "filename.pdf",
      "page": 5,
      "relevance": 0.95
    }
  ]
}
\`\`\`

## Configuration

### Check AI Status
\`\`\`
GET /api/plugins/rag/ai/status
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "providers": ["ollama", "openai"],
  "activeProvider": "ollama"
}
\`\`\`

### Test AI Connection
\`\`\`
POST /api/plugins/rag/ai/test
\`\`\`

## Error Codes

- \`400\` - Bad Request (invalid parameters)
- \`401\` - Unauthorized (missing/invalid token)
- \`404\` - Not Found (collection/document doesn't exist)
- \`500\` - Internal Server Error
- \`503\` - Service Unavailable (AI provider offline)

## Rate Limits

- Document upload: 10 files per minute
- Chat messages: 30 messages per minute
- Search queries: 60 queries per minute

## Supported Languages

English, Bahasa Indonesia, and 100+ other languages supported by the AI models.
`
    }
  ]
};

async function getPluginInternalId(pluginId) {
  const result = await pool.query(
    'SELECT id FROM plugin.plugin_configurations WHERE pluginid = $1',
    [pluginId]
  );
  
  if (result.rows.length === 0) {
    console.error(`❌ Plugin not found: ${pluginId}`);
    return null;
  }
  
  return result.rows[0].id;
}

async function readFileContent(filename) {
  const filePath = path.join(__dirname, '..', '..', filename);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filename}`);
    return null;
  }
  
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Error reading file ${filename}:`, error.message);
    return null;
  }
}

async function deleteExistingDocs(pluginInternalId) {
  await pool.query(
    'DELETE FROM plugin.plugin_md_documentation WHERE pluginid = $1',
    [pluginInternalId]
  );
}

async function insertDocumentation(pluginInternalId, doc, pluginId) {
  let content = doc.content;
  
  // Read from file if specified
  if (doc.file && !content) {
    content = await readFileContent(doc.file);
    if (!content) {
      console.warn(`⚠️  Skipping ${doc.title} - no content available`);
      return false;
    }
  }
  
  if (!content) {
    console.warn(`⚠️  Skipping ${doc.title} - no content`);
    return false;
  }
  
  try {
    await pool.query(
      `INSERT INTO plugin.plugin_md_documentation 
       (pluginid, documenttype, title, content, contentformat, language, iscurrent, orderindex)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        pluginInternalId,
        doc.type,
        doc.title,
        content,
        'markdown',
        'en',
        true,
        0
      ]
    );
    
    console.log(`  ✅ Added: ${doc.title} (${doc.type})`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to insert ${doc.title}:`, error.message);
    return false;
  }
}

async function seedPlugin(pluginId, docs) {
  console.log(`\n📦 Processing plugin: ${pluginId}`);
  
  const pluginInternalId = await getPluginInternalId(pluginId);
  if (!pluginInternalId) {
    return { success: 0, failed: 0, skipped: docs.length };
  }
  
  // Delete existing documentation for this plugin
  await deleteExistingDocs(pluginInternalId);
  console.log(`  🗑️  Cleared existing documentation`);
  
  let success = 0;
  let failed = 0;
  
  for (const doc of docs) {
    const inserted = await insertDocumentation(pluginInternalId, doc, pluginId);
    if (inserted) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed, skipped: 0 };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║      🌱 SEED PLUGIN DOCUMENTATION TO DATABASE 🌱              ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');
    
    // Process each plugin
    for (const [pluginId, docs] of Object.entries(PLUGIN_DOCS)) {
      const result = await seedPlugin(pluginId, docs);
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 SUMMARY:');
    console.log(`  ✅ Successfully seeded: ${totalSuccess} documents`);
    if (totalFailed > 0) {
      console.log(`  ❌ Failed: ${totalFailed} documents`);
    }
    if (totalSkipped > 0) {
      console.log(`  ⚠️  Skipped: ${totalSkipped} documents`);
    }
    
    // Verify
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM plugin.plugin_md_documentation'
    );
    console.log(`\n📚 Total documentation entries in database: ${countResult.rows[0].total}`);
    
    console.log('\n✅ Documentation seeding complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
main();

-- Migration: Add Plugin Categorization and RBAC System
-- Version: 1.0.0
-- Description: Add Category column to plugin_configurations and create RBAC tables

-- Add Category column to plugin_configurations table
ALTER TABLE plugin.plugin_configurations 
ADD COLUMN IF NOT EXISTS Category VARCHAR(20) DEFAULT 'application' 
CHECK (Category IN ('system', 'application'));

-- Add indexes for Category
CREATE INDEX IF NOT EXISTS idx_plugin_configurations_category 
ON plugin.plugin_configurations(Category);

-- Create API Registry table for plugin communication
CREATE TABLE IF NOT EXISTS plugin.plugin_api_registry (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
  ApiPath VARCHAR(500) NOT NULL,
  HttpMethod VARCHAR(10) NOT NULL,
  ApiDescription TEXT,
  RequiredPermissions TEXT[] DEFAULT '{}',
  IsPublic BOOLEAN DEFAULT FALSE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(PluginId, ApiPath, HttpMethod)
);

-- Create indexes for plugin_api_registry
CREATE INDEX IF NOT EXISTS idx_plugin_api_registry_plugin_id 
ON plugin.plugin_api_registry(PluginId);
CREATE INDEX IF NOT EXISTS idx_plugin_api_registry_path_method 
ON plugin.plugin_api_registry(ApiPath, HttpMethod);

-- Create RBAC Permissions table for detailed permission management
CREATE TABLE IF NOT EXISTS plugin.plugin_rbac_permissions (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
  PermissionName VARCHAR(100) NOT NULL,
  ResourceType VARCHAR(50) NOT NULL CHECK (ResourceType IN ('field', 'object', 'data', 'action')),
  ResourceId VARCHAR(255), -- Specific resource identifier (NULL for global permissions)
  Description TEXT,
  IsSystemLevel BOOLEAN DEFAULT FALSE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(PluginId, PermissionName, ResourceType, ResourceId)
);

-- Create indexes for plugin_rbac_permissions
CREATE INDEX IF NOT EXISTS idx_plugin_rbac_permissions_plugin_id 
ON plugin.plugin_rbac_permissions(PluginId);
CREATE INDEX IF NOT EXISTS idx_plugin_rbac_permissions_name 
ON plugin.plugin_rbac_permissions(PermissionName);
CREATE INDEX IF NOT EXISTS idx_plugin_rbac_permissions_resource_type 
ON plugin.plugin_rbac_permissions(ResourceType);

-- Create Cross-Plugin Communication Audit table
CREATE TABLE IF NOT EXISTS plugin.plugin_communication_audit (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  FromPluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id),
  ToPluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id),
  UserId UUID NOT NULL REFERENCES auth.users(Id),
  ApiPath VARCHAR(500) NOT NULL,
  HttpMethod VARCHAR(10) NOT NULL,
  RequestData JSONB,
  ResponseData JSONB,
  StatusCode INTEGER,
  ExecutionTimeMs INTEGER,
  Success BOOLEAN DEFAULT TRUE,
  ErrorMessage TEXT,
  Timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for plugin_communication_audit
CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_timestamp 
ON plugin.plugin_communication_audit(Timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_from_to 
ON plugin.plugin_communication_audit(FromPluginId, ToPluginId);
CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_user 
ON plugin.plugin_communication_audit(UserId);

-- Update existing plugins to be categorized as 'system'
UPDATE plugin.plugin_configurations 
SET Category = 'system', IsSystem = true, UpdatedAt = NOW()
WHERE PluginId IN ('text-block', 'ldap-auth', 'rag-retrieval');

-- Add default API registry entries for existing system plugins

-- Text Block Plugin APIs
INSERT INTO plugin.plugin_api_registry (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic)
SELECT 
  pc.Id,
  '/api/plugins/text-block/configure',
  'POST',
  'Configure text block plugin settings',
  ARRAY['plugin.configure'],
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'text-block'
ON CONFLICT (PluginId, ApiPath, HttpMethod) DO NOTHING;

-- LDAP Plugin APIs  
INSERT INTO plugin.plugin_api_registry (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic)
SELECT 
  pc.Id,
  '/api/plugins/ldap/authenticate',
  'POST',
  'Authenticate user against LDAP',
  ARRAY['auth.ldap'],
  true
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'ldap-auth'
ON CONFLICT (PluginId, ApiPath, HttpMethod) DO NOTHING;

INSERT INTO plugin.plugin_api_registry (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic)
SELECT 
  pc.Id,
  '/api/plugins/ldap/configure',
  'POST',
  'Configure LDAP connection settings',
  ARRAY['plugin.configure'],
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'ldap-auth'
ON CONFLICT (PluginId, ApiPath, HttpMethod) DO NOTHING;

-- RAG Plugin APIs
INSERT INTO plugin.plugin_api_registry (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic)
SELECT 
  pc.Id,
  '/api/plugins/rag/chat',
  'POST',
  'Send message to RAG chat interface',
  ARRAY['chat:create'],
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, ApiPath, HttpMethod) DO NOTHING;

INSERT INTO plugin.plugin_api_registry (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic)
SELECT 
  pc.Id,
  '/api/plugins/rag/documents',
  'POST',
  'Upload document to RAG system',
  ARRAY['document:upload'],
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, ApiPath, HttpMethod) DO NOTHING;

-- Add default RBAC permissions for system plugins

-- Text Block RBAC permissions
INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'text-block.configure',
  'action',
  'Configure text block plugin settings',
  true
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'text-block'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'text-block.create',
  'action',
  'Create new text blocks',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'text-block'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'text-block.read',
  'data',
  'Read text block content',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'text-block'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

-- LDAP RBAC permissions
INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'ldap.authenticate',
  'action',
  'Authenticate users via LDAP',
  true
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'ldap-auth'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'ldap.configure',
  'action',
  'Configure LDAP server settings',
  true
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'ldap-auth'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'ldap.users.read',
  'data',
  'Read user information from LDAP',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'ldap-auth'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

-- RAG RBAC permissions
INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'rag.chat.create',
  'action',
  'Create chat sessions and send messages',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'rag.document.upload',
  'action',
  'Upload documents to RAG system',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'rag.collection.manage',
  'action',
  'Manage document collections',
  false
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

INSERT INTO plugin.plugin_rbac_permissions (PluginId, PermissionName, ResourceType, Description, IsSystemLevel)
SELECT 
  pc.Id,
  'rag.configure',
  'action',
  'Configure RAG system settings',
  true
FROM plugin.plugin_configurations pc
WHERE pc.PluginId = 'rag-retrieval'
ON CONFLICT (PluginId, PermissionName, ResourceType, ResourceId) DO NOTHING;

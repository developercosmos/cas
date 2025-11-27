-- Add missing plugin configurations for RAG and LDAP plugins

-- RAG Plugin Configuration
INSERT INTO plugin.plugin_configurations (Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, IsSystem, CreatedAt, UpdatedAt)
SELECT 
    uuid_generate_v4() as Id,
    'rag-retrieval' as PluginId,
    'RAG Document Intelligence' as PluginName,
    '1.0.0' as PluginVersion,
    'Retrieval-Augmented Generation for document analysis and intelligent chat (English & Bahasa Indonesia)' as PluginDescription,
    'System' as PluginAuthor,
    'index.js' as PluginEntry,
    'active' as PluginStatus, 
    true as IsSystem,
    NOW() as CreatedAt,
    NOW() as UpdatedAt
WHERE NOT EXISTS (
    SELECT 1 FROM plugin.plugin_configurations 
    WHERE PluginId = 'rag-retrieval'
);

-- LDAP Plugin Configuration  
INSERT INTO plugin.plugin_configurations (Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, IsSystem, CreatedAt, UpdatedAt)
SELECT 
    uuid_generate_v4() as Id,
    'ldap-auth' as PluginId, 
    'LDAP Authentication' as PluginName,
    '1.0.0' as PluginVersion,
    'LDAP directory authentication plugin with user management capabilities' as PluginDescription,
    'System' as PluginAuthor,
    'index.js' as PluginEntry,
    'disabled' as PluginStatus,
    true as IsSystem,
    NOW() as CreatedAt,
    NOW() as UpdatedAt
WHERE NOT EXISTS (
    SELECT 1 FROM plugin.plugin_configurations 
    WHERE PluginId = 'ldap-auth'
);

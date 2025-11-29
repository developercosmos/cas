-- Rollback: Remove Plugin Categorization and RBAC System
-- Version: 1.0.0
-- Description: Remove Category column and RBAC tables

-- Drop audit table
DROP TABLE IF EXISTS plugin.plugin_communication_audit;

-- Drop RBAC permissions table
DROP TABLE IF EXISTS plugin.plugin_rbac_permissions;

-- Drop API registry table
DROP TABLE IF EXISTS plugin.plugin_api_registry;

-- Remove Category column from plugin_configurations
ALTER TABLE plugin.plugin_configurations DROP COLUMN IF EXISTS Category;

-- Note: IsSystem column remains as it was part of the original schema
-- Existing plugins will retain their system status through IsSystem column

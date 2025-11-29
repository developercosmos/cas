-- Migration: Add missing RBAC columns to user_plugin_permissions
-- Version: 1.0.2
-- Description: Add ResourceType and ResourceId columns to user_permissions table

-- Add missing columns to user_plugin_permissions
ALTER TABLE plugin.user_plugin_permissions 
ADD COLUMN IF NOT EXISTS ResourceType VARCHAR(50) DEFAULT 'action',
ADD COLUMN IF NOT EXISTS ResourceId VARCHAR(255);

-- Update constraint to include new columns
DROP TABLE IF EXISTS plugin.user_plugin_permissions_temp;

CREATE TABLE plugin.user_plugin_permissions_temp AS
SELECT * FROM plugin.user_plugin_permissions;

DROP TABLE plugin.user_plugin_permissions;

CREATE TABLE plugin.user_plugin_permissions (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
  PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
  PermissionName VARCHAR(100) NOT NULL,
  ResourceType VARCHAR(50) NOT NULL DEFAULT 'action',
  ResourceId VARCHAR(255),
  IsGranted BOOLEAN DEFAULT FALSE,
  GrantedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  GrantedBy UUID REFERENCES auth.users(Id),
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(UserId, PluginId, PermissionName, ResourceType, ResourceId)
);

-- Copy data back
INSERT INTO plugin.user_plugin_permissions 
SELECT * FROM plugin.user_plugin_permissions_temp;

DROP TABLE plugin.user_plugin_permissions_temp;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_user_plugin_permissions_user_id 
ON plugin.user_plugin_permissions(UserId);
CREATE INDEX IF NOT EXISTS idx_user_plugin_permissions_plugin_id 
ON plugin.user_plugin_permissions(PluginId);

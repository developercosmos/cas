-- Migration: 20251129_create_uam_tables.sql
-- User Access Management Plugin Database Tables
-- Following CAS Database Standards and Constitution

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Master Data Tables (md)

-- Roles Master Table
CREATE TABLE IF NOT EXISTS plugin.uam_md_roles (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  Name VARCHAR(255) NOT NULL UNIQUE,
  Description TEXT,
  IsSystem BOOLEAN NOT NULL DEFAULT FALSE,
  Level INTEGER NOT NULL DEFAULT 0,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedBy UUID,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedBy UUID,
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  Version INTEGER NOT NULL DEFAULT 1
);

-- Permissions Master Table
CREATE TABLE IF NOT EXISTS plugin.uam_md_permissions (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  Name VARCHAR(255) NOT NULL UNIQUE,
  Description TEXT,
  Resource VARCHAR(255) NOT NULL,
  Action VARCHAR(100) NOT NULL,
  Category VARCHAR(100) NOT NULL DEFAULT 'general',
  IsSystem BOOLEAN NOT NULL DEFAULT FALSE,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  Version INTEGER NOT NULL DEFAULT 1
);

-- Role Permissions Junction Table (Master Data)
CREATE TABLE IF NOT EXISTS plugin.uam_md_role_permissions (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  RoleId UUID NOT NULL REFERENCES plugin.uam_md_roles(Id) ON DELETE CASCADE,
  PermissionId UUID NOT NULL REFERENCES plugin.uam_md_permissions(Id) ON DELETE CASCADE,
  GrantedBy UUID,
  GrantedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(RoleId, PermissionId)
);

-- Transaction Data Tables (tx)

-- User Roles Transaction Table
CREATE TABLE IF NOT EXISTS plugin.uam_tx_user_roles (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  UserId UUID NOT NULL,
  RoleId UUID NOT NULL REFERENCES plugin.uam_md_roles(Id) ON DELETE CASCADE,
  AssignedBy UUID NOT NULL,
  AssignedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ExpiresAt TIMESTAMPTZ,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  Reason TEXT,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_role UNIQUE(UserId, RoleId, IsActive)
);

-- Audit Log Transaction Table
CREATE TABLE IF NOT EXISTS plugin.uam_tx_audit_log (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ActionType VARCHAR(100) NOT NULL,
  EntityType VARCHAR(100) NOT NULL,
  EntityId UUID,
  OldValues JSONB,
  NewValues JSONB,
  UserId UUID,
  IPAddress INET,
  UserAgent TEXT,
  Timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  Success BOOLEAN NOT NULL DEFAULT TRUE,
  ErrorMessage TEXT
);

-- Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_uam_md_roles_name ON plugin.uam_md_roles(Name);
CREATE INDEX IF NOT EXISTS idx_uam_md_roles_system ON plugin.uam_md_roles(IsSystem);
CREATE INDEX IF NOT EXISTS idx_uam_md_roles_active ON plugin.uam_md_roles(IsActive);
CREATE INDEX IF NOT EXISTS idx_uam_md_permissions_name ON plugin.uam_md_permissions(Name);
CREATE INDEX IF NOT EXISTS idx_uam_md_permissions_resource ON plugin.uam_md_permissions(Resource);
CREATE INDEX IF NOT EXISTS idx_uam_md_permissions_action ON plugin.uam_md_permissions(Action);
CREATE INDEX IF NOT EXISTS idx_uam_md_permissions_category ON plugin.uam_md_permissions(Category);
CREATE INDEX IF NOT EXISTS idx_uam_md_role_permissions_role ON plugin.uam_md_role_permissions(RoleId);
CREATE INDEX IF NOT EXISTS idx_uam_md_role_permissions_permission ON plugin.uam_md_role_permissions(PermissionId);
CREATE INDEX IF NOT EXISTS idx_uam_tx_user_roles_user ON plugin.uam_tx_user_roles(UserId);
CREATE INDEX IF NOT EXISTS idx_uam_tx_user_roles_role ON plugin.uam_tx_user_roles(RoleId);
CREATE INDEX IF NOT EXISTS idx_uam_tx_user_roles_active ON plugin.uam_tx_user_roles(IsActive);
CREATE INDEX IF NOT EXISTS idx_uam_tx_user_roles_assigned ON plugin.uam_tx_user_roles(AssignedAt);
CREATE INDEX IF NOT EXISTS idx_uam_tx_user_roles_expires ON plugin.uam_tx_user_roles(ExpiresAt);
CREATE INDEX IF NOT EXISTS idx_uam_tx_audit_log_timestamp ON plugin.uam_tx_audit_log(Timestamp);
CREATE INDEX IF NOT EXISTS idx_uam_tx_audit_log_action ON plugin.uam_tx_audit_log(ActionType);
CREATE INDEX IF NOT EXISTS idx_uam_tx_audit_log_entity ON plugin.uam_tx_audit_log(EntityType);
CREATE INDEX IF NOT EXISTS idx_uam_tx_audit_log_user ON plugin.uam_tx_audit_log(UserId);

-- Insert Default System Data
INSERT INTO plugin.uam_md_roles (Name, Description, IsSystem, Level, IsActive, CreatedAt) VALUES
('admin', 'System administrator with full access to all resources', TRUE, 100, TRUE, NOW()),
('manager', 'Manager with administrative access to specific areas', TRUE, 50, TRUE, NOW()),
('supervisor', 'Supervisor with limited management capabilities', TRUE, 25, TRUE, NOW()),
('user', 'Standard user with basic system access', TRUE, 10, TRUE, NOW())
ON CONFLICT (Name) DO NOTHING;

-- Insert Default System Permissions
INSERT INTO plugin.uam_md_permissions (Name, Description, Resource, Action, Category, IsSystem, IsActive, CreatedAt) VALUES
('user_access.admin', 'Admin access to user access management system', 'user_access_management', 'admin', 'system', TRUE, TRUE, NOW()),
('user_access.roles.create', 'Create new roles in the system', 'user_access_management', 'create', 'action', TRUE, TRUE, NOW()),
('user_access.roles.edit', 'Edit existing roles in the system', 'user_access_management', 'edit', 'action', TRUE, TRUE, NOW()),
('user_access.roles.delete', 'Delete roles from the system', 'user_access_management', 'delete', 'action', TRUE, TRUE, NOW()),
('user_access.roles.assign', 'Assign roles to users', 'user_access_management', 'assign', 'action', TRUE, TRUE, NOW()),
('user_access.users.manage', 'Manage user access assignments', 'user_access_management', 'manage', 'action', TRUE, TRUE, NOW()),
('user_access.permissions.create', 'Create new permissions in the system', 'user_access_management', 'create', 'action', TRUE, TRUE, NOW()),
('user_access.permissions.view', 'View permissions and roles', 'user_access_management', 'view', 'action', TRUE, TRUE, NOW()),
('user_access.audit.view', 'View audit logs for user access management', 'user_access_management', 'view', 'audit', TRUE, TRUE, NOW()),
('plugin.admin', 'Admin access to plugin management system', 'plugins', 'admin', 'system', TRUE, TRUE, NOW()),
('plugin.install', 'Install plugins into the system', 'plugins', 'install', 'action', TRUE, TRUE, NOW()),
('plugin.uninstall', 'Uninstall plugins from the system', 'plugins', 'uninstall', 'action', TRUE, TRUE, NOW()),
('plugin.enable', 'Enable plugins in the system', 'plugins', 'enable', 'action', TRUE, TRUE, NOW()),
('plugin.disable', 'Disable plugins in the system', 'plugins', 'disable', 'action', TRUE, TRUE, NOW()),
('plugin.configure', 'Configure plugins in the system', 'plugins', 'configure', 'action', TRUE, TRUE, NOW())
ON CONFLICT (Name) DO NOTHING;

-- Assign All Permissions to Admin Role
INSERT INTO plugin.uam_md_role_permissions (RoleId, PermissionId, GrantedAt)
SELECT 
  r.Id as RoleId,
  p.Id as PermissionId,
  NOW() as GrantedAt
FROM plugin.uam_md_roles r
CROSS JOIN plugin.uam_md_permissions p
WHERE r.Name = 'admin' AND p.IsActive = TRUE
ON CONFLICT (RoleId, PermissionId) DO NOTHING;

-- Create Function for Permission Check
CREATE OR REPLACE FUNCTION plugin.uam_has_permission(
  p_user_id UUID,
  p_permission_name VARCHAR(255),
  p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user has permission through any active role
  SELECT EXISTS(
    SELECT 1
    FROM plugin.uam_tx_user_roles ur
    INNER JOIN plugin.uam_md_role_permissions rp ON ur.RoleId = rp.RoleId
    INNER JOIN plugin.uam_md_permissions p ON rp.PermissionId = p.Id
    WHERE ur.UserId = p_user_id
      AND ur.IsActive = TRUE
      AND (ur.ExpiresAt IS NULL OR ur.ExpiresAt > NOW())
      AND p.Name = p_permission_name
      AND p.IsActive = TRUE
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Function for User Effective Permissions
CREATE OR REPLACE FUNCTION plugin.uam_get_user_permissions(
  p_user_id UUID
) RETURNS TABLE (
  PermissionName VARCHAR(255),
  Resource VARCHAR(255),
  Action VARCHAR(100),
  Category VARCHAR(100),
  RoleName VARCHAR(255),
  GrantedAt TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.Name as PermissionName,
    p.Resource as Resource,
    p.Action as Action,
    p.Category as Category,
    r.Name as RoleName,
    rp.GrantedAt
  FROM plugin.uam_tx_user_roles ur
  INNER JOIN plugin.uam_md_roles r ON ur.RoleId = r.Id
  INNER JOIN plugin.uam_md_role_permissions rp ON ur.RoleId = rp.RoleId
  INNER JOIN plugin.uam_md_permissions p ON rp.PermissionId = p.Id
  WHERE ur.UserId = p_user_id
    AND ur.IsActive = TRUE
    AND (ur.ExpiresAt IS NULL OR ur.ExpiresAt > NOW())
    AND r.IsActive = TRUE
    AND p.IsActive = TRUE
  ORDER BY p.Category, p.Name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Comment for Documentation
COMMENT ON TABLE plugin.uam_md_roles IS 'Master table for user roles in the access management system';
COMMENT ON TABLE plugin.uam_md_permissions IS 'Master table for system permissions';
COMMENT ON TABLE plugin.uam_md_role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON TABLE plugin.uam_tx_user_roles IS 'Transaction table tracking role assignments to users';
COMMENT ON TABLE plugin.uam_tx_audit_log IS 'Audit log for all access management changes';
COMMENT ON FUNCTION plugin.uam_has_permission IS 'Check if user has specific permission';
COMMENT ON FUNCTION plugin.uam_get_user_permissions IS 'Get all effective permissions for a user';

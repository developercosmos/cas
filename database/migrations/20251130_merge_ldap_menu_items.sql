-- Migration: Merge LDAP Menu Items and Remove Test Modules
-- Date: 2025-11-30
-- Description: Consolidates separate LDAP menu items into single LDAP Management item

BEGIN;

-- Remove existing LDAP menu items
DELETE FROM plugin.navigation_modules 
WHERE pluginId = 'ldap-auth' 
AND name IN ('LDAP Configuration', 'LDAP Test', 'LDAP Manage Users');

-- Remove test modules if they exist
DELETE FROM plugin.navigation_modules 
WHERE name ILIKE '%test%' 
AND pluginId IN ('test', 'dashboard-test', 'test-module');

-- Add consolidated LDAP Management menu item
INSERT INTO plugin.navigation_modules (
  name, 
  description, 
  pluginId, 
  requiresAuth, 
  requiredPermissions,
  route, 
  sortOrder, 
  icon, 
  isActive, 
  createdAt, 
  updatedAt
) VALUES (
  'LDAP Management',
  'Configure LDAP authentication, manage users, and test connections',
  'ldap-auth',
  true,
  ARRAY['ldap.configure', 'ldap.test', 'ldap.manage_users'],
  '/admin/ldap',
  30,
  null,
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  requiredPermissions = EXCLUDED.requiredPermissions,
  sortOrder = EXCLUDED.sortOrder,
  updatedAt = NOW();

-- Update audit log
INSERT INTO plugin.navigation_modules_audit (
  ModuleId, 
  Action, 
  OldValues, 
  NewValues, 
  ChangedBy, 
  ChangedAt
) 
SELECT 
  m.id,
  'MERGED_LDAP_ITEMS',
  json_build_object('name', m.name, 'description', m.description),
  json_build_object('name', 'LDAP Management', 'description', 'Consolidated LDAP management with all permissions'),
  'system_migration',
  NOW()
FROM plugin.navigation_modules m 
WHERE m.name = 'LDAP Management';

COMMIT;

-- Verify the changes
SELECT 
  name, 
  description, 
  pluginId, 
  requiredPermissions, 
  route, 
  sortOrder, 
  isActive
FROM plugin.navigation_modules 
WHERE pluginId = 'ldap-auth' OR name ILIKE '%ldap%'
ORDER BY sortOrder;

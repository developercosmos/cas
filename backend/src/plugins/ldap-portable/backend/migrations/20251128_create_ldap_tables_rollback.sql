-- Rollback: 20251128_create_ldap_tables.sql
-- Plugin: ldap-auth
-- Description: Rollback LDAP plugin tables
-- Constitution: Section X - Migrations MUST include rollback scripts

-- Drop indexes first
DROP INDEX IF EXISTS plugin.idx_ldap_configurations_active;
DROP INDEX IF EXISTS plugin.idx_ldap_user_imports_status;
DROP INDEX IF EXISTS plugin.idx_ldap_user_imports_username;
DROP INDEX IF EXISTS plugin.idx_ldap_user_imports_created;

-- Drop tables
DROP TABLE IF EXISTS plugin.ldap_user_imports CASCADE;
DROP TABLE IF EXISTS plugin.ldap_configurations CASCADE;

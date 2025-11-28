-- Migration: 20251128_create_ldap_tables.sql
-- Plugin: ldap-auth
-- Description: Create LDAP plugin tables following CAS Constitution database standards
-- Following CAS Constitution Section X - Plugin Database Standards

-- Ensure plugin schema exists
CREATE SCHEMA IF NOT EXISTS plugin;

-- Create ldap_configurations table (Master Data - md)
-- Constitution: Use {plugin}_md_{entity} prefix for reference data
CREATE TABLE IF NOT EXISTS plugin.ldap_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serverurl VARCHAR(500) NOT NULL,
  basedn VARCHAR(500) NOT NULL,
  binddn VARCHAR(500) NOT NULL,
  bindpassword TEXT NOT NULL,
  searchfilter VARCHAR(500) DEFAULT '(objectClass=person)',
  searchattribute VARCHAR(100) DEFAULT 'uid',
  groupattribute VARCHAR(100) DEFAULT 'memberOf',
  issecure BOOLEAN DEFAULT FALSE,
  port INTEGER DEFAULT 389,
  isactive BOOLEAN DEFAULT TRUE,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ldap_user_imports table (Transaction Data - tx)
-- Constitution: Use {plugin}_tx_{entity} prefix for operational data
CREATE TABLE IF NOT EXISTS plugin.ldap_user_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldapdn VARCHAR(500),
  username VARCHAR(255),
  email VARCHAR(255),
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  displayname VARCHAR(500),
  ldapgroups TEXT[],
  importstatus VARCHAR(50) DEFAULT 'pending',
  importerrors TEXT[],
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
-- Constitution: Section XVI - Plugin Performance Standards
CREATE INDEX IF NOT EXISTS idx_ldap_configurations_active 
ON plugin.ldap_configurations(isactive) WHERE isactive = TRUE;

CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_status 
ON plugin.ldap_user_imports(importstatus);

CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_username 
ON plugin.ldap_user_imports(username);

CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_created 
ON plugin.ldap_user_imports(createdat DESC);

-- Add comments for documentation
COMMENT ON TABLE plugin.ldap_configurations IS 'LDAP plugin configuration settings (Master Data)';
COMMENT ON TABLE plugin.ldap_user_imports IS 'LDAP user import records (Transaction Data)';

COMMENT ON COLUMN plugin.ldap_configurations.serverurl IS 'LDAP server URL (e.g., ldap://ldap.example.com)';
COMMENT ON COLUMN plugin.ldap_configurations.basedn IS 'Base DN for LDAP searches';
COMMENT ON COLUMN plugin.ldap_configurations.binddn IS 'Bind DN for authentication';
COMMENT ON COLUMN plugin.ldap_configurations.bindpassword IS 'Encrypted bind password';
COMMENT ON COLUMN plugin.ldap_configurations.issecure IS 'Use LDAPS (TLS/SSL)';
COMMENT ON COLUMN plugin.ldap_configurations.isactive IS 'Whether this configuration is active';

COMMENT ON COLUMN plugin.ldap_user_imports.ldapdn IS 'User Distinguished Name in LDAP';
COMMENT ON COLUMN plugin.ldap_user_imports.ldapgroups IS 'Array of LDAP group memberships';
COMMENT ON COLUMN plugin.ldap_user_imports.importstatus IS 'Import status: pending, processing, completed, failed';

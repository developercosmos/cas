-- Migration: Add LDAP user columns
-- Date: 2025-11-26
-- Description: Add columns to support LDAP user information

-- Add display name column
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS displayname VARCHAR(255);

-- Add LDAP distinguished name column
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS ldapdn TEXT;

-- Add LDAP groups column (stored as JSON)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS ldapgroups JSONB;

-- Add comments
COMMENT ON COLUMN auth.users.displayname IS 'User display name from LDAP or local';
COMMENT ON COLUMN auth.users.ldapdn IS 'LDAP Distinguished Name (DN) for LDAP users';
COMMENT ON COLUMN auth.users.ldapgroups IS 'LDAP group memberships as JSON array';

-- Constitution: LDAP Authentication System
-- Version: 2025112402
-- Description: Add LDAP configuration and user import tables

-- Constitution: Update users table to support LDAP
ALTER TABLE auth.users 
  ADD COLUMN AuthType VARCHAR(10) DEFAULT 'local',
  ADD COLUMN LdapDN VARCHAR(500),
  ADD COLUMN LdapGroups TEXT;

-- Constitution: Create LDAP configurations table
CREATE TABLE IF NOT EXISTS auth.ldap_configurations (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ServerUrl VARCHAR(255) NOT NULL,
    BaseDN VARCHAR(255) NOT NULL,
    BindDN VARCHAR(255) NOT NULL,
    BindPassword VARCHAR(255) NOT NULL,
    SearchFilter VARCHAR(255) DEFAULT '(objectClass=person)',
    SearchAttribute VARCHAR(100) DEFAULT 'uid',
    GroupAttribute VARCHAR(100) DEFAULT 'memberOf',
    IsSecure BOOLEAN DEFAULT FALSE,
    Port INTEGER DEFAULT 389,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Constitution: Create LDAP user imports tracking table
CREATE TABLE IF NOT EXISTS auth.ldap_user_imports (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    LdapDN VARCHAR(500),
    Username VARCHAR(100),
    Email VARCHAR(255),
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    DisplayName VARCHAR(255),
    LdapGroups TEXT,
    ImportStatus VARCHAR(20) DEFAULT 'pending' CHECK (ImportStatus IN ('pending', 'processing', 'completed', 'failed')),
    ImportErrors TEXT,
    CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Constitution: Add indexes following naming conventions
CREATE INDEX IF NOT EXISTS idx_ldap_configurations_active ON auth.ldap_configurations (IsActive);
CREATE INDEX IF NOT EXISTS idx_ldap_configurations_server ON auth.ldap_configurations (ServerUrl);
CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_status ON auth.ldap_user_imports (ImportStatus);
CREATE INDEX IF NOT EXISTS idx_ldap_user_imports_dn ON auth.ldap_user_imports (LdapDN);

-- Constitution: Default LDAP configuration
INSERT INTO auth.ldap_configurations (
    ServerUrl, BaseDN, BindDN, BindPassword, SearchFilter, SearchAttribute, GroupAttribute, IsSecure, Port, IsActive, CreatedAt, UpdatedAt
) VALUES (
    'ldap.example.com',
    'dc=example,dc=com',
    'cn=admin,dc=example,dc=com',
    'admin-password',
    '(objectClass=person)',
    'uid',
    'memberOf',
    FALSE,
    389,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Constitution: Update migration tracking
INSERT INTO auth.migration_history (MigrationVersion, MigrationName, IsApplied, AppliedAt)
VALUES (
    '2025112402',
    'add_ldap_tables',
    TRUE,
    NOW()
)
ON CONFLICT DO UPDATE SET 
    IsApplied = TRUE, 
    AppliedAt = NOW();

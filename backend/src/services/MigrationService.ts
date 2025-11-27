import { DatabaseService } from './DatabaseService.js';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  timestamp: Date;
}

export class MigrationService {
  private static readonly migrations: Migration[] = [
    {
      version: '2025112401',
      name: 'create_schema_and_tables',
      timestamp: new Date('2025-11-24T02:00:00Z'),
      up: `
        -- Constitution: All database objects MUST follow consistent naming conventions
        -- This migration creates the initial database schema
        
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Authentication Schema
        CREATE SCHEMA IF NOT EXISTS auth;
        
        -- Users table (Authentication)
        CREATE TABLE IF NOT EXISTS auth.users (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          Username VARCHAR(255) NOT NULL UNIQUE,
          Email VARCHAR(255) NOT NULL,
          PasswordHash VARCHAR(255) NOT NULL,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          DeletedAt TIMESTAMPTZ NULL
        );
        
        -- User Sessions table (Authentication)
        CREATE TABLE IF NOT EXISTS auth.user_sessions (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          TokenHash VARCHAR(255) NOT NULL,
          ExpiresAt TIMESTAMPTZ NOT NULL,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Dashboard Schema
        CREATE SCHEMA IF NOT EXISTS dashboard;
        
        -- User Settings table (Dashboard preferences)
        CREATE TABLE IF NOT EXISTS dashboard.user_settings (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          ThemePreference VARCHAR(20) DEFAULT 'dark',
          LanguagePreference VARCHAR(10) DEFAULT 'en',
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Canvas Layouts table (Dashboard layouts)
        CREATE TABLE IF NOT EXISTS dashboard.canvas_layouts (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          LayoutName VARCHAR(255) NOT NULL,
          LayoutData JSONB NOT NULL DEFAULT '{}',
          IsDefault BOOLEAN DEFAULT FALSE,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Plugin Schema
        CREATE SCHEMA IF NOT EXISTS plugin;
        
        -- Plugin Configurations table (Main plugin data)
        CREATE TABLE IF NOT EXISTS plugin.plugin_configurations (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          PluginId VARCHAR(255) NOT NULL UNIQUE,
          PluginName VARCHAR(255) NOT NULL,
          PluginVersion VARCHAR(50) NOT NULL,
          PluginDescription TEXT,
          PluginAuthor VARCHAR(255),
          PluginEntry VARCHAR(255) NOT NULL,
          PluginStatus VARCHAR(20) DEFAULT 'disabled',
          IsSystem BOOLEAN DEFAULT FALSE,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Plugin Master Data table (Reference data)
        CREATE TABLE IF NOT EXISTS plugin.plugin_md_color_schemes (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
          SchemeName VARCHAR(100) NOT NULL,
          SchemeData JSONB NOT NULL,
          IsDefault BOOLEAN DEFAULT FALSE,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Plugin Transaction Data table (Operational data)
        CREATE TABLE IF NOT EXISTS plugin.plugin_tx_user_preferences (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
          PreferenceKey VARCHAR(255) NOT NULL,
          PreferenceValue JSONB NOT NULL,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Plugin User Permissions table (Security)
        CREATE TABLE IF NOT EXISTS plugin.user_plugin_permissions (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
          PermissionName VARCHAR(100) NOT NULL,
          IsGranted BOOLEAN DEFAULT FALSE,
          GrantedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          GrantedBy UUID REFERENCES auth.users(Id),
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(UserId, PluginId, PermissionName)
        );
        
        -- Storage Schema
        CREATE SCHEMA IF NOT EXISTS storage;
        
        -- User Storage table (Sandboxed storage per user)
        CREATE TABLE IF NOT EXISTS storage.user_storage (
          Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          UserId UUID NOT NULL REFERENCES auth.users(Id) ON DELETE CASCADE,
          PluginId UUID NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
          StorageKey VARCHAR(255) NOT NULL,
          StorageValue JSONB NOT NULL,
          CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Constitution: Indexes MUST follow naming conventions
        CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(Email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON auth.users(Username);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(CreatedAt);
        
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth.user_sessions(UserId);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON auth.user_sessions(ExpiresAt);
        
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON dashboard.user_settings(UserId);
        
        CREATE INDEX IF NOT EXISTS idx_canvas_layouts_user_id ON dashboard.canvas_layouts(UserId);
        CREATE INDEX IF NOT EXISTS idx_canvas_layouts_default ON dashboard.canvas_layouts(UserId, IsDefault);
        
        CREATE INDEX IF NOT EXISTS idx_plugin_configurations_plugin_id ON plugin.plugin_configurations(PluginId);
        CREATE INDEX IF NOT EXISTS idx_plugin_configurations_status ON plugin.plugin_configurations(PluginStatus);
        
        CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON storage.user_storage(UserId);
        CREATE INDEX IF NOT EXISTS idx_user_storage_plugin_id ON storage.user_storage(PluginId);
        CREATE INDEX IF NOT EXISTS idx_user_storage_key ON storage.user_storage(UserId, StorageKey);
        
        CREATE INDEX IF NOT EXISTS idx_user_plugin_permissions_user_id ON plugin.user_plugin_permissions(UserId);
        CREATE INDEX IF NOT EXISTS idx_user_plugin_permissions_plugin_id ON plugin.user_plugin_permissions(PluginId);
        
        -- Constitution: Insert default system data
        INSERT INTO auth.users (Id, Username, Email, PasswordHash, CreatedAt, UpdatedAt)
        VALUES (
          uuid_generate_v4(),
          'admin',
          'admin@example.com',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          NOW(),
          NOW()
        ) ON CONFLICT (Username) DO NOTHING;
        
        INSERT INTO auth.users (Id, Username, Email, PasswordHash, CreatedAt, UpdatedAt)
        VALUES (
          uuid_generate_v4(),
          'demo',
          'demo@example.com',
          '$2a$10$OEfiONTa4JC8VG81tMG1d.FB1hZaCpa0JnsHFvph/V3PYhYUL.ADa',
          NOW(),
          NOW()
        ) ON CONFLICT (Username) DO NOTHING;
        
        -- Insert default text-block plugin configuration
        INSERT INTO plugin.plugin_configurations (Id, PluginId, PluginName, PluginVersion, PluginDescription, PluginAuthor, PluginEntry, PluginStatus, IsSystem, CreatedAt, UpdatedAt)
        VALUES (
          uuid_generate_v4(),
          'text-block',
          'Text Block',
          '1.0.0',
          'A simple text block plugin',
          'System',
          'TextBlockPlugin',
          'active',
          TRUE,
          NOW(),
          NOW()
        ) ON CONFLICT (PluginId) DO NOTHING;
      `,
      down: `
        -- Constitution: Rollback MUST be provided for all schema changes
        DROP SCHEMA IF EXISTS storage CASCADE;
        DROP SCHEMA IF EXISTS plugin CASCADE;
        DROP SCHEMA IF EXISTS dashboard CASCADE;
        DROP SCHEMA IF EXISTS auth CASCADE;
      `
    },
    {
      version: '2025112501',
      name: 'create_ldap_plugin_tables',
      timestamp: new Date('2025-11-25T14:00:00Z'),
      up: `
        -- Constitution: LDAP plugin tables follow consistent naming conventions
        -- Schema: plugin (for plugin-specific tables)
        
        -- LDAP Plugin Configuration table
        CREATE TABLE IF NOT EXISTS plugin.ldap_configurations (
            Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ServerUrl TEXT NOT NULL,
            BaseDN TEXT NOT NULL,
            BindDN TEXT NOT NULL,
            BindPassword TEXT NOT NULL,
            SearchBase TEXT,
            SearchFilter TEXT,
            SearchAttribute TEXT,
            UsernameAttribute TEXT,
            EmailAttribute TEXT,
            GroupAttribute TEXT,
            Port INTEGER DEFAULT 389,
            IsSecure BOOLEAN DEFAULT false,
            FollowReferrals BOOLEAN DEFAULT false,
            ConnectionTimeout INTEGER DEFAULT 30,
            Version TEXT DEFAULT 'LDAP v3',
            IsActive BOOLEAN DEFAULT true,
            CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- LDAP User Imports table (for tracking import operations)
        CREATE TABLE IF NOT EXISTS plugin.ldap_user_imports (
            Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ImportStatus TEXT NOT NULL DEFAULT 'pending',
            ImportedCount INTEGER DEFAULT 0,
            TotalCount INTEGER DEFAULT 0,
            ErrorDetails JSONB,
            SearchQuery TEXT,
            ConfigId UUID NOT NULL REFERENCES plugin.ldap_configurations(Id) ON DELETE CASCADE,
            UserId UUID REFERENCES auth.users(Id) ON DELETE CASCADE,
            CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- LDAP Imported Users table (for storing imported users)
        CREATE TABLE IF NOT EXISTS plugin.ldap_imported_users (
            Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ImportId UUID NOT NULL REFERENCES plugin.ldap_user_imports(Id) ON DELETE CASCADE,
            DistinguishedName TEXT NOT NULL,
            Username TEXT NOT NULL,
            Email TEXT,
            FirstName TEXT,
            LastName TEXT,
            DisplayName TEXT,
            Department TEXT,
            Title TEXT,
            Company TEXT,
            PhoneNumber TEXT,
            UserGroups JSONB,
            IsActive BOOLEAN DEFAULT true,
            RawAttributes JSONB,
            ConfigId UUID NOT NULL REFERENCES plugin.ldap_configurations(Id) ON DELETE CASCADE,
            CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(ImportId, DistinguishedName)
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_plugin_ldap_configurations_active ON plugin.ldap_configurations(IsActive) WHERE IsActive = true;
        CREATE INDEX IF NOT EXISTS idx_plugin_ldap_user_imports_status ON plugin.ldap_user_imports(ImportStatus);
        CREATE INDEX IF NOT EXISTS idx_plugin_ldap_imported_users_username ON plugin.ldap_imported_users(Username) WHERE IsActive = true;
        CREATE INDEX IF NOT EXISTS idx_plugin_ldap_imported_users_email ON plugin.ldap_imported_users(Email) WHERE Email IS NOT NULL AND IsActive = true;
        CREATE INDEX IF NOT EXISTS idx_plugin_ldap_imported_users_importid ON plugin.ldap_imported_users(ImportId);
      `,
      down: `
        DROP TABLE IF EXISTS plugin.ldap_imported_users CASCADE;
        DROP TABLE IF EXISTS plugin.ldap_user_imports CASCADE;
        DROP TABLE IF EXISTS plugin.ldap_configurations CASCADE;
      `
    },
    {
      version: '2025112701',
      name: 'create_plugin_documentation_table',
      timestamp: new Date('2025-11-27T10:00:00Z'),
      up: `
        -- Enable required extensions for documentation
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Plugin Documentation Table (Master Data)
        CREATE TABLE IF NOT EXISTS plugin.plugin_md_documentation (
            Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            PluginId UUID NOT NULL REFERENCES plugin.plugin_configurations(Id) ON DELETE CASCADE,
            DocumentType VARCHAR(50) NOT NULL CHECK (DocumentType IN ('readme', 'api', 'user_guide', 'installation', 'troubleshooting', 'changelog', 'examples')),
            Title VARCHAR(255) NOT NULL,
            Content TEXT NOT NULL,
            ContentFormat VARCHAR(20) DEFAULT 'markdown' CHECK (ContentFormat IN ('markdown', 'html', 'plain')),
            Language VARCHAR(10) DEFAULT 'en',
            Version VARCHAR(50),
            IsCurrent BOOLEAN DEFAULT FALSE,
            OrderIndex INTEGER DEFAULT 0,
            Metadata JSONB DEFAULT '{}',
            CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(PluginId, DocumentType, Language, Version)
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_plugin_id ON plugin.plugin_md_documentation(PluginId);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_type ON plugin.plugin_md_documentation(DocumentType);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_language ON plugin.plugin_md_documentation(Language);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_current ON plugin.plugin_md_documentation(PluginId, DocumentType, IsCurrent);
        CREATE INDEX IF NOT EXISTS idx_plugin_documentation_order ON plugin.plugin_md_documentation(PluginId, OrderIndex);
        
        -- Function to set current documentation version
        CREATE OR REPLACE FUNCTION plugin.set_current_documentation(
            p_plugin_id UUID,
            p_document_type VARCHAR(50),
            p_language VARCHAR(10) DEFAULT 'en'
        )
        RETURNS VOID AS $$
        BEGIN
            -- Update all documentation of this type and language to not current
            UPDATE plugin.plugin_md_documentation 
            SET IsCurrent = FALSE 
            WHERE PluginId = p_plugin_id 
            AND DocumentType = p_document_type 
            AND Language = p_language;
            
            -- Set the highest version as current
            UPDATE plugin.plugin_md_documentation 
            SET IsCurrent = TRUE 
            WHERE Id = (
                SELECT Id FROM plugin.plugin_md_documentation 
                WHERE PluginId = p_plugin_id 
                AND DocumentType = p_document_type 
                AND Language = p_language 
                ORDER BY Version DESC, CreatedAt DESC 
                LIMIT 1
            );
        END;
        $$ LANGUAGE plpgsql;
        
        -- Trigger to automatically update UpdatedAt
        CREATE OR REPLACE FUNCTION plugin.update_documentation_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.UpdatedAt = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER tr_plugin_documentation_updated_at
            BEFORE UPDATE ON plugin.plugin_md_documentation
            FOR EACH ROW
            EXECUTE FUNCTION plugin.update_documentation_timestamp();
        
        -- Insert default documentation for existing plugins
        INSERT INTO plugin.plugin_md_documentation (PluginId, DocumentType, Title, Content, Language, IsCurrent, OrderIndex)
        SELECT 
            pc.Id,
            'readme',
            pc.PluginName || ' Documentation',
            '# ' || pc.PluginName || '

## Description
' || COALESCE(pc.PluginDescription, 'No description available.') || '

## Version
' || pc.PluginVersion || '

## Author
' || COALESCE(pc.PluginAuthor, 'Unknown') || '

## Status
' || pc.PluginStatus || '

## Installation
This plugin is managed through the CAS plugin system.

## Usage
Use the Plugin Manager to enable/disable and configure this plugin.

## Support
For support and documentation updates, contact the plugin administrator.',
            'en',
            TRUE,
            0
        FROM plugin.plugin_configurations pc
        WHERE NOT EXISTS (
            SELECT 1 FROM plugin.plugin_md_documentation pd 
            WHERE pd.PluginId = pc.Id 
            AND pd.DocumentType = 'readme'
            AND pd.Language = 'en'
        );
        
        -- Comments for documentation
        COMMENT ON TABLE plugin.plugin_md_documentation IS 'Plugin documentation with versioning and multi-language support';
        COMMENT ON COLUMN plugin.plugin_md_documentation.DocumentType IS 'Type of documentation: readme, api, user_guide, installation, troubleshooting, changelog, examples';
        COMMENT ON COLUMN plugin.plugin_md_documentation.ContentFormat IS 'Format of content: markdown, html, plain';
        COMMENT ON COLUMN plugin.plugin_md_documentation.IsCurrent IS 'Indicates if this is the current version for display';
        COMMENT ON COLUMN plugin.plugin_md_documentation.OrderIndex IS 'Display order for documentation types';
      `,
      down: `
        DROP FUNCTION IF EXISTS plugin.set_current_documentation CASCADE;
        DROP FUNCTION IF EXISTS plugin.update_documentation_timestamp CASCADE;
        DROP TABLE IF EXISTS plugin.plugin_md_documentation CASCADE;
      `
    }
  ];

  static async initialize(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await DatabaseService.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          version VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Apply migrations in order
      for (const migration of this.migrations) {
        const alreadyApplied = await DatabaseService.queryOne(
          'SELECT version FROM migrations WHERE version = $1',
          [migration.version]
        );

        if (!alreadyApplied) {
          console.log(`🔄 Applying migration: ${migration.name} (${migration.version})`);
          
          try {
            await DatabaseService.execute(migration.up);
            await DatabaseService.execute(
              'INSERT INTO migrations (version, name) VALUES ($1, $2)',
              [migration.version, migration.name]
            );
            console.log(`✅ Migration applied: ${migration.name}`);
          } catch (error) {
            console.error(`❌ Migration failed: ${migration.name}`, error);
            throw error;
          }
        }
      }

      console.log('🎉 All migrations applied successfully');
    } catch (error) {
      console.error('💥 Migration initialization failed:', error);
      throw error;
    }
  }

  static async rollback(targetVersion?: string): Promise<void> {
    try {
      // Get applied migrations
      const appliedMigrations = await DatabaseService.query(
        'SELECT version, name FROM migrations ORDER BY version DESC'
      );

      // Find migrations to rollback
      const migrationsToRollback = this.migrations
        .filter(m => appliedMigrations.some(am => am.version === m.version))
        .filter(m => !targetVersion || m.version >= targetVersion);

      // Rollback in reverse order
      for (const migration of migrationsToRollback.reverse()) {
        console.log(`🔄 Rolling back migration: ${migration.name} (${migration.version})`);
        
        try {
          await DatabaseService.execute(migration.down);
          await DatabaseService.execute(
            'DELETE FROM migrations WHERE version = $1',
            [migration.version]
          );
          console.log(`✅ Migration rolled back: ${migration.name}`);
        } catch (error) {
          console.error(`❌ Rollback failed: ${migration.name}`, error);
          throw error;
        }
      }

      console.log('🎉 Rollback completed successfully');
    } catch (error) {
      console.error('💥 Rollback failed:', error);
      throw error;
    }
  }

  static async getStatus(): Promise<any[]> {
    return await DatabaseService.query(`
      SELECT m.version, m.name, m.applied_at, 
             CASE WHEN p.version IS NULL THEN false ELSE true END as applied
      FROM migrations m
      LEFT JOIN (SELECT unnest(string_to_array($1::text, ',')) as version) p 
        ON m.version = p.version
      ORDER BY m.version
    `, [this.migrations.map(m => m.version).join(',')]);
  }
}

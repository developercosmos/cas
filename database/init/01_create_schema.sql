-- Dashboard Database Schema
-- Following CBS Constitution naming conventions
-- Version: 1.0.0
-- Created: 2025-11-24

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

-- Indexes for performance (Following constitution naming)
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

-- Insert default admin user (hashed password: 'admin')
INSERT INTO auth.users (Id, Username, Email, PasswordHash, CreatedAt, UpdatedAt)
VALUES (
  uuid_generate_v4(),
  'admin',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NOW(),
  NOW()
) ON CONFLICT (Username) DO NOTHING;

-- Insert default demo user (hashed password: 'demo123')
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

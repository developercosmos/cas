-- Migration: 20251129_create_navigation_tables.sql
-- Create navigation plugin database tables following CAS Constitution standards
-- Naming conventions: md_ for master data, tx_ for transaction data

-- Create navigation_modules table (master data)
CREATE TABLE IF NOT EXISTS plugin.navigation_modules (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name VARCHAR(255) NOT NULL,
  Description TEXT,
  PluginId VARCHAR(255) NOT NULL,
  RequiresAuth BOOLEAN DEFAULT TRUE,
  RequiredPermissions TEXT[],
  Route VARCHAR(500),
  ExternalUrl VARCHAR(500),
  SortOrder INTEGER DEFAULT 100,
  Icon VARCHAR(100),
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CreatedBy UUID,
  UpdatedBy UUID,
  -- Constraints
  CONSTRAINT uc_navigation_modules_name UNIQUE (Name)
);

-- Create navigation_config table (master data)
CREATE TABLE IF NOT EXISTS plugin.navigation_config (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ConfigKey VARCHAR(255) NOT NULL UNIQUE,
  ConfigValue JSONB NOT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedBy UUID
);

-- Create navigation_user_preferences table (transaction data)
CREATE TABLE IF NOT EXISTS plugin.navigation_user_preferences (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  UserId UUID NOT NULL,
  FavoriteModules UUID[],
  RecentlyViewedModules UUID[],
  SortPreference VARCHAR(50) DEFAULT 'name',
  SearchHistory TEXT[],
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uc_navigation_user_prefs UNIQUE (UserId)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_navigation_modules_active
  ON plugin.navigation_modules(IsActive) WHERE IsActive = TRUE;

CREATE INDEX IF NOT EXISTS idx_navigation_modules_sort
  ON plugin.navigation_modules(SortOrder ASC, Name ASC);

CREATE INDEX IF NOT EXISTS idx_navigation_modules_plugin
  ON plugin.navigation_modules(PluginId);

CREATE INDEX IF NOT EXISTS idx_navigation_modules_search
  ON plugin.navigation_modules USING gin(to_tsvector('english', Name || ' ' || COALESCE(Description, '')));

CREATE INDEX IF NOT EXISTS idx_navigation_config_key
  ON plugin.navigation_config(ConfigKey);

CREATE INDEX IF NOT EXISTS idx_navigation_user_preferences_user
  ON plugin.navigation_user_preferences(UserId);

-- Create foreign key constraints (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE plugin.navigation_user_preferences
    ADD CONSTRAINT fk_navigation_user_prefs_user
    FOREIGN KEY (UserId) REFERENCES auth.users(Id) ON DELETE CASCADE;
  END IF;
END $$;

-- Insert default configuration
INSERT INTO plugin.navigation_config (ConfigKey, ConfigValue, CreatedAt, UpdatedAt)
VALUES (
  'default_settings',
  '{
    "enableKeyboardShortcut": true,
    "keyboardShortcut": "Ctrl+K",
    "maxItemsPerCategory": 50,
    "searchEnabled": true,
    "sortOptions": ["name", "plugin", "sortOrder"],
    "theme": "auto"
  }',
  NOW(),
  NOW()
) ON CONFLICT (ConfigKey) DO NOTHING;

-- Create audit trigger for navigation_modules
CREATE OR REPLACE FUNCTION plugin.navigation_modules_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.UpdatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_modules_updated_at
  BEFORE UPDATE ON plugin.navigation_modules
  FOR EACH ROW
  EXECUTE FUNCTION plugin.navigation_modules_audit_trigger();

-- Create audit trigger for navigation_config
CREATE TRIGGER navigation_config_updated_at
  BEFORE UPDATE ON plugin.navigation_config
  FOR EACH ROW
  EXECUTE FUNCTION plugin.navigation_modules_audit_trigger();

-- Create audit trigger for navigation_user_preferences
CREATE TRIGGER navigation_user_preferences_updated_at
  BEFORE UPDATE ON plugin.navigation_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION plugin.navigation_modules_audit_trigger();

-- Create audit table for navigation module changes (transaction data)
CREATE TABLE IF NOT EXISTS plugin.navigation_modules_audit (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ModuleId UUID NOT NULL,
  Action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  OldValues JSONB,
  NewValues JSONB,
  ChangedBy UUID,
  ChangedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigation_modules_audit_module
  ON plugin.navigation_modules_audit(ModuleId);

CREATE INDEX IF NOT EXISTS idx_navigation_modules_audit_date
  ON plugin.navigation_modules_audit(ChangedAt);

-- Create audit trigger for module changes
CREATE OR REPLACE FUNCTION plugin.navigation_modules_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO plugin.navigation_modules_audit (ModuleId, Action, NewValues, ChangedBy)
    VALUES (NEW.Id, 'INSERT', row_to_json(NEW), NEW.UpdatedBy);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO plugin.navigation_modules_audit (ModuleId, Action, OldValues, NewValues, ChangedBy)
    VALUES (NEW.Id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.UpdatedBy);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO plugin.navigation_modules_audit (ModuleId, Action, OldValues, ChangedBy)
    VALUES (OLD.Id, 'DELETE', row_to_json(OLD), OLD.UpdatedBy);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_modules_audit
  AFTER INSERT OR UPDATE OR DELETE ON plugin.navigation_modules
  FOR EACH ROW
  EXECUTE FUNCTION plugin.navigation_modules_change_trigger();

-- Grant necessary permissions (adjust as needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cas_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON plugin.navigation_modules TO cas_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON plugin.navigation_config TO cas_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON plugin.navigation_user_preferences TO cas_app;
    GRANT SELECT, INSERT ON plugin.navigation_modules_audit TO cas_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA plugin TO cas_app;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE plugin.navigation_modules IS 'Master data table for navigation modules accessible to users';
COMMENT ON TABLE plugin.navigation_config IS 'Master data table for navigation system configuration';
COMMENT ON TABLE plugin.navigation_user_preferences IS 'Transaction data table for user-specific navigation preferences';
COMMENT ON TABLE plugin.navigation_modules_audit IS 'Transaction data table for tracking navigation module changes';

-- Rollback section for reference
-- ROLLBACK: DROP TABLE IF EXISTS plugin.navigation_modules_audit CASCADE;
-- ROLLBACK: DROP TABLE IF EXISTS plugin.navigation_user_preferences CASCADE;
-- ROLLBACK: DROP TABLE IF EXISTS plugin.navigation_config CASCADE;
-- ROLLBACK: DROP TABLE IF EXISTS plugin.navigation_modules CASCADE;
-- ROLLBACK: DROP FUNCTION IF EXISTS plugin.navigation_modules_audit_trigger() CASCADE;
-- ROLLBACK: DROP FUNCTION IF EXISTS plugin.navigation_modules_change_trigger() CASCADE;

-- Migration System Tables
-- Constitution: Create comprehensive migration tracking system
-- Version: 1.0.0
-- Created: 2025-11-28

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration tracking schema
CREATE SCHEMA IF NOT EXISTS migration;

-- Migration execution log (tracks all migration executions)
CREATE TABLE IF NOT EXISTS migration.execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_id VARCHAR(255) NOT NULL,
    plugin_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled_back')),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    error_details JSONB DEFAULT '{}',
    changes_made JSONB DEFAULT '{}',
    rollback_available BOOLEAN DEFAULT FALSE,
    backup_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(migration_id, plugin_id, direction, session_id)
);

-- Migration step execution log (detailed step tracking)
CREATE TABLE IF NOT EXISTS migration.step_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID NOT NULL REFERENCES migration.execution_log(id) ON DELETE CASCADE,
    step_id VARCHAR(255) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    success BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    sql_executed TEXT,
    rows_affected INTEGER,
    error_details JSONB DEFAULT '{}',
    rollback_available BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration dependency tracking (manages migration dependencies)
CREATE TABLE IF NOT EXISTS migration.dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_id VARCHAR(255) NOT NULL,
    plugin_id VARCHAR(255) NOT NULL,
    depends_on_migration_id VARCHAR(255) NOT NULL,
    depends_on_plugin_id VARCHAR(255) NOT NULL,
    depends_on_version VARCHAR(50) NOT NULL,
    optional BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(migration_id, depends_on_migration_id)
);

-- Migration conflict tracking (detects and tracks conflicts)
CREATE TABLE IF NOT EXISTS migration.conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_id1 VARCHAR(255) NOT NULL,
    migration_id2 VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolution TEXT,
    auto_resolvable BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(migration_id1, migration_id2, conflict_type)
);

-- Migration backup tracking (manages migration backups)
CREATE TABLE IF NOT EXISTS migration.backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_id VARCHAR(255) NOT NULL,
    plugin_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'schema', 'data', 'incremental')),
    location TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    compression VARCHAR(20),
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Data export/import tracking (manages data portability)
CREATE TABLE IF NOT EXISTS migration.data_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('export', 'import')),
    version VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'sql', 'csv')),
    location TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    records_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}'
);

-- Migration template tracking (stores migration templates)
CREATE TABLE IF NOT EXISTS migration.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration schedule tracking (for scheduled migrations)
CREATE TABLE IF NOT EXISTS migration.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_id VARCHAR(255) NOT NULL,
    plugin_id VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'conditional')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    conditions JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'executed', 'failed', 'cancelled')),
    execution_log_id UUID REFERENCES migration.execution_log(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration statistics (for performance tracking)
CREATE TABLE IF NOT EXISTS migration.statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plugin_id VARCHAR(255) NOT NULL,
    stat_date DATE NOT NULL,
    migrations_executed INTEGER DEFAULT 0,
    migrations_failed INTEGER DEFAULT 0,
    migrations_rolled_back INTEGER DEFAULT 0,
    avg_execution_time DECIMAL(10,2) DEFAULT 0,
    total_records_migrated BIGINT DEFAULT 0,
    backup_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(plugin_id, stat_date)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_execution_log_migration ON migration.execution_log(migration_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_plugin ON migration.execution_log(plugin_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_session ON migration.execution_log(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_status ON migration.execution_log(status);
CREATE INDEX IF NOT EXISTS idx_execution_log_started_at ON migration.execution_log(started_at);
CREATE INDEX IF NOT EXISTS idx_execution_log_user ON migration.execution_log(user_id);

CREATE INDEX IF NOT EXISTS idx_step_log_execution ON migration.step_log(execution_log_id);
CREATE INDEX IF NOT EXISTS idx_step_log_step_id ON migration.step_log(step_id);
CREATE INDEX IF NOT EXISTS idx_step_log_status ON migration.step_log(status);
CREATE INDEX IF NOT EXISTS idx_step_log_started_at ON migration.step_log(started_at);

CREATE INDEX IF NOT EXISTS idx_dependencies_migration ON migration.dependencies(migration_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON migration.dependencies(depends_on_migration_id);

CREATE INDEX IF NOT EXISTS idx_conflicts_migrations ON migration.conflicts(migration_id1, migration_id2);
CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON migration.conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON migration.conflicts(severity);

CREATE INDEX IF NOT EXISTS idx_backups_migration ON migration.backups(migration_id);
CREATE INDEX IF NOT EXISTS idx_backups_plugin ON migration.backups(plugin_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON migration.backups(created_at);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON migration.backups(expires_at);

CREATE INDEX IF NOT EXISTS idx_data_transfers_plugin ON migration.data_transfers(plugin_id);
CREATE INDEX IF NOT EXISTS idx_data_transfers_type ON migration.data_transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_data_transfers_status ON migration.data_transfers(status);
CREATE INDEX IF NOT EXISTS idx_data_transfers_created_at ON migration.data_transfers(created_at);

CREATE INDEX IF NOT EXISTS idx_templates_category ON migration.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_system ON migration.templates(is_system);

CREATE INDEX IF NOT EXISTS idx_schedules_migration ON migration.schedules(migration_id);
CREATE INDEX IF NOT EXISTS idx_schedules_plugin ON migration.schedules(plugin_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON migration.schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at ON migration.schedules(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_statistics_plugin_date ON migration.statistics(plugin_id, stat_date);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION migration.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_execution_log_updated_at
    BEFORE UPDATE ON migration.execution_log
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_step_log_updated_at
    BEFORE UPDATE ON migration.step_log
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_dependencies_updated_at
    BEFORE UPDATE ON migration.dependencies
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_conflicts_updated_at
    BEFORE UPDATE ON migration.conflicts
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_templates_updated_at
    BEFORE UPDATE ON migration.templates
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_schedules_updated_at
    BEFORE UPDATE ON migration.schedules
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

CREATE TRIGGER tr_statistics_updated_at
    BEFORE UPDATE ON migration.statistics
    FOR EACH ROW
    EXECUTE FUNCTION migration.update_timestamp();

-- Functions for migration management

-- Function to get migration execution summary
CREATE OR REPLACE FUNCTION migration.get_execution_summary(
    p_plugin_id VARCHAR(255) DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_migrations BIGINT,
    successful_migrations BIGINT,
    failed_migrations BIGINT,
    avg_execution_time DECIMAL(10,2),
    total_records_migrated BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_migrations,
        COUNT(*) FILTER (WHERE success = TRUE) as successful_migrations,
        COUNT(*) FILTER (WHERE success = FALSE) as failed_migrations,
        AVG(duration_seconds) as avg_execution_time,
        COALESCE(SUM((changes_made->>'rowsInserted')::BIGINT) +
                SUM((changes_made->>'rowsUpdated')::BIGINT) +
                SUM((changes_made->>'rowsDeleted')::BIGINT), 0) as total_records_migrated
    FROM migration.execution_log
    WHERE (p_plugin_id IS NULL OR plugin_id = p_plugin_id)
      AND (p_date_from IS NULL OR started_at >= p_date_from)
      AND (p_date_to IS NULL OR started_at <= p_date_to);
END;
$$ LANGUAGE plpgsql;

-- Function to get pending migrations for plugin
CREATE OR REPLACE FUNCTION migration.get_pending_migrations(
    p_plugin_id VARCHAR(255)
)
RETURNS TABLE (
    migration_id VARCHAR(255),
    version VARCHAR(50),
    name VARCHAR(255),
    risk_level VARCHAR(20),
    estimated_duration INTEGER,
    requires_backup BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        el.migration_id,
        el.version,
        'Migration' as name,
        'medium' as risk_level,
        60 as estimated_duration,
        FALSE as requires_backup
    FROM migration.execution_log el
    WHERE el.plugin_id = p_plugin_id
      AND el.status = 'pending'
    ORDER BY el.version;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old backups
CREATE OR REPLACE FUNCTION migration.cleanup_old_backups(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM migration.backups
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_old
      OR (expires_at IS NOT NULL AND expires_at < NOW());

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate migration statistics
CREATE OR REPLACE FUNCTION migration.generate_daily_statistics()
RETURNS VOID AS $$
BEGIN
    INSERT INTO migration.statistics (
        plugin_id,
        stat_date,
        migrations_executed,
        migrations_failed,
        migrations_rolled_back,
        avg_execution_time,
        total_records_migrated,
        backup_size_bytes
    )
    SELECT
        plugin_id,
        CURRENT_DATE - INTERVAL '1 day' as stat_date,
        COUNT(*) as migrations_executed,
        COUNT(*) FILTER (WHERE success = FALSE) as migrations_failed,
        COUNT(*) FILTER (WHERE status = 'rolled_back') as migrations_rolled_back,
        COALESCE(AVG(duration_seconds), 0) as avg_execution_time,
        COALESCE(SUM((changes_made->>'rowsInserted')::BIGINT) +
                SUM((changes_made->>'rowsUpdated')::BIGINT) +
                SUM((changes_made->>'rowsDeleted')::BIGINT), 0) as total_records_migrated,
        COALESCE(SUM(size_bytes), 0) as backup_size_bytes
    FROM migration.execution_log el
    LEFT JOIN migration.backups b ON el.backup_id = b.id
    WHERE DATE(el.started_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY plugin_id
    ON CONFLICT (plugin_id, stat_date) DO UPDATE SET
        migrations_executed = EXCLUDED.migrations_executed,
        migrations_failed = EXCLUDED.migrations_failed,
        migrations_rolled_back = EXCLUDED.migrations_rolled_back,
        avg_execution_time = EXCLUDED.avg_execution_time,
        total_records_migrated = EXCLUDED.total_records_migrated,
        backup_size_bytes = EXCLUDED.backup_size_bytes,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert default migration templates
INSERT INTO migration.templates (name, description, category, template_data, is_system) VALUES
('create_table', 'Template for creating new tables', 'schema', '{
  "type": "schema",
  "steps": [
    {
      "id": "create_table",
      "name": "Create Table",
      "type": "schema",
      "sql": {
        "universal": "CREATE TABLE {{table_name}} (\\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\\n);",
        "mysql": "CREATE TABLE {{table_name}} (\\n  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),\\n  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\\n  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\\n);"
      },
      "transactional": true,
      "rollbackSupported": true
    }
  ]
}', true),

('add_column', 'Template for adding columns to existing tables', 'schema', '{
  "type": "schema",
  "steps": [
    {
      "id": "add_column",
      "name": "Add Column",
      "type": "schema",
      "sql": {
        "universal": "ALTER TABLE {{table_name}} ADD COLUMN {{column_name}} {{column_type}} {{nullable}};",
        "mysql": "ALTER TABLE {{table_name}} ADD COLUMN {{column_name}} {{column_type}} {{nullable}};"
      },
      "transactional": true,
      "rollbackSupported": true
    }
  ]
}', true),

('data_migration', 'Template for migrating data between tables', 'data', '{
  "type": "data",
  "steps": [
    {
      "id": "data_migration",
      "name": "Migrate Data",
      "type": "data",
      "transform": {
        "source": "{{source_table}}",
        "target": "{{target_table}}",
        "mapping": [
          {"source": "id", "target": "id", "required": true},
          {"source": "created_at", "target": "created_at", "required": true},
          {"source": "updated_at", "target": "updated_at", "required": true}
        ],
        "batchSize": 1000
      },
      "transactional": true,
      "rollbackSupported": false
    }
  ]
}', true);

-- Comments
COMMENT ON SCHEMA migration IS 'Migration tracking and management system';
COMMENT ON TABLE migration.execution_log IS 'Tracks all migration executions with detailed status and results';
COMMENT ON TABLE migration.step_log IS 'Detailed tracking of individual migration steps';
COMMENT ON TABLE migration.dependencies IS 'Manages dependencies between migrations';
COMMENT ON TABLE migration.conflicts IS 'Detects and tracks migration conflicts';
COMMENT ON TABLE migration.backups IS 'Tracks migration backups and their locations';
COMMENT ON TABLE migration.data_transfers IS 'Manages data export/import operations';
COMMENT ON TABLE migration.templates IS 'Stores reusable migration templates';
COMMENT ON TABLE migration.schedules IS 'Manages scheduled migration executions';
COMMENT ON TABLE migration.statistics IS 'Daily migration statistics for performance monitoring';

COMMIT;
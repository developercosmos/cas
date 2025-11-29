-- Migration: Fix Communication Table Name Spelling
-- Version: 1.0.1
-- Description: Rename misspelled table to correct spelling

-- Rename the misspelled table to the correct name
ALTER TABLE plugin.plugin_communication_audit RENAME TO plugin.plugin_communication_audit;

-- Update indexes with correct table name
DROP INDEX IF EXISTS plugin.idx_plugin_communication_audit_timestamp;
DROP INDEX IF EXISTS plugin.idx_plugin_communication_audit_from_to;
DROP INDEX IF EXISTS plugin.idx_plugin_communication_audit_user;

CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_timestamp 
ON plugin.plugin_communication_audit(Timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_from_to 
ON plugin.plugin_communication_audit(FromPluginId, ToPluginId);

CREATE INDEX IF NOT EXISTS idx_plugin_communication_audit_user 
ON plugin.plugin_communication_audit(UserId);

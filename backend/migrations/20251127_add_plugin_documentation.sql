-- Plugin Documentation Database Schema
-- Constitution: Follow CAS naming conventions
-- Version: 1.0.0
-- Created: 2025-11-27

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

-- Function to get all documentation for a plugin
CREATE OR REPLACE FUNCTION plugin.get_plugin_documentation(
    p_plugin_id UUID,
    p_language VARCHAR(10) DEFAULT 'en',
    p_include_versions BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    Id UUID,
    DocumentType VARCHAR(50),
    Title VARCHAR(255),
    Content TEXT,
    ContentFormat VARCHAR(20),
    Language VARCHAR(10),
    Version VARCHAR(50),
    IsCurrent BOOLEAN,
    OrderIndex INTEGER,
    Metadata JSONB,
    CreatedAt TIMESTAMPTZ,
    UpdatedAt TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.Id,
        pd.DocumentType,
        pd.Title,
        pd.Content,
        pd.ContentFormat,
        pd.Language,
        pd.Version,
        pd.IsCurrent,
        pd.OrderIndex,
        pd.Metadata,
        pd.CreatedAt,
        pd.UpdatedAt
    FROM plugin.plugin_md_documentation pd
    WHERE pd.PluginId = p_plugin_id
    AND pd.Language = p_language
    AND (p_include_versions OR pd.IsCurrent = TRUE)
    ORDER BY pd.OrderIndex, pd.DocumentType, pd.Version DESC;
END;
$$ LANGUAGE plpgsql;

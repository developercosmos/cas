import { DatabaseService } from './DatabaseService.js';

export interface PluginDocumentation {
  id: string;
  pluginId: string;
  documentType: 'readme' | 'api' | 'user_guide' | 'installation' | 'troubleshooting' | 'changelog' | 'examples';
  title: string;
  content: string;
  contentFormat: 'markdown' | 'html' | 'plain';
  language: string;
  version?: string;
  isCurrent: boolean;
  orderIndex: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentationRequest {
  pluginId: string;
  documentType: PluginDocumentation['documentType'];
  title: string;
  content: string;
  contentFormat?: PluginDocumentation['contentFormat'];
  language?: string;
  version?: string;
  isCurrent?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentationRequest {
  title?: string;
  content?: string;
  contentFormat?: PluginDocumentation['contentFormat'];
  version?: string;
  isCurrent?: boolean;
  orderIndex?: number;
  metadata?: Record<string, any>;
}

export class PluginDocumentationService {
  /**
   * Create new documentation for a plugin
   */
  static async create(request: CreateDocumentationRequest): Promise<PluginDocumentation> {
    const {
      pluginId,
      documentType,
      title,
      content,
      contentFormat = 'markdown',
      language = 'en',
      version,
      isCurrent = true,
      orderIndex = 0,
      metadata = {}
    } = request;

    // If this should be current, unset other current versions
    if (isCurrent) {
      await this.unsetCurrentVersions(pluginId, documentType, language);
    }

    const result = await DatabaseService.queryOne<{ id: string }>(
      `INSERT INTO plugin.plugin_md_documentation 
       (PluginId, DocumentType, Title, Content, ContentFormat, Language, Version, IsCurrent, OrderIndex, Metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING Id`,
      [pluginId, documentType, title, content, contentFormat, language, version, isCurrent, orderIndex, JSON.stringify(metadata)]
    );

    const documentation = await this.getById(result!.id);
    if (!documentation) {
      throw new Error('Failed to retrieve created documentation');
    }

    return documentation;
  }

  /**
   * Update existing documentation
   */
  static async update(id: string, request: UpdateDocumentationRequest): Promise<PluginDocumentation> {
    const {
      title,
      content,
      contentFormat,
      version,
      isCurrent,
      orderIndex,
      metadata
    } = request;

    // Get current documentation to check if we need to update current flag
    const currentDoc = await this.getById(id);
    if (!currentDoc) {
      throw new Error('Documentation not found');
    }

    // If this should be current, unset other current versions
    if (isCurrent && !currentDoc.isCurrent) {
      await this.unsetCurrentVersions(currentDoc.pluginId, currentDoc.documentType, currentDoc.language);
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`Title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push(`Content = $${paramIndex++}`);
      updateValues.push(content);
    }
    if (contentFormat !== undefined) {
      updateFields.push(`ContentFormat = $${paramIndex++}`);
      updateValues.push(contentFormat);
    }
    if (version !== undefined) {
      updateFields.push(`Version = $${paramIndex++}`);
      updateValues.push(version);
    }
    if (isCurrent !== undefined) {
      updateFields.push(`IsCurrent = $${paramIndex++}`);
      updateValues.push(isCurrent);
    }
    if (orderIndex !== undefined) {
      updateFields.push(`OrderIndex = $${paramIndex++}`);
      updateValues.push(orderIndex);
    }
    if (metadata !== undefined) {
      updateFields.push(`Metadata = $${paramIndex++}`);
      updateValues.push(JSON.stringify(metadata));
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`UpdatedAt = NOW()`);
    updateValues.push(id);

    await DatabaseService.execute(
      `UPDATE plugin.plugin_md_documentation 
       SET ${updateFields.join(', ')}
       WHERE Id = $${paramIndex}`,
      updateValues
    );

    const documentation = await this.getById(id);
    if (!documentation) {
      throw new Error('Failed to retrieve updated documentation');
    }

    return documentation;
  }

  /**
   * Get documentation by ID
   */
  static async getById(id: string): Promise<PluginDocumentation | null> {
    const result = await DatabaseService.queryOne<any>(
      `SELECT 
        Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, 
        Version, IsCurrent, OrderIndex, Metadata, CreatedAt, UpdatedAt
       FROM plugin.plugin_md_documentation
       WHERE Id = $1`,
      [id]
    );

    return result ? this.mapToDocumentation(result) : null;
  }

  /**
   * Get all documentation for a plugin
   */
  static async getByPluginId(
    pluginId: string, 
    language: string = 'en', 
    includeVersions: boolean = false
  ): Promise<PluginDocumentation[]> {
    const results = await DatabaseService.query<any>(
      `SELECT 
        Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, 
        Version, IsCurrent, OrderIndex, Metadata, CreatedAt, UpdatedAt
       FROM plugin.plugin_md_documentation
       WHERE PluginId = $1
       AND Language = $2
       AND ($3 OR IsCurrent = TRUE)
       ORDER BY OrderIndex, DocumentType, Version DESC`,
      [pluginId, language, includeVersions]
    );

    return results.map(doc => this.mapToDocumentation(doc));
  }

  /**
   * Get current documentation by type
   */
  static async getByType(
    pluginId: string, 
    documentType: PluginDocumentation['documentType'], 
    language: string = 'en'
  ): Promise<PluginDocumentation | null> {
    const result = await DatabaseService.queryOne<any>(
      `SELECT 
        Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, 
        Version, IsCurrent, OrderIndex, Metadata, CreatedAt, UpdatedAt
       FROM plugin.plugin_md_documentation
       WHERE PluginId = $1
       AND DocumentType = $2
       AND Language = $3
       AND IsCurrent = TRUE
       ORDER BY Version DESC, CreatedAt DESC
       LIMIT 1`,
      [pluginId, documentType, language]
    );

    return result ? this.mapToDocumentation(result) : null;
  }

  /**
   * Get all documentation types for a plugin
   */
  static async getAvailableTypes(pluginId: string, language: string = 'en'): Promise<PluginDocumentation['documentType'][]> {
    const results = await DatabaseService.query<{ documenttype: string }>(
      `SELECT DISTINCT DocumentType
       FROM plugin.plugin_md_documentation
       WHERE PluginId = $1
       AND Language = $2
       AND IsCurrent = TRUE`,
      [pluginId, language]
    );

    return results.map(row => row.documenttype as PluginDocumentation['documentType']);
  }

  /**
   * Delete documentation by ID
   */
  static async delete(id: string): Promise<boolean> {
    const result = await DatabaseService.execute(
      'DELETE FROM plugin.plugin_md_documentation WHERE Id = $1',
      [id]
    );

    return result !== undefined;
  }

  /**
   * Delete all documentation for a plugin (called on plugin uninstall)
   */
  static async deleteByPluginId(pluginId: string): Promise<number> {
    // First get the UUID for this plugin ID
    const pluginConfig = await DatabaseService.queryOne<{ id: string }>(
      'SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1',
      [pluginId]
    );

    if (!pluginConfig) {
      return 0; // Plugin not found, no documentation to delete
    }

    const result = await DatabaseService.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM plugin.plugin_md_documentation 
       WHERE PluginId = $1`,
      [pluginConfig.id]
    );

    await DatabaseService.execute(
      'DELETE FROM plugin.plugin_md_documentation WHERE PluginId = $1',
      [pluginConfig.id]
    );

    return result?.count || 0;
  }

  /**
   * Set documentation as current version
   */
  static async setCurrent(id: string): Promise<PluginDocumentation> {
    const doc = await this.getById(id);
    if (!doc) {
      throw new Error('Documentation not found');
    }

    await this.unsetCurrentVersions(doc.pluginId, doc.documentType, doc.language);

    await DatabaseService.execute(
      'UPDATE plugin.plugin_md_documentation SET IsCurrent = TRUE WHERE Id = $1',
      [id]
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated documentation');
    }

    return updated;
  }

  /**
   * Get documentation with search functionality
   */
  static async search(
    pluginId: string,
    query: string,
    language: string = 'en'
  ): Promise<PluginDocumentation[]> {
    const results = await DatabaseService.query<any>(
      `SELECT 
        Id, PluginId, DocumentType, Title, Content, ContentFormat, Language, 
        Version, IsCurrent, OrderIndex, Metadata, CreatedAt, UpdatedAt
       FROM plugin.plugin_md_documentation
       WHERE PluginId = $1
       AND Language = $2
       AND IsCurrent = TRUE
       AND (
         Title ILIKE $3 OR 
         Content ILIKE $3
       )
       ORDER BY OrderIndex, DocumentType`,
      [pluginId, language, `%${query}%`]
    );

    return results.map(doc => this.mapToDocumentation(doc));
  }

  /**
   * Get all plugins with documentation summary
   */
  static async getPluginDocumentationSummary(language: string = 'en'): Promise<Array<{
    pluginId: string;
    pluginName: string;
    documentTypes: PluginDocumentation['documentType'][];
    lastUpdated: string;
  }>> {
    const results = await DatabaseService.query<any>(
      `SELECT 
        pc.Id as pluginId,
        pc.PluginName as pluginName,
        ARRAY_AGG(DISTINCT pd.DocumentType) as documentTypes,
        MAX(pd.UpdatedAt) as lastUpdated
       FROM plugin.plugin_configurations pc
       LEFT JOIN plugin.plugin_md_documentation pd ON pc.Id = pd.PluginId 
       WHERE (pd.Language = $1 OR pd.Language IS NULL)
       GROUP BY pc.Id, pc.PluginName
       ORDER BY pc.PluginName`,
      [language]
    );

    return results.map(row => ({
      pluginId: row.pluginid,
      pluginName: row.pluginname,
      documentTypes: row.documenttypes || [],
      lastUpdated: row.lastupdated
    }));
  }

  /**
   * Helper method to unset current versions
   */
  private static async unsetCurrentVersions(
    pluginId: string, 
    documentType: PluginDocumentation['documentType'], 
    language: string
  ): Promise<void> {
    await DatabaseService.execute(
      `UPDATE plugin.plugin_md_documentation 
       SET IsCurrent = FALSE 
       WHERE PluginId = $1 
       AND DocumentType = $2 
       AND Language = $3`,
      [pluginId, documentType, language]
    );
  }

  /**
   * Map database row to PluginDocumentation interface
   */
  private static mapToDocumentation(row: any): PluginDocumentation {
    return {
      id: row.id,
      pluginId: row.pluginid,
      documentType: row.documenttype,
      title: row.title,
      content: row.content,
      contentFormat: row.contentformat,
      language: row.language,
      version: row.version,
      isCurrent: row.iscurrent,
      orderIndex: row.orderindex,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.createdat,
      updatedAt: row.updatedat
    };
  }
}

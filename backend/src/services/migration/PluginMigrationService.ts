import { PortableMigrationEngine } from './PortableMigrationEngine.js';
import { MigrationFormatAdapter } from './MigrationFormatAdapter.js';
import {
  PortableMigration,
  MigrationExecutionContext,
  MigrationResult,
  MigrationPlan,
  DataExport,
  DataImport,
  MigrationType,
  DatabaseEngine,
  RiskLevel,
  MigrationConflict
} from './types.js';
import { DatabaseService } from '../DatabaseService.js';
import { PluginService } from '../PluginService.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Plugin Migration Service
 * High-level service for managing plugin migrations with portability features
 */
export class PluginMigrationService {
  private migrationEngine: PortableMigrationEngine;
  private pluginService: PluginService;
  private migrationRegistry: Map<string, PortableMigration[]> = new Map();

  constructor() {
    this.migrationEngine = PortableMigrationEngine.getInstance();
    this.pluginService = new PluginService();
    this.initializeRegistry();
  }

  /**
   * Initialize migration registry
   */
  private async initializeRegistry(): Promise<void> {
    try {
      // Load migrations from plugin directories
      await this.loadPluginMigrations();
      console.log('📚 Plugin migration registry initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration registry:', error);
    }
  }

  /**
   * Load migrations from all installed plugins
   */
  private async loadPluginMigrations(): Promise<void> {
    const plugins = await this.pluginService.listPlugins();

    for (const plugin of plugins) {
      try {
        const migrations = await this.loadPluginMigrationsFromFile(plugin.id);
        this.migrationRegistry.set(plugin.id, migrations);
      } catch (error) {
        console.warn(`⚠️ Failed to load migrations for plugin ${plugin.id}:`, error);
      }
    }
  }

  /**
   * Load migrations from plugin migration files
   */
  private async loadPluginMigrationsFromFile(pluginId: string): Promise<PortableMigration[]> {
    const migrations: PortableMigration[] = [];

    // Search for migration files in plugin directory
    const pluginPath = path.join(process.cwd(), 'plugins', pluginId, 'migrations');

    try {
      const files = await fs.readdir(pluginPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
        .sort(); // Ensure proper order

      for (const file of migrationFiles) {
        try {
          const filePath = path.join(pluginPath, file);
          const content = await fs.readFile(filePath, 'utf-8');

          if (file.endsWith('.json')) {
            const migration = MigrationFormatAdapter.fromJSON(content);
            migrations.push(migration);
          } else if (file.endsWith('.sql')) {
            // Convert SQL migration to portable format
            const migration = this.convertSQLFileToPortable(content, pluginId, file);
            migrations.push(migration);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load migration file ${file}:`, error);
        }
      }
    } catch (error) {
      // Plugin directory might not exist or have migrations
      console.log(`ℹ️ No migrations found for plugin ${pluginId}`);
    }

    return migrations;
  }

  /**
   * Convert SQL migration file to portable format
   */
  private convertSQLFileToPortable(sqlContent: string, pluginId: string, filename: string): PortableMigration {
    const version = this.extractVersionFromFilename(filename);
    const name = this.extractNameFromFilename(filename);

    // Split SQL into up/down migrations
    const { up, down } = this.splitSQLContent(sqlContent);

    const steps = this.parseSQLToSteps(up);

    return {
      id: `migration_${pluginId}_${version}`,
      pluginId,
      version,
      name,
      type: MigrationType.SCHEMA,
      dependencies: [],
      conflicts: [],
      up: steps,
      down: this.parseSQLToSteps(down),
      category: 'install',
      estimatedDuration: this.estimateMigrationDuration(steps),
      riskLevel: this.assessMigrationRisk(steps),
      requiresBackup: this.requiresBackup(steps),
      databaseEngines: [DatabaseEngine.POSTGRESQL],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractVersionFromFilename(filename: string): string {
    const match = filename.match(/(\d{8}_\d{4})/);
    return match ? match[1] : '1.0.0';
  }

  private extractNameFromFilename(filename: string): string {
    const base = path.basename(filename, path.extname(filename));
    return base.replace(/^\d{8}_\d{4}_/, '').replace(/_/g, ' ');
  }

  private splitSQLContent(sqlContent: string): { up: string; down: string } {
    const sections = sqlContent.split(/^--\s*DOWN\b/mi);
    return {
      up: sections[0].replace(/^--\s*UP\b/mi, '').trim(),
      down: sections[1] ? sections[1].trim() : ''
    };
  }

  private parseSQLToSteps(sql: string): any[] {
    if (!sql.trim()) return [];

    // Split SQL into individual statements
    const statements = sql.split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/);
    const steps: any[] = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        steps.push({
          id: `step_${i + 1}`,
          type: this.inferStepType(statement),
          name: `Step ${i + 1}`,
          sql: {
            universal: statement + (statement.endsWith(';') ? '' : ';')
          },
          transactional: true,
          rollbackSupported: this.isRollbackSupported(statement),
          skipOnError: false,
          dependencies: []
        });
      }
    }

    return steps;
  }

  private inferStepType(sql: string): MigrationType {
    const upperSql = sql.toUpperCase();

    if (upperSql.includes('CREATE TABLE') || upperSql.includes('ALTER TABLE')) {
      return MigrationType.SCHEMA;
    } else if (upperSql.includes('CREATE INDEX')) {
      return MigrationType.INDEX;
    } else if (upperSql.includes('INSERT INTO')) {
      return MigrationType.DATA;
    } else if (upperSql.includes('CREATE FUNCTION')) {
      return MigrationType.FUNCTION;
    } else if (upperSql.includes('CREATE TRIGGER')) {
      return MigrationType.TRIGGER;
    } else if (upperSql.includes('CREATE VIEW')) {
      return MigrationType.VIEW;
    }

    return MigrationType.SCHEMA;
  }

  private isRollbackSupported(sql: string): boolean {
    const upperSql = sql.toUpperCase();
    const nonRollbackable = [
      'DROP DATABASE',
      'TRUNCATE',
      'DROP TABLE IF NOT EXISTS',
      'DELETE FROM WHERE 1=1'
    ];

    return !nonRollbackable.some(pattern => upperSql.includes(pattern));
  }

  private estimateMigrationDuration(steps: any[]): number {
    return steps.length * 10; // Simple estimation: 10 seconds per step
  }

  private assessMigrationRisk(steps: any[]): RiskLevel {
    const hasDrop = steps.some(step =>
      step.sql && step.sql.universal.toUpperCase().includes('DROP')
    );

    const hasDelete = steps.some(step =>
      step.sql && step.sql.universal.toUpperCase().includes('DELETE')
    );

    if (hasDrop) return RiskLevel.HIGH;
    if (hasDelete) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private requiresBackup(steps: any[]): boolean {
    return steps.some(step =>
      step.sql && (
        step.sql.universal.toUpperCase().includes('DROP') ||
        step.sql.universal.toUpperCase().includes('DELETE')
      )
    );
  }

  /**
   * Create a new plugin migration
   */
  async createMigration(
    pluginId: string,
    migrationData: Partial<PortableMigration>
  ): Promise<PortableMigration> {
    // Validate plugin exists
    const plugin = await this.pluginService.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Generate migration ID and version
    const migrationId = `migration_${pluginId}_${Date.now()}`;
    const version = await this.generateNextVersion(pluginId);

    const migration: PortableMigration = {
      id: migrationId,
      pluginId,
      version,
      name: migrationData.name || 'New Migration',
      description: migrationData.description,
      type: migrationData.type || MigrationType.SCHEMA,
      dependencies: migrationData.dependencies || [],
      conflicts: [],
      up: migrationData.up || [],
      down: migrationData.down || [],
      author: migrationData.author,
      category: migrationData.category || 'feature',
      estimatedDuration: migrationData.estimatedDuration || 60,
      riskLevel: migrationData.riskLevel || RiskLevel.MEDIUM,
      requiresBackup: migrationData.requiresBackup || false,
      databaseEngines: migrationData.databaseEngines || [DatabaseEngine.POSTGRESQL],
      minSystemVersion: migrationData.minSystemVersion,
      maxSystemVersion: migrationData.maxSystemVersion,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate migration
    await this.validateMigration(migration);

    // Save migration to file
    await this.saveMigrationToFile(pluginId, migration);

    // Update registry
    const migrations = this.migrationRegistry.get(pluginId) || [];
    migrations.push(migration);
    this.migrationRegistry.set(pluginId, migrations);

    console.log(`✅ Migration created: ${migrationId}`);
    return migration;
  }

  private async generateNextVersion(pluginId: string): Promise<string> {
    const migrations = this.migrationRegistry.get(pluginId) || [];
    const latestVersion = migrations
      .map(m => m.version)
      .sort()
      .pop();

    if (!latestVersion) {
      return '1.0.0';
    }

    // Simple version increment (in production, use proper semantic versioning)
    const parts = latestVersion.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  private async validateMigration(migration: PortableMigration): Promise<void> {
    // Basic validation
    if (!migration.id || !migration.pluginId || !migration.version) {
      throw new Error('Migration missing required fields');
    }

    if (!migration.up || migration.up.length === 0) {
      throw new Error('Migration must have at least one UP step');
    }

    // Validate steps
    for (const step of migration.up) {
      if (!step.id || !step.type) {
        throw new Error('Migration step missing required fields');
      }

      if (step.sql && !step.sql.universal && Object.keys(step.sql).length === 0) {
        throw new Error('Migration step has invalid SQL');
      }
    }
  }

  private async saveMigrationToFile(pluginId: string, migration: PortableMigration): Promise<void> {
    const pluginPath = path.join(process.cwd(), 'plugins', pluginId, 'migrations');

    // Create directory if it doesn't exist
    await fs.mkdir(pluginPath, { recursive: true });

    // Save as JSON
    const filename = `${migration.version}_${migration.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    const filepath = path.join(pluginPath, filename);
    const content = MigrationFormatAdapter.toJSON(migration);

    await fs.writeFile(filepath, content, 'utf-8');

    console.log(`💾 Migration saved: ${filepath}`);
  }

  /**
   * Get migrations for a plugin
   */
  async getPluginMigrations(pluginId: string): Promise<PortableMigration[]> {
    return this.migrationRegistry.get(pluginId) || [];
  }

  /**
   * Get migration by ID
   */
  async getMigration(migrationId: string): Promise<PortableMigration | null> {
    for (const migrations of this.migrationRegistry.values()) {
      const migration = migrations.find(m => m.id === migrationId);
      if (migration) {
        return migration;
      }
    }
    return null;
  }

  /**
   * Create migration plan for plugin upgrade
   */
  async createUpgradePlan(
    pluginId: string,
    targetVersion: string,
    options: any = {}
  ): Promise<MigrationPlan> {
    const context: MigrationExecutionContext = {
      migrationId: '',
      pluginId,
      version: targetVersion,
      direction: 'up',
      dryRun: options.dryRun || false,
      force: options.force || false,
      databaseEngine: DatabaseEngine.POSTGRESQL,
      sessionId: `plan_${Date.now()}`,
      timestamp: new Date(),
      options: {
        skipBackup: options.skipBackup || false,
        skipValidation: options.skipValidation || false,
        batchSize: options.batchSize,
        timeout: options.timeout
      }
    };

    return await this.migrationEngine.createMigrationPlan(pluginId, targetVersion, context);
  }

  /**
   * Execute migration plan
   */
  async executeMigrationPlan(
    plan: MigrationPlan,
    options: any = {}
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    for (const plannedMigration of plan.migrations) {
      const context: MigrationExecutionContext = {
        migrationId: plannedMigration.migration.id,
        pluginId: plan.pluginId,
        version: plannedMigration.migration.version,
        direction: 'up',
        dryRun: options.dryRun || false,
        force: options.force || false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: options.userId,
        options: {
          skipBackup: options.skipBackup || false,
          skipValidation: options.skipValidation || false,
          batchSize: options.batchSize,
          timeout: options.timeout
        }
      };

      try {
        const result = await this.migrationEngine.executeMigration(plannedMigration.migration, context);
        results.push(result);

        if (!result.success && !options.continueOnError) {
          break;
        }
      } catch (error) {
        console.error(`❌ Migration failed: ${plannedMigration.migration.id}`, error);

        const failedResult: MigrationResult = {
          success: false,
          migrationId: plannedMigration.migration.id,
          pluginId: plan.pluginId,
          version: plannedMigration.migration.version,
          direction: 'up',
          steps: [],
          totalSteps: plannedMigration.migration.up.length,
          successfulSteps: 0,
          failedSteps: plannedMigration.migration.up.length,
          skippedSteps: 0,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          estimatedDuration: plannedMigration.migration.estimatedDuration,
          performanceRatio: 0,
          changes: {
            tablesCreated: 0,
            tablesModified: 0,
            tablesDropped: 0,
            indexesCreated: 0,
            indexesDropped: 0,
            rowsInserted: 0,
            rowsUpdated: 0,
            rowsDeleted: 0
          },
          errors: [{
            code: 'EXECUTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            recoverable: false,
            suggestions: ['Check migration configuration', 'Verify database state']
          }],
          warnings: [],
          rollbackAvailable: false,
          backupCreated: false,
          metadata: {}
        };

        results.push(failedResult);

        if (!options.continueOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Rollback plugin to specific version
   */
  async rollbackPlugin(
    pluginId: string,
    targetVersion: string,
    options: any = {}
  ): Promise<MigrationResult[]> {
    // Get current version
    const currentVersion = await this.getCurrentPluginVersion(pluginId);

    // Get migrations that need to be rolled back
    const migrations = await this.getPluginMigrations(pluginId);
    const rollbackMigrations = migrations
      .filter(m => this.isVersionGreaterThan(m.version, targetVersion) &&
                   this.isVersionLessThanOrEqual(m.version, currentVersion))
      .reverse(); // Rollback in reverse order

    const results: MigrationResult[] = [];

    for (const migration of rollbackMigrations) {
      const context: MigrationExecutionContext = {
        migrationId: migration.id,
        pluginId,
        version: targetVersion,
        direction: 'down',
        dryRun: options.dryRun || false,
        force: options.force || false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: options.userId,
        options: {
          skipBackup: true, // Don't backup during rollback
          skipValidation: options.skipValidation || false,
          batchSize: options.batchSize,
          timeout: options.timeout
        }
      };

      try {
        const result = await this.migrationEngine.executeMigration(migration, context);
        results.push(result);

        if (!result.success && !options.continueOnError) {
          break;
        }
      } catch (error) {
        console.error(`❌ Rollback failed: ${migration.id}`, error);
        break;
      }
    }

    return results;
  }

  /**
   * Export plugin data with portability
   */
  async exportPluginData(
    pluginId: string,
    filter?: any,
    format: 'json' | 'sql' | 'csv' = 'json'
  ): Promise<DataExport> {
    return await this.migrationEngine.exportData(pluginId, filter, format);
  }

  /**
   * Import plugin data with validation
   */
  async importPluginData(
    dataExport: DataExport,
    pluginId: string,
    options: any = {}
  ): Promise<DataImport> {
    // Validate compatibility
    await this.validateDataImportCompatibility(dataExport, pluginId);

    return await this.migrationEngine.importData(dataExport, pluginId, options);
  }

  private async validateDataImportCompatibility(dataExport: DataExport, pluginId: string): Promise<void> {
    // Check plugin compatibility
    const plugin = await this.pluginService.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Target plugin not found: ${pluginId}`);
    }

    // Version compatibility check
    const currentVersion = await this.getCurrentPluginVersion(pluginId);
    if (!this.isVersionCompatible(dataExport.version, currentVersion)) {
      throw new Error(`Export version ${dataExport.version} is not compatible with current plugin version ${currentVersion}`);
    }

    // Schema compatibility check
    // In production, this would involve detailed schema comparison
  }

  /**
   * Get migration status for all plugins
   */
  async getAllMigrationStatus(): Promise<any> {
    const plugins = await this.pluginService.listPlugins();
    const status: any = {};

    for (const plugin of plugins) {
      status[plugin.id] = {
        plugin: plugin,
        migrations: await this.getPluginMigrations(plugin.id),
        executionHistory: await this.migrationEngine.getMigrationStatus(plugin.id),
        currentVersion: await this.getCurrentPluginVersion(plugin.id)
      };
    }

    return status;
  }

  /**
   * Get migration status for specific plugin
   */
  async getPluginMigrationStatus(pluginId: string): Promise<any> {
    return {
      plugin: await this.pluginService.getPlugin(pluginId),
      migrations: await this.getPluginMigrations(pluginId),
      executionHistory: await this.migrationEngine.getMigrationStatus(pluginId),
      currentVersion: await this.getCurrentPluginVersion(pluginId)
    };
  }

  /**
   * Detect conflicts between plugins
   */
  async detectPluginConflicts(): Promise<MigrationConflict[]> {
    const conflicts: MigrationConflict[] = [];
    const plugins = await this.pluginService.listPlugins();

    // Check conflicts between all plugin migrations
    for (let i = 0; i < plugins.length; i++) {
      for (let j = i + 1; j < plugins.length; j++) {
        const plugin1Migrations = await this.getPluginMigrations(plugins[i].id);
        const plugin2Migrations = await this.getPluginMigrations(plugins[j].id);

        for (const migration1 of plugin1Migrations) {
          for (const migration2 of plugin2Migrations) {
            const migrationConflicts = MigrationFormatAdapter.detectConflicts(migration1, migration2);
            conflicts.push(...migrationConflicts);
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Create portable migration package
   */
  async createMigrationPackage(
    pluginId: string,
    includeData: boolean = false,
    outputPath?: string
  ): Promise<string> {
    const plugin = await this.pluginService.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const migrations = await this.getPluginMigrations(pluginId);
    const version = await this.getCurrentPluginVersion(pluginId);

    const packageData = {
      format: 'portable-plugin-package-v1',
      version: '1.0.0',
      metadata: {
        pluginId,
        pluginName: plugin.name,
        pluginVersion: version,
        createdAt: new Date().toISOString(),
        includesData: includeData
      },
      migrations: migrations.map(m => JSON.parse(MigrationFormatAdapter.toJSON(m))),
      data: includeData ? await this.exportPluginData(pluginId) : null,
      schema: await this.getPluginSchema(pluginId)
    };

    const packagePath = outputPath || path.join(process.cwd(), 'exports', `${pluginId}_v${version}_package.json`);

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(packagePath), { recursive: true });

    // Write package file
    await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2), 'utf-8');

    console.log(`📦 Migration package created: ${packagePath}`);
    return packagePath;
  }

  /**
   * Install plugin from migration package
   */
  async installFromMigrationPackage(
    packagePath: string,
    options: any = {}
  ): Promise<any> {
    const packageData = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

    if (packageData.format !== 'portable-plugin-package-v1') {
      throw new Error(`Unsupported package format: ${packageData.format}`);
    }

    const { metadata, migrations, data, schema } = packageData;

    // Install plugin metadata
    await this.installPluginMetadata(metadata);

    // Load migrations into registry
    const portableMigrations = migrations.map((m: any) => MigrationFormatAdapter.fromJSON(JSON.stringify(m)));
    this.migrationRegistry.set(metadata.pluginId, portableMigrations);

    // Execute migrations if requested
    if (options.executeMigrations !== false) {
      const plan = await this.createUpgradePlan(metadata.pluginId, metadata.pluginVersion);
      await this.executeMigrationPlan(plan, options);
    }

    // Import data if included and requested
    if (data && options.importData === true) {
      await this.importPluginData(data, metadata.pluginId, options);
    }

    console.log(`✅ Plugin installed from package: ${metadata.pluginId}`);
    return {
      pluginId: metadata.pluginId,
      migrationsExecuted: portableMigrations.length,
      dataImported: !!data && options.importData === true
    };
  }

  private async installPluginMetadata(metadata: any): Promise<void> {
    // Install plugin configuration in database
    await DatabaseService.execute(
      `INSERT INTO plugin.plugin_configurations
       (pluginid, pluginname, pluginversion, plugindescription, pluginauthor, pluginentry, pluginstatus, issystem, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (pluginid) DO UPDATE SET
       pluginname = EXCLUDED.pluginname,
       pluginversion = EXCLUDED.pluginversion,
       plugindescription = EXCLUDED.plugindescription,
       pluginauthor = EXCLUDED.pluginauthor,
       updatedat = NOW()`,
      [
        metadata.pluginId,
        metadata.pluginName,
        metadata.pluginVersion,
        `Plugin installed from migration package`,
        'System',
        'index.js',
        'disabled',
        false
      ]
    );
  }

  private async getPluginSchema(pluginId: string): Promise<any> {
    // Get plugin schema definition
    return await DatabaseService.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'plugin'
       AND table_name LIKE $1
       ORDER BY table_name, ordinal_position`,
      [`${pluginId}%`]
    );
  }

  private async getCurrentPluginVersion(pluginId: string): Promise<string> {
    const result = await DatabaseService.queryOne(
      `SELECT pluginversion FROM plugin.plugin_configurations WHERE pluginid = $1`,
      [pluginId]
    );
    return result?.pluginversion || '0.0.0';
  }

  private isVersionGreaterThan(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) > 0;
  }

  private isVersionLessThanOrEqual(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) <= 0;
  }

  private isVersionCompatible(exportVersion: string, currentVersion: string): boolean {
    // Simple compatibility check - in production, use semantic versioning rules
    const exportParts = exportVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    // Major version must match
    return exportParts[0] === currentParts[0];
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  /**
   * Get migration statistics
   */
  async getMigrationStatistics(): Promise<any> {
    const stats = {
      totalPlugins: 0,
      totalMigrations: 0,
      migrationsByType: {} as Record<string, number>,
      migrationsByRisk: {} as Record<string, number>,
      recentlyExecuted: 0,
      failedMigrations: 0
    };

    const plugins = await this.pluginService.listPlugins();
    stats.totalPlugins = plugins.length;

    for (const plugin of plugins) {
      const migrations = await this.getPluginMigrations(plugin.id);
      stats.totalMigrations += migrations.length;

      for (const migration of migrations) {
        // Count by type
        stats.migrationsByType[migration.type] = (stats.migrationsByType[migration.type] || 0) + 1;

        // Count by risk level
        stats.migrationsByRisk[migration.riskLevel] = (stats.migrationsByRisk[migration.riskLevel] || 0) + 1;
      }

      // Get execution history
      const history = await this.migrationEngine.getMigrationStatus(plugin.id);
      const recent = history.filter((h: any) => {
        const executedAt = new Date(h.started_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return executedAt > weekAgo;
      });

      stats.recentlyExecuted += recent.length;
      stats.failedMigrations += history.filter((h: any) => !h.success).length;
    }

    return stats;
  }
}
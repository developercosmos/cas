import {
  PortableMigration,
  MigrationType,
  DatabaseEngine,
  FieldMapping,
  TransformFunction,
  MigrationConflict,
  ConflictType
} from './types.js';

/**
 * Migration Format Adapter
 * Converts between different migration formats and ensures cross-database compatibility
 */
export class MigrationFormatAdapter {
  /**
   * Convert traditional CAS migration to portable format
   */
  static toPortable(
    traditionalMigration: any,
    pluginId: string,
    targetEngines: DatabaseEngine[] = [DatabaseEngine.POSTGRESQL]
  ): PortableMigration {
    return {
      id: this.generateId(),
      pluginId,
      version: traditionalMigration.version || '1.0.0',
      name: traditionalMigration.name || 'Migration',
      description: traditionalMigration.description,
      type: this.inferMigrationType(traditionalMigration.up),
      dependencies: traditionalMigration.dependencies || [],
      conflicts: [],
      up: this.convertSteps(traditionalMigration.up, targetEngines),
      down: this.convertSteps(traditionalMigration.down, targetEngines),
      author: traditionalMigration.author,
      category: this.inferCategory(traditionalMigration.name),
      estimatedDuration: this.estimateDuration(traditionalMigration.up),
      riskLevel: this.assessRisk(traditionalMigration.up),
      requiresBackup: this.requiresBackup(traditionalMigration.up),
      databaseEngines: targetEngines,
      createdAt: traditionalMigration.timestamp || new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Convert portable migration to specific database format
   */
  static toDatabaseFormat(
    migration: PortableMigration,
    targetEngine: DatabaseEngine
  ): any {
    return {
      version: migration.version,
      name: migration.name,
      description: migration.description,
      up: this.convertStepsToEngine(migration.up, targetEngine),
      down: this.convertStepsToEngine(migration.down, targetEngine),
      dependencies: migration.dependencies,
      timestamp: migration.createdAt
    };
  }

  /**
   * Convert portable migration to JSON export format
   */
  static toJSON(migration: PortableMigration): string {
    const exportData = {
      format: 'portable-migration-v1',
      version: '1.0.0',
      migration: {
        id: migration.id,
        pluginId: migration.pluginId,
        version: migration.version,
        name: migration.name,
        description: migration.description,
        type: migration.type,
        dependencies: migration.dependencies,
        conflicts: migration.conflicts,
        category: migration.category,
        estimatedDuration: migration.estimatedDuration,
        riskLevel: migration.riskLevel,
        requiresBackup: migration.requiresBackup,
        databaseEngines: migration.databaseEngines,
        author: migration.author,
        minSystemVersion: migration.minSystemVersion,
        maxSystemVersion: migration.maxSystemVersion,
        steps: {
          up: migration.up.map(step => this.serializeStep(step)),
          down: migration.down.map(step => this.serializeStep(step))
        },
        createdAt: migration.createdAt.toISOString(),
        updatedAt: migration.updatedAt.toISOString()
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import portable migration from JSON
   */
  static fromJSON(jsonString: string): PortableMigration {
    try {
      const data = JSON.parse(jsonString);

      if (data.format !== 'portable-migration-v1') {
        throw new Error(`Unsupported migration format: ${data.format}`);
      }

      const m = data.migration;
      return {
        id: m.id,
        pluginId: m.pluginId,
        version: m.version,
        name: m.name,
        description: m.description,
        type: m.type,
        dependencies: m.dependencies || [],
        conflicts: m.conflicts || [],
        category: m.category,
        estimatedDuration: m.estimatedDuration,
        riskLevel: m.riskLevel,
        requiresBackup: m.requiresBackup,
        databaseEngines: m.databaseEngines,
        author: m.author,
        minSystemVersion: m.minSystemVersion,
        maxSystemVersion: m.maxSystemVersion,
        up: m.steps.up.map((step: any) => this.deserializeStep(step)),
        down: m.steps.down.map((step: any) => this.deserializeStep(step)),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt)
      };
    } catch (error) {
      throw new Error(`Failed to import migration from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate SQL-specific migration file
   */
  static toSQLFile(
    migration: PortableMigration,
    engine: DatabaseEngine,
    direction: 'up' | 'down' = 'up'
  ): string {
    const steps = direction === 'up' ? migration.up : migration.down;
    const sqlLines: string[] = [];

    // Add header
    sqlLines.push(`-- Migration: ${migration.name}`);
    sqlLines.push(`-- Plugin: ${migration.pluginId}`);
    sqlLines.push(`-- Version: ${migration.version}`);
    sqlLines.push(`-- Direction: ${direction}`);
    sqlLines.push(`-- Database Engine: ${engine}`);
    sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
    sqlLines.push(``);

    // Add transaction wrapper if all steps support it
    const allTransactional = steps.every(step => step.transactional);
    if (allTransactional) {
      sqlLines.push('BEGIN;');
      sqlLines.push('');
    }

    // Add steps
    for (const step of steps) {
      const stepSql = this.getStepSQL(step, engine);
      if (stepSql) {
        sqlLines.push(`-- Step: ${step.name}`);
        sqlLines.push(`-- Type: ${step.type}`);
        if (step.description) {
          sqlLines.push(`-- Description: ${step.description}`);
        }
        sqlLines.push(stepSql);
        sqlLines.push('');
      }
    }

    // Close transaction
    if (allTransactional) {
      sqlLines.push('COMMIT;');
    }

    return sqlLines.join('\n');
  }

  private static convertSteps(
    steps: any[],
    targetEngines: DatabaseEngine[]
  ): any[] {
    return steps.map((step, index) => ({
      id: step.id || `step_${index + 1}`,
      type: this.inferStepType(step.sql || step),
      name: step.name || `Step ${index + 1}`,
      description: step.description,
      sql: this.convertSQLToMultiEngine(step.sql, targetEngines),
      transform: step.transform ? this.convertTransform(step.transform) : undefined,
      transactional: step.transactional !== false,
      rollbackSupported: step.rollbackSupported !== false,
      skipOnError: step.skipOnError || false,
      timeout: step.timeout,
      dependencies: step.dependencies || [],
      preValidation: step.preValidation,
      postValidation: step.postValidation,
      expectedChanges: step.expectedChanges
    }));
  }

  private static convertSQLToMultiEngine(
    sql: string,
    targetEngines: DatabaseEngine[]
  ): any {
    if (!sql) return {};

    const multiEngineSQL: any = {};

    for (const engine of targetEngines) {
      multiEngineSQL[engine] = this.adaptSQLEngine(sql, engine);
    }

    // Store original SQL as universal (PostgreSQL-compatible)
    multiEngineSQL.universal = sql;

    return multiEngineSQL;
  }

  private static adaptSQLEngine(sql: string, engine: DatabaseEngine): string {
    switch (engine) {
      case DatabaseEngine.MYSQL:
        return this.adaptSQLToMySQL(sql);
      case DatabaseEngine.SQLITE:
        return this.adaptSQLToSQLite(sql);
      case DatabaseEngine.MSSQL:
        return this.adaptSQLToMSSQL(sql);
      case DatabaseEngine.ORACLE:
        return this.adaptSQLToOracle(sql);
      case DatabaseEngine.POSTGRESQL:
      default:
        return sql;
    }
  }

  private static adaptSQLToMySQL(sql: string): string {
    let mysqlSQL = sql;

    // Data type conversions
    mysqlSQL = mysqlSQL.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TIMESTAMP');
    mysqlSQL = mysqlSQL.replace(/UUID/gi, 'CHAR(36)');
    mysqlSQL = mysqlSQL.replace(/JSONB/gi, 'JSON');
    mysqlSQL = mysqlSQL.replace(/BOOLEAN/gi, 'TINYINT(1)');
    mysqlSQL = mysqlSQL.replace(/SERIAL/gi, 'INT AUTO_INCREMENT');

    // Function conversions
    mysqlSQL = mysqlSQL.replace(/uuid_generate_v4\(\)/gi, 'UUID()');
    mysqlSQL = mysqlSQL.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    mysqlSQL = mysqlSQL.replace(/EXTRACT\s+EPOCH\s+FROM/gi, 'UNIX_TIMESTAMP');

    // Constraint syntax
    mysqlSQL = mysqlSQL.replace(/ON\s+UPDATE\s+CASCADE/gi, 'ON UPDATE CASCADE');

    // Index syntax
    mysqlSQL = mysqlSQL.replace(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi, 'CREATE UNIQUE INDEX');
    mysqlSQL = mysqlSQL.replace(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi, 'CREATE INDEX');

    return mysqlSQL;
  }

  private static adaptSQLToSQLite(sql: string): string {
    let sqliteSQL = sql;

    // Data type conversions
    sqliteSQL = sqliteSQL.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TEXT');
    sqliteSQL = sqliteSQL.replace(/UUID/gi, 'TEXT');
    sqliteSQL = sqliteSQL.replace(/JSONB/gi, 'TEXT');
    sqliteSQL = sqliteSQL.replace(/BOOLEAN/gi, 'INTEGER');

    // Function conversions
    sqliteSQL = sqliteSQL.replace(/uuid_generate_v4\(\)/gi, "hex(randomblob(16))");
    sqliteSQL = sqliteSQL.replace(/NOW\(\)/gi, "datetime('now')");

    // Remove unsupported features
    sqliteSQL = sqliteSQL.replace(/ON\s+UPDATE\s+CASCADE/gi, '');
    sqliteSQL = sqliteSQL.replace(/IF\s+NOT\s+EXISTS/gi, '');

    return sqliteSQL;
  }

  private static adaptSQLToMSSQL(sql: string): string {
    let mssqlSQL = sql;

    // Data type conversions
    mssqlSQL = mssqlSQL.replace(/TIMESTAMP WITH TIME ZONE/gi, 'DATETIMEOFFSET');
    mssqlSQL = mssqlSQL.replace(/UUID/gi, 'UNIQUEIDENTIFIER');
    mssqlSQL = mssqlSQL.replace(/JSONB/gi, 'NVARCHAR(MAX)');
    mssqlSQL = mssqlSQL.replace(/BOOLEAN/gi, 'BIT');
    mssqlSQL = mssqlSQL.replace(/SERIAL/gi, 'INT IDENTITY(1,1)');

    // Function conversions
    mssqlSQL = mssqlSQL.replace(/uuid_generate_v4\(\)/gi, 'NEWID()');
    mssqlSQL = mssqlSQL.replace(/NOW\(\)/gi, 'GETDATE()');

    // Constraint syntax
    mssqlSQL = mssqlSQL.replace(/ON\s+UPDATE\s+CASCADE/gi, 'ON UPDATE CASCADE');

    return mssqlSQL;
  }

  private static adaptSQLToOracle(sql: string): string {
    let oracleSQL = sql;

    // Data type conversions
    oracleSQL = oracleSQL.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TIMESTAMP WITH TIME ZONE');
    oracleSQL = oracleSQL.replace(/UUID/gi, 'RAW(16)');
    oracleSQL = oracleSQL.replace(/JSONB/gi, 'CLOB');
    oracleSQL = oracleSQL.replace(/BOOLEAN/gi, 'NUMBER(1)');
    oracleSQL = oracleSQL.replace(/SERIAL/gi, 'NUMBER GENERATED BY DEFAULT AS IDENTITY');

    // Function conversions
    oracleSQL = oracleSQL.replace(/uuid_generate_v4\(\)/gi, 'SYS_GUID()');
    oracleSQL = oracleSQL.replace(/NOW\(\)/gi, 'SYSTIMESTAMP');

    return oracleSQL;
  }

  private static convertStepsToEngine(steps: any[], engine: DatabaseEngine): any[] {
    return steps.map(step => ({
      ...step,
      sql: step.sql ? step.sql[engine] || step.sql.universal : undefined
    }));
  }

  private static inferMigrationType(upSteps: any[]): MigrationType {
    if (!upSteps || upSteps.length === 0) {
      return MigrationType.SCHEMA;
    }

    const sql = upSteps.map(step => step.sql || '').join(' ').toUpperCase();

    if (sql.includes('CREATE TABLE') || sql.includes('ALTER TABLE') || sql.includes('DROP TABLE')) {
      return MigrationType.SCHEMA;
    } else if (sql.includes('INSERT INTO') || sql.includes('UPDATE') || sql.includes('DELETE')) {
      return MigrationType.DATA;
    } else if (sql.includes('CREATE INDEX') || sql.includes('DROP INDEX')) {
      return MigrationType.INDEX;
    } else if (sql.includes('CREATE FUNCTION') || sql.includes('CREATE PROCEDURE')) {
      return MigrationType.FUNCTION;
    } else if (sql.includes('CREATE TRIGGER') || sql.includes('DROP TRIGGER')) {
      return MigrationType.TRIGGER;
    } else if (sql.includes('CREATE VIEW') || sql.includes('DROP VIEW')) {
      return MigrationType.VIEW;
    } else if (sql.includes('ALTER TABLE') && (sql.includes('ADD CONSTRAINT') || sql.includes('DROP CONSTRAINT'))) {
      return MigrationType.CONSTRAINT;
    } else if (sql.includes('CREATE EXTENSION')) {
      return MigrationType.EXTENSION;
    }

    return MigrationType.SCHEMA;
  }

  private static inferStepType(sqlOrStep: any): MigrationType {
    const sql = typeof sqlOrStep === 'string' ? sqlOrStep : sqlOrStep.sql;
    if (!sql) return MigrationType.SCHEMA;

    const upperSql = sql.toUpperCase();

    if (upperSql.includes('CREATE TABLE') || upperSql.includes('ALTER TABLE') || upperSql.includes('DROP TABLE')) {
      return MigrationType.SCHEMA;
    } else if (upperSql.includes('INSERT INTO') || upperSql.includes('UPDATE') || upperSql.includes('DELETE')) {
      return MigrationType.DATA;
    } else if (upperSql.includes('CREATE INDEX') || upperSql.includes('DROP INDEX')) {
      return MigrationType.INDEX;
    } else if (upperSql.includes('CREATE FUNCTION') || upperSql.includes('CREATE PROCEDURE')) {
      return MigrationType.FUNCTION;
    } else if (upperSql.includes('CREATE TRIGGER') || upperSql.includes('DROP TRIGGER')) {
      return MigrationType.TRIGGER;
    } else if (upperSql.includes('CREATE VIEW') || upperSql.includes('DROP VIEW')) {
      return MigrationType.VIEW;
    } else if (upperSql.includes('CREATE EXTENSION')) {
      return MigrationType.EXTENSION;
    }

    return MigrationType.SCHEMA;
  }

  private static inferCategory(name: string): any {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('install') || nameLower.includes('initial')) {
      return 'install';
    } else if (nameLower.includes('upgrade') || nameLower.includes('update')) {
      return 'upgrade';
    } else if (nameLower.includes('patch') || nameLower.includes('fix')) {
      return 'patch';
    } else if (nameLower.includes('feature')) {
      return 'feature';
    } else if (nameLower.includes('performance') || nameLower.includes('optimize')) {
      return 'performance';
    } else if (nameLower.includes('security')) {
      return 'security';
    } else if (nameLower.includes('migration') || nameLower.includes('migrate')) {
      return 'migration';
    } else if (nameLower.includes('cleanup') || nameLower.includes('clean')) {
      return 'cleanup';
    }

    return 'maintenance';
  }

  private static estimateDuration(steps: any[]): number {
    let duration = 0;

    for (const step of steps) {
      if (step.estimatedDuration) {
        duration += step.estimatedDuration;
      } else {
        // Estimate based on step type
        const sql = step.sql || '';
        const upperSql = sql.toUpperCase();

        if (upperSql.includes('CREATE TABLE')) {
          duration += 5;
        } else if (upperSql.includes('ALTER TABLE') && upperSql.includes('ADD COLUMN')) {
          duration += 10;
        } else if (upperSql.includes('CREATE INDEX')) {
          duration += 15;
        } else if (upperSql.includes('INSERT INTO')) {
          duration += 20;
        } else if (upperSql.includes('UPDATE')) {
          duration += 25;
        } else if (upperSql.includes('DELETE')) {
          duration += 30;
        } else {
          duration += 5;
        }
      }
    }

    return duration;
  }

  private static assessRisk(steps: any[]): any {
    let riskScore = 0;

    for (const step of steps) {
      const sql = step.sql || '';
      const upperSql = sql.toUpperCase();

      // High-risk operations
      if (upperSql.includes('DROP TABLE') || upperSql.includes('DROP DATABASE')) {
        riskScore += 50;
      } else if (upperSql.includes('DELETE FROM') && !upperSql.includes('WHERE')) {
        riskScore += 40;
      } else if (upperSql.includes('TRUNCATE')) {
        riskScore += 30;
      } else if (upperSql.includes('ALTER TABLE') && upperSql.includes('DROP COLUMN')) {
        riskScore += 25;
      }
      // Medium-risk operations
      else if (upperSql.includes('UPDATE') && !upperSql.includes('WHERE')) {
        riskScore += 20;
      } else if (upperSql.includes('ALTER TABLE') && upperSql.includes('ALTER COLUMN')) {
        riskScore += 15;
      } else if (upperSql.includes('DROP INDEX')) {
        riskScore += 10;
      }
      // Low-risk operations
      else if (upperSql.includes('CREATE TABLE') || upperSql.includes('CREATE INDEX')) {
        riskScore += 5;
      }
    }

    if (riskScore >= 40) return 'critical';
    if (riskScore >= 25) return 'high';
    if (riskScore >= 10) return 'medium';
    return 'low';
  }

  private static requiresBackup(steps: any[]): boolean {
    for (const step of steps) {
      const sql = step.sql || '';
      const upperSql = sql.toUpperCase();

      if (upperSql.includes('DROP TABLE') ||
          upperSql.includes('DELETE FROM') ||
          upperSql.includes('TRUNCATE') ||
          upperSql.includes('ALTER TABLE') && (upperSql.includes('DROP COLUMN') || upperSql.includes('ALTER COLUMN'))) {
        return true;
      }
    }

    return false;
  }

  private static convertTransform(transform: any): any {
    if (!transform) return undefined;

    return {
      source: transform.source,
      target: transform.target,
      mapping: transform.mapping?.map((fieldMap: any) => ({
        source: fieldMap.source,
        target: fieldMap.target,
        transform: fieldMap.transform ? this.convertTransformFunction(fieldMap.transform) : undefined,
        defaultValue: fieldMap.defaultValue,
        required: fieldMap.required || false
      })) || [],
      filter: transform.filter,
      batchSize: transform.batchSize,
      validation: transform.validation
    };
  }

  private static convertTransformFunction(transform: any): TransformFunction {
    return {
      type: transform.type || 'function',
      definition: transform.definition || transform.name || 'identity',
      parameters: transform.parameters
    };
  }

  private static serializeStep(step: any): any {
    return {
      id: step.id,
      type: step.type,
      name: step.name,
      description: step.description,
      sql: step.sql,
      transform: step.transform,
      transactional: step.transactional,
      rollbackSupported: step.rollbackSupported,
      skipOnError: step.skipOnError,
      timeout: step.timeout,
      dependencies: step.dependencies,
      preValidation: step.preValidation,
      postValidation: step.postValidation,
      expectedChanges: step.expectedChanges
    };
  }

  private static deserializeStep(data: any): any {
    return {
      id: data.id,
      type: data.type,
      name: data.name,
      description: data.description,
      sql: data.sql,
      transform: data.transform,
      transactional: data.transactional,
      rollbackSupported: data.rollbackSupported,
      skipOnError: data.skipOnError,
      timeout: data.timeout,
      dependencies: data.dependencies || [],
      preValidation: data.preValidation,
      postValidation: data.postValidation,
      expectedChanges: data.expectedChanges
    };
  }

  private static getStepSQL(step: any, engine: DatabaseEngine): string {
    if (step.sql) {
      return step.sql[engine] || step.sql.universal || '';
    }

    if (step.transform) {
      // Generate SQL for data transformation
      return this.generateTransformSQL(step.transform, engine);
    }

    return '';
  }

  private static generateTransformSQL(transform: any, engine: DatabaseEngine): string {
    const { source, target, mapping, filter, batchSize = 1000 } = transform;

    let sql = `-- Data transformation from ${source} to ${target}\n`;

    // Generate transformation SQL based on mapping
    const selectFields = mapping.map((fieldMap: FieldMapping) => {
      let expression = fieldMap.source;

      if (fieldMap.transform) {
        expression = this.applyTransformExpression(fieldMap.source, fieldMap.transform, engine);
      }

      if (fieldMap.defaultValue !== undefined) {
        expression = `COALESCE(${expression}, ${this.formatValue(fieldMap.defaultValue, engine)})`;
      }

      return `${expression} AS ${fieldMap.target}`;
    });

    sql += `INSERT INTO ${target} (${mapping.map((m: FieldMapping) => m.target).join(', ')})\n`;
    sql += `SELECT ${selectFields.join(', ')}\n`;
    sql += `FROM ${source}`;

    if (filter) {
      sql += `\nWHERE ${filter}`;
    }

    // Add batch processing if needed
    if (batchSize && batchSize > 0) {
      sql += `\n-- Process in batches of ${batchSize} records`;
    }

    return sql;
  }

  private static applyTransformExpression(source: string, transform: TransformFunction, engine: DatabaseEngine): string {
    const { type, definition, parameters = [] } = transform;

    switch (type) {
      case 'function':
        return this.applyFunction(source, definition, parameters, engine);
      case 'expression':
        return definition.replace(/\$/g, source);
      case 'lookup':
        return `CASE ${source} WHEN ${parameters[0]} THEN ${parameters[1]} ELSE ${source} END`;
      default:
        return source;
    }
  }

  private static applyFunction(source: string, functionName: string, parameters: any[], engine: DatabaseEngine): string {
    switch (functionName) {
      case 'upper':
        return `UPPER(${source})`;
      case 'lower':
        return `LOWER(${source})`;
      case 'trim':
        return `TRIM(${source})`;
      case 'round':
        return `ROUND(${source}${parameters.length > 0 ? ', ' + parameters[0] : ''})`;
      case 'date':
        if (engine === DatabaseEngine.MYSQL) {
          return `DATE(${source})`;
        }
        return `DATE_TRUNC('day', ${source})`;
      default:
        return `${functionName}(${source}${parameters.length > 0 ? ', ' + parameters.join(', ') : ''})`;
    }
  }

  private static formatValue(value: any, engine: DatabaseEngine): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }

    if (typeof value === 'boolean') {
      return engine === DatabaseEngine.POSTGRESQL ? value.toString() : (value ? '1' : '0');
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    return String(value);
  }

  private static generateId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect conflicts between migrations
   */
  static detectConflicts(
    migration1: PortableMigration,
    migration2: PortableMigration
  ): MigrationConflict[] {
    const conflicts: MigrationConflict[] = [];

    // Extract table operations from both migrations
    const tables1 = this.extractTableOperations(migration1);
    const tables2 = this.extractTableOperations(migration2);

    // Check for table conflicts
    for (const [table, op1] of Object.entries(tables1)) {
      if (tables2[table]) {
        const op2 = tables2[table];

        if (op1 !== op2) {
          conflicts.push({
            type: ConflictType.TABLE_CONFLICT,
            migrationId1: migration1.id,
            migrationId2: migration2.id,
            description: `Conflicting operations on table ${table}: ${op1} vs ${op2}`,
            severity: this.getConflictSeverity(op1, op2),
            autoResolvable: false
          });
        }
      }
    }

    // Check for index conflicts
    const indexes1 = this.extractIndexOperations(migration1);
    const indexes2 = this.extractIndexOperations(migration2);

    for (const [indexName, op1] of Object.entries(indexes1)) {
      if (indexes2[indexName]) {
        const op2 = indexes2[indexName];
        if (op1 !== op2) {
          conflicts.push({
            type: ConflictType.INDEX_CONFLICT,
            migrationId1: migration1.id,
            migrationId2: migration2.id,
            description: `Conflicting operations on index ${indexName}: ${op1} vs ${op2}`,
            severity: 'medium',
            autoResolvable: true
          });
        }
      }
    }

    return conflicts;
  }

  private static extractTableOperations(migration: PortableMigration): Record<string, string> {
    const operations: Record<string, string> = {};

    for (const step of migration.up) {
      if (step.sql) {
        const sql = step.sql.universal || '';

        // Extract table operations
        const createMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (createMatch) {
          operations[createMatch[1]] = 'CREATE';
        }

        const alterMatch = sql.match(/ALTER\s+TABLE\s+(\w+)/i);
        if (alterMatch) {
          operations[alterMatch[1]] = 'ALTER';
        }

        const dropMatch = sql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
        if (dropMatch) {
          operations[dropMatch[1]] = 'DROP';
        }
      }
    }

    return operations;
  }

  private static extractIndexOperations(migration: PortableMigration): Record<string, string> {
    const operations: Record<string, string> = {};

    for (const step of migration.up) {
      if (step.sql) {
        const sql = step.sql.universal || '';

        // Extract index operations
        const createMatch = sql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (createMatch) {
          operations[createMatch[1]] = 'CREATE';
        }

        const dropMatch = sql.match(/DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
        if (dropMatch) {
          operations[dropMatch[1]] = 'DROP';
        }
      }
    }

    return operations;
  }

  private static getConflictSeverity(op1: string, op2: string): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskOps = ['DROP', 'TRUNCATE'];
    const mediumRiskOps = ['ALTER'];

    if (highRiskOps.includes(op1) || highRiskOps.includes(op2)) {
      return 'critical';
    }

    if (mediumRiskOps.includes(op1) || mediumRiskOps.includes(op2)) {
      return 'high';
    }

    return 'medium';
  }
}
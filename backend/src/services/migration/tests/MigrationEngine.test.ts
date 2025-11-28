import { PortableMigrationEngine } from '../PortableMigrationEngine.js';
import { MigrationFormatAdapter } from '../MigrationFormatAdapter.js';
import {
  PortableMigration,
  MigrationType,
  DatabaseEngine,
  RiskLevel,
  MigrationExecutionContext
} from '../types.js';

describe('PortableMigrationEngine', () => {
  let migrationEngine: PortableMigrationEngine;
  let testMigration: PortableMigration;

  beforeEach(async () => {
    migrationEngine = PortableMigrationEngine.getInstance();

    // Create test migration
    testMigration = {
      id: 'test-migration-001',
      pluginId: 'test-plugin',
      version: '1.0.0',
      name: 'Test Migration',
      description: 'A test migration for unit testing',
      type: MigrationType.SCHEMA,
      dependencies: [],
      conflicts: [],
      up: [
        {
          id: 'create_test_table',
          type: MigrationType.SCHEMA,
          name: 'Create Test Table',
          description: 'Creates a test table',
          sql: {
            universal: 'CREATE TABLE IF NOT EXISTS test_migration_table (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), data TEXT);'
          },
          transactional: true,
          rollbackSupported: true,
          skipOnError: false,
          dependencies: []
        }
      ],
      down: [
        {
          id: 'drop_test_table',
          type: MigrationType.SCHEMA,
          name: 'Drop Test Table',
          description: 'Drops the test table',
          sql: {
            universal: 'DROP TABLE IF EXISTS test_migration_table CASCADE;'
          },
          transactional: true,
          rollbackSupported: false,
          skipOnError: false,
          dependencies: []
        }
      ],
      category: 'install',
      estimatedDuration: 30,
      riskLevel: RiskLevel.LOW,
      requiresBackup: false,
      databaseEngines: [DatabaseEngine.POSTGRESQL],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('Migration Execution', () => {
    test('should execute simple migration successfully', async () => {
      const context: MigrationExecutionContext = {
        migrationId: testMigration.id,
        pluginId: testMigration.pluginId,
        version: testMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(testMigration, context);

      expect(result.success).toBe(true);
      expect(result.migrationId).toBe(testMigration.id);
      expect(result.pluginId).toBe(testMigration.pluginId);
      expect(result.direction).toBe('up');
      expect(result.steps).toHaveLength(1);
      expect(result.successfulSteps).toBe(1);
      expect(result.failedSteps).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should handle migration rollback', async () => {
      const context: MigrationExecutionContext = {
        migrationId: testMigration.id,
        pluginId: testMigration.pluginId,
        version: testMigration.version,
        direction: 'down',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(testMigration, context);

      expect(result.success).toBe(true);
      expect(result.direction).toBe('down');
      expect(result.steps).toHaveLength(1);
    });

    test('should validate migration before execution', async () => {
      const invalidMigration = { ...testMigration };
      invalidMigration.up = []; // Empty steps

      const context: MigrationExecutionContext = {
        migrationId: invalidMigration.id,
        pluginId: invalidMigration.pluginId,
        version: invalidMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      await expect(
        migrationEngine.executeMigration(invalidMigration, context)
      ).rejects.toThrow('Migration validation failed');
    });

    test('should handle dry run mode', async () => {
      const context: MigrationExecutionContext = {
        migrationId: testMigration.id,
        pluginId: testMigration.pluginId,
        version: testMigration.version,
        direction: 'up',
        dryRun: true,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(testMigration, context);

      expect(result.success).toBe(true);
      expect(result.metadata.dryRun).toBe(true);
    });
  });

  describe('SQL Adaptation', () => {
    test('should adapt SQL for different database engines', () => {
      const postgresSQL = 'CREATE TABLE test (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), data JSONB);';
      const multiEngineSQL = MigrationFormatAdapter.convertSQLToMultiEngine(
        postgresSQL,
        [DatabaseEngine.POSTGRESQL, DatabaseEngine.MYSQL, DatabaseEngine.SQLITE]
      );

      expect(multiEngineSQL.postgresql).toContain('UUID');
      expect(multiEngineSQL.postgresql).toContain('JSONB');
      expect(multiEngineSQL.mysql).toContain('CHAR(36)');
      expect(multiEngineSQL.mysql).toContain('JSON');
      expect(multiEngineSQL.sqlite).toContain('TEXT');
    });

    test('should handle function transformations', () => {
      const mysqlSQL = MigrationFormatAdapter.adaptSQLEngine(
        'SELECT uuid_generate_v4(), NOW() FROM test',
        DatabaseEngine.MYSQL
      );

      expect(mysqlSQL).toContain('UUID()');
      expect(mysqlSQL).toContain('CURRENT_TIMESTAMP');
    });
  });

  describe('Conflict Detection', () => {
    test('should detect table conflicts', () => {
      const migration1: PortableMigration = {
        ...testMigration,
        id: 'migration-1',
        up: [{
          id: 'create_table',
          type: MigrationType.SCHEMA,
          name: 'Create Table',
          sql: {
            universal: 'CREATE TABLE test_table (id UUID PRIMARY KEY);'
          },
          transactional: true,
          rollbackSupported: true,
          skipOnError: false,
          dependencies: []
        }]
      };

      const migration2: PortableMigration = {
        ...testMigration,
        id: 'migration-2',
        up: [{
          id: 'alter_table',
          type: MigrationType.SCHEMA,
          name: 'Alter Table',
          sql: {
            universal: 'ALTER TABLE test_table ADD COLUMN name VARCHAR(255);'
          },
          transactional: true,
          rollbackSupported: true,
          skipOnError: false,
          dependencies: []
        }]
      };

      const conflicts = MigrationFormatAdapter.detectConflicts(migration1, migration2);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('table_conflict');
      expect(conflicts[0].migrationId1).toBe('migration-1');
      expect(conflicts[0].migrationId2).toBe('migration-2');
    });

    test('should detect index conflicts', () => {
      const migration1: PortableMigration = {
        ...testMigration,
        id: 'migration-1',
        up: [{
          id: 'create_index',
          type: MigrationType.INDEX,
          name: 'Create Index',
          sql: {
            universal: 'CREATE INDEX idx_test_name ON test_table(name);'
          },
          transactional: true,
          rollbackSupported: true,
          skipOnError: false,
          dependencies: []
        }]
      };

      const migration2: PortableMigration = {
        ...testMigration,
        id: 'migration-2',
        up: [{
          id: 'drop_index',
          type: MigrationType.INDEX,
          name: 'Drop Index',
          sql: {
            universal: 'DROP INDEX idx_test_name;'
          },
          transactional: true,
          rollbackSupported: false,
          skipOnError: false,
          dependencies: []
        }]
      };

      const conflicts = MigrationFormatAdapter.detectConflicts(migration1, migration2);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('index_conflict');
    });
  });

  describe('Data Transformations', () => {
    test('should transform data with field mapping', async () => {
      const dataTransformationMigration: PortableMigration = {
        ...testMigration,
        id: 'data-transform-test',
        type: MigrationType.DATA,
        up: [
          {
            id: 'create_source_table',
            type: MigrationType.SCHEMA,
            name: 'Create Source Table',
            sql: {
              universal: 'CREATE TABLE IF NOT EXISTS source_table (id UUID, first_name TEXT, last_name TEXT, email TEXT);'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          },
          {
            id: 'create_target_table',
            type: MigrationType.SCHEMA,
            name: 'Create Target Table',
            sql: {
              universal: 'CREATE TABLE IF NOT EXISTS target_table (id UUID, full_name TEXT, normalized_email TEXT);'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: ['create_source_table']
          },
          {
            id: 'transform_data',
            type: MigrationType.DATA,
            name: 'Transform Data',
            transform: {
              source: 'source_table',
              target: 'target_table',
              mapping: [
                {
                  source: 'id',
                  target: 'id',
                  required: true
                },
                {
                  source: 'first_name',
                  target: 'full_name',
                  transform: {
                    type: 'expression',
                    definition: 'CONCAT($, " ", last_name)'
                  },
                  required: true
                },
                {
                  source: 'email',
                  target: 'normalized_email',
                  transform: {
                    type: 'function',
                    definition: 'lower'
                  },
                  required: true
                }
              ],
              batchSize: 100
            },
            transactional: true,
            rollbackSupported: false,
            skipOnError: false,
            dependencies: ['create_target_table']
          }
        ]
      };

      const context: MigrationExecutionContext = {
        migrationId: dataTransformationMigration.id,
        pluginId: dataTransformationMigration.pluginId,
        version: dataTransformationMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(dataTransformationMigration, context);
      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(3);
    });
  });

  describe('Migration Planning', () => {
    test('should create migration plan with dependencies', async () => {
      const plan = await migrationEngine.createMigrationPlan(
        'test-plugin',
        '2.0.0',
        {
          dryRun: true,
          databaseEngine: DatabaseEngine.POSTGRESQL,
          sessionId: `plan-test-${Date.now()}`,
          timestamp: new Date(),
          direction: 'up',
          migrationId: '',
          version: '2.0.0',
          options: {
            skipBackup: true,
            skipValidation: false
          }
        }
      );

      expect(plan).toBeDefined();
      expect(plan.pluginId).toBe('test-plugin');
      expect(plan.targetVersion).toBe('2.0.0');
      expect(plan.dryRun).toBe(true);
      expect(plan.validation).toBeDefined();
    });
  });

  describe('Data Export/Import', () => {
    test('should export plugin data', async () => {
      const dataExport = await migrationEngine.exportData('test-plugin', undefined, 'json');

      expect(dataExport).toBeDefined();
      expect(dataExport.pluginId).toBe('test-plugin');
      expect(dataExport.format).toBe('json');
      expect(dataExport.data).toBeDefined();
      expect(dataExport.checksum).toBeDefined();
      expect(dataExport.size).toBeGreaterThan(0);
    });

    test('should import plugin data', async () => {
      // First export data
      const dataExport = await migrationEngine.exportData('test-plugin', undefined, 'json');

      // Then import it
      const dataImport = await migrationEngine.importData(dataExport, 'test-plugin', {
        overwrite: false,
        skipErrors: false,
        batchSize: 1000,
        validate: true
      });

      expect(dataImport).toBeDefined();
      expect(dataImport.pluginId).toBe('test-plugin');
      expect(dataImport.exportId).toBe(dataExport.id);
      expect(dataImport.recordsImported).toBeGreaterThanOrEqual(0);
      expect(dataImport.recordsSkipped).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle SQL syntax errors', async () => {
      const invalidMigration: PortableMigration = {
        ...testMigration,
        id: 'invalid-sql-test',
        up: [
          {
            id: 'invalid_sql',
            type: MigrationType.SCHEMA,
            name: 'Invalid SQL',
            sql: {
              universal: 'INVALID SQL SYNTAX HERE'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          }
        ]
      };

      const context: MigrationExecutionContext = {
        migrationId: invalidMigration.id,
        pluginId: invalidMigration.pluginId,
        version: invalidMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(invalidMigration, context);

      expect(result.success).toBe(false);
      expect(result.failedSteps).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('STEP_FAILED');
    });

    test('should continue on skip errors', async () => {
      const skipErrorMigration: PortableMigration = {
        ...testMigration,
        id: 'skip-error-test',
        up: [
          {
            id: 'first_step',
            type: MigrationType.SCHEMA,
            name: 'First Step',
            sql: {
              universal: 'SELECT 1;' // Valid SQL
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          },
          {
            id: 'failing_step',
            type: MigrationType.SCHEMA,
            name: 'Failing Step',
            sql: {
              universal: 'INVALID SQL' // Invalid SQL
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: true, // Skip on error
            dependencies: ['first_step']
          },
          {
            id: 'last_step',
            type: MigrationType.SCHEMA,
            name: 'Last Step',
            sql: {
              universal: 'SELECT 2;' // Valid SQL
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: ['failing_step']
          }
        ]
      };

      const context: MigrationExecutionContext = {
        migrationId: skipErrorMigration.id,
        pluginId: skipErrorMigration.pluginId,
        version: skipErrorMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(skipErrorMigration, context);

      expect(result.successfulSteps).toBe(2);
      expect(result.failedSteps).toBe(1);
      expect(result.skippedSteps).toBe(0);
      expect(result.steps).toHaveLength(3);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track execution performance', async () => {
      const context: MigrationExecutionContext = {
        migrationId: testMigration.id,
        pluginId: testMigration.pluginId,
        version: testMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `perf-test-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(testMigration, context);

      expect(result.duration).toBeGreaterThan(0);
      expect(result.estimatedDuration).toBe(30);
      expect(result.performanceRatio).toBeGreaterThan(0);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.endTime.getTime()).toBeGreaterThan(result.startTime.getTime());
    });
  });

  describe('Backup Management', () => {
    test('should create backup when required', async () => {
      const backupRequiredMigration: PortableMigration = {
        ...testMigration,
        id: 'backup-test',
        requiresBackup: true,
        up: [
          {
            id: 'create_then_drop',
            type: MigrationType.SCHEMA,
            name: 'Create Then Drop',
            sql: {
              universal: 'CREATE TABLE IF NOT EXISTS temp_table (id UUID PRIMARY KEY);'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          }
        ]
      };

      const context: MigrationExecutionContext = {
        migrationId: backupRequiredMigration.id,
        pluginId: backupRequiredMigration.pluginId,
        version: backupRequiredMigration.version,
        direction: 'up',
        dryRun: false,
        force: false,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `backup-test-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: false, // Don't skip backup
          skipValidation: false
        }
      };

      const result = await migrationEngine.executeMigration(backupRequiredMigration, context);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(true);
      expect(result.backupLocation).toBeDefined();
    });
  });

  afterEach(async () => {
    // Cleanup test tables
    try {
      await migrationEngine.executeMigration(testMigration, {
        migrationId: testMigration.id,
        pluginId: testMigration.pluginId,
        version: testMigration.version,
        direction: 'down',
        dryRun: false,
        force: true,
        databaseEngine: DatabaseEngine.POSTGRESQL,
        sessionId: `cleanup-${Date.now()}`,
        timestamp: new Date(),
        options: {
          skipBackup: true,
          skipValidation: true
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});

describe('MigrationFormatAdapter', () => {
  describe('Format Conversion', () => {
    test('should convert traditional migration to portable format', () => {
      const traditionalMigration = {
        version: '1.0.0',
        name: 'Traditional Migration',
        up: 'CREATE TABLE test (id UUID PRIMARY KEY);',
        down: 'DROP TABLE test;'
      };

      const portableMigration = MigrationFormatAdapter.toPortable(
        traditionalMigration,
        'test-plugin',
        [DatabaseEngine.POSTGRESQL]
      );

      expect(portableMigration.id).toBeDefined();
      expect(portableMigration.pluginId).toBe('test-plugin');
      expect(portableMigration.version).toBe('1.0.0');
      expect(portableMigration.name).toBe('Traditional Migration');
      expect(portableMigration.up).toHaveLength(1);
      expect(portableMigration.down).toHaveLength(1);
    });

    test('should serialize and deserialize migrations', () => {
      const originalMigration = {
        id: 'test-migration',
        pluginId: 'test-plugin',
        version: '1.0.0',
        name: 'Test Migration',
        type: MigrationType.SCHEMA,
        dependencies: [],
        conflicts: [],
        up: [
          {
            id: 'test-step',
            type: MigrationType.SCHEMA,
            name: 'Test Step',
            sql: {
              universal: 'CREATE TABLE test (id UUID PRIMARY KEY);'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          }
        ],
        down: [],
        category: 'install',
        estimatedDuration: 30,
        riskLevel: RiskLevel.LOW,
        requiresBackup: false,
        databaseEngines: [DatabaseEngine.POSTGRESQL],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const json = MigrationFormatAdapter.toJSON(originalMigration);
      const deserializedMigration = MigrationFormatAdapter.fromJSON(json);

      expect(deserializedMigration.id).toBe(originalMigration.id);
      expect(deserializedMigration.pluginId).toBe(originalMigration.pluginId);
      expect(deserializedMigration.version).toBe(originalMigration.version);
      expect(deserializedMigration.up).toHaveLength(1);
      expect(deserializedMigration.up[0].id).toBe('test-step');
    });
  });

  describe('SQL File Generation', () => {
    test('should generate SQL file for migration', () => {
      const migration = {
        id: 'test-migration',
        pluginId: 'test-plugin',
        version: '1.0.0',
        name: 'Test Migration',
        type: MigrationType.SCHEMA,
        dependencies: [],
        conflicts: [],
        up: [
          {
            id: 'create_table',
            type: MigrationType.SCHEMA,
            name: 'Create Table',
            sql: {
              universal: 'CREATE TABLE test (id UUID PRIMARY KEY);'
            },
            transactional: true,
            rollbackSupported: true,
            skipOnError: false,
            dependencies: []
          }
        ],
        down: [
          {
            id: 'drop_table',
            type: MigrationType.SCHEMA,
            name: 'Drop Table',
            sql: {
              universal: 'DROP TABLE test;'
            },
            transactional: true,
            rollbackSupported: false,
            skipOnError: false,
            dependencies: []
          }
        ],
        category: 'install',
        estimatedDuration: 30,
        riskLevel: RiskLevel.LOW,
        requiresBackup: false,
        databaseEngines: [DatabaseEngine.POSTGRESQL],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sqlFile = MigrationFormatAdapter.toSQLFile(migration, DatabaseEngine.POSTGRESQL, 'up');

      expect(sqlFile).toContain('-- Migration: Test Migration');
      expect(sqlFile).toContain('-- Plugin: test-plugin');
      expect(sqlFile).toContain('-- Direction: up');
      expect(sqlFile).toContain('BEGIN;');
      expect(sqlFile).toContain('-- Step: Create Table');
      expect(sqlFile).toContain('CREATE TABLE test');
      expect(sqlFile).toContain('COMMIT;');
    });
  });
});
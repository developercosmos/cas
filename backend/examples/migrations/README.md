# Portable Migration System for CAS Plugins

This document provides comprehensive examples and guidance for using the portable migration system designed for CAS plugin installations and upgrades.

## Overview

The portable migration system enables:
- **Cross-database compatibility** (PostgreSQL, MySQL, SQLite, etc.)
- **Safe rollbacks** with automatic backup creation
- **Data transformations** with field mapping and validation
- **Dependency management** between migrations
- **Conflict detection** and resolution
- **Performance monitoring** and statistics
- **Export/import capabilities** for data portability

## Migration Structure

### Portable Migration Format

A portable migration consists of:

```json
{
  "format": "portable-migration-v1",
  "migration": {
    "id": "unique-migration-id",
    "pluginId": "plugin-identifier",
    "version": "semantic-version",
    "name": "Human-readable name",
    "description": "Migration description",
    "type": "migration-type",
    "dependencies": ["dependency-migration-ids"],
    "conflicts": [],
    "category": "migration-category",
    "estimatedDuration": 120,
    "riskLevel": "medium",
    "requiresBackup": false,
    "databaseEngines": ["postgresql", "mysql"],
    "steps": {
      "up": [...],
      "down": [...]
    },
    "createdAt": "ISO-timestamp",
    "updatedAt": "ISO-timestamp"
  }
}
```

### Migration Types

- **SCHEMA**: Database schema changes (tables, columns, constraints)
- **DATA**: Data migration and transformation
- **INDEX**: Index creation and management
- **FUNCTION**: Stored procedures and functions
- **TRIGGER**: Database triggers
- **VIEW**: Views and materialized views
- **EXTENSION**: Database extensions
- **PERMISSION**: Permission and role changes

### Migration Categories

- **INSTALL**: Initial plugin installation
- **UPGRADE**: Version upgrades
- **PATCH**: Bug fixes
- **FEATURE**: New features
- **PERFORMANCE**: Performance optimizations
- **SECURITY**: Security updates
- **MAINTENANCE**: Maintenance tasks
- **MIGRATION**: Data migration between versions

## Step Structure

Each migration step contains:

```json
{
  "id": "unique-step-id",
  "type": "step-type",
  "name": "Step name",
  "description": "Step description",
  "sql": {
    "postgresql": "PostgreSQL-specific SQL",
    "mysql": "MySQL-specific SQL",
    "universal": "Universal SQL (PostgreSQL-compatible)"
  },
  "transform": {
    "source": "source-table",
    "target": "target-table",
    "mapping": [...],
    "filter": "WHERE clause",
    "batchSize": 1000,
    "validation": [...]
  },
  "transactional": true,
  "rollbackSupported": true,
  "skipOnError": false,
  "timeout": 300,
  "dependencies": [],
  "preValidation": "validation-sql",
  "postValidation": "validation-sql",
  "expectedChanges": {
    "rows": 1000,
    "tables": 1,
    "indexes": 2
  }
}
```

## Data Transformations

Data transformations enable complex data migration between tables with field mapping, validation, and batch processing.

### Field Mapping

```json
{
  "source": "source_field_name",
  "target": "target_field_name",
  "transform": {
    "type": "function|expression|lookup|custom",
    "definition": "transform-definition",
    "parameters": ["param1", "param2"]
  },
  "defaultValue": "default-value",
  "required": true
}
```

### Transform Functions

- **FUNCTION**: Built-in or custom functions (upper, lower, trim, round)
- **EXPRESSION**: SQL expressions
- **LOOKUP**: Value mapping/translation
- **CUSTOM**: Custom transformation logic

### Validation Rules

```json
{
  "field": "field-name",
  "rule": "SQL validation expression",
  "message": "Error message",
  "severity": "error|warning"
}
```

## Example Migrations

### 1. Schema Migration (Vector Support)

See `sample_portable_migration.json` for a comprehensive example that:
- Creates vector extensions for PostgreSQL
- Sets up vector embedding tables
- Creates indexes for performance
- Migrates existing data
- Implements search functions

### 2. Data Migration (User Enhancement)

See `sample_data_migration.json` for an advanced data migration example that:
- Creates enhanced user table structure
- Transforms existing user data with field mappings
- Validates data integrity
- Sets up audit trails
- Implements relationship management

## Usage Examples

### Creating a Migration

```typescript
import { PluginMigrationService } from './services/migration/PluginMigrationService.js';

const migrationService = new PluginMigrationService();

// Create a new migration
const migration = await migrationService.createMigration('my-plugin', {
  name: 'Add User Profiles',
  type: MigrationType.SCHEMA,
  category: 'feature',
  estimatedDuration: 60,
  riskLevel: RiskLevel.LOW,
  up: [
    {
      id: 'create_user_profiles',
      type: MigrationType.SCHEMA,
      name: 'Create User Profiles Table',
      sql: {
        universal: 'CREATE TABLE plugin.user_profiles (...)'
      },
      transactional: true,
      rollbackSupported: true
    }
  ],
  down: [
    {
      id: 'drop_user_profiles',
      type: MigrationType.SCHEMA,
      name: 'Drop User Profiles Table',
      sql: {
        universal: 'DROP TABLE plugin.user_profiles CASCADE;'
      },
      transactional: true,
      rollbackSupported: false
    }
  ]
});
```

### Executing a Migration

```typescript
// Create migration plan
const plan = await migrationService.createUpgradePlan('my-plugin', '2.0.0');

// Execute with options
const results = await migrationService.executeMigrationPlan(plan, {
  dryRun: false,
  continueOnError: false,
  skipBackup: false,
  userId: 'admin-user-id'
});
```

### Data Export/Import

```typescript
// Export plugin data
const dataExport = await migrationService.exportPluginData('my-plugin', {
  users: ['user1', 'user2'],
  dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
  tables: ['user_data', 'preferences']
}, 'json');

// Import plugin data
const dataImport = await migrationService.importPluginData(dataExport, 'my-plugin', {
  overwrite: true,
  skipErrors: false,
  batchSize: 1000,
  validate: true
});
```

### Creating Migration Packages

```typescript
// Create portable migration package
const packagePath = await migrationService.createMigrationPackage(
  'my-plugin',
  true, // include data
  '/path/to/output'
);

// Install from package
const result = await migrationService.installFromMigrationPackage(packagePath, {
  executeMigrations: true,
  importData: true
});
```

## Database Compatibility

The system supports multiple database engines:

### PostgreSQL
- Full feature support with native JSONB, UUID, and vector operations
- Advanced features: HNSW indexes, GIN indexes, trigger functions
- Optimal performance for complex migrations

### MySQL
- JSON storage instead of JSONB
- CHAR(36) for UUIDs
- Different index syntax
- Limited vector support (simulated with JSON)

### SQLite
- Simplified data types (TEXT, INTEGER)
- No extension support
- Suitable for development and small deployments

### Microsoft SQL Server
- NVARCHAR(MAX) for JSON storage
- UNIQUEIDENTIFIER for UUIDs
- Different trigger and function syntax

## Best Practices

### Migration Design
1. **Idempotent operations**: Use `IF NOT EXISTS` and `DROP IF EXISTS`
2. **Transaction safety**: Group related operations in transactions
3. **Rollback support**: Ensure all steps can be rolled back
4. **Validation**: Include pre and post validation checks
5. **Performance**: Use appropriate batch sizes for data migrations

### Data Transformations
1. **Field validation**: Validate all data during migration
2. **Error handling**: Skip problematic records with logging
3. **Batch processing**: Process data in reasonable batches
4. **Progress tracking**: Monitor migration progress
5. **Backups**: Always create backups before data modifications

### Risk Management
1. **Risk assessment**: Use appropriate risk levels
2. **Backup strategy**: Require backups for high-risk operations
3. **Testing**: Test migrations in development environments
4. **Rollback plans**: Ensure rollback capabilities
5. **Monitoring**: Monitor migration execution

### Performance Optimization
1. **Index management**: Create indexes before data migration
2. **Batch sizes**: Optimize batch sizes for data volume
3. **Parallel processing**: Enable parallel step execution where safe
4. **Resource management**: Set appropriate timeouts
5. **Progress tracking**: Monitor execution progress

## API Endpoints

The migration system provides comprehensive REST APIs:

- `GET /api/migrations/status` - Get migration status
- `GET /api/migrations/status/:pluginId` - Get plugin migration status
- `POST /api/migrations/plugins/:pluginId/plan` - Create migration plan
- `POST /api/migrations/plan/:planId/execute` - Execute migration plan
- `POST /api/migrations/plugins/:pluginId/export` - Export plugin data
- `POST /api/migrations/plugins/:pluginId/import` - Import plugin data
- `POST /api/migrations/plugins/:pluginId/package` - Create migration package
- `POST /api/migrations/install-from-package` - Install from package

## Error Handling

### Common Migration Errors

1. **SQL Syntax Errors**: Database-specific syntax issues
2. **Constraint Violations**: Data integrity violations
3. **Timeout Errors**: Long-running operations
4. **Permission Errors**: Insufficient database permissions
5. **Dependency Errors**: Missing or circular dependencies

### Recovery Strategies

1. **Rollback**: Use automatic rollback capabilities
2. **Manual Intervention**: Manual database fixes
3. **Partial Recovery**: Recover from specific steps
4. **Data Restoration**: Restore from backups
5. **Retry Logic**: Retry failed operations

## Monitoring and Statistics

### Migration Statistics
- Total migrations executed
- Success/failure rates
- Average execution times
- Data volume processed
- Backup sizes and retention

### Performance Metrics
- Step execution times
- Rows processed per second
- Database load during migration
- Memory usage patterns
- I/O performance

### Audit Trail
- Complete execution logs
- Step-by-step tracking
- Error details and recovery
- User attribution
- Change tracking

## Security Considerations

### Access Control
- Admin-only migration execution
- User attribution for all changes
- Audit trail maintenance
- Permission validation

### Data Protection
- Encrypted backup storage
- Sensitive data handling
- Secure data export/import
- Access logging

### SQL Injection Prevention
- Parameterized queries
- Input validation
- SQL syntax checking
- Safe string interpolation

This portable migration system provides enterprise-grade capabilities for safe, reliable plugin installations and upgrades with full data portability and cross-database compatibility.
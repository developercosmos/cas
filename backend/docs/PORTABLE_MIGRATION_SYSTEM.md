# Portable Migration System for CAS Plugins

## Overview

The Portable Migration System is a comprehensive, enterprise-grade migration framework designed for the CAS plugin ecosystem. It enables safe, portable plugin installations and upgrades with full data portability and cross-database compatibility.

## Key Features

### 🚀 **Cross-Database Compatibility**
- **PostgreSQL**: Full feature support with native JSONB, UUID, vector operations
- **MySQL**: JSON storage, CHAR(36) UUIDs, optimized syntax
- **SQLite**: Lightweight deployment with simplified data types
- **SQL Server**: Enterprise-grade with NVARCHAR and UNIQUEIDENTIFIER support
- **Oracle**: Production-ready with RAW(16) and TIMESTAMP support

### 🔒 **Safety & Reliability**
- **Automatic Rollback**: Every migration can be rolled back safely
- **Backup Integration**: Automatic backup creation before high-risk operations
- **Transaction Safety**: Atomic operations with proper isolation
- **Validation System**: Pre and post-execution validation
- **Error Recovery**: Comprehensive error handling with recovery suggestions

### 📦 **Data Portability**
- **Export/Import**: Complete data export with filtering options
- **Transformations**: Complex data field mapping and validation
- **Package System**: Portable migration packages with metadata
- **Cross-Environment**: Move data between development, staging, production

### 🔧 **Advanced Features**
- **Dependency Management**: Automatic dependency resolution
- **Conflict Detection**: Smart conflict identification and resolution
- **Performance Monitoring**: Execution tracking and optimization
- **Batch Processing**: Efficient handling of large datasets
- **Audit Trail**: Complete execution logging and change tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Migration API Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   REST API      │  │   GraphQL API   │  │ CLI Tools    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Migration Service Layer                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │Migration Engine │  │Format Adapter  │  │Plugin Service│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Core Components                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Validation     │  │ Dependency      │  │ Backup       │ │
│  │  System         │  │ Resolver        │  │ Manager      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Database Abstraction                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │  │      MySQL      │  │    SQLite    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Migration Format

### Portable Migration JSON

```json
{
  "format": "portable-migration-v1",
  "migration": {
    "id": "unique-migration-identifier",
    "pluginId": "plugin-identifier",
    "version": "semantic-version",
    "name": "Human-Readable Migration Name",
    "description": "Detailed migration description",
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

| Type | Description | Example |
|------|-------------|---------|
| **SCHEMA** | Database schema changes | CREATE/ALTER/DROP tables |
| **DATA** | Data migration and transformation | ETL operations |
| **INDEX** | Index creation and management | Performance optimization |
| **FUNCTION** | Stored procedures and functions | Business logic |
| **TRIGGER** | Database triggers | Automation |
| **VIEW** | Views and materialized views | Data abstraction |
| **EXTENSION** | Database extensions | pgvector, uuid-ossp |
| **PERMISSION** | Permission and role changes | Security |

### Migration Categories

| Category | Use Case | Risk Level |
|----------|----------|------------|
| **INSTALL** | Initial plugin installation | Low-Medium |
| **UPGRADE** | Version upgrades | Medium |
| **PATCH** | Bug fixes | Low |
| **FEATURE** | New features | Medium |
| **PERFORMANCE** | Performance optimizations | Medium |
| **SECURITY** | Security updates | High |
| **MAINTENANCE** | Maintenance tasks | Low-Medium |
| **MIGRATION** | Data migration | High |

## Step Structure

Each migration step contains:

```json
{
  "id": "unique-step-id",
  "type": "step-type",
  "name": "Step Name",
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

| Type | Description | Examples |
|------|-------------|----------|
| **FUNCTION** | Built-in functions | upper, lower, trim, round |
| **EXPRESSION** | SQL expressions | CONCAT, CASE statements |
| **LOOKUP** | Value mapping | Department code to name |
| **CUSTOM** | Custom logic | Complex transformations |

### Validation Rules

```json
{
  "field": "field-name",
  "rule": "SQL validation expression",
  "message": "Error message",
  "severity": "error|warning"
}
```

## Usage Examples

### TypeScript API

```typescript
import { PluginMigrationService } from './services/migration/PluginMigrationService.js';
import { MigrationType, DatabaseEngine, RiskLevel } from './services/migration/types.js';

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
        universal: 'CREATE TABLE plugin.user_profiles (id UUID PRIMARY KEY DEFAULT uuid_generate_v4());'
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

// Create migration plan
const plan = await migrationService.createUpgradePlan('my-plugin', '2.0.0');

// Execute migration
const results = await migrationService.executeMigrationPlan(plan, {
  dryRun: false,
  continueOnError: false,
  skipBackup: false,
  userId: 'admin-user-id'
});
```

### REST API

```bash
# Get migration status
curl -X GET "http://localhost:4000/api/migrations/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create migration plan
curl -X POST "http://localhost:4000/api/migrations/plugins/my-plugin/plan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetVersion": "2.0.0",
    "options": { "dryRun": false }
  }'

# Execute migration
curl -X POST "http://localhost:4000/api/migrations/plan/PLAN_ID/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plan": {...},
    "options": { "continueOnError": false }
  }'

# Export plugin data
curl -X POST "http://localhost:4000/api/migrations/plugins/my-plugin/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "format": "json",
    "filter": {
      "users": ["user1", "user2"],
      "dateRange": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-12-31T23:59:59Z"
      }
    }
  }'
```

### Migration Package Creation

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

## Database Engine Support

### PostgreSQL
```sql
-- Native support for advanced features
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE plugin.vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_vectors_embedding ON plugin.vectors
  USING hnsw (embedding vector_cosine_ops);
```

### MySQL
```sql
-- MySQL adaptation
CREATE TABLE plugin.vectors (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  embedding JSON NOT NULL,
  metadata JSON DEFAULT '{}',
  INDEX idx_embedding_model (JSON_EXTRACT(embedding, '$.model')),
  INDEX idx_metadata ((CAST(metadata AS CHAR(255) ARRAY)))
);
```

### SQLite
```sql
-- Lightweight deployment
CREATE TABLE plugin.vectors (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  embedding TEXT NOT NULL, -- JSON array
  metadata TEXT DEFAULT '{}'
);
CREATE INDEX idx_vectors_model ON plugin.vectors
  WHERE json_extract(embedding, '$.model') IS NOT NULL;
```

## Best Practices

### Migration Design
1. **Idempotent Operations**: Use `IF NOT EXISTS` clauses
2. **Transaction Safety**: Group related operations
3. **Rollback Support**: Ensure all steps can be reversed
4. **Validation**: Include comprehensive validation
5. **Performance**: Use appropriate batch sizes

### Data Transformations
1. **Field Validation**: Validate all data
2. **Error Handling**: Skip problematic records with logging
3. **Batch Processing**: Process data in reasonable batches
4. **Progress Tracking**: Monitor migration progress
5. **Backups**: Always backup before data changes

### Risk Management
1. **Risk Assessment**: Use appropriate risk levels
2. **Backup Strategy**: Require backups for high-risk operations
3. **Testing**: Test in development environments
4. **Rollback Plans**: Ensure rollback capabilities
5. **Monitoring**: Monitor execution progress

### Performance Optimization
1. **Index Management**: Create indexes before data migration
2. **Batch Sizes**: Optimize for data volume
3. **Parallel Processing**: Enable where safe
4. **Resource Management**: Set appropriate timeouts
5. **Progress Tracking**: Monitor execution metrics

## Error Handling & Recovery

### Common Error Types
- **SQL Syntax Errors**: Database-specific syntax issues
- **Constraint Violations**: Data integrity violations
- **Timeout Errors**: Long-running operations
- **Permission Errors**: Insufficient database permissions
- **Dependency Errors**: Missing or circular dependencies

### Recovery Strategies
1. **Automatic Rollback**: Built-in rollback capabilities
2. **Manual Intervention**: Manual database fixes
3. **Partial Recovery**: Recover from specific steps
4. **Data Restoration**: Restore from backups
5. **Retry Logic**: Retry failed operations

## Security Considerations

### Access Control
- **Admin-Only Execution**: Migration execution requires admin privileges
- **User Attribution**: All changes are attributed to users
- **Audit Trail**: Complete logging of all operations
- **Permission Validation**: Verify database permissions

### Data Protection
- **Encrypted Backups**: Backup files are encrypted
- **Sensitive Data**: Safe handling of sensitive information
- **Secure Export**: Encrypted data export
- **Access Logging**: Complete access logging

### SQL Injection Prevention
- **Parameterized Queries**: Use parameterized statements
- **Input Validation**: Validate all inputs
- **SQL Syntax Checking**: Validate SQL syntax
- **Safe Interpolation**: Safe string interpolation

## Monitoring & Statistics

### Migration Metrics
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

## API Reference

### Migration Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/migrations/status` | Get all migration status |
| GET | `/api/migrations/status/:pluginId` | Get plugin migration status |
| POST | `/api/migrations/plugins/:pluginId/migrations` | Create new migration |
| POST | `/api/migrations/plugins/:pluginId/plan` | Create migration plan |
| POST | `/api/migrations/plan/:planId/execute` | Execute migration plan |
| POST | `/api/migrations/plugins/:pluginId/rollback` | Rollback plugin |
| POST | `/api/migrations/plugins/:pluginId/export` | Export plugin data |
| POST | `/api/migrations/plugins/:pluginId/import` | Import plugin data |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/migrations/conflicts` | Detect plugin conflicts |
| GET | `/api/migrations/statistics` | Get migration statistics |
| POST | `/api/migrations/migrations/validate` | Validate migration |
| POST | `/api/migrations/migrations/convert` | Convert migration format |

## Testing

The system includes comprehensive tests covering:
- Migration execution and rollback
- Data transformations and validation
- Cross-database compatibility
- Error handling and recovery
- Performance monitoring
- Security validation

Run tests:
```bash
npm test -- tests/migration/
```

## Roadmap

### Future Enhancements
- **Multi-Database Transactions**: Cross-database transaction support
- **Advanced Scheduling**: Cron-based migration scheduling
- **Real-time Monitoring**: WebSocket-based progress updates
- **Machine Learning**: AI-powered migration optimization
- **Cloud Integration**: Direct cloud deployment support

### Database Support
- **Amazon Aurora**: AWS-native database support
- **Google Cloud SQL**: GCP integration
- **Azure Database**: Microsoft Azure support
- **CockroachDB**: Distributed database support
- **MongoDB**: NoSQL migration support

## Conclusion

The Portable Migration System provides enterprise-grade capabilities for safe, reliable plugin installations and upgrades with full data portability and cross-database compatibility. It's designed to handle complex migration scenarios while ensuring data integrity and system stability.

The system's modular architecture allows for easy extension and customization, while its comprehensive API and CLI tools provide flexibility for different deployment scenarios. Built-in security features, audit trails, and error handling make it suitable for production environments with strict compliance requirements.

For questions, issues, or contributions, please refer to the project repository and documentation.
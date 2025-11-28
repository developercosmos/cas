import { DatabaseService } from './DatabaseService.js';

// Core migration interfaces for portable plugin system
export interface PortableMigration {
  // Identification metadata
  id: string;                    // Unique migration identifier (UUID)
  pluginId: string;              // Plugin this migration belongs to
  version: string;               // Semantic version (e.g., "1.2.3")
  name: string;                  // Human-readable migration name
  description?: string;          // Optional description

  // Migration content
  type: MigrationType;           // Type of migration
  dependencies: string[];        // Required migrations (from any plugin)
  conflicts: string[];           // Conflicting migrations

  // Execution content (portable format)
  up: PortableMigrationStep[];   // Migration steps (forward)
  down: PortableMigrationStep[]; // Migration steps (rollback)

  // Metadata
  author?: string;               // Migration author
  category: MigrationCategory;   // Migration category
  estimatedDuration: number;     // Estimated execution time (seconds)
  riskLevel: RiskLevel;          // Risk assessment
  requiresBackup: boolean;       // Whether backup is recommended
  batchSize?: number;           // Batch size for data migrations

  // Versioning and compatibility
  minSystemVersion?: string;     // Minimum CAS system version
  maxSystemVersion?: string;     // Maximum CAS system version (breaking changes)
  databaseEngines: DatabaseEngine[]; // Supported database engines

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum MigrationType {
  SCHEMA = 'schema',             // Database schema changes
  DATA = 'data',                 // Data migration/transformations
  CONFIG = 'config',             // Configuration changes
  PERMISSION = 'permission',     // Permission/role changes
  DEPENDENCY = 'dependency',     // Plugin dependency changes
  INDEX = 'index',               // Index management
  FUNCTION = 'function',         // Stored procedures/functions
  TRIGGER = 'trigger',           // Database triggers
  CONSTRAINT = 'constraint',     // Data constraints
  VIEW = 'view',                 // Views and materialized views
  EXTENSION = 'extension'        // Database extensions
}

export enum MigrationCategory {
  INSTALL = 'install',           // Plugin installation
  UPGRADE = 'upgrade',           // Version upgrade
  PATCH = 'patch',               // Bug fix
  FEATURE = 'feature',           // New feature
  PERFORMANCE = 'performance',   // Performance optimization
  SECURITY = 'security',         // Security updates
  MAINTENANCE = 'maintenance',   // Maintenance tasks
  MIGRATION = 'migration',       // Data migration
  CLEANUP = 'cleanup'            // Cleanup operations
}

export enum RiskLevel {
  LOW = 'low',                   // Safe operations
  MEDIUM = 'medium',             // Requires caution
  HIGH = 'high',                 // Risky operations
  CRITICAL = 'critical'          // High impact operations
}

export enum DatabaseEngine {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MSSQL = 'mssql',
  ORACLE = 'oracle'
}

export interface PortableMigrationStep {
  id: string;                    // Step identifier
  type: MigrationType;           // Step type
  name: string;                  // Step name
  description?: string;          // Step description

  // Portable SQL content (multi-dialect support)
  sql: {
    [key in DatabaseEngine]?: string; // Engine-specific SQL
    universal?: string;          // Universal SQL (PostgreSQL-compatible)
  };

  // Data transformation (for data migrations)
  transform?: {
    source: string;              // Source table/query
    target: string;              // Target table
    mapping: FieldMapping[];     // Field transformations
    filter?: string;             // Data filtering conditions
    batchSize?: number;          // Batch processing size
    validation?: ValidationRule[]; // Data validation rules
  };

  // Execution options
  transactional: boolean;        // Whether step runs in transaction
  rollbackSupported: boolean;    // Whether step can be rolled back
  skipOnError: boolean;          // Whether to continue on error
  timeout?: number;              // Step timeout (seconds)
  dependencies: string[];        // Other steps this depends on

  // Validation and verification
  preValidation?: string;        // Pre-execution validation SQL
  postValidation?: string;       // Post-execution validation SQL
  expectedChanges?: {
    rows: number;                // Expected row changes
    tables: number;              // Expected table changes
    indexes: number;             // Expected index changes
  };
}

export interface FieldMapping {
  source: string;                // Source field/expression
  target: string;                // Target field
  transform?: TransformFunction; // Transformation function
  defaultValue?: any;            // Default value if source is null
  required: boolean;             // Whether target field is required
}

export interface TransformFunction {
  type: 'function' | 'expression' | 'lookup' | 'custom';
  definition: string;            // Function definition or expression
  parameters?: any[];            // Function parameters
}

export interface ValidationRule {
  field: string;                 // Field to validate
  rule: string;                  // Validation rule (SQL expression)
  message: string;               // Error message
  severity: 'error' | 'warning'; // Validation severity
}

// Migration execution context
export interface MigrationExecutionContext {
  migrationId: string;           // Migration being executed
  pluginId: string;              // Plugin context
  version: string;               // Target version
  direction: 'up' | 'down';      // Execution direction
  dryRun: boolean;               // Dry run mode
  force: boolean;                // Force execution (skip checks)
  databaseEngine: DatabaseEngine; // Target database engine

  // User and system context
  userId?: string;               // User performing migration
  sessionId: string;             // Migration session ID
  timestamp: Date;               // Execution timestamp

  // Options and filters
  options: {
    skipBackup?: boolean;        // Skip backup creation
    skipValidation?: boolean;    // Skip validation checks
    batchSize?: number;          // Custom batch size
    timeout?: number;            // Custom timeout
    parallelSteps?: boolean;     // Enable parallel step execution
    maxParallelSteps?: number;   // Maximum parallel steps
  };

  // Data filtering (for selective migrations)
  dataFilter?: {
    users?: string[];            // Specific users to migrate
    dateRange?: {               // Date range filtering
      start: Date;
      end: Date;
    };
    conditions?: string[];       // Custom SQL conditions
  };
}

// Migration execution result
export interface MigrationResult {
  success: boolean;              // Overall success status
  migrationId: string;           // Migration ID
  pluginId: string;              // Plugin ID
  version: string;               // Migration version
  direction: 'up' | 'down';      // Execution direction

  // Execution details
  steps: StepResult[];           // Step execution results
  totalSteps: number;            // Total number of steps
  successfulSteps: number;       // Successfully completed steps
  failedSteps: number;           // Failed steps
  skippedSteps: number;          // Skipped steps

  // Timing information
  startTime: Date;               // Start time
  endTime: Date;                 // End time
  duration: number;              // Duration in seconds
  estimatedDuration: number;     // Estimated duration
  performanceRatio: number;      // Actual vs estimated ratio

  // Data changes
  changes: {
    tablesCreated: number;       // Tables created
    tablesModified: number;      // Tables modified
    tablesDropped: number;       // Tables dropped
    indexesCreated: number;      // Indexes created
    indexesDropped: number;      // Indexes dropped
    rowsInserted: number;        // Rows inserted
    rowsUpdated: number;         // Rows updated
    rowsDeleted: number;         // Rows deleted
  };

  // Error information
  errors: MigrationError[];      // All errors encountered
  warnings: MigrationWarning[];  // All warnings

  // Additional information
  rollbackAvailable: boolean;    // Whether rollback is available
  backupCreated: boolean;        // Whether backup was created
  backupLocation?: string;       // Backup file location
  metadata: Record<string, any>; // Additional metadata
}

export interface StepResult {
  stepId: string;                // Step ID
  name: string;                  // Step name
  success: boolean;              // Step success status
  startTime: Date;               // Step start time
  endTime: Date;                 // Step end time
  duration: number;              // Step duration
  sqlExecuted?: string;          // SQL that was executed
  rowsAffected?: number;         // Number of rows affected
  error?: MigrationError;        // Error if failed
  warnings?: MigrationWarning[]; // Warnings if any
  rollbackAvailable: boolean;    // Whether rollback is available
  metadata: Record<string, any>; // Step metadata
}

export interface MigrationError {
  code: string;                  // Error code
  message: string;               // Error message
  details?: string;              // Detailed error information
  stepId?: string;               // Step where error occurred
  sql?: string;                  // SQL that caused error
  timestamp: Date;               // Error timestamp
  recoverable: boolean;          // Whether error is recoverable
  suggestions?: string[];        // Recovery suggestions
}

export interface MigrationWarning {
  code: string;                  // Warning code
  message: string;               // Warning message
  stepId?: string;               // Step where warning occurred
  timestamp: Date;               // Warning timestamp
  severity: 'low' | 'medium' | 'high'; // Warning severity
  recommendations?: string[];    // Recommendations
}

// Migration dependency resolution
export interface MigrationDependency {
  migrationId: string;           // Required migration ID
  pluginId: string;              // Plugin ID (can be different)
  version: string;               // Required version
  optional: boolean;             // Whether dependency is optional
  reason?: string;               // Reason for dependency
}

// Migration conflict detection
export interface MigrationConflict {
  type: ConflictType;            // Conflict type
  migrationId1: string;          // First migration ID
  migrationId2: string;          // Second migration ID
  description: string;           // Conflict description
  severity: 'low' | 'medium' | 'high' | 'critical'; // Conflict severity
  resolution?: string;           // Suggested resolution
  autoResolvable: boolean;       // Whether conflict can be auto-resolved
}

export enum ConflictType {
  TABLE_CONFLICT = 'table_conflict',         // Same table modifications
  COLUMN_CONFLICT = 'column_conflict',       // Same column modifications
  INDEX_CONFLICT = 'index_conflict',         // Index conflicts
  CONSTRAINT_CONFLICT = 'constraint_conflict', // Constraint conflicts
  FUNCTION_CONFLICT = 'function_conflict',   // Function conflicts
  NAMING_CONFLICT = 'naming_conflict',       // Object naming conflicts
  DEPENDENCY_CONFLICT = 'dependency_conflict', // Dependency conflicts
  VERSION_CONFLICT = 'version_conflict'      // Version incompatibilities
}

// Migration backup and restore
export interface MigrationBackup {
  id: string;                    // Backup ID
  migrationId: string;           // Migration being backed up
  pluginId: string;              // Plugin context
  version: string;               // Migration version

  // Backup content
  schema: BackupSchema;          // Schema backup
  data: BackupData[];            // Data backups
  indexes: BackupIndex[];        // Index backups

  // Backup metadata
  createdAt: Date;               // Backup creation time
  size: number;                  // Backup size in bytes
  compression: string;           // Compression method
  checksum: string;              // Backup checksum

  // Backup options
  includeData: boolean;          // Whether data was included
  includeIndexes: boolean;       // Whether indexes were included
  excludeTables: string[];       // Tables excluded from backup
  includeSystemTables: boolean;  // Whether system tables included
}

export interface BackupSchema {
  tables: TableDefinition[];     // Table definitions
  views: ViewDefinition[];       // View definitions
  functions: FunctionDefinition[]; // Function definitions
  triggers: TriggerDefinition[]; // Trigger definitions
  constraints: ConstraintDefinition[]; // Constraint definitions
}

export interface BackupData {
  tableName: string;             // Table name
  rows: number;                  // Number of rows
  data: string;                  // Serialized data (JSON/CSV)
  format: 'json' | 'csv' | 'sql'; // Data format
  compression?: string;          // Compression used
  checksum: string;              // Data checksum
}

export interface TableDefinition {
  name: string;                  // Table name
  schema: string;                // Schema definition
  columns: ColumnDefinition[];   // Column definitions
  constraints: ConstraintDefinition[]; // Table constraints
  indexes: IndexDefinition[];    // Table indexes
  metadata: Record<string, any>; // Table metadata
}

export interface ColumnDefinition {
  name: string;                  // Column name
  type: string;                  // Column type
  nullable: boolean;             // Whether nullable
  defaultValue?: any;            // Default value
  constraints: string[];         // Column constraints
  metadata: Record<string, any>; // Column metadata
}

export interface IndexDefinition {
  name: string;                  // Index name
  columns: string[];             // Indexed columns
  type: string;                  // Index type (btree, hash, etc.)
  unique: boolean;               // Whether unique
  metadata: Record<string, any>; // Index metadata
}

export interface ViewDefinition {
  name: string;                  // View name
  definition: string;            // View definition
  metadata: Record<string, any>; // View metadata
}

export interface FunctionDefinition {
  name: string;                  // Function name
  definition: string;            // Function definition
  parameters: ParameterDefinition[]; // Function parameters
  returnType: string;            // Return type
  language: string;              // Function language
  metadata: Record<string, any>; // Function metadata
}

export interface TriggerDefinition {
  name: string;                  // Trigger name
  table: string;                 // Trigger table
  event: string;                 // Trigger event
  timing: string;                // Trigger timing
  definition: string;            // Trigger definition
  metadata: Record<string, any>; // Trigger metadata
}

export interface ConstraintDefinition {
  name: string;                  // Constraint name
  type: string;                  // Constraint type
  definition: string;            // Constraint definition
  metadata: Record<string, any>; // Constraint metadata
}

export interface BackupIndex {
  name: string;                  // Index name
  definition: string;            // Index definition
  table: string;                 // Table name
}

export interface ParameterDefinition {
  name: string;                  // Parameter name
  type: string;                  // Parameter type
  defaultValue?: any;            // Default value
  mode: 'IN' | 'OUT' | 'INOUT';  // Parameter mode
}

// Migration validation
export interface MigrationValidation {
  migrationId: string;           // Migration to validate
  valid: boolean;                // Overall validation status
  errors: ValidationError[];     // Validation errors
  warnings: ValidationWarning[]; // Validation warnings
  recommendations: string[];     // Recommendations
  timestamp: Date;               // Validation timestamp
}

export interface ValidationError {
  type: string;                  // Error type
  message: string;               // Error message
  stepId?: string;               // Step with error
  field?: string;                // Field with error
  severity: 'error' | 'critical'; // Error severity
  fixable: boolean;              // Whether error is fixable
  suggestion?: string;           // Fix suggestion
}

export interface ValidationWarning {
  type: string;                  // Warning type
  message: string;               // Warning message
  stepId?: string;               // Step with warning
  field?: string;                // Field with warning
  severity: 'low' | 'medium' | 'high'; // Warning severity
  recommendation: string;        // Recommendation
}

// Migration plan
export interface MigrationPlan {
  id: string;                    // Plan ID
  pluginId: string;              // Plugin context
  targetVersion: string;         // Target version
  migrations: PlannedMigration[]; // Migrations to execute
  dependencies: string[];        // All dependencies
  conflicts: MigrationConflict[]; // Detected conflicts

  // Execution information
  estimatedDuration: number;     // Estimated total duration
  estimatedRisk: RiskLevel;      // Overall risk assessment
  requiresBackup: boolean;       // Whether backup is recommended
  canRollback: boolean;          // Whether rollback is possible

  // Validation results
  validation: MigrationValidation; // Validation results

  // Plan metadata
  createdAt: Date;               // Plan creation time
  updatedAt: Date;               // Plan update time
  dryRun?: boolean;              // Whether this is a dry run
}

export interface PlannedMigration {
  migration: PortableMigration;  // Migration to execute
  order: number;                 // Execution order
  dependencies: string[];        // Dependencies for this migration
  estimatedDuration: number;     // Estimated duration for this migration
}

// Data export/import for portability
export interface DataExport {
  id: string;                    // Export ID
  pluginId: string;              // Plugin context
  version: string;               // Plugin version
  format: 'json' | 'sql' | 'csv'; // Export format

  // Data filtering
  filter?: {
    users?: string[];            // Specific users
    dateRange?: {               // Date range
      start: Date;
      end: Date;
    };
    tables?: string[];           // Specific tables
    conditions?: string[];       // Custom conditions
  };

  // Export content
  schema: any;                   // Schema definition
  data: any;                     // Data content
  metadata: any;                 // Export metadata

  // Export information
  createdAt: Date;               // Export time
  size: number;                  // Export size
  checksum: string;              // Export checksum
  compression?: string;          // Compression used
}

export interface DataImport {
  id: string;                    // Import ID
  pluginId: string;              // Plugin context
  targetVersion: string;         // Target version
  exportId: string;              // Source export ID

  // Import options
  options: {
    overwrite: boolean;          // Overwrite existing data
    skipErrors: boolean;         // Skip import errors
    batchSize: number;           // Batch size for import
    validate: boolean;           // Validate data before import
    transform?: string;          // Transformation script
  };

  // Import results
  success: boolean;              // Import success status
  recordsImported: number;       // Number of records imported
  recordsSkipped: number;        // Number of records skipped
  errors: ImportError[];         // Import errors

  // Import metadata
  startTime: Date;               // Import start time
  endTime: Date;                 // Import end time
  duration: number;              // Import duration
}

export interface ImportError {
  record: any;                   // Problematic record
  error: string;                 // Error message
  table?: string;                // Target table
  row?: number;                  // Row number
  recoverable: boolean;          // Whether error is recoverable
}
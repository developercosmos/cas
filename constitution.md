<!--
Sync Impact Report:
Version change: 1.2.0 → 1.3.0 (minor version - added plugin export/import standards)
Modified principles: N/A (existing principles unchanged)
Added sections: 
  - Section VIII: Plugin Architecture Requirements
  - Section IX: Plugin Lifecycle Management  
  - Section X: Plugin Database Standards
  - Section XI: Plugin API Design Standards
  - Section XII: Plugin Testing Requirements
  - Section XIII: Plugin Documentation Standards
  - Section XIV: Plugin Configuration Management
  - Section XV: Plugin Security Standards
  - Section XVI: Plugin Performance Standards
  - Section XVII: Plugin Interoperability
  - Section XVIII: Plugin Deployment Standards
  - Section XIX: Plugin Export/Import Standards (NEW)
Templates requiring updates:
  - New plugin template should be created following these standards
  - Existing plugins (LDAP, RAG) already comply with these standards
  - Export/Import functionality implemented in backend/src/api/plugins/routes.ts
Follow-up TODOs:
  - Create plugin template/boilerplate following these standards
  - Review existing plugins for full compliance
  - Add automated compliance checking in CI/CD
  - Implement plugin loader for dynamic code execution from imported ZIPs
  - Add digital signature support for enterprise deployments
-->

# CBS Constitution

## Core Principles

### I. Plugin-First Architecture
Every feature MUST be implemented as a plugin with complete isolation from core application functionality. Plugins MUST be independently testable, deployable, and maintainable. No core application logic should depend on specific plugin implementations.

### II. Headless by Design
All functionality MUST be headless and ready for serverless deployment. Components MUST separate display logic from data processing. APIs MUST be protocol-agnostic (REST, GraphQL, WebSocket) to support multiple client types.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD is mandatory: Tests MUST be written before implementation, must FAIL initially, then implementation makes them pass. Red-Green-Refactor cycle strictly enforced. No feature code without corresponding tests.

### IV. Integration Validation
Focus areas requiring comprehensive integration tests: Plugin loading/unloading, Authentication provider integrations, Canvas state persistence, Theme switching across components, Cross-plugin data flows.

### V. Observability & Performance
Structured logging MUST be implemented for all user interactions and system events. Performance metrics MUST include: <2s dashboard load, <300ms theme switching, <100ms canvas interactions. Error tracking MUST cover plugin failures independently.

### VI. Semantic Versioning & Compatibility
MAJOR.MINOR.PATCH format strictly enforced. Breaking changes MUST increment MAJOR version. Plugin APIs MUST maintain backward compatibility within MINOR versions. Deprecation notices MUST be provided at least one MINOR version ahead.

### VII. Security & Sandboxing
All plugins MUST execute in sandboxed environments with isolated data access. Authentication MUST support both local and imported users via plugins. Session management MUST use JWT tokens with proper expiration and refresh mechanisms.

## Technical Standards

### Technology Stack Requirements
TypeScript for type safety across frontend and backend. CSS/Less for styling with CSS custom properties for theme switching. Docker containerization for deployment. Node.js runtime environment. Framework-agnostic plugin interfaces.

### Performance Standards
Dashboard load time under 2 seconds. Theme switching under 300ms with smooth transitions. Canvas interactions under 100ms latency. Plugin loading under 1 second for up to 20 concurrent plugins. Support for 320px to 4K resolution width.

### Security Requirements
Sandboxed plugin execution with isolated data access. JWT-based session management. Support for local and imported authentication methods. No plugin access to core application internals or other plugins' private data.

### Database Naming Conventions

All database objects MUST follow consistent naming conventions to ensure maintainability and clarity across the application.

#### Schema and Table Naming
- **Schemas**: Use lowercase snake_case, prefixed with domain (e.g., `auth_users`, `dashboard_layouts`)
- **Tables**: Use lowercase snake_case, plural nouns with plugin prefixes for plugin-specific tables (e.g., `user_sessions`, `plugin_configurations`, `plugin_navigation_menus`)
- **Join Tables**: Use underscore-separated table names in alphabetical order (e.g., `user_plugin_permissions`)
- **Temporary Tables**: Prefix with `tmp_` (e.g., `tmp_canvas_exports`)

#### Plugin Table Classification
- **Transaction Tables**: Use `{plugin}_tx_` prefix for operational data (e.g., `plugin_theme_tx_user_preferences`)
- **Master Data Tables**: Use `{plugin}_md_` prefix for reference data (e.g., `plugin_theme_md_color_schemes`)
- **Configuration Tables**: Use `{plugin}_` prefix for configuration data (e.g., `plugin_theme_configurations`)

#### Field and Column Naming
- **Columns**: Use PascalCase for field names (e.g., `CreatedAt`, `ThemePreference`, `UserId`)
- **Primary Keys**: Use `Id` for single-field, `TableNameId` for composite keys
- **Foreign Keys**: Use `{Entity}Id` format (e.g., `UserId`, `PluginId`)
- **Boolean Fields**: Prefix with `Is`, `Has`, `Can` (e.g., `IsActive`, `HasPermission`, `CanEdit`)
- **Timestamp Fields**: Use `CreatedAt`, `UpdatedAt`, `DeletedAt` for consistency

#### Index and Constraint Naming
- **Indexes**: Prefix with `idx_`, use table and column names (e.g., `idx_users_email`, `idx_canvas_user_created`)
- **Unique Constraints**: Prefix with `uc_` (e.g., `uc_users_email`)
- **Foreign Key Constraints**: Prefix with `fk_` (e.g., `fk_plugins_user_id`)
- **Check Constraints**: Prefix with `ck_` (e.g., `ck_users_age_positive`)

#### Migration and Versioning
- **Migration Files**: Use timestamp prefix with descriptive name (e.g., `20251119_add_theme_preferences.sql`)
- **Migration Descriptions**: Use present-tense verbs (e.g., "add theme preferences table", "index user sessions")
- **Rollback Files**: Include corresponding rollback logic for all schema changes

#### Data Type Standards
- **IDs**: Use UUID for distributed systems, BIGINT SERIAL for monolithic
- **Booleans**: Use BOOLEAN type with DEFAULT FALSE
- **Timestamps**: Use TIMESTAMPTZ for all time-based fields
- **JSON Data**: Use JSONB for structured data with GIN indexes
- **Text Fields**: Use TEXT for variable strings, VARCHAR(n) only when size limits required

## Development Workflow

### Code Review Requirements
All changes MUST pass automated linting and type checking. Plugin changes MUST verify isolation boundaries. UI changes MUST test both light and dark themes. Performance impact MUST be measured for all user interactions.

### Quality Gates
All tests MUST pass before merge. Integration tests MUST validate plugin interactions. Cross-browser testing MUST cover 95% of modern browsers. Performance budgets MUST be met - failures block deployment.

### Deployment Standards
Headless deployment capable for serverless environments. Docker containers MUST support multi-stage builds. Environment configurations MUST be externalized. Database migrations MUST be backward compatible and follow naming conventions.

## Plugin Development Standards

### VIII. Plugin Architecture Requirements

All plugins MUST follow a standardized structure and interface to ensure consistency, maintainability, and interoperability across the CAS ecosystem.

#### Plugin Structure
Plugins MUST be organized in `backend/src/plugins/{plugin-name}/` with the following mandatory structure:
- `index.ts` - Plugin entry point with lifecycle methods and metadata
- `routes.ts` - Express router with all plugin endpoints
- `types.ts` - TypeScript interfaces for plugin-specific types
- `{PluginName}Service.ts` - Core business logic and data operations
- `database/migrations/` - Database migration scripts following naming conventions

#### Plugin Metadata
Every plugin MUST export a plugin object containing:
- `id`: Unique kebab-case identifier (e.g., 'rag-retrieval', 'ldap-auth')
- `name`: Human-readable display name
- `version`: Semantic version (MAJOR.MINOR.PATCH)
- `description`: Clear, concise plugin purpose (max 200 chars)
- `author`: Plugin maintainer identification
- `entry`: Path to plugin entry point
- `status`: 'enabled' | 'disabled' | 'deprecated'
- `isSystem`: Boolean indicating core system plugin
- `routes`: Router instance for plugin endpoints
- `permissions`: Array of permission strings (e.g., ['document:upload', 'chat:create'])

#### Plugin Endpoints
Plugins MUST expose standardized endpoints:
- `/api/plugins/{plugin-id}/status` - Plugin health and statistics (REQUIRED)
- `/api/plugins/{plugin-id}/configure` - Configuration management (REQUIRED if configurable)
- `/api/plugins/{plugin-id}/test` - Health check and connectivity test (RECOMMENDED)
- Additional feature-specific endpoints following RESTful conventions

### IX. Plugin Lifecycle Management

All plugins MUST implement the following lifecycle methods for proper integration with the CAS plugin system.

#### Lifecycle Methods
1. **initialize()**: 
   - Called during application startup or plugin installation
   - MUST load configuration from database or environment
   - MUST initialize services, connections, and dependencies
   - MUST create required database tables/schemas if not exists
   - MUST NOT assume other plugins are loaded
   - MUST log initialization steps for observability
   - MUST throw errors for critical failures, warn for non-critical issues

2. **activate()**:
   - Called when plugin status changes to 'enabled'
   - MUST verify all dependencies and configurations are valid
   - MUST test external service connectivity (databases, APIs, etc.)
   - SHOULD pre-load frequently accessed data
   - MUST log activation status and configuration summary

3. **deactivate()**:
   - Called when plugin status changes to 'disabled'
   - MUST gracefully close connections and release resources
   - MUST NOT delete data or configurations
   - SHOULD flush pending operations
   - MUST log deactivation confirmation

4. **uninstall()**:
   - Called when plugin is permanently removed
   - MUST drop plugin-specific database tables and schemas
   - MUST clean up configuration entries
   - SHOULD create backup or export of plugin data before deletion
   - MUST log uninstallation steps and data removal

#### Lifecycle Execution Order
```
Application Start → initialize() → activate()
Plugin Enable → activate()
Plugin Disable → deactivate()
Plugin Remove → deactivate() → uninstall()
Application Stop → deactivate()
```

### X. Plugin Database Standards

All plugin database objects MUST follow CAS naming conventions and isolation principles.

#### Schema Isolation
- All plugin tables MUST reside in the `plugin` schema
- Table names MUST be prefixed with plugin identifier (e.g., `rag_tx_messages`, `ldap_md_configurations`)
- Plugins MUST NOT access tables from other plugins directly
- Cross-plugin data access MUST use published plugin APIs

#### Table Classification
Plugins MUST classify tables by data type:
- **Master Data (md)**: Reference data, configurations, lookup tables
  - Format: `{plugin}_md_{entity}` (e.g., `rag_md_collections`)
  - Low write frequency, high read frequency
  - Used for plugin configuration and reference data

- **Transaction Data (tx)**: Operational data, user-generated content
  - Format: `{plugin}_tx_{entity}` (e.g., `rag_tx_documents`, `ldap_tx_imports`)
  - High write frequency, variable read patterns
  - Used for runtime data and user interactions

#### Migration Standards
- Migration files MUST use timestamp prefix: `YYYYMMDD_description.sql`
- Migrations MUST be idempotent (safe to run multiple times)
- Migrations MUST include rollback scripts
- Migrations MUST handle existing data gracefully
- Extension installations (e.g., pgvector) MUST check for existence before creating

Example migration structure:
```sql
-- Migration: 20251127_add_plugin_tables.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE EXTENSION vector;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS plugin.{plugin}_md_config (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ConfigKey VARCHAR(255) NOT NULL UNIQUE,
  ConfigValue JSONB,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### XI. Plugin API Design Standards

Plugin APIs MUST follow RESTful conventions and CAS architectural principles.

#### Authentication & Authorization
- All plugin endpoints MUST use the `authenticate` middleware
- Endpoints MUST verify user permissions before data access
- User isolation MUST be enforced at the database query level
- JWT tokens MUST be validated on every request

#### Request/Response Format
- Requests MUST use JSON content type
- Responses MUST follow standard envelope format:
```typescript
{
  success: boolean;
  data?: any;              // Response payload
  message?: string;        // Success/error message
  error?: string;          // Detailed error for debugging
  timestamp?: string;      // ISO 8601 timestamp
}
```

#### Error Handling
- Plugins MUST catch and handle all errors gracefully
- Error responses MUST use appropriate HTTP status codes:
  - 200: Success
  - 400: Bad request (invalid input)
  - 401: Unauthorized (missing/invalid token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not found
  - 500: Internal server error
- Error messages MUST be user-friendly, not expose system internals
- Detailed errors MUST be logged for debugging

#### API Versioning
- Breaking API changes MUST increment plugin MAJOR version
- Deprecated endpoints MUST remain functional for at least one MAJOR version
- Deprecation notices MUST be documented and logged

### XII. Plugin Testing Requirements

All plugins MUST include comprehensive testing as per TDD principles.

#### Test Structure
Plugins MUST provide:
- `tests/unit/` - Unit tests for services and utilities
- `tests/integration/` - Integration tests for API endpoints
- `tests/fixtures/` - Test data and mocks
- Test scripts in project root (e.g., `test-{plugin}-plugin.sh`)

#### Test Coverage
Plugins MUST achieve minimum 80% code coverage including:
- All lifecycle methods (initialize, activate, deactivate, uninstall)
- All API endpoints (success and error cases)
- Database operations (CRUD, transactions, rollbacks)
- External service integrations (with mocks)
- Error handling and edge cases
- User isolation and permission checks

#### Integration Testing
Plugins MUST test:
- Plugin loading and initialization
- API authentication and authorization
- Database schema creation and migrations
- Configuration loading and validation
- External service connectivity (with fallbacks)
- Multi-user scenarios and data isolation
- Performance under load (response times)

### XIII. Plugin Documentation Standards

All plugins MUST provide comprehensive documentation following established patterns.

#### Required Documentation Files
1. **{PLUGIN}_PLUGIN_DOCUMENTATION.md** (Primary guide)
   - Overview and architecture
   - Installation and setup instructions
   - Configuration reference
   - Complete API reference with examples
   - Usage guide with code samples
   - Troubleshooting guide
   - FAQ section

2. **{PLUGIN}_TESTING_GUIDE.md** (Testing procedures)
   - Test suite descriptions
   - Automated test instructions
   - Manual testing procedures
   - Performance benchmarks
   - Edge case coverage

3. **{PLUGIN}_FEATURE_GUIDE.md** (Implementation details)
   - Feature descriptions
   - Implementation details
   - Constitution compliance notes
   - Code examples
   - Performance metrics

4. **{PLUGIN}_QUICK_START.md** (Quick reference)
   - Fast installation
   - Essential commands
   - Common tasks

#### Documentation Quality Standards
- All API endpoints MUST be documented with request/response examples
- All configuration options MUST be documented with types and defaults
- All error messages MUST be documented with solutions
- Examples MUST be copy-paste ready and tested
- Code samples MUST use proper syntax highlighting
- Screenshots MUST be current and high-quality

### XIV. Plugin Configuration Management

Plugins MUST implement secure and flexible configuration management.

#### Configuration Storage
- Configuration MUST be stored in plugin-specific database tables
- Sensitive data (API keys, passwords) MUST be encrypted at rest
- Configuration MUST support environment variable overrides
- Default values MUST be provided for all optional settings

#### Configuration Schema
Plugins MUST define TypeScript interfaces for configuration:
```typescript
interface PluginConfig {
  pluginId: string;
  version: string;
  settings: {
    [key: string]: string | number | boolean | object;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
  };
}
```

#### Configuration Validation
- All configuration MUST be validated on load and update
- Invalid configuration MUST prevent plugin activation
- Validation errors MUST be logged with specific field issues
- Configuration changes MUST be auditable (who, when, what)

### XV. Plugin Security Standards

Plugins MUST implement security best practices to protect user data and system integrity.

#### Data Isolation
- User data MUST be isolated using UserId filters in all queries
- Plugins MUST NOT access data belonging to other users
- Shared data MUST be explicitly marked and controlled
- Admin-only data MUST require elevated permissions

#### Input Validation
- All user input MUST be validated and sanitized
- SQL injection MUST be prevented using parameterized queries
- XSS MUST be prevented by escaping output
- File uploads MUST be validated for type and size
- Rate limiting SHOULD be implemented for resource-intensive operations

#### Dependency Security
- Plugin dependencies MUST be regularly updated
- Known vulnerabilities MUST be addressed within 7 days for critical, 30 days for high
- Dependency licenses MUST be compatible with project license
- Third-party services MUST use secure connections (HTTPS, TLS)

### XVI. Plugin Performance Standards

Plugins MUST meet performance requirements to ensure system responsiveness.

#### Response Time Requirements
- Status endpoints: < 100ms (p95)
- Simple CRUD operations: < 300ms (p95)
- Complex queries: < 1s (p95)
- File uploads: < 5s for files up to 10MB (p95)
- AI/ML operations: < 10s (p95)

#### Resource Management
- Database connections MUST use connection pooling
- Long-running operations MUST be asynchronous
- Memory usage MUST not exceed 512MB per plugin under normal load
- Plugins MUST release resources on deactivation
- Caching SHOULD be used for frequently accessed data

#### Monitoring
- Response times MUST be logged for all endpoints
- Error rates MUST be tracked and alerted
- Resource usage (CPU, memory, connections) MUST be monitored
- Performance degradation MUST trigger warnings

### XVII. Plugin Interoperability

Plugins MUST support integration with other plugins while maintaining isolation.

#### Plugin APIs
- Plugins MAY expose public APIs for other plugins to consume
- Public APIs MUST be versioned and documented
- Public APIs MUST maintain backward compatibility
- Breaking changes MUST be announced at least one release ahead

#### Event System
- Plugins SHOULD emit events for significant operations
- Event names MUST follow pattern: `plugin:{plugin-id}:{action}`
- Events MUST include relevant data without exposing sensitive information
- Plugins MAY subscribe to other plugin events

#### Data Sharing
- Cross-plugin data access MUST use published APIs, not direct database access
- Shared data contracts MUST be versioned
- Data format changes MUST be backward compatible

### XVIII. Plugin Deployment Standards

Plugins MUST be deployable independently without system downtime.

#### Hot Loading
- Plugins SHOULD support hot loading (activation without restart)
- Configuration changes SHOULD apply without restart when possible
- Database migrations MAY require restart for critical schema changes

#### Rollback Support
- Plugins MUST support rollback to previous version
- Database migrations MUST include rollback scripts
- Configuration changes MUST be reversible

#### Environment Support
- Plugins MUST work in development, staging, and production environments
- Environment-specific configuration MUST use environment variables
- Plugins MUST NOT hardcode environment-specific values

### XIX. Plugin Export/Import Standards

Plugins MUST support portable distribution via ZIP-based export/import for cross-system deployment.

#### Export Requirements
All plugin exports MUST include:
- `plugin.json` - Complete manifest with entry point, permissions, and compatibility
- `backend/src/` - TypeScript source code for development and modification
- `backend/dist/` - Compiled JavaScript for immediate execution on import
- `backend/migrations/` - SQL migration scripts with rollback support
- `backend/package.json` - Dependencies and build configuration
- `frontend/src/components/` - React components (TSX) and styles (CSS modules)
- `frontend/src/services/` - API service files
- `docs/` - Documentation exported from database
- `data/export.json` - Non-sensitive configuration data
- `metadata.json` - Export timestamp, source system info, version
- `README.md` - Auto-generated documentation
- `checksum.sha256` - SHA-256 hash for integrity verification

#### Export Exclusions
Exports MUST NOT include:
- Sensitive data (passwords, API keys, secrets)
- `node_modules/` directories
- Build artifacts that can be regenerated
- User-specific or instance-specific data
- Temporary files or caches

#### Import Requirements
Plugin import MUST:
- Validate ZIP structure and checksum before extraction
- Parse and validate `plugin.json` manifest
- Check compatibility with target CAS version
- Run database migrations in order
- Register plugin in `plugin_configurations` table
- Import documentation to `plugin_md_documentation` table
- Import non-sensitive configuration data
- Support both ZIP (base64 encoded) and JSON formats for backward compatibility

#### ZIP Structure Standard
```
plugin-id-v1.0.0.zip
├── plugin.json              # Plugin manifest (REQUIRED)
├── backend/
│   ├── src/                # TypeScript source (REQUIRED)
│   │   ├── index.ts       # Entry point with lifecycle methods
│   │   ├── routes.ts      # Express routes
│   │   └── types.ts       # TypeScript interfaces
│   ├── dist/               # Compiled JavaScript (REQUIRED for runnable)
│   │   └── index.js       # Compiled entry point
│   ├── migrations/         # Database migrations (REQUIRED if uses DB)
│   └── package.json        # Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   └── services/      # API services
│   └── package.json        # Frontend dependencies
├── docs/                   # Documentation
├── data/
│   └── export.json        # Configuration data
├── tests/                  # Test files
├── metadata.json           # Export metadata (REQUIRED)
├── README.md               # Documentation
└── checksum.sha256         # Integrity hash (REQUIRED)
```

#### Auto-Generation
When source code is not available, the export system MUST generate:
- Backend `index.js` with standard lifecycle methods (initialize, activate, deactivate, uninstall)
- Backend `routes.js` with status and configuration endpoints
- Frontend React component template with status display
- CSS module with standard styling
- Migration SQL based on plugin type

#### Integrity Verification
- Exports MUST include SHA-256 checksum of manifest and metadata
- Imports MUST verify checksum before processing
- Checksum mismatches SHOULD log warnings but MAY proceed with user confirmation
- Digital signatures (optional) SHOULD be verified if present

#### Version Compatibility
- Exports MUST declare minimum CAS version in `compatibility.casVersion`
- Exports MUST declare minimum Node.js version in `compatibility.nodeVersion`
- Imports MUST check compatibility before installation
- Incompatible plugins MUST be rejected with clear error message

## Governance

This constitution supersedes all other development practices and documentation. Amendments require: (1) Documentation of proposed change, (2) Impact analysis on existing features, (3) Approval process via team review, (4) Version increment following semantic versioning rules, (5) Migration plan for affected implementations.

All pull requests and code reviews MUST verify compliance with these constitutional principles. Any complexity or deviation from these principles MUST be explicitly justified with documented business or technical requirements. Use spec.md files for runtime development guidance aligned with these principles.

**Version**: 1.3.0 | **Ratified**: 2025-11-19 | **Last Amended**: 2025-11-28
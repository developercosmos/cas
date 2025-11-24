<!--
Sync Impact Report:
Version change: 1.1.0 → 1.1.1 (patch version - database naming conventions clarification)
Modified principles: N/A
Added sections: N/A
Templates requiring updates: N/A (no template changes needed)
Follow-up TODOs: N/A
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

## Governance

This constitution supersedes all other development practices and documentation. Amendments require: (1) Documentation of proposed change, (2) Impact analysis on existing features, (3) Approval process via team review, (4) Version increment following semantic versioning rules, (5) Migration plan for affected implementations.

All pull requests and code reviews MUST verify compliance with these constitutional principles. Any complexity or deviation from these principles MUST be explicitly justified with documented business or technical requirements. Use spec.md files for runtime development guidance aligned with these principles.

**Version**: 1.1.1 | **Ratified**: 2025-11-19 | **Last Amended**: 2025-11-19
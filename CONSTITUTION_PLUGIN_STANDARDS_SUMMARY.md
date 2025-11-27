# Constitution v1.2.0 - Plugin Development Standards

## 🎉 Update Complete

The CAS Constitution has been successfully updated to include comprehensive plugin development standards and requirements for developers.

---

## 📊 Update Summary

| Aspect | Detail |
|--------|--------|
| **Previous Version** | 1.1.1 |
| **New Version** | 1.2.0 |
| **Update Type** | Minor (backward compatible) |
| **Date** | 2025-11-27 |
| **Lines Added** | 358 lines of standards |
| **New Sections** | 11 comprehensive sections |
| **Breaking Changes** | None |

---

## ✨ What Was Added

### 11 New Plugin Development Sections

#### Section VIII: Plugin Architecture Requirements
- Standardized plugin structure and file organization
- Required plugin metadata fields
- Mandatory plugin endpoints

#### Section IX: Plugin Lifecycle Management
- Four lifecycle methods: initialize, activate, deactivate, uninstall
- Execution order and requirements
- Error handling and logging

#### Section X: Plugin Database Standards
- Schema isolation (`plugin` schema mandatory)
- Table classification (`_md_` and `_tx_` prefixes)
- Migration standards and examples

#### Section XI: Plugin API Design Standards
- Authentication and authorization requirements
- Standard request/response envelope
- Error handling and HTTP status codes
- API versioning guidelines

#### Section XII: Plugin Testing Requirements
- Minimum 80% code coverage (mandatory)
- Test structure and organization
- Integration testing checklist

#### Section XIII: Plugin Documentation Standards
- Four required documentation files per plugin
- Documentation quality standards
- Example requirements

#### Section XIV: Plugin Configuration Management
- Configuration storage and security
- Schema definition requirements
- Validation standards

#### Section XV: Plugin Security Standards
- Data isolation requirements
- Input validation rules
- Dependency security (7-day critical, 30-day high patches)

#### Section XVI: Plugin Performance Standards
- Response time requirements by operation type
- Resource management requirements
- Monitoring requirements

#### Section XVII: Plugin Interoperability
- Plugin API exposure guidelines
- Event system standards
- Cross-plugin data sharing rules

#### Section XVIII: Plugin Deployment Standards
- Hot loading support
- Rollback requirements
- Environment support

---

## 🎯 Key Requirements

### MUST (Mandatory)

**Structure:**
- Plugin MUST follow standardized structure
- Plugin MUST implement all 4 lifecycle methods
- Plugin MUST export required metadata

**Database:**
- Tables MUST be in `plugin` schema
- Tables MUST use `{plugin}_md_` or `{plugin}_tx_` prefix
- Migrations MUST be idempotent with rollback scripts

**API:**
- Endpoints MUST use `authenticate` middleware
- Responses MUST follow standard envelope format
- Plugin MUST expose `/status` endpoint

**Testing:**
- Plugin MUST achieve 80% code coverage
- Plugin MUST test all lifecycle methods
- Plugin MUST test data isolation

**Documentation:**
- Plugin MUST have 4 documentation files:
  1. Main documentation (comprehensive guide)
  2. Testing guide (test procedures)
  3. Feature guide (implementation details)
  4. Quick start guide (quick reference)

**Security:**
- Plugin MUST enforce user data isolation
- Plugin MUST validate all input
- Plugin MUST use parameterized queries
- Plugin MUST encrypt sensitive data

**Performance:**
- Status endpoints: < 100ms (p95)
- Simple CRUD: < 300ms (p95)
- Complex queries: < 1s (p95)

---

## ✅ Compliance Status

### Existing Plugins

| Plugin | Status | Notes |
|--------|--------|-------|
| **RAG Plugin** | ✅ COMPLIANT | Reference implementation, 13 docs (180KB) |
| **LDAP Plugin** | ✅ COMPLIANT | Fully compliant, 14 docs |

Both existing plugins were developed following these patterns and are fully compliant with the new standards.

---

## 📚 Required Plugin Files

### Code Files (Mandatory)
```
backend/src/plugins/{plugin-name}/
├── index.ts              # Plugin entry point with lifecycle methods
├── routes.ts             # Express router with all endpoints
├── types.ts              # TypeScript interfaces
├── {Plugin}Service.ts    # Core business logic
└── database/
    └── migrations/       # Database migration scripts
        └── YYYYMMDD_description.sql
```

### Documentation Files (Mandatory)
```
{PLUGIN}_PLUGIN_DOCUMENTATION.md    # Main comprehensive guide
{PLUGIN}_TESTING_GUIDE.md            # Testing procedures
{PLUGIN}_FEATURE_GUIDE.md            # Implementation details
{PLUGIN}_QUICK_START.md              # Quick reference
```

### Test Files (Mandatory)
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── fixtures/          # Test data
test-{plugin}.sh       # Automated test script
```

---

## 🔄 Lifecycle Methods

All plugins MUST implement these four methods:

```typescript
// 1. Called on application start or plugin install
initialize: async (): Promise<void> => {
  // Load config, create tables, initialize services
  // MUST log initialization steps
  // MUST throw on critical failures
}

// 2. Called when plugin is enabled
activate: async (): Promise<void> => {
  // Verify configuration
  // Test external connections
  // Pre-load data
  // MUST log activation status
}

// 3. Called when plugin is disabled
deactivate: async (): Promise<void> => {
  // Close connections
  // Release resources
  // MUST NOT delete data
  // MUST log deactivation
}

// 4. Called when plugin is removed
uninstall: async (): Promise<void> => {
  // Drop tables
  // Clean up configuration
  // SHOULD backup data
  // MUST log uninstallation
}
```

**Execution Order:**
```
App Start     → initialize() → activate()
Enable        → activate()
Disable       → deactivate()
Remove        → deactivate() → uninstall()
App Stop      → deactivate()
```

---

## 🗃️ Database Naming

### Table Naming Convention

**Master Data (Configuration/Reference):**
```
plugin.{plugin}_md_{entity}

Examples:
- plugin.rag_md_collections
- plugin.ldap_md_configurations
```

**Transaction Data (Operational):**
```
plugin.{plugin}_tx_{entity}

Examples:
- plugin.rag_tx_documents
- plugin.rag_tx_messages
- plugin.ldap_tx_imports
```

### Field Naming
- **Columns**: PascalCase (e.g., `CreatedAt`, `UserId`)
- **Primary Keys**: `Id`
- **Foreign Keys**: `{Entity}Id` (e.g., `UserId`, `DocumentId`)
- **Booleans**: `Is*`, `Has*`, `Can*` (e.g., `IsActive`)
- **Timestamps**: `CreatedAt`, `UpdatedAt`, `DeletedAt`

---

## 🔌 Standard Plugin Endpoints

All plugins MUST expose these endpoints:

```
GET  /api/plugins/{plugin-id}/status     # REQUIRED - Health & stats
POST /api/plugins/{plugin-id}/configure  # REQUIRED - Configuration
POST /api/plugins/{plugin-id}/test       # RECOMMENDED - Health check
```

Additional feature-specific endpoints following RESTful conventions.

---

## 📝 API Response Format

All plugin APIs MUST use this standard envelope:

```typescript
{
  success: boolean;        // REQUIRED
  data?: any;             // Response payload
  message?: string;       // Success/error message
  error?: string;         // Detailed error (development)
  timestamp?: string;     // ISO 8601 timestamp
}
```

**HTTP Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error

---

## 🧪 Testing Requirements

### Coverage Minimum: 80%

**Must Test:**
- ✅ All lifecycle methods
- ✅ All API endpoints (success & error)
- ✅ Database operations (CRUD, transactions)
- ✅ External service integrations (with mocks)
- ✅ Error handling and edge cases
- ✅ User isolation and permissions
- ✅ Performance (response times)

### Test Structure
```
tests/
├── unit/
│   ├── services.test.ts
│   └── utils.test.ts
├── integration/
│   ├── api.test.ts
│   └── lifecycle.test.ts
└── fixtures/
    └── test-data.json
```

---

## 🔒 Security Requirements

### Data Isolation
```typescript
// CORRECT - User data isolated
const docs = await db.query(
  'SELECT * FROM plugin.docs WHERE UserId = $1',
  [req.user.id]
);

// WRONG - No user isolation
const docs = await db.query('SELECT * FROM plugin.docs');
```

### Input Validation
- ✅ Validate all user input
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Escape output (prevent XSS)
- ✅ Validate file uploads (type, size)
- ✅ Implement rate limiting

### Dependency Security
- Critical vulnerabilities: Fix within 7 days
- High vulnerabilities: Fix within 30 days
- Use secure connections (HTTPS, TLS)

---

## ⚡ Performance Standards

| Operation Type | Response Time (p95) |
|----------------|---------------------|
| Status endpoint | < 100ms |
| Simple CRUD | < 300ms |
| Complex queries | < 1s |
| File uploads (10MB) | < 5s |
| AI/ML operations | < 10s |

### Resource Limits
- Memory: < 512MB per plugin (normal load)
- Database: Use connection pooling
- Long operations: Must be asynchronous
- Caching: Should cache frequently accessed data

---

## 📖 Documentation Requirements

Each plugin MUST have four documentation files:

### 1. Main Documentation (20-30KB)
- Overview and architecture
- Installation and setup
- Configuration reference
- Complete API reference
- Usage examples
- Troubleshooting
- FAQ

### 2. Testing Guide (15-20KB)
- Test suite descriptions
- Automated test procedures
- Manual testing steps
- Performance benchmarks
- Edge case coverage

### 3. Feature Guide (15-20KB)
- Feature descriptions
- Implementation details
- Constitution compliance
- Code examples
- Performance metrics

### 4. Quick Start (5-10KB)
- Fast installation
- Essential commands
- Common tasks

---

## 📋 Developer Checklist

### Before Starting
- [ ] Read Constitution Sections VIII-XVIII
- [ ] Review existing plugins (RAG, LDAP)
- [ ] Understand lifecycle methods
- [ ] Know database naming conventions
- [ ] Understand testing requirements (80%)
- [ ] Know documentation requirements (4 files)

### During Development
- [ ] Follow plugin structure
- [ ] Implement all lifecycle methods
- [ ] Use `plugin` schema
- [ ] Prefix tables correctly
- [ ] Use authentication middleware
- [ ] Follow response format
- [ ] Write tests first (TDD)
- [ ] Document APIs
- [ ] Validate input
- [ ] Enforce user isolation

### Before Code Review
- [ ] All tests passing (80%+ coverage)
- [ ] 4 documentation files complete
- [ ] APIs documented with examples
- [ ] Performance benchmarks met
- [ ] Security review done
- [ ] Constitution compliance verified

---

## 🎓 Reference Implementation

### RAG Plugin
**Location**: `/var/www/cas/backend/src/plugins/rag/`

**Best Practices Demonstrated:**
- ✅ Complete plugin structure
- ✅ All lifecycle methods implemented
- ✅ Database naming: `rag_md_*`, `rag_tx_*`
- ✅ 14 RESTful API endpoints
- ✅ Comprehensive testing
- ✅ 13 documentation files (180KB)
- ✅ Configuration management
- ✅ User isolation enforced
- ✅ Performance targets met

**Documentation**: See `RAG_PLUGIN_DOCUMENTATION.md`

---

## 📞 Getting Help

### Documentation
- **Constitution**: `/var/www/cas/constitution.md` (Sections VIII-XVIII)
- **Update Summary**: `CONSTITUTION_UPDATE_PLUGIN_STANDARDS.md`
- **RAG Plugin Docs**: `RAG_PLUGIN_DOCUMENTATION.md`
- **LDAP Plugin Docs**: `LDAP_TESTING_GUIDE.md`

### Common Questions

**Q: Is 80% coverage mandatory?**  
A: Yes. Non-negotiable per TDD principle (Section III).

**Q: Can I use a different schema?**  
A: No. All plugins MUST use `plugin` schema (Section X).

**Q: Can I skip documentation?**  
A: No. All plugins MUST have 4 documentation files (Section XIII).

**Q: What if I need longer response times?**  
A: Document the requirement and justification. Performance targets in Section XVI are standards, not limits.

---

## 🎯 Impact Summary

### No Breaking Changes ✅
- Existing plugins already compliant
- Standards codify existing best practices
- Backward compatible minor version increment

### Benefits
- ✅ Clear guidelines for developers
- ✅ Consistent plugin quality
- ✅ Faster onboarding
- ✅ Simplified code review
- ✅ Better interoperability
- ✅ Enhanced security
- ✅ Performance guarantees

---

## 🚀 Next Steps

### For Plugin Developers
1. Read Constitution Sections VIII-XVIII
2. Review RAG plugin as reference
3. Use checklist when developing
4. Verify compliance before review

### For Project Maintainers
1. Create plugin template/boilerplate
2. Add compliance checking to CI/CD
3. Review existing plugins for full compliance
4. Update onboarding documentation

---

## 📜 Version History

| Version | Date | Type | Changes |
|---------|------|------|---------|
| 1.2.0 | 2025-11-27 | Minor | Added plugin development standards (11 sections) |
| 1.1.1 | 2025-11-19 | Patch | Database naming clarifications |
| 1.1.0 | 2025-11-19 | Minor | Database naming conventions |
| 1.0.0 | 2025-11-19 | Major | Initial constitution |

---

**Constitution Version**: 1.2.0  
**Last Updated**: 2025-11-27  
**Status**: Active and Ratified  
**Compliance**: Mandatory for all plugins

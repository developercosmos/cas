# CAS System Plugins

This directory contains all system plugins for the CAS platform.

## Available Plugins

1. **ldap-auth** - LDAP Authentication Provider
2. **rag-retrieval** - RAG Document Retrieval System
3. **user-access-management** - User Access Rights & Authorization Management (NEW)

## Plugin Structure

Each plugin follows standardized structure:
```
plugin-name/
├── package.json
├── main.js
├── config.json
├── routes/
│   ├── index.js
│   └── api/
├── services/
├── types/
├── migrations/
└── docs/
```

## Development Guidelines

Follow constitution.md and PLUGIN_DEVELOPMENT_GUIDE.md for comprehensive plugin development standards, including:
- Architecture requirements and best practices
- Database integration and naming conventions  
- API development and registration requirements
- Documentation standards and database registration
- Frontend integration guidelines
- Testing requirements and deployment procedures

### Quick Reference
- **Constitution**: Core architectural principles and requirements
- **Development Guide**: Step-by-step implementation guide
- **API Registration**: Required database registration patterns
- **Documentation Standards**: Central documentation system requirements

**Additional Resources**:
- PORTABLE_PLUGIN_SYSTEM_IMPLEMENTATION_GUIDE.md: Package externalization strategy
- constitution.md: Constitutional requirements and standards

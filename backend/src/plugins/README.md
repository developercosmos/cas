# CAS System Plugins

This directory contains all system plugins for the CAS platform.

## Available Plugins

1. **ldap-auth** - LDAP Authentication Provider
2. **rag-retrieval** - RAG Document Retrieval System
3. **user-access-management** - User Access Rights & Authorization Management (NEW)

## Plugin Structure

Each plugin follows the standardized structure:
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

Follow the constitution.md and PORTABLE_PLUGIN_SYSTEM_IMPLEMENTATION_GUIDE.md for plugin development standards.

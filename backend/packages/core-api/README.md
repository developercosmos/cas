# CAS Core API Package

The `@cas/core-api` package provides the essential interfaces, services, and utilities that plugins need to integrate with the CAS application core. This package enables dependency externalization and ensures compatibility between plugin versions.

## Overview

This package serves as the Software Development Kit (SDK) for CAS plugin development, providing:

- **Type Definitions**: Standard interfaces for plugin development
- **Core Services**: Access to essential CAS functionality (database, authentication, etc.)
- **Utilities**: Helper functions and common patterns
- **Compatibility**: Version-safe integration with CAS core

## Package Structure

```
@cas/core-api/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── plugin.ts       # Plugin interface definitions
│   │   ├── database.ts     # Database service types
│   │   ├── auth.ts         # Authentication types
│   │   └── index.ts        # Type exports
│   ├── services/           # Core service interfaces
│   │   ├── DatabaseService.ts
│   │   ├── AuthService.ts
│   │   ├── EventService.ts
│   │   ├── StorageService.ts
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── validation.ts   # Input validation helpers
│   │   ├── logger.ts       # Logging utilities
│   │   ├── errors.ts       # Error handling
│   │   └── index.ts
│   ├── constants/          # System constants
│   │   ├── permissions.ts  # Permission definitions
│   │   ├── errors.ts       # Error codes
│   │   └── index.ts
│   └── index.ts            # Main package exports
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features

### 1. Plugin Interface Standardization

Provides consistent interfaces that all plugins must implement:

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  uninstall(): Promise<void>;
}
```

### 2. Database Service Abstraction

Safe, user-isolated database access:

```typescript
interface DatabaseService {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;
  migrations: MigrationService;
}
```

### 3. Authentication & Authorization

JWT-based authentication with permission checking:

```typescript
interface AuthService {
  authenticate(token: string): Promise<User | null>;
  authorize(user: User, permission: string): boolean;
  getCurrentUser(req: Request): User | null;
}
```

### 4. Event System

Inter-plugin communication:

```typescript
interface EventService {
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

## Usage in Plugins

### Installation

```bash
npm install @cas/core-api
```

### Basic Plugin Structure

```typescript
import { Plugin, PluginContext, DatabaseService, AuthService } from '@cas/core-api';

export class MyPlugin implements Plugin {
  id = 'my-plugin';
  name = 'My Plugin';
  version = '1.0.0';

  metadata = {
    description: 'A sample plugin',
    author: 'Developer Name',
    permissions: ['storage.read', 'storage.write'],
    dependencies: {
      '@cas/core-api': '^1.0.0'
    }
  };

  async initialize(context: PluginContext): Promise<void> {
    // Initialize plugin with core services
    const db = context.services.database;
    const auth = context.services.auth;

    // Perform setup operations
    await this.setupDatabase(db);
  }

  async activate(): Promise<void> {
    // Plugin activation logic
  }

  async deactivate(): Promise<void> {
    // Plugin deactivation logic
  }

  async uninstall(): Promise<void> {
    // Cleanup resources
  }
}
```

## Version Compatibility

The core API follows semantic versioning:

- **Major (X.0.0)**: Breaking changes - plugins may require updates
- **Minor (0.X.0)**: New features - backward compatible
- **Patch (0.0.X)**: Bug fixes - fully compatible

### Compatibility Matrix

| Plugin Version | Compatible Core API |
|---------------|---------------------|
| 1.x.x         | 1.x.x               |
| 2.x.x         | 2.x.x               |
| ...           | ...                 |

## Development Guidelines

### 1. Service Access

Always access core services through the provided context:

```typescript
// ✅ Correct: Use context services
async initialize(context: PluginContext): Promise<void> {
  const db = context.services.database;
  const users = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
}

// ❌ Incorrect: Direct database access
import { directDbConnection } from 'some-internal-lib';
```

### 2. User Isolation

All database operations must be user-scoped:

```typescript
// ✅ Correct: User-scoped queries
const userDocs = await db.query(
  'SELECT * FROM my_tx_documents WHERE UserId = $1',
  [context.user.id]
);

// ❌ Incorrect: Global data access
const allDocs = await db.query('SELECT * FROM my_tx_documents');
```

### 3. Error Handling

Use standardized error types:

```typescript
import { PluginError, ErrorCode } from '@cas/core-api';

// ✅ Correct: Standardized errors
throw new PluginError(
  ErrorCode.DATABASE_ERROR,
  'Failed to save document',
  { documentId, userId }
);

// ❌ Incorrect: Generic errors
throw new Error('Something went wrong');
```

### 4. Logging

Use the provided logging service:

```typescript
import { Logger } from '@cas/core-api';

const logger = new Logger('my-plugin');

logger.info('Plugin initialized', { version: this.version });
logger.error('Database operation failed', error, { query, params });
```

## Security Considerations

### 1. Permission Enforcement

All operations must respect user permissions:

```typescript
const hasPermission = await context.services.auth.authorize(
  context.user,
  'storage.write'
);

if (!hasPermission) {
  throw new PluginError(ErrorCode.PERMISSION_DENIED);
}
```

### 2. Input Validation

Validate all inputs using provided utilities:

```typescript
import { validate } from '@cas/core-api';

const validatedInput = validate(input, {
  name: { type: 'string', required: true, maxLength: 255 },
  email: { type: 'email', required: true }
});
```

### 3. SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✅ Correct: Parameterized query
await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, 'active']
);

// ❌ Incorrect: String concatenation
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Migration Guide

For existing plugins migrating to use `@cas/core-api`:

### 1. Update Dependencies

```json
{
  "dependencies": {
    "@cas/core-api": "^1.0.0"
  }
}
```

### 2. Update Imports

```typescript
// Before
import { DatabaseService } from '../../services/DatabaseService';
import { PluginMetadata } from '../../types/plugin';

// After
import { DatabaseService, PluginMetadata } from '@cas/core-api';
```

### 3. Update Service Access

```typescript
// Before
await DatabaseService.query('SELECT * FROM users');

// After
async initialize(context: PluginContext): Promise<void> {
  await context.services.database.query('SELECT * FROM users');
}
```

## Testing

The package includes comprehensive type definitions that enable better development experience and compile-time error detection.

```bash
npm test          # Run package tests
npm run build     # Compile TypeScript
npm run lint      # Lint code
```

## Support

- **Documentation**: [CAS Plugin Development Guide](./docs/)
- **Issues**: [GitHub Issues](https://github.com/developercosmos/cas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/developercosmos/cas/discussions)

## License

MIT License - see LICENSE file for details.
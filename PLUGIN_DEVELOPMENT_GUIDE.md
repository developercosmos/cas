# CAS Plugin Development Guide

## Overview

This comprehensive guide provides step-by-step instructions for developing plugins for the CAS (Central Authentication System) platform. It covers architecture, database integration, API development, frontend components, documentation, and deployment following constitutional requirements.

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL 13.0 or higher
- TypeScript knowledge
- React knowledge
- Express.js experience
- Docker (for deployment)

### 1. Create Plugin Structure

```bash
# Navigate to plugins directory
cd backend/src/plugins/

# Create plugin directory
mkdir my-awesome-plugin
cd my-awesome-plugin

# Create standard structure
mkdir -p services migrations types routes frontend
```

### 2. Plugin Template

```typescript
// index.ts - Plugin Entry Point
import { Router } from 'express';
import { PluginMetadata } from '../types/plugin';

export const plugin: PluginMetadata = {
  id: 'my-awesome-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  description: 'An awesome plugin for CAS platform',
  author: 'Your Name',
  category: 'application',
  isSystem: false,
  permissions: ['my-awesome.read', 'my-awesome.write'],
  enabled: true,
  entry: './index.js',
  routes: require('./routes').default,
  initialize: async () => {
    // Plugin initialization logic
    console.log('My Awesome Plugin initialized');
  },
  activate: async () => {
    // Plugin activation logic
    console.log('My Awesome Plugin activated');
  },
  deactivate: async () => {
    // Plugin deactivation logic
    console.log('My Awesome Plugin deactivated');
  },
  uninstall: async () => {
    // Plugin cleanup logic
    console.log('My Awesome Plugin uninstalled');
  }
};
```

## Architecture Requirements

### Plugin Structure

All plugins MUST follow this standardized structure:

```
my-awesome-plugin/
├── package.json              # Plugin dependencies and metadata
├── index.ts                 # Plugin entry point with lifecycle methods
├── config.json              # Plugin configuration defaults
├── routes/
│   ├── index.ts            # Express router setup
│   └── api/
│       └── routes.ts       # API endpoint definitions
├── services/
│   ├── MyAwesomeService.ts # Core business logic
│   └── DatabaseService.ts  # Database operations
├── types/
│   └── index.ts          # TypeScript interfaces
├── migrations/             # Database schema changes
│   ├── 20251129_create_tables.sql
│   └── 20251129_seed_data.sql
├── frontend/              # React components (optional)
│   ├── src/
│   │   ├── components/
│   │   └── services/
│   └── package.json
├── tests/                 # Test suites
├── docs/                  # Documentation
│   ├── README.md
│   └── API.md
└── README.md              # Plugin documentation
```

### Required Plugin Metadata

```typescript
interface PluginMetadata {
  id: string;           // Unique kebab-case identifier
  name: string;         // Human-readable name
  version: string;       // Semantic version (MAJOR.MINOR.PATCH)
  description: string;   // Plugin purpose (max 200 chars)
  author: string;        // Plugin maintainer
  category: 'system' | 'application'; // Plugin category
  isSystem: boolean;     // Core system plugin flag
  permissions: string[];  // Required permissions
  enabled: boolean;      // Plugin status
  entry: string;         // Entry point path
  routes: Router;        // Express router
  initialize?: () => Promise<void>;    // Lifecycle: Initialize
  activate?: () => Promise<void>;      // Lifecycle: Activate
  deactivate?: () => Promise<void>;    // Lifecycle: Deactivate
  uninstall?: () => Promise<void>;      // Lifecycle: Uninstall
}
```

## Database Integration

### Naming Conventions

Follow CAS database naming conventions:

#### Table Names
- **Master Data**: `{plugin}_md_{entity}` (e.g., `my_awesome_md_settings`)
- **Transaction Data**: `{plugin}_tx_{entity}` (e.g., `my_awesome_tx_logs`)
- **Configuration**: `{plugin}_configurations`

#### Schema
All plugin tables MUST be in `plugin` schema:

```sql
-- Migration: 20251129_create_my_awesome_tables.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Master data table
CREATE TABLE IF NOT EXISTS plugin.my_awesome_md_settings (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  SettingKey VARCHAR(255) NOT NULL UNIQUE,
  SettingValue JSONB,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction data table
CREATE TABLE IF NOT EXISTS plugin.my_awesome_tx_logs (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  UserId UUID NOT NULL,
  Action VARCHAR(100) NOT NULL,
  Details JSONB,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_my_awesome_settings_key 
  ON plugin.my_awesome_md_settings(SettingKey);

CREATE INDEX IF NOT EXISTS idx_my_awesome_logs_user 
  ON plugin.my_awesome_tx_logs(UserId, CreatedAt);
```

### Migration Scripts

```sql
-- Template: YYYYMMDD_description.sql
-- File: 20251129_add_user_preferences.sql

-- Always use IF NOT EXISTS for idempotent migrations
CREATE TABLE IF NOT EXISTS plugin.my_awesome_md_preferences (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  UserId UUID NOT NULL,
  Preferences JSONB NOT NULL DEFAULT '{}',
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uc_my_awesome_preferences_user UNIQUE(UserId)
);

-- Include rollback section
-- ROLLBACK: DROP TABLE IF EXISTS plugin.my_awesome_md_preferences;
```

### Service Layer

```typescript
// services/MyAwesomeService.ts
import { DatabaseService } from '../../services/DatabaseService.js';

export interface AwesomeSettings {
  theme: string;
  notifications: boolean;
  language: string;
}

export class MyAwesomeService {
  // Get user preferences
  static async getUserPreferences(userId: string): Promise<AwesomeSettings | null> {
    const result = await DatabaseService.queryOne(
      `SELECT Preferences FROM plugin.my_awesome_md_preferences WHERE UserId = $1`,
      [userId]
    );
    return result?.preferences || null;
  }

  // Update user preferences
  static async updateUserPreferences(
    userId: string, 
    preferences: AwesomeSettings
  ): Promise<boolean> {
    try {
      await DatabaseService.execute(
        `INSERT INTO plugin.my_awesome_md_preferences (UserId, Preferences, UpdatedAt)
         VALUES ($1, $2, NOW())
         ON CONFLICT (UserId) DO UPDATE SET
           Preferences = $2,
           UpdatedAt = NOW()`,
        [userId, preferences]
      );
      return true;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }

  // Log action
  static async logAction(
    userId: string, 
    action: string, 
    details: any
  ): Promise<void> {
    await DatabaseService.execute(
      `INSERT INTO plugin.my_awesome_tx_logs (UserId, Action, Details)
         VALUES ($1, $2, $3)`,
      [userId, action, details]
    );
  }
}
```

## API Development

### Route Setup

```typescript
// routes/index.ts
import { Router } from 'express';
import { authenticate, AuthRequest } from '../../../middleware/auth.js';
import { MyAwesomeService } from '../services/MyAwesomeService.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/plugins/my-awesome-plugin/status
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const userPreferences = await MyAwesomeService.getUserPreferences(req.user?.id);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        version: '1.0.0',
        userHasPreferences: !!userPreferences,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// GET /api/plugins/my-awesome-plugin/preferences
router.get('/preferences', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const preferences = await MyAwesomeService.getUserPreferences(req.user.id);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get preferences'
    });
  }
});

// PUT /api/plugins/my-awesome-plugin/preferences
router.put('/preferences', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { theme, notifications, language } = req.body;
    
    const success = await MyAwesomeService.updateUserPreferences(req.user.id, {
      theme,
      notifications,
      language
    });

    if (success) {
      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferences'
    });
  }
});

export default router;
```

### API Registration

All plugin endpoints MUST be registered in central API registry:

```typescript
// During plugin initialization
const pluginEndpoints = [
  {
    apiEndpoint: '/api/plugins/my-awesome-plugin/status',
    httpMethod: 'GET',
    description: 'Plugin health check and statistics',
    requiresAuth: false,
    requiredPermissions: [],
    documentation: 'Returns plugin status and basic statistics'
  },
  {
    apiEndpoint: '/api/plugins/my-awesome-plugin/preferences',
    httpMethod: 'GET',
    description: 'Get user preferences',
    requiresAuth: true,
    requiredPermissions: ['my-awesome.read'],
    documentation: 'Returns user-specific preferences'
  },
  {
    apiEndpoint: '/api/plugins/my-awesome-plugin/preferences',
    httpMethod: 'PUT',
    description: 'Update user preferences',
    requiresAuth: true,
    requiredPermissions: ['my-awesome.write'],
    documentation: 'Updates user-specific preferences'
  }
];

// Register in database during initialization
for (const endpoint of pluginEndpoints) {
  await DatabaseService.execute(`
    INSERT INTO plugin.plugin_api_registry (
      id, pluginId, apiEndpoint, httpMethod, description,
      requiresAuth, requiredPermissions, documentation, isActive, createdAt, updatedAt
    ) VALUES (
      gen_random_uuid(),
      (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
      $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
    ) ON CONFLICT (pluginId, apiEndpoint, httpMethod) DO UPDATE SET
      description = $4, requiredPermissions = $6, documentation = $7,
      isActive = true, updatedAt = NOW()
  `, [
    'my-awesome-plugin',
    endpoint.apiEndpoint,
    endpoint.httpMethod,
    endpoint.description,
    endpoint.requiresAuth,
    JSON.stringify(endpoint.requiredPermissions),
    endpoint.documentation
  ]);
}
```

## Documentation Requirements

### Database Documentation Registration

All plugins MUST register documentation in central `plugin.plugin_md_documentation` table:

```typescript
// During plugin initialization
const documentationRecords = [
  {
    title: 'My Awesome Plugin - README',
    content: `# My Awesome Plugin

## Overview
This plugin provides awesome functionality for the CAS platform.

## Features
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Installation
1. Install plugin via Plugin Manager
2. Configure settings
3. Start using the plugin

## API Reference
See the API documentation for complete endpoint reference.

## Support
Contact support for help with this plugin.`,
    contentFormat: 'markdown',
    documentType: 'readme',
    language: 'en',
    version: '1.0.0',
    isCurrent: true,
    orderIndex: 0
  }
];

// Register documentation in database
for (const doc of documentationRecords) {
  await DatabaseService.execute(`
    INSERT INTO plugin.plugin_md_documentation (
      id, pluginId, title, content, contentFormat, documentType,
      language, version, isCurrent, orderIndex, metadata, createdAt, updatedAt
    ) VALUES (
      gen_random_uuid(),
      (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
      $2, $3, $4, $5, $6, $7, $8, $9, '{}', NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      title = $2, content = $3, contentFormat = $4, documentType = $5,
      language = $6, version = $7, isCurrent = $8, orderIndex = $9,
      updatedAt = NOW()
  `, [
    'my-awesome-plugin',
    doc.title,
    doc.content,
    doc.contentFormat,
    doc.documentType,
    doc.language,
    doc.version,
    doc.isCurrent,
    doc.orderIndex
  ]);
}
```

### Documentation Files

Create comprehensive documentation files:

```markdown
# README.md
# My Awesome Plugin

## Quick Start
1. Install plugin via Plugin Manager
2. Configure plugin settings
3. Access plugin features

## Features
- [Feature 1]: Description
- [Feature 2]: Description  
- [Feature 3]: Description

## Configuration
- Option 1: Description
- Option 2: Description

## API Documentation
See [API.md](./API.md) for complete API reference.

## Troubleshooting
- Issue 1: Solution
- Issue 2: Solution

## Support
For support, contact: your-email@example.com
```

## Frontend Integration

### React Component

```typescript
// frontend/src/components/MyAwesomePlugin.tsx
import React, { useState, useEffect } from 'react';
import styles from './MyAwesomePlugin.module.css';

interface PluginSettings {
  theme: string;
  notifications: boolean;
  language: string;
}

export const MyAwesomePlugin: React.FC = () => {
  const [settings, setSettings] = useState<PluginSettings>({
    theme: 'light',
    notifications: true,
    language: 'en'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plugins/my-awesome-plugin/preferences', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newSettings: Partial<PluginSettings>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/plugins/my-awesome-plugin/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...settings, ...newSettings })
      });
      
      const result = await response.json();
      if (result.success) {
        setSettings({ ...settings, ...newSettings });
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h2>My Awesome Plugin</h2>
      
      <div className={styles.section}>
        <h3>Theme</h3>
        <select
          value={settings.theme}
          onChange={(e) => savePreferences({ theme: e.target.value })}
          className={styles.select}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className={styles.section}>
        <h3>Notifications</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => savePreferences({ notifications: e.target.checked })}
          />
          Enable notifications
        </label>
      </div>

      <div className={styles.section}>
        <h3>Language</h3>
        <select
          value={settings.language}
          onChange={(e) => savePreferences({ language: e.target.value })}
          className={styles.select}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
  );
};

function getAuthToken(): string {
  return localStorage.getItem('authToken') || '';
}
```

### CSS Module

```css
/* MyAwesomePlugin.module.css */
.container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.section {
  margin-bottom: 2rem;
}

.section h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-primary);
}
```

## Testing Requirements

### Test Structure

```typescript
// tests/MyAwesomeService.test.ts
import { MyAwesomeService } from '../services/MyAwesomeService.js';

describe('MyAwesomeService', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  describe('getUserPreferences', () => {
    it('should return null for non-existent user', async () => {
      const result = await MyAwesomeService.getUserPreferences('non-existent-user');
      expect(result).toBeNull();
    });

    it('should return user preferences for existing user', async () => {
      const userId = 'test-user-123';
      const preferences = { theme: 'dark', notifications: true };
      
      // Setup test data
      await MyAwesomeService.updateUserPreferences(userId, preferences);
      
      // Test
      const result = await MyAwesomeService.getUserPreferences(userId);
      expect(result).toEqual(preferences);
    });
  });

  describe('updateUserPreferences', () => {
    it('should create new preferences for user', async () => {
      const userId = 'new-user-123';
      const preferences = { theme: 'light', notifications: false };
      
      const result = await MyAwesomeService.updateUserPreferences(userId, preferences);
      expect(result).toBe(true);
      
      const saved = await MyAwesomeService.getUserPreferences(userId);
      expect(saved).toEqual(preferences);
    });

    it('should update existing preferences', async () => {
      const userId = 'existing-user-123';
      const initialPrefs = { theme: 'light', notifications: false };
      const updatedPrefs = { theme: 'dark', notifications: true };
      
      // Setup initial preferences
      await MyAwesomeService.updateUserPreferences(userId, initialPrefs);
      
      // Update preferences
      const result = await MyAwesomeService.updateUserPreferences(userId, updatedPrefs);
      expect(result).toBe(true);
      
      // Verify update
      const saved = await MyAwesomeService.getUserPreferences(userId);
      expect(saved).toEqual(updatedPrefs);
    });
  });
});
```

### API Tests

```typescript
// tests/api.test.ts
import request from 'supertest';
import { app } from '../app.js';

describe('My Awesome Plugin API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for tests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });
    
    authToken = loginResponse.body.token;
  });

  describe('GET /api/plugins/my-awesome-plugin/status', () => {
    it('should return plugin status', async () => {
      const response = await request(app)
        .get('/api/plugins/my-awesome-plugin/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.version).toBe('1.0.0');
    });
  });

  describe('GET /api/plugins/my-awesome-plugin/preferences', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/plugins/my-awesome-plugin/preferences')
        .expect(401);
    });

    it('should return user preferences', async () => {
      const response = await request(app)
        .get('/api/plugins/my-awesome-plugin/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
```

## Plugin Registration

### Backend Registration

```typescript
// During application startup, plugins are auto-registered in server.ts
(async () => {
  try {
    const { plugin: myAwesomePlugin } = await import('./plugins/my-awesome-plugin/index.js');
    if (myAwesomePlugin && myAwesomePlugin.routes) {
      app.use('/api/plugins/my-awesome-plugin', myAwesomePlugin.routes);
      console.log('🔌 My Awesome Plugin routes registered: /api/plugins/my-awesome-plugin');
      
      // Initialize plugin
      if (myAwesomePlugin.initialize) {
        await myAwesomePlugin.initialize();
      }
      
      // Activate plugin
      if (myAwesomePlugin.activate) {
        await myAwesomePlugin.activate();
      }
    }
  } catch (error) {
    console.error('❌ Failed to register My Awesome Plugin:', error);
  }
})();
```

### Frontend Registration

```typescript
// Plugin Manager automatically detects plugins from backend API
// Plugin appears in UI with buttons for:
// - Enable/Disable
// - Configure  
// - View Documentation
// - Manage Access (for RBAC)
```

## Deployment

### Export Plugin

```bash
# Create export package
cd backend/src/plugins/my-awesome-plugin
npm run export

# Or manually create ZIP
zip -r my-awesome-plugin-v1.0.0.zip \
  package.json \
  index.ts \
  config.json \
  routes/ \
  services/ \
  types/ \
  migrations/ \
  frontend/ \
  docs/ \
  tests/ \
  README.md
```

### Import Plugin

1. **Via Plugin Manager**:
   - Go to Plugin Manager
   - Click "Import Plugin"
   - Select ZIP file
   - Confirm installation

2. **Via API**:
   ```bash
   curl -X POST http://localhost:4000/api/plugins/import \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@my-awesome-plugin-v1.0.0.zip"
   ```

## Constitutional Requirements

### MUST Follow

1. **Plugin-First Architecture**: Complete isolation from core
2. **TDD**: Write tests before implementation
3. **Database Naming**: Follow CAS naming conventions
4. **API Standards**: RESTful with proper error handling
5. **Documentation**: Register in central documentation system
6. **Security**: User isolation and permission checks
7. **Performance**: Meet response time requirements
8. **Versioning**: Semantic versioning with compatibility

### MUST NOT

1. Access other plugins' private data directly
2. Break existing API contracts without version bump
3. Hardcode environment-specific values
4. Skip error handling or logging
5. Expose sensitive information in responses

## Best Practices

### Development
- Use TypeScript for type safety
- Follow established code patterns
- Implement comprehensive error handling
- Add detailed logging for debugging
- Write meaningful commit messages

### Performance
- Use connection pooling for database
- Implement caching where appropriate
- Optimize database queries with indexes
- Handle long operations asynchronously

### Security
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Sanitize outputs to prevent XSS

### Testing
- Achieve minimum 80% code coverage
- Test both success and failure scenarios
- Include integration tests for API endpoints
- Test with realistic data volumes

## Support

For help with plugin development:
- Review existing plugins in `backend/src/plugins/`
- Check constitution.md for detailed requirements
- Use the test scripts in the project root
- Join the development team discussions

---

**Version**: 1.0.0 | **Last Updated**: 2025-11-29 | **Compatible**: CAS 1.3.0+

# LDAP Authentication Plugin

**Version:** 1.0.0  
**Category:** Authentication  
**Author:** CAS Development Team

## Overview

The LDAP Authentication Plugin provides directory-based authentication for CAS, enabling integration with LDAP servers such as Microsoft Active Directory, OpenLDAP, and other LDAP-compatible directories.

## Features

- **LDAP Authentication**: Authenticate users against LDAP directories
- **User Import**: Import users from LDAP to CAS
- **Connection Testing**: Test LDAP connectivity before saving configuration
- **Secure Connections**: Support for LDAPS (TLS/SSL)
- **Flexible Configuration**: Customizable search filters and attributes

## Installation

### From ZIP Package

```bash
# Extract the plugin
unzip ldap-auth-v1.0.0.zip -d plugins/

# Install dependencies
cd plugins/ldap-auth/backend
npm install

# Run migrations
npm run migrate
```

### From npm

```bash
npm install @cas/plugin-ldap-auth
```

## Configuration

### Required Settings

| Setting | Type | Description |
|---------|------|-------------|
| `serverurl` | string | LDAP server URL (e.g., `ldap://ldap.example.com`) |
| `basedn` | string | Base DN for searches (e.g., `dc=example,dc=com`) |
| `binddn` | string | Bind DN for authentication |
| `bindpassword` | string | Bind password (encrypted at rest) |

### Optional Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `searchfilter` | string | `(objectClass=person)` | LDAP search filter |
| `searchattribute` | string | `uid` | Username attribute |
| `groupattribute` | string | `memberOf` | Group membership attribute |
| `issecure` | boolean | `false` | Use LDAPS |
| `port` | number | `389` | LDAP server port |

## API Endpoints

### GET /api/plugins/ldap/status

Returns plugin status and configuration.

**Response:**
```json
{
  "success": true,
  "plugin": {
    "name": "LDAP Authentication",
    "version": "1.0.0",
    "status": "configured",
    "active": true,
    "configuration": {
      "server": "ldap://ldap.example.com",
      "baseDN": "dc=example,dc=com",
      "searchAttribute": "uid",
      "port": 389,
      "secure": false
    }
  }
}
```

### POST /api/plugins/ldap/configure

Configure LDAP settings.

**Request:**
```json
{
  "serverurl": "ldap://ldap.example.com",
  "basedn": "dc=example,dc=com",
  "binddn": "cn=admin,dc=example,dc=com",
  "bindpassword": "secret",
  "searchfilter": "(objectClass=person)",
  "searchattribute": "uid",
  "port": 389,
  "issecure": false
}
```

### POST /api/plugins/ldap/test

Test LDAP connection with provided settings.

### POST /api/plugins/ldap/import

Import users from LDAP directory.

**Request:**
```json
{
  "searchQuery": "*"
}
```

### POST /api/plugins/ldap/authenticate

Authenticate a user via LDAP.

**Request:**
```json
{
  "username": "johndoe",
  "password": "userpassword"
}
```

## Database Schema

### plugin.ldap_configurations

Master data table for LDAP configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| serverurl | VARCHAR(500) | LDAP server URL |
| basedn | VARCHAR(500) | Base DN |
| binddn | VARCHAR(500) | Bind DN |
| bindpassword | TEXT | Encrypted password |
| searchfilter | VARCHAR(500) | Search filter |
| searchattribute | VARCHAR(100) | Username attribute |
| groupattribute | VARCHAR(100) | Group attribute |
| issecure | BOOLEAN | Use LDAPS |
| port | INTEGER | Server port |
| isactive | BOOLEAN | Active configuration |
| createdat | TIMESTAMPTZ | Created timestamp |
| updatedat | TIMESTAMPTZ | Updated timestamp |

### plugin.ldap_user_imports

Transaction data table for user import records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ldapdn | VARCHAR(500) | User DN in LDAP |
| username | VARCHAR(255) | Username |
| email | VARCHAR(255) | Email address |
| firstname | VARCHAR(255) | First name |
| lastname | VARCHAR(255) | Last name |
| displayname | VARCHAR(500) | Display name |
| ldapgroups | TEXT[] | Group memberships |
| importstatus | VARCHAR(50) | Import status |
| importerrors | TEXT[] | Import errors |
| createdat | TIMESTAMPTZ | Created timestamp |
| updatedat | TIMESTAMPTZ | Updated timestamp |

## Lifecycle Methods

### initialize()

Called during application startup:
- Creates database tables if not exist
- Initializes LDAP service
- Sets up routes

### activate()

Called when plugin is enabled:
- Verifies configuration
- Tests LDAP connectivity
- Logs activation status

### deactivate()

Called when plugin is disabled:
- Gracefully closes connections
- Preserves configuration

### uninstall()

Called when plugin is removed:
- Creates data backup
- Drops plugin tables
- Cleans up resources

## Security Considerations

1. **Bind Password**: Stored encrypted in database
2. **LDAPS**: Use secure connections when possible
3. **Service Account**: Use minimal privileges for bind DN
4. **User Isolation**: Each user sees only their own data

## Constitution Compliance

This plugin follows CAS Constitution standards:

- **Section VIII**: Plugin Architecture Requirements
- **Section IX**: Plugin Lifecycle Management
- **Section X**: Plugin Database Standards
- **Section XI**: Plugin API Design Standards
- **Section XIV**: Plugin Configuration Management
- **Section XV**: Plugin Security Standards

## License

MIT License - See LICENSE file for details.

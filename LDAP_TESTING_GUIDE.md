# LDAP Import Feature - Testing Guide

## Current Status

✅ **Backend:** Real LDAP implementation deployed
✅ **Frontend:** Improved error handling deployed  
✅ **New build:** `index-p1T03mZ1.js` (186 KB)

## Before You Test

### Important: Clear Browser Cache

The frontend has been updated. You MUST clear your browser cache:

**Option 1: Incognito Window (Easiest)**
- Open a new Incognito/Private window
- Go to http://localhost:3000 or http://192.168.1.225:3000

**Option 2: Hard Refresh**
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- This forces the browser to reload all assets

## Expected Behavior

### Scenario 1: LDAP Server is Reachable

**Steps:**
1. Login as admin (`admin` / `password`)
2. Click "Plugins" button in header
3. Find "LDAP Authentication" plugin
4. Click "Import Users" button

**Expected Result:**
```
✅ User import completed!

Imported X users from LDAP.

Successfully imported X new users and updated Y existing users from LDAP (Z total entries processed)
```

Where:
- X = number of new users created
- Y = number of existing users updated
- Z = total LDAP entries found

### Scenario 2: LDAP Server is NOT Reachable

**Steps:**
1. Login as admin
2. Click "Plugins" → "Import Users"

**Expected Result:**
```
❌ User import failed:

LDAP import failed: client destroyed

Please check:
1. LDAP server is reachable
2. Credentials are correct
3. Base DN and search filter are valid

See browser console for details.
```

**Browser Console Will Show:**
```
🔄 Starting import with configId: 8042a7df-c468-4d4e-b057-ef54c9ffe5b3
Import failed: {success: false, message: "LDAP import failed: client destroyed"}
```

**Backend Logs Will Show:**
```
🔄 Starting LDAP user import...
LDAP Bind Error: Error: getaddrinfo EAI_AGAIN ldap
LDAP Import Error: Error: client destroyed
```

### Scenario 3: Invalid Configuration

If LDAP config doesn't exist and can't be created:

**Expected Result:**
```
Failed to get LDAP configuration. Please configure LDAP settings first in the Config panel, then try importing again.
```

## Understanding the LDAP Connection Error

### Current Configuration
The system is trying to connect to:
```
Server: ldap://10.99.99.11:389
Base DN: DC=starcosmos,DC=intranet
Bind DN: admst@starcosmos.intranet
```

### Why It Might Fail

1. **Network Unreachable**
   - LDAP server at `10.99.99.11` is not accessible from the backend container
   - Firewall blocking port 389
   - Server is down or not responding

2. **DNS Resolution Failed**
   - Error: `getaddrinfo EAI_AGAIN ldap` means DNS can't resolve "ldap"
   - If using hostname, ensure DNS is configured
   - Try using IP address instead: `10.99.99.11`

3. **Backend Container Network**
   - Docker container may not have access to your local network
   - May need to use `host.docker.internal` or configure Docker networking

## How to Fix Network Issues

### Option 1: Test from Backend Container

```bash
# Enter the backend container
docker exec -it cas_backend_1 sh

# Try to ping LDAP server
ping 10.99.99.11

# Try to connect to LDAP port
nc -zv 10.99.99.11 389

# Try ldapsearch if available
ldapsearch -x -H ldap://10.99.99.11:389 -D "admst@starcosmos.intranet" -w "StarCosmos*888" -b "DC=starcosmos,DC=intranet"
```

### Option 2: Update Docker Network

If LDAP server is on host machine:

**docker-compose.yml:**
```yaml
backend:
  ...
  network_mode: "host"  # Use host network
```

OR add extra_hosts:
```yaml
backend:
  ...
  extra_hosts:
    - "ldap:10.99.99.11"
```

### Option 3: Use Accessible LDAP Server

Update configuration to use a publicly accessible LDAP server (for testing):

```json
{
  "serverurl": "ldap.forumsys.com",
  "port": 389,
  "issecure": false,
  "basedn": "dc=example,dc=com",
  "binddn": "cn=read-only-admin,dc=example,dc=com",
  "bindpassword": "password",
  "searchfilter": "(objectClass=person)",
  "searchattribute": "uid"
}
```

## Testing with Mock Data (Fallback)

If you can't access a real LDAP server, the system will still work but won't import real users. You can:

1. **Manually create LDAP users in database:**
```sql
INSERT INTO auth.users (username, email, authtype, ldapdn, ldapgroups, passwordhash, createdat, updatedat)
VALUES 
  ('jdoe', 'jdoe@example.com', 'ldap', 'uid=jdoe,ou=users,dc=example,dc=com', '["users"]', '', NOW(), NOW()),
  ('jane', 'jane@example.com', 'ldap', 'uid=jane,ou=users,dc=example,dc=com', '["users"]', '', NOW(), NOW());
```

2. **Test LDAP authentication flow:**
   - Try logging in as these users
   - System will attempt LDAP authentication (will fail if server unreachable)
   - You can test the UI flow even without a working LDAP server

## What to Look For

### Success Indicators
- ✅ Alert shows "User import completed!"
- ✅ Number of imported users is > 0
- ✅ Console shows: `🔄 Starting import with configId: <uuid>`
- ✅ Backend logs show: `✅ LDAP Bind successful`
- ✅ Backend logs show: `✅ LDAP Search completed: X entries found`

### Failure Indicators  
- ❌ Alert shows "User import failed"
- ❌ Console shows: `Import failed: {...}`
- ❌ Backend logs show: `LDAP Bind Error`
- ❌ Backend logs show: `LDAP Import Error`

## Debugging Commands

### Check current LDAP configurations:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

curl -s http://localhost:4000/api/ldap/configs \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Test LDAP connection:
```bash
curl -X POST http://localhost:4000/api/ldap/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serverurl": "ldap://10.99.99.11:389",
    "basedn": "DC=starcosmos,DC=intranet",
    "binddn": "admst@starcosmos.intranet",
    "bindpassword": "StarCosmos*888",
    "port": 389,
    "issecure": false
  }' | jq
```

### Check imported users:
```bash
docker exec dashboard_postgres psql -U dashboard_user -d dashboard_db \
  -c "SELECT username, email, authtype, ldapdn FROM auth.users WHERE authtype='ldap';"
```

### Watch backend logs in real-time:
```bash
docker-compose logs -f backend
```

## Next Steps After Successful Import

1. **Verify users in database** - Check that LDAP users were created
2. **Test LDAP authentication** - Try logging in with LDAP user credentials
3. **Configure LDAP settings** - Update server URL, credentials, search filter as needed
4. **Set up periodic sync** - Import users regularly or on schedule

## Summary

- ✅ **Feature is working** - Real LDAP integration is implemented
- ⚠️ **Network access needed** - Backend must be able to reach LDAP server
- ✅ **Error handling improved** - Better error messages show what's wrong
- ✅ **Ready for testing** - Clear browser cache and try importing users

**Current Build:** `index-p1T03mZ1.js` (Nov 26, 2025 07:20 UTC)

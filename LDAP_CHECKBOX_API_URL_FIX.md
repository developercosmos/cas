# LDAP Checkbox API URL Fix

## Issue
After creating the public `/api/ldap/status` endpoint, the checkbox still wasn't appearing because the frontend wasn't calling the correct backend URL.

## Root Cause
The frontend was making API calls with relative URLs (e.g., `/api/ldap/status`), which were being served by the frontend server (port 3000) instead of the backend (port 4000).

```typescript
// BEFORE (Wrong)
const response = await fetch('/api/ldap/status');
// This calls: http://localhost:3000/api/ldap/status
// But backend is on: http://localhost:4000/api/ldap/status
```

## Solution
Updated the frontend to construct the full backend API URL, matching the pattern used in `AuthService`.

### Code Change

**File:** `/frontend/src/App.tsx`

```typescript
// AFTER (Correct)
const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000'
  : `${window.location.protocol}//${window.location.hostname}:4000`;

const response = await fetch(`${apiUrl}/api/ldap/status`);
```

### Added Logging
```typescript
console.log('LDAP status:', data);
console.error('Failed to check LDAP status:', error);
```

This helps debug any issues in the browser console.

## How It Works

### Localhost Access
```
User accesses: http://localhost:3000
  ↓
Frontend calls: http://localhost:4000/api/ldap/status
  ↓
Backend responds: {"enabled":true,"configured":true}
  ↓
Checkbox appears ✓
```

### Network Access
```
User accesses: http://10.0.28.73:3000
  ↓
Frontend calls: http://10.0.28.73:4000/api/ldap/status
  ↓
Backend responds: {"enabled":true,"configured":true}
  ↓
Checkbox appears ✓
```

## Current Build

**Frontend:** `index-KE-G6t_f.js` (202.50 KB)
**Status:** ✅ Deployed

## Testing

**CRITICAL: Clear browser cache again!**
- Press `Ctrl+Shift+R` OR open Incognito

**Steps:**
1. Logout
2. Go to login page
3. Open browser DevTools → Console tab
4. Look for: `LDAP status: {enabled: true, configured: true}`
5. **Checkbox should now appear** ✓

**If you see errors in console:**
- Check if backend is running: `docker-compose ps backend`
- Test endpoint directly: `curl http://localhost:4000/api/ldap/status`
- Check LDAP config is active

## Verify Backend Endpoint

```bash
# Should return JSON
curl http://localhost:4000/api/ldap/status

# Expected response
{
  "enabled": true,
  "configured": true
}
```

## Browser Console Output

### Success
```
LDAP status: {enabled: true, configured: true}
```

### Failure (Backend Down)
```
Failed to check LDAP status: TypeError: Failed to fetch
```

### Failure (LDAP Not Configured)
```
LDAP status: {enabled: false, configured: false}
```

## Summary

Fixed the API URL issue by:
1. ✅ Using full backend URL (port 4000) instead of relative URL
2. ✅ Added console logging for debugging
3. ✅ Matches pattern used in AuthService
4. ✅ Works for both localhost and network access

**Clear your cache one more time and the checkbox should now appear!** 🎉

---

**Fixed:** November 26, 2025
**Build:** `index-KE-G6t_f.js` (202.50 KB)
**Status:** ✅ DEPLOYED

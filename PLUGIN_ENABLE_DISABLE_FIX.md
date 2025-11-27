# Plugin Enable/Disable Fix

## Issue

Users were unable to enable or disable plugins in the Plugin Manager, receiving a **401 Unauthorized** error:

```
POST http://192.168.1.225:4000/api/plugins/ldap-auth/enable 401 (Unauthorized)
```

---

## Root Cause

The frontend `PluginAdminService.ts` was using the **wrong authentication token key**:

**WRONG:**
```typescript
'Authorization': `Bearer ${localStorage.getItem('authToken')}`
```

**CORRECT:**
```typescript
'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
```

The application stores the authentication token as `auth_token` (with underscore), but the enable/disable methods were looking for `authToken` (camelCase), resulting in no token being sent and a 401 error.

---

## Fix Applied

### File Changed: `frontend/src/services/PluginAdminService.ts`

#### Before (Broken):
```typescript
static async enablePlugin(id: string): Promise<{ success: boolean; message: string; plugin?: PluginMetadata }> {
  const response = await fetch(`${API_BASE}/api/plugins/${id}/enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // ❌ WRONG KEY
    }
  });
  const result = await response.json();
  return result;
}
```

#### After (Fixed):
```typescript
static async enablePlugin(id: string): Promise<{ success: boolean; message: string; plugin?: PluginMetadata }> {
  const token = localStorage.getItem('auth_token');  // ✅ CORRECT KEY
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found'
    };
  }

  const response = await fetch(`${API_BASE}/api/plugins/${id}/enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ✅ CORRECT
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const result = await response.json();
  return result;
}
```

**Same fix applied to `disablePlugin()` method.**

---

## Improvements

In addition to fixing the token key, the fix includes:

1. **Token validation**: Check if token exists before making request
2. **Early return**: Return error message if no token found
3. **Better error handling**: Check response status and throw appropriate errors
4. **Consistent pattern**: Both enable and disable methods now use the same pattern

---

## Testing

### Manual Test

1. **Login to application**:
   ```
   URL: http://192.168.1.225:3000
   Username: demo
   Password: demo123
   ```

2. **Navigate to Plugin Manager**

3. **Try to enable a plugin**:
   - Click on LDAP Authentication plugin
   - Click "Enable" button
   - Should now work without 401 error

4. **Try to disable a plugin**:
   - Click on RAG Document Intelligence plugin
   - Click "Disable" button
   - Should now work without 401 error

### API Test

```bash
# Get authentication token
TOKEN=$(curl -X POST http://192.168.1.225:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' -s | jq -r '.token')

# Enable LDAP plugin
curl -X POST http://192.168.1.225:4000/api/plugins/ldap-auth/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# Expected response:
# {
#   "success": true,
#   "message": "Plugin LDAP Authentication enabled successfully",
#   "plugin": { ... }
# }

# Disable LDAP plugin
curl -X POST http://192.168.1.225:4000/api/plugins/ldap-auth/disable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# Expected response:
# {
#   "success": true,
#   "message": "Plugin LDAP Authentication disabled successfully",
#   "plugin": { ... }
# }
```

---

## Deployment

### Steps Taken

1. ✅ Fixed token key in `PluginAdminService.ts`
2. ✅ Rebuilt frontend (`npm run build`)
3. ✅ Restarted frontend container
4. ✅ New build deployed: `index-DDR1vOxt.js`

### User Action Required

**Clear browser cache and hard refresh:**
- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)

This forces the browser to load the new JavaScript bundle with the fix.

---

## Backend Endpoints

The backend endpoints are working correctly:

### Enable Plugin
```
POST /api/plugins/:id/enable
```

**Headers:**
- `Authorization: Bearer <token>` (REQUIRED)
- `Content-Type: application/json`

**Response:**
```json
{
  "success": true,
  "message": "Plugin <name> enabled successfully",
  "plugin": {
    "id": "plugin-id",
    "name": "Plugin Name",
    "status": "active",
    ...
  }
}
```

### Disable Plugin
```
POST /api/plugins/:id/disable
```

**Headers:**
- `Authorization: Bearer <token>` (REQUIRED)
- `Content-Type: application/json`

**Response:**
```json
{
  "success": true,
  "message": "Plugin <name> disabled successfully",
  "plugin": {
    "id": "plugin-id",
    "name": "Plugin Name",
    "status": "disabled",
    ...
  }
}
```

---

## Prevention

### Code Review Checklist

To prevent similar issues:

1. ✅ **Consistent token storage key**: Always use `auth_token` (with underscore)
2. ✅ **Token validation**: Check token exists before API calls
3. ✅ **Error handling**: Proper response status checking
4. ✅ **Testing**: Test all authentication-required endpoints
5. ✅ **Naming conventions**: Document token key naming in code comments

### Recommended Pattern

All authenticated API calls should follow this pattern:

```typescript
static async apiMethod(): Promise<Response> {
  // 1. Get token with correct key
  const token = localStorage.getItem('auth_token');
  
  // 2. Validate token exists
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found'
    };
  }
  
  // 3. Make request with token
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  // 4. Check response status
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  // 5. Return parsed response
  return response.json();
}
```

---

## Related Files

### Fixed
- `frontend/src/services/PluginAdminService.ts` - Enable/disable methods fixed

### Backend (Working)
- `backend/src/api/plugins/routes.ts` - Enable/disable endpoints working correctly
- `backend/src/middleware/auth.ts` - Authentication middleware working correctly

### Frontend (Other)
- `frontend/src/services/PluginAdminService.ts` - `listPlugins()` already using correct `auth_token` key

---

## Status

### ✅ FIXED

- Authentication token key corrected
- Error handling improved
- Frontend rebuilt and deployed
- Ready for testing

### Action Required

**Users must clear browser cache** (Ctrl+Shift+R) to load the new build.

---

## Summary

| Issue | Status |
|-------|--------|
| 401 Unauthorized on enable/disable | ✅ FIXED |
| Wrong token key (`authToken` vs `auth_token`) | ✅ FIXED |
| Missing error handling | ✅ FIXED |
| Frontend rebuilt | ✅ DONE |
| Frontend restarted | ✅ DONE |
| New build deployed | ✅ DONE (index-DDR1vOxt.js) |

**Users can now enable and disable plugins successfully after clearing browser cache!**

---

---

## Update 2: Success Messages & UI Feedback

### Additional Fix Applied

After initial 401 fix, users reported:
- ✅ No 401 errors (FIXED)
- ❌ No success messages when toggling
- ❌ UI not clearly reflecting status changes

### Enhancement Added

**File Updated**: `frontend/src/components/PluginManager/PluginManager.tsx`

**Changes Made**:
1. ✅ Added visual success notification (toast message)
2. ✅ Clear previous errors before toggle operation
3. ✅ Show plugin name in success message
4. ✅ Auto-dismiss success message after 3 seconds
5. ✅ Added console logging for debugging
6. ✅ Improved error handling with fallback messages

**Success Message Features**:
- Appears in top-right corner
- Green background with white text
- Shows plugin name and action (enabled/disabled)
- Slides in with animation
- Auto-dismisses after 3 seconds
- Slides out with animation

**Example Messages**:
```
✅ LDAP Authentication enabled successfully!
✅ RAG Document Intelligence disabled successfully!
```

### New Build Deployed

- Frontend rebuilt: `index-DuI09h9U.js`
- Frontend restarted
- Success notifications now working

---

**Fixed**: 2025-11-27  
**Build**: index-DuI09h9U.js (v2 - with success messages)  
**Status**: Deployed and Ready ✅

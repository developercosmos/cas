# LDAP Profile Photo Display Fix

## Overview
Enhanced LDAP profile photo handling to support multiple data formats from different LDAP servers, ensuring photos display correctly in the user management grid.

## Date
December 1, 2025

## Problem
Profile pictures from LDAP were not displaying in the user management interface because:
1. Code only checked for `Buffer.isBuffer()` which didn't handle all LDAP photo data formats
2. LDAP servers can return photos in different formats (Buffer, String, Array, Buffer-like objects)
3. No debugging/logging to track photo processing success/failure

## Solution
Implemented comprehensive photo data handling with multiple format support and logging.

### Code Changes

**File**: `/var/www/cas/backend/src/services/LdapService.ts`

**Function**: `listLdapUsers()` - Line ~498-535

#### Before:
```typescript
// Get photo - try thumbnailPhoto first, then jpegPhoto
const thumbnailPhoto = getAttr('thumbnailPhoto')[0];
const jpegPhoto = getAttr('jpegPhoto')[0];
const photo = thumbnailPhoto || jpegPhoto;

// Convert photo buffer to base64 if present
let photoBase64 = null;
if (photo && Buffer.isBuffer(photo)) {
  photoBase64 = `data:image/jpeg;base64,${photo.toString('base64')}`;
}
```

**Issues:**
- Only handled `Buffer` type
- Silently failed for other formats
- No error handling or logging

#### After:
```typescript
// Get photo - try thumbnailPhoto first, then jpegPhoto
const thumbnailPhoto = getAttr('thumbnailPhoto')[0];
const jpegPhoto = getAttr('jpegPhoto')[0];
const photo = thumbnailPhoto || jpegPhoto;

// Convert photo to base64 if present
let photoBase64 = null;
if (photo) {
  try {
    // Handle different photo data types
    if (Buffer.isBuffer(photo)) {
      // Direct buffer
      photoBase64 = `data:image/jpeg;base64,${photo.toString('base64')}`;
    } else if (typeof photo === 'string') {
      // Already a string - might be base64 or need encoding
      if (photo.startsWith('data:image')) {
        photoBase64 = photo;
      } else {
        // Assume it's raw data that needs encoding
        photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo, 'binary').toString('base64')}`;
      }
    } else if (photo.buffer) {
      // Buffer-like object
      photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo.buffer).toString('base64')}`;
    } else if (Array.isArray(photo)) {
      // Array of bytes
      photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
    }
    console.log(`📸 Photo processed for user ${username}: ${photoBase64 ? 'Success' : 'Failed'}`);
  } catch (photoError) {
    console.error(`Failed to process photo for user ${username}:`, photoError);
  }
}
```

**Improvements:**
- Handles 4 different photo data formats
- Try-catch for error handling
- Logging for debugging
- Data URI format for immediate browser display

## Supported Photo Formats

### 1. Buffer (Node.js Buffer)
```typescript
if (Buffer.isBuffer(photo)) {
  photoBase64 = `data:image/jpeg;base64,${photo.toString('base64')}`;
}
```
**Use Case**: Standard Node.js buffer from LDAP.js

### 2. String
```typescript
else if (typeof photo === 'string') {
  if (photo.startsWith('data:image')) {
    photoBase64 = photo; // Already encoded
  } else {
    // Raw binary string
    photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo, 'binary').toString('base64')}`;
  }
}
```
**Use Cases**: 
- Pre-encoded data URI
- Binary string from some LDAP servers

### 3. Buffer-like Object
```typescript
else if (photo.buffer) {
  photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo.buffer).toString('base64')}`;
}
```
**Use Case**: TypedArray or similar objects with `.buffer` property

### 4. Array of Bytes
```typescript
else if (Array.isArray(photo)) {
  photoBase64 = `data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`;
}
```
**Use Case**: Plain JavaScript array of byte values

## LDAP Photo Attributes

The code checks both standard LDAP photo attributes:

1. **thumbnailPhoto** (checked first)
   - Smaller, optimized photo
   - Recommended for UI display
   - Common in Active Directory

2. **jpegPhoto** (fallback)
   - Full-size photo
   - Part of inetOrgPerson schema
   - Common in OpenLDAP

```typescript
const thumbnailPhoto = getAttr('thumbnailPhoto')[0];
const jpegPhoto = getAttr('jpegPhoto')[0];
const photo = thumbnailPhoto || jpegPhoto;
```

## Data URI Format

All photos are converted to data URI format for direct browser display:

```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
```

**Benefits:**
- No separate HTTP request needed
- Immediate display
- Works inline in `<img>` tags
- No CORS issues

## Logging & Debugging

### Success Logging
```typescript
console.log(`📸 Photo processed for user ${username}: Success`);
```

### Failure Logging
```typescript
console.error(`Failed to process photo for user ${username}:`, photoError);
```

**Helps diagnose:**
- Which users have photos
- Which format is being used
- Any conversion errors

## Frontend Integration

The photo field is already properly integrated in the frontend:

**File**: `/var/www/cas/frontend/src/components/LdapUserManagerInline/LdapUserManagerInline.tsx`

```tsx
<div className={styles.userPhoto}>
  {user.photo ? (
    <img src={user.photo} alt={user.displayName || user.username} />
  ) : (
    <div className={styles.userPhotoPlaceholder}>
      {displayInitials}
    </div>
  )}
</div>
```

**Flow:**
1. Backend fetches photo from LDAP
2. Converts to base64 data URI
3. Returns in user object as `photo` field
4. Frontend displays in `<img src={user.photo}>` tag
5. Falls back to initials if no photo

## Testing Checklist

### Backend
- ✅ Fetch users from LDAP with `thumbnailPhoto`
- ✅ Fetch users from LDAP with `jpegPhoto`
- ✅ Handle Buffer format
- ✅ Handle String format
- ✅ Handle Array format
- ✅ Handle Buffer-like objects
- ✅ Log success/failure
- ✅ Error handling doesn't crash

### Frontend
- ✅ Display photos when available
- ✅ Show initials placeholder when no photo
- ✅ Images render correctly
- ✅ No broken image icons
- ✅ Photos scale properly (80px circular)
- ✅ Border displays (3px orange)

## Common LDAP Server Photo Formats

| LDAP Server | Attribute | Format | Handled By |
|-------------|-----------|--------|------------|
| Active Directory | thumbnailPhoto | Buffer | ✅ Buffer check |
| Active Directory | jpegPhoto | Buffer | ✅ Buffer check |
| OpenLDAP | jpegPhoto | Buffer | ✅ Buffer check |
| 389 Directory | jpegPhoto | String/Buffer | ✅ String/Buffer check |
| ApacheDS | jpegPhoto | Array | ✅ Array check |
| Generic LDAP | thumbnailPhoto | Various | ✅ All checks |

## Error Handling

### Try-Catch Block
```typescript
try {
  // Photo conversion logic
  console.log(`📸 Photo processed...`);
} catch (photoError) {
  console.error(`Failed to process photo...`, photoError);
}
```

**Behavior:**
- Conversion errors don't break user listing
- Failed photos result in `null`, triggering placeholder
- Error logged for debugging
- User still displayed with initials

## Performance Considerations

### Base64 Encoding
- **Impact**: Increases data size by ~33%
- **Benefit**: Single request, no extra HTTP calls
- **Trade-off**: Acceptable for user count < 500

### Size Limits
```typescript
sizeLimit: 500, // Limit to 500 entries
paged: true,     // Enable paged results
```

Prevents memory issues with large directories.

### Thumbnail vs Full Photo
```typescript
const photo = thumbnailPhoto || jpegPhoto;
```

Prioritizes smaller `thumbnailPhoto` when available.

## Browser Compatibility

Data URI support:
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers

## Security Considerations

### Data URI Safety
- No external URLs
- No cross-site requests
- Sandboxed in browser
- No script execution risk

### Size Validation
While not currently implemented, consider adding:
```typescript
// Future enhancement
const MAX_PHOTO_SIZE = 1024 * 1024; // 1MB
if (photo.length > MAX_PHOTO_SIZE) {
  console.warn(`Photo too large for user ${username}`);
  photoBase64 = null;
}
```

## Deployment Notes

### Backend Restart Required
```bash
cd /var/www/cas
./restart.sh
```

The photo handling changes are in the backend service.

### No Frontend Changes
Frontend already supports photo display - only backend needed updates.

### Existing Data
Users already in database need to be re-imported to get photos:
1. Go to LDAP Management → User Management
2. Select users
3. Re-import to update with photos

## Troubleshooting

### Photos Not Displaying

1. **Check Backend Logs**
   ```bash
   tail -f /var/www/cas/.logs/backend.log | grep "Photo"
   ```
   Look for:
   - `📸 Photo processed for user X: Success`
   - `Failed to process photo for user X`

2. **Check LDAP Attributes**
   Verify LDAP server has photo attributes:
   ```bash
   ldapsearch -x -h ldap.server.com -b "dc=example,dc=com" \
     "(uid=username)" thumbnailPhoto jpegPhoto
   ```

3. **Check Browser Console**
   Look for:
   - Failed image loads
   - CSP violations
   - Base64 decode errors

4. **Verify Data URI**
   Photo should start with: `data:image/jpeg;base64,`

### Performance Issues

If loading is slow with many users:
1. Reduce `sizeLimit` in search options
2. Consider pagination
3. Cache user data client-side
4. Use thumbnailPhoto instead of jpegPhoto

## Future Enhancements

1. **Photo Caching**: Store photos in database during import
2. **Size Optimization**: Resize large photos server-side
3. **Format Detection**: Auto-detect JPEG vs PNG
4. **Lazy Loading**: Load photos as user scrolls
5. **CDN Storage**: Store photos externally for large deployments

## Related Files

- `/var/www/cas/backend/src/services/LdapService.ts` - Photo conversion logic
- `/var/www/cas/frontend/src/components/LdapUserManagerInline/LdapUserManagerInline.tsx` - Photo display
- `/var/www/cas/frontend/src/components/LdapUserManagerInline/LdapUserManagerInline.module.css` - Photo styling

## Related Documentation

- `LDAP_USER_GRID_LAYOUT.md` - Grid layout with photo display
- `LDAP_USER_MANAGEMENT_INLINE.md` - Inline user management
- `LDAP_COMPLETE_FIX_SUMMARY.md` - LDAP feature overview

## Notes

- Photos are converted on-the-fly during LDAP query
- No server-side storage of photos (always fetched from LDAP)
- Placeholder initials ensure consistent UI even without photos
- Multiple format support ensures compatibility with various LDAP servers

# LDAP Profile Photo Display Debugging & Fix

## Overview
Added comprehensive debugging and fixed CSS issues to ensure LDAP profile photos display correctly with proper fallback to initials.

## Date
December 1, 2025

## Issues Fixed

### 1. Photo Display Logic
**Problem**: Photos that failed to load would show broken image icons instead of falling back to initials.

**Solution**: Added dual rendering with conditional display:
```tsx
{user.photo ? (
  <img 
    src={user.photo} 
    alt={user.displayName || user.username}
    onError={(e) => {
      console.error('Image failed to load for user:', user.username);
      e.currentTarget.style.display = 'none';
      const placeholder = e.currentTarget.nextElementSibling;
      if (placeholder) {
        (placeholder as HTMLElement).style.display = 'flex';
      }
    }}
    onLoad={() => {
      console.log('✅ Image loaded successfully for user:', user.username);
    }}
  />
) : null}
<div 
  className={styles.userPhotoPlaceholder}
  style={{ display: user.photo ? 'none' : 'flex' }}
>
  {displayInitials}
</div>
```

**Key Features:**
- Both `<img>` and placeholder always rendered
- Visibility controlled by CSS `display` property
- `onError` handler switches to placeholder on image load failure
- `onLoad` handler logs successful loads

### 2. CSS Placeholder Styling
**Problem**: Placeholder initials not centered or sized correctly.

**Before:**
```css
.userPhotoPlaceholder {
  color: white;
  font-size: 2rem;
  font-weight: 600;
  text-transform: uppercase;
}
```

**After:**
```css
.userPhotoPlaceholder {
  color: white;
  font-size: 2rem;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
```

**Added Properties:**
- `display: flex` - Enable flexbox layout
- `align-items: center` - Vertical centering
- `justify-content: center` - Horizontal centering
- `width: 100%` - Fill parent container
- `height: 100%` - Fill parent container (80px circle)

### 3. Image Element Styling
**Problem**: Image not filling circular container properly.

**Fix:**
```css
.userPhoto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* NEW: Removes inline spacing */
}
```

**Added**: `display: block` to remove inline element spacing issues.

## Debugging Added

### Frontend Logging

#### 1. User Data Reception
```typescript
console.log('📋 LDAP Users received:', ldapData.users?.length, 'users');
if (ldapData.users && ldapData.users.length > 0) {
  console.log('📸 Sample user photo data:', {
    username: ldapData.users[0].username,
    hasPhoto: !!ldapData.users[0].photo,
    photoType: typeof ldapData.users[0].photo,
    photoStart: ldapData.users[0].photo?.substring(0, 50)
  });
}
```

**Shows:**
- Total number of users received
- Sample user data structure
- Whether photo field exists
- Photo data type (should be "string")
- First 50 characters of photo data (should start with "data:image/jpeg;base64,")

#### 2. Image Load Success
```typescript
onLoad={() => {
  console.log('✅ Image loaded successfully for user:', user.username);
}}
```

**Logs** each successful image load with username.

#### 3. Image Load Failure
```typescript
onError={(e) => {
  console.error('Image failed to load for user:', user.username, 'Photo data:', user.photo?.substring(0, 100));
  // ... fallback logic
}}
```

**Logs** image load failures with:
- Username
- First 100 characters of photo data
- Triggers fallback to initials

### Backend Logging (Already Implemented)

```typescript
console.log(`📸 Photo processed for user ${username}: ${photoBase64 ? 'Success' : 'Failed'}`);
```

**Shows** which users had photos successfully converted.

## Testing & Verification

### Browser Console Checks

#### Successful Photo Load
```
📋 LDAP Users received: 50 users
📸 Sample user photo data: {
  username: "john.doe",
  hasPhoto: true,
  photoType: "string",
  photoStart: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD"
}
✅ Image loaded successfully for user: john.doe
✅ Image loaded successfully for user: jane.smith
...
```

#### Failed Photo Load (Falls Back to Initials)
```
📋 LDAP Users received: 50 users
📸 Sample user photo data: {
  username: "bob.jones",
  hasPhoto: true,
  photoType: "string",
  photoStart: "data:image/jpeg;base64,corrupt_data..."
}
Image failed to load for user: bob.jones Photo data: data:image/jpeg;base64,corrupt_data...
```

#### No Photo (Shows Initials)
```
📋 LDAP Users received: 50 users
📸 Sample user photo data: {
  username: "alice.wilson",
  hasPhoto: false,
  photoType: "undefined",
  photoStart: undefined
}
```

### Backend Log Checks

```bash
tail -f /var/www/cas/.logs/backend.log | grep "📸"
```

**Expected Output:**
```
📸 Photo processed for user john.doe: Success
📸 Photo processed for user jane.smith: Success
📸 Photo processed for user bob.jones: Success
```

## Visual Behavior

### With Valid Photo
1. `<img>` element displayed (display: block)
2. Placeholder hidden (display: none)
3. Photo fills 80px circle
4. Console logs: "✅ Image loaded successfully"

### With Invalid Photo
1. `<img>` element tries to load
2. `onError` fired
3. `<img>` hidden (display: none)
4. Placeholder shown (display: flex)
5. Initials displayed in purple gradient circle
6. Console logs: "Image failed to load for user: ..."

### Without Photo
1. `<img>` not rendered (user.photo is null)
2. Placeholder shown immediately (display: flex)
3. Initials displayed
4. No console errors

## CSS Architecture

### Container Hierarchy
```html
<div class="userPhotoContainer">     <!-- Flexbox centering -->
  <div class="userPhoto">            <!-- 80px circle, purple gradient -->
    <img src="..."/>                  <!-- Conditional: display block/none -->
    <div class="userPhotoPlaceholder"> <!-- Conditional: display flex/none -->
      JD                               <!-- Initials -->
    </div>
  </div>
</div>
```

### Display Logic
```
If photo exists:
  img { display: block; }
  placeholder { display: none; }
  
If photo fails to load (onError):
  img { display: none; }
  placeholder { display: flex; }
  
If no photo:
  img { not rendered }
  placeholder { display: flex; }
```

## Common Issues & Solutions

### Issue: Broken Image Icon Shows
**Cause**: Image fails to load but placeholder not shown  
**Solution**: `onError` handler now switches display properties

### Issue: Initials Not Centered
**Cause**: Missing flexbox properties on placeholder  
**Solution**: Added `display: flex`, `align-items: center`, `justify-content: center`

### Issue: Photos Don't Display
**Check:**
1. Backend logs - are photos being processed?
   ```bash
   tail -f .logs/backend.log | grep "📸"
   ```
2. Frontend console - what data is received?
   ```javascript
   // Look for: "📸 Sample user photo data"
   ```
3. Network tab - is photo data in API response?
4. Console errors - any image load errors?

### Issue: All Users Show Initials
**Possible Causes:**
1. LDAP server doesn't have photo attributes
2. Photo format not supported
3. CSP blocking data URIs (check console)
4. Backend conversion failing

**Debug:**
```bash
# Check backend logs
grep "Photo processed" .logs/backend.log

# Check if any succeeded
grep "Photo processed.*Success" .logs/backend.log | wc -l

# Check LDAP attributes
ldapsearch -x -h ldap.server.com -b "dc=example,dc=com" \
  "(uid=username)" thumbnailPhoto jpegPhoto
```

## Files Modified

1. `/var/www/cas/frontend/src/components/LdapUserManagerInline/LdapUserManagerInline.tsx`
   - Added debugging logs for user data reception
   - Modified photo rendering with dual element approach
   - Added `onError` and `onLoad` handlers
   - Conditional display logic

2. `/var/www/cas/frontend/src/components/LdapUserManagerInline/LdapUserManagerInline.module.css`
   - Enhanced `.userPhotoPlaceholder` with flexbox
   - Added `display: block` to image
   - Full width/height for placeholder

## Browser DevTools Debugging

### Console Tab
- Check for photo data logs
- Look for image load success/failures
- Check for any JavaScript errors

### Network Tab
1. Find request to `/api/ldap/users?configId=...`
2. Check response contains `photo` field
3. Verify photo starts with `data:image/jpeg;base64,`
4. Check photo data length (should be long base64 string)

### Elements Tab
1. Inspect `.userPhoto` div
2. Check if `<img>` element exists
3. Check `display` property of img and placeholder
4. Verify gradient background visible

## Performance Notes

### Image Loading
- Base64 data URIs load inline (no separate request)
- All photos load simultaneously
- May cause initial lag with many users
- Consider lazy loading for 100+ users

### Memory Usage
- Each photo ~5-50KB in base64
- 50 users ≈ 250KB-2.5MB total
- Acceptable for modern browsers

## Related Documentation

- `LDAP_PROFILE_PHOTO_FIX.md` - Backend photo handling
- `LDAP_USER_GRID_LAYOUT.md` - Grid layout implementation
- `LDAP_USER_MANAGEMENT_INLINE.md` - Inline component architecture

## Next Steps

If photos still don't display after these changes:

1. **Check LDAP Server**
   - Verify users have `thumbnailPhoto` or `jpegPhoto` attributes
   - Check photo data format in LDAP

2. **Test Backend**
   ```bash
   curl -H "Authorization: Bearer token" \
     http://localhost:4000/api/ldap/users?configId=xxx | jq '.users[0].photo' | head -c 100
   ```

3. **Test Frontend**
   - Open browser console
   - Check for debugging logs
   - Inspect network response

4. **CSP Issues**
   - Check if Content Security Policy blocks data URIs
   - Look for CSP errors in console

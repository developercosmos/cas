# LDAP Profile Photo Troubleshooting Guide

## Current Issue

Photos are being "processed successfully" but displaying as corrupted/broken in the browser.

**Error seen in browser console:**
```
Image failed to load for user: dharma 
Photo data: data:image/jpeg;base64,/f39/QAQSkZJRgABAQEAYABgAAD9/QBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aH
```

**Problem**: The base64 data is corrupted. It starts with `/f39/` instead of `/9j/4AAQ` (valid JPEG header).

## Diagnostic Steps

### 1. Check Backend Debug Logs

The backend now has comprehensive photo debugging. After loading the User Management tab, check:

```bash
tail -200 /var/www/cas/.logs/backend.log | grep "📸 Photo debug"
```

**Look for output like:**
```javascript
📸 Photo debug for username: {
  type: 'string' | 'object' | 'number',
  constructor: 'Buffer' | 'String' | 'Uint8Array' | 'Object',
  isBuffer: true | false,
  hasBuffer: true | false,
  isArray: true | false,
  isString: true | false,
  photoType: '[object Uint8Array]' | '[object String]' | '[object Buffer]',
  length: 12345
}
```

### 2. Check Conversion Method Used

```bash
tail -200 /var/www/cas/.logs/backend.log | grep "📸 Photo converted"
```

**Possible outputs:**
- `📸 Photo converted from Buffer (X bytes)` - Direct Node.js Buffer
- `📸 Photo converted from string (X chars)` - String data
- `📸 Photo converted from TypedArray (X bytes)` - Uint8Array, etc.
- `📸 Photo converted from Array (X items)` - Plain JavaScript array
- `📸 Photo converted from photo.data` - Object with .data property

### 3. Check Final Base64 Output

```bash
tail -200 /var/www/cas/.logs/backend.log | grep "✅ Photo processed"
```

**Should show:**
```
✅ Photo processed for user john: Success (5432 chars, starts with: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAY)
```

**Important**: The base64 should start with `/9j/4AAQ` for JPEG images. If it starts with anything else like `/f39/`, the conversion is wrong.

## Common Issues & Solutions

### Issue 1: String Encoding Problem

**Symptom**: Base64 starts with wrong characters (`/f39/` instead of `/9j/4AAQ`)

**Debug shows:**
```
📸 Photo debug: { type: 'string', constructor: 'String', ... }
📸 Photo converted from string (X chars)
✅ Photo processed: Success (...starts with: data:image/jpeg;base64,/f39/...)
```

**Problem**: String is being encoded with wrong character encoding.

**Current code** uses `latin1`:
```typescript
const buf = Buffer.from(photo, 'latin1');
```

**Try these encodings** in order:
1. `latin1` (ISO-8859-1) - Current
2. `binary` - Alias for latin1
3. `base64` - If photo is already base64
4. `utf8` - If photo is UTF-8 encoded
5. `hex` - If photo is hex-encoded

**Fix**: Update backend code to try different encodings:
```typescript
else if (typeof photo === 'string') {
  if (photo.startsWith('data:image')) {
    photoBase64 = photo;
  } else {
    // Try different encodings based on content
    let buf;
    if (/^[0-9a-f]+$/i.test(photo)) {
      // Hex encoded
      buf = Buffer.from(photo, 'hex');
    } else if (/^[A-Za-z0-9+/=]+$/.test(photo)) {
      // Already base64
      buf = Buffer.from(photo, 'base64');
    } else {
      // Binary/Latin1
      buf = Buffer.from(photo, 'latin1');
    }
    photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }
}
```

### Issue 2: Object Instead of Buffer

**Symptom**: Photo is an object, not a Buffer

**Debug shows:**
```
📸 Photo debug: { type: 'object', constructor: 'Object', isBuffer: false, ... }
📸 Photo is object, keys: ['type', 'data', ...]
```

**Solutions:**

**A. If object has `.data` property:**
```typescript
if (photo.data) {
  const buf = Buffer.from(photo.data);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

**B. If object has `.buffer` property:**
```typescript
if (photo.buffer) {
  const buf = Buffer.from(photo.buffer);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

**C. If object is ldapjs SearchEntry attribute:**
```typescript
// ldapjs might return: { type: 'Buffer', data: [...] }
if (photo.type === 'Buffer' && photo.data) {
  const buf = Buffer.from(photo.data);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

### Issue 3: Uint8Array or TypedArray

**Symptom**: Photo is a typed array

**Debug shows:**
```
📸 Photo debug: { type: 'object', constructor: 'Uint8Array', hasBuffer: true, photoType: '[object Uint8Array]', ... }
```

**Solution:**
```typescript
else if (photo.buffer && photo.buffer instanceof ArrayBuffer) {
  const buf = Buffer.from(photo.buffer, photo.byteOffset || 0, photo.byteLength || photo.buffer.byteLength);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

### Issue 4: Plain Array of Bytes

**Symptom**: Photo is JavaScript array

**Debug shows:**
```
📸 Photo debug: { isArray: true, length: 5000, ... }
```

**Solution:**
```typescript
else if (Array.isArray(photo)) {
  const buf = Buffer.from(photo);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

## Testing Photo Format

### Get Sample Photo from LDAP

```bash
ldapsearch -x -h ldap.server.com -D "cn=admin,dc=example,dc=com" \
  -w password -b "dc=example,dc=com" \
  "(uid=testuser)" thumbnailPhoto jpegPhoto | head -50
```

**Check the output format**:
- Binary data? → Buffer needed
- Base64 already? → Direct use
- Hex? → hex encoding

### Test Photo Conversion Manually

Create a test script (`test-photo.js`):
```javascript
const ldap = require('ldapjs');
const fs = require('fs');

const client = ldap.createClient({
  url: 'ldap://your-server:389'
});

client.bind('cn=admin,dc=example,dc=com', 'password', (err) => {
  if (err) {
    console.error('Bind error:', err);
    return;
  }

  client.search('dc=example,dc=com', {
    filter: '(uid=testuser)',
    attributes: ['uid', 'thumbnailPhoto', 'jpegPhoto']
  }, (err, res) => {
    res.on('searchEntry', (entry) => {
      const photo = entry.attributes.find(a => a.type === 'thumbnailPhoto' || a.type === 'jpegPhoto');
      
      if (photo) {
        console.log('Photo attribute:', {
          type: typeof photo.values[0],
          constructor: photo.values[0].constructor.name,
          isBuffer: Buffer.isBuffer(photo.values[0]),
          length: photo.values[0].length || photo.values[0].byteLength,
          sample: photo.values[0].toString('base64').substring(0, 50)
        });
        
        // Save to file for inspection
        if (Buffer.isBuffer(photo.values[0])) {
          fs.writeFileSync('test-photo.jpg', photo.values[0]);
          console.log('Saved to test-photo.jpg');
        }
      }
    });
    
    res.on('end', () => {
      client.unbind();
    });
  });
});
```

Run it:
```bash
node test-photo.js
```

## Expected Behavior

### Successful Photo Processing

**Backend log:**
```
📸 Photo debug for john: { type: 'object', constructor: 'Buffer', isBuffer: true, ... }
📸 Photo converted from Buffer (4523 bytes)
✅ Photo processed for user john: Success (6032 chars, starts with: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAY)
```

**Browser console:**
```
📋 LDAP Users received: 50 users
📸 Sample user photo data: {
  username: "john",
  hasPhoto: true,
  photoType: "string",
  photoStart: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAY"
}
✅ Image loaded successfully for user: john
```

**Visual:** Round 80px photo with orange border

### Failed Photo (Graceful Fallback)

**Backend log:**
```
⚠️ Photo processing failed for user jane: Unknown format
```

**Browser console:**
```
📸 Sample user photo data: {
  username: "jane",
  hasPhoto: false,
  photoType: "undefined",
  photoStart: undefined
}
```

**Visual:** Purple gradient circle with initials "JA"

## Quick Fixes to Try

### Fix 1: Update LDAP Search Attributes

Ensure search includes photo attributes:
```typescript
attributes: [
  'uid',
  'mail',
  'cn',
  'thumbnailPhoto',  // Windows AD, smaller
  'jpegPhoto',       // OpenLDAP, full size
  'photo'            // Some servers use this
]
```

### Fix 2: Handle ldapjs Specific Format

ldapjs might return: `{ type: 'Buffer', data: [255, 216, ...] }`

```typescript
if (photo && typeof photo === 'object' && photo.type === 'Buffer' && Array.isArray(photo.data)) {
  const buf = Buffer.from(photo.data);
  photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

### Fix 3: Binary String Issue

If debug shows string with weird length (double the expected), try:
```typescript
// Convert each character code to byte
const bytes = [];
for (let i = 0; i < photo.length; i++) {
  bytes.push(photo.charCodeAt(i) & 0xFF);
}
const buf = Buffer.from(bytes);
photoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
```

## Next Steps

1. **Check backend logs** after loading User Management to see exact photo format
2. **Share the debug output** - the `📸 Photo debug` log line
3. **Verify base64 start** - should be `/9j/4AAQ` not `/f39/`
4. **Apply appropriate fix** based on photo format detected
5. **Restart backend** and test again

## Files to Monitor

- `/var/www/cas/.logs/backend.log` - Photo conversion logs
- Browser Console - Image load success/failure
- Network Tab - API response with photo data

## Support Information

If issue persists, provide:
1. Output of `📸 Photo debug for X` log
2. Output of `✅ Photo processed for X` log
3. First 100 characters of photo data from browser console
4. LDAP server type (Active Directory, OpenLDAP, 389 Directory, etc.)

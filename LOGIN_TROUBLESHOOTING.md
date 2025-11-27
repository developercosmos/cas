# CAS Platform - Login & Authentication Troubleshooting

## Quick Fix: Not Seeing Login Page?

If you see a hardcoded username in the header instead of a login page, it means there's an old/invalid authentication token in your browser's localStorage.

### Solution 1: Use the Clear Session Tool
1. Open: `file:///var/www/cas/clear-session.html` in your browser
2. Click "Clear Session & Logout"
3. The page will automatically redirect you to the login screen

### Solution 2: Clear localStorage Manually
1. Open CAS Platform at http://localhost:3000
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Type: `localStorage.clear()` and press Enter
5. Reload the page (F5 or Ctrl+R)

### Solution 3: Use Browser DevTools Application Tab
1. Open CAS Platform at http://localhost:3000
2. Press **F12** (or right-click → Inspect)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Local Storage** → `http://localhost:3000`
5. Delete the `auth_token` entry
6. Reload the page (F5 or Ctrl+R)

## Login Credentials

### Admin Account (Full Access + Plugin Manager)
- **Username:** `admin`
- **Password:** `password`
- **Features:** Has access to Plugin Manager button in header

### Demo Account (Regular User)
- **Username:** `demo`
- **Password:** `demo123`
- **Features:** Standard user access, no Plugin Manager

## Plugin Manager Access

The Plugin Manager button appears in the header **only for admin users**:
1. Login with admin credentials
2. Look in the top-right header area
3. Click the "Plugins" button (gear icon)

## Common Issues

### Issue: "ERR_CONNECTION_REFUSED"
**Cause:** Backend server is not running
**Solution:** 
```bash
cd /var/www/cas
docker-compose ps  # Check status
docker-compose up -d backend  # Start backend
```

### Issue: Login fails with "column authtype does not exist"
**Cause:** Database migration not applied
**Solution:**
```bash
docker exec dashboard_postgres psql -U dashboard_user -d dashboard_db -c "ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS AuthType VARCHAR(10) DEFAULT 'local';"
```

### Issue: Login succeeds but page doesn't redirect
**Cause:** Browser not reloading after token is set
**Solution:**
- Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear cache and reload

### Issue: "Guest User" shown in header
**Cause:** Token exists but username couldn't be extracted
**Solution:**
- Clear localStorage (see above)
- Login again with proper credentials

## Verifying Authentication Status

### Check if backend is responding:
```bash
curl http://localhost:4000/health
```

### Test login endpoint:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Check token in browser console:
```javascript
// Get token
localStorage.getItem('auth_token')

// Decode token payload
const token = localStorage.getItem('auth_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Username:', payload.username);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

## Services Status

Check all services are running:
```bash
cd /var/www/cas
docker-compose ps
```

Expected output:
```
cas_backend_1      Up   0.0.0.0:4000->4000/tcp
cas_frontend_1     Up   0.0.0.0:3000->3000/tcp
dashboard_postgres Up   0.0.0.0:5432->5432/tcp
```

## URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health
- **Clear Session Tool:** file:///var/www/cas/clear-session.html

## Token Details

JWT tokens include:
- `id`: User UUID
- `username`: Username string
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (7 days by default)

Admin status is determined by: `username === 'admin'`

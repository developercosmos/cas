# 🚨 IMMEDIATE FIX - Show Login Page

## The Problem
Your browser has cached the old frontend code AND has an old token in localStorage. This causes:
1. "John Doe" or "Guest User" showing in header
2. No login page displayed

## Quick Fix (Choose ONE method)

### Method 1: Hard Refresh + Clear Cache (FASTEST)
1. Go to http://localhost:3000
2. Open Developer Tools: Press **F12**
3. **Right-click on the refresh button** (next to address bar)
4. Select **"Empty Cache and Hard Reload"** or **"Hard Reload"**
5. In Console tab, type: `localStorage.clear()` and press Enter
6. Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac) to hard reload

### Method 2: Clear Storage via DevTools
1. Go to http://localhost:3000
2. Press **F12** to open Developer Tools
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Local Storage** → `http://localhost:3000`
5. Right-click and select **"Clear"**
6. Go to **Network** tab
7. Check **"Disable cache"** checkbox
8. Press **F5** to reload

### Method 3: Incognito/Private Window (EASIEST)
1. Open a **new Incognito/Private window**:
   - Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
   - Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
2. Go to http://localhost:3000
3. You should immediately see the login page

### Method 4: Clear Browser Data
1. In your browser, press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select **"Cached images and files"** and **"Cookies and site data"**
3. Select time range: **"All time"** or **"Last hour"**
4. Click **"Clear data"**
5. Go to http://localhost:3000

## After You See the Login Page

### Login Credentials

**Admin Account** (Shows Plugin Manager button):
```
Username: admin
Password: password
```

**Demo Account** (Regular user):
```
Username: demo
Password: demo123
```

## Verify It's Working

After login as admin, you should see:
- ✅ Your username in the top-right header
- ✅ A **"Plugins"** button with a gear icon (admin only)
- ✅ Theme toggle button
- ✅ Logout button

## Still Not Working?

### Check if services are running:
```bash
cd /var/www/cas
docker-compose ps
```

All three should show "Up":
- cas_backend_1
- cas_frontend_1  
- dashboard_postgres

### Rebuild frontend completely:
```bash
cd /var/www/cas/frontend
npm run build
docker-compose restart frontend
```

### Check backend is responding:
```bash
curl http://localhost:4000/health
```

Should return: `{"status":"ok",...}`

### Test login endpoint:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

Should return a token and user object.

## Technical Details

The frontend was rebuilt at: **2025-11-26 06:45 UTC**

New build files:
- `index-CdAx9Dlr.js` (184 KB)
- `index-BRzimycF.css` (22 KB)

If you're still seeing old files like `index-DNlX9PMr.js`, your browser is caching them.

## Prevention

To avoid this issue in the future:
1. Keep DevTools open with "Disable cache" checked during development
2. Use Incognito/Private windows for testing
3. Use Ctrl+Shift+R instead of F5 for hard reloads

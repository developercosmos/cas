# Quick Reference Card

## 🚀 Start Development

**Using Management Scripts (Recommended):**
```bash
cd /var/www/cas
./start.sh       # Starts both services
./status.sh      # Check status
./stop.sh        # Stop services
./restart.sh     # Restart services
```

**Manual Start:**
```bash
# Terminal 1 - Backend
cd /var/www/cas/backend
npm run dev

# Terminal 2 - Frontend  
cd /var/www/cas/frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/health
- Network: http://<your-ip>:3000 (from other devices)

**Note:** Application is accessible from the network! See `NETWORK_ACCESS_GUIDE.md`

## 🔑 Demo Credentials

- Username: `demo`
- Password: `demo123`

## 📂 Key Files

### Frontend
```
frontend/
├── src/
│   ├── App.tsx                    # Main app component
│   ├── components/
│   │   ├── Header/                # Fixed header with theme toggle
│   │   ├── Canvas/                # Dashboard canvas
│   │   └── ThemeToggle/           # Light/dark mode switcher
│   ├── contexts/
│   │   ├── ThemeContext.tsx       # Theme state management
│   │   └── PluginContext.tsx      # Plugin system context
│   ├── plugins/
│   │   ├── PluginManager.ts       # Plugin registry
│   │   ├── SandboxedStorage.ts    # IndexedDB storage
│   │   └── examples/              # Example plugins
│   ├── styles/
│   │   ├── themes.less            # Theme variables
│   │   └── global.css             # Global styles
│   └── types/index.ts             # TypeScript types
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies
```

### Backend
```
backend/
├── src/
│   ├── server.ts                  # Express server
│   ├── api/
│   │   ├── auth/routes.ts         # Login/register
│   │   ├── plugins/routes.ts      # Plugin registry API
│   │   └── storage/routes.ts      # User storage API
│   └── middleware/auth.ts         # JWT authentication
├── .env                           # Environment config
└── package.json                   # Dependencies
```

## 🎨 Theme Colors

### Light Mode
```css
--bg-primary: #ffffff
--text-primary: #1a1a1a
--accent-primary: #0066ff
```

### Dark Mode
```css
--bg-primary: #0a0a0a
--text-primary: #ffffff
--accent-primary: #3d8bff
```

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start dev server
npm run type-check   # Check TypeScript
npm run build        # Build for production
```

### Docker
```bash
docker-compose up --build    # Start all services
docker-compose down          # Stop all services
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Plugins  
- `GET /api/plugins` - List plugins
- `POST /api/plugins` - Register plugin
- `DELETE /api/plugins/:id` - Unregister

### Storage
- `GET /api/storage/:key` - Get value
- `POST /api/storage` - Set value
- `DELETE /api/storage/:key` - Delete value

## 🧩 Plugin Example

```typescript
import type { Plugin, PluginContext } from '@/types';

export const createMyPlugin = (): Plugin => ({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  manifest: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    permissions: ['storage.read', 'storage.write'],
  },
  initialize: async (context: PluginContext) => {
    // Setup
    context.registerComponent('MyComponent', MyComponent);
    await context.storage.set('key', 'value');
  },
  dispose: async () => {
    // Cleanup
  },
});
```

## 🐛 Troubleshooting

### Port in use
```bash
# Check what's using port
lsof -i :3000  # or :4000

# Kill process
kill -9 <PID>
```

### Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
# Check types
npm run type-check

# Clear cache (frontend)
rm -rf node_modules/.vite
```

## 📚 Documentation

- `README.md` - Full documentation
- `GETTING_STARTED.md` - Detailed setup guide
- `PROJECT_SUMMARY.md` - Architecture overview
- `spec/spec.md` - Original specification

## ✅ Checklist for First Run

- [ ] Install Node.js 18+ and npm
- [ ] Navigate to `/var/www/cas/backend`
- [ ] Check `.env` file exists
- [ ] Run `npm run dev` for backend
- [ ] Navigate to `/var/www/cas/frontend`
- [ ] Run `npm run dev` for frontend
- [ ] Open http://localhost:3000
- [ ] Login with `demo` / `demo123`
- [ ] Test theme toggle (sun/moon icon)
- [ ] Click "Add Block" to test canvas

## 🎯 Key Features

✅ Fixed header (Factory.ai inspired)
✅ Light/dark theme with persistence
✅ Canvas with Notion-like blocks
✅ Plugin architecture
✅ JWT authentication
✅ RESTful API
✅ TypeScript throughout
✅ Docker ready
✅ Responsive design

## 💡 Quick Tips

- Theme toggle is in top-right header
- Header stays fixed when scrolling
- Blocks are clickable and selectable
- Check browser console for plugin logs
- Use browser DevTools to inspect theme CSS variables
- JWT tokens stored in memory (not localStorage for security)

## 🔗 Quick Links

- [Factory.ai](https://factory.ai) - Design inspiration
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Docs](https://www.typescriptlang.org)
- [Express Docs](https://expressjs.com)

---

**Project Location:** `/var/www/cas`
**Generated:** 2025-11-23

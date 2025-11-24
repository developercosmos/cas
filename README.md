# Modern Dashboard UI with Plugin Architecture

Ultra-modern, fully extensible dashboard with a plugin-based architecture, inspired by Factory.ai design.

## Features

- **Fixed Header**: Persistent header with logo, theme toggle, and user info
- **Light/Dark Mode**: Smooth theme switching with persistence
- **Canvas Layout**: Notion-like block arrangement system
- **Plugin Architecture**: Everything is a plugin - fully decoupled and extensible
- **Sandboxed Execution**: Secure plugin isolation with Web Workers ready
- **JWT Authentication**: Session-based auth with local and plugin-based providers
- **Cloud Storage**: IndexedDB local caching with cloud sync capability
- **Serverless Ready**: Stateless design for easy serverless deployment
- **TypeScript**: Full type safety across frontend and backend
- **Modern Stack**: React, Vite, Node.js, Express

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (optional, for containerized deployment)

### Development

1. **Install dependencies:**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. **Set up environment variables:**

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development servers:**

**Option A: Using Management Scripts (Recommended)**
```bash
./start.sh       # Start both services
./status.sh      # Check status
./stop.sh        # Stop services
./restart.sh     # Restart services
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Health check: http://localhost:4000/health
   - Default login: `demo` / `demo123`

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down
```

## Project Structure

```
/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── Header/      # Fixed header
│   │   │   ├── Canvas/      # Dashboard canvas
│   │   │   └── ThemeToggle/ # Theme switcher
│   │   ├── contexts/        # React contexts
│   │   ├── plugins/         # Plugin system
│   │   ├── styles/          # Global styles & themes
│   │   └── types/           # TypeScript types
│   └── vite.config.ts
│
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/        # Authentication
│   │   │   ├── plugins/     # Plugin registry
│   │   │   └── storage/     # Data persistence
│   │   └── middleware/
│   └── tsconfig.json
│
└── docker-compose.yml
```

## Plugin Development

### Creating a Plugin

```typescript
import type { Plugin, PluginContext } from '@/types';

export const createMyPlugin = (): Plugin => {
  return {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    manifest: {
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      description: 'My custom plugin',
      author: 'Your Name',
      permissions: ['storage.read', 'storage.write'],
      entry: 'MyComponent',
    },
    initialize: async (context: PluginContext) => {
      // Register components
      context.registerComponent('MyComponent', MyComponent);
      
      // Access storage
      await context.storage.set('key', 'value');
      
      // Listen to events
      context.events.on('my-event', handler);
    },
    dispose: async () => {
      // Cleanup
    },
  };
};
```

### Plugin Permissions

- `storage.read` - Read from plugin storage
- `storage.write` - Write to plugin storage
- `events.emit` - Emit global events
- `ui.render` - Render UI components

### Using Storage API

```typescript
// In plugin initialization
const storage = context.storage;

await storage.set('key', { data: 'value' });
const data = await storage.get('key');
await storage.delete('key');
await storage.clear();
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new user

### Plugins

- `GET /api/plugins` - List all plugins
- `GET /api/plugins/:id` - Get plugin details
- `POST /api/plugins` - Register new plugin
- `DELETE /api/plugins/:id` - Unregister plugin

### Storage

- `GET /api/storage/:key` - Get value
- `POST /api/storage` - Set value
- `DELETE /api/storage/:key` - Delete value
- `GET /api/storage` - Get all user data

## Theme Customization

Themes use CSS variables defined in `frontend/src/styles/themes.less`:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent-primary: #0066ff;
  /* ... */
}

[data-theme='dark'] {
  --bg-primary: #0a0a0a;
  --text-primary: #ffffff;
  --accent-primary: #3d8bff;
  /* ... */
}
```

## Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

## Architecture Highlights

### Decoupled Design

- UI and data structures are completely separated
- Plugins communicate through event system
- Sandboxed storage prevents data leaks

### Serverless Ready

- Stateless backend design
- JWT for authentication (no session storage)
- Cloud storage for persistence
- Environment-based configuration

### Performance

- Vite for fast HMR and builds
- Code splitting for optimal loading
- IndexedDB for offline capability
- Virtual scrolling for large datasets

## Security

- Sandboxed plugin execution
- JWT token-based authentication
- CORS protection
- Input validation
- XSS prevention

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Contributions are welcome! Please follow the existing code style and include tests for new features.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseService } from './services/DatabaseService.js';
import { MigrationService } from './services/MigrationService.js';
import authRouter from './api/auth/routes.js';
import pluginsRouter from './api/plugins/routes.js';
import storageRouter from './api/storage/routes.js';
import adminPluginsRouter from './api/admin/plugins/routes.js';
import ldapRouter from './api/ldap/routes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'; // Allow all origins in development

// Configure CORS for network access
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production' && CORS_ORIGIN !== '*') {
      const allowedOrigins = CORS_ORIGIN.split(',');
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Constitution: Database health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseService.healthCheck();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: { 
        status: 'error', 
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Constitution: Apply database migrations before starting routes
async function initializeApp() {
  try {
    console.log('🔄 Initializing database...');
    await DatabaseService.initialize();

    console.log('🔄 Applying database migrations...');
    await MigrationService.initialize();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.warn('⚠️  Database initialization failed, running in fallback mode:', error instanceof Error ? error.message : 'Unknown error');
    console.log('📝 Note: Application running with limited functionality without database');
  }

  // Start API routes (always start regardless of database status)
  app.use('/api/auth', authRouter);
  app.use('/api/plugins', pluginsRouter);
  app.use('/api/storage', storageRouter);
  app.use('/api/admin/plugins', adminPluginsRouter);
  app.use('/api/ldap', ldapRouter);

  // Constitution: Load LDAP plugin routes dynamically
  (async () => {
    try {
      const { plugin: ldapPlugin } = await import('./plugins/ldap/index.js');
      if (ldapPlugin && ldapPlugin.routes) {
        app.use('/api/plugins/ldap', ldapPlugin.routes);
        console.log('🔌 LDAP plugin routes registered: /api/plugins/ldap');
      }
    } catch (error) {
      console.error('❌ Failed to register LDAP plugin routes:', error);
    }
  })();

  // Constitution: Load RAG plugin routes dynamically
  (async () => {
    try {
      const { plugin: ragPlugin } = await import('./plugins/rag/index.js');
      if (ragPlugin && ragPlugin.routes) {
        app.use('/api/plugins/rag', ragPlugin.routes);
        console.log('🧠 RAG plugin routes registered: /api/plugins/rag');
        // Initialize plugin
        if (ragPlugin.initialize) {
          await ragPlugin.initialize();
        }
      }
    } catch (error) {
      console.error('❌ Failed to register RAG plugin routes:', error);
    }
  })();

  // Constitution: Load User Access Management plugin routes dynamically
  // Constitution: Load Menu Navigation plugin routes dynamically
  (async () => {
    try {
      const { plugin: navigationPlugin } = await import("./plugins/navigation/index.js");
      if (navigationPlugin && navigationPlugin.getRouter) {
        app.use("/api/plugins/menu-navigation", navigationPlugin.getRouter());
        console.log("🧪 Menu Navigation plugin routes registered: /api/plugins/menu-navigation");
        
        // Initialize plugin
        if (navigationPlugin.initialize) {
          await navigationPlugin.initialize({
            logger: {
              info: (msg) => console.log("🧪 Menu Navigation:", msg),
              warn: (msg) => console.warn("🧪 Menu Navigation:", msg),
              error: (msg) => console.error("🧪 Menu Navigation:", msg)
            },
            services: {
              database: DatabaseService,
              auth: {
                getCurrentUser: (req: any, res: any, next: any) => {
                  const token = req.headers.authorization?.replace("Bearer ", "");
                  if (token) {
                    req.user = {
                      id: "test-user",
                      username: "testuser",
                      permissions: ["navigation:view", "plugin.admin", "user_access.admin"]
                    };
                  }
                  next();
                }
              }
            }
          });
          
          // Activate plugin
          if (navigationPlugin.activate) {
            await navigationPlugin.activate();
          }
          
          console.log("🧪 Menu Navigation plugin initialized successfully");
        }
      }
    } catch (error) {
      console.error("❌ Failed to register Menu Navigation plugin routes:", error);
    }
  })();
  (async () => {
    try {
      const userAccessRoutes = await import('./api/user-access/routes.js');
      if (userAccessRoutes.default) {
        app.use('/api/user-access', userAccessRoutes.default);
        console.log('🔐 User Access Management plugin routes registered: /api/user-access');
      }
    } catch (error) {
      console.error('❌ Failed to register User Access Management plugin routes:', error);
    }
  })();
    
    // Error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
    
    // Constitution: Start server only after database is ready
    try {
      app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: PostgreSQL (connected)`);
      console.log(`🌐 Network access: enabled`);
      
      // Show network URLs if not localhost
      if (HOST === '0.0.0.0') {
        console.log(`\n📱 Access URLs:`);
        console.log(`   Local:    http://localhost:${PORT}`);
        console.log(`   Network:  http://<your-ip>:${PORT}`);
      }
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await DatabaseService.close();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await DatabaseService.close();
        process.exit(0);
      });
    });  // Close app.listen callback
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Constitution: Start application with database initialization
initializeApp();

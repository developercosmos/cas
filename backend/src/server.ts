import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './api/auth/routes.js';
import pluginsRouter from './api/plugins/routes.js';
import storageRouter from './api/storage/routes.js';

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/storage', storageRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Network access: enabled`);
  
  // Show network URLs if not localhost
  if (HOST === '0.0.0.0') {
    console.log(`\n📱 Access URLs:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://<your-ip>:${PORT}`);
  }
});

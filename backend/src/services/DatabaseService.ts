import { Pool, PoolClient } from 'pg';

export class DatabaseService {
  private static pool: Pool | null = null;

  static async initialize(): Promise<void> {
    if (this.pool) {
      return; // Already initialized
    }

    try {
      // Get DATABASE_URL at runtime after dotenv has loaded
      const DATABASE_URL = process.env.DATABASE_URL;
      console.log('🔍 DATABASE_URL loaded:', DATABASE_URL ? 'Yes' : 'No');
      
      // Parse connection string or use explicit config
      const config: any = {
        // Constitution: Connection management
        max: 20, // Maximum connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 2000, // Return error after 2s if can't connect
        // SSL for production
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      };

      // Use explicit config to avoid string parsing issues
      if (DATABASE_URL) {
        try {
          const url = new URL(DATABASE_URL);
          config.host = url.hostname;
          config.port = parseInt(url.port) || 5432;
          config.database = url.pathname.slice(1); // Remove leading /
          config.user = url.username;
          config.password = String(url.password); // Ensure password is a string
          console.log('🔍 DB Config:', {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            passwordLength: config.password?.length
          });
        } catch (e) {
          console.error('❌ URL parsing failed:', e);
          // Fallback to connection string if URL parsing fails
          config.connectionString = DATABASE_URL;
        }
      }

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  static async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool!.connect();
  }

  static async query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(text, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async execute(text: string, params: any[] = []): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query(text, params);
    } finally {
      client.release();
    }
  }

  static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // Health check method
  static async healthCheck(): Promise<{ status: string; connected: boolean; timestamp: string }> {
    try {
      const result = await this.queryOne<{ connected: boolean }>('SELECT true as connected');
      return {
        status: 'ok',
        connected: result?.connected || false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

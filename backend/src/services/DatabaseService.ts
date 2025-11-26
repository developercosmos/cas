import { Pool, PoolClient } from 'pg';

// Database configuration following constitution
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/dashboard_db';

export class DatabaseService {
  private static pool: Pool | null = null;

  static async initialize(): Promise<void> {
    if (this.pool) {
      return; // Already initialized
    }

    try {
      this.pool = new Pool({
        connectionString: DATABASE_URL,
        // Constitution: Connection management
        max: 20, // Maximum connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 2000, // Return error after 2s if can't connect
        // SSL for production
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

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

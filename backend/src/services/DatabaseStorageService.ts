import { DatabaseService } from './DatabaseService.js';
import { UserStorage } from '../types/database';

export class DatabaseStorageService {
  static async getStorage(userId: string): Promise<Map<string, any>> {
    try {
      // Constitution: Database naming convention for user_storage table
      const storage = await DatabaseService.query<UserStorage>(
        `SELECT StorageKey, StorageValue 
         FROM storage.user_storage 
         WHERE UserId = $1 
         ORDER BY CreatedAt`,
        [userId]
      );

      return new Map(storage.map(item => [item.StorageKey, item.StorageValue]));
    } catch (error) {
      throw new Error(`Failed to get user storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async get(userId: string, key: string): Promise<any | null> {
    try {
      const item = await DatabaseService.queryOne<UserStorage>(
        `SELECT StorageValue 
         FROM storage.user_storage 
         WHERE UserId = $1 AND StorageKey = $2`,
        [userId, key]
      );

      return item?.StorageValue || null;
    } catch (error) {
      throw new Error(`Failed to get storage value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async set(userId: string, key: string, value: any): Promise<void> {
    try {
      // Try to update first, then insert if no rows affected
      const updateResult = await DatabaseService.queryOne<{ affected_rows: number }>(
        `UPDATE storage.user_storage 
         SET StorageValue = $1::jsonb, UpdatedAt = NOW()
         WHERE UserId = $2 AND StorageKey = $3
         RETURNING 1 as affected_rows`,
        [JSON.stringify(value), userId, key]
      );

      if (!updateResult) {
        // Insert if no row was updated
        await DatabaseService.execute(
          `INSERT INTO storage.user_storage (UserId, StorageKey, StorageValue, CreatedAt, UpdatedAt)
           VALUES ($1, $2, $3::jsonb, NOW(), NOW())`,
          [userId, key, JSON.stringify(value)]
        );
      }
    } catch (error) {
      throw new Error(`Failed to set storage value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async delete(userId: string, key: string): Promise<boolean> {
    try {
      const result = await DatabaseService.queryOne<{ deleted: boolean }>(
        `DELETE FROM storage.user_storage 
         WHERE UserId = $1 AND StorageKey = $2
         RETURNING TRUE as deleted`,
        [userId, key]
      );

      return result?.deleted || false;
    } catch (error) {
      throw new Error(`Failed to delete storage value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async clear(userId: string): Promise<void> {
    try {
      await DatabaseService.execute(
        'DELETE FROM storage.user_storage WHERE UserId = $1',
        [userId]
      );
    } catch (error) {
      throw new Error(`Failed to clear user storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAll(userId: string): Promise<Record<string, any>> {
    try {
      const items = await DatabaseService.query<UserStorage>(
        `SELECT StorageKey, StorageValue 
         FROM storage.user_storage 
         WHERE UserId = $1 
         ORDER BY CreatedAt`,
        [userId]
      );

      const result: Record<string, any> = {};
      items.forEach(item => {
        result[item.StorageKey] = item.StorageValue;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get all storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Constitution: Plugin-specific storage methods
  static async getPluginStorage(userId: string, pluginId: string): Promise<Map<string, any>> {
    try {
      const storage = await DatabaseService.query<UserStorage>(
        `SELECT StorageKey, StorageValue 
         FROM storage.user_storage 
         WHERE UserId = $1 AND PluginId = $2 
         ORDER BY CreatedAt`,
        [userId, pluginId]
      );

      return new Map(storage.map(item => [item.StorageKey, item.StorageValue]));
    } catch (error) {
      throw new Error(`Failed to get plugin storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async setPluginStorage(userId: string, pluginId: string, key: string, value: any): Promise<void> {
    try {
      await DatabaseService.execute(
        `INSERT INTO storage.user_storage (UserId, PluginId, StorageKey, StorageValue, CreatedAt, UpdatedAt)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (UserId, PluginId, StorageKey) 
         DO UPDATE SET StorageValue = $4, UpdatedAt = NOW()`,
        [userId, pluginId, key, value]
      );
    } catch (error) {
      throw new Error(`Failed to set plugin storage value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async clearPluginStorage(userId: string, pluginId: string): Promise<void> {
    try {
      await DatabaseService.execute(
        'DELETE FROM storage.user_storage WHERE UserId = $1 AND PluginId = $2',
        [userId, pluginId]
      );
    } catch (error) {
      throw new Error(`Failed to clear plugin storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

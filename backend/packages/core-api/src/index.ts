/**
 * @cas/core-api
 * Core API package for CAS plugin development
 * 
 * This package provides the essential interfaces and types that all plugins
 * must use to interact with the CAS core system.
 */

// Export all plugin types
export * from './types/plugin.js';

// Re-export commonly used types for convenience
export type {
  Plugin,
  PluginMetadata,
  PluginContext,
  PluginConfig,
  PluginConfigSchema,
  PluginStorage,
  CoreServices,
  DatabaseService,
  DatabaseClient,
  AuthService,
  EventService,
  StorageService,
  CacheService,
  NotificationService,
  MigrationService,
  Migration,
  MigrationResult,
  MigrationStatus,
  User,
  UserRole,
  Logger,
  EventHandler,
  EventEmitter,
  FileMetadata,
  StorageItem,
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationOptions,
  ConfigField,
  ValidationRule,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './types/plugin.js';

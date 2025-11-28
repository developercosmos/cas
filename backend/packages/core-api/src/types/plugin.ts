/**
 * Core plugin type definitions for CAS plugin development
 * Provides standardized interfaces that all plugins must implement
 */

export interface Plugin {
  /** Unique identifier for the plugin (kebab-case) */
  id: string;

  /** Human-readable display name */
  name: string;

  /** Semantic version (MAJOR.MINOR.PATCH) */
  version: string;

  /** Plugin metadata and configuration */
  metadata: PluginMetadata;

  /** Initialize plugin with core services and context */
  initialize(context: PluginContext): Promise<void>;

  /** Called when plugin is activated/enabled */
  activate(): Promise<void>;

  /** Called when plugin is deactivated/disabled */
  deactivate(): Promise<void>;

  /** Called when plugin is uninstalled - cleanup resources */
  uninstall(): Promise<void>;
}

export interface PluginMetadata {
  /** Brief description of plugin purpose (max 200 chars) */
  description?: string;

  /** Plugin author/maintainer */
  author?: string;

  /** Homepage or documentation URL */
  homepage?: string;

  /** Repository URL */
  repository?: string;

  /** License type */
  license?: string;

  /** Keywords for categorization */
  keywords?: string[];

  /** Required permissions */
  permissions: string[];

  /** Plugin dependencies */
  dependencies?: Record<string, string>;

  /** Minimum CAS version required */
  casVersion?: string;

  /** Plugin category */
  category?: 'authentication' | 'storage' | 'ai' | 'ui' | 'integration' | 'utility';

  /** Whether this is a core system plugin */
  isSystem?: boolean;

  /** Plugin configuration schema */
  configSchema?: PluginConfigSchema;

  /** Supported database providers */
  databaseProviders?: ('postgresql' | 'mysql' | 'sqlite')[];

  /** Required node version */
  nodeVersion?: string;
}

export interface PluginContext {
  /** Current authenticated user */
  user: User;

  /** Plugin ID */
  pluginId: string;

  /** Core services access */
  services: CoreServices;

  /** Plugin configuration */
  config: PluginConfig;

  /** Event emitter for inter-plugin communication */
  events: EventEmitter;

  /** Logger instance */
  logger: Logger;

  /** Plugin-specific storage */
  storage: PluginStorage;
}

export interface CoreServices {
  /** Database service for data operations */
  database: DatabaseService;

  /** Authentication and authorization service */
  auth: AuthService;

  /** Event service for system-wide communication */
  events: EventService;

  /** Storage service for file operations */
  storage: StorageService;

  /** Cache service for performance optimization */
  cache?: CacheService;

  /** Notification service for user alerts */
  notifications?: NotificationService;
}

export interface DatabaseService {
  /** Execute parameterized query */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /** Execute single row query */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /** Execute query and return affected rows count */
  execute(sql: string, params?: any[]): Promise<number>;

  /** Execute transaction */
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;

  /** Migration management */
  migrations: MigrationService;

  /** Schema validation */
  validateSchema(tableName: string, data: any): Promise<boolean>;
}

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<number>;
}

export interface MigrationService {
  /** Run pending migrations */
  runPending(): Promise<MigrationResult[]>;

  /** Run specific migration */
  run(migrationName: string): Promise<MigrationResult>;

  /** Check migration status */
  getStatus(): Promise<MigrationStatus[]>;

  /** Create new migration */
  create(name: string, content: string): Promise<Migration>;
}

export interface Migration {
  name: string;
  version: string;
  content: string;
  checksum: string;
  createdAt: Date;
}

export interface MigrationResult {
  migration: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface MigrationStatus {
  name: string;
  applied: boolean;
  appliedAt?: Date;
  checksum: string;
}

export interface AuthService {
  /** Authenticate user with JWT token */
  authenticate(token: string): Promise<User | null>;

  /** Check if user has specific permission */
  authorize(user: User, permission: string): Promise<boolean>;

  /** Check multiple permissions */
  authorizeAny(user: User, permissions: string[]): Promise<boolean>;

  /** Get current user from request */
  getCurrentUser(req: any): Promise<User | null>;

  /** Generate JWT token for user */
  generateToken(user: User): Promise<string>;

  /** Refresh token */
  refreshToken(refreshToken: string): Promise<string>;

  /** Password hashing */
  hashPassword(password: string): Promise<string>;

  /** Password verification */
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface EventService {
  /** Emit event to all listeners */
  emit(event: string, data: any): void;

  /** Listen to specific event */
  on(event: string, handler: EventHandler): void;

  /** Listen to event once */
  once(event: string, handler: EventHandler): void;

  /** Remove event listener */
  off(event: string, handler: EventHandler): void;

  /** Remove all listeners for event */
  removeAllListeners(event?: string): void;

  /** Get listener count for event */
  listenerCount(event: string): number;
}

export type EventHandler = (data: any) => void | Promise<void>;

export interface EventEmitter {
  emit(event: string, data: any): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}

export interface StorageService {
  /** Store file data */
  store(key: string, data: Buffer | string, metadata?: FileMetadata): Promise<string>;

  /** Retrieve file data */
  retrieve(key: string): Promise<Buffer>;

  /** Get file metadata */
  getMetadata(key: string): Promise<FileMetadata>;

  /** Delete file */
  delete(key: string): Promise<void>;

  /** Check if file exists */
  exists(key: string): Promise<boolean>;

  /** List files with prefix */
  list(prefix?: string): Promise<StorageItem[]>;

  /** Get file URL for direct access */
  getUrl(key: string, expiresIn?: number): Promise<string>;
}

export interface FileMetadata {
  contentType: string;
  size: number;
  filename?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
  metadata?: Record<string, any>;
}

export interface StorageItem {
  key: string;
  size: number;
  lastModified: Date;
  metadata?: FileMetadata;
}

export interface CacheService {
  /** Get cached value */
  get<T>(key: string): Promise<T | null>;

  /** Set value with TTL */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /** Delete cached value */
  delete(key: string): Promise<void>;

  /** Clear all cache */
  clear(): Promise<void>;

  /** Check if key exists */
  exists(key: string): Promise<boolean>;

  /** Increment counter */
  increment(key: string, amount?: number): Promise<number>;

  /** Decrement counter */
  decrement(key: string, amount?: number): Promise<number>;
}

export interface NotificationService {
  /** Send notification to user */
  sendToUser(userId: string, notification: Notification): Promise<void>;

  /** Send notification to multiple users */
  sendToUsers(userIds: string[], notification: Notification): Promise<void>;

  /** Send notification to role */
  sendToRole(role: UserRole, notification: Notification): Promise<void>;

  /** Send system-wide notification */
  sendBroadcast(notification: Notification): Promise<void>;

  /** Get user notifications */
  getUserNotifications(userId: string, options?: NotificationOptions): Promise<Notification[]>;

  /** Mark notification as read */
  markAsRead(notificationId: string, userId: string): Promise<void>;

  /** Delete notification */
  delete(notificationId: string, userId: string): Promise<void>;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  createdAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationOptions {
  unread?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface PluginConfig {
  /** Get configuration value */
  get<T>(key: string, defaultValue?: T): T;

  /** Set configuration value */
  set(key: string, value: any): Promise<void>;

  /** Get all configuration */
  getAll(): Record<string, any>;

  /** Validate configuration against schema */
  validate(): Promise<ValidationResult>;

  /** Reset configuration to defaults */
  reset(): Promise<void>;
}

export interface PluginConfigSchema {
  [key: string]: ConfigField;
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: ValidationRule[];
  sensitive?: boolean;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean | string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
}

export interface PluginStorage {
  /** Get value from plugin storage */
  get<T>(key: string): Promise<T | null>;

  /** Set value in plugin storage */
  set<T>(key: string, value: T): Promise<void>;

  /** Delete value from plugin storage */
  delete(key: string): Promise<void>;

  /** Clear all plugin storage */
  clear(): Promise<void>;

  /** Get all keys */
  keys(): Promise<string[]>;

  /** Check if key exists */
  has(key: string): Promise<boolean>;
}

export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  child(context: any): Logger;
}
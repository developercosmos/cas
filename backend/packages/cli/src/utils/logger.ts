import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private context: string;
  private static globalLogLevel: LogLevel = 'info';

  constructor(context: string = 'CAS') {
    this.context = context;
  }

  static setLogLevel(level: LogLevel): void {
    Logger.globalLogLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(Logger.globalLogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelEmoji = this.getLevelEmoji(level);
    return `${chalk.gray(timestamp)} ${levelEmoji} ${chalk.cyan(`[${this.context}]`)} ${message}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '🐛';
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '';
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow(this.formatMessage('warn', message)), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(this.formatMessage('error', message)), ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const successMessage = this.formatMessage('info', message).replace('ℹ️', '✅');
      console.info(chalk.green(successMessage), ...args);
    }
  }

  group(label: string): void {
    console.group(chalk.cyan(`📁 ${this.context}: ${label}`));
  }

  groupEnd(): void {
    console.groupEnd();
  }

  table(data: any): void {
    if (this.shouldLog('info')) {
      console.table(data);
    }
  }

  clear(): void {
    console.clear();
  }

  // Progress indicators
  startSpinner(message: string): () => void {
    if (this.shouldLog('info')) {
      const { default: ora } = require('ora');
      const spinner = ora(`${this.context}: ${message}`).start();
      return () => spinner.stop();
    }
    return () => {};
  }

  showProgress(current: number, total: number, message: string = ''): void {
    if (this.shouldLog('info')) {
      const percentage = Math.round((current / total) * 100);
      const bar = this.createProgressBar(percentage, 20);
      console.info(`\r${bar} ${percentage}% ${message}`);
    }
  }

  private createProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    return chalk.green(`[${filledBar}${emptyBar}]`);
  }

  // Utility methods
  logCommand(command: string, args: string[] = []): void {
    this.debug(`Executing: ${command} ${args.join(' ')}`);
  }

  logFileOperation(operation: string, filePath: string): void {
    this.debug(`${operation}: ${filePath}`);
  }

  logTime<T>(label: string, fn: () => T): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.debug(`${label} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${label} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  async logTimeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.debug(`${label} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${label} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  // Formatting helpers
  formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  formatTimestamp(date: Date = new Date()): string {
    return date.toISOString();
  }
}
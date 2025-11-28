import { Logger } from './logger.js';
import { spawn } from 'child_process';

export class PackageManager {
  private logger: Logger;
  private packageManager: 'npm' | 'yarn' | 'pnpm';

  constructor(private rootPath: string) {
    this.logger = new Logger('PackageManager');
    this.packageManager = this.detectPackageManager();
  }

  private detectPackageManager(): 'npm' | 'yarn' | 'pnpm' {
    // TODO: Implement package manager detection
    return 'npm';
  }

  async install(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.packageManager, ['install'], {
        cwd: this.rootPath,
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success('Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`${this.packageManager} install failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run ${this.packageManager}: ${error.message}`));
      });
    });
  }
}
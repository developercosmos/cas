import { Logger } from './logger.js';
import { spawn } from 'child_process';

export class GitManager {
  private logger: Logger;

  constructor(private rootPath: string) {
    this.logger = new Logger('GitManager');
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', ['init'], {
        cwd: this.rootPath,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success('Git repository initialized');
          resolve();
        } else {
          reject(new Error(`git init failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to initialize git: ${error.message}`));
      });
    });
  }

  async addRemote(name: string, url: string): Promise<void> {
    if (!url) return; // Skip if no repository URL provided

    return new Promise((resolve, reject) => {
      const child = spawn('git', ['remote', 'add', name, url], {
        cwd: this.rootPath,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success(`Remote ${name} added`);
          resolve();
        } else {
          reject(new Error(`git remote add failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to add remote: ${error.message}`));
      });
    });
  }

  async add(files: string = '.'): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', ['add', files], {
        cwd: this.rootPath,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success('Files added to git');
          resolve();
        } else {
          reject(new Error(`git add failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to add files to git: ${error.message}`));
      });
    });
  }

  async commit(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('git', ['commit', '-m', message], {
        cwd: this.rootPath,
        stdio: 'pipe'
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.success('Initial commit created');
          resolve();
        } else {
          reject(new Error(`git commit failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to create commit: ${error.message}`));
      });
    });
  }
}
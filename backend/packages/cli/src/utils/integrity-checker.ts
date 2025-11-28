import crypto from 'crypto';
import { Logger } from './logger.js';

export class IntegrityChecker {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('IntegrityChecker');
  }

  async generateChecksum(filePath: string): Promise<string> {
    try {
      const fileContent = await import('fs').then(fs => fs.readFileSync(filePath));
      const hash = crypto.createHash('sha256');
      hash.update(fileContent);
      return hash.digest('hex');
    } catch (error) {
      this.logger.error(`Failed to generate checksum for ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
    try {
      const actualChecksum = await this.generateChecksum(filePath);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      this.logger.error(`Failed to verify checksum for ${filePath}: ${error.message}`);
      return false;
    }
  }
}
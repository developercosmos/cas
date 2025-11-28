import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { TestConfig, PluginContext } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export interface TestResult {
  success: boolean;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numPassedSnapshots: number;
  numFailedSnapshots: number;
  coverageMap?: any;
  testResults?: any[];
  perfStats?: any;
  warnings: string[];
}

export class TestRunner {
  private logger: Logger;

  constructor(private config: PluginContext) {
    this.logger = new Logger('TestRunner');
  }

  async run(testConfig: TestConfig): Promise<TestResult> {
    try {
      this.logger.info(`Running tests with ${testConfig.framework}...`);

      const result: TestResult = {
        success: false,
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        numPendingTests: 0,
        numPassedSnapshots: 0,
        numFailedSnapshots: 0,
        warnings: []
      };

      switch (testConfig.framework) {
        case 'jest':
          return await this.runJest(testConfig);
        case 'vitest':
          return await this.runVitest(testConfig);
        case 'mocha':
          return await this.runMocha(testConfig);
        default:
          throw new Error(`Unsupported test framework: ${testConfig.framework}`);
      }

    } catch (error) {
      this.logger.error(`Test execution failed: ${error.message}`);
      return {
        success: false,
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        numPendingTests: 0,
        numPassedSnapshots: 0,
        numFailedSnapshots: 0,
        warnings: [error.message]
      };
    }
  }

  private async runJest(testConfig: TestConfig): Promise<TestResult> {
    return new Promise((resolve) => {
      const args = [
        '--config', path.join(this.config.rootPath, 'jest.config.js'),
        '--passWithNoTests'
      ];

      if (testConfig.coverage) {
        args.push('--coverage');
      }

      if (testConfig.watch) {
        args.push('--watch');
      }

      if (testConfig.testNamePattern) {
        args.push('--testNamePattern', testConfig.testNamePattern);
      }

      if (testConfig.testPathPattern) {
        args.push('--testPathPattern', testConfig.testPathPattern);
      }

      if (testConfig.verbose) {
        args.push('--verbose');
      }

      if (testConfig.ci) {
        args.push('--ci');
        args.push('--runInBand');
      }

      // Add JSON output for parsing results
      args.push('--json', '--outputFile', path.join(this.config.rootPath, 'test-results.json'));

      const jestProcess = spawn('npx', ['jest', ...args], {
        cwd: this.config.rootPath,
        stdio: 'inherit'
      });

      jestProcess.on('close', async (code) => {
        try {
          // Parse test results
          const resultsPath = path.join(this.config.rootPath, 'test-results.json');
          if (await fs.pathExists(resultsPath)) {
            const results = await fs.readJson(resultsPath);
            await fs.remove(resultsPath); // Clean up

            resolve({
              success: code === 0 && results.numFailedTests === 0,
              numTotalTests: results.numTotalTests,
              numPassedTests: results.numPassedTests,
              numFailedTests: results.numFailedTests,
              numPendingTests: results.numPendingTests,
              numPassedSnapshots: results.snapshot?.passed || 0,
              numFailedSnapshots: results.snapshot?.failed || 0,
              coverageMap: results.coverageMap,
              testResults: results.testResults,
              perfStats: results.perfStats,
              warnings: []
            });
          } else {
            resolve({
              success: code === 0,
              numTotalTests: 0,
              numPassedTests: 0,
              numFailedTests: 0,
              numPendingTests: 0,
              numPassedSnapshots: 0,
              numFailedSnapshots: 0,
              warnings: []
            });
          }
        } catch (error) {
          resolve({
            success: false,
            numTotalTests: 0,
            numPassedTests: 0,
            numFailedTests: 0,
            numPendingTests: 0,
            numPassedSnapshots: 0,
            numFailedSnapshots: 0,
            warnings: [`Failed to parse test results: ${error.message}`]
          });
        }
      });

      jestProcess.on('error', (error) => {
        this.logger.error(`Jest process error: ${error.message}`);
        resolve({
          success: false,
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 0,
          numPendingTests: 0,
          numPassedSnapshots: 0,
          numFailedSnapshots: 0,
          warnings: [error.message]
        });
      });
    });
  }

  private async runVitest(testConfig: TestConfig): Promise<TestResult> {
    return new Promise((resolve) => {
      const args = [];

      if (testConfig.coverage) {
        args.push('--coverage');
      }

      if (testConfig.watch) {
        args.push('--watch');
      }

      if (testConfig.testNamePattern) {
        args.push('--testNamePattern', testConfig.testNamePattern);
      }

      if (testConfig.testPathPattern) {
        args.push('--testPathPattern', testConfig.testPathPattern);
      }

      if (testConfig.verbose) {
        args.push('--verbose');
      }

      if (testConfig.ci) {
        args.push('--run');
        args.push('--reporter=verbose');
      }

      // Add JSON output for parsing results
      args.push('--reporter=json');
      args.push('--outputFile', path.join(this.config.rootPath, 'test-results.json'));

      const vitestProcess = spawn('npx', ['vitest', ...args], {
        cwd: this.config.rootPath,
        stdio: 'inherit'
      });

      vitestProcess.on('close', async (code) => {
        try {
          // Parse test results
          const resultsPath = path.join(this.config.rootPath, 'test-results.json');
          if (await fs.pathExists(resultsPath)) {
            const results = await fs.readJson(resultsPath);
            await fs.remove(resultsPath); // Clean up

            resolve({
              success: code === 0 && results.numFailedTests === 0,
              numTotalTests: results.numTotalTests,
              numPassedTests: results.numPassedTests,
              numFailedTests: results.numFailedTests,
              numPendingTests: results.numPendingTests,
              numPassedSnapshots: results.numPassedSnapshots || 0,
              numFailedSnapshots: results.numFailedSnapshots || 0,
              coverageMap: results.coverageMap,
              testResults: results.testResults,
              perfStats: results.perfStats,
              warnings: []
            });
          } else {
            resolve({
              success: code === 0,
              numTotalTests: 0,
              numPassedTests: 0,
              numFailedTests: 0,
              numPendingTests: 0,
              numPassedSnapshots: 0,
              numFailedSnapshots: 0,
              warnings: []
            });
          }
        } catch (error) {
          resolve({
            success: false,
            numTotalTests: 0,
            numPassedTests: 0,
            numFailedTests: 0,
            numPendingTests: 0,
            numPassedSnapshots: 0,
            numFailedSnapshots: 0,
            warnings: [`Failed to parse test results: ${error.message}`]
          });
        }
      });

      vitestProcess.on('error', (error) => {
        this.logger.error(`Vitest process error: ${error.message}`);
        resolve({
          success: false,
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 0,
          numPendingTests: 0,
          numPassedSnapshots: 0,
          numFailedSnapshots: 0,
          warnings: [error.message]
        });
      });
    });
  }

  private async runMocha(testConfig: TestConfig): Promise<TestResult> {
    return new Promise((resolve) => {
      const args = [];

      if (testConfig.coverage) {
        args.push('--require', '@babel/register');
        args.push('--require', 'nyc');
      }

      if (testConfig.testPathPattern) {
        args.push(testConfig.testPathPattern);
      }

      if (testConfig.verbose) {
        args.push('--reporter', 'spec');
      } else {
        args.push('--reporter', 'dot');
      }

      const mochaProcess = spawn('npx', ['mocha', ...args], {
        cwd: this.config.rootPath,
        stdio: 'inherit'
      });

      mochaProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          numTotalTests: 0, // Mocha doesn't provide this easily
          numPassedTests: 0,
          numFailedTests: code === 0 ? 0 : 1,
          numPendingTests: 0,
          numPassedSnapshots: 0,
          numFailedSnapshots: 0,
          warnings: []
        });
      });

      mochaProcess.on('error', (error) => {
        this.logger.error(`Mocha process error: ${error.message}`);
        resolve({
          success: false,
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 0,
          numPendingTests: 0,
          numPassedSnapshots: 0,
          numFailedSnapshots: 0,
          warnings: [error.message]
        });
      });
    });
  }
}
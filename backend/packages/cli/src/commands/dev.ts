import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { ConfigLoader } from '../utils/config-loader.js';

export const devCommand = new Command('dev')
  .description('Start development environment (build + serve in watch mode)')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('--build-only', 'Only build in watch mode, don\'t start server', false)
  .option('--serve-only', 'Only start server, don\'t build', false)
  .option('--parallel', 'Run build and serve in parallel', true)
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('🛠️  Starting CAS Plugin Development Environment...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      if (options.serveOnly) {
        // Only start the dev server
        console.log(chalk.yellow('🔄 Starting development server only...'));
        const serveProcess = spawn('cas-cli', [
          'serve',
          '--port', options.port,
          '--host', options.host,
          '--hot',
          '--open'
        ], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        // Handle process signals
        process.on('SIGINT', () => {
          serveProcess.kill('SIGINT');
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          serveProcess.kill('SIGTERM');
          process.exit(0);
        });

        return;
      }

      if (options.buildOnly) {
        // Only build in watch mode
        console.log(chalk.yellow('🔄 Starting build in watch mode...'));
        const buildProcess = spawn('cas-cli', [
          'build',
          '--watch',
          '--mode', 'development',
          '--sourcemap'
        ], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        // Handle process signals
        process.on('SIGINT', () => {
          buildProcess.kill('SIGINT');
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          buildProcess.kill('SIGTERM');
          process.exit(0);
        });

        return;
      }

      // Run both build and serve
      if (options.parallel) {
        console.log(chalk.yellow('🔄 Starting build and server in parallel...'));

        // Start build in watch mode
        const buildProcess = spawn('cas-cli', [
          'build',
          '--watch',
          '--mode', 'development',
          '--sourcemap',
          '--reporter', 'console'
        ], {
          stdio: ['pipe', 'pipe', process.stderr],
          cwd: process.cwd()
        });

        let buildReady = false;

        buildProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(output.trim());

          // Check if initial build is complete
          if (output.includes('Build completed') || output.includes('Build successful')) {
            buildReady = true;
          }
        });

        // Wait a bit for initial build, then start server
        setTimeout(() => {
          console.log(chalk.cyan('🌐 Starting development server...'));

          const serveProcess = spawn('cas-cli', [
            'serve',
            '--port', options.port,
            '--host', options.host,
            '--hot',
            '--open'
          ], {
            stdio: 'inherit',
            cwd: process.cwd()
          });

          // Handle process signals for both processes
          const cleanup = () => {
            buildProcess.kill('SIGTERM');
            serveProcess.kill('SIGTERM');
            process.exit(0);
          };

          process.on('SIGINT', cleanup);
          process.on('SIGTERM', cleanup);

          serveProcess.on('close', (code) => {
            if (code !== 0) {
              console.error(chalk.red(`❌ Development server exited with code ${code}`));
            }
            cleanup();
          });

        }, 2000); // Give build process 2 seconds head start

        buildProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(chalk.red(`❌ Build process exited with code ${code}`));
            process.exit(code);
          }
        });

      } else {
        // Run sequentially
        console.log(chalk.yellow('🔄 Starting build process...'));

        const buildProcess = spawn('cas-cli', [
          'build',
          '--mode', 'development',
          '--sourcemap'
        ], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        buildProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(chalk.red(`❌ Build failed with code ${code}`));
            process.exit(code);
          }

          console.log(chalk.green('✅ Build completed successfully!'));
          console.log(chalk.yellow('🌐 Starting development server...'));

          const serveProcess = spawn('cas-cli', [
            'serve',
            '--port', options.port,
            '--host', options.host,
            '--hot',
            '--open'
          ], {
            stdio: 'inherit',
            cwd: process.cwd()
          });

          serveProcess.on('close', (serveCode) => {
            if (serveCode !== 0) {
              console.error(chalk.red(`❌ Development server exited with code ${serveCode}`));
            }
            process.exit(serveCode);
          });

          // Handle process signals
          process.on('SIGINT', () => {
            serveProcess.kill('SIGINT');
            process.exit(0);
          });

          process.on('SIGTERM', () => {
            serveProcess.kill('SIGTERM');
            process.exit(0);
          });
        });
      }

      console.log(chalk.green('\n🎯 Development environment started!'));
      console.log(chalk.gray('   Use Ctrl+C to stop all processes\n'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to start development environment:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });
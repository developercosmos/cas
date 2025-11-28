import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DevServer } from '../core/dev-server.js';
import { ConfigLoader } from '../utils/config-loader.js';

export const serveCommand = new Command('serve')
  .description('Start development server for CAS plugin')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('--https', 'Enable HTTPS', false)
  .option('--open', 'Open browser automatically', true)
  .option('--hot', 'Enable hot module replacement', true)
  .option('--cors', 'Enable CORS', true)
  .option('--proxy <target>', 'Proxy API requests to target')
  .action(async (options) => {
    try {
      console.log(chalk.blueBright('🚀 Starting CAS Plugin Development Server...'));

      const configLoader = new ConfigLoader();
      const config = await configLoader.load(process.cwd());

      const spinner = ora('Initializing development server...').start();

      // Override config with command line options
      const serveConfig = {
        ...config.serve,
        port: parseInt(options.port),
        host: options.host,
        https: options.https,
        open: options.open,
        hot: options.hot,
        cors: options.cors,
        proxy: options.proxy ? [{
          context: ['/api'],
          target: options.proxy,
          changeOrigin: true,
          secure: false
        }] : config.serve?.proxy
      };

      const devServer = new DevServer(config, serveConfig);

      spinner.succeed('Development server initialized');

      console.log(chalk.green('\n🌟 Development server ready!'));
      console.log(chalk.cyan(`   Local:   ${options.https ? 'https' : 'http'}://${options.host}:${options.port}`));

      if (options.host !== 'localhost' && options.host !== '127.0.0.1') {
        console.log(chalk.cyan(`   Network: ${options.https ? 'https' : 'http'}://0.0.0.0:${options.port}`));
      }

      console.log(chalk.gray('\n   Press Ctrl+C to stop\n'));

      // Start the server
      await devServer.start();

    } catch (error) {
      console.error(chalk.red('❌ Failed to start development server:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });
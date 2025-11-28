import { createServer } from 'vite';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';
import { PluginContext } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export interface DevServerConfig {
  port: number;
  host: string;
  https: boolean;
  open: boolean;
  hot: boolean;
  cors: boolean;
  proxy?: Array<{
    context: string[];
    target: string;
    changeOrigin: boolean;
    secure: boolean;
  }>;
}

export class DevServer {
  private logger: Logger;
  private server: any;
  private watcher: any;

  constructor(
    private config: PluginContext,
    private serverConfig: DevServerConfig
  ) {
    this.logger = new Logger('DevServer');
  }

  async start(): Promise<void> {
    try {
      // Create Vite configuration based on plugin type
      const viteConfig = this.createViteConfig();

      // Start the Vite dev server
      this.server = await createServer(viteConfig);
      await this.server.listen(this.serverConfig.port, this.serverConfig.host);

      // Open browser if requested
      if (this.serverConfig.open) {
        this.openBrowser();
      }

      // Set up file watching for hot reload
      if (this.serverConfig.hot) {
        this.setupHotReload();
      }

    } catch (error) {
      this.logger.error(`Failed to start dev server: ${error.message}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }
    if (this.watcher) {
      await this.watcher.close();
    }
  }

  private createViteConfig() {
    const isProduction = false;
    const root = this.config.rootPath;

    const baseConfig: any = {
      root,
      mode: 'development',
      server: {
        port: this.serverConfig.port,
        host: this.serverConfig.host,
        https: this.serverConfig.https,
        cors: this.serverConfig.cors,
        proxy: this.serverConfig.proxy?.reduce((acc, proxy) => {
          proxy.context.forEach(context => {
            acc[context] = {
              target: proxy.target,
              changeOrigin: proxy.changeOrigin,
              secure: proxy.secure
            };
          });
          return acc;
        }, {})
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
        minify: false,
        target: 'esnext'
      },
      optimizeDeps: {
        include: this.getOptimizeDeps()
      }
    };

    // Configure based on plugin type
    switch (this.config.pluginType) {
      case 'ui':
        return this.configureUIPlugin(baseConfig);
      case 'api':
        return this.configureAPIPlugin(baseConfig);
      case 'fullstack':
        return this.configureFullstackPlugin(baseConfig);
      case 'library':
        return this.configureLibraryPlugin(baseConfig);
      default:
        return baseConfig;
    }
  }

  private configureUIPlugin(baseConfig: any) {
    return {
      ...baseConfig,
      plugins: [
        // Add React plugin for UI components
        async () => {
          const { default: react } = await import('@vitejs/plugin-react');
          return react({
            jsxRuntime: 'automatic',
            fastRefresh: this.serverConfig.hot
          });
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(this.config.rootPath, 'src'),
          '@cas/ui-components': path.resolve(this.config.rootPath, '../../../packages/ui-components'),
          '@cas/types': path.resolve(this.config.rootPath, '../../../packages/types')
        }
      },
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true
          }
        }
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('development')
      }
    };
  }

  private configureAPIPlugin(baseConfig: any) {
    return {
      ...baseConfig,
      server: {
        ...baseConfig.server,
        // For API plugins, we might want to run a separate Node.js server
        middlewareMode: true
      },
      resolve: {
        alias: {
          '@': path.resolve(this.config.rootPath, 'src'),
          '@cas/core-api': path.resolve(this.config.rootPath, '../../../packages/core-api')
        }
      }
    };
  }

  private configureFullstackPlugin(baseConfig: any) {
    return {
      ...this.configureUIPlugin(baseConfig),
      server: {
        ...baseConfig.server,
        // Add additional proxy configuration for API routes
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
          },
          ...baseConfig.server.proxy
        }
      }
    };
  }

  private configureLibraryPlugin(baseConfig: any) {
    return {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        lib: {
          entry: path.resolve(this.config.rootPath, 'src/index.ts'),
          name: this.config.manifest.id,
          fileName: (format: string) => `${this.config.manifest.id}.${format}.js`
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      }
    };
  }

  private getOptimizeDeps(): string[] {
    const deps = ['react', 'react-dom'];

    if (this.config.pluginType === 'ui' || this.config.pluginType === 'fullstack') {
      deps.push('@cas/ui-components', '@cas/types');
    }

    if (this.config.pluginType === 'api' || this.config.pluginType === 'fullstack') {
      deps.push('@cas/core-api');
    }

    return deps;
  }

  private async openBrowser(): Promise<void> {
    const url = `http${this.serverConfig.https ? 's' : ''}://${this.serverConfig.host}:${this.serverConfig.port}`;

    try {
      const { default: open } = await import('open');
      await open(url);
      this.logger.info(`Opened browser at ${url}`);
    } catch (error) {
      this.logger.warn(`Could not open browser: ${error.message}`);
    }
  }

  private setupHotReload(): void {
    // Watch for file changes
    const watchPaths = [
      path.join(this.config.rootPath, 'src/**/*'),
      path.join(this.config.rootPath, 'public/**/*'),
      path.join(this.config.rootPath, 'assets/**/*')
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true
    });

    this.watcher.on('change', (filePath: string) => {
      this.logger.info(`File changed: ${filePath}`);
      // Vite handles hot reload automatically
    });

    this.watcher.on('add', (filePath: string) => {
      this.logger.info(`File added: ${filePath}`);
    });

    this.watcher.on('unlink', (filePath: string) => {
      this.logger.info(`File removed: ${filePath}`);
    });
  }
}
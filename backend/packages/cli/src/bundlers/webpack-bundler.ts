import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { BuildConfig, BuildResult, PluginContext } from '../types/index.js';
import { Logger } from '../utils/logger.js';

interface BundleResult extends BuildResult {
  stats: BuildResult['stats'] & {
    webpackStats?: any;
  };
}

export class WebpackBundler {
  private logger: Logger;

  constructor(private config: PluginContext) {
    this.logger = new Logger('WebpackBundler');
  }

  async bundle(buildConfig: BuildConfig, options: {
    mode?: 'development' | 'production';
  } = {}): Promise<BundleResult> {
    return new Promise((resolve) => {
      const webpackConfig = this.createWebpackConfig(buildConfig, options.mode || 'production');

      const compiler = webpack(webpackConfig);

      compiler.run((err, stats) => {
        const result: BundleResult = {
          success: false,
          errors: [],
          warnings: [],
          duration: 0,
          size: 0,
          stats: {
            chunks: 0,
            modules: 0,
            assets: 0,
            entrypoints: [],
            dependencies: []
          },
          webpackStats: stats
        };

        if (err) {
          result.errors.push(err.message);
          resolve(result);
          return;
        }

        if (stats?.hasErrors()) {
          const errorInfo = stats.toJson({ errors: true });
          result.errors.push(...(errorInfo.errors || []));
        }

        if (stats?.hasWarnings()) {
          const warningInfo = stats.toJson({ warnings: true });
          result.warnings.push(...(warningInfo.warnings || []));
        }

        if (stats && !stats.hasErrors()) {
          result.success = true;
          const statsInfo = stats.toJson({
            modules: true,
            chunks: true,
            assets: true,
            entrypoints: true
          });

          result.stats.chunks = statsInfo.chunks?.length || 0;
          result.stats.modules = statsInfo.modules?.length || 0;
          result.stats.assets = statsInfo.assets?.length || 0;
          result.stats.entrypoints = Object.keys(statsInfo.entrypoints || {});
          result.stats.dependencies = statsInfo.modules
            ?.filter((mod: any) => mod.name.startsWith('node_modules'))
            ?.map((mod: any) => mod.name) || [];
        }

        resolve(result);
      });
    });
  }

  async watch(buildConfig: BuildConfig, callback: (result: BundleResult) => void): Promise<webpack.Compiler> {
    const webpackConfig = this.createWebpackConfig(buildConfig, 'development');
    webpackConfig.watch = true;
    webpackConfig.watchOptions = {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: false
    };

    const compiler = webpack(webpackConfig);

    compiler.hooks.watchRun.tap('WebpackBundler', () => {
      this.logger.info('Webpack watching for changes...');
    });

    compiler.hooks.done.tap('WebpackBundler', (stats) => {
      const result: BundleResult = {
        success: !stats.hasErrors(),
        errors: stats.hasErrors() ? stats.toJson().errors || [] : [],
        warnings: stats.hasWarnings() ? stats.toJson().warnings || [] : [],
        duration: 0,
        size: 0,
        stats: {
          chunks: 0,
          modules: 0,
          assets: 0,
          entrypoints: [],
          dependencies: []
        },
        webpackStats: stats
      };

      if (result.success) {
        const statsInfo = stats.toJson({
          modules: true,
          chunks: true,
          assets: true,
          entrypoints: true
        });

        result.stats.chunks = statsInfo.chunks?.length || 0;
        result.stats.modules = statsInfo.modules?.length || 0;
        result.stats.assets = statsInfo.assets?.length || 0;
        result.stats.entrypoints = Object.keys(statsInfo.entrypoints || {});
        result.stats.dependencies = statsInfo.modules
          ?.filter((mod: any) => mod.name.startsWith('node_modules'))
          ?.map((mod: any) => mod.name) || [];
      }

      callback(result);
    });

    return compiler;
  }

  private createWebpackConfig(buildConfig: BuildConfig, mode: 'development' | 'production') {
    const isDevelopment = mode === 'development';
    const isProduction = mode === 'production';

    const baseConfig: webpack.Configuration = {
      mode,
      target: 'web',
      devtool: isDevelopment ? 'eval-source-map' : (buildConfig.output.sourcemap ? 'source-map' : false),
      entry: this.getEntryPoints(),
      output: {
        path: `${this.config.rootPath}/${buildConfig.output.outDir || 'dist'}`,
        filename: isDevelopment ? '[name].js' : '[name].[contenthash:8].js',
        chunkFilename: isDevelopment ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js',
        clean: buildConfig.output.clean,
        publicPath: '/',
        library: {
          type: buildConfig.output.format === 'umd' ? 'umd' : 'module'
        }
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        alias: {
          '@': `${this.config.rootPath}/src`,
          '@cas/ui-components': `${this.config.rootPath}/../../../packages/ui-components`,
          '@cas/types': `${this.config.rootPath}/../../../packages/types`,
          '@cas/core-api': `${this.config.rootPath}/../../../packages/core-api`
        }
      },
      module: {
        rules: this.getModuleRules(buildConfig)
      },
      plugins: this.getPlugins(buildConfig, mode),
      optimization: this.getOptimization(buildConfig, mode),
      externals: this.getExternals(buildConfig)
    };

    // Configure based on plugin type
    switch (this.config.pluginType) {
      case 'ui':
        return this.configureUIPlugin(baseConfig, buildConfig, mode);
      case 'api':
        return this.configureAPIPlugin(baseConfig, buildConfig, mode);
      case 'fullstack':
        return this.configureFullstackPlugin(baseConfig, buildConfig, mode);
      case 'library':
        return this.configureLibraryPlugin(baseConfig, buildConfig, mode);
      default:
        return baseConfig;
    }
  }

  private getEntryPoints(): webpack.Entry {
    switch (this.config.pluginType) {
      case 'ui':
        return {
          main: `${this.config.rootPath}/src/index.tsx`
        };
      case 'api':
        return {
          server: `${this.config.rootPath}/src/index.ts`
        };
      case 'fullstack':
        return {
          client: `${this.config.rootPath}/src/client/index.tsx`,
          server: `${this.config.rootPath}/src/server/index.ts`
        };
      case 'library':
        return {
          index: `${this.config.rootPath}/src/index.ts`
        };
      default:
        return {
          main: `${this.config.rootPath}/src/index.ts`
        };
    }
  }

  private getModuleRules(buildConfig: BuildConfig) {
    const rules: webpack.RuleSetRule[] = [];

    // TypeScript/JavaScript
    rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          configFile: `${this.config.rootPath}/tsconfig.json`
        }
      }
    });

    // CSS (for UI and fullstack plugins)
    if (this.config.pluginType === 'ui' || this.config.pluginType === 'fullstack') {
      rules.push({
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      });

      // Less support
      if (buildConfig.css?.preprocessors?.includes('less')) {
        rules.push({
          test: /\.less$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true
                }
              }
            }
          ]
        });
      }

      // CSS Modules
      if (buildConfig.css?.modules) {
        rules.push({
          test: /\.module\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]__[local]___[hash:base64:5]'
                }
              }
            },
            'postcss-loader'
          ]
        });
      }
    }

    // Asset handling
    rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/,
      type: 'asset/resource',
      generator: {
        filename: 'images/[name].[hash:8][ext]'
      }
    });

    rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'fonts/[name].[hash:8][ext]'
      }
    });

    return rules;
  }

  private getPlugins(buildConfig: BuildConfig, mode: string) {
    const plugins: webpack.WebpackPluginInstance[] = [];

    // Bundle analyzer
    if (buildConfig.optimization.bundleAnalysis) {
      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html'
        })
      );
    }

    // Define plugin for environment variables
    plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.CAS_PLUGIN_ID': JSON.stringify(this.config.manifest.id),
        'process.env.CAS_PLUGIN_VERSION': JSON.stringify(this.config.manifest.version)
      })
    );

    return plugins;
  }

  private getOptimization(buildConfig: BuildConfig, mode: string) {
    const isProduction = mode === 'production';

    const optimization: webpack.Options.Optimization = {
      minimize: buildConfig.optimization.minify && isProduction,
      minimizer: [], // Will be populated by plugins
      splitChunks: buildConfig.optimization.codeSplitting ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      } : false,
      usedExports: buildConfig.optimization.treeshake,
      sideEffects: false
    };

    return optimization;
  }

  private getExternals(buildConfig: BuildConfig) {
    if (this.config.pluginType === 'library') {
      return {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@cas/types': '@cas/types'
      };
    }
    return undefined;
  }

  private configureUIPlugin(baseConfig: webpack.Configuration, buildConfig: BuildConfig, mode: string) {
    return {
      ...baseConfig,
      target: 'web',
      module: {
        ...baseConfig.module,
        rules: [
          ...baseConfig.module!.rules!,
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  '@babel/preset-react',
                  '@babel/preset-typescript'
                ]
              }
            }
          }
        ]
      }
    };
  }

  private configureAPIPlugin(baseConfig: webpack.Configuration, buildConfig: BuildConfig, mode: string) {
    return {
      ...baseConfig,
      target: 'node',
      externals: {
        ...baseConfig.externals,
        express: 'express',
        '@cas/core-api': '@cas/core-api'
      }
    };
  }

  private configureFullstackPlugin(baseConfig: webpack.Configuration, buildConfig: BuildConfig, mode: string) {
    return {
      ...baseConfig,
      // For fullstack, you might want separate configs for client and server
      // This is a simplified approach
      target: 'web'
    };
  }

  private configureLibraryPlugin(baseConfig: webpack.Configuration, buildConfig: BuildConfig, mode: string) {
    return {
      ...baseConfig,
      output: {
        ...baseConfig.output!,
        library: {
          name: this.config.manifest.id.replace(/-/g, ''),
          type: buildConfig.output.format === 'umd' ? 'umd' : 'module'
        },
        globalObject: 'this'
      },
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@cas/types': '@cas/types'
      }
    };
  }
}
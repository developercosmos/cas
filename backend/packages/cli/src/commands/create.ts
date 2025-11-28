import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { PluginType, TemplateConfig } from '../types/index.js';
import { TemplateEngine } from '../utils/template-engine.js';
import { PackageManager } from '../utils/package-manager.js';
import { GitManager } from '../utils/git-manager.js';

export const createCommand = new Command('create')
  .description('Create a new CAS plugin')
  .argument('<name>', 'Plugin name')
  .option('-t, --type <type>', 'Plugin type (ui, api, fullstack, library)')
  .option('-f, --force', 'Force creation even if directory exists')
  .option('--template <template>', 'Use specific template')
  .option('--skip-git', 'Skip Git repository initialization')
  .option('--skip-install', 'Skip dependency installation')
  .action(async (name: string, options) => {
    try {
      console.log(chalk.blueBright('🚀 Creating CAS Plugin:'), chalk.cyan(name));

      // Check if directory exists
      const targetPath = path.resolve(name);
      if (fs.existsSync(targetPath) && !options.force) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory ${name} already exists. Overwrite?`,
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('✖ Plugin creation cancelled'));
          process.exit(0);
        }

        await fs.remove(targetPath);
      }

      // Gather plugin information
      let pluginConfig = await gatherPluginInfo(name, options);

      // Select template
      const template = await selectTemplate(pluginConfig.type, options.template);

      // Create plugin
      const spinner = ora('Creating plugin structure...').start();

      const templateEngine = new TemplateEngine();
      await templateEngine.create(template, targetPath, pluginConfig);

      spinner.succeed('Plugin structure created');

      // Initialize Git
      if (!options.skipGit) {
        spinner.start('Initializing Git repository...');
        const gitManager = new GitManager(targetPath);
        await gitManager.init();
        await gitManager.addRemote('origin', pluginConfig.repository);
        await gitManager.add('.');
        await gitManager.commit('Initial commit - CAS plugin created');
        spinner.succeed('Git repository initialized');
      }

      // Install dependencies
      if (!options.skipInstall) {
        spinner.start('Installing dependencies...');
        const packageManager = new PackageManager(targetPath);
        await packageManager.install();
        spinner.succeed('Dependencies installed');
      }

      // Show success message
      console.log(chalk.green('\n✅ Plugin created successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(`  cd ${name}`);
      console.log('  cas-cli dev         # Start development server');
      console.log('  cas-cli build       # Build for production');
      console.log('  cas-cli test        # Run tests');
      console.log('  cas-cli package     # Create distributable package');

      // Show plugin information
      console.log(chalk.cyan('\n📋 Plugin Information:'));
      console.log(`  Name: ${pluginConfig.name}`);
      console.log(`  Type: ${pluginConfig.type}`);
      console.log(`  Description: ${pluginConfig.description}`);
      console.log(`  Author: ${pluginConfig.author}`);

    } catch (error) {
      console.error(chalk.red('❌ Error creating plugin:'), error.message);
      if (process.argv.includes('--verbose')) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

async function gatherPluginInfo(name: string, options: any) {
  const questions = [];

  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'What type of plugin do you want to create?',
      choices: [
        {
          name: 'UI Plugin - Frontend components and views',
          value: 'ui'
        },
        {
          name: 'API Plugin - Backend services and endpoints',
          value: 'api'
        },
        {
          name: 'Full-Stack Plugin - Both frontend and backend',
          value: 'fullstack'
        },
        {
          name: 'Library Plugin - Shared utilities and types',
          value: 'library'
        }
      ]
    });
  }

  questions.push(
    {
      type: 'input',
      name: 'description',
      message: 'Plugin description:',
      default: `CAS plugin: ${name}`
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'CAS Platform Team'
    },
    {
      type: 'input',
      name: 'license',
      message: 'License:',
      default: 'MIT'
    },
    {
      type: 'input',
      name: 'repository',
      message: 'Repository URL (optional):'
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm'],
      default: 'npm'
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: true
    },
    {
      type: 'confirm',
      name: 'testing',
      message: 'Set up testing framework?',
      default: true
    },
    {
      type: 'confirm',
      name: 'eslint',
      message: 'Set up ESLint?',
      default: true
    },
    {
      type: 'confirm',
      name: 'prettier',
      message: 'Set up Prettier?',
      default: true
    }
  );

  const answers = await inquirer.prompt(questions);

  return {
    name: name,
    id: `cas-plugin-${name.toLowerCase().replace(/\s+/g, '-')}`,
    type: options.type || answers.type,
    description: answers.description,
    author: answers.author,
    license: answers.license,
    repository: answers.repository,
    packageManager: answers.packageManager,
    typescript: answers.typescript,
    testing: answers.testing,
    eslint: answers.eslint,
    prettier: answers.prettier,
    version: '1.0.0'
  };
}

async function selectTemplate(type: PluginType, customTemplate?: string) {
  if (customTemplate) {
    // Load custom template
    return {
      name: customTemplate,
      path: path.resolve(customTemplate),
      type
    };
  }

  // Select built-in template based on type
  const templates = {
    ui: {
      name: 'ui-plugin',
      path: path.join(__dirname, '../../templates/ui-plugin'),
      type
    },
    api: {
      name: 'api-plugin',
      path: path.join(__dirname, '../../templates/api-plugin'),
      type
    },
    fullstack: {
      name: 'fullstack-plugin',
      path: path.join(__dirname, '../../templates/fullstack-plugin'),
      type
    },
    library: {
      name: 'library-plugin',
      path: path.join(__dirname, '../../templates/library-plugin'),
      type
    }
  };

  return templates[type] || templates.ui;
}
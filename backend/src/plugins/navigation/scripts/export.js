import { createWriteStream, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import pkg from 'archiver';
const archiver = pkg;
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginDir = dirname(__dirname);

async function exportPlugin() {
  const packageJson = JSON.parse(
    await import('fs').then(fs => fs.readFileSync(join(pluginDir, 'package.json'), 'utf8'))
  );
  
  const pluginId = packageJson.cas?.pluginId || 'menu-navigation';
  const version = packageJson.version;
  const exportFileName = `${pluginId}-v${version}-export.zip`;
  const exportPath = join(__dirname, '../exports');
  
  // Ensure exports directory exists
  if (!existsSync(exportPath)) {
    mkdirSync(exportPath, { recursive: true });
  }
  
  const outputPath = join(exportPath, exportFileName);
  
  return new Promise((resolve, reject) => {
    // Create zip file
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      const stats = statSync(outputPath);
      console.log(`✅ Plugin exported: ${outputPath}`);
      console.log(`📦 Archive size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 Files archived: ${archive.pointer()} files`);
      resolve(outputPath);
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    
    // Add package.json
    archive.file(join(pluginDir, 'package.json'), { name: 'package.json' });
    
    // Add plugin entry files
    if (existsSync(join(pluginDir, 'index.js'))) {
      archive.file(join(pluginDir, 'index.js'), { name: 'index.js' });
    }
    if (existsSync(join(pluginDir, 'index.d.ts'))) {
      archive.file(join(pluginDir, 'index.d.ts'), { name: 'index.d.ts' });
    }
    
    // Add TypeScript files
    if (existsSync(join(pluginDir, 'types.ts'))) {
      archive.file(join(pluginDir, 'types.ts'), { name: 'types.ts' });
    }
    if (existsSync(join(pluginDir, 'types.d.ts'))) {
      archive.file(join(pluginDir, 'types.d.ts'), { name: 'types.d.ts' });
    }
    
    // Add service files
    if (existsSync(join(pluginDir, 'NavigationService.ts'))) {
      archive.file(join(pluginDir, 'NavigationService.ts'), { name: 'NavigationService.ts' });
    }
    if (existsSync(join(pluginDir, 'NavigationService.js'))) {
      archive.file(join(pluginDir, 'NavigationService.js'), { name: 'NavigationService.js' });
    }
    
    // Add routes
    if (existsSync(join(pluginDir, 'routes.ts'))) {
      archive.file(join(pluginDir, 'routes.ts'), { name: 'routes.ts' });
    }
    if (existsSync(join(pluginDir, 'routes.js'))) {
      archive.file(join(pluginDir, 'routes.js'), { name: 'routes.js' });
    }
    
    // Add database migrations
    if (existsSync(join(pluginDir, 'database'))) {
      archive.directory(join(pluginDir, 'database'), 'database');
    }
    
    // Add scripts
    if (existsSync(join(pluginDir, 'scripts'))) {
      archive.directory(join(pluginDir, 'scripts'), 'scripts');
    }
    
    // Add frontend components (if exists)
    const frontendDir = join(pluginDir, 'frontend');
    if (existsSync(frontendDir)) {
      archive.directory(frontendDir, 'frontend');
    }
    
    // Add README and documentation
    if (existsSync(join(pluginDir, 'README.md'))) {
      archive.file(join(pluginDir, 'README.md'), { name: 'README.md' });
    }
    
    // Add export manifest
    const exportManifest = {
      pluginId,
      version,
      name: packageJson.name,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      exportedAt: new Date().toISOString(),
      casVersion: packageJson.cas?.compatibility?.casVersion,
      nodeVersion: packageJson.cas?.compatibility?.nodeVersion,
      databaseVersion: packageJson.cas?.compatibility?.database,
      features: packageJson.cas?.features,
      permissions: packageJson.cas?.permissions,
      apiVersion: packageJson.cas?.apiVersion,
      category: packageJson.cas?.category,
      isSystem: packageJson.cas?.isSystem,
      files: {
        packageJson: true,
        index: existsSync(join(pluginDir, 'index.js')),
        types: existsSync(join(pluginDir, 'types.ts')),
        services: existsSync(join(pluginDir, 'NavigationService.ts')),
        routes: existsSync(join(pluginDir, 'routes.ts')),
        database: existsSync(join(pluginDir, 'database')),
        frontend: existsSync(frontendDir),
        scripts: existsSync(join(pluginDir, 'scripts')),
        readme: existsSync(join(pluginDir, 'README.md'))
      }
    };
    
    archive.append(JSON.stringify(exportManifest, null, 2), { name: 'export-manifest.json' });
    
    archive.finalize();
  });
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportPlugin()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Export failed:', error);
      process.exit(1);
    });
}

export { exportPlugin };

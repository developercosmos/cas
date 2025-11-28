import { Router } from 'express';
import { PluginMigrationService } from '../../services/migration/PluginMigrationService.js';
import { MigrationFormatAdapter } from '../../services/migration/MigrationFormatAdapter.js';
import {
  PortableMigration,
  MigrationExecutionContext,
  MigrationPlan,
  DataExport,
  DataImport,
  MigrationType,
  DatabaseEngine,
  RiskLevel
} from '../../services/migration/types.js';

const router = Router();
const migrationService = new PluginMigrationService();

// Middleware to ensure user is authenticated and has admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Get migration status for all plugins
 */
router.get('/status', requireAdmin, async (req: any, res: any) => {
  try {
    const status = await migrationService.getAllMigrationStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get migration status for specific plugin
 */
router.get('/status/:pluginId', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const status = await migrationService.getPluginMigrationStatus(pluginId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error(`❌ Failed to get migration status for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get migrations for a plugin
 */
router.get('/plugins/:pluginId/migrations', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const migrations = await migrationService.getPluginMigrations(pluginId);
    res.json({
      success: true,
      data: migrations
    });
  } catch (error) {
    console.error(`❌ Failed to get migrations for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migrations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get specific migration
 */
router.get('/migrations/:migrationId', requireAdmin, async (req: any, res: any) => {
  try {
    const { migrationId } = req.params;
    const migration = await migrationService.getMigration(migrationId);

    if (!migration) {
      return res.status(404).json({
        success: false,
        message: 'Migration not found'
      });
    }

    res.json({
      success: true,
      data: migration
    });
  } catch (error) {
    console.error(`❌ Failed to get migration ${req.params.migrationId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create a new migration
 */
router.post('/plugins/:pluginId/migrations', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const migrationData = req.body;

    const migration = await migrationService.createMigration(pluginId, migrationData);
    res.status(201).json({
      success: true,
      data: migration,
      message: 'Migration created successfully'
    });
  } catch (error) {
    console.error(`❌ Failed to create migration for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create migration plan for plugin upgrade
 */
router.post('/plugins/:pluginId/plan', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const { targetVersion, options = {} } = req.body;

    if (!targetVersion) {
      return res.status(400).json({
        success: false,
        message: 'targetVersion is required'
      });
    }

    const plan = await migrationService.createUpgradePlan(pluginId, targetVersion, options);
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error(`❌ Failed to create migration plan for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create migration plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute migration plan
 */
router.post('/plans/:planId/execute', requireAdmin, async (req: any, res: any) => {
  try {
    const { planId } = req.params;
    const { plan, options = {} } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Migration plan is required'
      });
    }

    const results = await migrationService.executeMigrationPlan(plan, options);
    res.json({
      success: true,
      data: results,
      message: `Migration execution completed: ${results.filter(r => r.success).length}/${results.length} successful`
    });
  } catch (error) {
    console.error(`❌ Failed to execute migration plan ${req.params.planId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute migration plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Rollback plugin to specific version
 */
router.post('/plugins/:pluginId/rollback', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const { targetVersion, options = {} } = req.body;

    if (!targetVersion) {
      return res.status(400).json({
        success: false,
        message: 'targetVersion is required'
      });
    }

    const results = await migrationService.rollbackPlugin(pluginId, targetVersion, options);
    res.json({
      success: true,
      data: results,
      message: `Rollback completed: ${results.filter(r => r.success).length}/${results.length} successful`
    });
  } catch (error) {
    console.error(`❌ Failed to rollback plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback plugin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Export plugin data
 */
router.post('/plugins/:pluginId/export', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const { filter, format = 'json' } = req.body;

    const dataExport = await migrationService.exportPluginData(pluginId, filter, format);
    res.json({
      success: true,
      data: dataExport,
      message: 'Data exported successfully'
    });
  } catch (error) {
    console.error(`❌ Failed to export data for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Import plugin data
 */
router.post('/plugins/:pluginId/import', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const { dataExport, options = {} } = req.body;

    if (!dataExport) {
      return res.status(400).json({
        success: false,
        message: 'dataExport is required'
      });
    }

    const dataImport = await migrationService.importPluginData(dataExport, pluginId, options);
    res.json({
      success: true,
      data: dataImport,
      message: `Data import completed: ${dataImport.recordsImported} records imported`
    });
  } catch (error) {
    console.error(`❌ Failed to import data for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create portable migration package
 */
router.post('/plugins/:pluginId/package', requireAdmin, async (req: any, res: any) => {
  try {
    const { pluginId } = req.params;
    const { includeData = false, outputPath } = req.body;

    const packagePath = await migrationService.createMigrationPackage(
      pluginId,
      includeData,
      outputPath
    );

    res.json({
      success: true,
      data: { packagePath },
      message: 'Migration package created successfully'
    });
  } catch (error) {
    console.error(`❌ Failed to create migration package for plugin ${req.params.pluginId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create migration package',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Install plugin from migration package
 */
router.post('/install-from-package', requireAdmin, async (req: any, res: any) => {
  try {
    const { packagePath, options = {} } = req.body;

    if (!packagePath) {
      return res.status(400).json({
        success: false,
        message: 'packagePath is required'
      });
    }

    const result = await migrationService.installFromMigrationPackage(packagePath, options);
    res.json({
      success: true,
      data: result,
      message: 'Plugin installed from package successfully'
    });
  } catch (error) {
    console.error('❌ Failed to install plugin from package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to install plugin from package',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Detect conflicts between plugins
 */
router.get('/conflicts', requireAdmin, async (req: any, res: any) => {
  try {
    const conflicts = await migrationService.detectPluginConflicts();
    res.json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    console.error('❌ Failed to detect plugin conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect plugin conflicts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get migration statistics
 */
router.get('/statistics', requireAdmin, async (req: any, res: any) => {
  try {
    const statistics = await migrationService.getMigrationStatistics();
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('❌ Failed to get migration statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate migration
 */
router.post('/migrations/validate', requireAdmin, async (req: any, res: any) => {
  try {
    const { migration } = req.body;

    if (!migration) {
      return res.status(400).json({
        success: false,
        message: 'migration is required'
      });
    }

    // Convert to portable format if needed
    let portableMigration: PortableMigration;
    if (migration.up && migration.down) {
      // Already in portable format
      portableMigration = migration as PortableMigration;
    } else {
      // Convert from traditional format
      portableMigration = MigrationFormatAdapter.toPortable(
        migration,
        migration.pluginId || 'unknown'
      );
    }

    // Basic validation
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Check required fields
    if (!portableMigration.id) {
      validation.valid = false;
      validation.errors.push({
        type: 'structure',
        message: 'Migration ID is required',
        severity: 'error',
        fixable: true,
        suggestion: 'Add a unique migration ID'
      });
    }

    if (!portableMigration.pluginId) {
      validation.valid = false;
      validation.errors.push({
        type: 'structure',
        message: 'Plugin ID is required',
        severity: 'error',
        fixable: true,
        suggestion: 'Specify the plugin this migration belongs to'
      });
    }

    if (!portableMigration.up || portableMigration.up.length === 0) {
      validation.valid = false;
      validation.errors.push({
        type: 'structure',
        message: 'Migration must have at least one UP step',
        severity: 'error',
        fixable: true,
        suggestion: 'Add migration steps'
      });
    }

    // Validate steps
    if (portableMigration.up) {
      for (let i = 0; i < portableMigration.up.length; i++) {
        const step = portableMigration.up[i];
        if (!step.id) {
          validation.warnings.push({
            type: 'structure',
            message: `Step ${i + 1} is missing an ID`,
            severity: 'medium',
            recommendation: 'Add unique step IDs for better tracking'
          });
        }

        if (step.sql && !step.sql.universal && Object.keys(step.sql).length === 0) {
          validation.errors.push({
            type: 'sql',
            message: `Step ${i + 1} has invalid SQL configuration`,
            severity: 'error',
            fixable: true,
            suggestion: 'Provide universal SQL or engine-specific SQL'
          });
        }
      }
    }

    // Risk assessment
    if (portableMigration.riskLevel === RiskLevel.CRITICAL) {
      validation.warnings.push({
        type: 'risk',
        message: 'This migration has critical risk level',
        severity: 'high',
        recommendation: 'Review migration carefully and consider running during maintenance window'
      });
    }

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('❌ Failed to validate migration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Convert migration to portable format
 */
router.post('/migrations/convert', requireAdmin, async (req: any, res: any) => {
  try {
    const { migration, pluginId, targetEngines = [DatabaseEngine.POSTGRESQL] } = req.body;

    if (!migration || !pluginId) {
      return res.status(400).json({
        success: false,
        message: 'migration and pluginId are required'
      });
    }

    const portableMigration = MigrationFormatAdapter.toPortable(migration, pluginId, targetEngines);

    res.json({
      success: true,
      data: portableMigration,
      message: 'Migration converted to portable format'
    });
  } catch (error) {
    console.error('❌ Failed to convert migration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate SQL file for migration
 */
router.post('/migrations/:migrationId/sql', requireAdmin, async (req: any, res: any) => {
  try {
    const { migrationId } = req.params;
    const { engine = DatabaseEngine.POSTGRESQL, direction = 'up' } = req.body;

    const migration = await migrationService.getMigration(migrationId);
    if (!migration) {
      return res.status(404).json({
        success: false,
        message: 'Migration not found'
      });
    }

    const sql = MigrationFormatAdapter.toSQLFile(migration, engine, direction);

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${migrationId}_${direction}.sql"`
    });

    res.send(sql);
  } catch (error) {
    console.error(`❌ Failed to generate SQL for migration ${req.params.migrationId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SQL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get migration types
 */
router.get('/types', (req: any, res: any) => {
  res.json({
    success: true,
    data: Object.values(MigrationType)
  });
});

/**
 * Get database engines
 */
router.get('/engines', (req: any, res: any) => {
  res.json({
    success: true,
    data: Object.values(DatabaseEngine)
  });
});

/**
 * Get risk levels
 */
router.get('/risk-levels', (req: any, res: any) => {
  res.json({
    success: true,
    data: Object.values(RiskLevel)
  });
});

export default router;
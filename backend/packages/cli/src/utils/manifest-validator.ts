import fs from 'fs-extra';
import { validate } from 'json-schema';
import { PluginManifest, ValidationResult, ValidationError } from '../types/index.js';
import { Logger } from './logger.js';

export class ManifestValidator {
  private logger: Logger;
  private schema: any;

  constructor() {
    this.logger = new Logger('ManifestValidator');
    this.schema = this.getManifestSchema();
  }

  async validate(manifestPath: string, options: {
    strict?: boolean;
  } = {}): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: false,
      errors: [],
      warnings: []
    };

    try {
      // Check if manifest exists
      if (!await fs.pathExists(manifestPath)) {
        result.errors.push({
          code: 'MANIFEST_NOT_FOUND',
          message: `Plugin manifest not found at ${manifestPath}`,
          path: manifestPath,
          severity: 'error'
        });
        return result;
      }

      // Read and parse manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      let manifest: PluginManifest;

      try {
        manifest = JSON.parse(manifestContent);
      } catch (parseError) {
        result.errors.push({
          code: 'INVALID_JSON',
          message: `Invalid JSON in manifest: ${parseError.message}`,
          path: manifestPath,
          severity: 'error'
        });
        return result;
      }

      // Validate against schema
      const schemaResult = validate(manifest, this.schema);

      if (schemaResult.errors.length > 0) {
        for (const error of schemaResult.errors) {
          result.errors.push({
            code: 'SCHEMA_VALIDATION_ERROR',
            message: `${error.property}: ${error.message}`,
            path: `${manifestPath}${error.property ? `#${error.property}` : ''}`,
            severity: 'error'
          });
        }
      }

      // Additional semantic validations
      await this.validateSemantics(manifest, result, options);

      // Check compatibility
      await this.validateCompatibility(manifest, result);

      result.valid = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        path: manifestPath,
        severity: 'error'
      });
    }

    return result;
  }

  private async validateSemantics(
    manifest: PluginManifest,
    result: ValidationResult,
    options: { strict?: boolean }
  ): Promise<void> {
    // Validate ID format
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      result.errors.push({
        code: 'INVALID_ID_FORMAT',
        message: 'Plugin ID must contain only lowercase letters, numbers, and hyphens',
        path: 'id',
        severity: 'error'
      });
    }

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      result.errors.push({
        code: 'INVALID_VERSION_FORMAT',
        message: 'Version must follow semantic versioning (x.y.z)',
        path: 'version',
        severity: 'error'
      });
    }

    // Validate name length
    if (manifest.name.length > 100) {
      result.warnings.push({
        code: 'LONG_NAME',
        message: 'Plugin name is quite long, consider shortening it',
        path: 'name',
        severity: 'warning'
      });
    }

    // Validate description
    if (manifest.description.length === 0) {
      result.errors.push({
        code: 'MISSING_DESCRIPTION',
        message: 'Plugin description is required',
        path: 'description',
        severity: 'error'
      });
    }

    if (manifest.description.length > 500) {
      result.warnings.push({
        code: 'LONG_DESCRIPTION',
        message: 'Plugin description is quite long, consider shortening it',
        path: 'description',
        severity: 'warning'
      });
    }

    // Validate entry point
    if (!manifest.entry) {
      result.errors.push({
        code: 'MISSING_ENTRY',
        message: 'Plugin entry point is required',
        path: 'entry',
        severity: 'error'
      });
    }

    // Validate dependencies
    if (Array.isArray(manifest.dependencies)) {
      for (const dep of manifest.dependencies) {
        if (!dep.name || !dep.version || !dep.type) {
          result.errors.push({
            code: 'INVALID_DEPENDENCY',
            message: 'Dependencies must have name, version, and type',
            path: 'dependencies',
            severity: 'error'
          });
        }

        if (!['core', 'peer', 'external'].includes(dep.type)) {
          result.errors.push({
            code: 'INVALID_DEPENDENCY_TYPE',
            message: 'Dependency type must be one of: core, peer, external',
            path: 'dependencies',
            severity: 'error'
          });
        }
      }
    }

    // Validate permissions
    const validPermissions = [
      'storage.read',
      'storage.write',
      'api.request',
      'dom.access',
      'events.emit',
      'events.listen',
      'network.request',
      'file.read',
      'file.write',
      'camera.access',
      'microphone.access'
    ];

    if (Array.isArray(manifest.permissions)) {
      for (const permission of manifest.permissions) {
        if (!validPermissions.includes(permission)) {
          result.warnings.push({
            code: 'UNKNOWN_PERMISSION',
            message: `Unknown permission: ${permission}`,
            path: 'permissions',
            severity: 'warning'
          });
        }
      }
    }

    // Strict mode validations
    if (options.strict) {
      if (manifest.name.length > 50) {
        result.errors.push({
          code: 'NAME_TOO_LONG',
          message: 'Plugin name must be 50 characters or less in strict mode',
          path: 'name',
          severity: 'error'
        });
      }

      if (manifest.description.length > 200) {
        result.errors.push({
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Plugin description must be 200 characters or less in strict mode',
          path: 'description',
          severity: 'error'
        });
      }
    }
  }

  private async validateCompatibility(
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    if (!manifest.compatibility) {
      result.warnings.push({
        code: 'MISSING_COMPATIBILITY',
        message: 'Compatibility information is missing',
        path: 'compatibility',
        severity: 'warning'
      });
      return;
    }

    // Validate min version format
    if (manifest.compatibility.minCasVersion) {
      if (!/^\d+\.\d+\.\d+/.test(manifest.compatibility.minCasVersion)) {
        result.errors.push({
          code: 'INVALID_MIN_VERSION',
          message: 'Minimum CAS version must follow semantic versioning',
          path: 'compatibility.minCasVersion',
          severity: 'error'
        });
      }
    }

    // Validate max version format if present
    if (manifest.compatibility.maxCasVersion) {
      if (!/^\d+\.\d+\.\d+/.test(manifest.compatibility.maxCasVersion)) {
        result.errors.push({
          code: 'INVALID_MAX_VERSION',
          message: 'Maximum CAS version must follow semantic versioning',
          path: 'compatibility.maxCasVersion',
          severity: 'error'
        });
      }
    }

    // Check version ordering
    if (manifest.compatibility.minCasVersion && manifest.compatibility.maxCasVersion) {
      const min = manifest.compatibility.minCasVersion.split('.').map(Number);
      const max = manifest.compatibility.maxCasVersion.split('.').map(Number);

      for (let i = 0; i < 3; i++) {
        if (min[i] > max[i]) {
          result.errors.push({
            code: 'INVALID_VERSION_RANGE',
            message: 'Minimum CAS version cannot be greater than maximum version',
            path: 'compatibility',
            severity: 'error'
          });
          break;
        } else if (min[i] < max[i]) {
          break;
        }
      }
    }
  }

  private getManifestSchema(): any {
    return {
      type: 'object',
      required: ['id', 'name', 'version', 'description', 'author', 'entry', 'dependencies', 'permissions', 'casVersion'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 1,
          maxLength: 100
        },
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+'
        },
        description: {
          type: 'string',
          minLength: 1,
          maxLength: 500
        },
        author: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        entry: {
          type: 'string',
          minLength: 1
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'version', 'type'],
            properties: {
              name: {
                type: 'string',
                minLength: 1
              },
              version: {
                type: 'string',
                minLength: 1
              },
              type: {
                type: 'string',
                enum: ['core', 'peer', 'external']
              }
            }
          }
        },
        permissions: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        casVersion: {
          type: 'string',
          pattern: '^[><=]*\\s*\\d+\\.\\d+\\.\\d+'
        },
        metadata: {
          type: 'object',
          properties: {
            category: {
              type: 'string'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            repository: {
              type: 'string'
            },
            homepage: {
              type: 'string'
            },
            license: {
              type: 'string'
            },
            keywords: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        compatibility: {
          type: 'object',
          properties: {
            minCasVersion: {
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+'
            },
            maxCasVersion: {
              type: 'string',
              pattern: '^\\d+\\.\\d+\\.\\d+$'
            }
          }
        }
      },
      additionalProperties: false
    };
  }
}
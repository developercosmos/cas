/**
 * Plugin Communication Service
 * Manages secure cross-plugin API communication with audit logging
 */

import { DatabaseService } from './DatabaseService.js';
import { RbacPermissionService } from './RbacPermissionService.js';
import { ApiEndpoint } from '../types/plugin.js';

export interface CommunicationRequest {
  fromPluginId: string;
  toPluginId: string;
  userId: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
}

export interface CommunicationResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  executionTime?: number;
}

export interface PluginApi {
  id: string;
  pluginId: string;
  apiPath: string;
  httpMethod: string;
  apiDescription: string;
  requiredPermissions: string[];
  isPublic: boolean;
}

export class PluginCommunicationService {
  private rbacService: RbacPermissionService;

  constructor() {
    this.rbacService = new RbacPermissionService();
  }

  /**
   * Call another plugin's API securely
   */
  async callPluginApi(request: CommunicationRequest): Promise<CommunicationResponse> {
    const startTime = Date.now();
    const auditData = {
      fromPluginId: request.fromPluginId,
      toPluginId: request.toPluginId,
      userId: request.userId,
      apiPath: request.apiPath,
      httpMethod: request.method,
      requestData: request.data,
      timestamp: new Date()
    };

    try {
      // Step 1: Validate calling plugin has permission to make API calls
      const canCallApis = await this.rbacService.checkPermission(
        request.userId, 
        'plugin.api.call',
        request.toPluginId
      );

      if (!canCallApis) {
        const error = 'User does not have permission to call plugin APIs';
        await this.logCommunication({
          ...auditData,
          success: false,
          errorMessage: error,
          statusCode: 403,
          executionTime: Date.now() - startTime
        });
        return {
          success: false,
          error,
          statusCode: 403
        };
      }

      // Step 2: Get target plugin API details
      const apiDetails = await this.getApiDetails(request.toPluginId, request.apiPath, request.method);
      
      if (!apiDetails) {
        const error = `API endpoint ${request.method} ${request.apiPath} not found for plugin ${request.toPluginId}`;
        await this.logCommunication({
          ...auditData,
          success: false,
          errorMessage: error,
          statusCode: 404,
          executionTime: Date.now() - startTime
        });
        return {
          success: false,
          error,
          statusCode: 404
        };
      }

      // Step 3: Check if user has required permissions for the target API
      if (!apiDetails.isPublic && apiDetails.requiredPermissions.length > 0) {
        const hasPermission = await this.checkUserPermissions(
          request.userId, 
          apiDetails.requiredPermissions
        );

        if (!hasPermission) {
          const error = `User does not have required permissions: ${apiDetails.requiredPermissions.join(', ')}`;
          await this.logCommunication({
            ...auditData,
            success: false,
            errorMessage: error,
            statusCode: 403,
            executionTime: Date.now() - startTime
          });
          return {
            success: false,
            error,
            statusCode: 403
          };
        }
      }

      // Step 4: Execute the API call
      const response = await this.executePluginCall(apiDetails, request);

      // Step 5: Log successful communication
      await this.logCommunication({
        ...auditData,
        success: response.success,
        responseData: response.data,
        statusCode: response.statusCode || 200,
        executionTime: Date.now() - startTime
      });

      return response;

    } catch (error) {
      // Log failed communication
      await this.logCommunication({
        ...auditData,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        executionTime: Date.now() - startTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      };
    }
  }

  /**
   * Register a plugin's API endpoints
   */
  async registerPluginApi(pluginId: string, apiDefinition: ApiEndpoint): Promise<void> {
    try {
      const query = `
        INSERT INTO plugin.plugin_api_registry 
        (PluginId, ApiPath, HttpMethod, ApiDescription, RequiredPermissions, IsPublic, UpdatedAt)
        VALUES (
          (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
          $2, $3, $4, $5, $6, NOW()
        )
        ON CONFLICT (PluginId, ApiPath, HttpMethod)
        DO UPDATE SET 
          ApiDescription = $4,
          RequiredPermissions = $5,
          IsPublic = $6,
          UpdatedAt = NOW()
      `;

      await DatabaseService.query(query, [
        pluginId,
        apiDefinition.path,
        apiDefinition.method,
        apiDefinition.description,
        apiDefinition.requiredPermissions,
        apiDefinition.isPublic
      ]);

      console.log(`✅ Registered API: ${apiDefinition.method} ${apiDefinition.path} for plugin ${pluginId}`);
    } catch (error) {
      console.error('Error registering plugin API:', error);
      throw new Error(`Failed to register API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available APIs for a plugin
   */
  async getAvailableApis(pluginId: string): Promise<PluginApi[]> {
    try {
      const query = `
        SELECT 
          ar.Id as id,
          ar.ApiPath as apipath,
          ar.HttpMethod as httpmethod,
          ar.ApiDescription as apidescription,
          ar.RequiredPermissions as requiredpermissions,
          ar.IsPublic as ispublic,
          pc.PluginId as pluginid
        FROM plugin.plugin_api_registry ar
        JOIN plugin.plugin_configurations pc ON ar.PluginId = pc.Id
        WHERE pc.PluginId = $1
        ORDER BY ar.HttpMethod, ar.ApiPath
      `;

      const result = await DatabaseService.query<any>(query, [pluginId]);
      
      return result.map(row => ({
        id: row.id,
        pluginId: row.pluginid,
        apiPath: row.apipath,
        httpMethod: row.httpmethod,
        apiDescription: row.apidescription,
        requiredPermissions: row.requiredpermissions || [],
        isPublic: row.ispublic
      }));
    } catch (error) {
      console.error('Error getting available APIs:', error);
      throw new Error(`Failed to get available APIs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific API details
   */
  private async getApiDetails(pluginId: string, apiPath: string, method: string): Promise<PluginApi | null> {
    try {
      const query = `
        SELECT 
          ar.Id,
          ar.ApiPath,
          ar.HttpMethod,
          ar.ApiDescription,
          ar.RequiredPermissions,
          ar.IsPublic,
          pc.PluginId
        FROM plugin.plugin_api_registry ar
        JOIN plugin.plugin_configurations pc ON ar.PluginId = pc.Id
        WHERE pc.PluginId = $1 
          AND ar.ApiPath = $2 
          AND ar.HttpMethod = $3
      `;

      const result = await DatabaseService.query<PluginApi>(query, [pluginId, apiPath, method]);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting API details:', error);
      return null;
    }
  }

  /**
   * Check if user has all required permissions
   */
  private async checkUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    try {
      for (const permission of requiredPermissions) {
        const hasPermission = await this.rbacService.checkPermission(userId, permission);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  /**
   * Execute the actual plugin API call
   */
  private async executePluginCall(apiDetails: PluginApi, request: CommunicationRequest): Promise<CommunicationResponse> {
    try {
      // Build the target URL
      const baseUrl = `http://localhost:${process.env.PORT || 4000}`;
      const targetUrl = `${baseUrl}${apiDetails.apiPath}`;

      // Make the HTTP request
      const fetch = (await import('node-fetch')).default;
      
      let fetchOptions: any = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Plugin-Communication': 'true',
          'X-From-Plugin': request.fromPluginId,
          'X-To-Plugin': request.toPluginId,
          'X-User-ID': request.userId
        }
      };

      // Add request body for POST/PUT requests
      if (['POST', 'PUT'].includes(request.method) && request.data) {
        fetchOptions.body = JSON.stringify(request.data);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const responseData = await response.json();

      return {
        success: response.ok,
        data: response.ok ? responseData : undefined,
        error: response.ok ? undefined : responseData.error || 'API call failed',
        statusCode: response.status
      };

    } catch (error) {
      console.error('Error executing plugin call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      };
    }
  }

  /**
   * Log plugin communication for audit
   */
  private async logCommunication(auditData: {
    fromPluginId: string;
    toPluginId: string;
    userId: string;
    apiPath: string;
    httpMethod: string;
    requestData?: any;
    responseData?: any;
    success: boolean;
    errorMessage?: string;
    statusCode: number;
    executionTime: number;
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO plugin.plugin_communication_audit 
        (FromPluginId, ToPluginId, UserId, ApiPath, HttpMethod, 
         RequestData, ResponseData, StatusCode, ExecutionTimeMs, Success, ErrorMessage, Timestamp)
        VALUES (
          (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1),
          (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $2),
          $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        )
      `;

      await DatabaseService.query(query, [
        auditData.fromPluginId,
        auditData.toPluginId,
        auditData.userId,
        auditData.apiPath,
        auditData.httpMethod,
        JSON.stringify(auditData.requestData),
        JSON.stringify(auditData.responseData),
        auditData.statusCode,
        auditData.executionTime,
        auditData.success,
        auditData.errorMessage
      ]);

    } catch (error) {
      console.error('Error logging communication:', error);
      // Don't throw here - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get communication history for a plugin
   */
  async getCommunicationHistory(pluginId: string, limit: number = 100): Promise<any[]> {
    try {
      const query = `
        SELECT 
          pca.FromPluginId,
          pca.ToPluginId,
          pca.ApiPath,
          pca.HttpMethod,
          pca.StatusCode,
          pca.ExecutionTimeMs,
          pca.Success,
          pca.ErrorMessage,
          pca.Timestamp,
          u.Username
        FROM plugin.plugin_communication_audit pca
        JOIN auth.users u ON pca.UserId = u.Id
        WHERE pca.FromPluginId = (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1)
           OR pca.ToPluginId = (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1)
        ORDER BY pca.Timestamp DESC
        LIMIT $2
      `;

      return await DatabaseService.query(query, [pluginId, limit]);
    } catch (error) {
      console.error('Error getting communication history:', error);
      throw new Error(`Failed to get communication history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(pluginId?: string): Promise<any> {
    try {
      let whereClause = '';
      const params: any[] = [];

      if (pluginId) {
        whereClause = 'WHERE pca.FromPluginId = (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1) OR pca.ToPluginId = (SELECT Id FROM plugin.plugin_configurations WHERE PluginId = $1)';
        params.push(pluginId);
      }

      const query = `
        SELECT 
          COUNT(*) as total_calls,
          COUNT(CASE WHEN Success = true THEN 1 END) as successful_calls,
          COUNT(CASE WHEN Success = false THEN 1 END) as failed_calls,
          AVG(ExecutionTimeMs) as avg_execution_time,
          MAX(ExecutionTimeMs) as max_execution_time,
          MIN(ExecutionTimeMs) as min_execution_time
        FROM plugin.plugin_communication_audit pca
        ${whereClause}
      `;

      const result = await DatabaseService.query(query, params);
      return result[0] || {};
    } catch (error) {
      console.error('Error getting communication stats:', error);
      return {};
    }
  }
}

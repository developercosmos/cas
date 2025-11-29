/**
 * Audit Service
 * Comprehensive logging for User Access Management Plugin
 * Follows CAS Constitution Requirements for Observability
 */

const DatabaseService = require('../../../services/DatabaseService');
const { v4: uuidv4 } = require('uuid');

class AuditService {
  /**
   * Log an action to the audit trail
   */
  static async logAction(options) {
    try {
      const {
        userId,
        action,
        entityType,
        entityId = null,
        oldValues = null,
        newValues = null,
        success = true,
        errorMessage = null,
        ipAddress = null,
        userAgent = null
      } = options;

      const query = `
        INSERT INTO plugin.uam_tx_audit_log (
          Id, ActionType, EntityType, EntityId, OldValues, NewValues,
          UserId, IPAddress, UserAgent, Success, ErrorMessage, Timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const params = [
        uuidv4(),
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        userId,
        ipAddress,
        userAgent,
        success,
        errorMessage,
        new Date()
      ];

      const result = await DatabaseService.query(query, params);
      
      // Log to console for immediate debugging
      console.log(`[UAM Audit] ${action}: ${entityType}${entityId ? ` (${entityId})` : ''} by User(${userId}) - ${success ? 'SUCCESS' : 'FAILED'}`);
      
      return result[0];
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw error to prevent breaking main functionality
    }
  }

  /**
   * Get audit log with filtering and pagination
   */
  static async getAuditLog(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        startDate = null,
        endDate = null,
        action = null,
        entityType = null,
        userId = null,
        success = null,
        sortBy = 'Timestamp',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (startDate) {
        whereClause += ` AND Timestamp >= $${paramIndex++}`;
        params.push(new Date(startDate));
      }

      if (endDate) {
        whereClause += ` AND Timestamp <= $${paramIndex++}`;
        params.push(new Date(endDate));
      }

      if (action && action.trim()) {
        whereClause += ` AND ActionType = $${paramIndex++}`;
        params.push(action);
      }

      if (entityType && entityType.trim()) {
        whereClause += ` AND EntityType = $${paramIndex++}`;
        params.push(entityType);
      }

      if (userId) {
        whereClause += ` AND UserId = $${paramIndex++}`;
        params.push(userId);
      }

      if (success !== null) {
        whereClause += ` AND Success = $${paramIndex++}`;
        params.push(success);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM plugin.uam_tx_audit_log
        ${whereClause}
      `;
      const countResult = await DatabaseService.query(countQuery, params);
      const total = parseInt(countResult[0]?.total || '0');

      // Data query
      const dataQuery = `
        SELECT 
          Id,
          ActionType,
          EntityType,
          EntityId,
          OldValues,
          NewValues,
          UserId,
          IPAddress,
          UserAgent,
          Success,
          ErrorMessage,
          Timestamp
        FROM plugin.uam_tx_audit_log
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const logs = await DatabaseService.query(dataQuery, params);

      // Format response
      return {
        logs: logs.map(log => ({
          ...log,
          // Parse JSON fields
          OldValues: log.oldvalues ? JSON.parse(log.oldvalues) : null,
          NewValues: log.newvalues ? JSON.parse(log.newvalues) : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(options = {}) {
    try {
      const { startDate, endDate, userId } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (startDate) {
        whereClause += ` AND Timestamp >= $${paramIndex++}`;
        params.push(new Date(startDate));
      }

      if (endDate) {
        whereClause += ` AND Timestamp <= $${paramIndex++}`;
        params.push(new Date(endDate));
      }

      if (userId) {
        whereClause += ` AND UserId = $${paramIndex++}`;
        params.push(userId);
      }

      const queries = {
        totalActions: `
          SELECT COUNT(*) as count FROM plugin.uam_tx_audit_log ${whereClause}
        `,
        successfulActions: `
          SELECT COUNT(*) as count FROM plugin.uam_tx_audit_log ${whereClause} AND Success = TRUE
        `,
        failedActions: `
          SELECT COUNT(*) as count FROM plugin.uam_tx_audit_log ${whereClause} AND Success = FALSE
        `,
        actionTypes: `
          SELECT ActionType, COUNT(*) as count 
          FROM plugin.uam_tx_audit_log ${whereClause}
          GROUP BY ActionType 
          ORDER BY count DESC 
          LIMIT 10
        `,
        entityTypes: `
          SELECT EntityType, COUNT(*) as count 
          FROM plugin.uam_tx_audit_log ${whereClause}
          GROUP BY EntityType 
          ORDER BY count DESC 
          LIMIT 10
        `,
        recentActions: `
          SELECT ActionType, EntityType, Timestamp, Success
          FROM plugin.uam_tx_audit_log ${whereClause}
          ORDER BY Timestamp DESC 
          LIMIT 5
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await DatabaseService.query(query, params);
        results[key] = result;
      }

      return results;
    } catch (error) {
      console.error('Error getting audit stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  static async cleanupAuditLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = `
        DELETE FROM plugin.uam_tx_audit_log 
        WHERE Timestamp < $1
        RETURNING COUNT(*) as deleted_count
      `;

      const result = await DatabaseService.query(query, [cutoffDate]);
      const deletedCount = parseInt(result[0]?.deleted_count || '0');

      console.log(`[UAM Audit] Cleaned up ${deletedCount} old audit entries (retention: ${retentionDays} days)`);
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId, options = {}) {
    try {
      const { 
        startDate, 
        endDate = new Date(),
        limit = 100 
      } = options;

      let whereClause = 'WHERE UserId = $1';
      const params = [userId];
      let paramIndex = 2;

      if (startDate) {
        whereClause += ` AND Timestamp >= $${paramIndex++}`;
        params.push(new Date(startDate));
      }

      if (endDate) {
        whereClause += ` AND Timestamp <= $${paramIndex++}`;
        params.push(new Date(endDate));
      }

      const query = `
        SELECT 
          ActionType,
          EntityType,
          COUNT(*) as ActionCount,
          MAX(Timestamp) as LastActionAt,
          COUNT(CASE WHEN Success = TRUE THEN 1 END) as SuccessCount,
          COUNT(CASE WHEN Success = FALSE THEN 1 END) as FailureCount
        FROM plugin.uam_tx_audit_log
        ${whereClause}
        GROUP BY ActionType, EntityType
        ORDER BY ActionCount DESC
        LIMIT $${paramIndex++}
      `;
      params.push(limit);

      const results = await DatabaseService.query(query, params);

      return {
        userId,
        period: { startDate, endDate },
        summary: results,
        totalActions: results.reduce((sum, item) => sum + parseInt(item.actioncount), 0),
        successRate: results.reduce((sum, item) => sum + parseInt(item.successcount), 0) / 
                   Math.max(1, results.reduce((sum, item) => sum + parseInt(item.actioncount), 0))
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      throw error;
    }
  }

  /**
   * Export audit log to CSV
   */
  static async exportAuditLog(options = {}) {
    try {
      const { startDate, endDate, action, entityType } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (startDate) {
        whereClause += ` AND Timestamp >= $${paramIndex++}`;
        params.push(new Date(startDate));
      }

      if (endDate) {
        whereClause += ` AND Timestamp <= $${paramIndex++}`;
        params.push(new Date(endDate));
      }

      if (action) {
        whereClause += ` AND ActionType = $${paramIndex++}`;
        params.push(action);
      }

      if (entityType) {
        whereClause += ` AND EntityType = $${paramIndex++}`;
        params.push(entityType);
      }

      const query = `
        SELECT 
          ActionType,
          EntityType,
          EntityId,
          UserId,
          IPAddress,
          UserAgent,
          Success,
          ErrorMessage,
          Timestamp
        FROM plugin.uam_tx_audit_log
        ${whereClause}
        ORDER BY Timestamp DESC
      `;

      const results = await DatabaseService.query(query, params);

      // Convert to CSV format
      const headers = [
        'Timestamp',
        'Action',
        'Entity Type',
        'Entity ID',
        'User ID',
        'IP Address',
        'User Agent',
        'Success',
        'Error Message'
      ];

      const csvRows = results.map(row => [
        row.timestamp,
        row.actiontype,
        row.entitytype,
        row.entityid || '',
        row.userid || '',
        row.ipaddress || '',
        row.useragent ? `"${row.useragent.replace(/"/g, '""')}"` : '',
        row.success ? 'TRUE' : 'FALSE',
        row.errormessage ? `"${row.errormessage.replace(/"/g, '""')}"` : ''
      ]);

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      return {
        filename: `uam_audit_log_${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        recordCount: results.length
      };
    } catch (error) {
      console.error('Error exporting audit log:', error);
      throw error;
    }
  }
}

module.exports = AuditService;

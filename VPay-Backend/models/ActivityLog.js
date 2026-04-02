/**
 * Admin Activity Log Model
 * Complete audit trail of all admin actions
 */

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class ActivityLog {
  /**
   * Log admin activity
   */
  static async log(adminId, action, resourceType, resourceId, details = {}, ipAddress = '') {
    try {
      const timestamp = new Date();

      await pool.query(`
        INSERT INTO admin_activity_logs (
          admin_id, action, resource_type, resource_id, details, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(details),
        ipAddress,
        timestamp
      ]);

      logger.info(`[ACTIVITY] ${action} on ${resourceType} by admin ${adminId}`);
      return true;
    } catch (error) {
      logger.error(`[ACTIVITY] Error logging activity: ${error.message}`);
      // Don't throw - logging failures shouldn't break the app
      return false;
    }
  }

  /**
   * Get all activity logs with pagination
   */
  static async getAll(page = 1, limit = 50, filters = {}) {
    try {
      let query = 'SELECT * FROM admin_activity_logs WHERE 1=1';
      const params = [];

      // Apply filters
      if (filters.adminId) {
        query += ' AND admin_id = ?';
        params.push(filters.adminId);
      }
      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }
      if (filters.resourceType) {
        query += ' AND resource_type = ?';
        params.push(filters.resourceType);
      }
      if (filters.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }

      // Count total
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Add pagination
      const offset = (page - 1) * limit;
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [logs] = await pool.query(query, params);

      // Parse details JSON
      const parsedLogs = logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : {}
      }));

      logger.debug(`[ACTIVITY] Retrieved ${logs.length} activity logs`);

      return {
        logs: parsedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`[ACTIVITY] Error retrieving activity logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity logs by admin
   */
  static async getByAdmin(adminId, page = 1, limit = 50) {
    return this.getAll(page, limit, { adminId });
  }

  /**
   * Get activity logs by action type
   */
  static async getByAction(action, page = 1, limit = 50) {
    return this.getAll(page, limit, { action });
  }

  /**
   * Get activity logs by resource
   */
  static async getByResource(resourceType, resourceId, page = 1, limit = 50) {
    try {
      let query = 'SELECT * FROM admin_activity_logs WHERE resource_type = ?';
      const params = [resourceType];

      if (resourceId) {
        query += ' AND resource_id = ?';
        params.push(resourceId);
      }

      const [logs] = await pool.query(query + ' ORDER BY created_at DESC LIMIT ? OFFSET ?', [
        ...params,
        limit,
        (page - 1) * limit
      ]);

      return logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : {}
      }));
    } catch (error) {
      logger.error(`[ACTIVITY] Error retrieving resource activity logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent activity (last N records)
   */
  static async getRecent(limit = 50) {
    try {
      const [logs] = await pool.query(`
        SELECT * FROM admin_activity_logs
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);

      return logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : {}
      }));
    } catch (error) {
      logger.error(`[ACTIVITY] Error retrieving recent activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity summary by action
   */
  static async getActionSummary(days = 7) {
    try {
      const [summary] = await pool.query(`
        SELECT 
          action,
          COUNT(*) as count,
          COUNT(DISTINCT admin_id) as adminCount
        FROM admin_activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY action
        ORDER BY count DESC
      `, [days]);

      return summary;
    } catch (error) {
      logger.error(`[ACTIVITY] Error retrieving action summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity summary by admin
   */
  static async getAdminSummary(days = 7) {
    try {
      const [summary] = await pool.query(`
        SELECT 
          admin_id,
          COUNT(*) as activityCount,
          COUNT(DISTINCT action) as actionTypes,
          MIN(created_at) as firstActivity,
          MAX(created_at) as lastActivity
        FROM admin_activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY admin_id
        ORDER BY activityCount DESC
      `, [days]);

      return summary;
    } catch (error) {
      logger.error(`[ACTIVITY] Error retrieving admin activity summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete old activity logs (retention policy)
   */
  static async deleteOldLogs(daysToKeep = 90) {
    try {
      const result = await pool.query(`
        DELETE FROM admin_activity_logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [daysToKeep]);

      logger.info(`[ACTIVITY] Deleted logs older than ${daysToKeep} days`);
      return true;
    } catch (error) {
      logger.error(`[ACTIVITY] Error deleting old activity logs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ActivityLog;

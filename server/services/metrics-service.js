const pool = require('../db/pool');

class MetricsService {
  async getRequestStats(fromDate, toDate) {
    try {
      const query = `
        SELECT
          DATE_TRUNC('hour', created_dt) as hour,
          COUNT(*) as request_count,
          module_name,
          method
        FROM REQUEST_AUDIT
        WHERE created_dt >= $1 AND created_dt <= $2
          AND (is_deleted = false OR is_deleted IS NULL)
        GROUP BY hour, module_name, method
        ORDER BY hour DESC
        LIMIT 500
      `;
      const result = await pool.query(query, [fromDate, toDate]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching request stats:', err.message);
      return [];
    }
  }

  async getErrorStats(fromDate, toDate) {
    try {
      const query = `
        SELECT
          DATE_TRUNC('hour', created_dt) as hour,
          COUNT(*) as error_count,
          module_name,
          request_method
        FROM REQUEST_AUDIT_ERR
        WHERE created_dt >= $1 AND created_dt <= $2
          AND (is_deleted = false OR is_deleted IS NULL)
        GROUP BY hour, module_name, request_method
        ORDER BY hour DESC
        LIMIT 500
      `;
      const result = await pool.query(query, [fromDate, toDate]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching error stats:', err.message);
      return [];
    }
  }

  async getTopEndpoints(limit = 10) {
    try {
      const query = `
        SELECT
          module_name,
          method,
          COUNT(*) as count
        FROM REQUEST_AUDIT
        WHERE created_dt >= NOW() - INTERVAL '24 hours'
          AND (is_deleted = false OR is_deleted IS NULL)
          AND module_name IS NOT NULL
        GROUP BY module_name, method
        ORDER BY count DESC
        LIMIT $1
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching top endpoints:', err.message);
      return [];
    }
  }

  async getHourlyStats(hours = 24) {
    try {
      const query = `
        SELECT
          DATE_TRUNC('hour', created_dt) as hour,
          COUNT(*) as request_count
        FROM REQUEST_AUDIT
        WHERE created_dt >= NOW() - INTERVAL '${hours} hours'
          AND (is_deleted = false OR is_deleted IS NULL)
        GROUP BY hour
        ORDER BY hour ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('Error fetching hourly stats:', err.message);
      return [];
    }
  }

  async getHourlyErrors(hours = 24) {
    try {
      const query = `
        SELECT
          DATE_TRUNC('hour', created_dt) as hour,
          COUNT(*) as error_count
        FROM REQUEST_AUDIT_ERR
        WHERE created_dt >= NOW() - INTERVAL '${hours} hours'
          AND (is_deleted = false OR is_deleted IS NULL)
        GROUP BY hour
        ORDER BY hour ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('Error fetching hourly errors:', err.message);
      return [];
    }
  }

  async getSummary() {
    try {
      const queries = {
        today: `SELECT COUNT(*) FROM REQUEST_AUDIT WHERE created_dt >= CURRENT_DATE AND (is_deleted = false OR is_deleted IS NULL)`,
        todayErrors: `SELECT COUNT(*) FROM REQUEST_AUDIT_ERR WHERE created_dt >= CURRENT_DATE AND (is_deleted = false OR is_deleted IS NULL)`,
        week: `SELECT COUNT(*) FROM REQUEST_AUDIT WHERE created_dt >= NOW() - INTERVAL '7 days' AND (is_deleted = false OR is_deleted IS NULL)`,
        weekErrors: `SELECT COUNT(*) FROM REQUEST_AUDIT_ERR WHERE created_dt >= NOW() - INTERVAL '7 days' AND (is_deleted = false OR is_deleted IS NULL)`
      };

      const results = {};
      for (const [key, sql] of Object.entries(queries)) {
        const res = await pool.query(sql);
        results[key] = parseInt(res.rows[0].count) || 0;
      }

      results.todayErrorRate = results.today > 0
        ? parseFloat(((results.todayErrors / (results.today + results.todayErrors)) * 100).toFixed(2))
        : 0;

      results.weekErrorRate = results.week > 0
        ? parseFloat(((results.weekErrors / (results.week + results.weekErrors)) * 100).toFixed(2))
        : 0;

      return results;
    } catch (err) {
      console.error('Error fetching summary:', err.message);
      return {
        today: 0,
        todayErrors: 0,
        week: 0,
        weekErrors: 0,
        todayErrorRate: 0,
        weekErrorRate: 0
      };
    }
  }

  async testConnection() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      console.error('Database connection test failed:', err.message);
      return false;
    }
  }
}

module.exports = new MetricsService();

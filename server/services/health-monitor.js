const axios = require('axios');
const { Pool } = require('pg');
const { services, Environment, getDatabase } = require('../config/environments');

class HealthMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.status = {};
    this.history = {};
    this.databaseStatus = {};
    this.databaseHistory = {};
    this.onUpdate = null;
    this.timer = null;
  }

  async checkLocalService(serviceName, port) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`http://localhost:${port}/health`, {
        timeout: 3000
      });
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: error.code || error.message
      };
    }
  }

  async checkAwsService(serviceName, awsUrl) {
    if (!awsUrl) {
      return {
        status: 'not_configured',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: 'No AWS URL configured'
      };
    }

    const startTime = Date.now();
    try {
      const response = await axios.get(`${awsUrl}/health`, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      const responseTime = Date.now() - startTime;

      const isHealthy = response.status >= 200 && response.status < 300;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        httpStatus: response.status,
        responseTime,
        lastCheck: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error.response) {
        return {
          status: 'degraded',
          httpStatus: error.response.status,
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `HTTP ${error.response.status}`
        };
      }

      return {
        status: 'unhealthy',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: error.code || error.message
      };
    }
  }

  async checkDatabase(env) {
    const startTime = Date.now();
    let pool = null;

    try {
      const dbConfig = await getDatabase(env);

      if (!dbConfig || !dbConfig.host) {
        return {
          status: 'not_configured',
          responseTime: null,
          lastCheck: new Date().toISOString(),
          error: 'Database not configured'
        };
      }

      pool = new Pool({
        ...dbConfig,
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 1000
      });

      const result = await pool.query('SELECT NOW() as now, current_database() as database, version() as version');
      const responseTime = Date.now() - startTime;

      await pool.end();

      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        host: dbConfig.host,
        database: result.rows[0].database,
        serverTime: result.rows[0].now,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (pool) {
        try { await pool.end(); } catch (e) { /* ignore */ }
      }

      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message || error.code
      };
    }
  }

  async checkAllDatabases() {
    const results = {};

    for (const env of ['dev', 'prod']) {
      results[env] = await this.checkDatabase(env);

      // Track history
      if (!this.databaseHistory[env]) {
        this.databaseHistory[env] = [];
      }

      this.databaseHistory[env].push({
        status: results[env].status,
        timestamp: new Date().toISOString()
      });

      // Keep last 100 entries
      if (this.databaseHistory[env].length > 100) {
        this.databaseHistory[env].shift();
      }
    }

    this.databaseStatus = results;
    return results;
  }

  async checkService(serviceName, serviceConfig) {
    const result = {
      name: serviceName,
      displayName: serviceConfig.displayName,
      dev: {
        local: null,
        aws: null
      },
      prod: {
        aws: null
      }
    };

    // Check DEV local
    if (serviceConfig.dev.localPort) {
      result.dev.local = await this.checkLocalService(serviceName, serviceConfig.dev.localPort);
      result.dev.local.port = serviceConfig.dev.localPort;
    }

    // Check DEV AWS
    result.dev.aws = await this.checkAwsService(serviceName, serviceConfig.dev.awsUrl);
    if (serviceConfig.dev.awsUrl) {
      result.dev.aws.url = serviceConfig.dev.awsUrl;
    }

    // Check PROD AWS
    result.prod.aws = await this.checkAwsService(serviceName, serviceConfig.prod.awsUrl);
    if (serviceConfig.prod.awsUrl) {
      result.prod.aws.url = serviceConfig.prod.awsUrl;
    }

    // Calculate overall status for each environment
    result.dev.status = this.calculateEnvStatus(result.dev);
    result.prod.status = this.calculateEnvStatus(result.prod);

    return result;
  }

  calculateEnvStatus(envResult) {
    const statuses = [];
    if (envResult.local) statuses.push(envResult.local.status);
    if (envResult.aws) statuses.push(envResult.aws.status);

    if (statuses.includes('healthy')) return 'healthy';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.every(s => s === 'not_configured')) return 'not_configured';
    return 'unhealthy';
  }

  async checkAll() {
    const results = {};

    // Check all services
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      results[serviceName] = await this.checkService(serviceName, serviceConfig);

      // Track history
      if (!this.history[serviceName]) {
        this.history[serviceName] = { dev: [], prod: [] };
      }

      this.history[serviceName].dev.push({
        status: results[serviceName].dev.status,
        timestamp: new Date().toISOString()
      });
      this.history[serviceName].prod.push({
        status: results[serviceName].prod.status,
        timestamp: new Date().toISOString()
      });

      // Keep last 100 entries
      if (this.history[serviceName].dev.length > 100) {
        this.history[serviceName].dev.shift();
      }
      if (this.history[serviceName].prod.length > 100) {
        this.history[serviceName].prod.shift();
      }
    }

    this.status = results;

    // Check all databases
    await this.checkAllDatabases();

    if (this.onUpdate) {
      this.onUpdate(this.status);
    }

    return results;
  }

  start() {
    console.log(`Starting health monitor (interval: ${this.interval}ms)`);
    this.checkAll();
    this.timer = setInterval(() => this.checkAll(), this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('Health monitor stopped');
  }

  getUptime(serviceName, env) {
    const hist = this.history[serviceName]?.[env] || [];
    if (hist.length === 0) return 100;
    const healthy = hist.filter(h => h.status === 'healthy' || h.status === 'degraded').length;
    return parseFloat((healthy / hist.length * 100).toFixed(2));
  }

  getDatabaseUptime(env) {
    const hist = this.databaseHistory[env] || [];
    if (hist.length === 0) return 100;
    const healthy = hist.filter(h => h.status === 'healthy').length;
    return parseFloat((healthy / hist.length * 100).toFixed(2));
  }

  getAllStatus() {
    const uptime = {};
    for (const serviceName of Object.keys(this.status)) {
      uptime[serviceName] = {
        dev: this.getUptime(serviceName, 'dev'),
        prod: this.getUptime(serviceName, 'prod')
      };
    }

    const databaseUptime = {
      dev: this.getDatabaseUptime('dev'),
      prod: this.getDatabaseUptime('prod')
    };

    return {
      services: this.status,
      uptime,
      databases: this.databaseStatus,
      databaseUptime
    };
  }

  getDatabaseStatus() {
    return {
      databases: this.databaseStatus,
      uptime: {
        dev: this.getDatabaseUptime('dev'),
        prod: this.getDatabaseUptime('prod')
      }
    };
  }

  /**
   * End-to-end health check - validates service is up AND can query database
   * This ensures the full stack is working correctly
   */
  async checkEndToEnd(env = 'dev') {
    const results = {
      environment: env,
      timestamp: new Date().toISOString(),
      services: {},
      database: null,
      summary: {
        totalServices: 0,
        healthyServices: 0,
        databaseConnected: false,
        allHealthy: false
      }
    };

    // Check all services for this environment
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      const serviceResult = {
        name: serviceName,
        displayName: serviceConfig.displayName,
        status: 'unknown',
        responseTime: null,
        error: null
      };

      results.summary.totalServices++;

      try {
        // Check if service is responding to health endpoint
        if (env === 'dev' && serviceConfig.dev.localPort) {
          const startTime = Date.now();
          const response = await axios.get(`http://localhost:${serviceConfig.dev.localPort}/health`, {
            timeout: 5000
          });
          serviceResult.status = response.status === 200 ? 'healthy' : 'unhealthy';
          serviceResult.responseTime = Date.now() - startTime;
        } else if (env === 'prod' && serviceConfig.prod.awsUrl) {
          const startTime = Date.now();
          const response = await axios.get(`${serviceConfig.prod.awsUrl}/health`, {
            timeout: 10000
          });
          serviceResult.status = response.status === 200 ? 'healthy' : 'unhealthy';
          serviceResult.responseTime = Date.now() - startTime;
        } else {
          serviceResult.status = 'not_configured';
        }

        if (serviceResult.status === 'healthy') {
          results.summary.healthyServices++;
        }

      } catch (error) {
        serviceResult.status = 'unhealthy';
        serviceResult.error = error.code || error.message;
      }

      results.services[serviceName] = serviceResult;
    }

    // Step 3: Direct database query to verify DB connectivity
    try {
      const dbConfig = await getDatabase(env);
      if (dbConfig && dbConfig.host) {
        const pool = new Pool({
          ...dbConfig,
          max: 1,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 1000
        });

        const startTime = Date.now();

        // Run a real query - check if tables exist and count records
        const queries = await pool.query(`
          SELECT
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
            current_database() as database,
            NOW() as server_time
        `);

        const responseTime = Date.now() - startTime;
        await pool.end();

        results.database = {
          status: 'healthy',
          host: dbConfig.host,
          database: queries.rows[0].database,
          tableCount: parseInt(queries.rows[0].table_count),
          serverTime: queries.rows[0].server_time,
          responseTime
        };
        results.summary.databaseConnected = true;
      }
    } catch (dbError) {
      results.database = {
        status: 'unhealthy',
        error: dbError.message
      };
    }

    // Calculate overall health
    results.summary.allHealthy =
      results.summary.healthyServices === results.summary.totalServices &&
      results.summary.databaseConnected;

    return results;
  }

  /**
   * Run e2e check for all environments
   */
  async checkAllEndToEnd() {
    return {
      dev: await this.checkEndToEnd('dev'),
      prod: await this.checkEndToEnd('prod'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check each service's /health/db endpoint
   * This validates that each service can connect to its database
   */
  async checkServiceDbHealth(env = 'dev') {
    const results = {
      environment: env,
      timestamp: new Date().toISOString(),
      services: {},
      summary: {
        totalServices: 0,
        healthyServices: 0,
        allHealthy: false
      }
    };

    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      const serviceResult = {
        name: serviceName,
        displayName: serviceConfig.displayName,
        status: 'unknown',
        responseTime: null,
        database: null,
        error: null,
        url: null
      };

      results.summary.totalServices++;

      try {
        let url = null;
        let timeout = 5000;

        if (env === 'dev' && serviceConfig.dev.awsUrl) {
          url = `${serviceConfig.dev.awsUrl}/health/db`;
        } else if (env === 'dev' && serviceConfig.dev.localPort) {
          url = `http://localhost:${serviceConfig.dev.localPort}/health/db`;
        } else if (env === 'prod' && serviceConfig.prod.awsUrl) {
          url = `${serviceConfig.prod.awsUrl}/health/db`;
          timeout = 10000;
        }

        if (url) {
          serviceResult.url = url;
          const startTime = Date.now();
          const response = await axios.get(url, { timeout });
          serviceResult.responseTime = Date.now() - startTime;

          if (response.status === 200 && response.data.status === 'healthy') {
            serviceResult.status = 'healthy';
            serviceResult.database = response.data.database;
            results.summary.healthyServices++;
          } else {
            serviceResult.status = 'unhealthy';
            serviceResult.error = response.data.error || 'Unknown error';
          }
        } else {
          serviceResult.status = 'not_configured';
        }
      } catch (error) {
        serviceResult.status = 'unhealthy';
        if (error.response) {
          serviceResult.error = error.response.data?.error || `HTTP ${error.response.status}`;
        } else {
          serviceResult.error = error.code || error.message;
        }
      }

      results.services[serviceName] = serviceResult;
    }

    results.summary.allHealthy = results.summary.healthyServices === results.summary.totalServices;
    return results;
  }

  /**
   * Check service DB health for all environments
   */
  async checkAllServiceDbHealth() {
    return {
      dev: await this.checkServiceDbHealth('dev'),
      prod: await this.checkServiceDbHealth('prod'),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = HealthMonitor;

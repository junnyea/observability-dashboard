const axios = require('axios');
const { getEnvironment, Environment } = require('../config/environments');

class HealthMonitor {
  constructor(services, interval = 5000) {
    this.services = services;
    this.interval = interval;
    this.status = {};
    this.history = {};
    this.onUpdate = null;
    this.timer = null;
  }

  updateServices(services) {
    this.services = services;
    // Clear status for services that no longer exist
    const serviceNames = services.map(s => s.name);
    Object.keys(this.status).forEach(name => {
      if (!serviceNames.includes(name)) {
        delete this.status[name];
        delete this.history[name];
      }
    });
  }

  async checkLocalService(service) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`http://localhost:${service.port}/health`, {
        timeout: 3000
      });
      const responseTime = Date.now() - startTime;

      return {
        name: service.name,
        displayName: service.displayName,
        port: service.port,
        type: 'local',
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      return {
        name: service.name,
        displayName: service.displayName,
        port: service.port,
        type: 'local',
        status: 'unhealthy',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: error.code || error.message
      };
    }
  }

  async checkAwsService(service) {
    const startTime = Date.now();
    try {
      // AWS API Gateway health check - try the base URL
      const response = await axios.get(`${service.awsUrl}/health`, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 2xx, 3xx, 4xx as "reachable"
      });
      const responseTime = Date.now() - startTime;

      // Consider 2xx as healthy, others as degraded but reachable
      const isHealthy = response.status >= 200 && response.status < 300;

      return {
        name: service.name,
        displayName: service.displayName,
        awsUrl: service.awsUrl,
        type: 'aws',
        status: isHealthy ? 'healthy' : 'degraded',
        httpStatus: response.status,
        responseTime,
        lastCheck: new Date().toISOString(),
        data: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // If we get a response (even error), the service is reachable
      if (error.response) {
        return {
          name: service.name,
          displayName: service.displayName,
          awsUrl: service.awsUrl,
          type: 'aws',
          status: 'degraded',
          httpStatus: error.response.status,
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `HTTP ${error.response.status}`
        };
      }

      return {
        name: service.name,
        displayName: service.displayName,
        awsUrl: service.awsUrl,
        type: 'aws',
        status: 'unhealthy',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: error.code || error.message
      };
    }
  }

  async checkService(service) {
    const env = getEnvironment();

    // For DEV and HOTFIX, check local services
    // For PROD and STAGING, check AWS endpoints
    const useLocal = (env === Environment.DEV || env === Environment.HOTFIX) && service.port;
    const useAws = service.awsUrl;

    const results = [];

    // Check local if available and in dev/hotfix mode
    if (useLocal) {
      results.push(await this.checkLocalService(service));
    }

    // Check AWS if URL is configured
    if (useAws) {
      results.push(await this.checkAwsService(service));
    }

    // Return combined result
    if (results.length === 0) {
      return {
        name: service.name,
        displayName: service.displayName,
        type: 'unknown',
        status: 'unknown',
        lastCheck: new Date().toISOString(),
        error: 'No health check endpoint configured'
      };
    }

    // If both local and AWS are checked, return both
    if (results.length === 2) {
      return {
        name: service.name,
        displayName: service.displayName,
        local: results[0],
        aws: results[1],
        status: results[0].status === 'healthy' || results[1].status === 'healthy' ? 'healthy' :
                results[0].status === 'degraded' || results[1].status === 'degraded' ? 'degraded' : 'unhealthy',
        lastCheck: new Date().toISOString()
      };
    }

    return results[0];
  }

  async checkAll() {
    const results = await Promise.all(
      this.services.map(s => this.checkService(s))
    );

    results.forEach(result => {
      const prevStatus = this.status[result.name]?.status;
      this.status[result.name] = result;

      // Track history (keep last 100 checks)
      if (!this.history[result.name]) {
        this.history[result.name] = [];
      }

      const historyEntry = {
        status: result.status,
        responseTime: result.responseTime || result.local?.responseTime || result.aws?.responseTime,
        timestamp: result.lastCheck
      };

      this.history[result.name].push(historyEntry);
      if (this.history[result.name].length > 100) {
        this.history[result.name].shift();
      }

      // Log status changes
      if (prevStatus && prevStatus !== result.status) {
        console.log(`[Health] ${result.name}: ${prevStatus} -> ${result.status}`);
      }
    });

    if (this.onUpdate) {
      this.onUpdate(this.status, getEnvironment());
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

  restart() {
    this.stop();
    this.start();
  }

  getUptime(serviceName) {
    const hist = this.history[serviceName] || [];
    if (hist.length === 0) return 100;
    const healthy = hist.filter(h => h.status === 'healthy' || h.status === 'degraded').length;
    return parseFloat((healthy / hist.length * 100).toFixed(2));
  }

  getAverageResponseTime(serviceName) {
    const hist = this.history[serviceName] || [];
    const validTimes = hist.filter(h => h.responseTime !== null).map(h => h.responseTime);
    if (validTimes.length === 0) return null;
    return Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
  }

  getAllStatus() {
    return {
      environment: getEnvironment(),
      services: this.status,
      uptime: Object.fromEntries(
        Object.keys(this.status).map(name => [name, this.getUptime(name)])
      ),
      avgResponseTime: Object.fromEntries(
        Object.keys(this.status).map(name => [name, this.getAverageResponseTime(name)])
      )
    };
  }
}

module.exports = HealthMonitor;

const axios = require('axios');

class HealthMonitor {
  constructor(services, interval = 5000) {
    this.services = services;
    this.interval = interval;
    this.status = {};
    this.history = {};
    this.onUpdate = null;
    this.timer = null;
  }

  async checkService(service) {
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
        status: 'unhealthy',
        responseTime: null,
        lastCheck: new Date().toISOString(),
        error: error.code || error.message
      };
    }
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
      this.history[result.name].push({
        status: result.status,
        responseTime: result.responseTime,
        timestamp: result.lastCheck
      });
      if (this.history[result.name].length > 100) {
        this.history[result.name].shift();
      }

      // Log status changes
      if (prevStatus && prevStatus !== result.status) {
        console.log(`[Health] ${result.name}: ${prevStatus} -> ${result.status}`);
      }
    });

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

  getUptime(serviceName) {
    const hist = this.history[serviceName] || [];
    if (hist.length === 0) return 100;
    const healthy = hist.filter(h => h.status === 'healthy').length;
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

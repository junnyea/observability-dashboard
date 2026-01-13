const { services, getServiceList } = require('./environments');

module.exports = {
  get services() {
    return getServiceList();
  },
  logDir: process.env.LOG_DIR || '/home/ubuntu/bulwark-stack-org/logs',
  healthCheckInterval: 5000,
  dashboardPort: parseInt(process.env.DASHBOARD_PORT) || 5100
};

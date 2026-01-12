const { getEnvironment, getServices, getConfig } = require('./environments');

// Build services array from environment config
const buildServicesArray = (env = null) => {
  const services = getServices(env);
  return services.map(svc => ({
    name: svc.name,
    displayName: svc.displayName,
    port: svc.localPort,
    awsUrl: svc.awsUrl,
    logFile: svc.logFile
  }));
};

module.exports = {
  get services() {
    return buildServicesArray();
  },
  getServicesForEnv: buildServicesArray,
  logDir: process.env.LOG_DIR || '/home/ubuntu/bulwark-stack-org/logs',
  healthCheckInterval: 5000,
  dashboardPort: parseInt(process.env.DASHBOARD_PORT) || 5100
};

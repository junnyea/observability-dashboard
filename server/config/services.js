module.exports = {
  services: [
    { name: 'config-svc', displayName: 'bw-config-svc-dev', port: 5000, logFile: '/home/ubuntu/bulwark-stack-org/logs/config-svc.log' },
    { name: 'tenant-svc', displayName: 'bw-tenant-svc-dev', port: 5001, logFile: '/home/ubuntu/bulwark-stack-org/logs/tenant-svc.log' },
    { name: 'checkin-svc', displayName: 'bw-checkin-svc-dev', port: 5002, logFile: '/home/ubuntu/bulwark-stack-org/logs/checkin-svc.log' }
  ],
  logDir: process.env.LOG_DIR || '/home/ubuntu/bulwark-stack-org/logs',
  healthCheckInterval: 5000,
  dashboardPort: parseInt(process.env.DASHBOARD_PORT) || 5100
};

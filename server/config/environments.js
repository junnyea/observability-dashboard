/**
 * Environment configuration for observability dashboard
 * Supports DEV and PROD environments
 */

const Environment = {
  DEV: 'DEV',
  PROD: 'PROD'
};

// Shared database configuration (same DB for both environments)
const sharedDatabase = {
  host: process.env.DB_HOST || '192.168.50.90',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || 'bulwark',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

const config = {
  [Environment.DEV]: {
    name: 'Development',
    services: {
      configSvc: {
        name: 'config-svc',
        displayName: 'bw-config-svc-dev',
        localPort: 5000,
        awsUrl: 'https://in63hk71k9.execute-api.ap-southeast-1.amazonaws.com/dev',
        logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/config-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/config-svc.log'
      },
      tenantSvc: {
        name: 'tenant-svc',
        displayName: 'bw-tenant-svc-dev',
        localPort: 5001,
        awsUrl: 'https://fx9cxmlzh5.execute-api.ap-southeast-1.amazonaws.com/dev',
        logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/tenant-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/tenant-svc.log'
      },
      checkinSvc: {
        name: 'checkin-svc',
        displayName: 'bw-checkin-svc-dev',
        localPort: 5002,
        awsUrl: 'https://nufhcf6hcb.execute-api.ap-southeast-1.amazonaws.com/dev',
        logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/checkin-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/checkin-svc.log'
      },
      adminSvc: {
        name: 'admin-svc',
        displayName: 'bw-admin-svc-dev',
        localPort: 5004,
        awsUrl: null, // No AWS deployment yet
        logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/admin-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/admin-svc.log'
      }
    },
    database: sharedDatabase
  },
  [Environment.PROD]: {
    name: 'Production',
    services: {
      configSvc: {
        name: 'config-svc',
        displayName: 'bw-config-svc-prod',
        localPort: null,
        awsUrl: 'https://sfz7692ls3.execute-api.ap-southeast-1.amazonaws.com/prod',
        logFile: null
      },
      tenantSvc: {
        name: 'tenant-svc',
        displayName: 'bw-tenant-svc-prod',
        localPort: null,
        awsUrl: 'https://r9kzo1cvm4.execute-api.ap-southeast-1.amazonaws.com/prod',
        logFile: null
      },
      checkinSvc: {
        name: 'checkin-svc',
        displayName: 'bw-checkin-svc-prod',
        localPort: null,
        awsUrl: 'https://f2agg624gl.execute-api.ap-southeast-1.amazonaws.com/prod',
        logFile: null
      },
      adminSvc: {
        name: 'admin-svc',
        displayName: 'bw-admin-svc-prod',
        localPort: null,
        awsUrl: null, // No AWS deployment yet
        logFile: null
      }
    },
    database: sharedDatabase
  }
};

// Current environment state
let currentEnvironment = process.env.NODE_ENV || Environment.DEV;

const getEnvironment = () => currentEnvironment;

const setEnvironment = (env) => {
  if (!Environment[env]) {
    throw new Error(`Invalid environment: ${env}. Valid options: ${Object.keys(Environment).join(', ')}`);
  }
  currentEnvironment = env;
  console.log(`Environment switched to: ${env}`);
  return currentEnvironment;
};

const getConfig = (env = null) => {
  const targetEnv = env || currentEnvironment;
  return config[targetEnv] || config[Environment.DEV];
};

const getServices = (env = null) => {
  const cfg = getConfig(env);
  return Object.values(cfg.services);
};

const getDatabase = (env = null) => {
  const cfg = getConfig(env);
  return cfg.database;
};

const getAllEnvironments = () => {
  return Object.keys(Environment).map(key => ({
    key,
    name: config[key].name,
    isCurrent: key === currentEnvironment
  }));
};

module.exports = {
  Environment,
  getEnvironment,
  setEnvironment,
  getConfig,
  getServices,
  getDatabase,
  getAllEnvironments
};

/**
 * Environment configuration for observability dashboard
 * DEV: Local services only
 * PROD: AWS services only
 *
 * Database credentials are loaded from app_credentials table
 */

const credentialsLoader = require('../services/credentials-loader');

const Environment = {
  DEV: 'DEV',
  PROD: 'PROD'
};

// Cache for database configs
const dbConfigCache = {};

/**
 * Get database config - loads from app_credentials table
 * @param {string} env - Environment (dev, prod)
 * @returns {Promise<object>} Database configuration
 */
const getDatabase = async (env = 'dev') => {
  const targetEnv = env.toLowerCase();

  // Check cache first
  if (dbConfigCache[targetEnv]) {
    return dbConfigCache[targetEnv];
  }

  // Try to load from database
  const dbCreds = await credentialsLoader.getDatabaseCredentials(targetEnv);
  if (dbCreds) {
    dbConfigCache[targetEnv] = {
      host: dbCreds.host,
      port: dbCreds.port || 5432,
      database: dbCreds.database,
      user: dbCreds.user,
      password: dbCreds.password
    };
    return dbConfigCache[targetEnv];
  }

  // Fall back to environment variables
  if (targetEnv === 'prod') {
    return {
      host: process.env.PROD_DB_HOST,
      port: parseInt(process.env.PROD_DB_PORT) || 5432,
      database: process.env.PROD_DB_DATABASE || 'bulwark',
      user: process.env.PROD_DB_USER || 'postgres',
      password: process.env.PROD_DB_PASSWORD
    };
  }

  // Default to dev from env vars
  return {
    host: process.env.DEV_DB_HOST || '192.168.50.90',
    port: parseInt(process.env.DEV_DB_PORT) || 5432,
    database: process.env.DEV_DB_DATABASE || 'bulwark',
    user: process.env.DEV_DB_USER || 'postgres',
    password: process.env.DEV_DB_PASSWORD || 'postgres'
  };
};

/**
 * Get database config synchronously (uses cached values or env vars)
 * Use this when async is not possible
 */
const getDatabaseSync = (env = 'dev') => {
  const targetEnv = env.toLowerCase();

  // Return cached if available
  if (dbConfigCache[targetEnv]) {
    return dbConfigCache[targetEnv];
  }

  // Fall back to environment variables
  if (targetEnv === 'prod') {
    return {
      host: process.env.PROD_DB_HOST,
      port: parseInt(process.env.PROD_DB_PORT) || 5432,
      database: process.env.PROD_DB_DATABASE || 'bulwark',
      user: process.env.PROD_DB_USER || 'postgres',
      password: process.env.PROD_DB_PASSWORD
    };
  }

  return {
    host: process.env.DEV_DB_HOST || '192.168.50.90',
    port: parseInt(process.env.DEV_DB_PORT) || 5432,
    database: process.env.DEV_DB_DATABASE || 'bulwark',
    user: process.env.DEV_DB_USER || 'postgres',
    password: process.env.DEV_DB_PASSWORD || 'postgres'
  };
};

// Service definitions with DEV (LOCAL DEV) and PROD (AWS PROD) environments
const services = {
  'config-svc': {
    name: 'config-svc',
    displayName: 'Config Service',
    dev: {
      localPort: null,
      awsUrl: 'https://bw-config-svc-dev.qntailab.com',
      logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/config-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/config-svc.log'
    },
    prod: {
      localPort: null,
      awsUrl: 'https://4ta9opnwt9.execute-api.ap-southeast-1.amazonaws.com/prod',
      logFile: null
    }
  },
  'tenant-svc': {
    name: 'tenant-svc',
    displayName: 'Tenant Service',
    dev: {
      localPort: null,
      awsUrl: 'https://bw-tenant-svc-dev.qntailab.com',
      logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/tenant-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/tenant-svc.log'
    },
    prod: {
      localPort: null,
      awsUrl: 'https://9g2g5ho2xc.execute-api.ap-southeast-1.amazonaws.com/prod',
      logFile: null
    }
  },
  'checkin-svc': {
    name: 'checkin-svc',
    displayName: 'Checkin Service',
    dev: {
      localPort: null,
      awsUrl: 'https://bw-checkin-svc-dev.qntailab.com',
      logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/checkin-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/checkin-svc.log'
    },
    prod: {
      localPort: null,
      awsUrl: 'https://dgv8508o0f.execute-api.ap-southeast-1.amazonaws.com/prod',
      logFile: null
    }
  },
  'admin-svc': {
    name: 'admin-svc',
    displayName: 'Admin Service',
    dev: {
      localPort: null,
      awsUrl: 'https://bw-admin-svc-dev.qntailab.com',
      logFile: process.env.LOG_DIR ? `${process.env.LOG_DIR}/admin-svc.log` : '/home/ubuntu/bulwark-stack-org/logs/admin-svc.log'
    },
    prod: {
      localPort: null,
      awsUrl: 'https://na0wmpn07l.execute-api.ap-southeast-1.amazonaws.com/prod',
      logFile: null
    }
  }
};

const getServices = () => services;

const getServiceList = () => Object.values(services);

const getEnvironments = () => Object.keys(Environment);

module.exports = {
  Environment,
  services,
  getServices,
  getServiceList,
  getDatabase,
  getDatabaseSync,
  getEnvironments
};

const { Pool } = require('pg');

// Bootstrap database config (used to connect and fetch other credentials)
const BOOTSTRAP_DB = {
  host: process.env.BOOTSTRAP_DB_HOST || '192.168.50.90',
  port: parseInt(process.env.BOOTSTRAP_DB_PORT) || 5432,
  database: process.env.BOOTSTRAP_DB_NAME || 'bulwark',
  user: process.env.BOOTSTRAP_DB_USER || 'postgres',
  password: process.env.BOOTSTRAP_DB_PASSWORD || 'postgres'
};

// Credentials cache
const cache = {
  data: {},
  timestamp: 0,
  TTL: 60000 // 1 minute
};

let pool = null;

/**
 * Get database pool for credentials queries
 */
const getPool = () => {
  if (!pool) {
    pool = new Pool({
      ...BOOTSTRAP_DB,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('[CredentialsLoader] Pool error:', err.message);
    });
  }
  return pool;
};

/**
 * Get credentials from database by env and module
 * @param {string} env - Environment (DEV, PROD, GLOBAL)
 * @param {string} module - Module name (observability-dashboard, database, aws)
 * @returns {object|null} - JSON attributes or null if not found
 */
const getCredentials = async (env, module) => {
  const cacheKey = `${env}:${module}`;
  const now = Date.now();

  // Check cache
  if (cache.data[cacheKey] && (now - cache.timestamp) < cache.TTL) {
    return cache.data[cacheKey];
  }

  try {
    const dbPool = getPool();
    const result = await dbPool.query(
      'SELECT attributes FROM app_credentials WHERE env = $1 AND module = $2',
      [env.toUpperCase(), module]
    );

    if (result.rows.length > 0) {
      cache.data[cacheKey] = result.rows[0].attributes;
      cache.timestamp = now;
      return result.rows[0].attributes;
    }

    return null;
  } catch (error) {
    console.error(`[CredentialsLoader] Error fetching ${env}:${module}:`, error.message);
    // Return cached value if available
    return cache.data[cacheKey] || null;
  }
};

/**
 * Get dashboard auth credentials (from GLOBAL env)
 */
const getDashboardCredentials = async () => {
  const creds = await getCredentials('GLOBAL', 'observability-dashboard');
  return creds?.auth || null;
};

/**
 * Get admin user credentials
 */
const getAdminUser = async () => {
  const auth = await getDashboardCredentials();
  return auth?.admin || null;
};

/**
 * Get auth token
 */
const getAuthToken = async () => {
  const auth = await getDashboardCredentials();
  return auth?.token || null;
};

/**
 * Get database credentials for environment
 */
const getDatabaseCredentials = async (env = 'dev') => {
  return await getCredentials(env.toUpperCase(), 'database');
};

/**
 * Get AWS credentials for environment
 */
const getAwsCredentials = async (env = 'dev') => {
  return await getCredentials(env.toUpperCase(), 'aws');
};

/**
 * Get all credentials for a module across all environments
 */
const getAllCredentialsForModule = async (module) => {
  try {
    const dbPool = getPool();
    const result = await dbPool.query(
      'SELECT env, attributes FROM app_credentials WHERE module = $1',
      [module]
    );

    const creds = {};
    result.rows.forEach(row => {
      creds[row.env.toLowerCase()] = row.attributes;
    });
    return creds;
  } catch (error) {
    console.error(`[CredentialsLoader] Error fetching module ${module}:`, error.message);
    return {};
  }
};

/**
 * Clear the credentials cache
 */
const clearCache = () => {
  cache.data = {};
  cache.timestamp = 0;
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const dbPool = getPool();
    const result = await dbPool.query('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('[CredentialsLoader] Connection test failed:', error.message);
    return false;
  }
};

/**
 * Close the pool
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = {
  getCredentials,
  getDashboardCredentials,
  getAdminUser,
  getAuthToken,
  getDatabaseCredentials,
  getAwsCredentials,
  getAllCredentialsForModule,
  clearCache,
  testConnection,
  closePool
};

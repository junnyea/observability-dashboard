const { Pool } = require('pg');
const { getDatabase, getDatabaseSync, Environment } = require('../config/environments');

// Pool instances for each environment
const pools = {};

const createPool = (dbConfig) => {
  if (!dbConfig || !dbConfig.host || !dbConfig.database) {
    return null;
  }

  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port || 5432,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  return pool;
};

/**
 * Get pool for environment (async - loads credentials from DB)
 */
const getPool = async (env = 'dev') => {
  const targetEnv = env.toLowerCase();

  if (!pools[targetEnv]) {
    const dbConfig = await getDatabase(targetEnv);
    pools[targetEnv] = createPool(dbConfig);
  }

  return pools[targetEnv];
};

/**
 * Get pool synchronously (uses cached or env var credentials)
 */
const getPoolSync = (env = 'dev') => {
  const targetEnv = env.toLowerCase();

  if (!pools[targetEnv]) {
    const dbConfig = getDatabaseSync(targetEnv);
    pools[targetEnv] = createPool(dbConfig);
  }

  return pools[targetEnv];
};

const testConnection = async (env = 'dev') => {
  const targetEnv = env.toLowerCase();
  const pool = await getPool(targetEnv);

  if (!pool) {
    return {
      environment: targetEnv,
      connected: false,
      error: 'Database not configured for this environment'
    };
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as database');
    client.release();

    return {
      environment: targetEnv,
      connected: true,
      database: result.rows[0].database,
      serverTime: result.rows[0].now
    };
  } catch (error) {
    return {
      environment: targetEnv,
      connected: false,
      error: error.message
    };
  }
};

const getAllConnectionStatus = async () => {
  const results = {};

  for (const env of Object.values(Environment)) {
    results[env.toLowerCase()] = await testConnection(env);
  }

  return results;
};

const query = async (text, params, env = 'dev') => {
  const pool = await getPool(env);
  if (!pool) {
    throw new Error(`Database not configured for environment: ${env}`);
  }
  return pool.query(text, params);
};

const closeAll = async () => {
  for (const [env, pool] of Object.entries(pools)) {
    if (pool) {
      await pool.end();
      console.log(`Closed database pool for ${env}`);
    }
  }
};

module.exports = {
  getPool,
  getPoolSync,
  testConnection,
  getAllConnectionStatus,
  query,
  closeAll,
  // Legacy default pool support
  get pool() {
    return getPoolSync();
  }
};

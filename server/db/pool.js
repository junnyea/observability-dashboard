const { Pool } = require('pg');
const { getDatabase, getEnvironment, Environment } = require('../config/environments');

// Pool instances for each environment
const pools = {};

const createPool = (dbConfig) => {
  if (!dbConfig.host || !dbConfig.database) {
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

const getPool = (env = null) => {
  const targetEnv = env || getEnvironment();

  if (!pools[targetEnv]) {
    const dbConfig = getDatabase(targetEnv);
    pools[targetEnv] = createPool(dbConfig);
  }

  return pools[targetEnv];
};

const testConnection = async (env = null) => {
  const targetEnv = env || getEnvironment();
  const pool = getPool(targetEnv);

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
    results[env] = await testConnection(env);
  }

  return results;
};

const query = async (text, params, env = null) => {
  const pool = getPool(env);
  if (!pool) {
    throw new Error(`Database not configured for environment: ${env || getEnvironment()}`);
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
  testConnection,
  getAllConnectionStatus,
  query,
  closeAll,
  // Legacy default pool support
  get pool() {
    return getPool();
  }
};

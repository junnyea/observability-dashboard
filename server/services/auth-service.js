const bcrypt = require('bcrypt');
const credentialsLoader = require('./credentials-loader');

const SALT_ROUNDS = 10;

/**
 * Get the auth token from database
 */
const getAuthToken = async () => {
  const token = await credentialsLoader.getAuthToken();
  if (!token) {
    console.error('[AuthService] No auth token found in database');
  }
  return token;
};

/**
 * Validate a user's credentials against the database
 */
const validateUser = async (username, password) => {
  try {
    const adminUser = await credentialsLoader.getAdminUser();

    if (!adminUser) {
      console.error('[AuthService] No admin user found in database');
      return { valid: false, reason: 'Configuration error' };
    }

    // Check username
    if (username !== adminUser.username) {
      return { valid: false, reason: 'User not found' };
    }

    // Check password (direct comparison since stored in plain text in DB)
    if (password !== adminUser.password) {
      return { valid: false, reason: 'Invalid password' };
    }

    return {
      valid: true,
      user: {
        username: adminUser.username,
        displayName: adminUser.displayName || adminUser.username,
        role: adminUser.role || 'admin'
      }
    };
  } catch (error) {
    console.error('[AuthService] Error validating user:', error.message);
    return { valid: false, reason: 'Authentication error' };
  }
};

/**
 * Verify if a token is valid
 */
const verifyToken = async (token) => {
  const authToken = await getAuthToken();
  return token === authToken;
};

/**
 * Hash a password for storage
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Initialize auth service (verify database connection and credentials)
 */
const initialize = async () => {
  try {
    // Test database connection
    const connected = await credentialsLoader.testConnection();
    if (!connected) {
      console.error('[AuthService] ERROR: Could not connect to credentials database');
      return false;
    }

    const admin = await credentialsLoader.getAdminUser();
    const token = await credentialsLoader.getAuthToken();

    if (!admin) {
      console.error('[AuthService] ERROR: No admin user defined in app_credentials table');
      return false;
    }

    if (!token) {
      console.error('[AuthService] ERROR: No auth token defined in app_credentials table');
      return false;
    }

    console.log('[AuthService] Credentials loaded from database');
    console.log(`[AuthService] Admin user: ${admin.username}`);
    return true;
  } catch (error) {
    console.error('[AuthService] Initialization error:', error.message);
    return false;
  }
};

module.exports = {
  getAuthToken,
  validateUser,
  verifyToken,
  hashPassword,
  initialize
};

-- Create users table for dashboard authentication
CREATE TABLE IF NOT EXISTS observability_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Default admin user is created by the auth-service on first startup
-- using bcrypt hashing. The password comes from DEFAULT_ADMIN_PASSWORD env var.

-- Note: Auth token is created by the auth-service on first startup
-- using DEFAULT_AUTH_TOKEN env var. No hardcoded tokens in migrations.

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON observability_users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON observability_users(is_active);

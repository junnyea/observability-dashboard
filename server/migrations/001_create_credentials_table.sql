-- Create credentials table for storing environment configuration
CREATE TABLE IF NOT EXISTS observability_credentials (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL,
    credential_type VARCHAR(50) NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(environment, credential_type, key_name)
);

-- Create services table for storing service endpoints
CREATE TABLE IF NOT EXISTS observability_services (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    local_port INTEGER,
    aws_url TEXT,
    log_file TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_name, environment)
);

-- Create database_configs table for storing database connections
CREATE TABLE IF NOT EXISTS observability_database_configs (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 5432,
    database_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert AWS credentials for DEV (UPDATE THESE VALUES!)
INSERT INTO observability_credentials (environment, credential_type, key_name, key_value, description)
VALUES
    ('DEV', 'AWS', 'access_key', 'CHANGE_ME_DEV_ACCESS_KEY', 'AWS Access Key for DEV environment'),
    ('DEV', 'AWS', 'secret_key', 'CHANGE_ME_DEV_SECRET_KEY', 'AWS Secret Key for DEV environment')
ON CONFLICT (environment, credential_type, key_name) DO NOTHING;

-- Insert AWS credentials for PROD (UPDATE THESE VALUES!)
INSERT INTO observability_credentials (environment, credential_type, key_name, key_value, description)
VALUES
    ('PROD', 'AWS', 'access_key', 'CHANGE_ME_PROD_ACCESS_KEY', 'AWS Access Key for PROD environment'),
    ('PROD', 'AWS', 'secret_key', 'CHANGE_ME_PROD_SECRET_KEY', 'AWS Secret Key for PROD environment'),
    ('PROD', 'AWS', 'account_id', 'CHANGE_ME_AWS_ACCOUNT_ID', 'AWS Account ID for PROD environment'),
    ('PROD', 'AWS', 'email', 'CHANGE_ME_AWS_EMAIL', 'AWS Account Email for PROD environment')
ON CONFLICT (environment, credential_type, key_name) DO NOTHING;

-- Insert DEV services
INSERT INTO observability_services (service_name, display_name, environment, local_port, aws_url, log_file)
VALUES
    ('config-svc', 'Config Service', 'DEV', 5000, NULL, '/home/ubuntu/bulwark-stack-org/logs/config-svc.log'),
    ('tenant-svc', 'Tenant Service', 'DEV', 5001, NULL, '/home/ubuntu/bulwark-stack-org/logs/tenant-svc.log'),
    ('checkin-svc', 'Checkin Service', 'DEV', 5002, NULL, '/home/ubuntu/bulwark-stack-org/logs/checkin-svc.log'),
    ('admin-svc', 'Admin Service', 'DEV', 5003, NULL, '/home/ubuntu/bulwark-stack-org/logs/admin-svc.log')
ON CONFLICT (service_name, environment) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    local_port = EXCLUDED.local_port,
    aws_url = EXCLUDED.aws_url,
    log_file = EXCLUDED.log_file,
    updated_at = CURRENT_TIMESTAMP;

-- Insert PROD services (AWS only)
INSERT INTO observability_services (service_name, display_name, environment, local_port, aws_url, log_file)
VALUES
    ('config-svc', 'Config Service', 'PROD', NULL, 'https://4ta9opnwt9.execute-api.ap-southeast-1.amazonaws.com/prod', NULL),
    ('tenant-svc', 'Tenant Service', 'PROD', NULL, 'https://9g2g5ho2xc.execute-api.ap-southeast-1.amazonaws.com/prod', NULL),
    ('checkin-svc', 'Checkin Service', 'PROD', NULL, 'https://8etkilldgi.execute-api.ap-southeast-1.amazonaws.com/prod', NULL),
    ('admin-svc', 'Admin Service', 'PROD', NULL, 'https://wrr00ncfhf.execute-api.ap-southeast-1.amazonaws.com/prod', NULL)
ON CONFLICT (service_name, environment) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    local_port = EXCLUDED.local_port,
    aws_url = EXCLUDED.aws_url,
    log_file = EXCLUDED.log_file,
    updated_at = CURRENT_TIMESTAMP;

-- Insert database configs (UPDATE THESE VALUES!)
INSERT INTO observability_database_configs (environment, host, port, database_name, username, password)
VALUES
    ('DEV', 'CHANGE_ME_DEV_DB_HOST', 5432, 'bulwark', 'postgres', 'CHANGE_ME_DEV_DB_PASSWORD'),
    ('PROD', 'CHANGE_ME_PROD_DB_HOST', 5432, 'bulwark', 'postgres', 'CHANGE_ME_PROD_DB_PASSWORD')
ON CONFLICT (environment) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credentials_env ON observability_credentials(environment);
CREATE INDEX IF NOT EXISTS idx_services_env ON observability_services(environment);

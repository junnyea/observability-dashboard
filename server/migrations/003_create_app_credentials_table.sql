-- Create app_credentials table for storing credentials with JSON attributes
-- Structure: env (environment), module (service/app name), attributes (JSON)

CREATE TABLE IF NOT EXISTS app_credentials (
    id SERIAL PRIMARY KEY,
    env VARCHAR(20) NOT NULL,              -- DEV, PROD, STAGING, HOTFIX
    module VARCHAR(50) NOT NULL,           -- observability-dashboard, config-svc, tenant-svc, etc.
    attributes JSONB NOT NULL,             -- Flexible JSON attributes
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(env, module)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_credentials_env ON app_credentials(env);
CREATE INDEX IF NOT EXISTS idx_app_credentials_module ON app_credentials(module);
CREATE INDEX IF NOT EXISTS idx_app_credentials_env_module ON app_credentials(env, module);

-- Insert observability-dashboard credentials for GLOBAL (applies to all envs)
-- UPDATE THESE VALUES BEFORE RUNNING!
INSERT INTO app_credentials (env, module, attributes, description)
VALUES (
    'GLOBAL',
    'observability-dashboard',
    '{
        "auth": {
            "admin": {
                "username": "admin",
                "password": "CHANGE_ME_ADMIN_PASSWORD",
                "displayName": "Administrator",
                "role": "admin"
            },
            "token": "CHANGE_ME_API_TOKEN"
        }
    }'::jsonb,
    'Observability Dashboard authentication credentials'
)
ON CONFLICT (env, module) DO NOTHING;

-- Insert DEV database credentials
-- UPDATE THESE VALUES BEFORE RUNNING!
INSERT INTO app_credentials (env, module, attributes, description)
VALUES (
    'DEV',
    'database',
    '{
        "host": "CHANGE_ME_DEV_DB_HOST",
        "port": 5432,
        "database": "bulwark",
        "user": "postgres",
        "password": "CHANGE_ME_DEV_DB_PASSWORD"
    }'::jsonb,
    'DEV environment database credentials'
)
ON CONFLICT (env, module) DO NOTHING;

-- Insert PROD database credentials
-- UPDATE THESE VALUES BEFORE RUNNING!
INSERT INTO app_credentials (env, module, attributes, description)
VALUES (
    'PROD',
    'database',
    '{
        "host": "CHANGE_ME_PROD_DB_HOST",
        "port": 5432,
        "database": "bulwark",
        "user": "postgres",
        "password": "CHANGE_ME_PROD_DB_PASSWORD"
    }'::jsonb,
    'PROD environment database credentials'
)
ON CONFLICT (env, module) DO NOTHING;

-- Insert DEV AWS credentials
-- UPDATE THESE VALUES BEFORE RUNNING!
INSERT INTO app_credentials (env, module, attributes, description)
VALUES (
    'DEV',
    'aws',
    '{
        "accessKey": "CHANGE_ME_DEV_AWS_ACCESS_KEY",
        "secretKey": "CHANGE_ME_DEV_AWS_SECRET_KEY",
        "region": "ap-southeast-1"
    }'::jsonb,
    'DEV environment AWS credentials'
)
ON CONFLICT (env, module) DO NOTHING;

-- Insert PROD AWS credentials
-- UPDATE THESE VALUES BEFORE RUNNING!
INSERT INTO app_credentials (env, module, attributes, description)
VALUES (
    'PROD',
    'aws',
    '{
        "accessKey": "CHANGE_ME_PROD_AWS_ACCESS_KEY",
        "secretKey": "CHANGE_ME_PROD_AWS_SECRET_KEY",
        "region": "ap-southeast-1",
        "accountId": "CHANGE_ME_AWS_ACCOUNT_ID"
    }'::jsonb,
    'PROD environment AWS credentials'
)
ON CONFLICT (env, module) DO NOTHING;
